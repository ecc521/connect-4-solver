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

#ifndef CACHE_BUCKET_SIZE
#define CACHE_BUCKET_SIZE 2
#endif
#include <cstdint>
#include "Position.hpp"
#include "TranspositionTable.hpp"
#include "OpeningBook.hpp"
#include "Cache.hpp"

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

/**
 * Calculates the absolute minimum transposition table size (in bytes) required to safely 
 * use a specific SlotType (e.g. uint32_t vs uint64_t) without risking silent cache collisions.
 *
 * Mathematical Silent Replacement Protection (CRT):
 * The engine packs an alpha-beta score and a "partial key" into a single atomic integer (SlotType).
 * The full 64-bit board key is mathematically reconstructed using the Chinese Remainder Theorem:
 *   full_key = partial_key * (table_slots) + (bucket_index)
 * 
 * For this math to hold, the partial_key MUST fit exactly within the remaining bits of the SlotType
 * after the value bits are reserved. If the table is too small, `table_slots` is small, meaning
 * `key / table_slots` (the partial_key) becomes very large. If partial_key exceeds the available 
 * bits in SlotType, it truncates. Truncation causes two completely different board states to 
 * generate the exact same partial_key AND bucket_index, leading to catastrophic false positives
 * during the search.
 *
 * To prevent this, the table must be large enough so that the modulus (table_slots) shrinks 
 * the partial_key to a size that safely fits within the SlotType's available bits.
 */
template <typename SlotType>
constexpr uint64_t getMinimumTableBytes() {
    constexpr int board_bits = Position::WIDTH * (Position::HEIGHT + 1);
    constexpr int value_bits = getRequiredValueBits<Position::WIDTH, Position::HEIGHT>();
    constexpr int work_bits = 7;
    constexpr int partial_key_bits = (sizeof(SlotType) * 8) - value_bits - work_bits;
    
    if (board_bits <= partial_key_bits) return 0; // Exact match fits completely
    
    constexpr int index_bits = board_bits - partial_key_bits;
    if (index_bits >= 64) return UINT64_MAX; // Mathematically impossible
    
    return (1ULL << index_bits) * CACHE_BUCKET_SIZE * sizeof(SlotType);
}

#include "Cache.hpp"

class Solver {
 public:
  static const int INVALID_MOVE = -1000;

  virtual int solve(const Position &P, bool weak = false) = 0;
  virtual std::vector<int> analyze(const Position &P, bool weak = false, int threads = 1) = 0;
  virtual unsigned long long getNodeCount() const = 0;
  virtual void reset() = 0;
  virtual void loadBook(std::string book_file) = 0;

  virtual ~Solver() {}

  static std::unique_ptr<Cache> createCache(size_t table_bytes);
  static std::unique_ptr<Solver> createWithCache(Cache* cache);
};

template <typename SlotType>
class SolverImpl : public Solver {
 private:
  static constexpr int VALUE_BITS = getRequiredValueBits<Position::WIDTH, Position::HEIGHT>();
  std::shared_ptr<TranspositionTable<SlotType, CACHE_BUCKET_SIZE, uint8_t, VALUE_BITS>> transTable;
  std::unique_ptr<OpeningBookBase> book;
  std::atomic<unsigned long long> nodeCount;
  int columnOrder[Position::WIDTH];
  int32_t history[Position::WIDTH * (Position::HEIGHT + 1)];

  int negamax(const Position &P, int alpha, int beta);

 public:

  SolverImpl(size_t table_bytes) 
    : transTable(std::make_shared<TranspositionTable<SlotType, CACHE_BUCKET_SIZE, uint8_t, VALUE_BITS>>(table_bytes)), nodeCount{0} {
    for(int i = 0; i < Position::WIDTH; i++) {
      columnOrder[i] = Position::WIDTH / 2 + (1 - 2 * (i % 2)) * (i + 1) / 2;
    }
    for (int i = 0; i < Position::WIDTH * (Position::HEIGHT + 1); i++) {
      history[i] = GenericPosition<Position::WIDTH, Position::HEIGHT>::TROMP_WEIGHTS[i];
    }
  }

  SolverImpl(std::shared_ptr<TranspositionTable<SlotType, CACHE_BUCKET_SIZE, uint8_t, VALUE_BITS>> cache)
    : transTable(cache), nodeCount{0} {
    for(int i = 0; i < Position::WIDTH; i++) {
      columnOrder[i] = Position::WIDTH / 2 + (1 - 2 * (i % 2)) * (i + 1) / 2;
    }
    for (int i = 0; i < Position::WIDTH * (Position::HEIGHT + 1); i++) {
      history[i] = GenericPosition<Position::WIDTH, Position::HEIGHT>::TROMP_WEIGHTS[i];
    }
  }

  int solve(const Position &P, bool weak = false) override;
  std::vector<int> analyze(const Position &P, bool weak = false, int threads = 1) override;

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

  void loadBook(std::string book_file) override {
    book = OpeningBookBase::load(book_file, Position::WIDTH, Position::HEIGHT);
  }


};

} // namespace Connect4
} // namespace GameSolver
#endif
