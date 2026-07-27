// Root-band solve() benchmark: times solve() on one position (default: the
// empty board) at each requested thread count. This is the metric the
// precomputed-opening-tree use case actually cares about — long solves from
// (near-)root positions — as opposed to the mid-game duration-filtered corpus.
//
// Build like bench_native; run e.g.:
//   ./root_bench_7x7 --pos "" --weak --threads 1,6 --repeats 3
#include <algorithm>
#include <chrono>
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
using Clock = std::chrono::high_resolution_clock;

int main(int argc, char* argv[]) {
  constexpr int W = BOARD_WIDTH_MACRO, H = BOARD_HEIGHT_MACRO;
  std::string pos_str = "";
  std::vector<int> thread_counts = {1, 6};
  bool weak = false;
  int repeats = 1;

  for (int i = 1; i < argc; i++) {
    std::string arg = argv[i];
    if (arg == "--pos" && i + 1 < argc) pos_str = argv[++i];
    else if (arg == "--weak") weak = true;
    else if (arg == "--repeats" && i + 1 < argc) repeats = std::stoi(argv[++i]);
    else if (arg == "--threads" && i + 1 < argc) {
      thread_counts.clear();
      std::stringstream ss(argv[++i]); std::string tok;
      while (std::getline(ss, tok, ',')) if (!tok.empty()) thread_counts.push_back(std::stoi(tok));
    }
  }

  GenericPosition<W, H> p;
  if (!pos_str.empty() && p.play(pos_str) != pos_str.size()) {
    std::cerr << "bad position: " << pos_str << "\n";
    return 1;
  }

  size_t mem_size = 256ULL * 1024 * 1024;
  if (const char* env_p = std::getenv("CACHE_MB")) mem_size = std::stoull(env_p) * 1024 * 1024;
  auto cache = Solver<W, H>::createCache(mem_size);
  auto solver = Solver<W, H>::createWithCache(cache.get());

  std::cout << "board=" << W << "x" << H << " pos=\"" << pos_str << "\" mode="
            << (weak ? "weak" : "exact") << " tt=" << (mem_size >> 20) << "MB\n";
  double base_ms = 0;
  for (int threads : thread_counts) {
    double best = 1e18; int score = 0; unsigned long long nodes = 0, drops = 0, retries = 0;
    for (int r = 0; r < repeats; r++) {
      cache->reset();
      unsigned long long n0 = solver->getNodeCount();
      auto t0 = Clock::now();
      unsigned long long d0 = cache->getDropCount(), r0 = cache->getRetryCount();
      auto res = solver->solve(p, weak, threads, nullptr);
      double ms = std::chrono::duration<double, std::milli>(Clock::now() - t0).count();
      best = std::min(best, ms);
      score = res.score;
      nodes = solver->getNodeCount() - n0;
      drops = cache->getDropCount() - d0; retries = cache->getRetryCount() - r0;
    }
    if (threads == thread_counts.front()) base_ms = best;
    std::cout << "threads=" << threads << " score=" << score
              << " time_ms=" << (long long)best
              << " nodes=" << nodes
              << " speedup=" << (best > 0 ? base_ms / best : 0) << "x"
              << " drops=" << drops << " retries=" << retries << "\n";
  }
  return 0;
}
