#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <chrono>
#include <sstream>

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
        if (!pos.empty()) positions.push_back({pos, score});
    }
    return positions;
}

template<int W, int H>
void run_throughput(const std::vector<BenchPos>& positions, bool is_heuristic, int depth, int threads) {
    size_t mem_size = 32ULL * 1024ULL * 1024ULL; // Default 32MB
    if (const char* env_p = std::getenv("CACHE_MB")) {
        mem_size = std::stoull(env_p) * 1024ULL * 1024ULL;
    }

    std::unique_ptr<Cache> cache;
    if (is_heuristic) {
        cache = HeuristicSolver<W, H>::createCache(mem_size);
    } else {
        cache = Solver::createCache(mem_size);
    }

    uint64_t total_nodes = 0;
    uint64_t total_depth = 0;
    int accurate_count = 0;
    int sign_accurate_count = 0;

    auto start_time = std::chrono::high_resolution_clock::now();

    auto heuristic_solver = is_heuristic ? HeuristicSolver<W, H>::createWithCache(cache.get()) : nullptr;
    auto exact_solver = !is_heuristic ? Solver::createWithCache(cache.get()) : nullptr;

    for (const auto& bp : positions) {
        GenericPosition<W, H> p;
        p.play(bp.pos);
        
        if (is_heuristic) {
            auto res = heuristic_solver->analyze_heuristic(p, depth, threads, 999999);
            
            int score = res.first.empty() ? 0 : res.first[0];
            int reached_depth = res.second;
            total_depth += reached_depth;
            
            if (score == bp.expected_score) accurate_count++;
            if ((score > 0 && bp.expected_score > 0) || 
                (score < 0 && bp.expected_score < 0) || 
                (score == 0 && bp.expected_score == 0)) {
                sign_accurate_count++;
            }
        } else {
            auto res = exact_solver->analyze(p, false, threads, nullptr);
            int score = res.empty() ? 0 : res[0];
            if (score == bp.expected_score) accurate_count++;
            if ((score > 0 && bp.expected_score > 0) || 
                (score < 0 && bp.expected_score < 0) || 
                (score == 0 && bp.expected_score == 0)) {
                sign_accurate_count++;
            }
        }
    }
    
    total_nodes = is_heuristic ? heuristic_solver->getNodeCount() : exact_solver->getNodeCount();

    auto end_time = std::chrono::high_resolution_clock::now();
    double total_ms = std::chrono::duration<double, std::milli>(end_time - start_time).count();
    double mns = (total_nodes / 1000000.0) / (total_ms / 1000.0);

    // Print table header for the first thread configuration
    if (threads == 1) {
        if (is_heuristic) {
            std::cout << "\n| Type      | Board | Cache  | Slot    | Thr | Pos  | Nodes      | MN/s  | Time    | Avg Depth | Sign Acc |\n";
            std::cout << "|-----------|-------|--------|---------|-----|------|------------|-------|---------|-----------|----------|\n";
        } else {
            std::cout << "\n| Type      | Board | Cache  | Slot    | Thr | Pos  | Nodes      | MN/s  | Time    |\n";
            std::cout << "|-----------|-------|--------|---------|-----|------|------------|-------|---------|\n";
        }
    }

    std::cout << "| " << std::left << std::setw(9) << (is_heuristic ? "Heuristic" : "Exact")
              << " | " << W << "x" << H
              << "   | " << std::setw(6) << std::to_string(mem_size / (1024 * 1024)) + " MB"
              << " | " << std::setw(7) << std::to_string(cache->getSlotWidth()) + "-bit"
              << " | " << std::setw(3) << threads
              << " | " << std::setw(4) << positions.size()
              << " | " << std::setw(10) << total_nodes
              << " | " << std::fixed << std::setprecision(2) << std::setw(5) << mns
              << " | " << std::setw(7) << std::to_string((int)total_ms) + " ms";
              
    if (is_heuristic) {
        std::cout << " | " << std::setw(9) << std::to_string((int)((double)total_depth / positions.size())) + " plies"
                  << " | " << std::setw(8) << std::to_string(sign_accurate_count) + "/" + std::to_string(positions.size()) + " (" + std::to_string((int)((double)sign_accurate_count / positions.size() * 100.0)) + "%) |\n";
    } else {
        std::cout << " |\n";
    }
    (void)accurate_count;
}

int main() {
    std::string dim_str = std::to_string(BOARD_WIDTH_MACRO) + "x" + std::to_string(BOARD_HEIGHT_MACRO);
    auto pos_all = load_positions("test-data/positions_" + dim_str + ".txt");
    
    if (pos_all.empty()) {
        std::cout << "No benchmark positions found for " << dim_str << "\n";
        return 1;
    }

    std::cout << "\n===========================================\n";
    std::cout << "Throughput Benchmark: " << dim_str << " (" << pos_all.size() << " positions)\n";
    std::cout << "===========================================";
    
    // Heuristic solver
    std::vector<BenchPos> heuristic_subset;
    for (size_t i = 0; i < 100 && i < pos_all.size(); i++) {
        heuristic_subset.push_back(pos_all[i]);
    }
    
    int heuristic_depth = (BOARD_WIDTH_MACRO == 8) ? 10 : 12;
    run_throughput<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(heuristic_subset, true, heuristic_depth, 1);
    run_throughput<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(heuristic_subset, true, heuristic_depth, 4);

    // Exact solver 
    std::vector<BenchPos> exact_subset;
    int min_length = (BOARD_WIDTH_MACRO * BOARD_HEIGHT_MACRO) - 24; // ensure max 24 empty spaces
    for (const auto& bp : pos_all) {
        if ((int)bp.pos.length() >= min_length) {
            exact_subset.push_back(bp);
        }
    }
    
    if (exact_subset.size() < 2) {
        std::cout << "\n--- Skipping Exact Solver " << BOARD_WIDTH_MACRO << "x" << BOARD_HEIGHT_MACRO 
                  << " (Computationally infeasible or no deep positions) ---\n";
        exact_subset.clear(); 
    } else {
        if (BOARD_WIDTH_MACRO >= 8) {
            exact_subset.resize(std::min((size_t)2, exact_subset.size()));
        } else {
            exact_subset.resize(std::min((size_t)1000, exact_subset.size()));
        }
    }
    
    if (exact_subset.size() >= 2) {
        run_throughput<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(exact_subset, false, 0, 1);
        run_throughput<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(exact_subset, false, 0, 4);
    }

    return 0;
}
