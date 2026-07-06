/**
 * bench_book_lookup.cpp
 *
 * Compares lookup latency of four book/table types:
 *   - MutableBook  (std::unordered_map, lossless, for collection)
 *   - FlatMap      (ankerl::unordered_dense, flat open-addressing, lossless)
 *   - TranspositionTable  (fixed hash array, lossy, the solver's TT)
 *   - DenseBook  (sorted array, binary search, on-disk format)
 *
 * Two access patterns per structure:
 *   sequential  — iterate entries in insertion order (cache-warm)
 *   random      — shuffled access (cache-cold, representative of search)
 *
 * Compile from tools/:
 *   g++ -std=c++17 -O3 -DNDEBUG -I../native -march=native \
 *       -o bench_book_lookup bench_book_lookup.cpp
 * Run:
 *   ./bench_book_lookup [N]   (default N = 1 000 000)
 */

#include <chrono>
#include <cstdio>
#include <cstdint>
#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <algorithm>
#include <random>
#include <numeric>
#include <sstream>
#include "../native/vendor/ankerl_unordered_dense.h"
#include "../native/vendor/phmap.h"

#include "Position.hpp"
#include "OpeningBook.hpp"
#include "TranspositionTable.hpp"

using namespace GameSolver::Connect4;

static constexpr int W = 7;
static constexpr int H = 6;
static constexpr int ABS_MIN = (W * H + 1) / 2;   // 21

// TT type matching SolverImpl<7,6>'s transTable member exactly.
// VALUE_BITS=7, WorkBits=W=7, FlagBits=0, MoveBits=3 (W<8), KeyType=uint64_t
using TT = TranspositionTable<uint64_t, uint8_t, 7, 7, 0, 3, uint64_t>;

using Pos  = GenericPosition<W, H>;
using Book = MutableBook<W, H>;
using Base = OpeningBookBase<W, H>;

// ── Key generation ───────────────────────────────────────────────────────────

// Play a random valid game, return the key3() of each intermediate position.
static std::vector<uint64_t> random_game_keys(std::mt19937& rng, int max_depth) {
    std::vector<uint64_t> keys;
    Pos p;
    while (p.nbMoves() < max_depth) {
        std::vector<int> valid;
        for (int c = 0; c < W; c++) if (p.canPlay(c) && !p.isWinningMove(c)) valid.push_back(c);
        if (valid.empty()) break;
        std::uniform_int_distribution<int> pick(0, (int)valid.size() - 1);
        p.playCol(valid[pick(rng)]);
        keys.push_back((uint64_t)p.key3());
    }
    return keys;
}

// Generate N distinct keys by playing random games.
static std::vector<uint64_t> generate_keys(size_t N, int max_depth = 20) {
    std::mt19937 rng(0xC4B00);
    std::vector<uint64_t> all;
    all.reserve(N * 2);
    while (all.size() < N * 2) {
        auto g = random_game_keys(rng, max_depth);
        for (auto k : g) all.push_back(k);
    }
    std::sort(all.begin(), all.end());
    all.erase(std::unique(all.begin(), all.end()), all.end());
    if (all.size() > N) all.resize(N);
    return all;
}

// ── Timer ────────────────────────────────────────────────────────────────────

using bench_clock = std::chrono::steady_clock;

static double elapsed_ns(bench_clock::time_point t0, bench_clock::time_point t1) {
    return std::chrono::duration<double, std::nano>(t1 - t0).count();
}

// ── Report ───────────────────────────────────────────────────────────────────

static void report(const std::string& name, const std::string& pattern,
                   size_t N, double total_ns, uint64_t checksum) {
    double ns_per = total_ns / (double)N;
    std::cout << std::left  << std::setw(22) << name
              << std::left  << std::setw(14) << pattern
              << std::right << std::setw(10) << std::fixed << std::setprecision(1) << ns_per
              << " ns/lookup"
              << "   (chk=" << checksum << ")\n";
}

// ── Benchmarks ───────────────────────────────────────────────────────────────


template<typename Map>
static void bench_map(const std::string& label,
                      const std::vector<uint64_t>& keys,
                      const std::vector<size_t>& rand_idx) {
    const size_t N = keys.size();
    uint8_t val = 42;

    // ── Insert ────────────────────────────────────────────────────────────────
    Map m;
    m.reserve(N);
    {
        auto t0 = bench_clock::now();
        for (auto k : keys) m[k] = (uint16_t)val | ((uint16_t)(val + 1) << 8);
        auto t1 = bench_clock::now();
        report(label, "insert", N, elapsed_ns(t0,t1), 0);
    }

    // ── Lookup sequential ─────────────────────────────────────────────────────
    {
        uint64_t sum = 0;
        auto t0 = bench_clock::now();
        for (auto k : keys) {
            auto it = m.find(k);
            sum += (it != m.end()) ? it->second : 0;
        }
        auto t1 = bench_clock::now();
        report(label, "lookup seq", N, elapsed_ns(t0,t1), sum);
    }

    // ── Lookup random ─────────────────────────────────────────────────────────
    {
        uint64_t sum = 0;
        auto t0 = bench_clock::now();
        for (auto i : rand_idx) {
            auto it = m.find(keys[i]);
            sum += (it != m.end()) ? it->second : 0;
        }
        auto t1 = bench_clock::now();
        report(label, "lookup rnd", N, elapsed_ns(t0,t1), sum);
    }
}

static void bench_tt(const std::vector<uint64_t>& keys,
                     const std::vector<size_t>& rand_idx,
                     size_t tt_bytes) {
    const size_t N = keys.size();
    TT tt(tt_bytes);
    if (!tt.isValid()) { std::cerr << "TT allocation failed\n"; return; }

    // Insert entries (value=42, work=10, move=3)
    for (auto k : keys) tt.put(k, 42, 10, 3);

    // Sequential
    {
        uint64_t sum = 0;
        auto t0 = bench_clock::now();
        for (auto k : keys) sum += tt.get(k);
        auto t1 = bench_clock::now();
        std::string label = "TT(" + std::to_string(tt_bytes>>20) + "MB)";
        report(label, "sequential", N, elapsed_ns(t0,t1), sum);
    }

    // Random
    {
        uint64_t sum = 0;
        auto t0 = bench_clock::now();
        for (auto i : rand_idx) sum += tt.get(keys[i]);
        auto t1 = bench_clock::now();
        std::string label = "TT(" + std::to_string(tt_bytes>>20) + "MB)";
        report(label, "random", N, elapsed_ns(t0,t1), sum);
    }
}

static void bench_dense_book(const std::vector<uint64_t>& keys,
                              const std::vector<size_t>& rand_idx) {
    const size_t N = keys.size();

    // Build DenseBook via MutableBook serialise → reload
    {
        // We don't have real Positions here, so we'll use the DenseBook directly
        // via its EntryList constructor path. Build an EntryList and save/load.
        Base::EntryList items;
        items.reserve(N);
        uint8_t val = 42;
        for (auto k : keys)
            items.push_back({(typename Base::pos_t)k, (uint16_t)val | ((uint16_t)(val+1)<<8)});

        Base::save_dense("/tmp/bench_dense.book", 30, std::move(items), BookKind::Bounded);
    }
    auto db = Base::load("/tmp/bench_dense.book", W, H);
    if (!db) { std::cerr << "DenseBook load failed\n"; return; }

    // We need GenericPosition objects for query(). Build them from keys would
    // require reversing key3(), so instead we benchmark the lower_bound path
    // directly on the underlying sorted array, replicating what query() does.
    //
    // Build a sorted keys vector (as the DenseBook internally has) and time it.
    std::vector<uint64_t> sorted_keys = keys;
    std::sort(sorted_keys.begin(), sorted_keys.end());

    // Sequential
    {
        uint64_t sum = 0;
        auto t0 = bench_clock::now();
        for (auto k : sorted_keys) {
            auto it = std::lower_bound(sorted_keys.begin(), sorted_keys.end(), k);
            sum += (it != sorted_keys.end() && *it == k) ? 1 : 0;
        }
        auto t1 = bench_clock::now();
        report("DenseBook", "sequential", N, elapsed_ns(t0,t1), sum);
    }

    // Random (using rand_idx over sorted_keys)
    {
        uint64_t sum = 0;
        auto t0 = bench_clock::now();
        for (auto i : rand_idx) {
            uint64_t target = sorted_keys[i];
            auto it = std::lower_bound(sorted_keys.begin(), sorted_keys.end(), target);
            sum += (it != sorted_keys.end() && *it == target) ? 1 : 0;
        }
        auto t1 = bench_clock::now();
        report("DenseBook", "random", N, elapsed_ns(t0,t1), sum);
    }
}

// ── Main ─────────────────────────────────────────────────────────────────────

int main(int argc, char** argv) {
    size_t N = 1'000'000;
    if (argc > 1) N = (size_t)std::stoull(argv[1]);

    std::cout << "Generating " << N << " keys...\n";
    auto keys = generate_keys(N);
    std::cout << "Got " << keys.size() << " distinct keys.\n\n";
    N = keys.size();

    // Random access index
    std::vector<size_t> rand_idx(N);
    std::iota(rand_idx.begin(), rand_idx.end(), 0);
    std::mt19937 rng(42);
    std::shuffle(rand_idx.begin(), rand_idx.end(), rng);

    std::cout << std::left  << std::setw(22) << "Structure"
              << std::left  << std::setw(14) << "Pattern"
              << std::right << std::setw(10) << "Latency"
              << "\n"
              << std::string(60, '-') << "\n";

    bench_map<std::unordered_map<uint64_t,uint16_t>>(
        "std::unordered_map", keys, rand_idx);
    std::cout << "\n";

    bench_map<ankerl::unordered_dense::map<uint64_t,uint16_t>>(
        "ankerl::u_dense", keys, rand_idx);
    std::cout << "\n";

    bench_map<phmap::flat_hash_map<uint64_t,uint16_t>>(
        "phmap (Abseil)", keys, rand_idx);
    std::cout << "\n";

    // TT small (32 MB — solver default / WASM)
    bench_tt(keys, rand_idx, 32ULL << 20);
    // TT large (256 MB — typical native)
    bench_tt(keys, rand_idx, 256ULL << 20);
    std::cout << "\n";

    bench_dense_book(keys, rand_idx);

    return 0;
}
