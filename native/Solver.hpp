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
#include "Cache.hpp"
#include "Position.hpp"
#include "TranspositionTable.hpp"
#include "OpeningBook.hpp"

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

template <typename SlotType>
constexpr uint64_t getMinimumTableBytes() {
    constexpr int board_bits = Position::WIDTH * (Position::HEIGHT + 1);
    constexpr int value_bits = getRequiredValueBits<Position::WIDTH, Position::HEIGHT>();
    constexpr int work_bits = 7;
    constexpr int partial_key_bits = (sizeof(SlotType) * 8) - value_bits - work_bits;
    
    if (board_bits <= partial_key_bits) return 0; // Exact match fits completely
    
    constexpr int index_bits = board_bits - partial_key_bits;
    if (index_bits >= 64) return UINT64_MAX; // Mathematically impossible
    
    return (1ULL << index_bits) * 2 * sizeof(SlotType);
}

class Solver {
 public:
  static const int INVALID_MOVE = -1000;

  virtual int solve(const Position &P, bool weak = false, const OpeningBookBase<Position::WIDTH, Position::HEIGHT>* book = nullptr) = 0;
  virtual std::vector<int> analyze(const Position &P, bool weak = false, int threads = 1, const OpeningBookBase<Position::WIDTH, Position::HEIGHT>* book = nullptr) = 0;
  virtual unsigned long long getNodeCount() const = 0;
  virtual void reset() = 0;

  virtual ~Solver() {}

  static std::unique_ptr<Cache> createCache(size_t table_bytes);
  static std::unique_ptr<Solver> createWithCache(Cache* cache);
  static std::unique_ptr<Solver> create(size_t table_bytes);
};

template <typename SlotType>
class SolverImpl : public Solver {
 public:
  static constexpr int VALUE_BITS = getRequiredValueBits<Position::WIDTH, Position::HEIGHT>();
  std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS>> transTable;
  std::atomic<unsigned long long> nodeCount;

 private:
  int columnOrder[Position::WIDTH];
  int32_t history[Position::WIDTH * (Position::HEIGHT + 1)];

  int negamax(const Position &P, int alpha, int beta, const OpeningBookBase<Position::WIDTH, Position::HEIGHT>* book);

 public:

  SolverImpl(size_t table_bytes) 
    : transTable(std::make_shared<TranspositionTable<SlotType, uint8_t, VALUE_BITS>>(table_bytes)), nodeCount{0} {
    for(int i = 0; i < Position::WIDTH; i++) {
      columnOrder[i] = Position::WIDTH / 2 + (1 - 2 * (i % 2)) * (i + 1) / 2;
    }
    for (int i = 0; i < Position::WIDTH * (Position::HEIGHT + 1); i++) {
      history[i] = GenericPosition<Position::WIDTH, Position::HEIGHT>::TROMP_WEIGHTS[i];
    }
  }

  SolverImpl(std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS>> cache)
    : transTable(cache), nodeCount{0} {
    for(int i = 0; i < Position::WIDTH; i++) {
      columnOrder[i] = Position::WIDTH / 2 + (1 - 2 * (i % 2)) * (i + 1) / 2;
    }
    for (int i = 0; i < Position::WIDTH * (Position::HEIGHT + 1); i++) {
      history[i] = GenericPosition<Position::WIDTH, Position::HEIGHT>::TROMP_WEIGHTS[i];
    }
  }

  int solve(const Position &P, bool weak = false, const OpeningBookBase<Position::WIDTH, Position::HEIGHT>* book = nullptr) override;
  std::vector<int> analyze(const Position &P, bool weak = false, int threads = 1, const OpeningBookBase<Position::WIDTH, Position::HEIGHT>* book = nullptr) override;

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
};

} // namespace Connect4
} // namespace GameSolver
#endif
