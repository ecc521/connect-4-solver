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
template<typename SlotType, typename ValueType = uint8_t, unsigned int ValueBits = 8, unsigned int WorkBits = 7, typename KeyType = uint64_t>
class TranspositionTable {
 public:
  static constexpr unsigned int MoveBits = 4;
 private:
  struct Slot {
    std::atomic<SlotType> data;
    Slot() : data(0) {}
  };

  struct alignas(sizeof(SlotType) * 2) Bucket {
    Slot slots[2];
  };

  size_t size;
  size_t num_buckets;
  Bucket *Data;

  size_t index(KeyType key) const {
    return (key % num_buckets);
  }

 public:
  TranspositionTable(size_t table_bytes) {
    size_t bucket_size = sizeof(Bucket);
    num_buckets = next_prime(table_bytes / bucket_size);
    size = num_buckets * 2;
    Data = new Bucket[num_buckets]();
  }

  ~TranspositionTable() {
    delete[] Data;
  }

  void reset() {
    for (size_t i = 0; i < num_buckets; i++) {
      Data[i].slots[0].data.store(0, std::memory_order_relaxed);
      Data[i].slots[1].data.store(0, std::memory_order_relaxed);
    }
  }

  SlotType getPartialKey(KeyType key) const {
      KeyType partial = key / num_buckets;
      int shift_amount = ValueBits + WorkBits + MoveBits;
      int available_bits = sizeof(SlotType) * 8 - shift_amount;
      
      // Fold the upper bits down to prevent collision when truncating CRT keys
      // that are too large to fit in the available_bits hash space
      partial ^= (partial >> available_bits);
      if constexpr (sizeof(KeyType) > 8) {
          partial ^= (partial >> (available_bits * 2));
      }
      
      if (available_bits >= 64) return static_cast<SlotType>(partial);
      return static_cast<SlotType>(partial) & ((1ULL << available_bits) - 1);
  }

  void put_if_empty(KeyType key, ValueType value) {}

  void put(KeyType key, ValueType value, uint8_t work = 0, uint8_t best_move = Position::WIDTH) {
    SlotType partial_key = getPartialKey(key);
    size_t b = index(key);
    
    SlotType new_data = (partial_key << (ValueBits + WorkBits + MoveBits)) 
                      | (static_cast<SlotType>(best_move) << (ValueBits + WorkBits))
                      | (static_cast<SlotType>(work) << ValueBits)
                      | static_cast<SlotType>(value);
    
    SlotType first = Data[b].slots[0].data.load(std::memory_order_relaxed);
    
    if ((first >> (ValueBits + WorkBits + MoveBits)) == partial_key) {
        Data[b].slots[0].data.store(new_data, std::memory_order_relaxed);
        return;
    }
    
    uint8_t first_work = static_cast<uint8_t>((first >> ValueBits) & ((1ULL << WorkBits) - 1));
    
    SlotType second = Data[b].slots[1].data.load(std::memory_order_relaxed);
    
    if ((second >> (ValueBits + WorkBits + MoveBits)) == partial_key) {
        if (work >= first_work) {
            Data[b].slots[0].data.store(new_data, std::memory_order_relaxed);
            Data[b].slots[1].data.store(first, std::memory_order_relaxed);
        } else {
            Data[b].slots[1].data.store(new_data, std::memory_order_relaxed);
        }
        return;
    }
    
    // No match found - TwoBig Replacement Logic
    if (first == 0 || work >= first_work) {
        Data[b].slots[0].data.store(new_data, std::memory_order_relaxed);
        if (first != 0) {
            Data[b].slots[1].data.store(first, std::memory_order_relaxed);
        }
    } else {
        Data[b].slots[1].data.store(new_data, std::memory_order_relaxed);
    }
  }

  size_t getSize() const {
    return size;
  }

  struct PackedResult {
    uint8_t best_move;
    ValueType value;
  };

  PackedResult getPacked(KeyType key) const {
    SlotType partial_key = getPartialKey(key);
    size_t b = index(key);
    
    SlotType first = Data[b].slots[0].data.load(std::memory_order_relaxed);
    if ((first >> (ValueBits + WorkBits + MoveBits)) == partial_key) {
        ValueType val = static_cast<ValueType>(first & ((1ULL << ValueBits) - 1));
        uint8_t move = static_cast<uint8_t>((first >> (ValueBits + WorkBits)) & ((1ULL << MoveBits) - 1));
        return {move, val};
    }
    SlotType second = Data[b].slots[1].data.load(std::memory_order_relaxed);
    if ((second >> (ValueBits + WorkBits + MoveBits)) == partial_key) {
        ValueType val = static_cast<ValueType>(second & ((1ULL << ValueBits) - 1));
        uint8_t move = static_cast<uint8_t>((second >> (ValueBits + WorkBits)) & ((1ULL << MoveBits) - 1));
        return {move, val};
    }
    return {0, 0};
  }

  ValueType get(KeyType key) const {
    return getPacked(key).value;
  }
};

} // namespace Connect4
} // namespace GameSolver
#endif
