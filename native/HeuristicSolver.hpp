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
  std::shared_ptr<void> getSharedPtr() override { return transTable; }
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

  using TrompWeightsT = typename std::conditional<WIDTH == -1, std::vector<int32_t>, std::array<int32_t, WIDTH == -1 ? 1 : WIDTH * (HEIGHT + 1)>>::type;
  using ColumnOrderT = typename std::conditional<WIDTH == -1, std::vector<int>, std::array<int, WIDTH == -1 ? 1 : WIDTH>>::type;
  using CenterMasksT = typename std::conditional<WIDTH == -1, std::vector<position_t>, std::array<position_t, WIDTH == -1 ? 1 : WIDTH>>::type;
  using CenterWeightsT = typename std::conditional<WIDTH == -1, std::vector<int>, std::array<int, WIDTH == -1 ? 1 : WIDTH>>::type;

  TrompWeightsT TROMP_WEIGHTS;
  ColumnOrderT COLUMN_ORDER;
  CenterMasksT CENTER_MASKS;
  CenterWeightsT CENTER_WEIGHTS;

  void init_tables(int w, int h) {
      if constexpr (WIDTH == -1) {
          TROMP_WEIGHTS.resize(w * (h + 1));
          COLUMN_ORDER.resize(w);
          CENTER_MASKS.resize(w);
          CENTER_WEIGHTS.resize(w);
          history.resize(w);
      }
      for (int i = 0; i < w; i++) {
          COLUMN_ORDER[i] = w / 2 + (1 - 2 * (i % 2)) * (i + 1) / 2;
          CENTER_MASKS[i] = ((position_t(1) << h) - 1) << (i * (h + 1));
          int dist = i - w / 2;
          if (dist < 0) dist = -dist;
          CENTER_WEIGHTS[i] = w - dist;
      }
      for (int col = 0; col < w; col++) {
        for (int row = 0; row < h; row++) {
            int i = col < w / 2 ? col : w - 1 - col;
            int hh = row < h / 2 ? row : h - 1 - row;
            int min_3_i = i < 3 ? i : 3;
            int min_3_h = hh < 3 ? hh : 3;
            int max_0_3_i = (3 - i) > 0 ? (3 - i) : 0;
            int diff = min_3_h - max_0_3_i;
            int max_neg1_diff = diff > -1 ? diff : -1;
            int min_i_h = i < hh ? i : hh;
            int min_3_min_i_h = min_i_h < 3 ? min_i_h : 3;
            int val = 4 + min_3_i + max_neg1_diff + min_3_min_i_h + min_3_h;
            TROMP_WEIGHTS[col * (h + 1) + row] = val;
        }
      }
  }

  using HistoryT = typename std::conditional<WIDTH == -1, std::vector<uint32_t>, std::array<uint32_t, WIDTH == -1 ? 1 : WIDTH>>::type;
  mutable HistoryT history;

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
    for (size_t i = 0; i < history.size(); i++) {
      history[i] = 0; // HeuristicSolver just uses history per-column, initialize to 0
    }
  }

  void loadBook(const OpeningBookBase<WIDTH, HEIGHT>* b) override {
    book = const_cast<OpeningBookBase<WIDTH, HEIGHT>*>(b);
  }

  bool isBusy() const override { return isSearching.load(std::memory_order_relaxed); }
  void setBusy(bool busy) override { isSearching.store(busy, std::memory_order_relaxed); }

  HeuristicSolver(std::shared_ptr<TransTable> cache, int w = WIDTH == -1 ? 7 : WIDTH, int h = HEIGHT == -1 ? 6 : HEIGHT) : transTable(cache), nodeCount(0), pool(std::make_unique<ThreadPool>()) {
    init_tables(w, h);
  }
  HeuristicSolver() : HeuristicSolver(std::make_shared<TransTable>((1ULL << HEURISTIC_TABLE_SIZE) * 16ULL)) {}

  static std::unique_ptr<::GameSolver::Connect4::Cache> createCache(size_t table_bytes, int w = WIDTH == -1 ? 7 : WIDTH, int h = HEIGHT == -1 ? 6 : HEIGHT) {
    auto* c = new (std::nothrow) HeuristicCache<WIDTH, HEIGHT>(table_bytes);
    if (c && c->isValid()) return std::unique_ptr<::GameSolver::Connect4::Cache>(c);
    delete c;
    return nullptr;
  }

  static std::unique_ptr<HeuristicSolver<WIDTH, HEIGHT>> createWithCache(::GameSolver::Connect4::Cache* cache, int w = WIDTH == -1 ? 7 : WIDTH, int h = HEIGHT == -1 ? 6 : HEIGHT) {
    if (auto c = dynamic_cast<HeuristicCache<WIDTH, HEIGHT>*>(cache)) {
      auto* s = new (std::nothrow) HeuristicSolver<WIDTH, HEIGHT>(c->transTable, w, h);
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
