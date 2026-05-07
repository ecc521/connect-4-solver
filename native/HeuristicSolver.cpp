/*
 * This file is part of Connect4 Game Solver <http://connect4.gamesolver.org>
 * Copyright (C) 2017-2019 Pascal Pons <contact@gamesolver.org>
 */

#include "HeuristicSolver.hpp"
#include "Constants.hpp"
#include <algorithm>
#include <chrono>
#include <future>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

namespace GameSolver {
namespace Connect4 {

namespace {
  [[gnu::cold]] bool checkHeuristicTimeout(double end_time_ms) {
    if (end_time_ms > 0.0) {
      double now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count();
      if (now >= end_time_ms) return true;
    }
    return false;
  }
}

template <int WIDTH, int HEIGHT>
HeuristicSolver<WIDTH, HEIGHT>::HeuristicSolver(std::shared_ptr<TransTable> cache)
    : transTable(cache), nodeCount(0), pool(std::make_unique<ThreadPool>()) {
  for (int i = 0; i < WIDTH * (HEIGHT + 1); i++) {
    history[i] = GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS[i];
  }
}

template <int WIDTH, int HEIGHT>
int HeuristicSolver<WIDTH, HEIGHT>::negamax_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int alpha, int beta, int depth, double end_time_ms, NNUEAccumulator<WIDTH, HEIGHT>& acc, uint32_t& localCount) {
  if (P.canWinNext()) {
      return SCORE_FORCED_WIN_BASE + (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2;
  }

  auto moves = P.possibleNonLosingMoves();
  if (moves == 0) {
      if (P.nbMoves() == WIDTH * HEIGHT) return 0; // Board is full, it's a draw.
      return -SCORE_FORCED_WIN_BASE - (WIDTH * HEIGHT - P.nbMoves()) / 2;
  }

  if (depth <= 0 && (moves & (moves - 1)) != 0) {
    return NNUE<WIDTH, HEIGHT>::evaluate_accumulated(acc, P);
  }

  if (++localCount >= 16384) [[unlikely]] {
    this->nodeCount.fetch_add(localCount, std::memory_order_relaxed);
    localCount = 0;
    if (this->stopSearch.load(std::memory_order_relaxed)) [[unlikely]] return 40000;
    if (checkHeuristicTimeout(end_time_ms)) {
      this->stopSearch = true;
      return 40000;
    }
  }

  bool is_reverse = false;
  const auto key = P.symmetric_key(is_reverse);
  auto packed = this->transTable->getPacked(key);
  if (packed.flags != 0 && packed.work >= depth) {
    int16_t score = packed.value;
    if (packed.flags == 1) return score; // Exact
    if (packed.flags == 2 && score >= beta) return score; // Lower bound
    if (packed.flags == 3 && score <= alpha) return score; // Upper bound
  }

  // Forced move fast-path: only one legal move, skip TT write to avoid cache pollution.
  if ((moves & (moves - 1)) == 0) {
    if (localCount > 0) localCount--;
    GenericPosition<WIDTH, HEIGHT> P2(P);
    P2.play(moves);
    unsigned int bit_idx = GenericPosition<WIDTH, HEIGHT>::template ctz_impl<typename GenericPosition<WIDTH, HEIGHT>::position_t>(moves);
    int col = bit_idx / (HEIGHT + 1);
    int row = bit_idx % (HEIGHT + 1);
    int player = P.nbMoves() % 2;
    
    acc.addPiece(player, col, row);
    int score = -negamax_heuristic(P2, -beta, -alpha, depth - 1, end_time_ms, acc, localCount);
    acc.removePiece(player, col, row);
    return score;
  }

  struct Move {
    typename GenericPosition<WIDTH, HEIGHT>::position_t move;
    int score;
  };
  Move sorted_moves[WIDTH];
  int n_moves = 0;

  for (int i = 0; i < WIDTH; i++) {
    int col = GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i];
    auto m = moves & GenericPosition<WIDTH, HEIGHT>::column_mask(col);
    if (m) {
      sorted_moves[n_moves++] = {m, (int)history[col]};

      GenericPosition<WIDTH, HEIGHT> child(P);
      child.play(m);
      this->transTable->prefetch(child.symmetric_key());
    }
  }
  std::sort(sorted_moves, sorted_moves + n_moves, [](const Move &a, const Move &b) {
    return a.score > b.score;
  });

  int best_score = -40000;
  int best_seen_col = -1;
  uint8_t flags = 3; // Upper bound

  for (int i = 0; i < n_moves; i++) {
    GenericPosition<WIDTH, HEIGHT> P2(P);
    P2.play(sorted_moves[i].move);
    
    unsigned int bit_idx = GenericPosition<WIDTH, HEIGHT>::template ctz_impl<typename GenericPosition<WIDTH, HEIGHT>::position_t>(sorted_moves[i].move);
    int col = bit_idx / (HEIGHT + 1);
    int row = bit_idx % (HEIGHT + 1);
    int player = P.nbMoves() % 2;
    
    acc.addPiece(player, col, row);
    int score = -negamax_heuristic(P2, -beta, -alpha, depth - 1, end_time_ms, acc, localCount);
    acc.removePiece(player, col, row);
    if (score >= 40000 || score <= -40000) return 40000;

    if (score > best_score) {
      best_score = score;
      best_seen_col = GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i];
    }
    if (score > alpha) {
      alpha = score;
      flags = 1; // Potentially exact
    }
    if (alpha >= beta) {
      flags = 2; // Lower bound
      break;
    }
  }

  uint8_t stored_move = best_seen_col == -1 ? WIDTH : best_seen_col;
  if (stored_move < WIDTH && is_reverse) stored_move = WIDTH - 1 - stored_move;
  this->transTable->put(key, (int16_t)(best_score), (uint8_t)depth, stored_move, flags); 
  return best_score;
}

template <int WIDTH, int HEIGHT>
SolverResult HeuristicSolver<WIDTH, HEIGHT>::solve_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int max_depth, double end_time_ms, bool /*reset_tt*/, NNUEAccumulator<WIDTH, HEIGHT>* acc, int threads) {
#ifndef USE_PTHREADS
  threads = 1;
#endif
  if (this->isSearching.exchange(true, std::memory_order_acquire)) {
    throw std::runtime_error("Solver is busy: concurrent execution on the same instance is strictly prohibited.");
  }
  struct LockGuard {
    std::atomic<bool>& flag;
    ~LockGuard() { flag.store(false, std::memory_order_release); }
  } guard{this->isSearching};

  if(P.canWinNext()) {
    int score = SCORE_FORCED_WIN_BASE + (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2;
    for (int i = 0; i < WIDTH; i++) {
        if (P.canPlay(i) && P.isWinningMove(i)) return {score, i, (int)P.nbMoves(), getNodeCount()};
    }
    return {score, -1, (int)P.nbMoves(), getNodeCount()};
  }
  
  if (P.nbMoves() == WIDTH * HEIGHT) {
      return {0, -1, (int)P.nbMoves(), getNodeCount()};
  }
  
  if (this->book) {
      if (int val = this->book->get(P)) {
          int exact_score = val + GenericPosition<WIDTH, HEIGHT>::MIN_SCORE - 1;
          int heur_score = exact_score > 0 ? SCORE_FORCED_WIN_BASE + exact_score : -SCORE_FORCED_WIN_BASE + exact_score;
          if (exact_score == 0) heur_score = 0;
          return {heur_score, -1, (int)P.nbMoves(), getNodeCount(), this->stopSearch.load(std::memory_order_relaxed)};
      }
  }

  this->stopSearch = false;
  int best_score = 0;
  int best_move = -1;
  int depth_reached = 0;

  NNUEAccumulator<WIDTH, HEIGHT> root_acc;
  if (acc) {
    root_acc = *acc;
  } else {
    root_acc.init(P);
  }

  struct RootMove {
    int col;
    int score;
  };
  std::vector<RootMove> root_moves;
  for (int i = 0; i < WIDTH; i++) {
    int col = GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i];
    if (P.canPlay(col)) {
      root_moves.push_back({col, -40000});
    }
  }

  for (int d = 1; d <= max_depth; d++) {
    if (root_moves.empty()) break;
    // If our depth equals the moves remaining, the board is exhaustively searched.
    if (d > WIDTH * HEIGHT - P.nbMoves()) break;

    std::atomic<int> next_move_idx{0};
    std::mutex root_mutex;
    
    auto worker = [&]() {
      uint32_t localCount = 0;
      while (true) {
        int idx = next_move_idx.fetch_add(1, std::memory_order_relaxed);
        if (idx >= (int)root_moves.size()) break;
        if (this->stopSearch.load(std::memory_order_relaxed)) break;

        int col = root_moves[idx].col;
        int score = -40000;

        if (P.isWinningMove(col)) {
          score = SCORE_FORCED_WIN_BASE + (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2;
        } else {
          GenericPosition<WIDTH, HEIGHT> P2(P);
          P2.playCol(col);

          bool book_hit = false;
          if (this->book) {
            if (int val = this->book->get(P2)) {
              int exact_score = val + GenericPosition<WIDTH, HEIGHT>::MIN_SCORE - 1;
              int heur_score = exact_score > 0 ? SCORE_FORCED_WIN_BASE + exact_score : -SCORE_FORCED_WIN_BASE + exact_score;
              if (exact_score == 0) heur_score = 0;
              score = -heur_score;
              book_hit = true;
            }
          }

        if (!book_hit) {
            NNUEAccumulator<WIDTH, HEIGHT> local_acc = root_acc;
            typename GenericPosition<WIDTH, HEIGHT>::position_t move = (P.getMask() + P.bottom_mask_col(col)) & P.column_mask(col);
            unsigned int bit_idx = GenericPosition<WIDTH, HEIGHT>::template ctz_impl<typename GenericPosition<WIDTH, HEIGHT>::position_t>(move);
            local_acc.addPiece(P.nbMoves() % 2, col, bit_idx % (HEIGHT + 1));
            score = -negamax_heuristic(P2, -SCORE_INFINITY, SCORE_INFINITY, d - 1, end_time_ms, local_acc, localCount);
        }
        }
        
        {
          std::lock_guard<std::mutex> lock(root_mutex);
          root_moves[idx].score = score;
        }
      }
      this->nodeCount.fetch_add(localCount, std::memory_order_relaxed);
    };

    if (threads <= 1 || root_moves.size() <= 1) {
      worker();
    } else {
      int num_threads = std::min((int)threads, (int)root_moves.size());
      this->pool->ensureCapacity(num_threads - 1);
      std::atomic<int> remaining(num_threads - 1);
      std::promise<void> prom;
      auto fut = prom.get_future();
      for (int i = 0; i < num_threads - 1; i++) {
        this->pool->enqueue([&]() {
          worker();
          if (remaining.fetch_sub(1, std::memory_order_seq_cst) == 1) {
            prom.set_value();
          }
        });
      }
      worker();
      fut.wait();
    }

    if (this->stopSearch.load(std::memory_order_relaxed) && d > 1) break;

    // Iterative move ordering: sort by this depth's scores for better TT warmth at d+1
    std::sort(root_moves.begin(), root_moves.end(), [](const RootMove& a, const RootMove& b) {
      return a.score > b.score;
    });

    int current_best_score = root_moves.front().score;
    int current_best_move = root_moves.front().col;

    if (current_best_move != -1) {
      best_score = current_best_score;
      best_move = current_best_move;
      depth_reached = d;
      bool is_reverse = false;
      auto key = P.symmetric_key(is_reverse);
      uint8_t stored_move = best_move;
      if (stored_move < WIDTH && is_reverse) stored_move = WIDTH - 1 - stored_move;
      // Store best result in TT for next iteration's move ordering
      this->transTable->put(key, (int16_t)best_score, (uint8_t)d, stored_move, 1);
    }

    if (best_score >= SCORE_FORCED_WIN_BASE || best_score <= -SCORE_FORCED_WIN_BASE) break;
  }

  return {best_score, best_move, depth_reached, getNodeCount(), this->stopSearch.load(std::memory_order_relaxed)};
}

template <int WIDTH, int HEIGHT>
std::pair<std::vector<int>, int> HeuristicSolver<WIDTH, HEIGHT>::analyze_heuristic(const GenericPosition<WIDTH, HEIGHT> &P, int max_depth, int threads, double end_time_ms) {
#ifndef USE_PTHREADS
  threads = 1;
#endif
  if (this->isSearching.exchange(true, std::memory_order_acquire)) {
    throw std::runtime_error("Solver is busy: concurrent execution on the same instance is strictly prohibited.");
  }
  struct LockGuard {
    std::atomic<bool>& flag;
    ~LockGuard() { flag.store(false, std::memory_order_release); }
  } guard{this->isSearching};
  std::vector<int> scores(WIDTH, -40000);
  int final_depth_reached = 0;
  this->stopSearch = false;

  NNUEAccumulator<WIDTH, HEIGHT> root_acc;
  root_acc.init(P);

  int total_valid_cols = 0;
  for (int i = 0; i < WIDTH; i++) if (P.canPlay(i)) total_valid_cols++;
  if (total_valid_cols == 0) return {scores, 0};

  for (int d = 1; d <= max_depth; d++) {
    // If our depth equals the moves remaining, the board is exhaustively searched.
    if (d > WIDTH * HEIGHT - P.nbMoves()) break;
    std::vector<int> current_scores = scores;
    std::atomic<int> next_col{0};

#ifdef USE_PTHREADS
    auto worker = [&]() {
      uint32_t localCount = 0;
      while (true) {
        int i = next_col.fetch_add(1, std::memory_order_relaxed);
        if (i >= WIDTH) break;
        if (this->stopSearch.load(std::memory_order_relaxed)) break;

        int col = GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i];
        if (P.canPlay(col)) {
          if (P.isWinningMove(col)) {
            current_scores[col] = SCORE_FORCED_WIN_BASE + (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2;
          } else {
            GenericPosition<WIDTH, HEIGHT> P2(P);
            P2.playCol(col);

            bool book_hit = false;
            if (this->book) {
                if (int val = this->book->get(P2)) {
                    int exact_score = val + GenericPosition<WIDTH, HEIGHT>::MIN_SCORE - 1;
                    int heur_score = exact_score > 0 ? SCORE_FORCED_WIN_BASE + exact_score : -SCORE_FORCED_WIN_BASE + exact_score;
                    if (exact_score == 0) heur_score = 0;
                    current_scores[col] = -heur_score;
                    book_hit = true;
                }
            }

            if (!book_hit) {
                NNUEAccumulator<WIDTH, HEIGHT> local_acc = root_acc;
                typename GenericPosition<WIDTH, HEIGHT>::position_t move = (P.getMask() + P.bottom_mask_col(col)) & P.column_mask(col);
                unsigned int bit_idx = GenericPosition<WIDTH, HEIGHT>::template ctz_impl<typename GenericPosition<WIDTH, HEIGHT>::position_t>(move);
                local_acc.addPiece(P.nbMoves() % 2, col, bit_idx % (HEIGHT + 1));
                int score = -negamax_heuristic(P2, -SCORE_INFINITY, SCORE_INFINITY, d - 1, end_time_ms, local_acc, localCount);
                if (score >= 40000 || score <= -40000) break;
                current_scores[col] = score;
            }
          }
        }
      }
      this->nodeCount.fetch_add(localCount, std::memory_order_relaxed);
    };

    unsigned int num_threads = std::min((unsigned int)WIDTH, (unsigned int)threads);
    if (num_threads <= 1) {
      worker();
    } else {
      this->pool->ensureCapacity(num_threads - 1);
      std::atomic<int> remaining(num_threads - 1);
      std::promise<void> prom;
      auto fut = prom.get_future();
      for (unsigned int i = 0; i < num_threads - 1; i++) {
        this->pool->enqueue([&]() {
          worker();
          if (remaining.fetch_sub(1, std::memory_order_seq_cst) == 1) {
            prom.set_value();
          }
        });
      }
      worker();
      fut.wait();
    }
#else
    uint32_t localCount = 0;
    for (int i = 0; i < WIDTH; i++) {
        int col = GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i];
        if (P.canPlay(col)) {
            if(P.isWinningMove(col)) current_scores[col] = SCORE_FORCED_WIN_BASE + (WIDTH * HEIGHT + 1 - P.nbMoves()) / 2;
            else {
                GenericPosition<WIDTH, HEIGHT> P2(P);
                P2.playCol(col);

                bool book_hit = false;
                if (this->book) {
                    if (int val = this->book->get(P2)) {
                        int exact_score = val + GenericPosition<WIDTH, HEIGHT>::MIN_SCORE - 1;
                        int heur_score = exact_score > 0 ? SCORE_FORCED_WIN_BASE + exact_score : -SCORE_FORCED_WIN_BASE + exact_score;
                        if (exact_score == 0) heur_score = 0;
                        current_scores[col] = -heur_score;
                        book_hit = true;
                    }
                }

                if (!book_hit) {
                    NNUEAccumulator<WIDTH, HEIGHT> local_acc = root_acc;
                    typename GenericPosition<WIDTH, HEIGHT>::position_t move = (P.getMask() + P.bottom_mask_col(col)) & P.column_mask(col);
                    unsigned int bit_idx = GenericPosition<WIDTH, HEIGHT>::template ctz_impl<typename GenericPosition<WIDTH, HEIGHT>::position_t>(move);
                    local_acc.addPiece(P.nbMoves() % 2, col, bit_idx % (HEIGHT + 1));
                    int score = -negamax_heuristic(P2, -SCORE_INFINITY, SCORE_INFINITY, d - 1, end_time_ms, local_acc, localCount);
                    if (score >= 40000 || score <= -40000) break;
                    current_scores[col] = score;
                }
            }
        }
    }
    this->nodeCount.fetch_add(localCount, std::memory_order_relaxed);
#endif

    if (this->stopSearch.load(std::memory_order_relaxed) && d > 1) break;
    scores = current_scores;
    final_depth_reached = d;
    
    bool all_terminal = true;
    for (int i = 0; i < WIDTH; i++) {
      if (P.canPlay(i) && current_scores[i] < SCORE_FORCED_WIN_BASE && current_scores[i] > -SCORE_FORCED_WIN_BASE) all_terminal = false;
    }
    if (all_terminal) break;
  }

  return {scores, final_depth_reached};
}


template <int WIDTH, int HEIGHT>
::GameSolver::Connect4::SolverResult HeuristicSolver<WIDTH, HEIGHT>::solve(const GenericPosition<WIDTH, HEIGHT> &P, bool /*weak*/, int threads, const OpeningBookBase<WIDTH, HEIGHT>* book, double timeout_ms) {
  if (book) loadBook(book);
  return solve_heuristic(P, 100, timeout_ms, true, nullptr, threads);
}

template <int WIDTH, int HEIGHT>
std::vector<int> HeuristicSolver<WIDTH, HEIGHT>::analyze(const GenericPosition<WIDTH, HEIGHT> &P, bool /*weak*/, int threads, const OpeningBookBase<WIDTH, HEIGHT>* book, double timeout_ms) {
  if (book) loadBook(book);
  return analyze_heuristic(P, 100, threads, timeout_ms).first;
}

} // namespace Connect4
} // namespace GameSolver
