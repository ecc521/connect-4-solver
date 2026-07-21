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

// Move ordering: 1 = filter threats sitting directly above an opponent threat
// out of the ordering score (c4's find_useful_threats). Measured -7..-12%
// wall across 7x6/7x7/8x8 corpora and -8% on 7x6 root exact. [DEFAULT]
#ifndef MOVE_ORDER_USEFUL_THREATS
#define MOVE_ORDER_USEFUL_THREATS 1
#endif

// TT replacement priority: 1 = work field stores log2 of the subtree's own
// searched node count (c4-style cost-to-recompute priority; protects expensive
// entries against eviction, which matters most under multi-threaded sharing);
// 0 = legacy remaining-cell-count (depth proxy: all entries at equal height
// have equal priority, so racing threads churn each other's deep results).
#ifndef TT_WORK_SUBTREE_LOG2
#define TT_WORK_SUBTREE_LOG2 1
#endif


namespace {
  thread_local uint32_t solverTlNodeCount = 0;
  // Monotone per-thread call counter (never flushed/reset mid-search) used to
  // measure per-subtree search cost for TT replacement priority.
  thread_local uint64_t solverTlNodeEpoch = 0;

#if TT_WORK_SUBTREE_LOG2
  // log2-bucketed subtree cost, saturated to the TT's work-field range.
  template <unsigned WorkBits>
  inline uint8_t tt_work_from_nodes_impl(uint64_t nodes) {
    constexpr unsigned cap = (WorkBits >= 8 ? 255u : (1u << WorkBits) - 1u);
    unsigned w = (unsigned)(64 - __builtin_clzll(nodes | 1));  // bit_width, >=1
    return (uint8_t)(w < cap ? w : cap);
  }
#endif

  // One unit of race-worker move-ordering jitter, in move-score units
  // (1000000 == one threat unit; c4 uses 0.3 of their unit, but our coarser
  // score scale measures best at a full unit). Thread-local so racers can be
  // configured per run; the unjittered worker never reads it.
  thread_local int solverTlJitterStep = 1000000;

  // Cheap per-thread RNG for move-ordering jitter (xorshift64*), seeded per
  // thread. Only consulted when score_jitter > 0, i.e. jittered race workers.
  thread_local uint64_t solverTlRngState = 0;
  inline uint32_t solverTlRand() {
    uint64_t x = solverTlRngState;
    if (x == 0) x = 0x9e3779b97f4a7c15ULL ^ (uint64_t)std::hash<std::thread::id>{}(std::this_thread::get_id());
    x ^= x << 13; x ^= x >> 7; x ^= x << 17;
    solverTlRngState = x;
    return (uint32_t)((x * 0x2545F4914F6CDD1DULL) >> 32);
  }

  // Per-worker jitter schedule, one decimal digit of amplitude per ply from
  // the probe root (consumed via `1 + jitter % 10` at each node, then /10 for
  // the children). Same construction c4 uses for its null-window searches:
  // distinct workers get distinct 5-digit schedules; worker 0 gets zero.
  inline int jitterScheduleForWorker(int i) {
    return (i % 4) * 10000 + (i % 5) * 1000 + (i % 6) * 100 + (i % 7) * 10 + (i % 8);
  }

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
int SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, SlotType>::negamax(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, int alpha, int beta, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag, int32_t* thread_history, int score_jitter) {
  if (shouldAbort(abort_flag)) [[unlikely]] return 0;

  assert(alpha < beta);
  if (P.canWinNext()) [[unlikely]] {
    return ((P.width() * P.height()) + 1 - P.nbMoves()) / 2;
  }

  ++solverTlNodeEpoch;
  if (solverTlNodeCount >= 16384) [[unlikely]] {
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
    return -negamax<HasBook, W_CONST, H_CONST>(P2, -beta, -alpha, book, book_depth, abort_flag, thread_history, score_jitter);
  }

  // Count interior nodes only (nodes that enumerate children) — c4's
  // convention, so node counts are directly comparable. Early returns above
  // (mates, losses, draws, forced-move hops) are not counted. Thread-local;
  // a global fetch_add here is a true-sharing hotspot at high thread counts.
  ++solverTlNodeCount;

#if TT_WORK_SUBTREE_LOG2
  const uint64_t subtree_epoch0 = solverTlNodeEpoch;
#endif

  const int w_val = W_CONST != -1 ? W_CONST : P.width();
  const int h_val = H_CONST != -1 ? H_CONST : P.height();

  int min = -((w_val * h_val) - 2 - P.nbMoves()) / 2;	// lower bound of score as opponent cannot win next move
  int alpha_proven = min;
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

    if(val > P.max_score() - P.min_score() + 1) { // we have an lower bound
      // Only lower-bound entries carry a meaningful best move (the cutoff
      // move); a fail-low node's stored move is noise for ordering.
      table_move = packed.best_move;
      if (table_move < w_val && is_reverse) table_move = w_val - 1 - table_move;
      min = val + 2 * P.min_score() - P.max_score() - 2;
      alpha = std::max(alpha, min);
      alpha_proven = std::max(alpha_proven, min);
      if(alpha >= beta) return alpha;
    } else { // we have an upper bound
      max = val + P.min_score() - 1;
      beta = std::min(beta, max);
      if(alpha >= beta) return beta;
    }
  }

  // Single child enumeration: construct each child and compute its TT key
  // exactly once. The key is reused by the TT lookahead probe here and by the
  // prefetch in the move-scoring loop below (it used to be computed twice).
  std::array<pos_t, 16> child_moves;
  std::array<pos_t, 16> child_keys;
  std::array<uint8_t, 16> child_cols;
  int num_children = 0;
  // Fail-soft upper bound contributed by children pruned via TT lower bounds
  // (a child with score >= L caps our gain from it at -L; if -L <= alpha the
  // child cannot improve anything and need not be searched at all).
  int pruned_children_ub = -P.max_score();
  {
    const bool do_child_probe = P.nbMoves() < ((w_val * h_val)) - TT_PROBE_DEPTH;
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
        if (do_child_probe) {
          if (auto child_packed = transTable->getPacked(child_key); child_packed.value) {
            uint8_t child_val = child_packed.value;
            if (child_val <= P.max_score() - P.min_score() + 1) {
              // child upper bound means child_score <= child_max
              // so our_score >= -child_max. This is a lower bound for us!
              int child_max = child_val + P.min_score() - 1;
              int our_min = -child_max;
              alpha = std::max(alpha, our_min);
              alpha_proven = std::max(alpha_proven, our_min);
              if (alpha >= beta) return alpha;
            } else {
              // child lower bound: our gain from this child is <= -child_lb.
              // If that can't beat alpha, skip searching the child entirely.
              int child_lb = child_val + 2 * P.min_score() - P.max_score() - 2;
              int our_ub_via_child = -child_lb;
              if (our_ub_via_child <= alpha) {
                pruned_children_ub = std::max(pruned_children_ub, our_ub_via_child);
                continue;
              }
            }
          }
        }
#ifndef DISABLE_CHILD_EVENS
        // Child evens-strategy probe (c4-style eager static resolution): an
        // upper bound on the child (opponent to move) is a lower bound for us.
        if (h_val % 2 == 0 && child.nbMoves() % 2 == 0) {
          int evens_c = child.computeEvensStrategy();
          assert(evens_c <= 0 || evens_c == 1000);  // bound, draw, or no info
          if (evens_c <= 0) {
            int our_min = -evens_c;
            alpha = std::max(alpha, our_min);
            alpha_proven = std::max(alpha_proven, our_min);
            if (alpha >= beta) return alpha;
          }
        }
#endif
        assert(num_children < (int)child_moves.size());
        child_moves[num_children] = move;
        child_keys[num_children] = child_key;
        child_cols[num_children] = (uint8_t)col;
        num_children++;
      }
    }
  }

  if constexpr (HasBook) {
    if (P.nbMoves() <= book_depth) {
      if (auto lu = book->query(P); lu.found()) {
        if (lu.lower == lu.upper) return lu.lower + P.min_score() - 1;
        int lo = lu.lower + P.min_score() - 1;
        int hi = lu.upper + P.min_score() - 1;
        if (lo >= beta)  return lo;
        if (hi <= alpha) return hi;
        alpha = std::max(alpha, lo);
        alpha_proven = std::max(alpha_proven, lo);
        beta  = std::min(beta,  hi);
        // bounds didn't close the window — fall through with tightened alpha/beta
      }
    }
  }

    GenericMoveSorter<W_CONST, H_CONST, ALIGN, WRAP> moves(w_val);

#if MOVE_ORDER_USEFUL_THREATS
    // c4's useful-threats filter: a threat directly above an opponent threat
    // can never be cashed (the opponent wins first on the cell below), so it
    // shouldn't count toward move ordering. One sweep, shared by all children.
    const pos_t node_opp_threats = static_cast<pos_t>(P.opponent_winning_position());
#endif

    for(int j = num_children; j--;) {
      const int col = child_cols[j];
      const pos_t move = child_moves[j];

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

        // Static win-in-3 resolution (c4-style): after `move`, every reply the
        // opponent has either loses immediately or leaves us a playable win.
        // Then this node's value is exactly `max` (win on our next move), and
        // since beta <= max always holds here, this is an immediate cutoff —
        // found during move scoring, before recursing into anything.
#ifndef DISABLE_STATIC_WIN3
        {
          // NOTE: must use the child's FULL playable set here, not the
          // parent's `possible` (which excludes parent-losing cells that the
          // opponent is nevertheless free to play).
          const pos_t child_all_possible =
              ((static_cast<pos_t>(P.getMask()) | move) + static_cast<pos_t>(P.get_bottom_mask()))
              & static_cast<pos_t>(P.get_board_mask());
          const pos_t our_wins_now = all_threats & child_all_possible;
          const pos_t opp_non_losing = child_all_possible & ~(all_threats >> 1);
          const bool opp_forced_loss =
              opp_non_losing == 0 ||
              (our_wins_now && ((our_wins_now & (our_wins_now - 1)) != 0 ||
                                (our_wins_now & opp_non_losing) == 0));
          // The immediate-cutoff return below is only sound because beta was
          // clamped to <= max (win-in-3 score) on entry.
          assert(beta <= max);
          if (opp_forced_loss) return max;
        }
#endif

        const pos_t next_reachable = (child_possible << 1) & static_cast<pos_t>(P.get_board_mask());
#if MOVE_ORDER_USEFUL_THREATS
        const pos_t counted_threats = all_threats & ~(node_opp_threats << 1);
#else
        const pos_t counted_threats = all_threats;
#endif
        score = GenericPosition<W_CONST, H_CONST, ALIGN, WRAP>::popcount(counted_threats) * 1000000
              + GenericPosition<W_CONST, H_CONST, ALIGN, WRAP>::popcount(counted_threats & next_reachable) * 1000000;
      }
#endif

      // Common tail: TT-move and history bonuses (all strategies).
      // Jittered race workers get a weak TT-move bonus (c4-style: half a
      // threat unit, i.e. overridable by jitter) so they can genuinely
      // diverge from the shared principal line; the unjittered search keeps
      // the dominant bonus.
      if (col == table_move)  score += (score_jitter > 0) ? 500000 : 100000000;
      if (thread_history)     score += thread_history[col * (h_val + 1)] * 100;
      // Race-worker move-ordering jitter: amplitude is this ply's digit of the
      // worker's schedule, in units of 0.3 threats (300000).
      if (score_jitter > 0) {
        const uint32_t max_rand = 1u + (uint32_t)(score_jitter % 10);
        score += solverTlJitterStep * (int)(solverTlRand() % max_rand);
      }
      moves.add(move, score);

      // Prefetch child TT entry (key already computed during enumeration)
      transTable->prefetch(child_keys[j]);
    }

#if MOVE_ORDER_STRATEGY != 0 && !defined(DISABLE_WIN5)
  // No child produced a static win-in-3, so the earliest possible win is now
  // 5 plies out — tighten beta accordingly (c4's score_win(5) bound). This
  // bites hardest on the near-max windows of exact-score ladders.
  {
    const int win5 = ((w_val * h_val) - 3 - P.nbMoves()) / 2;
    if (beta > win5) {
      beta = win5;
      if (alpha >= beta) return beta;
    }
  }
#endif

  // Every child was pruned via TT lower bounds: fail low with their fold.
  if (num_children == 0) {
    return pruned_children_ub;
  }

  int best_score = pruned_children_ub;
  const int alpha_orig = alpha;
  uint8_t best_move = w_val;

  int cur_move_score = 0, prev_move_score = 0;
  bool first_move = true;
  while(typename GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::position_t next = moves.getNext(cur_move_score)) {
    // Jitter pass-down (c4's rule): jitter decays /10 per ply, EXCEPT when this
    // move's score is separated from both sorted neighbors by more than one
    // jitter step — then jitter couldn't have reordered this node, so pass it
    // down undiminished and let it diversify a deeper ply instead.
    int child_jitter = score_jitter / 10;
    if (score_jitter > 0) {
      int next_score;
      const bool gap_prev = first_move || prev_move_score > cur_move_score + solverTlJitterStep;
      const bool gap_next = !moves.peekScore(next_score) || next_score < cur_move_score - solverTlJitterStep;
      if (gap_prev && gap_next) child_jitter = score_jitter;
    }
    prev_move_score = cur_move_score;
    first_move = false;

    GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> P2(P);
    P2.play(next);
    int score = -negamax<HasBook, W_CONST, H_CONST>(P2, -beta, -alpha, book, book_depth, abort_flag, thread_history, child_jitter);

    if (shouldAbort(abort_flag)) return 0;

    if(score > best_score) {
      best_score = score;
      best_move = GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::ctz_impl(next) / (P.height() + 1);
    }

    if(best_score >= beta) {
      uint8_t stored_move = best_move;
      if (stored_move < w_val && is_reverse) stored_move = w_val - 1 - stored_move;
#if TT_WORK_SUBTREE_LOG2
      const uint8_t cutoff_work = tt_work_from_nodes_impl<(WIDTH == -1 ? 7u : (unsigned)WIDTH)>(solverTlNodeEpoch - subtree_epoch0);
#else
      const uint8_t cutoff_work = (uint8_t)(w_val * h_val - P.nbMoves());
#endif
      transTable->put(key, best_score + P.max_score() - 2 * P.min_score() + 2, cutoff_work, stored_move);
#ifndef NO_COLLECT_HOOKS
      if (collect_book)
        collect_book->narrow(P,
          (uint8_t)(best_score - P.min_score() + 1),
          (uint8_t)(max - P.min_score() + 1));
#endif
      return best_score;
    }
    alpha = std::max(alpha, best_score);
  }

#if TT_WORK_SUBTREE_LOG2
  uint8_t work = tt_work_from_nodes_impl<(WIDTH == -1 ? 7u : (unsigned)WIDTH)>(solverTlNodeEpoch - subtree_epoch0);
#else
  uint8_t work = (uint8_t)((w_val * h_val) - P.nbMoves());
#endif
  uint8_t stored_move = best_move;
  if (stored_move < w_val && is_reverse) stored_move = w_val - 1 - stored_move;
  transTable->put(key, best_score - P.min_score() + 1, work, stored_move);
#ifndef NO_COLLECT_HOOKS
  if (collect_book) {
    const uint8_t enc    = (uint8_t)(best_score - P.min_score() + 1);
    const uint8_t lo_enc = (uint8_t)(alpha_proven - P.min_score() + 1);
    if (best_score > alpha_orig || (best_score == alpha_orig && alpha_proven >= alpha_orig))
      collect_book->store(P, enc, 0);
    else
      collect_book->narrow(P, lo_enc, enc);
  }
#endif
  return best_score;
}

template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
template <bool HasBook>
int SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, SlotType>::dispatch_solve_weak(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>& P, int min, int max, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag, int32_t* thread_history, int score_jitter) {
    if constexpr (WIDTH == -1 && HEIGHT == -1) {
        if (P.width() == 7 && P.height() == 6) {
            return negamax<HasBook, 7, 6>(P, min, max, book, book_depth, abort_flag, thread_history, score_jitter);
        }
        if (P.width() == 8 && P.height() == 6) {
            return negamax<HasBook, 8, 6>(P, min, max, book, book_depth, abort_flag, thread_history, score_jitter);
        }
        if (P.width() == 7 && P.height() == 7) {
            return negamax<HasBook, 7, 7>(P, min, max, book, book_depth, abort_flag, thread_history, score_jitter);
        }
        if (P.width() == 6 && P.height() == 8) {
            return negamax<HasBook, 6, 8>(P, min, max, book, book_depth, abort_flag, thread_history, score_jitter);
        }
    }
    return negamax<HasBook, WIDTH, HEIGHT>(P, min, max, book, book_depth, abort_flag, thread_history, score_jitter);
}

/**
 * Multithreaded probe: `threads` workers race the SAME (alpha, beta) window
 * over the shared transposition table. Worker 0 runs the plain unjittered
 * search (so the worst case is the single-threaded search plus TT help);
 * workers 1..N-1 perturb their move ordering with per-ply jitter schedules so
 * they explore the tree in a different order and seed the shared table with
 * results the others pick up. First genuine finisher publishes the result and
 * aborts the rest.
 *
 * Why racing works HERE when whole-solve Lazy SMP measurably didn't:
 *  - the race is scoped to one null-window probe of solve_single()'s ladder,
 *    so all workers always agree on the current question and re-sync at every
 *    ladder step (the previous engine raced whole aspiration ladders);
 *  - the TT replacement policy protects entries by actual subtree cost
 *    (TT_WORK_SUBTREE_LOG2), so racing duplicates merge via the table instead
 *    of evicting each other's expensive results;
 *  - jitter decays by /10 per ply, so workers diverge near the probe root
 *    (where duplicate work is most wasteful) but converge to identical move
 *    ordering deeper down (where shared-TT reuse pays the most).
 */
template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
template <bool HasBook>
int SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, SlotType>::raced_probe(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>& P, int alpha, int beta, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, int threads, std::atomic<bool>* abort_flag, int32_t* thread_history, int solo_jitter) {
  assert(alpha < beta);
  assert(threads >= 1);
  if (threads <= 1) {
    return dispatch_solve_weak<HasBook>(P, alpha, beta, book, book_depth, abort_flag, thread_history, solo_jitter);
  }

  static const bool probe_log = std::getenv("RACED_PROBE_LOG") != nullptr;
  const uint64_t log_nodes0 = probe_log ? getNodeCount() + solverTlNodeCount : 0;
  const auto log_t0 = std::chrono::steady_clock::now();

  pool->ensureCapacity(threads - 1);

  std::atomic<bool> done{false};
  std::atomic<int> result_val{0};
  std::atomic<int> remaining{threads - 1};
  std::promise<void> prom;
  auto fut = prom.get_future();

  // A worker may claim the result only if it never observed an abort: `done`
  // is monotonic, so done==false after its search completed means the search
  // ran to completion. stopSearch/timeout aborts are checked by the caller.
  auto try_publish = [&](int r) {
    if (!this->shouldAbort(&done) && !done.exchange(true, std::memory_order_acq_rel)) {
      result_val.store(r, std::memory_order_relaxed);
    }
  };

  const int jitter_step = 1000000;
  for (int i = 1; i < threads; i++) {
    const int jitter = jitterScheduleForWorker(i);
    pool->enqueue([&, jitter, jitter_step]() {
      solverTlNodeCount = 0;
      solverTlJitterStep = jitter_step;
      int r = dispatch_solve_weak<HasBook>(P, alpha, beta, book, book_depth, &done, nullptr, jitter);
      nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
      solverTlNodeCount = 0;
      try_publish(r);
      if (remaining.fetch_sub(1) == 1) prom.set_value();
    });
  }

  {
    int r0 = dispatch_solve_weak<HasBook>(P, alpha, beta, book, book_depth, &done, thread_history);
    try_publish(r0);
  }

  // Wait for the raced workers, propagating outer aborts (per-column analyze
  // aborts, stop(), timeouts) into the probe so they wind down quickly.
  while (fut.wait_for(std::chrono::microseconds(200)) != std::future_status::ready) {
    if (this->shouldAbort(abort_flag)) {
      done.store(true, std::memory_order_release);
    }
  }

  if (probe_log) {
    double ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - log_t0).count();
    fprintf(stderr, "[probe] window=(%d,%d) nodes=%llu ms=%.1f result=%d\n", alpha, beta,
            (unsigned long long)(getNodeCount() + solverTlNodeCount - log_nodes0), ms,
            result_val.load(std::memory_order_relaxed));
  }

  if (this->shouldAbort(abort_flag)) return alpha;  // caller re-checks and discards
  return result_val.load(std::memory_order_relaxed);
}

template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
template <bool HasBook>
::GameSolver::Connect4::SolverResult SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, SlotType>::solve_single(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag, int32_t* thread_history, int threads, int score_jitter) {
  if(P.canWinNext()) {
    int score = ((P.width() * P.height()) + 1 - P.nbMoves()) / 2;
    for (int i = 0; i < P.width(); i++) {
        if (P.canPlay(i) && P.isWinningMove(i)) return {score, i, (int)P.nbMoves(), getNodeCount()};
    }
    return {score, -1, (int)P.nbMoves(), getNodeCount()};
  }

  int min = -((P.width() * P.height()) - P.nbMoves()) / 2;
  int max = ((P.width() * P.height()) + 1 - P.nbMoves()) / 2;
  int score = 0;

  // Every probe below is a fixed null window (hi == lo + 1). When threads > 1,
  // the probe is raced by jittered workers over the shared TT (see
  // raced_probe); threads == 1 keeps the exact single-threaded behavior.
  auto probe = [&](int lo, int hi) {
    return raced_probe<HasBook>(P, lo, hi, book, book_depth, threads, abort_flag, thread_history, score_jitter);
  };

  if constexpr (HasBook) {
    if (P.nbMoves() <= book_depth) {
      if (auto lu = book->query(P); lu.found()) {
        if (lu.lower == lu.upper) { score = lu.lower + P.min_score() - 1; goto find_move; }
        int blo = lu.lower + P.min_score() - 1;
        int bhi = lu.upper + P.min_score() - 1;
        min = std::max(min, blo);
        max = std::min(max, bhi);
        if (min >= max) { score = min; goto find_move; }
        // bounds narrowed the window — fall through with tightened min/max
      }
    }
  }
  assert(min <= max);
  if (weak) {
    min = -1;
    max = 1;
    while(min < max) {
      if (shouldAbort(abort_flag)) { score = min; break; }
      int med = min + (max - min) / 2;
      if(med <= 0 && min / 2 < med) med = min / 2;
      else if(med >= 0 && max / 2 > med) med = max / 2;
      int r = probe(med, med + 1);
      if (shouldAbort(abort_flag)) { score = min; break; }
      if(r <= med) max = r;
      else min = r;
    }
    score = min;
  } else {
    int r = probe(-1, 0);
    if (shouldAbort(abort_flag)) goto flush;
    if (r <= -1) {
      max = -1;
      for (int i = -2; i >= min; i--) {
        if (shouldAbort(abort_flag)) { score = max; goto flush; }
        if (probe(i, i + 1) > i) {
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
      r = probe(0, 1);
      if (shouldAbort(abort_flag)) { score = 0; goto flush; }
      if (r <= 0) {
        score = 0;
      } else {
        min = 1;
        for (int i = 1; i < max; i++) {
          if (shouldAbort(abort_flag)) { score = min; goto flush; }
          if (probe(i, i + 1) <= i) {
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

find_move:
  int bestMove = -1;

  // PHASE 1: Try to find a move using ONLY the Opening Book (Shortcut for Sparse Books)
  // Children sit one ply past P, so this can only hit when they're still within
  // book_depth — i.e. P.nbMoves() < book_depth. At P.nbMoves() == book_depth every
  // child query is guaranteed to miss the depth guard, so skip straight to PHASE 2.
  if constexpr (HasBook) {
    if (P.nbMoves() < book_depth) {
      for (int i = 0; i < P.width(); i++) {
          int col = this->COLUMN_ORDER[i];
          if (P.canPlay(col)) {
              GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> P2(P);
              P2.playCol(col);
              if (auto lu = book->query(P2); lu.found()) {
                  int child_score = lu.lower + P.min_score() - 1;
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
              // Null-window verification probe; route through the parallel
              // dispatch like the main probes — this scan is otherwise a
              // fully serial tail after the score is already known. The
              // `== -score` test is fail-soft-safe: any child satisfies
              // child >= -score, so a fail-low upper bound is forced to
              // exactly -score, and a fail-high return is >= -score + 1.
              int vr = raced_probe<HasBook>(P2, -score, -score + 1, book, book_depth, threads, abort_flag, thread_history, score_jitter);
              if (vr == -score) {
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

  // MutableBook's query()/dump() are unlocked reads; store()/narrow() write under
  // a lock. Using the same instance as both the oracle and the collection target
  // is only safe single-threaded — reject it once threads spawn concurrently.
  if (threads > 1 && collect_book && active_book == static_cast<const OpeningBookBase<WIDTH, HEIGHT>*>(collect_book)) {
    throw std::runtime_error("solve(): the same MutableBook cannot be used as both the query oracle and the collect_book target in a multi-threaded solve.");
  }

  if (threads <= 1) {
    if (active_book) return solve_single<true>(P, weak, active_book, active_book->getDepth());
    else return solve_single<false>(P, weak, nullptr, 0);
  }

  // --- Per-probe jittered racing (see raced_probe) ---
  // One logical solve_single() call; each null-window probe of its ladder is
  // raced by `threads` jittered workers over the shared TT.
  pool->ensureCapacity(threads - 1);
  solverTlNodeCount = 0;
  ::GameSolver::Connect4::SolverResult final_result;
  if (active_book) final_result = solve_single<true>(P, weak, active_book, active_book->getDepth(), nullptr, nullptr, threads);
  else final_result = solve_single<false>(P, weak, nullptr, 0, nullptr, nullptr, threads);
  nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
  solverTlNodeCount = 0;

  final_result.nodes = getNodeCount();
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

  // See solve(): same-instance oracle+collector is only safe single-threaded.
  {
    const OpeningBookBase<WIDTH, HEIGHT>* active_book = book ? book : this->book;
    if (threads > 1 && collect_book && active_book == static_cast<const OpeningBookBase<WIDTH, HEIGHT>*>(collect_book)) {
      throw std::runtime_error("analyze(): the same MutableBook cannot be used as both the query oracle and the collect_book target in a multi-threaded analyze.");
    }
  }

  std::vector<int> scores(P.width(), -1000);

  // Mirror-symmetric positions: mirrored columns are pure transpositions —
  // solve one of each pair, copy the score afterwards.
  const bool analyze_symmetric = P.mirror_key(P.key()) == P.key();
  const OpeningBookBase<WIDTH, HEIGHT>* active_book = book ? book : this->book;

  // Strategy (measured on M5 Max, 7x6/7x7 corpora):
  //  - threads <= width: root-split — each worker takes whole columns
  //    (serial solves in parallel, zero racing duplication), idle workers
  //    then join stragglers as jittered whole-solve racers. Clearly faster
  //    when columns outnumber threads (-16..-23% vs sequential at 4T).
  //  - threads > width: solve columns sequentially, each as a full
  //    `threads`-wide raced solve — per-probe racing beats a long
  //    whole-solve straggler tail once workers outnumber columns.
  const bool use_root_split = threads > 1 && threads <= P.width();
  if (use_root_split) {
  const int w_cols = P.width();
  auto col_done = std::make_unique<std::atomic<bool>[]>(w_cols);
  auto col_abort = std::make_unique<std::atomic<bool>[]>(w_cols);
  std::vector<GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>> col_positions(w_cols, GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>(P.width(), P.height()));
  std::vector<bool> col_valid(w_cols, false);

  for (int c = 0; c < w_cols; c++) {
    col_abort[c].store(false, std::memory_order_relaxed);
    col_done[c].store(true, std::memory_order_relaxed);
    if (!P.canPlay(c)) continue;
    if (P.isWinningMove(c)) {
      scores[c] = ((P.width() * P.height()) + 1 - P.nbMoves()) / 2;
      continue;
    }
    if (analyze_symmetric && c > w_cols - 1 - c) continue;
    GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> P2(P);
    P2.playCol(c);
    col_positions[c] = P2;
    col_valid[c] = true;
    col_done[c].store(false, std::memory_order_relaxed);
  }

  std::atomic<int> next_col{0};
  std::atomic<int> helper_seq{0};
  auto worker = [&]() {
    // Phase 1: grab whole columns.
    while (true) {
      int i = next_col.fetch_add(1);
      if (i >= w_cols) break;
      int col = this->COLUMN_ORDER[i];
      if (!col_valid[col]) continue;
      solverTlNodeCount = 0;
      ::GameSolver::Connect4::SolverResult result;
      if (active_book) result = solve_single<true>(col_positions[col], weak, active_book, active_book->getDepth(), &col_abort[col]);
      else result = solve_single<false>(col_positions[col], weak, nullptr, 0, &col_abort[col]);
      nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
      solverTlNodeCount = 0;
      if (!result.aborted) scores[col] = -result.score;
      col_done[col].store(true, std::memory_order_release);
      col_abort[col].store(true, std::memory_order_release);
    }
    // Phase 2: jittered whole-solve racing on stragglers.
    while (!shouldAbort()) {
      int straggler = -1;
      for (int c = 0; c < w_cols; c++) {
        if (col_valid[c] && !col_done[c].load(std::memory_order_acquire)) { straggler = c; break; }
      }
      if (straggler < 0) break;
      const int jitter = jitterScheduleForWorker(1 + (helper_seq.fetch_add(1) % 11));
      solverTlNodeCount = 0;
      if (active_book) solve_single<true>(col_positions[straggler], weak, active_book, active_book->getDepth(), &col_abort[straggler], nullptr, 1, jitter);
      else solve_single<false>(col_positions[straggler], weak, nullptr, 0, &col_abort[straggler], nullptr, 1, jitter);
      nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
      solverTlNodeCount = 0;
    }
  };

  if (threads <= 1) {
    worker();
  } else {
    pool->ensureCapacity(threads - 1);
    std::atomic<int> remaining(threads - 1);
    std::promise<void> prom;
    auto fut = prom.get_future();
    for (int i = 0; i < threads - 1; i++) {
      pool->enqueue([&]() {
        worker();
        if (remaining.fetch_sub(1) == 1) prom.set_value();
      });
    }
    worker();
    fut.wait();
  }
  } else {
  // Columns are solved one at a time, center-first; each column solve fans
  // out internally across `threads` raced workers (see raced_probe), so
  // analyze() scales exactly like solve() — no idle straggler tail, and
  // sibling columns reuse each other's transposition-table work.
  for (int i = 0; i < P.width(); i++) {
    int col = this->COLUMN_ORDER[i];
    if (!P.canPlay(col)) continue;
    if (P.isWinningMove(col)) {
      scores[col] = ((P.width() * P.height()) + 1 - P.nbMoves()) / 2;
      continue;
    }
    if (analyze_symmetric && col > P.width() - 1 - col) continue;  // copied from mirror below
    if (shouldAbort()) break;

    GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> P2(P);
    P2.playCol(col);
    solverTlNodeCount = 0;
    ::GameSolver::Connect4::SolverResult result;
    if (active_book) result = solve_single<true>(P2, weak, active_book, active_book->getDepth(), nullptr, nullptr, threads);
    else result = solve_single<false>(P2, weak, nullptr, 0, nullptr, nullptr, threads);
    nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
    solverTlNodeCount = 0;
    if (shouldAbort()) break;  // aborted mid-column: keep -1000, stop
    scores[col] = -result.score;
  }
  }

  if (analyze_symmetric) {
    for (int c = 0; c < P.width(); c++) {
      int m = P.width() - 1 - c;
      if (c > m && P.canPlay(c) && !P.isWinningMove(c)) scores[c] = scores[m];
    }
  }

  return scores;
}

template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
class TypedCache : public ::GameSolver::Connect4::Cache {
 public:
  static constexpr int VALUE_BITS = WIDTH == -1 ? 8 : getRequiredValueBits<WIDTH, HEIGHT, ALIGN, WRAP>();
  static constexpr int MOVE_BITS = WIDTH == -1 ? 4 : (WIDTH >= 16 ? 5 : (WIDTH >= 8 ? 4 : 3));
  std::shared_ptr<TranspositionTable<SlotType, uint8_t, VALUE_BITS, WIDTH == -1 ? 7 : WIDTH, 0, MOVE_BITS, typename GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::position_t>> transTable;

  TypedCache(size_t table_bytes) {
      auto* t = new (std::nothrow) TranspositionTable<SlotType, uint8_t, VALUE_BITS, WIDTH == -1 ? 7 : WIDTH, 0, MOVE_BITS, typename GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::position_t>(table_bytes);
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
