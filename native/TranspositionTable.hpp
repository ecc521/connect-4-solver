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

#ifndef TRANSPOSITION_TABLE_HPP
#define TRANSPOSITION_TABLE_HPP

#include <cstring>
#include <atomic>

namespace GameSolver {
namespace Connect4 {

/**
 * util functions to compute next prime at compile time
 */
constexpr bool is_prime(uint64_t n) {
  if (n % 2 == 0) return n == 2;
  for (uint64_t i = 3; i * i <= n; i += 2) {
    if (n % i == 0) return false;
  }
  return true;
}

constexpr uint64_t next_prime(uint64_t n) {
  if (n <= 2) return 2;
  while (!is_prime(n)) n++;
  return n;
}

// log2(1) = 0; log2(2) = 1; log2(3) = 1; log2(4) = 2; log2(8) = 3
constexpr unsigned int log2(unsigned int n) {
  return n <= 1 ? 0 : log2(n / 2) + 1;
}


template<int S> using uint_t =
  typename std::conditional < S <= 8, uint_least8_t,
  typename std::conditional < S <= 16, uint_least16_t,
  typename std::conditional<S <= 32, uint_least32_t,
  uint_least64_t>::type>::type >::type;

/**
 * Transposition Table is a highly optimized memory-dense hash map 
 * designed for L1/L3 Cache utilization. It packs a partial key
 * and an 8-bit value into a single atomic slot.
 */
template<typename SlotType, typename ValueType = uint8_t, unsigned int ValueBits = 8>
class TranspositionTable {
 private:
  struct Slot {
    std::atomic<SlotType> data;
    Slot() : data(0) {}
  };

  size_t size;
  Slot *Data;

  size_t index(uint64_t key) const {
    return key % size;
  }

 public:
  TranspositionTable(size_t table_bytes) {
    size_t slots = table_bytes / sizeof(Slot);
    size = next_prime(slots);
    Data = new Slot[size];
    reset();
  }

  ~TranspositionTable() {
    delete[] Data;
  }

  void reset() {
    for (size_t i = 0; i < size; i++) {
      Data[i].data.store(0, std::memory_order_relaxed);
    }
  }

  void put_if_empty(uint64_t key, ValueType value) {
    size_t i = index(key);
    uint64_t partial_key = key / size;
    SlotType new_data = (static_cast<SlotType>(partial_key) << ValueBits) | static_cast<SlotType>(value);
    SlotType expected = 0;
    Data[i].data.compare_exchange_strong(expected, new_data, std::memory_order_relaxed);
  }

  void put(uint64_t key, ValueType value) {
    size_t i = index(key);
    uint64_t partial_key = key / size;
    SlotType new_data = (static_cast<SlotType>(partial_key) << ValueBits) | static_cast<SlotType>(value);
    Data[i].data.store(new_data, std::memory_order_relaxed);
  }

  size_t getSize() const {
    return size;
  }

  ValueType get(uint64_t key) const {
    size_t pos = index(key);
    uint64_t partial_key = key / size;
    
    SlotType combined = Data[pos].data.load(std::memory_order_relaxed);
    if (combined == 0) return 0; // Hit empty slot, item not found
    
    if ((combined >> ValueBits) == static_cast<SlotType>(partial_key)) {
        return static_cast<ValueType>(combined & ((1ULL << ValueBits) - 1));
    }
    
    return 0;
  }
};

} // namespace Connect4
} // namespace GameSolver
#endif
