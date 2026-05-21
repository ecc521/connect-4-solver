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
#include "OpeningBook.hpp"
#include "Cache.hpp"
#include "NNUEAccumulator.hpp"
#include "NNUE.hpp"
#include "SolverResult.hpp"
#include "ThreadPool.hpp"
#include "Solver.hpp"
#include <new>
namespace GameSolver {
namespace Connect4 {



template <int WIDTH, int HEIGHT>
class HeuristicCache : public Cache {
 public:
  using position_t = typename GenericPosition<WIDTH, HEIGHT>::position_t;
  using TransTable = TranspositionTable<position_t, int16_t, 16, 7, 2, 5, position_t>;
  std::shared_ptr<TransTable> transTable;
  
  HeuristicCache(size_t table_bytes) {
      auto* t = new (std::nothrow) TransTable(table_bytes);
      if (t && t->isValid()) {
          transTable.reset(t);
      } else {
          delete t;
          return;
      }

      // Calculate CRT safety for Heuristic Table
      int shift_amount = 16 + 7 + 2 + 5; // ValueBits + WorkBits + FlagBits + MoveBits
      int available_bits = sizeof(position_t) * 8 - shift_amount;
      int board_bits = WIDTH * (HEIGHT + 1);

      if (board_bits > available_bits) {
          int index_bits = board_bits - available_bits;
          if (index_bits < 64) {
              uint64_t required_buckets = 1ULL << index_bits;
              if (transTable->getSize() / 2 < required_buckets) {
                  throw std::runtime_error("Heuristic Table allocated memory is mathematically too small to guarantee collision-free CRT for this board size.");
              }
          }
      }
  }
  bool isValid() const { return transTable != nullptr; }
  void reset() override { transTable->reset(); }
  int getSlotWidth() const override { return 128; }
};

#ifndef HEURISTIC_TABLE_SIZE
#define HEURISTIC_TABLE_SIZE 22
#endif

template <int WIDTH, int HEIGHT>
class HeuristicSolver : public ::GameSolver::Connect4::Solver<WIDTH, HEIGHT> {
 private:
  using position_t = typename GenericPosition<WIDTH, HEIGHT>::position_t;
  
  using TransTable = TranspositionTable<position_t, int16_t, 16, 7, 2, 5, position_t>;
  std::shared_ptr<TransTable> transTable;
  OpeningBookBase<WIDTH, HEIGHT>* book = nullptr;
  std::atomic<unsigned long long> nodeCount; // counter of explored nodes.
  std::atomic<bool> isSearching{false};
  std::atomic<bool> stopSearch;
  std::atomic<double> endTime{0.0};
  std::unique_ptr<ThreadPool> pool;

  // Dynamic history heuristic table
  mutable uint32_t history[WIDTH * (HEIGHT + 1)];

  /**
   * Heuristic negamax with depth limit.
   */
  int negamax_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int alpha, int beta, int depth, double end_time_ms, NNUEAccumulator<WIDTH, HEIGHT>& acc, uint32_t& localCount);

 public:
  static const int INVALID_MOVE = -1000000;

  void stop() override { stopSearch.store(true, std::memory_order_relaxed); }
  void setTimeout(double end_time_ms) override { endTime.store(end_time_ms, std::memory_order_relaxed); }
  bool isAborted() const override { return stopSearch.load(std::memory_order_relaxed); }

  // Returns the heuristic score of a position via iterative deepening
  ::GameSolver::Connect4::SolverResult solve(const GenericPosition<WIDTH, HEIGHT> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) override;

  // Evaluate possible heuristic moves for current player
  std::vector<int> analyze(const GenericPosition<WIDTH, HEIGHT> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) override;

  // Legacy alias for compatibility (calling the new solve)
  ::GameSolver::Connect4::SolverResult solve_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int max_depth, double end_time_ms = 0.0, bool reset_tt = true, NNUEAccumulator<WIDTH, HEIGHT>* acc = nullptr, int threads = 1);


  // Legacy alias for compatibility
  std::pair<std::vector<int>, int> analyze_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int max_depth, int threads = 1, double end_time_ms = 0.0);

  unsigned long long getNodeCount() const override {
    return nodeCount;
  }

  void reset() override {
    nodeCount = 0;
    stopSearch = false;
    transTable->reset();
    for (int i = 0; i < WIDTH * (HEIGHT + 1); i++) {
      history[i] = GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS[i];
    }
  }

  void loadBook(const OpeningBookBase<WIDTH, HEIGHT>* b) override {
    book = const_cast<OpeningBookBase<WIDTH, HEIGHT>*>(b);
  }

  bool isBusy() const override { return isSearching.load(std::memory_order_relaxed); }
  void setBusy(bool busy) override { isSearching.store(busy, std::memory_order_relaxed); }

  HeuristicSolver(std::shared_ptr<TransTable> cache);
  HeuristicSolver() : HeuristicSolver(std::make_shared<TransTable>((1ULL << HEURISTIC_TABLE_SIZE) * 16ULL)) {}

  static std::unique_ptr<::GameSolver::Connect4::Cache> createCache(size_t table_bytes) {
    auto* c = new (std::nothrow) HeuristicCache<WIDTH, HEIGHT>(table_bytes);
    if (c && c->isValid()) return std::unique_ptr<::GameSolver::Connect4::Cache>(c);
    delete c;
    return nullptr;
  }

  static std::unique_ptr<HeuristicSolver<WIDTH, HEIGHT>> createWithCache(::GameSolver::Connect4::Cache* cache) {
    if (auto c = dynamic_cast<HeuristicCache<WIDTH, HEIGHT>*>(cache)) {
      auto* s = new (std::nothrow) HeuristicSolver<WIDTH, HEIGHT>(c->transTable);
      if (!s) return nullptr;
      return std::unique_ptr<HeuristicSolver<WIDTH, HEIGHT>>(s);
    }
    return nullptr;
  }
};

} // namespace Connect4
} // namespace GameSolver

#include "HeuristicSolver.cpp"

#endif
