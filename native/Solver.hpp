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

#ifndef SOLVER_HPP
#define SOLVER_HPP

#include <vector>
#include <string>
#include <memory>
#include <atomic>
#include "Position.hpp"
#include "TranspositionTable.hpp"
#include "OpeningBook.hpp"

namespace GameSolver {
namespace Connect4 {

#ifndef EXACT_TABLE_SIZE
#define EXACT_TABLE_SIZE 23
#endif

class Solver {
 private:
  // Dynamically reduce table size for massive boards (e.g. 9x7) to offset the uint64_t memory overhead
  static constexpr int TABLE_SIZE = (Position::WIDTH * Position::HEIGHT >= 56) ? (EXACT_TABLE_SIZE - 1) : EXACT_TABLE_SIZE;
  TranspositionTable < uint_t < Position::WIDTH*(Position::HEIGHT + 1) - TABLE_SIZE >, Position::position_t, uint8_t, TABLE_SIZE > transTable;
  std::unique_ptr<OpeningBookBase> book; // opening book
  std::atomic<unsigned long long> nodeCount; // counter of explored nodes.
  int columnOrder[Position::WIDTH]; // column exploration order

  /**
   * Reccursively score connect 4 position using negamax variant of alpha-beta algorithm.
   * @param: position to evaluate, this function assumes nobody already won and
   *         current player cannot win next move. This has to be checked before
   * @param: alpha < beta, a score window within which we are evaluating the position.
   *
   * @return the exact score, an upper or lower bound score depending of the case:
   * - if actual score of position <= alpha then actual score <= return value <= alpha
   * - if actual score of position >= beta then beta <= return value <= actual score
   * - if alpha <= actual score <= beta then return value = actual score
   */
  int negamax(const Position &P, int alpha, int beta);

 public:
  static const int INVALID_MOVE = -1000;

  // Returns the score of a position
  int solve(const Position &P, bool weak = false);

  /**
   * Evaluate possible winning moves for current player
   * @param P: position to evaluate
   * @param weak: boolean indicating if the solver should only compute outcome (win, draw, loss)
   * @param threads: num WebAssembly std::threads to spawn, defaults to 1 for no multithreading
   * @return a vector of scores for each column
   */
  std::vector<int> analyze(const Position &P, bool weak = false, int threads = 1);

  unsigned long long getNodeCount() const {
    return nodeCount;
  }

  void reset() {
    nodeCount = 0;
    transTable.reset();
  }

  void loadBook(std::string book_file) {
    book = OpeningBookBase::load(book_file, Position::WIDTH, Position::HEIGHT);
  }

  Solver(); // Constructor
};

} // namespace Connect4
} // namespace GameSolver
#endif
