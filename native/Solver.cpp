// Move ordering strategy (override at compile time with -DMOVE_ORDER_STRATEGY=0)
// 0 = baseline: moveScore weighted equally across all threats
// 1 = two-tier: immediate threats (reachable next turn) count double [DEFAULT, -8% nodes overall]
#ifndef MOVE_ORDER_STRATEGY
#define MOVE_ORDER_STRATEGY 1
#endif

// Tail strategy for the 2-ply path: 1 = idle workers race the whole probe
// (legacy-style, shared TT) once every task has a searcher; 0 = pile a second
// helper onto the least-searched task instead.
#ifndef SOLVE_TAIL_RACERS
#define SOLVE_TAIL_RACERS 1
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
    table_move = packed.best_move;
    if (table_move < w_val && is_reverse) table_move = w_val - 1 - table_move;

    if(val > P.max_score() - P.min_score() + 1) { // we have an lower bound
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
              alpha_proven = std::max(alpha_proven, our_min);
              if (alpha >= beta) return alpha;
          }
        }
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
  const int alpha_orig = alpha;
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

  uint8_t work = (w_val * h_val) - P.nbMoves();
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
 * Root-parallel probe engine: one null-window probe decomposed into
 * GRANDCHILD tasks across the shared ThreadPool.
 *
 * With a null window, the algebra collapses beautifully: parent window is
 * (a, a+1), each child is searched at (-a-1, -a), so each grandchild is
 * searched at (a, a+1) — the parent's own window. The probe becomes a pure
 * max-min: parent value = max over children i of min over grandchildren g
 * of value(g). Therefore:
 *   - grandchild fails LOW  (<= a)  → its child can never prove fail-high:
 *     kill the group, fold the value as a fail-soft upper-bound contribution.
 *   - ALL grandchildren of one child fail HIGH (>= a+1) → parent fails high
 *     with value min(grandchild values).
 *   - every group killed → parent fails low, value max(folded group bounds).
 *
 * Compared to the 1-ply version this yields ~width^2 work units instead of
 * ~width, so the tail is a single grandchild subtree instead of a child
 * subtree, and straggler-help duplication happens at far finer granularity.
 * Child- and grandchild-level TT peeks pre-resolve units the serial search
 * would have short-circuited.
 *
 * This dispatcher deliberately does NOT write TT entries for the probe
 * root / children / first-grandchildren it resolves: its derivable bounds
 * (min/max folds over task results) are systematically weaker than what a
 * direct search of those nodes proves, and overwriting the strong entries
 * the task searches leave behind measurably poisons subsequent probes
 * (100x+ node blowups on high-score exact ladders at 2-4 threads). The
 * negamax calls the tasks run store their own entries — that is the TT
 * state later probes rely on.
 */
template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
template <bool HasBook>
int SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, SlotType>::dispatch_solve_weak_parallel2(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>& P, int alpha, int beta, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, int threads, std::atomic<bool>* abort_flag) {
  using pos_t = typename GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>::position_t;
  const int w_val = P.width();
  const int h_val = P.height();
  constexpr int MAX_W = 16;
  constexpr int MAX_TASKS = MAX_W * MAX_W * 2;   // gc tasks + expanded ggc tasks

  // --- Parent prologue: identical to the 1-ply version ---
  if (P.canWinNext()) return ((w_val * h_val) + 1 - P.nbMoves()) / 2;

  pos_t possible = static_cast<pos_t>(P.possibleNonLosingMoves());
  if (possible == 0)
    return -((w_val * h_val) - P.nbMoves()) / 2;

  if (P.nbMoves() >= (w_val * h_val) - 2)
    return 0;

  if ((possible & (possible - 1)) == 0 || w_val > MAX_W)
    return dispatch_solve_weak<HasBook>(P, alpha, beta, book, book_depth, abort_flag, nullptr);

  int min = -((w_val * h_val) - 2 - P.nbMoves()) / 2;
  if (alpha < min) {
    alpha = min;
    if (alpha >= beta) return alpha;
  }
  int max = ((w_val * h_val) - 1 - P.nbMoves()) / 2;
  if (beta > max) {
    beta = max;
    if (alpha >= beta) return beta;
  }

  if (h_val % 2 == 0 && P.nbMoves() % 2 == 0) {
    int evens = P.computeEvensStrategy();
    if (evens < 0) {
      if (beta > evens) {
        beta = evens;
        if (alpha >= beta) return beta;
      }
    } else if (evens == 0) {
      if (beta > 0) {
        beta = 0;
        if (alpha >= beta) return beta;
      }
    }
  }

  constexpr int TT_PROBE_DEPTH = 15;
  bool is_reverse = false;
  pos_t key;
  if ((w_val * h_val) - P.nbMoves() <= TT_PROBE_DEPTH) {
    key = P.key();
  } else {
    key = P.symmetric_key(is_reverse);
  }

  if (auto packed = transTable->getPacked(key); packed.value) {
    uint8_t val = packed.value;
    if (val > P.max_score() - P.min_score() + 1) { // lower bound
      min = val + 2 * P.min_score() - P.max_score() - 2;
      alpha = std::max(alpha, min);
      if (alpha >= beta) return alpha;
    } else { // upper bound
      max = val + P.min_score() - 1;
      beta = std::min(beta, max);
      if (alpha >= beta) return beta;
    }
  }

  const bool symmetric = P.mirror_key(P.key()) == P.key();
  auto tt_key_for = [&](const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>& X) {
    return ((w_val * h_val) - X.nbMoves() <= TT_PROBE_DEPTH) ? X.key() : X.symmetric_key();
  };

  // --- Group construction: one group per child, one task per grandchild ---
  int group_col[MAX_W];
  GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> group_child[MAX_W];
  pos_t group_child_key[MAX_W];
  int group_minv_init[MAX_W];      // min over TT-pre-resolved fail-high grandchildren
  int group_task_count[MAX_W];
  int num_groups = 0;

  GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> gc_pos[MAX_TASKS];
  int gc_group[MAX_TASKS];
  bool task_is_ggc[MAX_TASKS];      // true: great-grandchild task under the group's first gc
  int num_tasks = 0;

  // First-grandchild expansion state (see below): the group's best-ordered
  // grandchild is decomposed into its own children instead of being one task.
  bool group_expanded[MAX_W];
  bool group_gc0_done_init[MAX_W];  // first gc resolved inline at enumeration
  int group_sub_count[MAX_W];       // ggc task count under the expanded first gc
  GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> group_gc0[MAX_W];
  pos_t group_gc0_key[MAX_W];

  int fold_max = -P.max_score();   // fail-soft max of pre-resolved group upper bounds
  bool any_fold = false;

  for (int i = 0; i < w_val; i++) {
    int col = this->COLUMN_ORDER[i];
    pos_t move = possible & static_cast<pos_t>(P.column_mask(col));
    if (!move) continue;
    if (symmetric && col > w_val - 1 - col) continue;
    GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> child(P);
    child.play(move);

    // Child TT peek: an upper bound proves our fail-high; a lower bound can
    // rule the whole group out (contribution = -child <= -lb <= alpha).
    pos_t child_key = tt_key_for(child);
    if (auto cp = transTable->getPacked(child_key); cp.value) {
      if (cp.value <= P.max_score() - P.min_score() + 1) {
        int child_ub = cp.value + P.min_score() - 1;
        int contrib_lb = -child_ub;
        if (contrib_lb >= beta) return contrib_lb;
      } else {
        int child_lb = cp.value + 2 * P.min_score() - P.max_score() - 2;
        int contrib_ub = -child_lb;
        if (contrib_ub <= alpha) {   // group can never fail high
          fold_max = std::max(fold_max, contrib_ub);
          any_fold = true;
          continue;
        }
      }
    }

    // Child-level terminal shortcuts (child.canWinNext() is impossible: the
    // move came from possibleNonLosingMoves).
    pos_t child_possible = static_cast<pos_t>(child.possibleNonLosingMoves());
    if (child_possible == 0) {   // opponent has no non-losing reply: we win
      int contrib = ((w_val * h_val) - child.nbMoves()) / 2;
      if (contrib >= beta) return contrib;
      fold_max = std::max(fold_max, contrib);
      any_fold = true;
      continue;
    }
    if (child.nbMoves() >= (w_val * h_val) - 2) {   // draw after child
      if (0 >= beta) return 0;
      fold_max = std::max(fold_max, 0);
      any_fold = true;
      continue;
    }
    if (h_val % 2 == 0 && child.nbMoves() % 2 == 0) {
      int evens = child.computeEvensStrategy();
      // child <= bound → contribution >= -bound: a fail-high proof for us.
      if (evens < 0 && -evens >= beta) return -evens;
      if (evens == 0 && 0 >= beta) return 0;
    }

    // Grandchild enumeration with TT pre-resolution.
    int minv = INT_MAX;
    bool group_skipped = false;
    GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> live_gc[MAX_W];
    int num_live_gc = 0;
    for (int j = 0; j < w_val && !group_skipped; j++) {
      int gcol = this->COLUMN_ORDER[j];
      pos_t gmove = child_possible & static_cast<pos_t>(child.column_mask(gcol));
      if (!gmove) continue;
      GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> gc(child);
      gc.play(gmove);
      if (auto gp = transTable->getPacked(tt_key_for(gc)); gp.value) {
        if (gp.value <= P.max_score() - P.min_score() + 1) {
          int gc_ub = gp.value + P.min_score() - 1;
          if (gc_ub <= alpha) {   // this grandchild already fails low → group dead
            fold_max = std::max(fold_max, gc_ub);
            any_fold = true;
            group_skipped = true;
            break;
          }
        } else {
          int gc_lb = gp.value + 2 * P.min_score() - P.max_score() - 2;
          if (gc_lb >= beta) {    // pre-resolved fail-high: fold, don't enqueue
            minv = std::min(minv, gc_lb);
            continue;
          }
        }
      }
      live_gc[num_live_gc++] = gc;
    }
    if (group_skipped) continue;
    if (num_live_gc == 0) {
      // every grandchild pre-resolved fail-high → parent fails high now
      return minv;
    }

    // First-grandchild expansion: live_gc[0] is the best-ordered grandchild —
    // under the fail-low hypothesis it is the one that kills this group, and
    // its OWN search is an AND node (it fails low iff every one of its
    // children fails high vs (-beta,-alpha)). Decomposing it into ggc tasks
    // parallelizes exactly the work the serial search would do, instead of
    // leaving each group's kill search single-threaded.
    int first_task = num_tasks;
    int gc_level_unresolved = num_live_gc;   // counts live_gc entries (gc0 included)
    bool expanded = false;
    bool gc0_inline_done = false;
    int sub_count = 0;
    {
      const auto& gc0 = live_gc[0];
      if (gc0.canWinNext()) {
        // gc0's mover mates: gc0 >= mate >= beta — gc0 resolved fail-high.
        int mate = ((w_val * h_val) + 1 - gc0.nbMoves()) / 2;
        minv = std::min(minv, mate);
        gc_level_unresolved--;
        gc0_inline_done = true;
      } else {
        pos_t gc0_possible = static_cast<pos_t>(gc0.possibleNonLosingMoves());
        if (gc0_possible == 0) {
          int gc0_val = -((w_val * h_val) - gc0.nbMoves()) / 2;
          if (gc0_val <= alpha) {   // exact value kills the group
            fold_max = std::max(fold_max, gc0_val);
            any_fold = true;
            continue;               // group resolved fail-low
          }
          minv = std::min(minv, gc0_val);
          gc_level_unresolved--;
          gc0_inline_done = true;
        } else if (gc0.nbMoves() >= (w_val * h_val) - 2) {
          if (0 <= alpha) {
            fold_max = std::max(fold_max, 0);
            any_fold = true;
            continue;
          }
          minv = std::min(minv, 0);
          gc_level_unresolved--;
          gc0_inline_done = true;
        } else if ((gc0_possible & (gc0_possible - 1)) != 0) {
          // >= 2 replies: expand into ggc tasks (all eligible from the start).
          for (int j = 0; j < w_val; j++) {
            int gcol = this->COLUMN_ORDER[j];
            pos_t gmove = gc0_possible & static_cast<pos_t>(gc0.column_mask(gcol));
            if (!gmove) continue;
            GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> ggc(gc0);
            ggc.play(gmove);
            gc_pos[num_tasks] = ggc;
            gc_group[num_tasks] = num_groups;
            task_is_ggc[num_tasks] = true;
            num_tasks++;
            sub_count++;
          }
          expanded = true;
          group_gc0[num_groups] = gc0;
          group_gc0_key[num_groups] = tt_key_for(gc0);
        }
      }
    }
    if (gc_level_unresolved == 0) {
      // gc0 was the only live grandchild and it resolved fail-high.
      num_tasks = first_task;
      return minv;
    }
    // Enqueue the remaining grandchildren as ordinary (staged) gc tasks.
    for (int j = (expanded || gc0_inline_done) ? 1 : 0; j < num_live_gc; j++) {
      gc_pos[num_tasks] = live_gc[j];
      gc_group[num_tasks] = num_groups;
      task_is_ggc[num_tasks] = false;
      num_tasks++;
    }
    if (num_tasks == first_task) continue;   // nothing searchable (defensive)
    group_col[num_groups] = col;
    group_child[num_groups] = child;
    group_child_key[num_groups] = child_key;
    group_minv_init[num_groups] = minv;
    group_task_count[num_groups] = gc_level_unresolved;
    group_expanded[num_groups] = expanded;
    group_gc0_done_init[num_groups] = gc0_inline_done;
    group_sub_count[num_groups] = sub_count;
    num_groups++;
  }

  if (num_groups == 0) {   // everything pre-resolved as fail-low
    return any_fold ? fold_max : alpha;
  }
  if (num_tasks <= 1) {    // nothing meaningful to fan out
    return dispatch_solve_weak<HasBook>(P, alpha, beta, book, book_depth, abort_flag, nullptr);
  }

  nodeCount.fetch_add(1, std::memory_order_relaxed);

  const int worker_count = std::min(threads, num_tasks);
  pool->ensureCapacity(worker_count - 1);

  std::atomic<bool> cutoff{false};
  std::atomic<bool> have_winner{false};
  int winning_value = 0;             // written only by the have_winner winner
  int winning_col = w_val;
  std::atomic<int> best_seen{any_fold ? fold_max : -P.max_score()};
  std::atomic<int> groups_left{num_groups};
  std::array<std::atomic<bool>, MAX_W> group_dead{};
  std::array<std::atomic<int>, MAX_W> group_left{};
  std::array<std::atomic<int>, MAX_W> group_minv{};
  std::array<std::atomic<bool>, MAX_TASKS> gc_done{};   // abort + taint + resolution, monotonic
  std::array<std::atomic<bool>, MAX_TASKS> gc_claimed{};
  std::array<std::atomic<int>, MAX_TASKS> gc_searchers{};
  // Staged (YBWC-style) eligibility: initially only each group's FIRST
  // (best-ordered, most-likely-refuting) grandchild is dispatched. If the
  // parent is going to fail low, that one task kills its group and the
  // siblings were never needed — exactly like the serial beta cutoff. Only
  // when a first grandchild FAILS HIGH (so its child is now a genuine
  // fail-high candidate whose proof needs every grandchild) do the siblings
  // become eligible and fan out.
  std::array<std::atomic<bool>, MAX_TASKS> gc_eligible{};
  // Duplication budgets: at most one speculative sibling per group and two
  // whole-probe racers at a time. Uncapped duplication measurably HURTS at
  // high thread counts — perturbed-history duplicates overwrite shared TT
  // move hints and slow the primary searchers; an idle core is cheaper.
  std::array<std::atomic<int>, MAX_W> spec_claims{};
  // Sub-group state for expanded first grandchildren.
  std::array<std::atomic<int>, MAX_W> sub_left{};
  std::array<std::atomic<int>, MAX_W> sub_minv{};
  std::array<std::atomic<bool>, MAX_W> gc0_resolved{};
  std::atomic<int> racer_count{0};
  std::atomic<int> helper_seq{0};
  for (int i = 0; i < num_groups; i++) {
    group_left[i].store(group_task_count[i], std::memory_order_relaxed);
    group_minv[i].store(group_minv_init[i], std::memory_order_relaxed);
    sub_left[i].store(group_sub_count[i], std::memory_order_relaxed);
    sub_minv[i].store(INT_MAX, std::memory_order_relaxed);
    if (group_gc0_done_init[i]) gc0_resolved[i].store(true, std::memory_order_relaxed);
  }
  {
    bool first_plain_seen[MAX_W] = {};
    for (int t = 0; t < num_tasks; t++) {
      int g = gc_group[t];
      if (task_is_ggc[t]) {
        // Expanded first gc: every one of its children is needed under the
        // fail-low hypothesis — all eligible immediately.
        gc_eligible[t].store(true, std::memory_order_relaxed);
      } else if (group_gc0_done_init[g]) {
        // First gc already proved fail-high at enumeration: the group is a
        // fail-high candidate, all siblings eligible immediately.
        gc_eligible[t].store(true, std::memory_order_relaxed);
      } else if (!group_expanded[g] && !first_plain_seen[g]) {
        // Unexpanded group: its first plain task IS the first gc.
        gc_eligible[t].store(true, std::memory_order_relaxed);
      }
      if (!task_is_ggc[t]) first_plain_seen[g] = true;
    }
  }

  std::atomic<int> remaining(worker_count - 1);
  std::promise<void> prom;
  auto fut = prom.get_future();

  auto kill_group = [&](int g) {   // mark every task in group g aborted
    for (int t = 0; t < num_tasks; t++)
      if (gc_group[t] == g) gc_done[t].store(true, std::memory_order_relaxed);
  };

  // gc-level fail-high resolution shared by plain gc tasks and the expanded
  // first gc (when one of its ggc children fails low): fold the gc's lower
  // bound into the group min, open the siblings, and complete the group if
  // it was the last unresolved gc.
  auto resolve_gc_fail_high = [&](int g, int gc_lb) {
    for (int j = 0; j < num_tasks; j++)
      if (gc_group[j] == g && !task_is_ggc[j]) gc_eligible[j].store(true, std::memory_order_relaxed);
    int prev = group_minv[g].load(std::memory_order_relaxed);
    while (gc_lb < prev && !group_minv[g].compare_exchange_weak(prev, gc_lb, std::memory_order_relaxed)) {}
    if (group_left[g].fetch_sub(1, std::memory_order_acq_rel) == 1 &&
        !group_dead[g].load(std::memory_order_acquire)) {
      // Whole group failed high → parent fails high.
      if (!have_winner.exchange(true, std::memory_order_acq_rel)) {
        winning_value = group_minv[g].load(std::memory_order_relaxed);
        winning_col = group_col[g];
        cutoff.store(true, std::memory_order_release);
        for (int j = 0; j < num_tasks; j++)
          gc_done[j].store(true, std::memory_order_relaxed);
      }
    }
  };

  // gc-level fail-low: the group can never prove the parent fails high.
  auto kill_group_with = [&](int g, int contrib_ub) {
    if (!group_dead[g].exchange(true, std::memory_order_acq_rel)) {
      int prev = best_seen.load(std::memory_order_relaxed);
      while (contrib_ub > prev && !best_seen.compare_exchange_weak(prev, contrib_ub, std::memory_order_relaxed)) {}
      kill_group(g);
      if (groups_left.fetch_sub(1, std::memory_order_acq_rel) == 1) {
        // Parent fail-low fully resolved — stop the whole-probe racers too.
        cutoff.store(true, std::memory_order_release);
      }
    }
  };

  auto handle_result = [&](int t, int val) {
    int g = gc_group[t];
    // gc_done[t] is monotonic: still unset ⟹ our search never observed an
    // abort ⟹ `val` is from a genuinely completed search.
    if (task_is_ggc[t]) {
      // Great-grandchild under the group's expanded first gc, searched at
      // (-beta, -alpha). gc0 = max over ggc of -ggc_val.
      if (val <= -beta) {
        // ggc fails low → gc0 >= -val >= beta: gc0 fails high, group survives.
        if (!gc_done[t].exchange(true, std::memory_order_acq_rel)) {
          if (!gc0_resolved[g].exchange(true, std::memory_order_acq_rel)) {
            for (int j = 0; j < num_tasks; j++)
              if (gc_group[j] == g && task_is_ggc[j]) gc_done[j].store(true, std::memory_order_relaxed);
            resolve_gc_fail_high(g, -val);
          }
        }
        return;
      }
      // ggc fails high (>= -alpha) → contributes an upper-bound piece to gc0.
      if (!gc_done[t].exchange(true, std::memory_order_acq_rel)) {
        int prev = sub_minv[g].load(std::memory_order_relaxed);
        while (val < prev && !sub_minv[g].compare_exchange_weak(prev, val, std::memory_order_relaxed)) {}
        if (sub_left[g].fetch_sub(1, std::memory_order_acq_rel) == 1 &&
            !gc0_resolved[g].exchange(true, std::memory_order_acq_rel)) {
          // Every ggc failed high → gc0 <= -min(ggc) <= alpha: gc0 fails low
          // and kills the whole group, exactly like a serial beta cutoff.
          int gc0_ub = -sub_minv[g].load(std::memory_order_relaxed);
          kill_group_with(g, gc0_ub);
        }
      }
      return;
    }
    if (val >= beta) {
      // Grandchild fails high: this child is now a fail-high candidate.
      if (!gc_done[t].exchange(true, std::memory_order_acq_rel)) {
        resolve_gc_fail_high(g, val);
      }
      return;
    }
    // Grandchild fails low: its child can never prove fail-high — kill the group.
    if (!gc_done[t].exchange(true, std::memory_order_acq_rel)) {
      kill_group_with(g, val);
    }
  };

  // Whole-probe racer (legacy Lazy-SMP mechanism, scoped to the probe tail):
  // when every unresolved grandchild already has a searcher, an idle worker
  // re-searches the WHOLE probe serially with perturbed history. It TT-hits
  // everything the decomposition already resolved (including the child-level
  // bounds stored above), so it effectively focuses on the remainder — and a
  // completed racer resolves the entire probe by itself. `cutoff` is its
  // abort flag AND taint flag (monotonic, same argument as gc_done).
  std::atomic<bool> parent_raced{false};
  int raced_value = 0;   // written only by the parent_raced winner
  auto run_racer = [&](int32_t* hist) {
    solverTlNodeCount = 0;
    int r = dispatch_solve_weak<HasBook>(P, alpha, beta, book, book_depth, &cutoff, hist);
    nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
    solverTlNodeCount = 0;
    if (cutoff.load(std::memory_order_acquire)) return;   // tainted or already resolved
    if (!parent_raced.exchange(true, std::memory_order_acq_rel)) {
      raced_value = r;
      cutoff.store(true, std::memory_order_release);
      for (int j = 0; j < num_tasks; j++)
        gc_done[j].store(true, std::memory_order_relaxed);
    }
  };

  auto run_search = [&](int t, int32_t* hist) {
    gc_searchers[t].fetch_add(1, std::memory_order_relaxed);
    solverTlNodeCount = 0;
    int val = task_is_ggc[t]
      ? dispatch_solve_weak<HasBook>(gc_pos[t], -beta, -alpha, book, book_depth, &gc_done[t], hist)
      : dispatch_solve_weak<HasBook>(gc_pos[t], alpha, beta, book, book_depth, &gc_done[t], hist);
    nodeCount.fetch_add(solverTlNodeCount, std::memory_order_relaxed);
    solverTlNodeCount = 0;
    gc_searchers[t].fetch_sub(1, std::memory_order_relaxed);
    handle_result(t, val);
  };

  auto worker = [&]() {
    int32_t local_history[MAX_W * (MAX_W + 1)];
    const int hist_len = w_val * (h_val + 1);
    while (!cutoff.load(std::memory_order_acquire) && !shouldAbort(abort_flag) &&
           groups_left.load(std::memory_order_acquire) > 0) {
      // 1) Fresh eligible task (unclaimed).
      int pick = -1;
      for (int t = 0; t < num_tasks; t++) {
        if (!gc_eligible[t].load(std::memory_order_relaxed)) continue;
        if (gc_done[t].load(std::memory_order_relaxed)) continue;
        if (gc_claimed[t].load(std::memory_order_relaxed)) continue;
        if (!gc_claimed[t].exchange(true, std::memory_order_acq_rel)) { pick = t; break; }
      }
      if (pick >= 0) { run_search(pick, nullptr); continue; }
      // 2) Speculative sibling: an unclaimed not-yet-eligible grandchild,
      //    at most one in flight per group. Useful iff its group survives
      //    (its first task fails high); wasted iff the group dies.
      for (int t = 0; t < num_tasks; t++) {
        if (gc_eligible[t].load(std::memory_order_relaxed)) continue;
        if (gc_done[t].load(std::memory_order_relaxed)) continue;
        if (gc_claimed[t].load(std::memory_order_relaxed)) continue;
        int g = gc_group[t];
        if (spec_claims[g].load(std::memory_order_relaxed) > 0) continue;
        if (!gc_claimed[t].exchange(true, std::memory_order_acq_rel)) {
          spec_claims[g].fetch_add(1, std::memory_order_relaxed);
          pick = t;
          break;
        }
      }
      if (pick >= 0) { run_search(pick, nullptr); continue; }
      // 3) Race the whole probe with perturbed history (legacy Lazy-SMP
      //    mechanism — it TT-hits all resolved subtrees, so it effectively
      //    works on whatever remains and can finish the probe alone), capped
      //    at two concurrent racers.
#if SOLVE_TAIL_RACERS
      if (racer_count.fetch_add(1, std::memory_order_relaxed) < 2) {
        int seq = helper_seq.fetch_add(1, std::memory_order_relaxed) + 1;
        for (int k = 0; k < hist_len; k++)
          local_history[k] = this->TROMP_WEIGHTS[k] + (seq * 7 + k * 3) % 5;
        run_racer(local_history);
        racer_count.fetch_sub(1, std::memory_order_relaxed);
        continue;
      }
      racer_count.fetch_sub(1, std::memory_order_relaxed);
#endif
      // 4) Budgets exhausted: idle briefly. An idle core costs nothing;
      //    another duplicate search costs everyone.
      std::this_thread::sleep_for(std::chrono::microseconds(100));
    }
  };

  for (int i = 0; i < worker_count - 1; i++) {
    pool->enqueue([&]() {
      worker();
      if (remaining.fetch_sub(1) == 1) prom.set_value();
    });
  }
  worker();

  while (worker_count > 1 && fut.wait_for(std::chrono::microseconds(200)) != std::future_status::ready) {
    if (shouldAbort(abort_flag)) {
      for (int j = 0; j < num_tasks; j++)
        gc_done[j].store(true, std::memory_order_relaxed);
      cutoff.store(true, std::memory_order_release);
    }
  }

  if (shouldAbort(abort_flag)) return alpha;  // caller re-checks and discards

  if (have_winner.load(std::memory_order_acquire)) {
    (void)winning_col; (void)is_reverse;
#ifndef NO_COLLECT_HOOKS
    if (collect_book)
      collect_book->narrow(P,
        (uint8_t)(winning_value - P.min_score() + 1),
        (uint8_t)(max - P.min_score() + 1));
#endif
    return winning_value;
  }

  if (parent_raced.load(std::memory_order_acquire)) {
    // A whole-probe racer finished first: its serial search already did the
    // TT store and collect hooks internally (it IS a plain negamax call).
    return raced_value;
  }

  int ub = best_seen.load(std::memory_order_relaxed);
#ifndef NO_COLLECT_HOOKS
  if (collect_book)
    collect_book->narrow(P,
      (uint8_t)(min - P.min_score() + 1),
      (uint8_t)(ub - P.min_score() + 1));
#endif
  return ub;
}

/**
 * Serial solve implementation. Can be called with an abort_flag for Lazy SMP
 * and an optional private history table for search diversity.
 */
template <int WIDTH, int HEIGHT, int ALIGN, bool WRAP, typename SlotType>
template <bool HasBook>
::GameSolver::Connect4::SolverResult SolverImpl<WIDTH, HEIGHT, ALIGN, WRAP, SlotType>::solve_single(const GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP> &P, bool weak, const OpeningBookBase<WIDTH, HEIGHT>* book, int book_depth, std::atomic<bool>* abort_flag, int32_t* thread_history, int threads) {
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
  // root-decompose the probe across the shared pool instead of walking the
  // whole tree on this one thread; threads == 1 keeps the exact existing
  // single-threaded behavior unchanged.
  auto probe = [&](int lo, int hi) {
    return threads > 1
      ? dispatch_solve_weak_parallel2<HasBook>(P, lo, hi, book, book_depth, threads, abort_flag)
      : dispatch_solve_weak<HasBook>(P, lo, hi, book, book_depth, abort_flag, thread_history);
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
          // High-score ladders: decomposed probes of expected-fail-high
          // windows do ~width^2 speculative task searches where the serial
          // search needs one refutation chain — measured 100x+ blowups at
          // 2-4 threads on 8x8 exact. Parallelize only the first steps
          // (covers the common small-score case); run long ladders serially
          // on the task-search-warmed TT.
          if ((i <= 2 ? probe(i, i + 1)
                      : dispatch_solve_weak<HasBook>(P, i, i + 1, book, book_depth, abort_flag, thread_history)) <= i) {
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
              int vr = threads > 1
                ? dispatch_solve_weak_parallel2<HasBook>(P2, -score, -score + 1, book, book_depth, threads, abort_flag)
                : dispatch_solve_weak<HasBook>(P2, -score, -score + 1, book, book_depth, abort_flag, thread_history);
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

  // --- Root-parallel null-window probes (see dispatch_solve_weak_parallel2) ---
  // One logical solve_single() call whose internal probes fan out across the
  // pool, instead of `threads` racing whole-position copies. The old Lazy-SMP
  // path below visits ~3x redundant nodes at 12 threads for ~1.2x wall-clock
  // speedup (measured); this path decomposes each probe at the root instead
  // of duplicating the whole search per thread.
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

  (void)threads;
  std::vector<int> scores(P.width(), -1000);

#ifdef USE_PTHREADS
  // Track which columns are still being solved (for straggler acceleration)
  auto col_done = std::make_unique<std::atomic<bool>[]>(P.width());
  auto col_abort = std::make_unique<std::atomic<bool>[]>(P.width());
  std::vector<GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>> col_positions(P.width(), GenericPosition<WIDTH, HEIGHT, ALIGN, WRAP>(P.width(), P.height()));
  std::vector<bool> col_valid(P.width());

  // Mirror-symmetric positions: mirrored columns are pure transpositions —
  // solve one of each pair, copy the score afterwards.
  const bool analyze_symmetric = P.mirror_key(P.key()) == P.key();

  for (int c = 0; c < P.width(); c++) {
    col_abort[c].store(false, std::memory_order_relaxed);
    if (P.canPlay(c)) {
      if (P.isWinningMove(c)) {
        scores[c] = ((P.width() * P.height()) + 1 - P.nbMoves()) / 2;
        col_done[c].store(true, std::memory_order_relaxed);
        col_valid[c] = false;
      } else if (analyze_symmetric && c > P.width() - 1 - c) {
        col_done[c].store(true, std::memory_order_relaxed);   // copied from mirror below
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

#ifndef ANALYZE_WIDTH_CLAMP
#define ANALYZE_WIDTH_CLAMP 1
#endif
  // Historically clamped to column count because wider fan-out didn't scale well in
  // testing (confirmed empirically: unclamped peaks ~4-8 threads then degrades —
  // threads beyond board width have no Phase-1 column of their own and immediately
  // duplicate-search the slowest column via Phase-2). Tunable, not a correctness
  // requirement; build with -DANALYZE_WIDTH_CLAMP=0 to test uncapped fan-out.
#if ANALYZE_WIDTH_CLAMP
  unsigned int num_threads = std::min((unsigned int)P.width(), (unsigned int)threads);
#else
  unsigned int num_threads = (unsigned int)threads;
#endif
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

  if (analyze_symmetric) {
    for (int c = 0; c < P.width(); c++) {
      int m = P.width() - 1 - c;
      if (c > m && P.canPlay(c) && !P.isWinningMove(c)) scores[c] = scores[m];
    }
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
