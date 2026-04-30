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

#ifndef OPENING_BOOK_HPP
#define OPENING_BOOK_HPP

#include <iostream>
#include <fstream>
#include "Position.hpp"
#include <vector>
#include <algorithm>
#include <stdexcept>
#include <memory>
#include <cmath>

namespace GameSolver {
namespace Connect4 {

#pragma pack(push, 1)
template<int W, int H, int N>
struct PackedKey {
    uint8_t data[N];
    
    using pos_t = typename GenericPosition<W, H>::position_t;

    operator pos_t() const {
        pos_t val = 0;
        for (int i = 0; i < N; i++) {
            val |= ((pos_t)data[i]) << (i * 8);
        }
        return val;
    }
    
    bool operator<(pos_t target) const {
        return static_cast<pos_t>(*this) < target;
    }
    
    bool operator==(pos_t target) const {
        return static_cast<pos_t>(*this) == target;
    }
};

template<int W, int H, int N>
bool operator<(typename GenericPosition<W, H>::position_t target, const PackedKey<W, H, N>& key) {
    return target < static_cast<typename GenericPosition<W, H>::position_t>(key);
}
#pragma pack(pop)

template <int W, int H>
class OpeningBookBase {
public:
    using pos_t = typename GenericPosition<W, H>::position_t;
    using EntryList = std::vector<std::pair<pos_t, uint8_t>>;

    virtual int get(const GenericPosition<W, H>& P) const = 0;
    virtual int getDepth() const = 0;
    virtual EntryList dump() const = 0;
    virtual ~OpeningBookBase() = default;
    
    static std::unique_ptr<OpeningBookBase<W, H>> load(std::string filename, int width, int height);
    static std::unique_ptr<OpeningBookBase<W, H>> load(std::istream& ifs, int width, int height, size_t stream_size);
    static std::unique_ptr<OpeningBookBase<W, H>> load_from_memory(const uint8_t* data, size_t size, int width, int height);
    
    static void save_dense(const std::string& filename, int depth, EntryList items);
    static void save_elias_fano(const std::string& filename, int depth, EntryList items);
    
    static std::vector<uint8_t> serialize_dense(int depth, EntryList items);
    static std::vector<uint8_t> serialize_elias_fano(int depth, EntryList items);
};

template <int W, int H>
class EliasFanoBook : public OpeningBookBase<W, H> {
  uint64_t num_entries;
  uint8_t L;
  int depth;
  std::vector<uint64_t> upper_bits;
  std::vector<uint64_t> lower_bits;
  std::vector<uint8_t> values;
  std::vector<uint32_t> block_counts;

  void build_index() {
    block_counts.assign(upper_bits.size() + 1, 0);
    uint32_t current = 0;
    for (size_t i = 0; i < upper_bits.size(); i++) {
      block_counts[i] = current;
      current += __builtin_popcountll(upper_bits[i]);
    }
    block_counts[upper_bits.size()] = current;
  }

  uint64_t select1(uint64_t rank) const {
    auto it = std::upper_bound(block_counts.begin(), block_counts.end(), (uint32_t)rank);
    size_t block_idx = std::distance(block_counts.begin(), it) - 1;
    
    uint64_t val = upper_bits[block_idx];
    uint32_t remaining = rank - block_counts[block_idx];
    
    for (int i = 0; i < 64; i++) {
      if ((val >> i) & 1) {
        if (remaining == 0) return block_idx * 64 + i;
        remaining--;
      }
    }
    return block_idx * 64;
  }

  uint64_t get_key(uint64_t i) const {
    uint64_t y = select1(i) - i;
    return (y << L) | get_lower(i);
  }

  uint64_t get_lower(uint64_t i) const {
    if (L == 0) return 0;
    uint64_t bit_pos = i * L;
    uint64_t idx = bit_pos / 64;
    uint64_t shift = bit_pos % 64;
    uint64_t val = lower_bits.empty() ? 0 : lower_bits[idx] >> shift;
    if (shift + L > 64 && idx + 1 < lower_bits.size()) {
      val |= lower_bits[idx + 1] << (64 - shift);
    }
    return val & ((1ULL << L) - 1);
  }

  int getDepth() const override { return depth; }

 public:
  EliasFanoBook(uint64_t n, uint64_t /*U*/, uint8_t L, int depth, std::vector<uint64_t> ub, std::vector<uint64_t> lb, std::vector<uint8_t> v)
    : num_entries{n}, L{L}, depth{depth}, upper_bits(std::move(ub)), lower_bits(std::move(lb)), values(std::move(v)) {
      build_index();
    }

  int get(const GenericPosition<W, H> &P) const override {
    if (num_entries == 0) return 0;
    uint64_t x = P.key3();
    
    uint64_t low = 0;
    uint64_t high = num_entries;
    while (low < high) {
      uint64_t mid = low + (high - low) / 2;
      uint64_t mid_x = get_key(mid);
      if (mid_x < x) low = mid + 1;
      else if (mid_x > x) high = mid;
      else return values[mid];
    }
    return 0;
  }

  typename OpeningBookBase<W, H>::EntryList dump() const override {
    typename OpeningBookBase<W, H>::EntryList res;
    res.reserve(num_entries);
    
    uint64_t y = 0;
    uint64_t i = 0;
    for (size_t block = 0; block < upper_bits.size(); block++) {
        uint64_t val = upper_bits[block];
        for (int bit = 0; bit < 64; bit++) {
            if (i >= num_entries) break;
            if ((val >> bit) & 1) {
                res.push_back({static_cast<typename GenericPosition<W, H>::position_t>((y << L) | get_lower(i)), values[i]});
                i++;
            } else {
                y++;
            }
        }
        if (i >= num_entries) break;
    }
    
    return res;
  }
};

template<int W, int H, typename KeyT, typename ValT>
class DenseBook : public OpeningBookBase<W, H> {
  std::vector<KeyT> keys;
  std::vector<ValT> values;
  int depth;

  int getDepth() const override { return depth; }

 public:
  DenseBook(int depth, std::vector<KeyT> k, std::vector<ValT> v) 
    : keys(std::move(k)), values(std::move(v)), depth{depth} {} 

  DenseBook() : depth(-1) {}
  
  int get(const GenericPosition<W, H> &P) const override {
    if(P.nbMoves() > depth || keys.empty()) return 0;
    
    typename GenericPosition<W, H>::position_t target = P.key3();
    
    // Mask the target key to match the truncated keys stored in the book
    if (sizeof(KeyT) < sizeof(target)) {
        target &= (typename GenericPosition<W, H>::position_t(1) << (sizeof(KeyT) * 8)) - 1;
    }

    auto it = std::lower_bound(keys.begin(), keys.end(), target);
    
    if (it != keys.end() && *it == target) {
      size_t index = std::distance(keys.begin(), it);
      return values[index];
    }
    return 0;
  }

  typename OpeningBookBase<W, H>::EntryList dump() const override {
    typename OpeningBookBase<W, H>::EntryList res;
    res.reserve(keys.size());
    for (size_t i = 0; i < keys.size(); i++) {
        res.push_back({static_cast<typename GenericPosition<W, H>::position_t>(keys[i]), static_cast<uint8_t>(values[i])});
    }
    return res;
  }
};

template<int W, int H, int N>
std::unique_ptr<OpeningBookBase<W, H>> load_dense_book_n(std::istream& ifs, size_t file_size, int depth) {
    size_t num_entries = (file_size - 6) / (N + 1);
    std::vector<PackedKey<W, H, N>> keys(num_entries);
    std::vector<uint8_t> values(num_entries);

    if(num_entries > 0) {
      ifs.read(reinterpret_cast<char *>(keys.data()), num_entries * N);
      ifs.read(reinterpret_cast<char *>(values.data()), num_entries * 1);
      if(ifs.fail()) {
        throw std::runtime_error("Failed to read Dense Array data from book file.");
      }
    }
    return std::unique_ptr<OpeningBookBase<W, H>>(new DenseBook<W, H, PackedKey<W, H, N>, uint8_t>(depth, std::move(keys), std::move(values)));
}

template<int W, int H>
std::unique_ptr<OpeningBookBase<W, H>> load_elias_fano_book(std::istream& ifs, int depth) {
    uint64_t num_entries, U;
    uint8_t L;
    ifs.read(reinterpret_cast<char*>(&num_entries), 8);
    ifs.read(reinterpret_cast<char*>(&U), 8);
    ifs.read(reinterpret_cast<char*>(&L), 1);

    uint64_t upper_bits_size = (num_entries + (U >> L) + 64) / 64;
    uint64_t lower_bits_size = (num_entries * L + 63) / 64;

    std::vector<uint64_t> upper_bits(upper_bits_size);
    std::vector<uint64_t> lower_bits(lower_bits_size);
    std::vector<uint8_t> values(num_entries);

    ifs.read(reinterpret_cast<char*>(upper_bits.data()), upper_bits_size * 8);
    ifs.read(reinterpret_cast<char*>(lower_bits.data()), lower_bits_size * 8);
    ifs.read(reinterpret_cast<char*>(values.data()), num_entries);

    return std::unique_ptr<OpeningBookBase<W, H>>(new EliasFanoBook<W, H>(num_entries, U, L, depth, std::move(upper_bits), std::move(lower_bits), std::move(values)));
}

template<int W, int H>
inline std::unique_ptr<OpeningBookBase<W, H>> OpeningBookBase<W, H>::load(std::string filename, int width, int height) {
    std::ifstream ifs(filename, std::ios::binary);
    if(ifs.fail()) {
      throw std::runtime_error("Failed to open Connect 4 opening book file: " + filename);
    }
    ifs.seekg(0, std::ios::end);
    size_t file_size = ifs.tellg();
    ifs.seekg(0, std::ios::beg);
    return load(ifs, width, height, file_size);
}

struct MemBuf : std::streambuf {
    MemBuf(char* begin, char* end) {
        this->setg(begin, begin, end);
    }
};

template<int W, int H>
inline std::unique_ptr<OpeningBookBase<W, H>> OpeningBookBase<W, H>::load_from_memory(const uint8_t* data, size_t size, int width, int height) {
    MemBuf sbuf(const_cast<char*>(reinterpret_cast<const char*>(data)), const_cast<char*>(reinterpret_cast<const char*>(data)) + size);
    std::istream is(&sbuf);
    return load(is, width, height, size);
}

template<int W, int H>
inline std::unique_ptr<OpeningBookBase<W, H>> OpeningBookBase<W, H>::load(std::istream& ifs, int width, int height, size_t stream_size) {
    char _width, _height, _depth, value_bytes, partial_key_bytes, log_size;

    ifs.read(&_width, 1);
    ifs.read(&_height, 1);
    ifs.read(&_depth, 1);
    ifs.read(&partial_key_bytes, 1);
    ifs.read(&value_bytes, 1);
    ifs.read(&log_size, 1);

    if (ifs.fail()) {
      throw std::runtime_error("Failed to read header from opening book file.");
    }

    if (_width != width || _height != height) {
      throw std::runtime_error("Opening book board dimensions do not match.");
    }

    if (_depth > width * height) {
      throw std::runtime_error("Opening book depth exceeds board size.");
    }

    if (value_bytes != 1) {
      throw std::runtime_error("Invalid Connect 4 opening book format. Only 1-byte values supported currently.");
    }

    if (log_size == (char)0xFF) {
      return load_elias_fano_book<W, H>(ifs, _depth);
    }

    size_t file_size = stream_size;

    switch(partial_key_bytes) {
        case 1: return load_dense_book_n<W, H, 1>(ifs, file_size, _depth);
        case 2: return load_dense_book_n<W, H, 2>(ifs, file_size, _depth);
        case 3: return load_dense_book_n<W, H, 3>(ifs, file_size, _depth);
        case 4: return load_dense_book_n<W, H, 4>(ifs, file_size, _depth);
        case 5: return load_dense_book_n<W, H, 5>(ifs, file_size, _depth);
        case 6: return load_dense_book_n<W, H, 6>(ifs, file_size, _depth);
        case 7: return load_dense_book_n<W, H, 7>(ifs, file_size, _depth);
        case 8: return load_dense_book_n<W, H, 8>(ifs, file_size, _depth);
        case 9: return load_dense_book_n<W, H, 9>(ifs, file_size, _depth);
        case 10: return load_dense_book_n<W, H, 10>(ifs, file_size, _depth);
        case 11: return load_dense_book_n<W, H, 11>(ifs, file_size, _depth);
        case 12: return load_dense_book_n<W, H, 12>(ifs, file_size, _depth);
        case 13: return load_dense_book_n<W, H, 13>(ifs, file_size, _depth);
        case 14: return load_dense_book_n<W, H, 14>(ifs, file_size, _depth);
        case 15: return load_dense_book_n<W, H, 15>(ifs, file_size, _depth);
        case 16: return load_dense_book_n<W, H, 16>(ifs, file_size, _depth);
        default: throw std::runtime_error("Unsupported key_bytes in dense book.");
    }
}

template<int W, int H>
inline void OpeningBookBase<W, H>::save_dense(const std::string& filename, int depth, EntryList items) {
    auto buf = serialize_dense(depth, items);
    std::ofstream ofs(filename, std::ios::binary);
    if(ofs.fail()) throw std::runtime_error("Failed to open book file for writing: " + filename);
    ofs.write(reinterpret_cast<const char*>(buf.data()), buf.size());
}

template<int W, int H>
inline std::vector<uint8_t> OpeningBookBase<W, H>::serialize_dense(int depth, EntryList items) {
    std::sort(items.begin(), items.end());
    items.erase(std::unique(items.begin(), items.end(), 
      [](const auto& a, const auto& b) { return a.first == b.first; }), items.end());

    std::vector<uint8_t> buf;
    int key_bytes = std::ceil(((depth + W - 1) * 1.58496250072) / 8.0);
    if(key_bytes < 1) key_bytes = 1;
    if(key_bytes > 16) key_bytes = 16;

    char header[6] = {(char)W, (char)H, (char)depth, (char)key_bytes, 1, 0};
    buf.insert(buf.end(), header, header + 6);

    for (size_t i = 0; i < items.size(); i++) {
      pos_t key = items[i].first;
      for (int b = 0; b < key_bytes; b++) {
        uint8_t tmp = (key >> (b * 8)) & 0xFF;
        buf.push_back(tmp);
      }
    }
    for (size_t i = 0; i < items.size(); i++) {
      buf.push_back(items[i].second);
    }
    return buf;
}

template<int W, int H>
inline void OpeningBookBase<W, H>::save_elias_fano(const std::string& filename, int depth, EntryList items) {
    auto buf = serialize_elias_fano(depth, items);
    std::ofstream ofs(filename, std::ios::binary);
    if(ofs.fail()) throw std::runtime_error("Failed to open book file for writing: " + filename);
    ofs.write(reinterpret_cast<const char*>(buf.data()), buf.size());
}

template<int W, int H>
inline std::vector<uint8_t> OpeningBookBase<W, H>::serialize_elias_fano(int depth, EntryList items) {
    std::sort(items.begin(), items.end());
    items.erase(std::unique(items.begin(), items.end(), 
      [](const auto& a, const auto& b) { return a.first == b.first; }), items.end());

    std::vector<uint8_t> buf;
    uint64_t n = items.size();
    uint64_t max_key = n > 0 ? items.back().first : 0;
    uint64_t U = max_key + 1;
    uint8_t L = n > 0 ? (uint8_t)std::max(0, (int)std::floor(std::log2((double)U / n))) : 0;

    char header[6] = {(char)W, (char)H, (char)depth, 0, 1, (char)0xFF};
    buf.insert(buf.end(), header, header + 6);
    
    uint8_t* n_ptr = reinterpret_cast<uint8_t*>(&n);
    buf.insert(buf.end(), n_ptr, n_ptr + 8);
    uint8_t* u_ptr = reinterpret_cast<uint8_t*>(&U);
    buf.insert(buf.end(), u_ptr, u_ptr + 8);
    buf.push_back(L);

    uint64_t ub_size = (n + (U >> L) + 64) / 64;
    std::vector<uint64_t> ub(ub_size, 0);
    for (size_t i = 0; i < n; i++) {
        uint64_t y = items[i].first >> L;
        ub[(y + i) / 64] |= (1ULL << ((y + i) % 64));
    }
    uint8_t* ub_ptr = reinterpret_cast<uint8_t*>(ub.data());
    buf.insert(buf.end(), ub_ptr, ub_ptr + ub_size * 8);

    uint64_t lb_size = (n * L + 63) / 64;
    std::vector<uint64_t> lb(lb_size, 0);
    for (size_t i = 0; i < n; i++) {
        if (L == 0) continue;
        uint64_t val = items[i].first & ((1ULL << L) - 1);
        uint64_t bit_pos = i * L;
        uint64_t idx = bit_pos / 64;
        uint64_t shift = bit_pos % 64;
        lb[idx] |= (val << shift);
        if (shift + L > 64) {
            lb[idx + 1] |= (val >> (64 - shift));
        }
    }
    uint8_t* lb_ptr = reinterpret_cast<uint8_t*>(lb.data());
    buf.insert(buf.end(), lb_ptr, lb_ptr + lb_size * 8);

    for (size_t i = 0; i < n; i++) {
      buf.push_back(items[i].second);
    }
    return buf;
}

} // namespace Connect4
} // namespace GameSolver
#endif
