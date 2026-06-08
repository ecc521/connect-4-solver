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
#include <stdexcept>
#include <new>

#if defined(__unix__) || defined(__APPLE__) || defined(__EMSCRIPTEN__)
#include <cstdlib>
#endif

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
template<typename SlotType, typename ValueType = uint8_t, unsigned int ValueBits = 8, unsigned int WorkBits = 7, unsigned int FlagBits = 0, unsigned int MoveBits = 4, typename KeyType = uint64_t>
class TranspositionTable {
 public:
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
    return static_cast<size_t>(key % num_buckets);
  }

 public:
  TranspositionTable(size_t table_bytes) {
    size_t bucket_size = sizeof(Bucket);
    num_buckets = next_prime(table_bytes / bucket_size);
    size = num_buckets * 2;
    size_t total_bytes = num_buckets * bucket_size;

#if defined(__unix__) || defined(__APPLE__) || defined(__EMSCRIPTEN__)
    if (posix_memalign((void**)&Data, 128, total_bytes) != 0) {
        Data = nullptr;
    } else {
        std::memset(Data, 0, total_bytes);
    }
#else
    Data = new (std::nothrow) Bucket[num_buckets]();
#endif
  }

  bool isValid() const {
    return Data != nullptr;
  }

  ~TranspositionTable() {
#if defined(__unix__) || defined(__APPLE__) || defined(__EMSCRIPTEN__)
    free(Data);
#else
    delete[] Data;
#endif
  }

  void reset() {
    for (size_t i = 0; i < num_buckets; i++) {
      Data[i].slots[0].data.store(0, std::memory_order_relaxed);
      Data[i].slots[1].data.store(0, std::memory_order_relaxed);
    }
  }

  SlotType getPartialKey(KeyType key) const {
      KeyType partial = key / num_buckets;
      int shift_amount = ValueBits + WorkBits + MoveBits + FlagBits;
      int available_bits = sizeof(SlotType) * 8 - shift_amount;
      
      if (available_bits >= (int)(sizeof(KeyType) * 8)) return static_cast<SlotType>(partial);
      KeyType mask = (available_bits >= (int)(sizeof(KeyType) * 8)) ? ~static_cast<KeyType>(0) : ((static_cast<KeyType>(1) << available_bits) - 1);
      return static_cast<SlotType>(partial & mask);
  }

  void put_if_empty(KeyType /* key */, ValueType /* value */) {}

  void put(KeyType key, ValueType value, uint8_t work = 0, uint8_t best_move = 7, uint8_t flags = 0) {
    SlotType partial_key = getPartialKey(key);
    size_t b = index(key);
    
    SlotType val_mask = (static_cast<SlotType>(1) << ValueBits) - 1;
    SlotType work_mask = (static_cast<SlotType>(1) << WorkBits) - 1;
    SlotType flag_mask = (FlagBits == 0) ? 0 : ((static_cast<SlotType>(1) << FlagBits) - 1);
    SlotType move_mask = (static_cast<SlotType>(1) << MoveBits) - 1;

    SlotType new_data = (partial_key << (ValueBits + WorkBits + MoveBits + FlagBits)) 
                      | ((static_cast<SlotType>(best_move) & move_mask) << (ValueBits + WorkBits + FlagBits))
                      | ((static_cast<SlotType>(flags) & flag_mask) << (ValueBits + WorkBits))
                      | ((static_cast<SlotType>(work) & work_mask) << ValueBits)
                      | (static_cast<SlotType>(value) & val_mask);
    
    SlotType first = Data[b].slots[0].data.load(std::memory_order_relaxed);
    
    // --- SCENARIO 1: Match in Slot 0 ---
    if ((first >> (ValueBits + WorkBits + MoveBits + FlagBits)) == partial_key) {
        // READ-BEFORE-WRITE FILTER:
        if (first == new_data) return;

        // THE LOCKLESS BAIL:
        Data[b].slots[0].data.compare_exchange_weak(first, new_data, std::memory_order_release, std::memory_order_relaxed);
        return;
    }
    
    uint8_t first_work = static_cast<uint8_t>((first >> ValueBits) & work_mask);
    SlotType second = Data[b].slots[1].data.load(std::memory_order_relaxed);
    
    // --- SCENARIO 2: Match in Slot 1 ---
    if ((second >> (ValueBits + WorkBits + MoveBits + FlagBits)) == partial_key) {
        if (second == new_data) return; // Fabric saver

        if (work >= first_work) {
            // FIXING THE SHIFT RACE CONDITION:
            if (Data[b].slots[0].data.compare_exchange_weak(first, new_data, std::memory_order_release, std::memory_order_relaxed)) {
                Data[b].slots[1].data.compare_exchange_weak(second, first, std::memory_order_release, std::memory_order_relaxed);
            }
        } else {
            Data[b].slots[1].data.compare_exchange_weak(second, new_data, std::memory_order_release, std::memory_order_relaxed);
        }
        return;
    }
    
    // --- SCENARIO 3: No match found - TwoBig Replacement ---
    if (first == 0 || work >= first_work) {
        // Same protected shift logic
        if (Data[b].slots[0].data.compare_exchange_weak(first, new_data, std::memory_order_release, std::memory_order_relaxed)) {
            if (first != 0) {
                Data[b].slots[1].data.compare_exchange_weak(second, first, std::memory_order_release, std::memory_order_relaxed);
            }
        }
    } else {
        Data[b].slots[1].data.compare_exchange_weak(second, new_data, std::memory_order_release, std::memory_order_relaxed);
    }
  }

  size_t getSize() const {
    return size;
  }

  void prefetch(KeyType key) const {
#if defined(__GNUC__) || defined(__clang__)
    __builtin_prefetch(&Data[index(key)]);
#endif
  }

  struct PackedResult {
    uint8_t best_move;
    uint8_t work;
    uint8_t flags;
    ValueType value;
  };

  PackedResult getPacked(KeyType key) const {
    SlotType partial_key = getPartialKey(key);
    size_t b = index(key);
    
    SlotType val_mask = (static_cast<SlotType>(1) << ValueBits) - 1;
    SlotType work_mask = (static_cast<SlotType>(1) << WorkBits) - 1;
    SlotType flag_mask = (FlagBits == 0) ? 0 : ((static_cast<SlotType>(1) << FlagBits) - 1);
    SlotType move_mask = (static_cast<SlotType>(1) << MoveBits) - 1;

    SlotType first = Data[b].slots[0].data.load(std::memory_order_relaxed);
    if (first != 0 && (first >> (ValueBits + WorkBits + MoveBits + FlagBits)) == partial_key) {
        ValueType val = static_cast<ValueType>(first & val_mask);
        uint8_t work = static_cast<uint8_t>((first >> ValueBits) & work_mask);
        uint8_t flags = static_cast<uint8_t>((first >> (ValueBits + WorkBits)) & flag_mask);
        uint8_t move = static_cast<uint8_t>((first >> (ValueBits + WorkBits + FlagBits)) & move_mask);
        return {move, work, flags, val};
    }
    SlotType second = Data[b].slots[1].data.load(std::memory_order_relaxed);
    if (second != 0 && (second >> (ValueBits + WorkBits + MoveBits + FlagBits)) == partial_key) {
        ValueType val = static_cast<ValueType>(second & val_mask);
        uint8_t work = static_cast<uint8_t>((second >> ValueBits) & work_mask);
        uint8_t flags = static_cast<uint8_t>((second >> (ValueBits + WorkBits)) & flag_mask);
        uint8_t move = static_cast<uint8_t>((second >> (ValueBits + WorkBits + FlagBits)) & move_mask);
        return {move, work, flags, val};
    }
    return {0, 0, 0, 0};
  }

  ValueType get(KeyType key) const {
    SlotType partial_key = getPartialKey(key);
    size_t b = index(key);
    SlotType first = Data[b].slots[0].data.load(std::memory_order_relaxed);
    SlotType val_mask = (static_cast<SlotType>(1) << ValueBits) - 1;
    if (first != 0 && (first >> (ValueBits + WorkBits + MoveBits + FlagBits)) == partial_key) {
      return static_cast<ValueType>(first & val_mask);
    }
    SlotType second = Data[b].slots[1].data.load(std::memory_order_relaxed);
    if (second != 0 && (second >> (ValueBits + WorkBits + MoveBits + FlagBits)) == partial_key) {
      return static_cast<ValueType>(second & val_mask);
    }
    return 0;
  }
};

} // namespace Connect4
} // namespace GameSolver
#endif
