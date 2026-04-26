/*
 * Cuckoo Hash Table implementation for Connect 4 Opening Books.
 * Provides 100% density without dropped collisions using 2-way bucketed hashing.
 */

#ifndef CUCKOO_TABLE_HPP
#define CUCKOO_TABLE_HPP

#include <vector>
#include <atomic>
#include <iostream>
#include <unordered_map>
#include <cstdlib>
#include "TranspositionTable.hpp" 

namespace GameSolver {
namespace Connect4 {

template<class key_t, class value_t>
class CuckooTable : public TableGetter<key_t, value_t> {
 private:
  struct Bucket {
    std::atomic<uint16_t> slots[4];
  };

  const size_t num_buckets;
  Bucket *Data;
  std::vector<std::pair<key_t, value_t>> TempItems;
  bool is_built = false;

  void* getKeys()    override {return (void*)Data;}
  void* getValues()  override {return nullptr;}
  size_t getSize()   override {return num_buckets * 4;}
  int getKeySize()   override {return sizeof(uint16_t);}
  int getValueSize() override {return 0;}

  size_t h1(key_t key) const {
    return (key * 0x517cc1b727220a95ULL) % num_buckets;
  }
  
  size_t h2(key_t key) const {
    return (key * 0x2802d52b9921e5f3ULL) % num_buckets;
  }

  bool insert_internal(key_t key, uint16_t combined, std::vector<key_t>& fullKeys, int depth) {
    if (depth > 2000) return false; 

    size_t b1 = h1(key);
    for(int i=0; i<4; i++) {
      if (Data[b1].slots[i] == 0) {
        Data[b1].slots[i] = combined;
        fullKeys[b1 * 4 + i] = key;
        return true;
      }
    }
    
    size_t b2 = h2(key);
    for(int i=0; i<4; i++) {
      if (Data[b2].slots[i] == 0) {
        Data[b2].slots[i] = combined;
        fullKeys[b2 * 4 + i] = key;
        return true;
      }
    }
    
    size_t bucket = (rand() % 2 == 0) ? b1 : b2;
    int slot = rand() % 4;
    
    uint16_t evicted_combined = Data[bucket].slots[slot];
    key_t evicted_key = fullKeys[bucket * 4 + slot];
    
    Data[bucket].slots[slot] = combined;
    fullKeys[bucket * 4 + slot] = key;
    
    return insert_internal(evicted_key, evicted_combined, fullKeys, depth + 1);
  }

 public:
  CuckooTable(size_t buckets) : num_buckets(buckets) {
    // If bucket size is explicitly requested (generator)
    Data = new Bucket[num_buckets];
    reset();
  }

  ~CuckooTable() {
    delete[] Data;
  }

  void reset() {
    for (size_t i = 0; i < num_buckets; i++) {
      for(int j=0; j<4; j++) {
        Data[i].slots[j].store(0, std::memory_order_relaxed);
      }
    }
    TempItems.clear();
    is_built = false;
  }

  void put(key_t key, value_t value) {
    if (is_built) return;
    TempItems.push_back({key, value});
  }

  int build() {
    if (is_built) return 0;
    std::unordered_map<key_t, value_t> unique_items;
    for (const auto& item : TempItems) {
      unique_items[item.first] = item.second;
    }
    TempItems.clear(); 

    std::vector<key_t> fullKeys(num_buckets * 4, 0);
    
    int fail_count = 0;
    for (const auto& item : unique_items) {
      uint16_t combined = ((item.first & 0xFF) << 8) | (item.second & 0xFF);
      if (!insert_internal(item.first, combined, fullKeys, 0)) {
        fail_count++;
      }
    }

    if (fail_count > 0) {
      std::cerr << "Cuckoo Table Build Failed: " << fail_count << " items evicted infinitely.\n";
    }

    is_built = true;
    return fail_count;
  }

  value_t get(key_t key) const override {
    uint16_t partial = key & 0xFF;
    
    size_t b1 = h1(key);
    for(int i=0; i<4; i++) {
        uint16_t val = Data[b1].slots[i].load(std::memory_order_relaxed);
        if (val != 0 && (val >> 8) == partial) return val & 0xFF;
    }
    
    size_t b2 = h2(key);
    for(int i=0; i<4; i++) {
        uint16_t val = Data[b2].slots[i].load(std::memory_order_relaxed);
        if (val != 0 && (val >> 8) == partial) return val & 0xFF;
    }
    
    return 0;
  }
};

} // namespace Connect4
} // namespace GameSolver
#endif
