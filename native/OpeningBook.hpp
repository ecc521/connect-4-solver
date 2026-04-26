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
#include "CuckooTable.hpp"
#include <stdexcept>

namespace GameSolver {
namespace Connect4 {

class OpeningBook {
  CuckooTable<Position::position_t, uint8_t> *T;
  const int width;
  const int height;
  int depth;

 public:
  OpeningBook(int width, int height) : T{0}, width{width}, height{height}, depth{-1} {} // Empty opening book

  OpeningBook(int width, int height, int depth, CuckooTable<Position::position_t, uint8_t>* T) : T{T}, width{width}, height{height}, depth{depth} {} 
  
  /**
    * Opening book file format (Cuckoo format):
    * - 1 byte: board width
    * - 1 byte: board height
    * - 1 byte: max stored position depth
    * - 1 byte: key size in bits (unused in Cuckoo, keep for header size compatibility)
    * - 1 byte: value size in bits (must be 2 to indicate Cuckoo format)
    * - 1 byte: log_size (unused in Cuckoo, keep for header size compatibility)
    * - file size - 6 bytes: Cuckoo buckets data
    */
  void load(std::string filename) {
    depth = -1;
    delete T;
    std::ifstream ifs(filename, std::ios::binary); // open file

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

    if (value_bytes != 2) {
      throw std::runtime_error("Invalid Connect 4 opening book format. Only Cuckoo books are supported.");
    }

    ifs.seekg(0, ifs.end);
    size_t file_size = ifs.tellg();
    ifs.seekg(6, ifs.beg);

    size_t num_buckets = (file_size - 6) / 8;
    T = new CuckooTable<Position::position_t, uint8_t>(num_buckets);

    if(T) {
      ifs.read(reinterpret_cast<char *>(T->getKeys()), T->getSize() * T->getKeySize());
      if(ifs.fail()) {
        delete T;
        T = 0;
        throw std::runtime_error("Failed to read Cuckoo table data from book file.");
      }
      depth = _depth; // set it in case of success only
    }
    ifs.close();
  }

  void save(const std::string output_file) const {
    if (!T) return;
    std::ofstream ofs(output_file, std::ios::binary);
    char tmp;
    tmp = width;
    ofs.write(&tmp, 1);
    tmp = height;
    ofs.write(&tmp, 1);
    tmp = depth;
    ofs.write(&tmp, 1);
    tmp = 2; // Key size dummy value
    ofs.write(&tmp, 1);
    tmp = 2; // Value_size MUST be 2 to indicate Cuckoo format
    ofs.write(&tmp, 1);
    tmp = 0; // Log size dummy value
    ofs.write(&tmp, 1);

    ofs.write(reinterpret_cast<const char *>(T->getKeys()), T->getSize() * T->getKeySize());
    ofs.close();
  }

  int get(const Position &P) const {
    if(P.nbMoves() > depth || !T) return 0;
    else return T->get(P.key3());
  }

  ~OpeningBook() {
    delete T;
  }
};

} // namespace Connect4
} // namespace GameSolver
#endif
