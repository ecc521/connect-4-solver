// bench_xnu_solve.cpp — benchmarks parallel WEAK SOLVE from root position
// using proc_pid_rusage for XNU hardware performance counters (cycles, IPC, QoS)
//
// Usage: ./bench_solve W H cache_mb [threads...]
// Example: ./bench_solve 7 6 32000 1 4 8 12 18

#include <iostream>
#include <vector>
#include <chrono>
#include <libproc.h>
#include <sys/resource.h>
#include <unistd.h>
#include <iomanip>
#include <string>
#include <thread>

#include "../native/Solver.hpp"

using namespace GameSolver::Connect4;

struct BenchmarkResult {
    double time_ms;
    uint64_t nodes;
    uint64_t instructions;
    uint64_t cycles;
    uint64_t user_time_ns;
    uint64_t qos_user_interactive_time_ns;
    int score;
};

template <int W, int H>
BenchmarkResult benchmark_solve(int threads, size_t cache_mb) {
    std::cout << "Allocating " << cache_mb << " MB cache for " << W << "x" << H << " solve...\n";
    auto cache = std::make_shared<TranspositionTable<uint64_t, uint8_t, getRequiredValueBits<W, H>(), 7, 0, (W >= 16 ? 5 : (W >= 8 ? 4 : 3)), typename GenericPosition<W, H>::position_t>>(cache_mb * 1024 * 1024);
    SolverImpl<W, H> solver(cache, W, H);

    GenericPosition<W, H> P; // Empty board

    struct rusage_info_v4 ru_start, ru_end;
    proc_pid_rusage(getpid(), RUSAGE_INFO_V4, (rusage_info_t *)&ru_start);

    auto start = std::chrono::steady_clock::now();

    // Strong solve: find exact scores for all root moves
    auto result = solver.solve(P, /*weak=*/false, threads, nullptr, 0.0);

    auto end = std::chrono::steady_clock::now();
    proc_pid_rusage(getpid(), RUSAGE_INFO_V4, (rusage_info_t *)&ru_end);

    BenchmarkResult br;
    br.time_ms = std::chrono::duration<double, std::milli>(end - start).count();
    br.nodes = solver.getNodeCount();
    br.instructions = ru_end.ri_instructions - ru_start.ri_instructions;
    br.cycles = ru_end.ri_cycles - ru_start.ri_cycles;
    br.user_time_ns = ru_end.ri_user_time - ru_start.ri_user_time;
    br.qos_user_interactive_time_ns = ru_end.ri_cpu_time_qos_user_interactive - ru_start.ri_cpu_time_qos_user_interactive;
    br.score = result.score;

    return br;
}

int main(int argc, char** argv) {
    int w = 7;
    int h = 6;
    size_t cache_mb = 1024;

    if (argc >= 3) {
        w = std::stoi(argv[1]);
        h = std::stoi(argv[2]);
    }
    if (argc >= 4) {
        cache_mb = std::stoull(argv[3]);
    }

    std::cout << "========================================================================\n";
    std::cout << "XNU Benchmark: WEAK SOLVE " << w << "x" << h << " with " << cache_mb << " MB cache\n";
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
              << std::setw(12) << "Time (ms)"
              << std::setw(15) << "Nodes/sec"
              << std::setw(18) << "Cycles/Node"
              << std::setw(18) << "Instr/Node"
              << std::setw(12) << "IPC"
              << std::setw(15) << "UserTime(ms)"
              << std::setw(8)  << "Score"
              << std::endl;

    for (int t : threadCounts) {
        BenchmarkResult br;
        if (w == 7 && h == 6) br = benchmark_solve<7, 6>(t, cache_mb);
        else if (w == 7 && h == 7) br = benchmark_solve<7, 7>(t, cache_mb);
        else if (w == 7 && h == 9) br = benchmark_solve<7, 9>(t, cache_mb);
        else {
            std::cout << "Unsupported board size " << w << "x" << h << "\n";
            return 1;
        }

        double nps = br.time_ms > 0 ? br.nodes / (br.time_ms / 1000.0) : 0.0;
        double cpn = br.nodes > 0 ? (double)br.cycles / br.nodes : 0.0;
        double ipn = br.nodes > 0 ? (double)br.instructions / br.nodes : 0.0;
        double ipc = br.cycles > 0 ? (double)br.instructions / br.cycles : 0.0;

        std::cout << std::left
                  << std::setw(8) << t
                  << std::setw(12) << std::fixed << std::setprecision(0) << br.time_ms
                  << std::setw(15) << nps
                  << std::setw(18) << std::setprecision(2) << cpn
                  << std::setw(18) << ipn
                  << std::setw(12) << ipc
                  << std::setw(15) << std::setprecision(0) << br.user_time_ns / 1e6
                  << std::setw(8)  << br.score
                  << std::endl;
    }
    return 0;
}
