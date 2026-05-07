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
 * Binary formats (40 bytes each — positions stored as two uint64 halves for full 128-bit coverage):
 *
 *   data_exact.bin:
 *     uint64_t pos_lo, uint64_t pos_hi   — low/high 64 bits of current player bitboard
 *     uint64_t opp_lo, uint64_t opp_hi   — low/high 64 bits of opponent bitboard
 *     int32_t  score                      — raw minimax in [-32, +32] for 8x8
 *     int32_t  padding
 *
 *   data_soft.bin:
 *     uint64_t pos_lo, uint64_t pos_hi
 *     uint64_t opp_lo, uint64_t opp_hi
 *     float    score                      — normalized to [-1.0, +1.0]
 *     int32_t  padding
 *
 * Resume: if output files already exist they are appended to, and their
 * existing record counts are subtracted from the generation target.
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
// Both record types are 40 bytes:
//
// Positions for 8x8 use __uint128_t (72 bits needed per player), which does NOT
// fit in a single uint64_t (col 7 rows 1-7 occupy bits 64-70). We store each
// bitboard as a lo/hi uint64_t pair to capture the full 128-bit value.

struct ExactRecord {
    uint64_t pos_lo, pos_hi;   // full 128-bit current-player bitboard
    uint64_t opp_lo, opp_hi;   // full 128-bit opponent bitboard
    int32_t  score;            // raw minimax in [-32, +32] for 8x8
    int32_t  padding;
};
static_assert(sizeof(ExactRecord) == 40);

struct SoftRecord {
    uint64_t pos_lo, pos_hi;
    uint64_t opp_lo, opp_hi;
    float    score;            // normalized to [-1.0, +1.0]
    int32_t  padding;
};
static_assert(sizeof(SoftRecord) == 40);

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

    // ── Adaptive cutover: max remaining moves for exact solving ───────────────
    // Starts at max_ply (try exact for all positions).
    // When a timeout occurs at remaining=N, atomically reduces to N-1.
    // Each thread starts at remaining=0 (end of game, trivially fast) and
    // increments, so the boundary is discovered from a safe direction.
    // Only ever decreases — no cascade possible.
    std::atomic<int> max_remaining_exact{max_ply};

    // ── Output files with resume support ─────────────────────────────────────
    // Open in append mode so an interrupted run can be resumed.
    // Count existing records to know how many more we need.
    auto count_records = [](const char* path, size_t record_size) -> int {
        FILE* f = fopen(path, "rb");
        if (!f) return 0;
        fseek(f, 0, SEEK_END);
        long sz = ftell(f);
        fclose(f);
        return (sz > 0) ? (int)(sz / record_size) : 0;
    };

    int existing_exact = count_records("data_exact.bin", sizeof(ExactRecord));
    int existing_soft  = count_records("data_soft.bin",  sizeof(SoftRecord));
    int already_done   = existing_exact + existing_soft;

    if (already_done > 0) {
        printf("Resuming: found %d existing exact + %d soft = %d total records.\n",
               existing_exact, existing_soft, already_done);
        if (already_done >= total_positions) {
            printf("Target already reached. Nothing to do.\n");
            return 0;
        }
    }

    std::mutex exact_mutex, soft_mutex;
    FILE* exact_file = fopen("data_exact.bin", "ab");
    FILE* soft_file  = fopen("data_soft.bin",  "ab");
    if (!exact_file || !soft_file) {
        fprintf(stderr, "Could not open output files.\n");
        return 1;
    }

    // ── Progress counters (start from existing record counts) ─────────────────
    std::atomic<int> n_exact{existing_exact}, n_soft{existing_soft},
                     n_total{already_done};

    // ── Worker function ───────────────────────────────────────────────────────
    auto worker = [&](int thread_id) {
        std::mt19937_64 rng(seed + thread_id * 6364136223846793005ULL);

        // Each thread gets its own solver pointing at the shared cache
        auto exact_solver = ExactSolver::createWithCache(exact_cache.get());
        auto heur_solver  = HeuristicSolver<W, H>::createWithCache(heur_cache.get());

        // Each thread independently tracks how many moves remain.
        // Start at a small offset so threads don't all probe the same depth simultaneously.
        // remaining=0 is a terminal/near-terminal position (instant solve).
        int current_remaining = thread_id % num_threads;

        while (n_total.load(std::memory_order_relaxed) < total_positions) {
            // Wrap around: after probing the full range, restart from 0.
            if (current_remaining > max_ply) current_remaining = 0;

            // Convert remaining moves → ply count (pieces on board)
            const int target_ply = max_ply - current_remaining;
            Pos P = make_random_position(target_ply, reinterpret_cast<std::mt19937&>(rng));

            const int remaining = max_ply - P.nbMoves();
            const int max_rem   = max_remaining_exact.load(std::memory_order_relaxed);

            if (remaining <= max_rem) {
                // ── Attempt exact solve ─────────────────────────────────
                double t0 = now_ms();
                SolverResult res = exact_solver->solve(P, false, 1, nullptr, timeout_ms);
                double elapsed = now_ms() - t0;

                if (res.aborted || elapsed >= timeout_ms) {
                    // Timeout: lower the cutover to remaining-1.
                    // This is an atomic min — only decreases, never increases.
                    int old = max_remaining_exact.load(std::memory_order_relaxed);
                    while (remaining <= old &&
                           !max_remaining_exact.compare_exchange_weak(
                               old, remaining - 1, std::memory_order_relaxed))
                    {}
                    // Fall through: evaluate this position heuristically instead
                    goto use_heuristic;
                }

                {
                    // Write exact record — store full 128-bit position as lo/hi pair
                    using pos_t = typename Pos::position_t;
                    pos_t cur = P.getCurrentPosition();
                    pos_t opp = P.getMask() ^ cur;

                    ExactRecord rec;
                    rec.pos_lo  = static_cast<uint64_t>(cur);
                    rec.pos_hi  = static_cast<uint64_t>(cur >> 64);
                    rec.opp_lo  = static_cast<uint64_t>(opp);
                    rec.opp_hi  = static_cast<uint64_t>(opp >> 64);
                    rec.score   = res.score;
                    rec.padding = 0;

                    std::lock_guard<std::mutex> lk(exact_mutex);
                    fwrite(&rec, sizeof(rec), 1, exact_file);
                    n_exact.fetch_add(1, std::memory_order_relaxed);
                }
            } else {
                use_heuristic:
                // ── Deep heuristic search ───────────────────────────────
                // 2s ceiling — iterative deepening on mid-game positions
                // typically converges well within 500ms.
                SolverResult hres = heur_solver->solve(P, false, 1, nullptr, 2000.0);
                if (hres.aborted) {
                    ++current_remaining;
                    continue;  // skip, try another position
                }

                // Normalize heuristic score from NNUE range to [-1, +1]
                constexpr float NNUE_MAX = static_cast<float>(SCORE_NNUE_MAX);
                float norm = std::max(-1.0f, std::min(1.0f,
                    static_cast<float>(hres.score) / NNUE_MAX));

                // Write soft record — store full 128-bit position as lo/hi pair
                using pos_t = typename Pos::position_t;
                pos_t cur = P.getCurrentPosition();
                pos_t opp = P.getMask() ^ cur;

                SoftRecord rec;
                rec.pos_lo  = static_cast<uint64_t>(cur);
                rec.pos_hi  = static_cast<uint64_t>(cur >> 64);
                rec.opp_lo  = static_cast<uint64_t>(opp);
                rec.opp_hi  = static_cast<uint64_t>(opp >> 64);
                rec.score   = norm;
                rec.padding = 0;

                std::lock_guard<std::mutex> lk(soft_mutex);
                fwrite(&rec, sizeof(rec), 1, soft_file);
                n_soft.fetch_add(1, std::memory_order_relaxed);
            }

            n_total.fetch_add(1, std::memory_order_relaxed);
            ++current_remaining;

            if (n_total.load() % 10000 == 0) {
                int mr = max_remaining_exact.load();
                printf("\r[%dk] exact=%dk soft=%dk  exact_cutover=%d remaining moves",
                    n_total.load() / 1000,
                    n_exact.load() / 1000,
                    n_soft.load() / 1000,
                    mr);
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

    int final_cutover = max_remaining_exact.load();
    printf("\n\n=== Done ===\n");
    printf("Exact records       : %d  -> data_exact.bin\n", n_exact.load());
    printf("Soft records        : %d  -> data_soft.bin\n",  n_soft.load());
    printf("Exact cutover       : <= %d remaining moves (>= ply %d)\n",
        final_cutover, max_ply - final_cutover);
    return 0;
}


