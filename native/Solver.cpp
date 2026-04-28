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
#include "MoveSorter.hpp"
#ifdef USE_PTHREADS
#include <thread>
#include <algorithm>
#endif

using namespace GameSolver::Connect4;

namespace GameSolver {
namespace Connect4 {

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
template <typename SlotType>
int SolverImpl<SlotType>::negamax(const Position &P, int alpha, int beta) {
  assert(alpha < beta);
  assert(!P.canWinNext());

  nodeCount++; // increment counter of explored nodes

  Position::position_t possible = P.possibleNonLosingMoves();
  if(possible == 0)     // if no possible non losing move, opponent wins next move
    return -(Position::WIDTH * Position::HEIGHT - P.nbMoves()) / 2;

  if(P.nbMoves() >= Position::WIDTH * Position::HEIGHT - 2) // check for draw game
    return 0;

  int min = -(Position::WIDTH * Position::HEIGHT - 2 - P.nbMoves()) / 2;	// lower bound of score as opponent cannot win next move
  if(alpha < min) {
    alpha = min;                     // there is no need to keep alpha below our max possible score.
    if(alpha >= beta) return alpha;  // prune the exploration if the [alpha;beta] window is empty.
  }

  int max = (Position::WIDTH * Position::HEIGHT - 1 - P.nbMoves()) / 2;	// upper bound of our score as we cannot win immediately
  if(beta > max) {
    beta = max;                     // there is no need to keep beta above our max possible score.
    if(alpha >= beta) return beta;  // prune the exploration if the [alpha;beta] window is empty.
  }

  if constexpr (Position::HEIGHT % 2 == 0) {
    if (P.nbMoves() % 2 == 0) {
      int evens = P.computeEvensStrategy();
      if (evens == 1) { // Forced Loss
        if (beta > -1) {
          beta = -1;
          if (alpha >= beta) return beta;
        }
      } else if (evens == 0) { // Forced Draw
        if (beta > 0) {
          beta = 0;
          if (alpha >= beta) return beta;
        }
      }
    }
  }

  const Position::position_t key = P.key();
  if(int val = transTable->get(key)) {
    if(val > Position::MAX_SCORE - Position::MIN_SCORE + 1) { // we have an lower bound
      min = val + 2 * Position::MIN_SCORE - Position::MAX_SCORE - 2;
      if(alpha < min) {
        alpha = min;                     // there is no need to keep beta above our max possible score.
        if(alpha >= beta) return alpha;  // prune the exploration if the [alpha;beta] window is empty.
      }
    } else { // we have an upper bound
      max = val + Position::MIN_SCORE - 1;
      if(beta > max) {
        beta = max;                     // there is no need to keep beta above our max possible score.
        if(alpha >= beta) return beta;  // prune the exploration if the [alpha;beta] window is empty.
      }
    }
  }

  if(book) {
    if(int val = book->get(P)) return val + Position::MIN_SCORE - 1; // look for solutions stored in opening book
  }

  MoveSorter moves;
  for(int i = Position::WIDTH; i--;) {
    if(Position::position_t move = possible & Position::column_mask(columnOrder[i])) {
      int bit_idx = Position::ctz_impl(move);
      int score = P.moveScore(move) * 1000000 + history[bit_idx];
      moves.add(move, score);
    }
  }

#if BOARD_WIDTH_MACRO >= 8
  int searched[Position::WIDTH];
  int searched_cnt = 0;
#endif

  while(Position::position_t next = moves.getNext()) {
    Position P2(P);
    P2.play(next);  // It's opponent turn in P2 position after current player plays x column.
    int score = -negamax(P2, -beta, -alpha); // explore opponent's score within [-beta;-alpha] windows:
    if(score >= beta) {
      if constexpr (Position::WIDTH >= 8) {
#if BOARD_WIDTH_MACRO >= 8
        if (searched_cnt > 0) {
          for (int i = 0; i < searched_cnt; i++) {
            if (history[searched[i]] > -500000) history[searched[i]]--;
          }
          int bit_idx = Position::ctz_impl(next);
          history[bit_idx] += searched_cnt;
          if (history[bit_idx] > 500000) {
            for (int i = 0; i < Position::WIDTH * (Position::HEIGHT + 1); i++) {
              history[i] /= 2;
            }
          }
        }
#endif
      }
      transTable->put(key, score + Position::MAX_SCORE - 2 * Position::MIN_SCORE + 2, std::min(31, Position::WIDTH * Position::HEIGHT - P.nbMoves())); // save the lower bound of the position
      return score;  // prune the exploration if we find a possible move better than what we were looking for.
    }
#if BOARD_WIDTH_MACRO >= 8
    if constexpr (Position::WIDTH >= 8) {
      searched[searched_cnt++] = Position::ctz_impl(next);
    }
#endif
    if(score > alpha) alpha = score; 
  }

  uint8_t work = std::min(31, Position::WIDTH * Position::HEIGHT - P.nbMoves());
  transTable->put(key, alpha - Position::MIN_SCORE + 1, work); // save the upper bound of the position
  return alpha;
}

template <typename SlotType>
int SolverImpl<SlotType>::solve(const Position &P, bool weak) {
  if(P.canWinNext()) // check if win in one move as the Negamax function does not support this case.
    return (Position::WIDTH * Position::HEIGHT + 1 - P.nbMoves()) / 2;
  int min = -(Position::WIDTH * Position::HEIGHT - P.nbMoves()) / 2;
  int max = (Position::WIDTH * Position::HEIGHT + 1 - P.nbMoves()) / 2;
  if(weak) {
    min = -1;
    max = 1;
  }

  while(min < max) {                    // iteratively narrow the min-max exploration window
    int med = min + (max - min) / 2;
    if(med <= 0 && min / 2 < med) med = min / 2;
    else if(med >= 0 && max / 2 > med) med = max / 2;
    int r = negamax(P, med, med + 1);   // use a null depth window to know if the actual score is greater or smaller than med
    if(r <= med) max = r;
    else min = r;
  }
  return min;
}

template <typename SlotType>
std::vector<int> SolverImpl<SlotType>::analyze(const Position &P, bool weak, int threads) {
  (void)threads;
  std::vector<int> scores(Position::WIDTH, -1000);

#ifdef USE_PTHREADS
  if (threads <= 1) {
    for (int i = 0; i < Position::WIDTH; i++) {
      int col = columnOrder[i];
      if (P.canPlay(col)) {
        if(P.isWinningMove(col)) {
          scores[col] = (Position::WIDTH * Position::HEIGHT + 1 - P.nbMoves()) / 2;
        } else {
          Position P2(P);
          P2.playCol(col);
          scores[col] = -solve(P2, weak);
        }
      }
    }
    return scores;
  }

  std::atomic<int> next_col{0};

  auto worker = [&]() {
    while (true) {
      int i = next_col.fetch_add(1);
      if (i >= Position::WIDTH) break;
      int col = columnOrder[i];

      if (P.canPlay(col)) {
        if(P.isWinningMove(col)) {
          scores[col] = (Position::WIDTH * Position::HEIGHT + 1 - P.nbMoves()) / 2;
        } else {
          Position P2(P);
          P2.playCol(col);
          scores[col] = -solve(P2, weak);
        }
      }
    }
  };

  unsigned int num_threads = std::min((unsigned int)Position::WIDTH, (unsigned int)threads);
  
  std::vector<std::thread> thread_pool;
  for (unsigned int i = 0; i < num_threads - 1; i++) {
    try {
      thread_pool.emplace_back(worker);
    } catch (const std::system_error& e) {
      std::cerr << "Connect4Solver Warning: Thread pool exhausted while spawning " << num_threads << " threads. Clamping to " << (i + 1) << " threads." << std::endl;
      break;
    }
  }
  worker(); // use the main thread too

  for (auto& t : thread_pool) {
    if (t.joinable()) t.join();
  }
#else
  for (int i = 0; i < Position::WIDTH; i++) {
    int col = columnOrder[i];
    if (P.canPlay(col)) {
      if(P.isWinningMove(col)) scores[col] = (Position::WIDTH * Position::HEIGHT + 1 - P.nbMoves()) / 2;
      else {
        Position P2(P);
        P2.playCol(col);
        scores[col] = -solve(P2, weak);
      }
    }
  }
#endif

  return scores;
}





#ifndef CACHE_BUCKET_SIZE
#define CACHE_BUCKET_SIZE 1
#endif

template <typename SlotType>
class TypedCache : public Cache {
 public:
  static constexpr int VALUE_BITS = getRequiredValueBits<Position::WIDTH, Position::HEIGHT>();
  std::shared_ptr<TranspositionTable<SlotType, CACHE_BUCKET_SIZE, uint8_t, VALUE_BITS>> transTable;

  TypedCache(size_t table_bytes) 
    : transTable(std::make_shared<TranspositionTable<SlotType, CACHE_BUCKET_SIZE, uint8_t, VALUE_BITS>>(table_bytes)) {}
    
  void reset() override {
    transTable->reset();
  }
};

std::unique_ptr<Cache> Solver::createCache(size_t table_bytes) {
  uint64_t min_32 = getMinimumTableBytes<uint32_t>();
  uint64_t min_64 = getMinimumTableBytes<uint64_t>();

  if (table_bytes >= min_32 && min_32 != UINT64_MAX) {
      return std::make_unique<TypedCache<uint32_t>>(table_bytes);
  } else {
      return std::make_unique<TypedCache<uint64_t>>(table_bytes);
  }
}

std::unique_ptr<Solver> Solver::createWithCache(Cache* cache) {
  if (auto c32 = dynamic_cast<TypedCache<uint32_t>*>(cache)) {
    return std::make_unique<SolverImpl<uint32_t>>(c32->transTable);
  } else if (auto c64 = dynamic_cast<TypedCache<uint64_t>*>(cache)) {
    return std::make_unique<SolverImpl<uint64_t>>(c64->transTable);
  } else {
    throw std::invalid_argument("Unsupported cache type");
  }
}

// Explicit template instantiations
template class SolverImpl<uint32_t>;
template class SolverImpl<uint64_t>;

} // namespace Connect4
} // namespace GameSolver
