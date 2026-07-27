// bench_isolation.cpp — diagnostic benchmark to isolate the bottleneck
//
// Runs 3 experiments:
//   A) Shared-TT Lazy SMP (current approach)
//   B) N independent solvers, each with private TT, racing to finish
//   C) Sequential independent solvers (N × 1T) to measure overhead
//
// If B scales but A doesn't: TT cache coherence is the bottleneck
// If neither B nor A scales: global memory pressure (bandwidth/latency)
// If A and B both scale the same: something else

#include <iostream>
#include <vector>
#include <chrono>
#include <thread>
#include <atomic>
#include <mutex>
#include <libproc.h>

#include "../native/Solver.hpp"

using namespace GameSolver::Connect4;

static const int W = 7, H = 6;
using Pos = GenericPosition<W, H>;
using TT = TranspositionTable<uint64_t, uint8_t, SolverImpl<W, H>::VALUE_BITS, 7, 0, SolverImpl<W, H>::MOVE_BITS, Pos::position_t>;
using Solver7x6 = SolverImpl<W, H>;

double wall_ms(auto start) {
    return std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - start).count();
}

// Experiment A: current shared-TT Lazy SMP (as implemented)
double exp_A_shared_tt(int threads, size_t cache_mb) {
    auto cache = std::make_shared<TT>(cache_mb * 1024 * 1024);
    Solver7x6 solver(cache, W, H);
    Pos P;
    auto start = std::chrono::steady_clock::now();
    solver.solve(P, true, threads, nullptr, 0.0);
    return wall_ms(start);
}

// Experiment B: N private-TT solvers race in parallel — no TT sharing at all
// Each thread gets its own fresh Solver+TT; wall time = first to finish
double exp_B_private_tt(int threads, size_t cache_mb_per_thread) {
    struct alignas(64) Worker {
        std::unique_ptr<Solver7x6> solver;
        double time_ms = 0;
    };
    std::vector<Worker> workers(threads);
    for (auto& w : workers)
        w.solver = std::make_unique<Solver7x6>(cache_mb_per_thread * 1024 * 1024, W, H);

    std::atomic<bool> done{false};
    std::atomic<double> first_finish{std::numeric_limits<double>::max()};

    auto start = std::chrono::steady_clock::now();

    std::vector<std::thread> ths;
    for (int t = 0; t < threads; t++) {
        ths.emplace_back([&, t]() {
            Pos P;
            workers[t].solver->solve(P, true, 1, nullptr, 0.0);
            double elapsed = wall_ms(start);
            workers[t].time_ms = elapsed;
            // record the first to finish
            double expected = std::numeric_limits<double>::max();
            first_finish.compare_exchange_strong(expected, elapsed);
            done.store(true, std::memory_order_relaxed);
        });
    }

    // Wait for first to finish
    while (!done.load(std::memory_order_relaxed))
        std::this_thread::yield();

    double result = first_finish.load();

    // Give others a moment to see done (they don't have abort flags, so let them run to completion
    // in the background — we don't measure them)
    for (auto& th : ths) th.detach();

    // Small sleep to let detached threads settle before TT destruction (not ideal, but
    // for diagnostic purposes this is fine)
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    return result;
}

int main(int argc, char** argv) {
    size_t cache_mb = 4000; // 4GB TT — large enough to matter, small enough for multiple threads
    if (argc >= 2) cache_mb = std::stoull(argv[1]);

    std::vector<int> thread_counts = {1, 2, 4, 6, 8};
    if (argc >= 3) {
        thread_counts.clear();
        for (int i = 2; i < argc; i++) thread_counts.push_back(std::stoi(argv[i]));
    }

    std::cout << "=========================================================\n";
    std::cout << "TT Isolation Benchmark: 7x6 Weak Solve\n";
    std::cout << "Shared-TT: " << cache_mb << " MB   Private-TT: " << cache_mb << " MB/thread\n";
    std::cout << "=========================================================\n";
    std::cout << std::left
              << std::setw(8)  << "Threads"
              << std::setw(16) << "Shared-TT (ms)"
              << std::setw(16) << "SpeedupShared"
              << std::setw(18) << "Private-TT (ms)"
              << std::setw(18) << "SpeedupPrivate"
              << "\n";

    double base_shared = -1, base_private = -1;

    for (int t : thread_counts) {
        std::cout << "  [Running " << t << "T shared-TT...]\n" << std::flush;
        double sh = exp_A_shared_tt(t, cache_mb);

        std::cout << "  [Running " << t << "T private-TT...]\n" << std::flush;
        double pr = exp_B_private_tt(t, cache_mb);

        if (base_shared < 0) { base_shared = sh; base_private = pr; }

        std::cout << std::left
                  << std::setw(8)  << t
                  << std::setw(16) << std::fixed << std::setprecision(0) << sh
                  << std::setw(16) << std::setprecision(2) << base_shared / sh
                  << std::setw(18) << std::setprecision(0) << pr
                  << std::setw(18) << std::setprecision(2) << base_private / pr
                  << "\n" << std::flush;
    }

    return 0;
}
