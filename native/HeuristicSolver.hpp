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

namespace GameSolver {
namespace Connect4 {

#ifndef HEURISTIC_TABLE_SIZE
#define HEURISTIC_TABLE_SIZE 22
#endif

template <int WIDTH, int HEIGHT>
class HeuristicSolver {
 private:
  using position_t = typename GenericPosition<WIDTH, HEIGHT>::position_t;
  
  std::unique_ptr<TranspositionTable<uint64_t, uint32_t, 32>> transTable;
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

  HeuristicSolver(); // Constructor
};

} // namespace Connect4
} // namespace GameSolver

#include "HeuristicSolver.cpp"

#endif
