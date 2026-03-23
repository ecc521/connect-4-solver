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
#include "TranspositionTable.hpp"

namespace GameSolver {
namespace Connect4 {

class OpeningBook {
  TableGetter<Position::position_t, uint8_t> *T;
  const int width;
  const int height;
  int depth;

  template<class partial_key_t>
  TableGetter<Position::position_t, uint8_t>* initTranspositionTable(int log_size) {
    switch(log_size) {
    case 10: return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 10>();
    case 11: return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 11>();
    case 12: return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 12>();
    case 13: return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 13>();
    case 14: return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 14>();
    case 15: return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 15>();
    case 16: return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 16>();
    case 17: return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 17>();
    case 18: return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 18>();
    case 19: return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 19>();
    case 20: return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 20>();
    case 21:
      return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 21>();
    case 22:
      return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 22>();
    case 23:
      return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 23>();
    case 24:
      return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 24>();
    case 25:
      return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 25>();
    case 26:
      return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 26>();
    case 27:
      return new TranspositionTable<partial_key_t, Position::position_t, uint8_t, 27>();
    default:
      std::cerr << "Unimplemented OpeningBook size: " << log_size << std::endl;
      return 0;
    }
  }

  TableGetter<Position::position_t, uint8_t>* initTranspositionTable(int partial_key_bytes, int log_size) {
    switch(partial_key_bytes) {
    case 1:
      return initTranspositionTable<uint8_t>(log_size);
    case 2:
      return initTranspositionTable<uint16_t>(log_size);
    case 4:
      return initTranspositionTable<uint32_t>(log_size);
    default:
      std::cerr << "Invalid internal key size: " << partial_key_bytes << " bytes" << std::endl;
      return 0;
    }
  }

 public:
  OpeningBook(int width, int height) : T{0}, width{width}, height{height}, depth{ -1} {} // Empty opening book

  OpeningBook(int width, int height, int depth, TableGetter<Position::position_t, uint8_t>* T) : T{T}, width{width}, height{height}, depth{depth} {} // Empty opening book
  /**
    * Opening book file format:
    * - 1 byte: board width
    * - 1 byte: board height
    * - 1 byte: max stored position depth
    * - 1 byte: key size in bits
    * - 1 byte: value size in bits
    * - 1 byte: log_size = log2(size). number of stored elements (size) is smallest prime number above 2^(log_size)
    * - size key elements
    * - size value elements
    */
  void load(std::string filename) {
    depth = -1;
    delete T;
    std::ifstream ifs(filename, std::ios::binary); // open file

    if(ifs.fail()) {
      return;
    }

    char _width, _height, _depth, value_bytes, partial_key_bytes, log_size;

    ifs.read(&_width, 1);
    if(ifs.fail() || _width != width) {
      return;
    }

    ifs.read(&_height, 1);
    if(ifs.fail() || _height != height) {
      return;
    }

    ifs.read(&_depth, 1);
    if(ifs.fail() || _depth > width * height) {
      return;
    }

    ifs.read(&partial_key_bytes, 1);
    if(ifs.fail() || partial_key_bytes > 8) {
      return;
    }

    ifs.read(&value_bytes, 1);
    if(ifs.fail() || value_bytes != 1) {
      return;
    }

    ifs.read(&log_size, 1);
    if(ifs.fail() || log_size > 40) {
      return;
    }

    if((T = initTranspositionTable(partial_key_bytes, log_size))) {
      ifs.read(reinterpret_cast<char *>(T->getKeys()), T->getSize() * partial_key_bytes);
      ifs.read(reinterpret_cast<char *>(T->getValues()), T->getSize() * value_bytes);
      if(ifs.fail()) {
        return;
      }
      depth = _depth; // set it in case of success only, keep -1 in case of failure
    }
    ifs.close();
  }

  void save(const std::string output_file) const {
    std::ofstream ofs(output_file, std::ios::binary);
    char tmp;
    tmp = width;
    ofs.write(&tmp, 1);
    tmp = height;
    ofs.write(&tmp, 1);
    tmp = depth;
    ofs.write(&tmp, 1);
    tmp = T->getKeySize();
    ofs.write(&tmp, 1);
    tmp = T->getValueSize();
    ofs.write(&tmp, 1);
    tmp = log2(T->getSize());
    ofs.write(&tmp, 1);

    ofs.write(reinterpret_cast<const char *>(T->getKeys()), T->getSize() * T->getKeySize());
    ofs.write(reinterpret_cast<const char *>(T->getValues()), T->getSize() * T->getValueSize());
    ofs.close();
  }

  int get(const Position &P) const {
    if(P.nbMoves() > depth) return 0;
    else return T->get(P.key3());
  }

  ~OpeningBook() {
    delete T;
  }
};

} // namespace Connect4
} // namespace GameSolver
#endif
