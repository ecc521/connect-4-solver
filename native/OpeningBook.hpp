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

namespace GameSolver {
namespace Connect4 {

#pragma pack(push, 1)
template<int N>
struct PackedKey {
    uint8_t data[N];
    
    operator Position::position_t() const {
        Position::position_t val = 0;
        for (int i = 0; i < N; i++) {
            val |= ((Position::position_t)data[i]) << (i * 8);
        }
        return val;
    }
    
    bool operator<(Position::position_t target) const {
        return static_cast<Position::position_t>(*this) < target;
    }
    
    bool operator==(Position::position_t target) const {
        return static_cast<Position::position_t>(*this) == target;
    }
};

template<int N>
bool operator<(Position::position_t target, const PackedKey<N>& key) {
    return target < static_cast<Position::position_t>(key);
}
#pragma pack(pop)

class OpeningBookBase {
public:
    virtual int get(const Position& P) const = 0;
    virtual ~OpeningBookBase() = default;
    
    static std::unique_ptr<OpeningBookBase> load(std::string filename, int width, int height);
};

template<typename KeyT, typename ValT>
class DenseBook : public OpeningBookBase {
  std::vector<KeyT> keys;
  std::vector<ValT> values;
  int depth;

 public:
  DenseBook(int depth, std::vector<KeyT> k, std::vector<ValT> v) 
    : keys(std::move(k)), values(std::move(v)), depth{depth} {} 

  DenseBook() : depth(-1) {}
  
  int get(const Position &P) const override {
    if(P.nbMoves() > depth || keys.empty()) return 0;
    
    Position::position_t target = P.key3();
    auto it = std::lower_bound(keys.begin(), keys.end(), target);
    
    if (it != keys.end() && *it == target) {
      size_t index = std::distance(keys.begin(), it);
      return values[index];
    }
    return 0;
  }
};

template<int N>
std::unique_ptr<OpeningBookBase> load_dense_book_n(std::ifstream& ifs, size_t file_size, int depth) {
    size_t num_entries = (file_size - 6) / (N + 1);
    std::vector<PackedKey<N>> keys(num_entries);
    std::vector<uint8_t> values(num_entries);

    if(num_entries > 0) {
      ifs.read(reinterpret_cast<char *>(keys.data()), num_entries * N);
      ifs.read(reinterpret_cast<char *>(values.data()), num_entries * 1);
      if(ifs.fail()) {
        throw std::runtime_error("Failed to read Dense Array data from book file.");
      }
    }
    return std::make_unique<DenseBook<PackedKey<N>, uint8_t>>(depth, std::move(keys), std::move(values));
}

inline std::unique_ptr<OpeningBookBase> OpeningBookBase::load(std::string filename, int width, int height) {
    std::ifstream ifs(filename, std::ios::binary);

    if(ifs.fail()) {
      throw std::runtime_error("Failed to open Connect 4 opening book file: " + filename);
    }

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

    ifs.seekg(0, std::ios::end);
    size_t file_size = ifs.tellg();
    ifs.seekg(6, std::ios::beg);

    switch(partial_key_bytes) {
        case 1: return load_dense_book_n<1>(ifs, file_size, _depth);
        case 2: return load_dense_book_n<2>(ifs, file_size, _depth);
        case 3: return load_dense_book_n<3>(ifs, file_size, _depth);
        case 4: return load_dense_book_n<4>(ifs, file_size, _depth);
        case 5: return load_dense_book_n<5>(ifs, file_size, _depth);
        case 6: return load_dense_book_n<6>(ifs, file_size, _depth);
        case 7: return load_dense_book_n<7>(ifs, file_size, _depth);
        case 8: return load_dense_book_n<8>(ifs, file_size, _depth);
        case 9: return load_dense_book_n<9>(ifs, file_size, _depth);
        case 10: return load_dense_book_n<10>(ifs, file_size, _depth);
        case 11: return load_dense_book_n<11>(ifs, file_size, _depth);
        case 12: return load_dense_book_n<12>(ifs, file_size, _depth);
        case 13: return load_dense_book_n<13>(ifs, file_size, _depth);
        case 14: return load_dense_book_n<14>(ifs, file_size, _depth);
        case 15: return load_dense_book_n<15>(ifs, file_size, _depth);
        case 16: return load_dense_book_n<16>(ifs, file_size, _depth);
        default: throw std::runtime_error("Unsupported key_bytes in dense book.");
    }
}

} // namespace Connect4
} // namespace GameSolver
#endif
