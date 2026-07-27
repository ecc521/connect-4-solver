// Multi-threaded parity harness: solves every position in a corpus at each
// requested thread count (exact + weak) and compares scores against the
// single-threaded result / expected score. Exercises the real in-search
// multithreaded solve() path — the main bench's parity mode only ever calls
// solve() with threads=1.
//
// Build (same flags as bench_native):
//   clang++ -std=c++20 -O3 -DNDEBUG -DUSE_PTHREADS -Inative -march=native \
//     -DBOARD_WIDTH_MACRO=7 -DBOARD_HEIGHT_MACRO=6 \
//     tools/benchmarks/parity_mt.cpp -o parity_mt_7x6
// Run:
//   ./parity_mt_7x6 --file=test-data/positions_7x6.txt --threads 1,2,4,6,8,12
#include <algorithm>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#ifndef BOARD_WIDTH_MACRO
#define BOARD_WIDTH_MACRO 7
#endif
#ifndef BOARD_HEIGHT_MACRO
#define BOARD_HEIGHT_MACRO 6
#endif

#include "../../native/Solver.hpp"
#include "../../native/TranspositionTable.hpp"
#include "../../native/ThreadPool.hpp"

using namespace GameSolver::Connect4;

struct BenchPos { std::string pos; int expected_score; };

static std::vector<BenchPos> load_positions(const std::string &path) {
  std::ifstream file(path);
  std::vector<BenchPos> positions;
  std::string line;
  while (std::getline(file, line)) {
    if (line.empty() || line[0] == '\r') continue;
    std::stringstream ss(line);
    std::string pos; int score = 0;
    ss >> pos >> score;
    if (pos.empty()) continue;
    positions.push_back({pos, score});
  }
  return positions;
}

int main(int argc, char* argv[]) {
  constexpr int W = BOARD_WIDTH_MACRO, H = BOARD_HEIGHT_MACRO;
  std::string pos_file = "test-data/positions_7x6.txt";
  std::vector<int> thread_counts = {1, 2, 4, 6, 8, 12};
  int limit = 0;
  bool do_analyze = false;

  for (int i = 1; i < argc; i++) {
    std::string arg = argv[i];
    if (arg.find("--file=") == 0) pos_file = arg.substr(7);
    else if (arg == "--analyze") do_analyze = true;
    else if (arg == "--limit" && i + 1 < argc) limit = std::stoi(argv[++i]);
    else if (arg == "--threads" && i + 1 < argc) {
      thread_counts.clear();
      std::stringstream ss(argv[++i]); std::string tok;
      while (std::getline(ss, tok, ',')) if (!tok.empty()) thread_counts.push_back(std::stoi(tok));
    }
  }

  auto all = load_positions(pos_file);
  std::vector<BenchPos> positions;
  for (auto &bp : all) {
    GenericPosition<W, H> p;
    if (p.play(bp.pos) == bp.pos.size()) positions.push_back(bp);
    if (limit && (int)positions.size() >= limit) break;
  }
  if (positions.empty()) { std::cerr << "no positions from " << pos_file << "\n"; return 1; }

  size_t mem_size = 256ULL * 1024 * 1024;
  if (const char* env_p = std::getenv("CACHE_MB")) mem_size = std::stoull(env_p) * 1024 * 1024;
  auto cache = Solver<W, H>::createCache(mem_size);
  auto solver = Solver<W, H>::createWithCache(cache.get());

  int failures = 0, checked = 0;

  if (do_analyze) {
    // analyze() parity: per position, the score vector at every thread count
    // must match the single-threaded vector, and max(scores) must equal the
    // expected solve score.
    for (auto &bp : positions) {
      GenericPosition<W, H> p;
      p.play(bp.pos);
      cache->reset();
      auto ref = solver->analyze(p, false, 1, nullptr);
      int best = -1000;
      for (int v : ref) best = std::max(best, v);
      checked++;
      if (best != bp.expected_score) {
        failures++;
        std::cerr << "ANALYZE FAIL ref pos=" << bp.pos << " max=" << best
                  << " want=" << bp.expected_score << "\n";
      }
      for (int threads : thread_counts) {
        if (threads == 1) continue;
        cache->reset();
        auto got = solver->analyze(p, false, threads, nullptr);
        checked++;
        if (got != ref) {
          failures++;
          std::cerr << "ANALYZE FAIL t=" << threads << " pos=" << bp.pos << " vectors differ\n";
        }
      }
    }
    std::cout << (failures == 0 ? "PARITY OK" : "PARITY FAILURES") << " (" << checked
              << " analyze checks, " << failures << " failures)\n";
    return failures == 0 ? 0 : 1;
  }

  for (int threads : thread_counts) {
    cache->reset();
    for (auto &bp : positions) {
      GenericPosition<W, H> p;
      p.play(bp.pos);
      auto exact = solver->solve(p, false, threads, nullptr);
      checked++;
      if (exact.score != bp.expected_score) {
        failures++;
        std::cerr << "PARITY FAIL exact t=" << threads << " pos=" << bp.pos
                  << " got=" << exact.score << " want=" << bp.expected_score << "\n";
      }
      auto weak = solver->solve(p, true, threads, nullptr);
      checked++;
      int want_sign = bp.expected_score > 0 ? 1 : bp.expected_score < 0 ? -1 : 0;
      int got_sign = weak.score > 0 ? 1 : weak.score < 0 ? -1 : 0;
      if (got_sign != want_sign) {
        failures++;
        std::cerr << "PARITY FAIL weak t=" << threads << " pos=" << bp.pos
                  << " got=" << weak.score << " want sign=" << want_sign << "\n";
      }
    }
    std::cout << "threads=" << threads << ": " << positions.size()
              << " positions x{exact,weak} done, cumulative failures=" << failures << "\n";
  }
  std::cout << (failures == 0 ? "PARITY OK" : "PARITY FAILURES") << " (" << checked
            << " checks, " << failures << " failures)\n";
  return failures == 0 ? 0 : 1;
}
