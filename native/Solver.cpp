// Move ordering strategy (override at compile time with -DMOVE_ORDER_STRATEGY=0)
// 0 = baseline: moveScore weighted equally across all threats
// 1 = two-tier: immediate threats (reachable next turn) count double [DEFAULT, -8% nodes overall]
#ifndef MOVE_ORDER_STRATEGY
#define MOVE_ORDER_STRATEGY 1
#endif

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

#ifdef __EMSCRIPTEN__
#define WASM_U128_T GameSolver::Connect4::wasm_uint128_t
#else
#define WASM_U128_T unsigned __int128
#endif

#include <stdexcept>
#include <iostream>
#include <chrono>
#include <thread>
#include <algorithm>
#include <future>
#include <new>

using namespace GameSolver::Connect4;

namespace GameSolver {
namespace Connect4 {

namespace {
  thread_local uint32_t solverTlNodeCount = 0;

  [[gnu::cold]] bool checkTimeout(double current_end_time) {
    if (current_end_time > 0.0) {
      double now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count();
      if (now >= current_end_time) return true;
    }
    return false;
  }
}

/**
 * Reccursively score connect 4 position using negamax variant of alpha-beta algorithm.
 */
template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
template <bool HasBook, int W_CONST, int H_CONST>
int SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, SlotType>::negamax(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, int alpha, int beta, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag, int32_t* thread_history) {
  if (shouldAbort(abort_flag)) [[unlikely]] return 0;

  assert(alpha < beta);
  if (P.canWinNext()) [[unlikely]] {
    return ((P.width() * P.height()) + 1 - P.nbMoves()) / 2;
  }

  if (++solverTlNodeCount >= 16384) [[unlikely]] {
    nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
    solverTlNodeCount = 0;
    // Check timeout, promoting to stopSearch if expired
    if (checkTimeout(this->endTime.load(std::memory_order_relaxed))) {
      this->stopSearch.store(true, std::memory_order_relaxed);
      return 0;
    }
    if (shouldAbort(abort_flag)) return 0;
  }

  using pos_t = typename GenericPosition<W_CONST, H_CONST, ALIGN, WRAP>::position_t;
  pos_t possible = static_cast<pos_t>(P.possibleNonLosingMoves());
  if(possible == 0)     // if no possible non losing move, opponent wins next move
    return -((P.width() * P.height()) - P.nbMoves()) / 2;

  if(P.nbMoves() >= (P.width() * P.height()) - 2) [[unlikely]] // check for draw game
    return 0;

  if ((possible & (possible - 1)) == 0) {
    GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> P2(P);
    P2.play(possible);
    if (solverTlNodeCount > 0) {
      solverTlNodeCount--;
    } else {
      nodeCount.fetch_sub(1, std::memory_order_relaxed);
    }
    return -negamax<HasBook, W_CONST, H_CONST>(P2, -beta, -alpha, book, book_depth, abort_flag, thread_history);
  }

  nodeCount.fetch_add(1, std::memory_order_relaxed);

  const int w_val = W_CONST != -1 ? W_CONST : P.width();
  const int h_val = H_CONST != -1 ? H_CONST : P.height();

  int min = -((w_val * h_val) - 2 - P.nbMoves()) / 2;	// lower bound of score as opponent cannot win next move
  if(alpha < min) {
    alpha = min;                     // there is no need to keep alpha below our max possible score.
    if(alpha >= beta) return alpha;  // prune the exploration if the [alpha;beta] window is empty.
  }

  int max = ((w_val * h_val) - 1 - P.nbMoves()) / 2;	// upper bound of score as current player cannot win next move
  if(beta > max) {
    beta = max;                     // there is no need to keep beta above our max possible score.
    if(alpha >= beta) return beta;  // prune the exploration if the [alpha;beta] window is empty.
  }

  if (h_val % 2 == 0) {
    if (P.nbMoves() % 2 == 0) {
      int evens = P.computeEvensStrategy();
      if (evens < 0) { // Forced Loss with calculated upper bound
        if (beta > evens) {
          beta = evens;
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

  constexpr int TT_PROBE_DEPTH = 15; // stop symmetry and child-probing at <= 15 plies from leaf

  bool is_reverse = false;
  typename GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::position_t key;
  if ((w_val * h_val) - P.nbMoves() <= TT_PROBE_DEPTH) {
    key = P.key();
  } else {
    key = P.symmetric_key(is_reverse);
  }
  uint8_t table_move = w_val;

  if(auto packed = transTable->getPacked(key); packed.value) {
    uint8_t val = packed.value;
    table_move = packed.best_move;
    if (table_move < w_val && is_reverse) table_move = w_val - 1 - table_move;

    if(val > P.max_score() - P.min_score() + 1) { // we have an lower bound
      min = val + 2 * P.min_score() - P.max_score() - 2;
      alpha = std::max(alpha, min);
      if(alpha >= beta) return alpha;
    } else { // we have an upper bound
      max = val + P.min_score() - 1;
      beta = std::min(beta, max);
      if(alpha >= beta) return beta;
    }
  }

    // 1-ply TT lookahead (Child Probing) to prune early before deep searches
    if (P.nbMoves() < ((w_val * h_val)) - TT_PROBE_DEPTH) {
      for (int i = 0; i < w_val; i++) {
        int col;
        if constexpr (W_CONST != -1) {
            constexpr auto col_order = []() {
                std::array<int, W_CONST> arr{};
                for(int j = 0; j < W_CONST; j++) arr[j] = W_CONST/2 + (1-2*(j%2))*(j+1)/2;
                return arr;
            }();
            col = col_order[i];
        } else {
            col = this->COLUMN_ORDER[i];
        }
        if (pos_t move = possible & static_cast<pos_t>(P.column_mask(col))) {
        GenericPosition<W_CONST, H_CONST, ALIGN, WRAP> child(P);
        child.play(move);
        pos_t child_key;
        if ((w_val * h_val) - child.nbMoves() <= TT_PROBE_DEPTH) {
          child_key = child.key();
        } else {
          child_key = child.symmetric_key();
        }
        if (auto child_packed = transTable->getPacked(child_key); child_packed.value) {
          uint8_t child_val = child_packed.value;
          if (child_val <= P.max_score() - P.min_score() + 1) {
            // child upper bound means child_score <= child_max
            // so our_score >= -child_max. This is a lower bound for us!
            int child_max = child_val + P.min_score() - 1;
            int our_min = -child_max;
              alpha = std::max(alpha, our_min);
              if (alpha >= beta) return alpha;
          }
        }
      }
    }
  }

  if constexpr (HasBook) {
    if (P.nbMoves() <= book_depth) {
      if(int val = book->get(P)) return val + P.min_score() - 1; // look for solutions stored in opening book
    }
  }

    GenericMoveSorter<W_CONST, H_CONST, ALIGN, WRAP> moves(w_val);

    for(int i = w_val; i--;) {
      int col;
      if constexpr (W_CONST != -1) {
          constexpr auto col_order = []() {
              std::array<int, W_CONST> arr{};
              for(int j = 0; j < W_CONST; j++) arr[j] = W_CONST/2 + (1-2*(j%2))*(j+1)/2;
              return arr;
          }();
          col = col_order[i];
      } else {
          col = this->COLUMN_ORDER[i];
      }
      if(pos_t move = possible & static_cast<pos_t>(P.column_mask(col))) {

      int score = 0;

#if MOVE_ORDER_STRATEGY == 0
      // Baseline: count all threats created, weighted equally.
      score = P.moveScore(move) * 1000000;

#else // MOVE_ORDER_STRATEGY == 1 (default)
      // Two-tier: threats reachable next turn count double.
      {
        const pos_t all_threats = static_cast<pos_t>(P.compute_winning_position(
            P.getCurrentPosition() | move, P.getMask() | move));
        const pos_t child_possible = (possible & ~static_cast<pos_t>(P.column_mask(col)))
                                   | ((move << 1) & static_cast<pos_t>(P.get_board_mask()));
        const pos_t next_reachable = (child_possible << 1) & static_cast<pos_t>(P.get_board_mask());
        score = GenericPosition<W_CONST, H_CONST, ALIGN, WRAP>::popcount(all_threats) * 1000000
              + GenericPosition<W_CONST, H_CONST, ALIGN, WRAP>::popcount(all_threats & next_reachable) * 1000000;
      }
#endif

      // Common tail: TT-move and history bonuses (all strategies)
      if (col == table_move)  score += 100000000;
      if (thread_history)     score += thread_history[col * (h_val + 1)] * 100;
      moves.add(move, score);

      // Prefetch child TT entry (all strategies)
      GenericPosition<W_CONST, H_CONST, ALIGN, WRAP> child(P);
      child.play(move);
      typename GenericPosition<W_CONST, H_CONST, ALIGN, WRAP>::position_t child_key;
      if ((w_val * h_val) - child.nbMoves() <= TT_PROBE_DEPTH) {
        child_key = child.key();
      } else {
        child_key = child.symmetric_key();
      }
      transTable->prefetch(child_key);
    }
  }


#if BOARD_WIDTH_MACRO >= 8
#endif

  int best_score = -P.max_score();
  uint8_t best_move = w_val;

  while(typename GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::position_t next = moves.getNext()) {
    GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> P2(P);
    P2.play(next);
    int score = -negamax<HasBook, W_CONST, H_CONST>(P2, -beta, -alpha, book, book_depth, abort_flag, thread_history);

    if (shouldAbort(abort_flag)) return 0;

    if(score > best_score) {
      best_score = score;
      best_move = GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::ctz_impl(next) / (P.height() + 1);
    }

    if(best_score >= beta) {
      uint8_t stored_move = best_move;
      if (stored_move < w_val && is_reverse) stored_move = w_val - 1 - stored_move;
      transTable->put(key, best_score + P.max_score() - 2 * P.min_score() + 2, w_val * h_val - P.nbMoves(), stored_move);
      return best_score;
    }
    alpha = std::max(alpha, best_score);
  }

  uint8_t work = (w_val * h_val) - P.nbMoves();
  uint8_t stored_move = best_move;
  if (stored_move < w_val && is_reverse) stored_move = w_val - 1 - stored_move;
  transTable->put(key, best_score - P.min_score() + 1, work, stored_move);
  return best_score;
}

template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
template <bool HasBook>
int SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, SlotType>::dispatch_solve_weak(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>& P, int min, int max, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag, int32_t* thread_history) {
    if constexpr (WIDTH == -1 && HEIGHT == -1) {
        if (P.width() == 7 && P.height() == 6) {
            return negamax<HasBook, 7, 6>(P, min, max, book, book_depth, abort_flag, thread_history);
        }
        if (P.width() == 8 && P.height() == 6) {
            return negamax<HasBook, 8, 6>(P, min, max, book, book_depth, abort_flag, thread_history);
        }
        if (P.width() == 7 && P.height() == 7) {
            return negamax<HasBook, 7, 7>(P, min, max, book, book_depth, abort_flag, thread_history);
        }
        if (P.width() == 6 && P.height() == 8) {
            return negamax<HasBook, 6, 8>(P, min, max, book, book_depth, abort_flag, thread_history);
        }
    }
    return negamax<HasBook, WIDTH, HEIGHT>(P, min, max, book, book_depth, abort_flag, thread_history);
}

/**
 * Serial solve implementation. Can be called with an abort_flag for Lazy SMP
 * and an optional private history table for search diversity.
 */
template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
template <bool HasBook>
::GameSolver::Connect4::SolverResult SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, SlotType>::solve_single(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag, int32_t* thread_history) {
  if(P.canWinNext()) {
    int score = ((P.width() * P.height()) + 1 - P.nbMoves()) / 2;
    for (int i = 0; i < P.width(); i++) {
        if (P.canPlay(i) && P.isWinningMove(i)) return {score, i, (int)P.nbMoves(), getNodeCount()};
    }
    return {score, -1, (int)P.nbMoves(), getNodeCount()};
  }

  if constexpr (HasBook) {
    if (P.nbMoves() <= book_depth) {
      if(int val = book->get(P))      return {val + P.min_score() - 1, -1, (int)P.nbMoves(), getNodeCount()};
    }
  }

  int min = -((P.width() * P.height()) - P.nbMoves()) / 2;
  int max = ((P.width() * P.height()) + 1 - P.nbMoves()) / 2;
  int score = 0;
  if (weak) {
    min = -1;
    max = 1;
    while(min < max) {
      if (shouldAbort(abort_flag)) { score = min; break; }
      int med = min + (max - min) / 2;
      if(med <= 0 && min / 2 < med) med = min / 2;
      else if(med >= 0 && max / 2 > med) med = max / 2;
      int r = dispatch_solve_weak<HasBook>(P, med, med + 1, book, book_depth, abort_flag, thread_history);
      if (shouldAbort(abort_flag)) { score = min; break; }
      if(r <= med) max = r;
      else min = r;
    }
    score = min;
  } else {
    int r = dispatch_solve_weak<HasBook>(P, -1, 0, book, book_depth, abort_flag, thread_history);
    if (shouldAbort(abort_flag)) goto flush;
    if (r <= -1) {
      max = -1;
      for (int i = -2; i >= min; i--) {
        if (shouldAbort(abort_flag)) { score = max; goto flush; }
        if (dispatch_solve_weak<HasBook>(P, i, i + 1, book, book_depth, abort_flag, thread_history) > i) {
          min = max = i + 1;
          break;
        }
        if (i == min) {
          max = min;
          break;
        }
      }
      score = max;
    } else {
      r = negamax<HasBook>(P, 0, 1, book, book_depth, abort_flag, thread_history);
      if (shouldAbort(abort_flag)) { score = 0; goto flush; }
      if (r <= 0) {
        score = 0;
      } else {
        min = 1;
        for (int i = 1; i < max; i++) {
          if (shouldAbort(abort_flag)) { score = min; goto flush; }
          if (dispatch_solve_weak<HasBook>(P, i, i + 1, book, book_depth, abort_flag, thread_history) <= i) {
            min = max = i;
            break;
          }
          if (i == max - 1) {
            min = max;
            break;
          }
        }
        score = min;
      }
    }
  }
flush:
  nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
  solverTlNodeCount = 0;

  if (shouldAbort(abort_flag)) {
    return {score, -1, (int)P.nbMoves(), getNodeCount(), true};
  }

  int bestMove = -1;

  // PHASE 1: Try to find a move using ONLY the Opening Book (Shortcut for Sparse Books)
  if constexpr (HasBook) {
    if (P.nbMoves() <= book_depth) {
      for (int i = 0; i < P.width(); i++) {
          int col = this->COLUMN_ORDER[i];
          if (P.canPlay(col)) {
              GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> P2(P);
              P2.playCol(col);
              if (int val = book->get(P2)) {
                  int child_score = val + P.min_score() - 1;
                  if (-child_score == score) {
                      bestMove = col;
                      break;
                  }
              }
          }
      }
    }
  }

  // PHASE 2: Fallback to hot-TT scan for best move
  if (bestMove == -1) {
    typename GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::position_t possible = P.possibleNonLosingMoves();
    if (possible == 0) {
      // If there are no non-losing moves, any playable move is equally bad.
      for (int i = 0; i < P.width(); i++) {
        int col = this->COLUMN_ORDER[i];
        if (P.canPlay(col)) {
          bestMove = col;
          break;
        }
      }
    } else {
      for (int i = 0; i < P.width(); i++) {
          int col = this->COLUMN_ORDER[i];
          if (possible & P.column_mask(col)) {
              GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> P2(P);
              P2.playCol(col);
              if (dispatch_solve_weak<HasBook>(P2, -score, -score + 1, book, book_depth, abort_flag, thread_history) == -score) {
                  bestMove = col;
                  break;
              }
          }
      }
    }
  }

  return {score, bestMove, (int)P.nbMoves(), getNodeCount()};
}

/**
 * Public solve() entry point. When threads > 1, uses Lazy SMP:
 * N threads search the same position with the same aspiration windows,
 * sharing the transposition table but using private history tables.
 * First thread to complete determines the result; others are aborted.
 */
template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
::GameSolver::Connect4::SolverResult SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, SlotType>::solve(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak, int threads, const OpeningBookBase<WIDTH, HEIGHT>* book, double timeout_ms) {
#ifndef USE_PTHREADS
  threads = 1;
#endif
  if (isSearching.exchange(true, std::memory_order_acquire)) {
    throw std::runtime_error("Solver is busy: concurrent execution on the same instance is strictly prohibited.");
  }
  struct LockGuard {
    std::atomic<bool>& flag;
    ~LockGuard() { flag.store(false, std::memory_order_release); }
  } guard{isSearching};

  // Reset all abort state, then configure timeout if requested
  stopSearch.store(false, std::memory_order_relaxed);
  if (timeout_ms > 0) {
    auto now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count();
    endTime.store(now + timeout_ms, std::memory_order_relaxed);
  } else {
    endTime.store(0.0, std::memory_order_relaxed);
  }

  const OpeningBookBase<WIDTH, HEIGHT>* active_book = book ? book : this->book;

  if (threads <= 1) {
    if (active_book) return solve_single<true>(P, weak, active_book, active_book->getDepth());
    else return solve_single<false>(P, weak, nullptr, 0);
  }

  // --- True Lazy SMP ---
  pool->ensureCapacity(threads - 1);
  
  std::atomic<bool> done{false};
  ::GameSolver::Connect4::SolverResult final_result{0, -1, (int)P.nbMoves(), 0};
  std::mutex result_mutex;
  
  std::atomic<int> remaining(threads - 1);
  std::promise<void> prom;
  auto fut = prom.get_future();

  // Launch helper threads with private history copies
  for (int t = 1; t < threads; t++) {
    pool->enqueue([&, t]() {
      // Private history copy with thread-indexed perturbation for search diversity
      std::vector<int32_t> local_history(P.width() * (P.height() + 1));
      for (int i = 0; i < P.width() * (P.height() + 1); i++) {
        local_history[i] = this->TROMP_WEIGHTS[i];
        // Add small per-thread perturbation to create move ordering diversity
        local_history[i] += (t * 7 + i * 3) % 5;
      }
      
      solverTlNodeCount = 0;
      ::GameSolver::Connect4::SolverResult r;
      if (active_book) r = solve_single<true>(P, weak, active_book, active_book->getDepth(), &done, local_history.data());
      else r = solve_single<false>(P, weak, nullptr, 0, &done, local_history.data());
      nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
      solverTlNodeCount = 0;
      
      if (!done.exchange(true)) {
        std::lock_guard<std::mutex> lock(result_mutex);
        final_result = r;
      }
      if (remaining.fetch_sub(1) == 1) {
        prom.set_value();
      }
    });
  }

  // Main thread also searches (thread 0, no perturbation)
  solverTlNodeCount = 0;
  ::GameSolver::Connect4::SolverResult r;
  if (active_book) r = solve_single<true>(P, weak, active_book, active_book->getDepth(), &done);
  else r = solve_single<false>(P, weak, nullptr, 0, &done);
  nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
  solverTlNodeCount = 0;
  
  if (!done.exchange(true)) {
    std::lock_guard<std::mutex> lock(result_mutex);
    final_result = r;
  }

  fut.wait();
  final_result.nodes = getNodeCount();
  // If stopSearch was set externally (stop() or timeout), flag the result as aborted.
  final_result.aborted = isAborted();

  return final_result;
}

template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
std::vector<int> SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, SlotType>::analyze(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak, int threads, const OpeningBookBase<WIDTH, HEIGHT>* book, double timeout_ms) {
#ifndef USE_PTHREADS
  threads = 1;
#endif
  if (isSearching.exchange(true, std::memory_order_acquire)) {
    throw std::runtime_error("Solver is busy: concurrent execution on the same instance is strictly prohibited.");
  }
  struct LockGuard {
    std::atomic<bool>& flag;
    ~LockGuard() { flag.store(false, std::memory_order_release); }
  } guard{isSearching};

  // Reset all abort state, then configure timeout if requested
  stopSearch.store(false, std::memory_order_relaxed);
  if (timeout_ms > 0) {
    auto now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count();
    endTime.store(now + timeout_ms, std::memory_order_relaxed);
  } else {
    endTime.store(0.0, std::memory_order_relaxed);
  }

  (void)threads;
  std::vector<int> scores(P.width(), -1000);

#ifdef USE_PTHREADS
  // Track which columns are still being solved (for straggler acceleration)
  auto col_done = std::make_unique<std::atomic<bool>[]>(P.width());
  auto col_abort = std::make_unique<std::atomic<bool>[]>(P.width());
  std::vector<GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>> col_positions(P.width(), GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>(P.width(), P.height()));
  std::vector<bool> col_valid(P.width());

  for (int c = 0; c < P.width(); c++) {
    col_abort[c].store(false, std::memory_order_relaxed);
    if (P.canPlay(c)) {
      if (P.isWinningMove(c)) {
        scores[c] = ((P.width() * P.height()) + 1 - P.nbMoves()) / 2;
        col_done[c].store(true, std::memory_order_relaxed);
        col_valid[c] = false;
      } else {
        GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> P2(P);
        P2.playCol(c);
        col_positions[c] = P2;
        col_valid[c] = true;
        col_done[c].store(false, std::memory_order_relaxed); // default: false (in-progress) for valid playable columns
      }
    } else {
      col_done[c].store(true, std::memory_order_relaxed); // default: true for invalid/completed
      col_valid[c] = false;
    }
  }

  std::atomic<int> next_col{0};

  auto worker = [&]() {
    // Phase 1: Root-split — grab columns and solve them
    while (true) {
      int i = next_col.fetch_add(1);
      if (i >= P.width()) break;
      int col = this->COLUMN_ORDER[i];
      solverTlNodeCount = 0;

      if (col_valid[col]) {
        ::GameSolver::Connect4::SolverResult result;
        const OpeningBookBase<WIDTH, HEIGHT>* active_book = book ? book : this->book;
        if (active_book) result = solve_single<true>(col_positions[col], weak, active_book, active_book->getDepth(), &col_abort[col]);
        else result = solve_single<false>(col_positions[col], weak, nullptr, 0, &col_abort[col]);
        scores[col] = -result.score;

        col_done[col].store(true, std::memory_order_release);   // mark as complete
        col_abort[col].store(true, std::memory_order_release);  // abort any helpers
      }
      nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
      solverTlNodeCount = 0;
    }

    // Phase 2: Straggler assist — help the slowest still-running column
    // Keep looping as long as there are unfinished columns
    while (true) {
      // Find a column that's still running
      int straggler_col = -1;
      for (int c = 0; c < P.width(); c++) {
        if (!col_done[c].load(std::memory_order_acquire) && col_valid[c]) {
          straggler_col = c;
          break;
        }
      }
      if (straggler_col < 0) break; // all done

      // Launch Lazy SMP helper on straggler's position
      // Use perturbed history for search diversity
      std::vector<int32_t> local_history(P.width() * (P.height() + 1));
      // Use thread id hash for diversity
      auto tid = std::hash<std::thread::id>{}(std::this_thread::get_id());
      for (int j = 0; j < P.width() * (P.height() + 1); j++) {
        local_history[j] = this->TROMP_WEIGHTS[j];
        local_history[j] += ((int)(tid >> 4) * 7 + j * 3) % 5;
      }

      solverTlNodeCount = 0;
      // Search the straggler's position — shares TT with the primary solver
      // col_abort[straggler_col] will be set when the primary finishes
      if (book) solve_single<true>(col_positions[straggler_col], weak, book, book->getDepth(), &col_abort[straggler_col], local_history.data());
      else solve_single<false>(col_positions[straggler_col], weak, book, 0, &col_abort[straggler_col], local_history.data());
      nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
      solverTlNodeCount = 0;
      // After abort, loop back to find another straggler (or exit if all done)
    }
  };

  unsigned int num_threads = std::min((unsigned int)P.width(), (unsigned int)threads);
  if (num_threads <= 1) {
    worker();
  } else {
    pool->ensureCapacity(num_threads - 1);
    std::atomic<int> remaining(num_threads - 1);
    std::promise<void> prom;
    auto fut = prom.get_future();
    
    for (unsigned int i = 0; i < num_threads - 1; i++) {
        pool->enqueue([&]() {
            worker();
            if (remaining.fetch_sub(1) == 1) {
                prom.set_value();
            }
        });
    }
    worker();
    
    fut.wait();
  }
#else
  for (int i = 0; i < P.width(); i++) {
    int col = this->COLUMN_ORDER[i];
    if (P.canPlay(col)) {
      if(P.isWinningMove(col)) scores[col] = ((P.width() * P.height()) + 1 - P.nbMoves()) / 2;
      else {
        GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> P2(P);
        P2.playCol(col);
        if (book) scores[col] = -solve_single<true>(P2, weak, book, book->getDepth()).score;
        else scores[col] = -solve_single<false>(P2, weak, book, 0).score;
      }
    }
  }
  nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
  solverTlNodeCount = 0;
#endif

  return scores;
}

template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
class TypedCache : public ::GameSolver::Connect4::Cache {
 public:
  static constexpr int VALUE_BITS = WIDTH == -1 ? 8 : getRequiredValueBits<WIDTH, HEIGHT, ALIGN, WRAP>();
  static constexpr int MOVE_BITS = WIDTH == -1 ? 4 : (WIDTH >= 16 ? 5 : (WIDTH >= 8 ? 4 : 3));
  std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS, 7, 0, MOVE_BITS, typename GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::position_t>> transTable;

  TypedCache(size_t table_bytes) {
      auto* t = new (std::nothrow) TranspositionTable<SlotType, uint8_t, VALUE_BITS, 7, 0, MOVE_BITS, typename GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::position_t>(table_bytes);
      if (t && t->isValid()) {
          transTable.reset(t);
      } else {
          delete t;
          return;
      }

      // Calculate CRT safety
      int shift_amount = VALUE_BITS + 7 + MOVE_BITS; // ValueBits + WorkBits + MoveBits
      int available_bits = sizeof(SlotType) * 8 - shift_amount;
      int board_bits = WIDTH * (HEIGHT + 1);

      if (board_bits > available_bits) {
          int index_bits = board_bits - available_bits;
          if (index_bits < 64) {
              uint64_t required_buckets = 1ULL << index_bits;
              if (transTable->getSize() / 2 < required_buckets) {
                  throw std::runtime_error("TranspositionTable allocated memory is mathematically too small to guarantee collision-free CRT for this board size.");
              }
          }
      }
    }

  bool isValid() const {
    return transTable != nullptr;
  }

  void reset() override {
    transTable->reset();
  }

  int getSlotWidth() const override {
    return sizeof(SlotType) * 8;
  }
};

template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP>
std::unique_ptr<::GameSolver::Connect4::Cache> Solver<WIDTH, HEIGHT, ALIGN, WRAP>::createCache(size_t table_bytes, int w, int h) {
  if (std::getenv("FORCE_128_BIT")) {
      auto* c = new (std::nothrow) TypedCache<WIDTH, HEIGHT, ALIGN, WRAP, WASM_U128_T>(table_bytes);
      if (c && c->isValid()) return std::unique_ptr<::GameSolver::Connect4::Cache>(c);
      delete c;
      return nullptr;
  }

  constexpr int VALUE_BITS = getRequiredValueBits<WIDTH, HEIGHT, ALIGN, WRAP>();
  constexpr int shift_amount = VALUE_BITS + 7 + 4;
  constexpr int available_bits_64 = 64 - shift_amount;
  constexpr int board_bits = WIDTH * (HEIGHT + 1);

  if constexpr (board_bits > available_bits_64) {
      constexpr int index_bits_64 = board_bits - available_bits_64;
      if constexpr (index_bits_64 < 64) {
          uint64_t required_buckets_64 = 1ULL << index_bits_64;
          size_t bucket_size = 16; // 128 bits per bucket

          if (required_buckets_64 > table_bytes / bucket_size) {
              // Upgrade to 128-bit slot since memory is too small for 64-bit CRT
              auto* c = new (std::nothrow) TypedCache<WIDTH, HEIGHT, ALIGN, WRAP, WASM_U128_T>(table_bytes);
              if (c && c->isValid()) return std::unique_ptr<::GameSolver::Connect4::Cache>(c);
              delete c;
              return nullptr;
          }
      } else {
          // If 64-bit slot mathematically requires > 2^64 buckets, it's impossible. Must use 128-bit.
          auto* c = new (std::nothrow) TypedCache<WIDTH, HEIGHT, ALIGN, WRAP, WASM_U128_T>(table_bytes);
          if (c && c->isValid()) return std::unique_ptr<::GameSolver::Connect4::Cache>(c);
          delete c;
          return nullptr;
      }
  }

  auto* c = new (std::nothrow) TypedCache<WIDTH, HEIGHT, ALIGN, WRAP, uint64_t>(table_bytes);
  if (c && c->isValid()) return std::unique_ptr<::GameSolver::Connect4::Cache>(c);
  delete c;
  return nullptr;
}

template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP>
std::unique_ptr<Solver<WIDTH, HEIGHT, ALIGN, WRAP>> Solver<WIDTH, HEIGHT, ALIGN, WRAP>::createWithCache(::GameSolver::Connect4::Cache* cache, int w, int h) {
  if (auto c64 = dynamic_cast<TypedCache<WIDTH, HEIGHT, ALIGN, WRAP, uint64_t>*>(cache)) {
    auto* s = new (std::nothrow) SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, uint64_t>(c64->transTable, w, h);
    if (!s) return nullptr;
    return std::unique_ptr<Solver<WIDTH, HEIGHT, ALIGN, WRAP>>(s);
  } else if (auto c128 = dynamic_cast<TypedCache<WIDTH, HEIGHT, ALIGN, WRAP, WASM_U128_T>*>(cache)) {
    auto* s = new (std::nothrow) SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, WASM_U128_T>(c128->transTable, w, h);
    if (!s) return nullptr;
    return std::unique_ptr<Solver<WIDTH, HEIGHT, ALIGN, WRAP>>(s);
  } else {
    return nullptr;
  }
}

template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP>
std::unique_ptr<Solver<WIDTH, HEIGHT, ALIGN, WRAP>> Solver<WIDTH, HEIGHT, ALIGN, WRAP>::create(size_t table_bytes) {
  auto cache = createCache(table_bytes, WIDTH, HEIGHT);
  return createWithCache(cache.get());
}

} // namespace Connect4
} // namespace GameSolver
