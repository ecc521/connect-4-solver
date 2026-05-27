/*
 * This file is part of Connect4 Game Solver <http://connect4.gamesolver.org>
 * Copyright (C) 2017-2019 Pascal Pons <contact@gamesolver.org>
 *
 * Connect4 Game Solver is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Connect4 Game Solver is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Connect4 Game Solver. If not, see <http://www.gnu.org/licenses/>.
 */

#ifndef SOLVER_HPP
#define SOLVER_HPP

#include <vector>
#include <string>
#include <memory>
#include <atomic>
#include <cstdint>
#include <queue>
#include <functional>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <future>
#include "Cache.hpp"
#include "Position.hpp"
#include "TranspositionTable.hpp"
#include "OpeningBook.hpp"
#include "SolverResult.hpp"
#include "ThreadPool.hpp"

namespace GameSolver {
namespace Connect4 {

template <int W, int H, int ALIGN = 4, bool WRAP = false>
constexpr int getRequiredValueBits() {
    // Pascal Pons mapping requires ~1.5 * (W * H) values.
    // Score range: [-W*H/2, W*H/2]
    // Mapping: S + (W*H/2) + (W*H) + 2 
    constexpr int max_val = (W * H + 1) / 2 + (W * H / 2) + (W * H) + 2;
    if (max_val <= 63) return 6;
    if (max_val <= 127) return 7;
    return 8;
}

template <int WIDTH, int HEIGHT, int ALIGN = 4, bool WRAP = false>
class Solver {
 public:
  Solver() = default;
  virtual ~Solver() = default;
  static const int INVALID_MOVE = -1000;

  virtual ::GameSolver::Connect4::SolverResult solve(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) = 0;
  virtual std::vector<int> analyze(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) = 0;
  virtual unsigned long long getNodeCount() const = 0;
  virtual void reset() = 0;
  virtual void stop() = 0;
  virtual bool isBusy() const = 0;
  virtual void setBusy(bool busy) = 0;
  virtual bool isAborted() const = 0;
  virtual void loadBook(const OpeningBookBase<WIDTH, HEIGHT>* b) = 0;
  virtual void setTimeout(double end_time_ms) = 0;

  static std::unique_ptr<::GameSolver::Connect4::Cache> createCache(size_t table_bytes, int w = WIDTH == -1 ? 7 : WIDTH, int h = HEIGHT == -1 ? 6 : HEIGHT);
  static std::unique_ptr<Solver<WIDTH, HEIGHT, ALIGN, WRAP>> createWithCache(::GameSolver::Connect4::Cache* cache, int w = WIDTH == -1 ? 7 : WIDTH, int h = HEIGHT == -1 ? 6 : HEIGHT);
  static std::unique_ptr<Solver<WIDTH, HEIGHT, ALIGN, WRAP>> create(size_t table_bytes);
};



template <int WIDTH, int HEIGHT, int ALIGN = 4, bool WRAP = false, typename SlotType = uint64_t>
class SolverImpl : public Solver<WIDTH, HEIGHT, ALIGN, WRAP> {
 public:
  static constexpr int VALUE_BITS = WIDTH == -1 ? 8 : getRequiredValueBits<WIDTH, HEIGHT, ALIGN, WRAP>();
  static constexpr int MOVE_BITS = WIDTH == -1 ? 4 : (WIDTH >= 16 ? 5 : (WIDTH >= 8 ? 4 : 3));
  using position_t = typename GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::position_t;
  std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS, 7, 0, MOVE_BITS, position_t>> transTable;
  std::atomic<unsigned long long> nodeCount;
  std::atomic<bool> isSearching{false};
  std::atomic<bool> stopSearch{false};
  std::atomic<double> endTime{0.0};
  std::unique_ptr<::GameSolver::Connect4::ThreadPool> pool;
  const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr;

 private:
  using TrompWeightsT = typename std::conditional<WIDTH == -1, std::vector<int32_t>, std::array<int32_t, WIDTH == -1 ? 1 : WIDTH * (HEIGHT + 1)>>::type;
  using ColumnOrderT = typename std::conditional<WIDTH == -1, std::vector<int>, std::array<int, WIDTH == -1 ? 1 : WIDTH>>::type;
  using HistoryT = typename std::conditional<WIDTH == -1, std::vector<int32_t>, std::array<int32_t, WIDTH == -1 ? 1 : WIDTH * (HEIGHT + 1)>>::type;

  TrompWeightsT TROMP_WEIGHTS;
  ColumnOrderT COLUMN_ORDER;
  mutable HistoryT history;

  void init_tables(int w, int h) {
      if constexpr (WIDTH == -1) {
          TROMP_WEIGHTS.resize(w * (h + 1));
          COLUMN_ORDER.resize(w);
          history.resize(w * (h + 1));
      }
      for (int i = 0; i < w; i++) {
          COLUMN_ORDER[i] = w / 2 + (1 - 2 * (i % 2)) * (i + 1) / 2;
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
            history[col * (h + 1) + row] = val;
        }
      }
  }

  template <bool HasBook, int W_CONST = WIDTH, int H_CONST = HEIGHT>
  int negamax(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, int alpha, int beta, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag = nullptr, int32_t* thread_history = nullptr);

 public:

  SolverImpl(size_t table_bytes, int w = WIDTH == -1 ? 7 : WIDTH, int h = HEIGHT == -1 ? 6 : HEIGHT) 
    : transTable(std::make_shared<TranspositionTable<SlotType, uint8_t, VALUE_BITS, 7, 0, MOVE_BITS, position_t>>(table_bytes)), nodeCount{0}, pool(std::make_unique<::GameSolver::Connect4::ThreadPool>()) {
    init_tables(w, h);
  }

  SolverImpl(std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS, 7, 0, MOVE_BITS, position_t>> cache, int w = WIDTH == -1 ? 7 : WIDTH, int h = HEIGHT == -1 ? 6 : HEIGHT)
    : transTable(cache), nodeCount{0}, pool(std::make_unique<::GameSolver::Connect4::ThreadPool>()) {
    init_tables(w, h);
  }

  ::GameSolver::Connect4::SolverResult solve(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) override;
  std::vector<int> analyze(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) override;

 private:
  template <bool HasBook>
  ::GameSolver::Connect4::SolverResult solve_single(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag = nullptr, int32_t* thread_history = nullptr);

  template <bool HasBook>
  int dispatch_solve_weak(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>& P, int min, int max, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag, int32_t* thread_history);

 public:

  unsigned long long getNodeCount() const override {
    return nodeCount;
  }

  void reset() override {
    nodeCount = 0;
    transTable->reset();
    for (size_t i = 0; i < history.size(); i++) {
      history[i] = TROMP_WEIGHTS[i];
    }
  }

  void loadBook(const OpeningBookBase<WIDTH, HEIGHT>* b) override {
    book = b;
  }

  void setTimeout(double end_time_ms) override {
    endTime.store(end_time_ms, std::memory_order_relaxed);
  }

  bool isBusy() const override { return isSearching.load(std::memory_order_relaxed); }
  void setBusy(bool busy) override { isSearching.store(busy, std::memory_order_relaxed); }

  void stop() override { stopSearch.store(true, std::memory_order_relaxed); }
  bool isAborted() const override { return stopSearch.load(std::memory_order_relaxed); }

  /**
   * Unified abort check. Combines the solver-wide kill switch (stopSearch/endTime)
   * with an optional per-task scoped flag (e.g. Lazy SMP thread done, per-column abort).
   * All abort polling in negamax/solve_single should go through this single method.
   */
  bool shouldAbort(std::atomic<bool>* abort_flag = nullptr) const {
    return stopSearch.load(std::memory_order_relaxed) ||
           (abort_flag && abort_flag->load(std::memory_order_relaxed));
  }

};

} // namespace Connect4
} // namespace GameSolver

#include "Solver.cpp"

#endif
