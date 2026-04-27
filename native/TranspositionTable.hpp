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
template<typename SlotType>
class TranspositionTable {
 private:
  size_t size;
  std::atomic<SlotType> *Data;

  size_t index(uint64_t key) const {
    return key % size;
  }

 public:
  TranspositionTable(size_t table_bytes) {
    size_t slots = table_bytes / sizeof(SlotType);
    size = next_prime(slots);
    Data = new std::atomic<SlotType>[size];
    reset();
  }

  ~TranspositionTable() {
    delete[] Data;
  }

  void reset() {
    for (size_t i = 0; i < size; i++) {
      Data[i].store(0, std::memory_order_relaxed);
    }
  }

  void put(uint64_t key, uint8_t value) {
    size_t pos = index(key);
    
    // Partial key is simply the key divided by the size (CRT)
    uint64_t partial_key = key / size;
    
    // Shift the partial key to the left by 8 bits, and store the value in the bottom 8 bits
    SlotType combined = (static_cast<SlotType>(partial_key) << 8) | static_cast<SlotType>(value);

    SlotType expected = 0;
    // Lock-free atomic compare and swap: if 0, insert it.
    if (!Data[pos].compare_exchange_strong(expected, combined, std::memory_order_relaxed)) {
        // If slot is taken, ALWAYS replace it unconditionally. 
        Data[pos].store(combined, std::memory_order_relaxed);
    }
  }

  uint8_t get(uint64_t key) const {
    size_t pos = index(key);
    uint64_t partial_key = key / size;
    
    SlotType combined = Data[pos].load(std::memory_order_relaxed);
    if (combined == 0) return 0; // Hit empty slot, item not found
    
    if ((combined >> 8) == static_cast<SlotType>(partial_key)) {
        return static_cast<uint8_t>(combined & 0xFF);
    }
    
    return 0;
  }
};

} // namespace Connect4
} // namespace GameSolver
#endif
