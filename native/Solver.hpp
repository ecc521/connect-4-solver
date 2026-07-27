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
  virtual void setCollectBook(MutableBook<WIDTH, HEIGHT>* /*b*/) {}

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
  std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS, WIDTH == -1 ? 7 : WIDTH, 0, MOVE_BITS, position_t>> transTable;
  std::atomic<unsigned long long> nodeCount;
  std::atomic<bool> isSearching{false};
  std::atomic<bool> stopSearch{false};
  std::atomic<double> endTime{0.0};
  std::unique_ptr<::GameSolver::Connect4::ThreadPool> pool;
  const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr;

  MutableBook<WIDTH, HEIGHT>* collect_book = nullptr;

  void setCollectBook(MutableBook<WIDTH, HEIGHT>* b) override {
    collect_book = b;
  }

 public:
  // analyze()'s root-split: lets a thread whose own column already finished
  // join whichever OTHER column is still mid-probe, at the same null-window
  // granularity raced_probe already races at (not a whole-solve restart --
  // see raced_probe's doc comment for why that distinction matters). The
  // owning raced_probe call publishes its live window here before waiting
  // and drains external_active back to 0 before it returns/tears down its
  // stack frame, so a late joiner can never read through a dangling pointer.
  struct ColumnProbeSlot {
    std::atomic<bool> live{false};
    std::atomic<uint64_t> generation{0};
    std::atomic<int> external_active{0};
    int alpha = 0, beta = 0;
    const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr;
    int book_depth = 0;
    std::atomic<bool>* done = nullptr;
    std::atomic<int>* result_val = nullptr;
    const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>* P = nullptr;
  };

 private:
  using ColumnOrderT = typename std::conditional<WIDTH == -1, std::vector<int>, std::array<int, WIDTH == -1 ? 1 : WIDTH>>::type;

  ColumnOrderT COLUMN_ORDER;

  void init_tables(int w, int h) {
      if constexpr (WIDTH == -1) {
          COLUMN_ORDER.resize(w);
      }
      for (int i = 0; i < w; i++) {
          COLUMN_ORDER[i] = w / 2 + (1 - 2 * (i % 2)) * (i + 1) / 2;
      }
  }

  template <bool HasBook, int W_CONST = WIDTH, int H_CONST = HEIGHT>
  int negamax(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, int alpha, int beta, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag = nullptr, int32_t* thread_history = nullptr, int score_jitter = 0);

 public:

  SolverImpl(size_t table_bytes, int w = WIDTH == -1 ? 7 : WIDTH, int h = HEIGHT == -1 ? 6 : HEIGHT) 
    : transTable(std::make_shared<TranspositionTable<SlotType, uint8_t, VALUE_BITS, WIDTH == -1 ? 7 : WIDTH, 0, MOVE_BITS, position_t>>(table_bytes)), nodeCount{0}, pool(std::make_unique<::GameSolver::Connect4::ThreadPool>()) {
    init_tables(w, h);
  }

  SolverImpl(std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS, WIDTH == -1 ? 7 : WIDTH, 0, MOVE_BITS, position_t>> cache, int w = WIDTH == -1 ? 7 : WIDTH, int h = HEIGHT == -1 ? 6 : HEIGHT)
    : transTable(cache), nodeCount{0}, pool(std::make_unique<::GameSolver::Connect4::ThreadPool>()) {
    init_tables(w, h);
  }

  ::GameSolver::Connect4::SolverResult solve(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) override;
  std::vector<int> analyze(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) override;

 private:
  template <bool HasBook>
  ::GameSolver::Connect4::SolverResult solve_single(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag = nullptr, int32_t* thread_history = nullptr, int threads = 1, int score_jitter = 0, ColumnProbeSlot* my_slot = nullptr);

  template <bool HasBook>
  int dispatch_solve_weak(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>& P, int min, int max, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag, int32_t* thread_history, int score_jitter = 0);

  // Multithreaded null-window probe: all `threads` workers race the SAME
  // (alpha, beta) probe over the shared transposition table, each with a
  // distinct per-ply move-ordering jitter schedule (worker 0 runs unjittered,
  // so the worst case is the single-threaded search). First finisher wins and
  // aborts the rest. See solve_single() for why this per-probe scope is what
  // makes shared-TT racing effective.
  //
  // my_slot (analyze()'s root-split only): if non-null, this call publishes
  // its live window into *my_slot before racing so a thread from another,
  // already-finished column can join THIS exact probe as an extra racer, and
  // drains any such joiners (external_active) before returning. See
  // ColumnProbeSlot's doc comment.
  template <bool HasBook>
  int raced_probe(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>& P, int alpha, int beta, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, int threads, std::atomic<bool>* abort_flag, int32_t* thread_history, int solo_jitter = 0, ColumnProbeSlot* my_slot = nullptr);

 public:

  unsigned long long getNodeCount() const override {
    return nodeCount;
  }

  void reset() override {
    nodeCount = 0;
    transTable->reset();
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
