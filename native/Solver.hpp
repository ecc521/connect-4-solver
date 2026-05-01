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

class Solver {
 public:
  static const int INVALID_MOVE = -1000;

  virtual ::GameSolver::Connect4::SolverResult solve(const Position &P, bool weak = false, int threads = 1, const OpeningBookBase<Position::WIDTH, Position::HEIGHT>* book = nullptr) = 0;
  virtual std::vector<int> analyze(const Position &P, bool weak = false, int threads = 1, const OpeningBookBase<Position::WIDTH, Position::HEIGHT>* book = nullptr) = 0;
  virtual unsigned long long getNodeCount() const = 0;
  virtual void reset() = 0;
  virtual void stop() = 0;
  virtual void setTimeout(double end_time_ms) = 0;
  virtual bool isBusy() const = 0;
  virtual void setBusy(bool busy) = 0;
  virtual bool isAborted() const = 0;

  virtual ~Solver() {}

  static std::unique_ptr<::GameSolver::Connect4::Cache> createCache(size_t table_bytes);
  static std::unique_ptr<Solver> createWithCache(::GameSolver::Connect4::Cache* cache);
  static std::unique_ptr<Solver> create(size_t table_bytes);
};



template <typename SlotType>
class SolverImpl : public Solver {
 public:
  static constexpr int VALUE_BITS = getRequiredValueBits<Position::WIDTH, Position::HEIGHT>();
  std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS>> transTable;
  std::atomic<unsigned long long> nodeCount;
  std::atomic<bool> isSearching{false};
  std::atomic<bool> stopSearch{false};
  std::atomic<double> endTime{0.0};

 private:
  mutable int32_t history[Position::WIDTH * (Position::HEIGHT + 1)];

  int negamax(const Position &P, int alpha, int beta, const OpeningBookBase<Position::WIDTH, Position::HEIGHT>* book, std::atomic<bool>* abort_flag = nullptr, int32_t* thread_history = nullptr);

 public:

  SolverImpl(size_t table_bytes) 
    : transTable(std::make_shared<TranspositionTable<SlotType, uint8_t, VALUE_BITS>>(table_bytes)), nodeCount{0}, pool(std::make_unique<::GameSolver::Connect4::ThreadPool>()) {
    for (int i = 0; i < Position::WIDTH * (Position::HEIGHT + 1); i++) {
      history[i] = GenericPosition<Position::WIDTH, Position::HEIGHT>::TROMP_WEIGHTS[i];
    }
  }

  SolverImpl(std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS>> cache)
    : transTable(cache), nodeCount{0}, pool(std::make_unique<::GameSolver::Connect4::ThreadPool>()) {
    for (int i = 0; i < Position::WIDTH * (Position::HEIGHT + 1); i++) {
      history[i] = GenericPosition<Position::WIDTH, Position::HEIGHT>::TROMP_WEIGHTS[i];
    }
  }

  ::GameSolver::Connect4::SolverResult solve(const Position &P, bool weak = false, int threads = 1, const OpeningBookBase<Position::WIDTH, Position::HEIGHT>* book = nullptr) override;
  std::vector<int> analyze(const Position &P, bool weak = false, int threads = 1, const OpeningBookBase<Position::WIDTH, Position::HEIGHT>* book = nullptr) override;

 private:
  ::GameSolver::Connect4::SolverResult solve_single(const Position &P, bool weak, const OpeningBookBase<Position::WIDTH, Position::HEIGHT>* book, std::atomic<bool>* abort_flag = nullptr, int32_t* thread_history = nullptr);

  unsigned long long getNodeCount() const override {
    return nodeCount;
  }

  void reset() override {
    nodeCount = 0;
    transTable->reset();
    for (int i = 0; i < Position::WIDTH * (Position::HEIGHT + 1); i++) {
      history[i] = GenericPosition<Position::WIDTH, Position::HEIGHT>::TROMP_WEIGHTS[i];
    }
  }

  bool isBusy() const override { return isSearching.load(std::memory_order_relaxed); }
  void setBusy(bool busy) override { isSearching.store(busy, std::memory_order_relaxed); }

  void stop() override { stopSearch.store(true, std::memory_order_relaxed); }
  void setTimeout(double end_time_ms) override { endTime.store(end_time_ms, std::memory_order_relaxed); }
  bool isAborted() const override { return stopSearch.load(std::memory_order_relaxed); }

 private:
  std::unique_ptr<::GameSolver::Connect4::ThreadPool> pool;
};

} // namespace Connect4
} // namespace GameSolver
#endif
