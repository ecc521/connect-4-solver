#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <chrono>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cmath>

#ifndef BOARD_WIDTH_MACRO
#define BOARD_WIDTH_MACRO 7
#endif

#ifndef BOARD_HEIGHT_MACRO
#define BOARD_HEIGHT_MACRO 6
#endif

#include "../../native/Solver.hpp"
#include "../../native/HeuristicSolver.hpp"
#include "../../native/TranspositionTable.hpp"

using namespace GameSolver::Connect4;

static int g_parity_failures = 0;

struct BenchPos {
    std::string pos;
    int expected_score;
};

std::vector<BenchPos> load_positions(const std::string& path) {
    std::ifstream file(path);
    std::vector<BenchPos> positions;
    std::string line;
    while (std::getline(file, line)) {
        if (line.empty() || line[0] == '\r') continue;
        std::stringstream ss(line);
        std::string pos;
        int score = 0;
        ss >> pos >> score;
        if (pos.empty()) continue;
        // Handle empty-board line: " 1" parses as pos="1" score=0
        // If pos is purely numeric and no score was read, it's actually the score
        bool pos_is_number = !pos.empty() && std::all_of(pos.begin(), pos.end(), ::isdigit);
        if (pos_is_number && score == 0) {
            // Check if the original line starts with whitespace (empty position)
            size_t first_nonspace = line.find_first_not_of(" \t");
            if (first_nonspace > 0) {
                score = std::stoi(pos);
                pos = "";
            }
        }
        positions.push_back({pos, score});
    }
    return positions;
}

// Validate that a position string is playable (no column overflows)
template<int W, int H>
bool is_valid_position(const std::string& pos) {
    GenericPosition<W, H> p;
    return p.play(pos) == pos.size();
}

size_t get_cache_size() {
    size_t mem_size = 32ULL * 1024ULL * 1024ULL;
    if (const char* env_p = std::getenv("CACHE_MB")) {
        mem_size = std::stoull(env_p) * 1024ULL * 1024ULL;
    }
    return mem_size;
}

// --- Heuristic analyze benchmark ---
template<int W, int H>
void run_heuristic_analyze(const std::vector<BenchPos>& positions, int threads) {
    size_t mem_size = get_cache_size();
    auto cache = HeuristicSolver<W, H>::createCache(mem_size);
    auto solver = HeuristicSolver<W, H>::createWithCache(cache.get());

    uint64_t total_depth = 0;
    int sign_accurate_count = 0;

    auto start_time = std::chrono::high_resolution_clock::now();

    for (const auto& bp : positions) {
        GenericPosition<W, H> p;
        p.play(bp.pos);
        auto now = std::chrono::time_point_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()).time_since_epoch().count();
        auto res = solver->analyze_heuristic(p, 42, threads, now + 20);
        int score = res.first.empty() ? 0 : res.first[0];
        total_depth += res.second;
        if ((score > 0 && bp.expected_score > 0) || 
            (score < 0 && bp.expected_score < 0) || 
            (score == 0 && bp.expected_score == 0)) {
            sign_accurate_count++;
        }
    }
    
    uint64_t total_nodes = solver->getNodeCount();
    auto end_time = std::chrono::high_resolution_clock::now();
    double total_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();
    double mns = (total_nodes / 1000000.0) / (total_ms / 1000.0);

    if (threads == 1) {
        std::cout << "\n| Mode      | Type      | Board | Cache  | Slot    | Thr | Pos  | Nodes      | MN/s  | Time    | Avg Depth | Sign Acc |\n";
        std::cout << "|-----------|-----------|-------|--------|---------|-----|------|------------|-------|---------|-----------|----------|\n";
    }

    std::string board_str = std::to_string(W) + "x" + std::to_string(H);
    std::cout << "| " << std::left << std::setw(9) << "analyze()"
              << " | " << std::setw(9) << "Heuristic"
              << " | " << std::setw(5) << board_str
              << " | " << std::setw(6) << std::to_string(mem_size / (1024 * 1024)) + " MB"
              << " | " << std::setw(7) << std::to_string(cache->getSlotWidth()) + "-bit"
              << " | " << std::setw(3) << threads
              << " | " << std::setw(4) << positions.size()
              << " | " << std::setw(10) << total_nodes
              << " | " << std::fixed << std::setprecision(2) << std::setw(5) << mns
              << " | " << std::setw(7) << std::to_string((int)total_ms) + " ms"
              << " | " << std::setw(9) << std::to_string((int)((double)total_depth / positions.size())) + " plies"
              << " | " << sign_accurate_count << "/" << positions.size()
              << " (" << (int)((double)sign_accurate_count / positions.size() * 100.0) << "%) |\n";
}

// --- Exact analyze benchmark (root-splitting) ---
template<int W, int H>
void run_exact_analyze(const std::vector<BenchPos>& positions, int threads) {
    size_t mem_size = get_cache_size();
    auto cache = Solver::createCache(mem_size);
    auto solver = Solver::createWithCache(cache.get());

    int correct = 0;

    auto start_time = std::chrono::high_resolution_clock::now();

    for (const auto& bp : positions) {
        GenericPosition<W, H> p;
        p.play(bp.pos);
        auto res = solver->analyze(p, false, threads, nullptr);
        // Test data has solve() score = best achievable score = max of column scores
        int best_score = -1000;
        for (int s : res) {
            if (s > best_score) best_score = s;
        }
        if (best_score == bp.expected_score) {
            correct++;
        } else {
            g_parity_failures++;
            std::cerr << "PARITY FAIL [analyze " << threads << "T]: pos=\"" << bp.pos 
                      << "\" expected=" << bp.expected_score << " got=" << best_score << "\n";
        }
    }

    uint64_t total_nodes = solver->getNodeCount();
    auto end_time = std::chrono::high_resolution_clock::now();
    double total_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();
    double mns = (total_nodes / 1000000.0) / (total_ms / 1000.0);

    if (threads == 1) {
        std::cout << "\n| Mode      | Type      | Board | Cache  | Slot    | Thr | Pos  | Nodes      | MN/s  | Time    | Parity |\n";
        std::cout << "|-----------|-----------|-------|--------|---------|-----|------|------------|-------|---------|--------|\n";
    }

    std::string board_str = std::to_string(W) + "x" + std::to_string(H);
    std::cout << "| " << std::left << std::setw(9) << "analyze()"
              << " | " << std::setw(9) << "Exact"
              << " | " << std::setw(5) << board_str
              << " | " << std::setw(6) << std::to_string(mem_size / (1024 * 1024)) + " MB"
              << " | " << std::setw(7) << std::to_string(cache->getSlotWidth()) + "-bit"
              << " | " << std::setw(3) << threads
              << " | " << std::setw(4) << positions.size()
              << " | " << std::setw(10) << total_nodes
              << " | " << std::fixed << std::setprecision(2) << std::setw(5) << mns
              << " | " << std::setw(7) << std::to_string((int)total_ms) + " ms"
              << " | " << correct << "/" << positions.size()
              << (correct == (int)positions.size() ? " ✓" : " FAIL") << " |\n";
}

// --- Exact solve benchmark (Lazy SMP) ---
// Each thread config gets a FRESH solver+cache to avoid TT warming artifacts
template<int W, int H>
void run_solve(const std::vector<BenchPos>& positions, int threads, bool weak) {
    size_t mem_size = get_cache_size();
    auto cache = Solver::createCache(mem_size);
    auto solver = Solver::createWithCache(cache.get());

    int correct = 0;

    auto start_time = std::chrono::high_resolution_clock::now();

    for (const auto& bp : positions) {
        GenericPosition<W, H> p;
        p.play(bp.pos);
        auto res = solver->solve(p, weak, threads, nullptr);
        
        int expected = weak ? (bp.expected_score > 0 ? 1 : (bp.expected_score < 0 ? -1 : 0)) : bp.expected_score;
        int actual = weak ? (res.score > 0 ? 1 : (res.score < 0 ? -1 : 0)) : res.score;
        
        if (actual == expected) {
            correct++;
        } else {
            g_parity_failures++;
            std::cerr << "PARITY FAIL [solve" << (weak ? " weak" : "") << " " << threads << "T]: pos=\"" << bp.pos 
                      << "\" expected=" << expected << " got=" << actual << "\n";
        }
    }

    uint64_t total_nodes = solver->getNodeCount();
    auto end_time = std::chrono::high_resolution_clock::now();
    double total_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();
    double mns = (total_nodes / 1000000.0) / (total_ms / 1000.0);

    static bool solve_header_printed = false;
    if (!solve_header_printed) {
        std::cout << "\n| Mode         | Type      | Board | Cache  | Slot    | Thr | Pos  | Nodes      | MN/s  | Time     | Parity |\n";
        std::cout << "|--------------|-----------|-------|--------|---------|-----|------|------------|-------|----------|--------|\n";
        solve_header_printed = true;
    }

    std::string mode = weak ? "solve(weak)" : "solve()";
    std::string board_str = std::to_string(W) + "x" + std::to_string(H);
    std::cout << "| " << std::left << std::setw(12) << mode
              << " | " << std::setw(9) << "Exact"
              << " | " << std::setw(5) << board_str
              << " | " << std::setw(6) << std::to_string(mem_size / (1024 * 1024)) + " MB"
              << " | " << std::setw(7) << std::to_string(cache->getSlotWidth()) + "-bit"
              << " | " << std::setw(3) << threads
              << " | " << std::setw(4) << positions.size()
              << " | " << std::setw(10) << total_nodes
              << " | " << std::fixed << std::setprecision(2) << std::setw(5) << mns
              << " | " << std::setw(8) << std::to_string((int)total_ms) + " ms"
              << " | " << correct << "/" << positions.size()
              << (correct == (int)positions.size() ? " ✓" : " FAIL") << " |\n";
}

int main() {
    std::string dim_str = std::to_string(BOARD_WIDTH_MACRO) + "x" + std::to_string(BOARD_HEIGHT_MACRO);
    auto pos_all = load_positions("test-data/positions_" + dim_str + ".txt");
    
    if (pos_all.empty()) {
        std::cout << "No benchmark positions found for " << dim_str << "\n";
        return 1;
    }

    // Filter to only valid positions (no column overflows)
    std::vector<BenchPos> valid_positions;
    for (const auto& bp : pos_all) {
        if (is_valid_position<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(bp.pos)) {
            valid_positions.push_back(bp);
        }
    }

    std::cout << "\n===========================================\n";
    std::cout << "Throughput Benchmark: " << dim_str << " (" << valid_positions.size() << " positions)\n";
    std::cout << "===========================================";
    
    // --- Heuristic analyze (first 100 positions, 20ms timeout each) ---
    std::vector<BenchPos> heuristic_subset;
    for (size_t i = 0; i < 100 && i < valid_positions.size(); i++) {
        heuristic_subset.push_back(valid_positions[i]);
    }
    run_heuristic_analyze<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(heuristic_subset, 1);
    run_heuristic_analyze<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(heuristic_subset, 4);

    // --- Exact analyze (use all valid positions) ---
    // Filter to tractable depth (≤24 empty squares)
    std::vector<BenchPos> exact_subset;
    constexpr int total_cells = BOARD_WIDTH_MACRO * BOARD_HEIGHT_MACRO;
    int min_length = total_cells - 24;
    for (const auto& bp : valid_positions) {
        if ((int)bp.pos.length() >= min_length) {
            exact_subset.push_back(bp);
        }
    }
    
    if (exact_subset.size() >= 2) {
        run_exact_analyze<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(exact_subset, 1);
        run_exact_analyze<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(exact_subset, 4);
    } else {
        std::cout << "\n--- Skipping exact analyze() (insufficient deep positions) ---\n";
    }

    // --- Exact solve() with Lazy SMP ---
    // Deep early-game positions only feasible for 7x6 and smaller boards
    {
        std::vector<BenchPos> solve_hard;

        if (total_cells <= 42) {
            // Small boards: use genuinely hard early-game positions
            // Prefer low |score| (close to draw = harder) and few moves
            std::vector<BenchPos> candidates;
            for (const auto& bp : valid_positions) {
                int len = (int)bp.pos.length();
                if (len >= 1 && len <= 6 && std::abs(bp.expected_score) <= 3) {
                    candidates.push_back(bp);
                }
            }
            // Sort: fewer moves first, then lower |score|
            std::sort(candidates.begin(), candidates.end(), [](const BenchPos& a, const BenchPos& b) {
                if (a.pos.length() != b.pos.length()) return a.pos.length() < b.pos.length();
                return std::abs(a.expected_score) < std::abs(b.expected_score);
            });
            // Take top 3 hardest
            for (size_t i = 0; i < 3 && i < candidates.size(); i++) {
                solve_hard.push_back(candidates[i]);
            }
        } else {
            // Large boards: reuse tractable deep positions from exact_subset
            for (size_t i = 0; i < 3 && i < exact_subset.size(); i++) {
                solve_hard.push_back(exact_subset[i]);
            }
        }

        if (!solve_hard.empty()) {
            run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 1, false);
            run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 2, false);
            run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 4, false);
            run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 8, false);
            
            // Weak solve (much faster — determines win/loss/draw only)
            run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 1, true);
            run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 4, true);
        } else {
            std::cout << "\n--- Skipping solve() benchmark (no suitable positions) ---\n";
        }
    }

    if (g_parity_failures > 0) {
        std::cerr << "\n*** " << g_parity_failures << " PARITY FAILURE(S) DETECTED ***\n";
        return 1;
    }

    return 0;
}
