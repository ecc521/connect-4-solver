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
template <int WIDTH, int HEIGHT, typename SlotType>
template <bool HasBook>
int SolverImpl<WIDTH, HEIGHT, SlotType>::negamax(const GenericPosition<WIDTH, HEIGHT> &P, int alpha, int beta, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag, int32_t* thread_history) {
  if (shouldAbort(abort_flag)) [[unlikely]] return 0;

  assert(alpha < beta);
  assert(!P.canWinNext());

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

  typename GenericPosition<WIDTH, HEIGHT>::position_t possible = P.possibleNonLosingMoves();
  if(possible == 0)     // if no possible non losing move, opponent wins next move
    return -(WIDTH * HEIGHT - P.nbMoves()) / 2;

  if(P.nbMoves() >= WIDTH * HEIGHT - 2) [[unlikely]] // check for draw game
    return 0;

  if ((possible & (possible - 1)) == 0) {
    GenericPosition<WIDTH, HEIGHT> P2(P);
    P2.play(possible);
    if (solverTlNodeCount > 0) {
      solverTlNodeCount--;
    } else {
      nodeCount.fetch_sub(1, std::memory_order_relaxed);
    }
    return -negamax<HasBook>(P2, -beta, -alpha, book, book_depth, abort_flag, thread_history);
  }

  int min = -(WIDTH * HEIGHT - 2 - P.nbMoves()) / 2;	// lower bound of score as opponent cannot win next move
  if(alpha < min) {
    alpha = min;                     // there is no need to keep alpha below our max possible score.
    if(alpha >= beta) return alpha;  // prune the exploration if the [alpha;beta] window is empty.
  }

  int max = (WIDTH * HEIGHT - 1 - P.nbMoves()) / 2;	// upper bound of score as current player cannot win next move
  if(beta > max) {
    beta = max;                     // there is no need to keep beta above our max possible score.
    if(alpha >= beta) return beta;  // prune the exploration if the [alpha;beta] window is empty.
  }

  if constexpr (HEIGHT % 2 == 0) {
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
  typename GenericPosition<WIDTH, HEIGHT>::position_t key;
  if (WIDTH * HEIGHT - P.nbMoves() <= TT_PROBE_DEPTH) {
    key = P.key();
  } else {
    key = P.symmetric_key(is_reverse);
  }
  uint8_t table_move = WIDTH;

  if(auto packed = transTable->getPacked(key); packed.value) {
    uint8_t val = packed.value;
    table_move = packed.best_move;
    if (table_move < WIDTH && is_reverse) table_move = WIDTH - 1 - table_move;

    if(val > GenericPosition<WIDTH, HEIGHT>::MAX_SCORE - GenericPosition<WIDTH, HEIGHT>::MIN_SCORE + 1) { // we have an lower bound
      min = val + 2 * GenericPosition<WIDTH, HEIGHT>::MIN_SCORE - GenericPosition<WIDTH, HEIGHT>::MAX_SCORE - 2;
      alpha = std::max(alpha, min);
      if(alpha >= beta) return alpha;
    } else { // we have an upper bound
      max = val + GenericPosition<WIDTH, HEIGHT>::MIN_SCORE - 1;
      beta = std::min(beta, max);
      if(alpha >= beta) return beta;
    }
  }

  // 1-ply TT lookahead (Child Probing) to prune early before deep searches
  if (P.nbMoves() < (WIDTH * HEIGHT) - TT_PROBE_DEPTH) {
    for (int i = 0; i < WIDTH; i++) {
      int col = GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i];
      if (typename GenericPosition<WIDTH, HEIGHT>::position_t move = possible & GenericPosition<WIDTH, HEIGHT>::column_mask(col)) {
        GenericPosition<WIDTH, HEIGHT> child(P);
        child.play(move);
        typename GenericPosition<WIDTH, HEIGHT>::position_t child_key;
        if (WIDTH * HEIGHT - child.nbMoves() <= TT_PROBE_DEPTH) {
          child_key = child.key();
        } else {
          child_key = child.symmetric_key();
        }
        if (auto child_packed = transTable->getPacked(child_key); child_packed.value) {
          uint8_t child_val = child_packed.value;
          if (child_val <= GenericPosition<WIDTH, HEIGHT>::MAX_SCORE - GenericPosition<WIDTH, HEIGHT>::MIN_SCORE + 1) {
            // child upper bound means child_score <= child_max
            // so our_score >= -child_max. This is a lower bound for us!
            int child_max = child_val + GenericPosition<WIDTH, HEIGHT>::MIN_SCORE - 1;
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
      if(int val = book->get(P)) return val + GenericPosition<WIDTH, HEIGHT>::MIN_SCORE - 1; // look for solutions stored in opening book
    }
  }

  GenericMoveSorter<WIDTH, HEIGHT> moves;

  for(int i = WIDTH; i--;) {
    if(typename GenericPosition<WIDTH, HEIGHT>::position_t move = possible & GenericPosition<WIDTH, HEIGHT>::column_mask(GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i])) {
      int score = P.moveScore(move) * 1000000;
      if (GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i] == table_move) {
        score += 100000000; // Heavily prioritize table move
      }
      // Use thread-local history for move ordering if provided
      if (thread_history) {
        int col = GenericPosition<WIDTH, HEIGHT>::ctz_impl(move) / (HEIGHT + 1);
        score += thread_history[col * (HEIGHT + 1)] * 100;
      }
      moves.add(move, score);
      
      GenericPosition<WIDTH, HEIGHT> child(P);
      child.play(move);
      typename GenericPosition<WIDTH, HEIGHT>::position_t child_key;
      if (WIDTH * HEIGHT - child.nbMoves() <= TT_PROBE_DEPTH) {
        child_key = child.key();
      } else {
        child_key = child.symmetric_key();
      }
      transTable->prefetch(child_key);
    }
  }

#if BOARD_WIDTH_MACRO >= 8
#endif

  int best_score = -GenericPosition<WIDTH, HEIGHT>::MAX_SCORE;
  uint8_t best_move = WIDTH;

  while(typename GenericPosition<WIDTH, HEIGHT>::position_t next = moves.getNext()) {
    GenericPosition<WIDTH, HEIGHT> P2(P);
    P2.play(next);
    int score = -negamax<HasBook>(P2, -beta, -alpha, book, book_depth, abort_flag, thread_history);

    if (shouldAbort(abort_flag)) return 0;

    if(score > best_score) {
      best_score = score;
      best_move = GenericPosition<WIDTH, HEIGHT>::ctz_impl(next) / (HEIGHT + 1);
    }

    if(best_score >= beta) {
      uint8_t stored_move = best_move;
      if (stored_move < WIDTH && is_reverse) stored_move = WIDTH - 1 - stored_move;
      transTable->put(key, best_score + GenericPosition<WIDTH, HEIGHT>::MAX_SCORE - 2 * GenericPosition<WIDTH, HEIGHT>::MIN_SCORE + 2, WIDTH * HEIGHT - P.nbMoves(), stored_move);
      return best_score;
    }
    alpha = std::max(alpha, best_score);
  }

  uint8_t work = WIDTH * HEIGHT - P.nbMoves();
  uint8_t stored_move = best_move;
  if (stored_move < WIDTH && is_reverse) stored_move = WIDTH - 1 - stored_move;
  transTable->put(key, best_score - GenericPosition<WIDTH, HEIGHT>::MIN_SCORE + 1, work, stored_move);
  return best_score;
}

/**
 * Serial solve implementation. Can be called with an abort_flag for Lazy SMP
 * and an optional private history table for search diversity.
 */
template <int WIDTH, int HEIGHT, typename SlotType>
template <bool HasBook>
::GameSolver::Connect4::SolverResult SolverImpl<WIDTH, HEIGHT, SlotType>::solve_single(const GenericPosition<WIDTH, HEIGHT> &P, bool weak, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag, int32_t* thread_history) {
  if(P.canWinNext()) {
    int score = (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2;
    for (int i = 0; i < WIDTH; i++) {
        if (P.canPlay(i) && P.isWinningMove(i)) return {score, i, (int)P.nbMoves(), getNodeCount()};
    }
    return {score, -1, (int)P.nbMoves(), getNodeCount()};
  }

  if constexpr (HasBook) {
    if (P.nbMoves() <= book_depth) {
      if(int val = book->get(P))      return {val + GenericPosition<WIDTH, HEIGHT>::MIN_SCORE - 1, -1, (int)P.nbMoves(), getNodeCount()};
    }
  }

  int min = -(WIDTH * HEIGHT - P.nbMoves()) / 2;
  int max = (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2;
  int score = 0;
  if (weak) {
    min = -1;
    max = 1;
    while(min < max) {
      if (shouldAbort(abort_flag)) { score = min; break; }
      int med = min + (max - min) / 2;
      if(med <= 0 && min / 2 < med) med = min / 2;
      else if(med >= 0 && max / 2 > med) med = max / 2;
      int r = negamax<HasBook>(P, med, med + 1, book, book_depth, abort_flag, thread_history);
      if (shouldAbort(abort_flag)) { score = min; break; }
      if(r <= med) max = r;
      else min = r;
    }
    score = min;
  } else {
    int r = negamax<HasBook>(P, -1, 0, book, book_depth, abort_flag, thread_history);
    if (shouldAbort(abort_flag)) goto flush;
    if (r <= -1) {
      max = -1;
      for (int i = -2; i >= min; i--) {
        if (shouldAbort(abort_flag)) { score = max; goto flush; }
        if (negamax<HasBook>(P, i, i + 1, book, book_depth, abort_flag, thread_history) > i) {
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
          if (negamax<HasBook>(P, i, i + 1, book, book_depth, abort_flag, thread_history) <= i) {
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
      for (int i = 0; i < WIDTH; i++) {
          int col = GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i];
          if (P.canPlay(col)) {
              GenericPosition<WIDTH, HEIGHT> P2(P);
              P2.playCol(col);
              if (int val = book->get(P2)) {
                  int child_score = val + GenericPosition<WIDTH, HEIGHT>::MIN_SCORE - 1;
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
    for (int i = 0; i < WIDTH; i++) {
        int col = GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i];
        if (P.canPlay(col)) {
            GenericPosition<WIDTH, HEIGHT> P2(P);
            P2.playCol(col);
            if (negamax<HasBook>(P2, -score, -score + 1, book, book_depth) == -score) {
                bestMove = col;
                break;
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
template <int WIDTH, int HEIGHT, typename SlotType>
::GameSolver::Connect4::SolverResult SolverImpl<WIDTH, HEIGHT, SlotType>::solve(const GenericPosition<WIDTH, HEIGHT> &P, bool weak, int threads, const OpeningBookBase<WIDTH, HEIGHT>* book, double timeout_ms) {
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

  if (threads <= 1) {
    if (book) return solve_single<true>(P, weak, book, book->getDepth());
    else return solve_single<false>(P, weak, book, 0);
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
      int32_t local_history[WIDTH * (HEIGHT + 1)];
      for (int i = 0; i < WIDTH * (HEIGHT + 1); i++) {
        local_history[i] = GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS[i];
        // Add small per-thread perturbation to create move ordering diversity
        local_history[i] += (t * 7 + i * 3) % 5;
      }
      
      solverTlNodeCount = 0;
      ::GameSolver::Connect4::SolverResult r;
      if (book) r = solve_single<true>(P, weak, book, book->getDepth(), &done, local_history);
      else r = solve_single<false>(P, weak, book, 0, &done, local_history);
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
  if (book) r = solve_single<true>(P, weak, book, book->getDepth(), &done);
  else r = solve_single<false>(P, weak, book, 0, &done);
  nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
  solverTlNodeCount = 0;
  
  if (!done.exchange(true)) {
    std::lock_guard<std::mutex> lock(result_mutex);
    final_result = r;
  }

  fut.wait();
  final_result.nodes = getNodeCount();
  // If stopSearch was set externally (stop() or timeout), flag the result as aborted.
  // Don't flag as aborted when it was set by normal Lazy SMP completion (done flag).
  final_result.aborted = isAborted() && !done.load(std::memory_order_relaxed);
  return final_result;
}

template <int WIDTH, int HEIGHT, typename SlotType>
std::vector<int> SolverImpl<WIDTH, HEIGHT, SlotType>::analyze(const GenericPosition<WIDTH, HEIGHT> &P, bool weak, int threads, const OpeningBookBase<WIDTH, HEIGHT>* book, double timeout_ms) {
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
  std::vector<int> scores(WIDTH, -1000);

#ifdef USE_PTHREADS
  // Track which columns are still being solved (for straggler acceleration)
  std::atomic<bool> col_done[WIDTH];
  // Abort flags for each column's solve — helpers can contribute via Lazy SMP
  std::atomic<bool> col_abort[WIDTH];
  // Store each column's child position for helpers to search
  GenericPosition<WIDTH, HEIGHT> col_positions[WIDTH];
  bool col_valid[WIDTH];

  for (int c = 0; c < WIDTH; c++) {
    col_abort[c].store(false, std::memory_order_relaxed);
    if (P.canPlay(c)) {
      if (P.isWinningMove(c)) {
        scores[c] = (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2;
        col_done[c].store(true, std::memory_order_relaxed);
        col_valid[c] = false;
      } else {
        GenericPosition<WIDTH, HEIGHT> P2(P);
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
      if (i >= WIDTH) break;
      int col = GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i];
      solverTlNodeCount = 0;

      if (col_valid[col]) {
        ::GameSolver::Connect4::SolverResult result;
        if (book) result = solve_single<true>(col_positions[col], weak, book, book->getDepth(), &col_abort[col]);
        else result = solve_single<false>(col_positions[col], weak, book, 0, &col_abort[col]);
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
      for (int c = 0; c < WIDTH; c++) {
        if (!col_done[c].load(std::memory_order_acquire) && col_valid[c]) {
          straggler_col = c;
          break;
        }
      }
      if (straggler_col < 0) break; // all done

      // Launch Lazy SMP helper on straggler's position
      // Use perturbed history for search diversity
      int32_t local_history[WIDTH * (HEIGHT + 1)];
      // Use thread id hash for diversity
      auto tid = std::hash<std::thread::id>{}(std::this_thread::get_id());
      for (int j = 0; j < WIDTH * (HEIGHT + 1); j++) {
        local_history[j] = GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS[j];
        local_history[j] += ((int)(tid >> 4) * 7 + j * 3) % 5;
      }

      solverTlNodeCount = 0;
      // Search the straggler's position — shares TT with the primary solver
      // col_abort[straggler_col] will be set when the primary finishes
      if (book) solve_single<true>(col_positions[straggler_col], weak, book, book->getDepth(), &col_abort[straggler_col], local_history);
      else solve_single<false>(col_positions[straggler_col], weak, book, 0, &col_abort[straggler_col], local_history);
      nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
      solverTlNodeCount = 0;
      // After abort, loop back to find another straggler (or exit if all done)
    }
  };

  unsigned int num_threads = std::min((unsigned int)WIDTH, (unsigned int)threads);
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
  for (int i = 0; i < WIDTH; i++) {
    int col = GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i];
    if (P.canPlay(col)) {
      if(P.isWinningMove(col)) scores[col] = (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2;
      else {
        GenericPosition<WIDTH, HEIGHT> P2(P);
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

template <int WIDTH, int HEIGHT, typename SlotType>
class TypedCache : public ::GameSolver::Connect4::Cache {
 public:
  static constexpr int VALUE_BITS = getRequiredValueBits<WIDTH, HEIGHT>();
  static constexpr int MOVE_BITS = WIDTH >= 16 ? 5 : (WIDTH >= 8 ? 4 : 3);
  std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS, 7, 0, MOVE_BITS, typename GenericPosition<WIDTH, HEIGHT>::position_t>> transTable;

  TypedCache(size_t table_bytes)
    : transTable(std::make_shared<TranspositionTable<SlotType, uint8_t, VALUE_BITS, 7, 0, MOVE_BITS, typename GenericPosition<WIDTH, HEIGHT>::position_t>>(table_bytes)) {

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

  void reset() override {
    transTable->reset();
  }

  int getSlotWidth() const override {
    return sizeof(SlotType) * 8;
  }
};

template <int WIDTH, int HEIGHT>
std::unique_ptr<::GameSolver::Connect4::Cache> Solver<WIDTH, HEIGHT>::createCache(size_t table_bytes) {
  if (std::getenv("FORCE_128_BIT")) {
      return std::make_unique<TypedCache<WIDTH, HEIGHT, WASM_U128_T>>(table_bytes);
  }

  constexpr int VALUE_BITS = getRequiredValueBits<WIDTH, HEIGHT>();
  constexpr int shift_amount = VALUE_BITS + 7 + 4;
  constexpr int available_bits_64 = 64 - shift_amount;
  constexpr int board_bits = WIDTH * (HEIGHT + 1);

  if constexpr (board_bits > available_bits_64) {
      constexpr int index_bits_64 = board_bits - available_bits_64;
      if constexpr (index_bits_64 < 64) {
          uint64_t required_buckets_64 = 1ULL << index_bits_64;
          // Calculate approx required bytes (16 bytes per bucket + overhead)
          size_t bucket_size = 16;
          size_t required_bytes_64 = required_buckets_64 * bucket_size;

          if (table_bytes < required_bytes_64) {
              // Upgrade to 128-bit slot since memory is too small for 64-bit CRT
              return std::make_unique<TypedCache<WIDTH, HEIGHT, WASM_U128_T>>(table_bytes);
          }
      } else {
          // If 64-bit slot mathematically requires > 2^64 buckets, it's impossible. Must use 128-bit.
          return std::make_unique<TypedCache<WIDTH, HEIGHT, WASM_U128_T>>(table_bytes);
      }
  }

  return std::make_unique<TypedCache<WIDTH, HEIGHT, uint64_t>>(table_bytes);
}

template <int WIDTH, int HEIGHT>
std::unique_ptr<Solver<WIDTH, HEIGHT>> Solver<WIDTH, HEIGHT>::createWithCache(::GameSolver::Connect4::Cache* cache) {
  if (auto c64 = dynamic_cast<TypedCache<WIDTH, HEIGHT, uint64_t>*>(cache)) {
    return std::make_unique<SolverImpl<WIDTH, HEIGHT, uint64_t>>(c64->transTable);
  } else if (auto c128 = dynamic_cast<TypedCache<WIDTH, HEIGHT, WASM_U128_T>*>(cache)) {
    return std::make_unique<SolverImpl<WIDTH, HEIGHT, WASM_U128_T>>(c128->transTable);
  } else {
    throw std::invalid_argument("Unsupported cache type");
  }
}

template <int WIDTH, int HEIGHT>
std::unique_ptr<Solver<WIDTH, HEIGHT>> Solver<WIDTH, HEIGHT>::create(size_t table_bytes) {
  auto cache = createCache(table_bytes);
  return createWithCache(cache.get());
}

} // namespace Connect4
} // namespace GameSolver
