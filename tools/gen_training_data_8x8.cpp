/**
 * gen_training_data_8x8.cpp
 *
 * Generates hybrid training data for the 8x8 NNUE:
 *   - data_exact.bin  : positions solved exactly (mid/late game)
 *   - data_soft.bin   : positions evaluated by deep heuristic search (early game)
 *
 * Adaptive cutover: starts generating from the end of the game (high ply count)
 * and walks backward. A shared atomic `cutover_ply` tracks the minimum ply at
 * which the exact solver has timed out. Any position at a ply >= cutover_ply
 * is routed to the heuristic solver instead.
 *
 * Binary formats:
 *   data_exact.bin  — 20 bytes/record:
 *     uint64_t pos, uint64_t opp, int16_t score, int16_t padding
 *     score is raw minimax: [-32, +32] for 8x8
 *
 *   data_soft.bin   — 20 bytes/record:
 *     uint64_t pos, uint64_t opp, float normalized_score, int32_t padding
 *     normalized_score is in [-1.0, +1.0] (heuristic score / SCORE_NNUE_MAX)
 *
 * Usage:
 *   ./gen_training_data_8x8 [total_positions] [timeout_sec] [threads] [seed]
 */

#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cmath>
#include <atomic>
#include <chrono>
#include <mutex>
#include <random>
#include <thread>
#include <vector>

#include "Position.hpp"
#include "Solver.hpp"
#include "HeuristicSolver.hpp"
#include "Constants.hpp"

using namespace GameSolver::Connect4;

constexpr int W = 8;
constexpr int H = 8;
using Pos         = GenericPosition<W, H>;
using ExactSolver = SolverImpl<W, H, __uint128_t>;
using HeurSolver  = HeuristicSolver<W, H>;
using HeurCache   = HeuristicCache<W, H>;


// ── Binary record layouts ─────────────────────────────────────────────────────
//
// Both records are 24 bytes to avoid alignment/packing issues:
//
// ExactRecord (24 bytes):
//   uint64_t pos, uint64_t opp, int32_t score (raw minimax [-32,+32]), int32_t padding
//
// SoftRecord (24 bytes):
//   uint64_t pos, uint64_t opp, float score (normalized [-1,+1]), int32_t padding

struct ExactRecord {
    uint64_t pos;
    uint64_t opp;
    int32_t  score;    // raw minimax in [-32, +32] for 8x8
    int32_t  padding;
};
static_assert(sizeof(ExactRecord) == 24);

struct SoftRecord {
    uint64_t pos;
    uint64_t opp;
    float    score;    // normalized to [-1.0, +1.0]
    int32_t  padding;
};
static_assert(sizeof(SoftRecord) == 24);

// ── Timing helper ─────────────────────────────────────────────────────────────
static double now_ms() {
    using namespace std::chrono;
    return duration<double, std::milli>(
        steady_clock::now().time_since_epoch()).count();
}

// ── Random position generation ────────────────────────────────────────────────
static Pos make_random_position(int target_ply, std::mt19937& rng) {
    while (true) {
        Pos P;
        std::uniform_int_distribution<int> col_dist(0, W - 1);
        int moves_played = 0;
        bool ok = true;
        for (int i = 0; i < target_ply; ++i) {
            // Collect non-winning moves to avoid early termination
            int tries = 0;
            while (tries < 20) {
                int col = col_dist(rng);
                if (P.canPlay(col) && !P.isWinningMove(col)) {
                    P.playCol(col);
                    ++moves_played;
                    break;
                }
                ++tries;
            }
            if (tries == 20) { ok = false; break; }
        }
        if (ok && moves_played == target_ply && !P.canWinNext())
            return P;
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────
int main(int argc, char** argv) {
    const int    total_positions = (argc > 1) ? std::atoi(argv[1]) : 1'500'000;
    const double timeout_sec     = (argc > 2) ? std::atof(argv[2]) : 10.0;
    const int    num_threads     = (argc > 3) ? std::atoi(argv[3]) : 18;
    const uint64_t seed          = (argc > 4) ? std::stoull(argv[4]) : 42;

    const double timeout_ms = timeout_sec * 1000.0;
    const int    max_ply    = W * H - 1;  // 63 for 8x8

    printf("=== gen_training_data_8x8 ===\n");
    printf("Total positions : %d\n", total_positions);
    printf("Timeout         : %.1fs per position\n", timeout_sec);
    printf("Threads         : %d\n", num_threads);
    printf("Seed            : %llu\n", (unsigned long long)seed);

    // ── Allocate 54 GB shared exact cache ────────────────────────────────────
    // 54 GB split: we give 48 GB to the exact solver.
    // Each exact TT slot is 7 bytes; 48 GB / 7 ≈ 7.35 billion slots.
    const size_t exact_cache_bytes = 48ULL * 1024 * 1024 * 1024;
    printf("Allocating %zu GB shared exact TT... ", exact_cache_bytes >> 30);
    fflush(stdout);

    auto exact_cache = ExactSolver::createCache(exact_cache_bytes);
    if (!exact_cache) {
        fprintf(stderr, "FAILED. Reduce --cache or increase available RAM.\n");
        return 1;
    }
    printf("OK\n");

    // ── Allocate heuristic cache (remaining ~6 GB) ────────────────────────────
    const size_t heur_cache_bytes = 6ULL * 1024 * 1024 * 1024;
    printf("Allocating %zu GB shared heuristic TT... ", heur_cache_bytes >> 30);
    fflush(stdout);

    auto heur_cache = HeuristicSolver<W, H>::createCache(heur_cache_bytes);
    if (!heur_cache) {
        fprintf(stderr, "FAILED.\n");
        return 1;
    }
    printf("OK\n");

    // ── Adaptive cutover: tracked globally ───────────────────────────────────
    // `cutover_ply` = the lowest ply at which an exact timeout has occurred.
    // Positions with nbMoves() >= cutover_ply use the heuristic solver.
    // Starts at INT_MAX (all positions attempted exactly first).
    std::atomic<int> cutover_ply{INT_MAX};

    // ── Output files ──────────────────────────────────────────────────────────
    std::mutex exact_mutex, soft_mutex;
    FILE* exact_file = fopen("data_exact.bin", "wb");
    FILE* soft_file  = fopen("data_soft.bin",  "wb");
    if (!exact_file || !soft_file) {
        fprintf(stderr, "Could not open output files.\n");
        return 1;
    }

    // ── Progress counters ─────────────────────────────────────────────────────
    std::atomic<int> n_exact{0}, n_soft{0}, n_total{0};

    // ── Worker function ───────────────────────────────────────────────────────
    auto worker = [&](int thread_id) {
        std::mt19937_64 rng(seed + thread_id * 6364136223846793005ULL);

        // Each thread gets its own solver pointing at the shared cache
        auto exact_solver = ExactSolver::createWithCache(exact_cache.get());
        auto heur_solver  = HeuristicSolver<W, H>::createWithCache(heur_cache.get());

        // Generate positions starting from high plies and working down.
        // Each thread independently walks from max_ply toward 0,
        // contributing to the globally-discovered cutover point.
        int current_ply = max_ply - (thread_id % 8);  // slight offset per thread

        while (n_total.load(std::memory_order_relaxed) < total_positions) {
            if (current_ply < 0) current_ply = max_ply;

            Pos P = make_random_position(current_ply, reinterpret_cast<std::mt19937&>(rng));
            const int ply = P.nbMoves();
            const int cutover = cutover_ply.load(std::memory_order_relaxed);

            if (ply < cutover) {
                // ── Attempt exact solve ─────────────────────────────────
                double t0 = now_ms();
                SolverResult res = exact_solver->solve(P, false, 1, nullptr, timeout_ms);
                double elapsed = now_ms() - t0;

                if (res.aborted || elapsed >= timeout_ms) {
                    // Timeout occurred — update cutover
                    int old = cutover_ply.load(std::memory_order_relaxed);
                    while (ply < old &&
                           !cutover_ply.compare_exchange_weak(old, ply, std::memory_order_relaxed))
                    {}
                    // Fall through to heuristic for this position
                    goto use_heuristic;
                }

                {
                    // Write exact record
                    ExactRecord rec;
                    using pos_t = typename Pos::position_t;
                    pos_t cur = P.getCurrentPosition();
                    pos_t opp = P.getMask() ^ cur;
                    rec.pos     = static_cast<uint64_t>(cur);
                    rec.opp     = static_cast<uint64_t>(opp);
                    rec.score   = static_cast<int16_t>(res.score);
                    rec.padding = 0;

                    std::lock_guard<std::mutex> lk(exact_mutex);
                    fwrite(&rec, sizeof(rec), 1, exact_file);
                    n_exact.fetch_add(1, std::memory_order_relaxed);
                }
            } else {
                use_heuristic:
                // ── Deep heuristic search ───────────────────────────────
                SolverResult hres = heur_solver->solve(P, false, 1, nullptr, 5000.0);
                if (hres.aborted) {
                    --current_ply;
                    continue;
                }

                // Normalize heuristic score from NNUE range to [-1, +1]
                constexpr float NNUE_MAX = static_cast<float>(SCORE_NNUE_MAX);
                float norm = std::max(-1.0f, std::min(1.0f,
                    static_cast<float>(hres.score) / NNUE_MAX));

                SoftRecord rec;
                using pos_t = typename Pos::position_t;
                pos_t cur = P.getCurrentPosition();
                pos_t opp = P.getMask() ^ cur;
                rec.pos     = static_cast<uint64_t>(cur);
                rec.opp     = static_cast<uint64_t>(opp);
                rec.score   = norm;
                rec.padding = 0;

                std::lock_guard<std::mutex> lk(soft_mutex);
                fwrite(&rec, sizeof(rec), 1, soft_file);
                n_soft.fetch_add(1, std::memory_order_relaxed);
            }

            n_total.fetch_add(1, std::memory_order_relaxed);
            --current_ply;

            if (n_total.load() % 10000 == 0) {
                int co = cutover_ply.load();
                printf("\r[%dk] exact=%dk soft=%dk  cutover_ply=%s",
                    n_total.load() / 1000,
                    n_exact.load() / 1000,
                    n_soft.load() / 1000,
                    co == INT_MAX ? "none(all exact)" : std::to_string(co).c_str());
                fflush(stdout);
            }
        }
    };

    // ── Launch workers ────────────────────────────────────────────────────────
    printf("Starting %d threads...\n", num_threads);
    std::vector<std::thread> threads;
    threads.reserve(num_threads);
    for (int i = 0; i < num_threads; ++i)
        threads.emplace_back(worker, i);
    for (auto& t : threads)
        t.join();

    fclose(exact_file);
    fclose(soft_file);

    int final_cutover = cutover_ply.load();
    printf("\n\n=== Done ===\n");
    printf("Exact records  : %d  -> data_exact.bin\n", n_exact.load());
    printf("Soft records   : %d  -> data_soft.bin\n",  n_soft.load());
    printf("Cutover ply    : %s\n",
        final_cutover == INT_MAX ? "never triggered (all exact)" : std::to_string(final_cutover).c_str());
    return 0;
}
