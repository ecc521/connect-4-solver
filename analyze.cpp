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

#include "Solver.hpp"
#include <iostream>
#include <cstdlib>

using namespace GameSolver::Connect4;

#include <emscripten/emscripten.h>

extern "C" {

Solver solver;

EMSCRIPTEN_KEEPALIVE void loadBook(const char* bookFilePath) {
  std::string opening_book = std::string(bookFilePath);
  solver.loadBook(opening_book);
}

EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition(const char* positionCharArr) {
  bool weak = false;

  std::string positionString = std::string(positionCharArr);
  Position P;

  int32_t* result = (int32_t*)malloc(9 * sizeof(int32_t));

  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';

    if (P.isWinningMove(lastColPlayed)) {
      result[0] = 1; // Won
    } else {
      result[0] = 2; // Invalid
    }
    result[1] = P.nbMoves();
    for(int i = 0; i < Position::WIDTH; i++) result[2 + i] = 0;
  } 
  else {
    result[0] = 0; // Valid/Normal
    result[1] = P.nbMoves();

    std::vector<int> scores = solver.analyze(P, weak);
    for(int i = 0; i < Position::WIDTH; i++) {
        result[2 + i] = scores[i];
    }
  }

  return result;

}

} //extern "C"