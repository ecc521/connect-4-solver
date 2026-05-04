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

template <int W, int H>
constexpr int getRequiredValueBits() {
    // Pascal Pons mapping requires ~1.5 * (W * H) values.
    // Score range: [-W*H/2, W*H/2]
    // Mapping: S + (W*H/2) + (W*H) + 2 
    constexpr int max_val = (W * H + 1) / 2 + (W * H / 2) + (W * H) + 2;
    if (max_val <= 63) return 6;
    if (max_val <= 127) return 7;
    return 8;
}

template <int WIDTH, int HEIGHT>
class Solver {
 public:
  Solver() = default;
  virtual ~Solver() = default;
  static const int INVALID_MOVE = -1000;

  virtual ::GameSolver::Connect4::SolverResult solve(const GenericPosition<WIDTH, HEIGHT> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) = 0;
  virtual std::vector<int> analyze(const GenericPosition<WIDTH, HEIGHT> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) = 0;
  virtual unsigned long long getNodeCount() const = 0;
  virtual void reset() = 0;
  virtual void stop() = 0;
  virtual bool isBusy() const = 0;
  virtual void setBusy(bool busy) = 0;
  virtual bool isAborted() const = 0;
  virtual void loadBook(const OpeningBookBase<WIDTH, HEIGHT>* b) = 0;
  virtual void setTimeout(double end_time_ms) = 0;

  static std::unique_ptr<::GameSolver::Connect4::Cache> createCache(size_t table_bytes);
  static std::unique_ptr<Solver<WIDTH, HEIGHT>> createWithCache(::GameSolver::Connect4::Cache* cache);
  static std::unique_ptr<Solver<WIDTH, HEIGHT>> create(size_t table_bytes);
};



template <int WIDTH, int HEIGHT, typename SlotType>
class SolverImpl : public Solver<WIDTH, HEIGHT> {
 public:
  static constexpr int VALUE_BITS = getRequiredValueBits<WIDTH, HEIGHT>();
  using position_t = typename GenericPosition<WIDTH, HEIGHT>::position_t;
  std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS, 7, 0, position_t>> transTable;
  std::atomic<unsigned long long> nodeCount;
  std::atomic<bool> isSearching{false};
  std::atomic<bool> stopSearch{false};
  std::atomic<double> endTime{0.0};
  const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr;

 private:
  mutable int32_t history[WIDTH * (HEIGHT + 1)];

  template <bool HasBook>
  int negamax(const GenericPosition<WIDTH, HEIGHT> &P, int alpha, int beta, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag = nullptr, int32_t* thread_history = nullptr);

 public:

  SolverImpl(size_t table_bytes) 
    : transTable(std::make_shared<TranspositionTable<SlotType, uint8_t, VALUE_BITS, 7, 0, position_t>>(table_bytes)), nodeCount{0}, pool(std::make_unique<::GameSolver::Connect4::ThreadPool>()), book(nullptr) {
    for (int i = 0; i < WIDTH * (HEIGHT + 1); i++) {
      history[i] = GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS[i];
    }
  }

  SolverImpl(std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS, 7, 0, position_t>> cache)
    : transTable(cache), nodeCount{0}, pool(std::make_unique<::GameSolver::Connect4::ThreadPool>()), book(nullptr) {
    for (int i = 0; i < WIDTH * (HEIGHT + 1); i++) {
      history[i] = GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS[i];
    }
  }

  ::GameSolver::Connect4::SolverResult solve(const GenericPosition<WIDTH, HEIGHT> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) override;
  std::vector<int> analyze(const GenericPosition<WIDTH, HEIGHT> &P, bool weak = false, int threads = 1, const OpeningBookBase<WIDTH, HEIGHT>* book = nullptr, double timeout_ms = 0) override;

 private:
  template <bool HasBook>
  ::GameSolver::Connect4::SolverResult solve_single(const GenericPosition<WIDTH, HEIGHT> &P, bool weak, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag = nullptr, int32_t* thread_history = nullptr);

 public:

  unsigned long long getNodeCount() const override {
    return nodeCount;
  }

  void reset() override {
    nodeCount = 0;
    transTable->reset();
    for (int i = 0; i < WIDTH * (HEIGHT + 1); i++) {
      history[i] = GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS[i];
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

 private:
  std::unique_ptr<::GameSolver::Connect4::ThreadPool> pool;
};

} // namespace Connect4
} // namespace GameSolver

#include "Solver.cpp"

#endif
