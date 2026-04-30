#include <mutex>
/*
 * This file is part of Connect4 Game Solver <http://connect4.gamesolver.org>
 * Copyright (C) 2017-2019 Pascal Pons <contact@gamesolver.org>
 */

#include "HeuristicSolver.hpp"
#include "MoveSorter.hpp"
#ifdef USE_PTHREADS
#include <thread>
#include <algorithm>
#include <iostream>
#endif
#include <chrono>
#include <stdexcept>

using namespace GameSolver::Connect4;

namespace GameSolver {
namespace Connect4 {

namespace {
  thread_local uint32_t heuristicTlNodeCount = 0;
  thread_local int smp_thread_id = 0;
}

template <int WIDTH, int HEIGHT>
int HeuristicSolver<WIDTH, HEIGHT>::negamax_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int alpha, int beta, int depth, double end_time_ms, NNUEAccumulator<WIDTH, HEIGHT>& acc) {
  assert(alpha < beta);
  assert(!P.canWinNext());

  if (++heuristicTlNodeCount >= 16384) {
    nodeCount.fetch_add(heuristicTlNodeCount, std::memory_order_relaxed);
    heuristicTlNodeCount = 0;
    if (stopSearch.load(std::memory_order_relaxed)) return 0;
    if (end_time_ms > 0) {
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
      int eval = NNUE<WIDTH, HEIGHT>::evaluate_accumulated(acc, P);
      if (eval > 9000) eval = 9000;
      if (eval < -9000) eval = -9000;
      return eval;
    }
  }

  if ((possible & (possible - 1)) == 0) {
    GenericPosition<WIDTH, HEIGHT> P2(P);
    P2.play(possible);
    if (heuristicTlNodeCount > 0) {
      heuristicTlNodeCount--;
    } else {
      nodeCount.fetch_sub(1, std::memory_order_relaxed);
    }
    
    int bit_idx = GenericPosition<WIDTH, HEIGHT>::template ctz_impl<position_t>(possible);
    int next_col = bit_idx / (HEIGHT + 1);
    int next_row = bit_idx % (HEIGHT + 1);
    int player = P.nbMoves() % 2;

    acc.addPiece(player, next_col, next_row);
    int score = -negamax_heuristic(P2, -beta, -alpha, depth - 1, end_time_ms, acc);
    acc.removePiece(player, next_col, next_row);
    return score;
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
      if (evens < 0) { // Forced Loss with calculated upper bound
        int evens_scaled = evens * 1000;
        if (beta > evens_scaled) {
          beta = evens_scaled;
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
  
  int val = tt_val ? ((int)(tt_val & 0xFFFF) - 32768) : 0;
  int tt_depth = (tt_val >> 16) & 0x3F;
  int tt_flags = (tt_val >> 22) & 0x03; 
  int best_move_col = tt_val ? (tt_val >> 24) - 1 : -1;
  uint32_t tt_extra_key = (tt_val >> 28) & 0xF;
  uint32_t current_extra_key = (uint32_t)((key / transTable->getSize()) >> 32) & 0xF;

  if(tt_val && tt_depth >= depth && tt_extra_key == current_extra_key) {
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
      if (smp_thread_id > 0) {
        // Perturb the score slightly to induce search divergence
        base_score += ((smp_thread_id * 17 + bit_idx) % 7);
      }
      if(col == best_move_col) base_score += 1000000000;
      moves.add(move, base_score);
    }
  }

  int best_seen_col = -1;
  int orig_alpha = alpha;
  int best_score = -1000000;

  while(typename GenericPosition<WIDTH, HEIGHT>::position_t next = moves.getNext()) {
    if (stopSearch.load(std::memory_order_relaxed)) break;
    GenericPosition<WIDTH, HEIGHT> P2(P);
    P2.play(next);  
    
    int bit_idx = GenericPosition<WIDTH, HEIGHT>::template ctz_impl<position_t>(next);
    int next_col = bit_idx / (HEIGHT + 1);
    int next_row = bit_idx % (HEIGHT + 1);
    int player = P.nbMoves() % 2;

    acc.addPiece(player, next_col, next_row);
    int score = -negamax_heuristic(P2, -beta, -alpha, depth - 1, end_time_ms, acc);
    acc.removePiece(player, next_col, next_row);

    if(score > best_score) {
      best_score = score;
      best_seen_col = next_col;
    }

    if(score > alpha) alpha = score;

    if(alpha >= beta) {
      // Decay history slightly to prevent overflow and prioritize recent cutoffs
      if (history[bit_idx] > 100000) {
        for (int i = 0; i < WIDTH * (HEIGHT + 1); i++) {
          history[i] /= 2;
        }
      }
      history[bit_idx] += depth * depth; // standard history heuristic scale

      uint32_t extra_key = (uint32_t)((key / transTable->getSize()) >> 32) & 0xF;
      transTable->put(key, (extra_key << 28) | ((uint32_t)(next_col + 1) << 24) | (2 << 22) | ((uint32_t)depth << 16) | (uint32_t)(score + 32768)); 
      return score;  
    }
    if(score > alpha) {
      alpha = score; 
    }
  }

  int flags = (best_score <= orig_alpha) ? 3 : 1; 
  uint32_t extra_key = (uint32_t)((key / transTable->getSize()) >> 32) & 0xF;
  transTable->put(key, (extra_key << 28) | ((uint32_t)(best_seen_col == -1 ? 0 : best_seen_col + 1) << 24) | ((uint32_t)flags << 22) | ((uint32_t)depth << 16) | (uint32_t)(best_score + 32768)); 
  return best_score;
}

template <int WIDTH, int HEIGHT>
SolverResult HeuristicSolver<WIDTH, HEIGHT>::solve_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int max_depth, double end_time_ms, bool reset_tt, NNUEAccumulator<WIDTH, HEIGHT>* acc, int threads) {
  if (reset_tt) {
    reset();
    stopSearch = false;
  }

  if(P.canWinNext()) {
    int score = (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2 * 1000;
    for (int i = 0; i < WIDTH; i++) {
        if (P.canPlay(i) && P.isWinningMove(i)) return {score, i, (int)P.nbMoves(), getNodeCount()};
    }
    return {score, -1, (int)P.nbMoves(), getNodeCount()};
  }
  
  NNUEAccumulator<WIDTH, HEIGHT> local_acc;
  if (!acc) {
    local_acc.init(P);
    acc = &local_acc;
  }

  int best_score = 0;
  int best_move = -1;
  int depth_reached = 0;
  for (int d = 1; d <= max_depth; d++) {
    int current_score = negamax_heuristic(P, -1000000, 1000000, d, end_time_ms, *acc);
    if (stopSearch.load(std::memory_order_relaxed) && d > 1) break;
    best_score = current_score;
    
    // Extract best move from TT
    uint32_t val = transTable->get(P.key());
    if (val != 0) {
        int move_idx = (int)((val >> 24) & 0xF);
        if (move_idx > 0) best_move = move_idx - 1;
    }

    depth_reached = d;
    if (best_score > 1000000 || best_score < -1000000) {
      break;
    }
  }
  nodeCount.fetch_add(heuristicTlNodeCount, std::memory_order_relaxed);
  heuristicTlNodeCount = 0;
  return {best_score, best_move, depth_reached, getNodeCount()};
}

template <int WIDTH, int HEIGHT>
std::pair<std::vector<int>, int> HeuristicSolver<WIDTH, HEIGHT>::analyze_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int max_depth, int threads, double timeout_ms) {
  std::vector<int> scores(WIDTH, -1000000);
  int final_depth_reached = 0;
#ifdef __EMSCRIPTEN__
  double end_time_ms = timeout_ms > 0.0 ? emscripten_get_now() + timeout_ms : 0.0;
#else
  double end_time_ms = timeout_ms > 0.0 ? std::chrono::time_point_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now()).time_since_epoch().count() + timeout_ms : 0.0;
#endif

  reset();
  nodeCount = 0;

  int total_valid_cols = 0;
  for (int i = 0; i < WIDTH; i++) {
    if (P.canPlay(i)) total_valid_cols++;
  }
  if (total_valid_cols == 0) return {scores, 0};

  for (int d = 1; d <= max_depth; d++) {
    std::vector<int> current_scores = scores;

#ifdef USE_PTHREADS
    std::atomic<int> next_col{0};
    auto worker = [&]() {
      while (true) {
        int i = next_col.fetch_add(1, std::memory_order_relaxed);
        if (i >= WIDTH) break;
        if (stopSearch.load(std::memory_order_relaxed)) break;

        int col = columnOrder[i];
        if (P.canPlay(col)) {
          if(P.isWinningMove(col)) {
            current_scores[col] = (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2 * 1000;
          } else {
            GenericPosition<WIDTH, HEIGHT> P2(P);
            P2.playCol(col);
            NNUEAccumulator<WIDTH, HEIGHT> local_acc;
            local_acc.init(P2);
            int score = -negamax_heuristic(P2, -1000000, 1000000, d - 1, end_time_ms, local_acc);
            if (stopSearch.load(std::memory_order_relaxed)) break;
            current_scores[col] = score;
          }
        }
      }
      nodeCount.fetch_add(heuristicTlNodeCount, std::memory_order_relaxed);
      heuristicTlNodeCount = 0;
    };

    unsigned int num_threads = std::min((unsigned int)WIDTH, (unsigned int)threads);
    if (num_threads <= 1) {
      worker();
    } else {
      pool->ensureCapacity(num_threads - 1);
      std::atomic<int> remaining(num_threads - 1);
      std::mutex wait_mutex;
      std::condition_variable wait_cv;
      
      for (unsigned int i = 0; i < num_threads - 1; i++) {
        pool->enqueue([&]() {
          worker();
          if (remaining.fetch_sub(1) == 1) {
            std::unique_lock<std::mutex> lock(wait_mutex);
            wait_cv.notify_all();
          }
        });
      }
      worker();
      
      std::unique_lock<std::mutex> lock(wait_mutex);
      wait_cv.wait(lock, [&] { return remaining == 0; });
    }
#else
    for (int i = 0; i < WIDTH; i++) {
      if (stopSearch.load(std::memory_order_relaxed)) break;
      int col = columnOrder[i];
      if (P.canPlay(col)) {
        if(P.isWinningMove(col)) {
          current_scores[col] = (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2 * 1000;
        } else {
          GenericPosition<WIDTH, HEIGHT> P2(P);
          P2.playCol(col);
          NNUEAccumulator<WIDTH, HEIGHT> local_acc;
          local_acc.init(P2);
          int score = -negamax_heuristic(P2, -1000000, 1000000, d - 1, end_time_ms, local_acc);
          if (stopSearch.load(std::memory_order_relaxed)) break;
          current_scores[col] = score;
        }
      }
    }
    nodeCount.fetch_add(heuristicTlNodeCount, std::memory_order_relaxed);
    heuristicTlNodeCount = 0;
#endif

    if (stopSearch.load(std::memory_order_relaxed) && d > 1) break;
    scores = current_scores;
    final_depth_reached = d;
  }

  return {scores, final_depth_reached};
}

template <int WIDTH, int HEIGHT>
HeuristicSolver<WIDTH, HEIGHT>::HeuristicSolver(std::shared_ptr<TranspositionTable<unsigned __int128, int32_t, 32>> cache) : transTable(cache), nodeCount{0}, isSearching{false}, pool(std::make_unique<ThreadPool>()) {
  for(int i = 0; i < WIDTH; i++) 
    columnOrder[i] = WIDTH / 2 + (1 - 2 * (i % 2)) * (i + 1) / 2; 
  for (int i = 0; i < WIDTH * (HEIGHT + 1); i++) {
    history[i] = GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS[i];
  }
}

} // namespace Connect4
} // namespace GameSolver
