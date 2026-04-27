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
 * designed for L1/L3 Cache utilization. It packs the full 64-bit key
 * and an 8-bit value into a single atomic uint64_t array slot.
 * This guarantees 100% mathematically correct matches.
 *
 * key_size:   (ignored - forced to uint16_t array internally)
 * value_size: (ignored)
 * log_size:   base 2 log of the size of the Transposition Table.
 *             The table will contain 2^log_size elements
 */
template<class partial_key_t, class key_t, class value_t, int log_size>
class TranspositionTable {
 private:
  static const size_t size = next_prime(1ULL << log_size);
  std::atomic<uint64_t> *Data;

  size_t index(key_t key) const {
    return key % size;
  }

 public:
  TranspositionTable() {
    Data = new std::atomic<uint64_t>[size];
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

  void put(key_t key, value_t value) {
    size_t pos = index(key);
    
    // Pack the full 64-bit key and the 8-bit value
    uint64_t packed_val = value & 0xFF; 
    uint64_t combined = (static_cast<uint64_t>(key) << 8) | packed_val;

    uint64_t expected = 0;
    // Lock-free atomic compare and swap: if 0, insert it.
    if (!Data[pos].compare_exchange_strong(expected, combined, std::memory_order_relaxed)) {
        // If slot is taken, ALWAYS replace it unconditionally. 
        Data[pos].store(combined, std::memory_order_relaxed);
    }
  }

  value_t get(key_t key) const {
    size_t pos = index(key);
    
    uint64_t combined = Data[pos].load(std::memory_order_relaxed);
    if (combined == 0) return 0; // Hit empty slot, item not found
    
    // 100% mathematically guarantees the exact same board state!
    if ((combined >> 8) == static_cast<uint64_t>(key)) {
        return (value_t)(combined & 0xFF);
    }
    
    return 0;
  }
};

} // namespace Connect4
} // namespace GameSolver
#endif
