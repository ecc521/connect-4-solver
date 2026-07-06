/**
 * bench_collect.cpp
 *
 * Measures per-node overhead of collect_book hooks, including mutex cost at
 * various thread counts.
 *
 * Single-thread configs (isolate hook + mutex overhead):
 *   A  null        — collect_book=nullptr, hooks in code but never fire
 *   B  mutex-0     — collect active depth=-1: mutex acquired+released but no actual work
 *   C  shallow-8   — collect at depth ≤ 8, mutex held for narrow()
 *   D  full-42     — collect every node, mutex held for every hook
 *
 * Multi-thread configs (measure mutex contention at N threads):
 *   F  1T  shallow-8
 *   G  2T  shallow-8
 *   H  4T  shallow-8
 *
 * Compile from tools/:
 *   g++ -std=c++17 -O3 -DNDEBUG -DUSE_PTHREADS -I../native -march=native \
 *       -pthread -o bench_collect bench_collect.cpp
 * Run:
 *   ./bench_collect [CPU_GHZ=3.5]
 */

#include <chrono>
#include <cstdio>
#include <cstring>
#include <vector>
#include <string>
#include <numeric>
#include <algorithm>
#include <cstdlib>

#include "Position.hpp"
#include "Solver.hpp"
#include "OpeningBook.hpp"

using namespace GameSolver::Connect4;

static constexpr int W = 7;
static constexpr int H = 6;
using Pos  = GenericPosition<W, H>;
using SI   = SolverImpl<W, H>;
using Book = MutableBook<W, H>;

static const char* POSITIONS[] = {
    "32164625", "6146", "243335424257", "5512243243536", "22144426444",
    "265756512", "65444437612", "17516442226766", "7343363417254", "74746315233",
    "5654767662", "74642572132", "51756773145177", "165746146225", "1562527227511",
    "43745416472735", "42434653771434", "1626434452343", "6513243566177", "43623536647361",
};
static constexpr int N_POS = (int)(sizeof(POSITIONS) / sizeof(POSITIONS[0]));

using clk = std::chrono::steady_clock;
static double elapsed_ns(clk::time_point t0, clk::time_point t1) {
    return std::chrono::duration<double, std::nano>(t1 - t0).count();
}
static Pos parse_pos(const char* s) {
    Pos p;
    for (const char* c = s; *c; ++c) p.playCol((int)(*c - '1'));
    return p;
}

struct Result {
    double ns_per_node;
    double nodes_per_sec;
    size_t book_entries;
};

static Result run_config(const std::vector<Pos>& positions,
                         Book* cbook, int threads,
                         int reps, size_t tt_bytes)
{
    SI solver(tt_bytes);
    if (cbook) solver.setCollectBook(cbook);

    double total_ns    = 0.0;
    unsigned long long total_nodes = 0;

    for (int r = 0; r < reps; ++r) {
        for (int i = 0; i < N_POS; ++i) {
            solver.reset();
            auto t0 = clk::now();
            solver.solve(positions[i], /*weak=*/false, threads);
            auto t1 = clk::now();
            total_ns    += elapsed_ns(t0, t1);
            total_nodes += solver.getNodeCount();
        }
    }

    Result r{};
    r.ns_per_node   = total_ns / (double)total_nodes;
    r.nodes_per_sec = (double)total_nodes / (total_ns * 1e-9);
    r.book_entries  = cbook ? cbook->size() : 0;
    return r;
}

int main(int argc, char** argv) {
    double cpu_ghz = 3.5;
    if (argc > 1) cpu_ghz = std::atof(argv[1]);

    constexpr int REPS  = 5;
    constexpr size_t TT = 256ULL << 20;

    std::vector<Pos> positions;
    positions.reserve(N_POS);
    for (int i = 0; i < N_POS; ++i)
        positions.push_back(parse_pos(POSITIONS[i]));

    auto hdr = [&]() {
        printf("%-22s %3s  %10s  %10s  %8s\n",
               "Config", " T", "ns/node", "cycles/node", "Mnodes/s");
        printf("%s\n", std::string(60, '-').c_str());
    };
    auto print = [&](const char* label, int threads, const Result& r) {
        printf("%-22s %3d  %10.2f  %10.1f  %8.2f   entries=%zu\n",
               label, threads,
               r.ns_per_node, r.ns_per_node * cpu_ghz,
               r.nodes_per_sec / 1e6, r.book_entries);
    };
    auto delta = [](const Result& base, const Result& r) -> double {
        return r.ns_per_node - base.ns_per_node;
    };

    printf("bench_collect  —  %d positions × %d reps, 256 MB TT, CPU=%.1f GHz\n\n",
           N_POS, REPS, cpu_ghz);

    // ── Single-thread: isolate hook + mutex overhead ──────────────────────────
    printf("=== Single-thread: hook & mutex overhead ===\n");
    hdr();

    Book bk_armed(-1);
    Book bk_shallow(8);
    Book bk_full(42);

    auto rA = run_config(positions, nullptr,     1, REPS, TT); print("A null-ptr",       1, rA);
    auto rB = run_config(positions, &bk_armed,   1, REPS, TT); print("B mutex-depth=-1", 1, rB);
    auto rC = run_config(positions, &bk_shallow, 1, REPS, TT); print("C mutex-depth=8",  1, rC);
    auto rD = run_config(positions, &bk_full,    1, REPS, TT); print("D mutex-depth=42", 1, rD);

    printf("\nOverhead vs A (null-ptr):\n");
    printf("  B depth=-1 (pointer set, depth guard rejects every node):  %+.2f ns/node\n", delta(rA, rB));
    printf("  C depth=8  (lock+narrow at depth ≤ 8):                     %+.2f ns/node\n", delta(rA, rC));
    printf("  D depth=42 (lock+narrow every node):                        %+.2f ns/node\n", delta(rA, rD));

#ifdef USE_PTHREADS
    // ── Multi-thread: contention on MutableBook::mutex_ at depth ≤ 8 ─────────
    printf("\n=== Multi-thread: mutex contention (collect depth ≤ 8) ===\n");
    hdr();

    for (int T : {1, 2, 4}) {
        Book bk(8);
        auto r = run_config(positions, &bk, T, REPS, TT);
        char label[32];
        std::snprintf(label, sizeof(label), "depth=8 %dT", T);
        print(label, T, r);
    }
    printf("\n(delta vs 1T = contention overhead per node)\n");
#else
    printf("\n(compile with -DUSE_PTHREADS to run multi-thread configs)\n");
#endif

    return 0;
}
