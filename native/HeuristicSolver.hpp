/*
 * This file is part of Connect4 Game Solver <http://connect4.gamesolver.org>
 * Copyright (C) 2017-2019 Pascal Pons <contact@gamesolver.org>
 */

#ifndef HEURISTIC_SOLVER_HPP
#define HEURISTIC_SOLVER_HPP

#include <vector>
#include <string>
#include <atomic>
#include <utility>
#include <memory>
#include "Position.hpp"
#include "TranspositionTable.hpp"
#include "Cache.hpp"

namespace GameSolver {
namespace Connect4 {

class HeuristicCache : public Cache {
 public:
  std::shared_ptr<TranspositionTable<uint64_t, uint32_t, 32>> transTable;
  HeuristicCache(size_t table_bytes) : transTable(std::make_shared<TranspositionTable<uint64_t, uint32_t, 32>>(table_bytes)) {}
  void reset() override { transTable->reset(); }
};

#ifndef HEURISTIC_TABLE_SIZE
#define HEURISTIC_TABLE_SIZE 22
#endif

template <int WIDTH, int HEIGHT>
class HeuristicSolver {
 private:
  using position_t = typename GenericPosition<WIDTH, HEIGHT>::position_t;
  
  std::shared_ptr<TranspositionTable<uint64_t, uint32_t, 32>> transTable;
  std::atomic<unsigned long long> nodeCount; // counter of explored nodes.
  std::atomic<bool> stopSearch;
  int columnOrder[WIDTH]; // column exploration order
  int32_t history[WIDTH * (HEIGHT + 1)];

  /**
   * Heuristic negamax with depth limit.
   */
  int negamax_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int alpha, int beta, int depth, double end_time_ms = 0.0);

 public:
  static const int INVALID_MOVE = -1000000;

  // Returns the heuristic score of a position via iterative deepening
  std::pair<int, int> solve_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int max_depth, double end_time_ms = 0.0, bool reset_tt = true);

  /**
   * Evaluate possible heuristic moves for current player
   * @return a vector of heuristic scores for each column
   */
  std::pair<std::vector<int>, int> analyze_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int max_depth, int threads = 1, double timeout_ms = 0.0);

  unsigned long long getNodeCount() const {
    return nodeCount;
  }

  void reset() {
    nodeCount = 0;
    stopSearch = false;
    transTable->reset();
    for (int i = 0; i < WIDTH * (HEIGHT + 1); i++) {
      history[i] = GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS[i];
    }
  }

  HeuristicSolver(std::shared_ptr<TranspositionTable<uint64_t, uint32_t, 32>> cache); // Constructor

  static std::unique_ptr<Cache> createCache(size_t table_bytes) {
    return std::make_unique<HeuristicCache>(table_bytes);
  }

  static std::unique_ptr<HeuristicSolver<WIDTH, HEIGHT>> createWithCache(Cache* cache) {
    if (auto c = dynamic_cast<HeuristicCache*>(cache)) {
      return std::make_unique<HeuristicSolver<WIDTH, HEIGHT>>(c->transTable);
    }
    return nullptr;
  }
};

} // namespace Connect4
} // namespace GameSolver

#include "HeuristicSolver.cpp"

#endif
