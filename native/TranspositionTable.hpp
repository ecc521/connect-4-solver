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

/**
 * Abstrac interface for the Transposition Table get function
 */
template<class key_t, class value_t>
class TableGetter {
 private:
  virtual void* getKeys() = 0;
  virtual void* getValues() = 0;
  virtual size_t getSize() = 0;
  virtual int getKeySize() = 0;
  virtual int getValueSize() = 0;

 public:
  virtual value_t get(key_t key) const = 0;
  virtual ~TableGetter() {};

 friend class OpeningBook;
};

// uint_t<S> is a template type providing an unsigned int able to fit interger of S bits.
// uint_t<8> = uint8_t and uint_t<9> = uint_16t
template<int S> using uint_t =
  typename std::conditional < S <= 8, uint_least8_t,
  typename std::conditional < S <= 16, uint_least16_t,
  typename std::conditional<S <= 32, uint_least32_t,
  uint_least64_t>::type>::type >::type;

/**
 * Transposition Table is a highly optimized memory-dense hash map 
 * designed for L1/L3 Cache utilization. It packs an 8-bit partial key
 * and an 8-bit value into a single atomic uint16_t array slot.
 * This halves memory fetch latency during alpha-beta tree traversal.
 *
 * key_size:   (ignored - forced to uint16_t array internally)
 * value_size: (ignored)
 * log_size:   base 2 log of the size of the Transposition Table.
 *             The table will contain 2^log_size elements
 */
template<class partial_key_t, class key_t, class value_t, int log_size>
class TranspositionTable : public TableGetter<key_t, value_t> {
 private:
  static const size_t size = next_prime(1 << log_size);
  std::atomic<uint16_t> *Data;

  void* getKeys()    override {return (void*)Data;}
  void* getValues()  override {return nullptr;}
  size_t getSize()   override {return size;}
  int getKeySize()   override {return sizeof(uint16_t);}
  int getValueSize() override {return 0;}

  size_t index(key_t key) const {
    return key % size;
  }

 public:
  TranspositionTable() {
    Data = new std::atomic<uint16_t>[size];
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
    // 8-bit signature 
    uint16_t partial = key & 0xFF;
    uint16_t packed_val = value & 0xFF; 
    uint16_t combined = (partial << 8) | packed_val;
    size_t start_pos = pos;

    while (true) {
        uint16_t expected = 0;
        // Lock-free atomic compare and swap: if 0, insert it.
        if (Data[pos].compare_exchange_strong(expected, combined, std::memory_order_relaxed)) {
            break;
        }
        // If the slot is taken but has identical signature, overwrite it (transposition deepening)
        if ((expected >> 8) == partial) {
            Data[pos].store(combined, std::memory_order_relaxed);
            break;
        }
        // Linear probe within identical cache line gracefully
        pos = (pos + 1) % size;
        if (pos == start_pos) break; // Table full fail-safe
    }
  }

  value_t get(key_t key) const override {
    size_t pos = index(key);
    uint16_t partial = key & 0xFF;
    size_t start_pos = pos;
    
    while (true) {
        uint16_t combined = Data[pos].load(std::memory_order_relaxed);
        if (combined == 0) return 0; // Hit empty slot, item not found
        
        if ((combined >> 8) == partial) {
            return (value_t)(combined & 0xFF);
        }
        
        pos = (pos + 1) % size;
        if (pos == start_pos) return 0; // Looped through full table
    }
    return 0;
  }
};

} // namespace Connect4
} // namespace GameSolver
#endif
