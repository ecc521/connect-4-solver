/**
 * gen_depth12_book.cpp
 *
 * Generates a depth-12 weak solution book for the 7×6 root position
 * and saves it as an Elias Fano book.
 *
 * Timing comparison:
 *   Phase 1 — baseline weak solve (no book, 256 MB TT)
 *   Phase 2 — collecting weak solve with depth-12 MutableBook as both
 *              oracle (feedback) and write target, same TT size
 *
 * Output: ./7x6_d12_weak.ebook
 *
 * Compile from tools/:
 *   g++ -std=c++17 -O3 -DNDEBUG -I../native -march=native \
 *       -o gen_depth12_book gen_depth12_book.cpp
 * Run:
 *   ./gen_depth12_book [output.ebook]
 *
 * SIGINT saves partial results to disk.
 */

#include <atomic>
#include <chrono>
#include <csignal>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <thread>

#include "Position.hpp"
#include "Solver.hpp"
#include "OpeningBook.hpp"

using namespace GameSolver::Connect4;

static constexpr int W = 7;
static constexpr int H = 6;
static constexpr size_t TT_BYTES = 256ULL << 20;  // 256 MB
static constexpr int COLLECT_DEPTH = 12;

using Pos = GenericPosition<W, H>;
using SI  = SolverImpl<W, H>;
using MB  = MutableBook<W, H>;

// ── SIGINT handler ───────────────────────────────────────────────────────────
// Signal handler only sets a flag. A watcher thread notices and calls
// solver.stop() — which is safe from a normal thread context.

static std::atomic<bool> g_interrupted{false};

static void on_sigint(int) {
    g_interrupted.store(true, std::memory_order_relaxed);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

using clk = std::chrono::steady_clock;

static double elapsed_s(clk::time_point t0, clk::time_point t1) {
    return std::chrono::duration<double>(t1 - t0).count();
}

static void print_nodes(unsigned long long n, double s) {
    double mnps = (double)n / s / 1e6;
    if (n >= 1'000'000'000ULL)
        std::printf("  nodes : %.3f B  (%.1f Mnps)\n", (double)n / 1e9, mnps);
    else
        std::printf("  nodes : %.3f M  (%.1f Mnps)\n", (double)n / 1e6, mnps);
}

// ── Main ─────────────────────────────────────────────────────────────────────

// Run solver.solve() with a watcher thread that calls solver.stop() on SIGINT.
// Returns true if the search was interrupted.
template<typename SolverT, typename Fn>
static bool run_with_interrupt(SolverT& solver, Fn&& do_solve) {
    std::atomic<bool> done{false};
    std::thread watcher([&]() {
        while (!done.load(std::memory_order_relaxed)) {
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
            if (g_interrupted.load(std::memory_order_relaxed))
                solver.stop();
        }
    });
    do_solve();
    done.store(true);
    watcher.join();
    return g_interrupted.load(std::memory_order_relaxed);
}

int main(int argc, char** argv) {
    const char* out_path = argc > 1 ? argv[1] : "../data/7x6_weak_dump12.book";
    std::signal(SIGINT, on_sigint);

    Pos root;  // empty board — 0 moves

    // ── Phase 1: baseline weak solve (no book) ────────────────────────────────
    std::printf("=== Phase 1: baseline weak solve (256 MB TT, no book) ===\n");
    {
        SI solver(TT_BYTES);
        int score = 0;
        unsigned long long nodes = 0;
        double s = 0;
        bool interrupted = run_with_interrupt(solver, [&]() {
            auto t0 = clk::now();
            auto result = solver.solve(root, /*weak=*/true, /*threads=*/1);
            auto t1 = clk::now();
            score = result.score;
            nodes = solver.getNodeCount();
            s = elapsed_s(t0, t1);
        });
        if (interrupted) {
            std::fprintf(stderr, "\nInterrupted during Phase 1 — no book to save.\n");
            return 1;
        }
        std::printf("  result: score %d\n", score);
        std::printf("  time  : %.3f s\n", s);
        print_nodes(nodes, s);
    }

    std::printf("\n");

    // ── Phase 2: collecting weak solve (collect-only, no oracle) ─────────────
    // The TT handles all transpositions at shallow depth; loading the
    // MutableBook as oracle during generation adds HasBook branch overhead
    // with zero pruning benefit (proven by identical node counts).
    // The book is meant to be an oracle for *future* separate solves.
    std::printf("=== Phase 2: collecting weak solve (256 MB TT, depth ≤ %d, collect-only) ===\n",
                COLLECT_DEPTH);

    MB mbook(COLLECT_DEPTH);

    {
        SI solver(TT_BYTES);
        solver.setCollectBook(&mbook);

        int score = 0;
        unsigned long long nodes = 0;
        double s = 0;
        bool interrupted = run_with_interrupt(solver, [&]() {
            auto t0 = clk::now();
            auto result = solver.solve(root, /*weak=*/true, /*threads=*/1);
            auto t1 = clk::now();
            score = result.score;
            nodes = solver.getNodeCount();
            s = elapsed_s(t0, t1);
        });

        if (interrupted) {
            std::fprintf(stderr, "\nInterrupted — saving partial results (%zu entries) to %s ...\n",
                         mbook.size(), out_path);
        } else {
            std::printf("  result: score %d\n", score);
            std::printf("  time  : %.3f s\n", s);
            print_nodes(nodes, s);
            std::printf("  book  : %zu entries collected\n", mbook.size());
        }
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    std::printf("\nSaving Elias Fano book to %s ...\n", out_path);
    {
        auto t0 = clk::now();
        mbook.save_elias_fano(out_path);
        auto t1 = clk::now();
        std::printf("  done in %.3f s\n", elapsed_s(t0, t1));
    }

    // ── File size ─────────────────────────────────────────────────────────────
    {
        FILE* f = std::fopen(out_path, "rb");
        if (f) {
            std::fseek(f, 0, SEEK_END);
            long sz = std::ftell(f);
            std::fclose(f);
            if (sz >= 1 << 20)
                std::printf("  size  : %.2f MB\n", (double)sz / (1 << 20));
            else
                std::printf("  size  : %.1f KB\n", (double)sz / 1024.0);
        }
    }

    return 0;
}
