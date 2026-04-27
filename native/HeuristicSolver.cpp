/*
 * This file is part of Connect4 Game Solver <http://connect4.gamesolver.org>
 * Copyright (C) 2017-2019 Pascal Pons <contact@gamesolver.org>
 */

#include "HeuristicSolver.hpp"
#include "MoveSorter.hpp"
#ifdef USE_PTHREADS
#include <thread>
#include <algorithm>
#endif
#include <chrono>

using namespace GameSolver::Connect4;

namespace GameSolver {
namespace Connect4 {

template <int WIDTH, int HEIGHT>
int HeuristicSolver<WIDTH, HEIGHT>::negamax_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int alpha, int beta, int depth, double end_time_ms) {
  assert(alpha < beta);
  assert(!P.canWinNext());

  if (stopSearch.load()) return 0;
  unsigned long long nodes = ++nodeCount;
  if ((nodes & 16383) == 0 && end_time_ms > 0) {
#ifdef __EMSCRIPTEN__
    if (emscripten_get_now() >= end_time_ms) {
      stopSearch = true;
    }
#else
    auto now = std::chrono::time_point_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()).time_since_epoch().count();
    if (now >= end_time_ms) {
      stopSearch = true;
    }
#endif
  }
  typename GenericPosition<WIDTH, HEIGHT>::position_t possible = P.possibleNonLosingMoves();
  if(possible == 0) // opponent wins next move
    return -(WIDTH * HEIGHT - P.nbMoves()) / 2 * 1000;

  if(P.nbMoves() >= WIDTH * HEIGHT - 2) // draw game
    return 0;

  if (depth <= 0) {
    if (GenericPosition<WIDTH, HEIGHT>::popcount(possible) == 1) {
      depth = 1; // Quiescence extension: Forced move resolves tactical tension
    } else {
      return P.heuristic_evaluate();
    }
  }

  int min = -(WIDTH * HEIGHT - 2 - P.nbMoves()) / 2 * 1000;
  if(alpha < min) {
    alpha = min;                     
    if(alpha >= beta) return alpha;  
  }

  int max = (WIDTH * HEIGHT - 1 - P.nbMoves()) / 2 * 1000;
  if(beta > max) {
    beta = max;                     
    if(alpha >= beta) return beta;  
  }

  if constexpr (HEIGHT % 2 == 0) {
    if (P.nbMoves() % 2 == 0) {
      int evens = P.computeEvensStrategy();
      if (evens == 1) { // Forced Loss
        if (beta > -1000) {
          beta = -1000;
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

  const typename GenericPosition<WIDTH, HEIGHT>::position_t key = P.key();
  uint32_t tt_val = transTable->get(key);
  
  // Layout: Score(16) | Depth(6) | Flags(2) | Move(4)
  int val = tt_val ? ((int)(tt_val & 0xFFFF) - 32768) : 0;
  int tt_depth = (tt_val >> 16) & 0x3F;
  int tt_flags = (tt_val >> 22) & 0x03; 
  int best_move_col = tt_val ? (tt_val >> 24) - 1 : -1;

  if(tt_val && tt_depth >= depth) {
    if(tt_flags == 2) { // lower bound
      if(alpha < val) {
        alpha = val;                     
        if(alpha >= beta) return alpha;  
      }
    } else if (tt_flags == 3) { // upper bound
      if(beta > val) {
        beta = val;                     
        if(alpha >= beta) return beta;  
      }
    } else if (tt_flags == 1) { // exact
      return val;
    }
  }

  GenericMoveSorter<WIDTH, HEIGHT> moves;
  for(int i = WIDTH; i--;) {
    int col = columnOrder[i];
    if(typename GenericPosition<WIDTH, HEIGHT>::position_t move = possible & GenericPosition<WIDTH, HEIGHT>::column_mask(col)) {
      int bit_idx = GenericPosition<WIDTH, HEIGHT>::template ctz_impl<position_t>(move);
      int base_score = P.moveScore(move) * 1000000 + history[bit_idx];
      if(col == best_move_col) base_score += 1000000000;
      moves.add(move, base_score);
    }
  }

  int best_seen_col = -1;
  int orig_alpha = alpha;
  int best_score = -1000000;
  bool first_move = true;

  int searched[WIDTH];
  int searched_cnt = 0;

  while(typename GenericPosition<WIDTH, HEIGHT>::position_t next = moves.getNext()) {
    if (stopSearch.load()) break;
    GenericPosition<WIDTH, HEIGHT> P2(P);
    P2.play(next);  
    
    int score = -negamax_heuristic(P2, -beta, -alpha, depth - 1, end_time_ms);
    
    int bit_idx = GenericPosition<WIDTH, HEIGHT>::template ctz_impl<position_t>(next);
    int next_col = bit_idx / (HEIGHT + 1);

    if(score > best_score) {
      best_score = score;
      best_seen_col = next_col;
    }

    if(score > alpha) alpha = score;

    if(alpha >= beta) {
      if constexpr (WIDTH >= 8) {
        if (searched_cnt > 0) {
          for (int i = 0; i < searched_cnt; i++) {
            if (history[searched[i]] > -500000) history[searched[i]]--;
          }
          history[bit_idx] += searched_cnt;
          if (history[bit_idx] > 500000) {
            for (int i = 0; i < WIDTH * (HEIGHT + 1); i++) {
              history[i] /= 2;
            }
          }
        }
      }
      transTable->put(key, ((uint32_t)(next_col + 1) << 24) | (2 << 22) | ((uint32_t)depth << 16) | (uint32_t)(score + 32768)); 
      return score;  
    }
    searched[searched_cnt++] = bit_idx;
    if(score > alpha) {
      alpha = score; 
    }
  }

  int flags = (best_score <= orig_alpha) ? 3 : 1; 
  transTable->put(key, ((uint32_t)(best_seen_col == -1 ? 0 : best_seen_col + 1) << 24) | ((uint32_t)flags << 22) | ((uint32_t)depth << 16) | (uint32_t)(best_score + 32768)); 
  return best_score;
}

template <int WIDTH, int HEIGHT>
std::pair<int, int> HeuristicSolver<WIDTH, HEIGHT>::solve_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int max_depth, double end_time_ms, bool reset_tt) {
  if (reset_tt) {
    reset();
    stopSearch = false;
  } else {
    nodeCount = 0;
  }

  if(P.canWinNext()) 
    return {(WIDTH * HEIGHT + 1 - P.nbMoves()) / 2 * 1000, 0};
  
  int best_score = 0;
  int depth_reached = 0;
  for (int d = 1; d <= max_depth; d++) {
    best_score = negamax_heuristic(P, -1000000, 1000000, d, end_time_ms);
    if (stopSearch.load()) break;
    depth_reached = d;
    if (best_score > 10000 || best_score < -10000) {
      break;
    }
  }
  return {best_score, depth_reached};
}

template <int WIDTH, int HEIGHT>
std::pair<std::vector<int>, int> HeuristicSolver<WIDTH, HEIGHT>::analyze_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int max_depth, int threads, double timeout_ms) {
  std::vector<int> scores(WIDTH, -1000000);
  std::atomic<int> max_depth_reached{0};
#ifdef __EMSCRIPTEN__
  double end_time_ms = timeout_ms > 0.0 ? emscripten_get_now() + timeout_ms : 0.0;
#else
  double end_time_ms = timeout_ms > 0.0 ? std::chrono::time_point_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()).time_since_epoch().count() + timeout_ms : 0.0;
#endif

  reset();

#ifdef USE_PTHREADS
  if (threads <= 1) {
    for (int i = 0; i < WIDTH; i++) {
      int col = columnOrder[i];
      if (P.canPlay(col)) {
        if(P.isWinningMove(col)) {
          scores[col] = (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2 * 1000;
          if (max_depth_reached < 1) max_depth_reached = 1;
        } else {
          GenericPosition<WIDTH, HEIGHT> P2(P);
          P2.playCol(col);
          auto res = solve_heuristic(P2, max_depth - 1, end_time_ms, false);
          scores[col] = -res.first;
          if (res.second + 1 > max_depth_reached) max_depth_reached = res.second + 1;
        }
      }
    }
    return {scores, max_depth_reached};
  }

  std::atomic<int> next_col{0};
  auto worker = [&]() {
    while (true) {
      int i = next_col.fetch_add(1);
      if (i >= WIDTH) break;
      int col = columnOrder[i];

      if (P.canPlay(col)) {
        if(P.isWinningMove(col)) {
          scores[col] = (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2 * 1000;
          int current = max_depth_reached.load();
          while (current < 1 && !max_depth_reached.compare_exchange_weak(current, 1));
        } else {
          GenericPosition<WIDTH, HEIGHT> P2(P);
          P2.playCol(col);
          auto res = solve_heuristic(P2, max_depth - 1, end_time_ms, false);
          scores[col] = -res.first;
          int reached = res.second + 1;
          int current = max_depth_reached.load();
          while (reached > current && !max_depth_reached.compare_exchange_weak(current, reached));
        }
      }
    }
  };

  unsigned int num_threads = std::min((unsigned int)WIDTH, (unsigned int)threads);
  std::vector<std::thread> thread_pool;
  for (unsigned int i = 0; i < num_threads - 1; i++) {
    thread_pool.emplace_back(worker);
  }
  worker();

  for (auto& t : thread_pool) {
    if (t.joinable()) t.join();
  }
#else
  for (int i = 0; i < WIDTH; i++) {
    int col = columnOrder[i];
    if (P.canPlay(col)) {
      if(P.isWinningMove(col)) {
        scores[col] = (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2 * 1000;
        if (max_depth_reached < 1) max_depth_reached = 1;
      } else {
        GenericPosition<WIDTH, HEIGHT> P2(P);
        P2.playCol(col);
        auto res = solve_heuristic(P2, max_depth - 1, end_time_ms, false);
        scores[col] = -res.first;
        if (res.second + 1 > max_depth_reached) max_depth_reached = res.second + 1;
      }
    }
  }
#endif
  return {scores, max_depth_reached};
}

// Constructor
template <int WIDTH, int HEIGHT>
HeuristicSolver<WIDTH, HEIGHT>::HeuristicSolver() : nodeCount{0} {
  size_t table_bytes = (WIDTH * HEIGHT >= 56) ? 16777216 : 33554432; // Default heuristic table size 16MB or 32MB
  transTable = std::make_unique<TranspositionTable<uint64_t, uint32_t, 32>>(table_bytes);
  for(int i = 0; i < WIDTH; i++) // initialize the column exploration order, starting with center columns
    columnOrder[i] = WIDTH / 2 + (1 - 2 * (i % 2)) * (i + 1) / 2; // example for WIDTH=7: columnOrder = {3, 4, 2, 5, 1, 6, 0}
  for (int i = 0; i < WIDTH * (HEIGHT + 1); i++) {
    history[i] = GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS[i];
  }
}

} // namespace Connect4
} // namespace GameSolver
