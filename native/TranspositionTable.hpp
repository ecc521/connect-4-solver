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
template<typename SlotType, int BUCKET_SIZE, typename ValueType = uint8_t, unsigned int ValueBits = 8, unsigned int WorkBits = 7, typename KeyType = uint64_t>
class TranspositionTable {
 private:
  struct Slot {
    std::atomic<SlotType> data;
    Slot() : data(0) {}
  };

  size_t size;
  Slot *Data;

  size_t index(KeyType key) const {
    return (key % (size / BUCKET_SIZE)) * BUCKET_SIZE;
  }

 public:
  TranspositionTable(size_t table_bytes) {
    size_t slot_size = sizeof(Slot);
    size = table_bytes / slot_size;
    Data = new Slot[size]();
  }

  ~TranspositionTable() {
    delete[] Data;
  }

  void reset() {
    for (size_t i = 0; i < size; i++) {
      Data[i].data.store(0, std::memory_order_relaxed);
    }
  }

  void put_if_empty(KeyType key, ValueType value) {}

  void put(KeyType key, ValueType value, uint8_t work = 0) {
    size_t b = index(key);
    KeyType partial_key = key / (size / BUCKET_SIZE);
    
    SlotType new_data = (static_cast<SlotType>(partial_key) << (ValueBits + WorkBits)) 
                      | (static_cast<SlotType>(work) << ValueBits)
                      | static_cast<SlotType>(value);
    
    if constexpr (BUCKET_SIZE == 2) {
        SlotType first = Data[b].data.load(std::memory_order_relaxed);
        SlotType second = Data[b+1].data.load(std::memory_order_relaxed);
        
        SlotType partial_shifted = static_cast<SlotType>(partial_key) << (ValueBits + WorkBits);
        SlotType mask = static_cast<SlotType>(~((1ULL << (ValueBits + WorkBits)) - 1));
        
        bool match0 = (first != 0 && (first & mask) == partial_shifted);
        bool match1 = (second != 0 && (second & mask) == partial_shifted);
        
        uint8_t first_work = static_cast<uint8_t>((first >> ValueBits) & ((1ULL << WorkBits) - 1));
        
        if (match0) {
            Data[b].data.store(new_data, std::memory_order_relaxed);
            return;
        }
        if (match1) {
            if (work >= first_work) {
                // Promote to Slot 0, push old Slot 0 to Slot 1
                Data[b].data.store(new_data, std::memory_order_relaxed);
                Data[b+1].data.store(first, std::memory_order_relaxed);
            } else {
                // Keep in Slot 1
                Data[b+1].data.store(new_data, std::memory_order_relaxed);
            }
            return;
        }
        
        // No match found - TwoBig Replacement Logic
        if (first == 0 || work >= first_work) {
            // New node has more or equal work, put it in the Big Slot (0)
            Data[b].data.store(new_data, std::memory_order_relaxed);
            // Push the old Big Slot into the Always-Replace Slot (1)
            if (first != 0) {
                Data[b+1].data.store(first, std::memory_order_relaxed);
            }
        } else {
            // New node has less work, put it in the Always-Replace Slot (1)
            Data[b+1].data.store(new_data, std::memory_order_relaxed);
        }
    } else {
        Data[b].data.store(new_data, std::memory_order_relaxed);
    }
  }

  size_t getSize() const {
    return size;
  }

  ValueType get(KeyType key) const {
    size_t b = index(key);
    KeyType partial_key = key / (size / BUCKET_SIZE);
    SlotType partial_shifted = static_cast<SlotType>(partial_key) << (ValueBits + WorkBits);
    SlotType mask = static_cast<SlotType>(~((1ULL << (ValueBits + WorkBits)) - 1));
    
    for (unsigned int i = 0; i < BUCKET_SIZE; i++) {
        SlotType combined = Data[b + i].data.load(std::memory_order_relaxed);
        if (combined == 0) continue;
        if ((combined & mask) == partial_shifted) {
            return static_cast<ValueType>(combined & ((1ULL << ValueBits) - 1));
        }
    }
    return 0;
  }
};

} // namespace Connect4
} // namespace GameSolver
#endif
