// bench_private_tt.cpp — tests the "private TT per thread, race to completion" strategy
// Each thread gets its own TranspositionTable with NO sharing.
// First thread to complete a weak solve wins.
// Measures whether independent parallel searches beat shared-TT Lazy SMP.
//
// Usage: ./bench_private_tt W H total_cache_mb [threads...]

#include <iostream>
#include <vector>
#include <chrono>
#include <libproc.h>
#include <sys/resource.h>
#include <unistd.h>
#include <iomanip>
#include <string>
#include <thread>
#include <atomic>
#include <mutex>
#include <future>

#include "../native/Solver.hpp"

using namespace GameSolver::Connect4;

struct BenchmarkResult {
    double time_ms;
    uint64_t total_nodes;
    uint64_t instructions;
    uint64_t cycles;
    uint64_t user_time_ns;
    int score;
    int winning_thread;
};

template <int W, int H>
BenchmarkResult benchmark_private_tt(int num_threads, size_t total_cache_mb) {
    // Split cache evenly among threads
    size_t per_thread_mb = total_cache_mb / num_threads;
    if (per_thread_mb < 128) per_thread_mb = 128; // Floor at 128MB
    std::cout << "Private-TT: " << num_threads << " threads x " << per_thread_mb 
              << "MB TT (total=" << per_thread_mb * num_threads << "MB)...\n";

    GenericPosition<W, H> P; // Empty board

    struct rusage_info_v4 ru_start, ru_end;
    proc_pid_rusage(getpid(), RUSAGE_INFO_V4, (rusage_info_t *)&ru_start);
    auto start = std::chrono::steady_clock::now();

    std::atomic<bool> done{false};
    std::atomic<uint64_t> total_nodes{0};
    int result_score = 0;
    int result_thread = -1;
    std::mutex result_mutex;

    std::vector<std::thread> threads;
    std::atomic<int> remaining{num_threads};
    std::promise<void> prom;
    auto fut = prom.get_future();

    for (int t = 0; t < num_threads; t++) {
        threads.emplace_back([&, t]() {
            // Each thread gets its own private TT
            auto private_cache = std::make_shared<TranspositionTable<uint64_t, uint8_t, 
                getRequiredValueBits<W, H>(), 7, 0, 
                (W >= 16 ? 5 : (W >= 8 ? 4 : 3)), 
                typename GenericPosition<W, H>::position_t>>(per_thread_mb * 1024 * 1024);
            
            SolverImpl<W, H, uint64_t> solver(private_cache, W, H);
            
            // Use perturbed history for search diversity across threads
            // This is the only "coordination" — different move ordering
            std::vector<int32_t> local_history(W * (H + 1));
            for (int i = 0; i < W * (H + 1); i++) {
                local_history[i] = (t * 7 + i * 3) % 9; // small perturbation
            }

            auto result = solver.solve(P, /*weak=*/true, /*threads=*/1, nullptr, 0.0);
            
            uint64_t nodes = solver.getNodeCount();
            total_nodes.fetch_add(nodes, std::memory_order_relaxed);

            if (!done.exchange(true)) {
                std::lock_guard<std::mutex> lock(result_mutex);
                result_score = result.score;
                result_thread = t;
            }

            if (remaining.fetch_sub(1) == 1) {
                prom.set_value();
            }
        });
    }

    fut.wait();
    for (auto& thr : threads) thr.join();

    auto end = std::chrono::steady_clock::now();
    proc_pid_rusage(getpid(), RUSAGE_INFO_V4, (rusage_info_t *)&ru_end);

    BenchmarkResult br;
    br.time_ms = std::chrono::duration<double, std::milli>(end - start).count();
    br.total_nodes = total_nodes.load();
    br.instructions = ru_end.ri_instructions - ru_start.ri_instructions;
    br.cycles = ru_end.ri_cycles - ru_start.ri_cycles;
    br.user_time_ns = ru_end.ri_user_time - ru_start.ri_user_time;
    br.score = result_score;
    br.winning_thread = result_thread;

    return br;
}

int main(int argc, char** argv) {
    int w = 7;
    int h = 6;
    size_t total_cache_mb = 32000;

    if (argc >= 3) {
        w = std::stoi(argv[1]);
        h = std::stoi(argv[2]);
    }
    if (argc >= 4) {
        total_cache_mb = std::stoull(argv[3]);
    }

    std::cout << "========================================================================\n";
    std::cout << "Private-TT Benchmark: WEAK SOLVE " << w << "x" << h 
              << " | Total cache budget: " << total_cache_mb << "MB\n";
    std::cout << "Hardware Threads available: " << std::thread::hardware_concurrency() << "\n";
    std::cout << "========================================================================\n";

    std::vector<int> threadCounts = {1, 2, 4, 6, 8, 12};
    if (argc >= 5) {
        threadCounts.clear();
        for (int i = 4; i < argc; i++) {
            threadCounts.push_back(std::stoi(argv[i]));
        }
    }

    std::cout << std::left
              << std::setw(8) << "Threads"
              << std::setw(14) << "PerThread(MB)"
              << std::setw(12) << "Time (ms)"
              << std::setw(15) << "TotalNPS"
              << std::setw(18) << "Cycles/Node"
              << std::setw(12) << "IPC"
              << std::setw(15) << "UserTime(ms)"
              << std::setw(10) << "Score"
              << std::setw(8)  << "Winner"
              << std::endl;

    for (int t : threadCounts) {
        BenchmarkResult br;
        if (w == 7 && h == 6) br = benchmark_private_tt<7, 6>(t, total_cache_mb);
        else if (w == 7 && h == 7) br = benchmark_private_tt<7, 7>(t, total_cache_mb);
        else {
            std::cout << "Unsupported board size\n";
            return 1;
        }

        size_t per_thread_mb = std::max(128UL, total_cache_mb / (size_t)t);
        double nps = br.time_ms > 0 ? br.total_nodes / (br.time_ms / 1000.0) : 0.0;
        double cpn = br.total_nodes > 0 ? (double)br.cycles / br.total_nodes : 0.0;
        double ipc = br.cycles > 0 ? (double)br.instructions / br.cycles : 0.0;

        std::cout << std::left
                  << std::setw(8) << t
                  << std::setw(14) << per_thread_mb
                  << std::setw(12) << std::fixed << std::setprecision(0) << br.time_ms
                  << std::setw(15) << nps
                  << std::setw(18) << std::setprecision(2) << cpn
                  << std::setw(12) << ipc
                  << std::setw(15) << std::setprecision(0) << br.user_time_ns / 1e6
                  << std::setw(10) << br.score
                  << std::setw(8)  << br.winning_thread
                  << std::endl;
    }
    return 0;
}
