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

#ifndef POSITION_HPP
#define POSITION_HPP

#include <string>
#include <iostream>
#include <cstdint>
#include <cassert>
#include <array>

namespace GameSolver {
namespace Connect4 {
/**
 * A class storing a Connect 4 position.
 * Functions are relative to the current player to play.
 * Position containing alignment are not supported by this class.
 *
 * A binary bitboard representation is used.
 * Each column is encoded on HEIGHT+1 bits.
 *
 * Example of bit order to encode for a 7x6 board
 * .  .  .  .  .  .  .
 * 5 12 19 26 33 40 47
 * 4 11 18 25 32 39 46
 * 3 10 17 24 31 38 45
 * 2  9 16 23 30 37 44
 * 1  8 15 22 29 36 43
 * 0  7 14 21 28 35 42
 *
 * Position is stored as
 * - a bitboard "mask" with 1 on any color stones
 * - a bitboard "current_player" with 1 on stones of current player
 *
 * "current_player" bitboard can be transformed into a compact and non ambiguous key
 * by adding an extra bit on top of the last non empty cell of each column.
 * This allow to identify all the empty cells without needing "mask" bitboard
 *
 * current_player "x" = 1, opponent "o" = 0
 * board     position  mask      key       bottom
 *           0000000   0000000   0000000   0000000
 * .......   0000000   0000000   0001000   0000000
 * ...o...   0000000   0001000   0010000   0000000
 * ..xx...   0011000   0011000   0011000   0000000
 * ..ox...   0001000   0011000   0001100   0000000
 * ..oox..   0000100   0011100   0000110   0000000
 * ..oxxo.   0001100   0011110   1101101   1111111
 *
 * current_player "o" = 1, opponent "x" = 0
 * board     position  mask      key       bottom
 *           0000000   0000000   0001000   0000000
 * ...x...   0000000   0001000   0000000   0000000
 * ...o...   0001000   0001000   0011000   0000000
 * ..xx...   0000000   0011000   0000000   0000000
 * ..ox...   0010000   0011000   0010100   0000000
 * ..oox..   0011000   0011100   0011010   0000000
 * ..oxxo.   0010010   0011110   1110011   1111111
 *
 * key is an unique representation of a board key = position + mask + bottom
 * in practice, as bottom is constant, key = position + mask is also a
 * non-ambigous representation of the position.
 */

#if defined(__EMSCRIPTEN__)
struct wasm_uint128_t {
    uint64_t low;
    uint64_t high;

    constexpr wasm_uint128_t() : low(0), high(0) {}
    template <typename T, typename std::enable_if<std::is_integral<T>::value && sizeof(T) <= 8, int>::type = 0>
    constexpr wasm_uint128_t(T l) : low(l), high(0) {}
    constexpr wasm_uint128_t(uint64_t l, uint64_t h) : low(l), high(h) {}
    explicit constexpr wasm_uint128_t(unsigned __int128 v) : low((uint64_t)v), high((uint64_t)(v >> 64)) {}

    explicit constexpr operator uint64_t() const { return low; }
    explicit constexpr operator unsigned __int128() const { return ((unsigned __int128)high << 64) | low; }
    
    template<typename T, typename std::enable_if<std::is_integral<T>::value, int>::type = 0>
    explicit constexpr operator T() const { return static_cast<T>(low); }

    explicit constexpr operator bool() const { return low || high; }

    constexpr wasm_uint128_t operator&(const wasm_uint128_t& o) const { return {low & o.low, high & o.high}; }
    constexpr wasm_uint128_t operator|(const wasm_uint128_t& o) const { return {low | o.low, high | o.high}; }
    constexpr wasm_uint128_t operator^(const wasm_uint128_t& o) const { return {low ^ o.low, high ^ o.high}; }

    constexpr uint64_t operator%(uint64_t rhs) const { 
        if (high == 0) return low % rhs;
        // In this solver we only mod by primes or bucket sizes that fit in 64-bit,
        // and usually we only care about the lower 64 bits for transposition keys.
        // But for correctness if high != 0, since we avoid compiler-rt __int128, 
        // we'll just fall back to it for %.
        return (uint64_t)(((unsigned __int128)*this) % rhs);
    }
    constexpr wasm_uint128_t operator~() const { return {~low, ~high}; }

    constexpr wasm_uint128_t& operator&=(const wasm_uint128_t& o) { low &= o.low; high &= o.high; return *this; }
    constexpr wasm_uint128_t& operator|=(const wasm_uint128_t& o) { low |= o.low; high |= o.high; return *this; }
    constexpr wasm_uint128_t& operator^=(const wasm_uint128_t& o) { low ^= o.low; high ^= o.high; return *this; }

    constexpr wasm_uint128_t operator<<(int shift) const {
        if (shift == 0) return *this;
        if (shift < 64) return {low << shift, (high << shift) | (low >> (64 - shift))};
        return {0, low << (shift - 64)};
    }
    constexpr wasm_uint128_t operator>>(int shift) const {
        if (shift == 0) return *this;
        if (shift < 64) return {(low >> shift) | (high << (64 - shift)), high >> shift};
        return {high >> (shift - 64), 0};
    }
    constexpr wasm_uint128_t& operator<<=(int shift) { *this = *this << shift; return *this; }
    constexpr wasm_uint128_t& operator>>=(int shift) { *this = *this >> shift; return *this; }

    constexpr wasm_uint128_t operator+(const wasm_uint128_t& o) const {
        uint64_t l = low + o.low;
        return {l, high + o.high + (l < low)};
    }
    constexpr wasm_uint128_t operator-(const wasm_uint128_t& o) const {
        uint64_t l = low - o.low;
        return {l, high - o.high - (low < o.low)};
    }
    constexpr wasm_uint128_t operator+(uint64_t v) const { return *this + wasm_uint128_t(v); }
    constexpr wasm_uint128_t operator-(uint64_t v) const { return *this - wasm_uint128_t(v); }

    constexpr wasm_uint128_t& operator+=(const wasm_uint128_t& o) { *this = *this + o; return *this; }
    constexpr wasm_uint128_t& operator-=(const wasm_uint128_t& o) { *this = *this - o; return *this; }

    constexpr wasm_uint128_t operator*(uint64_t v) const {
        // Fast multiply for small constants like 3
        if (v == 3) {
            return *this + (*this << 1);
        }
        return wasm_uint128_t( (unsigned __int128)(*this) * v );
    }
    
    constexpr wasm_uint128_t operator*(const wasm_uint128_t& o) const {
        return wasm_uint128_t( (unsigned __int128)(*this) * (unsigned __int128)(o) );
    }
    constexpr wasm_uint128_t& operator*=(uint64_t v) { *this = *this * v; return *this; }

    constexpr wasm_uint128_t operator/(uint64_t v) const {
        return wasm_uint128_t( (unsigned __int128)(*this) / v );
    }

    constexpr bool operator==(const wasm_uint128_t& o) const { return low == o.low && high == o.high; }
    constexpr bool operator!=(const wasm_uint128_t& o) const { return !(*this == o); }
    constexpr bool operator<(const wasm_uint128_t& o) const { return high < o.high || (high == o.high && low < o.low); }
    constexpr bool operator<=(const wasm_uint128_t& o) const { return high < o.high || (high == o.high && low <= o.low); }
    constexpr bool operator>(const wasm_uint128_t& o) const { return !(*this <= o); }
    constexpr bool operator>=(const wasm_uint128_t& o) const { return !(*this < o); }
};
#endif

template <int W, int H, int ALIGN = 4, bool WRAP = false>
class GenericPosition {
 public:

  // Board size is 64bits or 128 bits depending on W and H
#if defined(__EMSCRIPTEN__)
  using position_t = typename std::conditional<W == -1, wasm_uint128_t, typename std::conditional < W * (H + 1) <= 64, uint64_t, wasm_uint128_t>::type>::type;
#else
  using position_t = typename std::conditional<W == -1, unsigned __int128, typename std::conditional < W * (H + 1) <= 64, uint64_t, unsigned __int128>::type>::type;
#endif

  static constexpr int ALIGN_N = ALIGN;
  static constexpr bool IS_WRAP = WRAP;

  uint8_t dynamic_w = 0;
  uint8_t dynamic_h = 0;

  constexpr int width() const { return W == -1 ? dynamic_w : W; }
  constexpr int height() const { return W == -1 ? dynamic_h : H; }

  static constexpr int WIDTH_MACRO = W;
  static constexpr int HEIGHT_MACRO = H;

  constexpr int min_score() const { return -(width() * height() + 1) / 2; }
  constexpr int max_score() const { return (width() * height() + 1) / 2; }

  // Static arrays like TROMP_WEIGHTS and CENTER_MASKS are now dynamically instantiated in the Solver

  static_assert(W <= 16, "Board's width must be <= 16 due to alphanumeric parsing limits");
  static_assert(W * (H + 1) <= sizeof(position_t)*8, "Board does not fit into position_t bitmask");

  void play(position_t move) {
    current_position ^= mask;
    mask |= move;
    moves++;
  }

  unsigned int play(const std::string &seq) {
    for(unsigned int i = 0; i < seq.size(); i++) {
      int col = seq[i] - '1';
      if (seq[i] >= 'a' && seq[i] <= 'z') col = seq[i] - 'a' + 9;
      else if (seq[i] >= 'A' && seq[i] <= 'Z') col = seq[i] - 'A' + 9;
      if(col < 0 || col >= width() || !canPlay(col) || isWinningMove(col)) return i;
      playCol(col);
    }
    return seq.size();
  }

  // ─── Wrap helpers (no-ops when WRAP=false) ─────────────────────────────
  static constexpr int W_SHIFT = (W == -1 ? 0 : W * (H + 1));

  static position_t wrap_left(position_t pos, int s) {
      if constexpr (WRAP && W != -1) return (pos << s) | (pos >> (W_SHIFT - s));
      else return pos << s;
  }

  static position_t wrap_right(position_t pos, int s) {
      if constexpr (WRAP && W != -1) return (pos >> s) | (pos << (W_SHIFT - s));
      else return pos >> s;
  }

  bool canWinNext() const {
    return (bool)(winning_position() & possible());
  }

  int nbMoves() const {
    return moves;
  }

  position_t key() const {
    return current_position + mask;
  }

  template <int W_CONST, int H_CONST>
  position_t mirror_key_impl(position_t k) const {
      position_t res = 0;
      for (int i = 0; i < W_CONST; i++) {
          position_t col_mask = ((position_t(1) << (H_CONST + 1)) - 1) << (i * (H_CONST + 1));
          int target_i = W_CONST - 1 - i;
          if (target_i > i) {
              res |= (k & col_mask) << ((target_i - i) * (H_CONST + 1));
          } else if (target_i < i) {
              res |= (k & col_mask) >> ((i - target_i) * (H_CONST + 1));
          } else {
              res |= (k & col_mask);
          }
      }
      return res;
  }

  position_t mirror_key(position_t k) const {
      if constexpr (W != -1) {
          return mirror_key_impl<W, H>(k);
      } else {
          if (width() == 7 && height() == 6) return mirror_key_impl<7, 6>(k);
          if (width() == 8 && height() == 6) return mirror_key_impl<8, 6>(k);
          if (width() == 8 && height() == 8) return mirror_key_impl<8, 8>(k);
          
          position_t res = 0;
          for (int i = 0; i < width(); i++) {
              position_t col_mask = ((position_t(1) << (height() + 1)) - 1) << (i * (height() + 1));
              int target_i = width() - 1 - i;
              if (target_i > i) {
                  res |= (k & col_mask) << ((target_i - i) * (height() + 1));
              } else if (target_i < i) {
                  res |= (k & col_mask) >> ((i - target_i) * (height() + 1));
              } else {
                  res |= (k & col_mask);
              }
          }
          return res;
      }
  }

  position_t symmetric_key(bool &is_reverse) const {
      position_t base_k = key();
      if constexpr (WRAP && W != -1) {
          // Wraparound: consider all W cyclic rotations × mirror
          position_t best_key = ~position_t(0);
          bool best_reverse = false;
          int w_bits = W * (H + 1);
          position_t wrap_mask = (position_t(1) << w_bits) - 1;
          for (int c = 0; c < W; c++) {
              position_t k_shift = base_k;
              if (c > 0) {
                  int shift_bits = c * (H + 1);
                  k_shift = ((base_k << shift_bits) | (base_k >> (w_bits - shift_bits))) & wrap_mask;
              }
              position_t k_rev = mirror_key(k_shift);
              if (k_shift < best_key) { best_key = k_shift; best_reverse = false; }
              if (k_rev   < best_key) { best_key = k_rev;   best_reverse = true;  }
          }
          is_reverse = best_reverse;
          return best_key;
      } else {
          position_t k_forward = base_k;
          position_t k_reverse = mirror_key(k_forward);
          if (k_forward < k_reverse) {
              is_reverse = false;
              return k_forward;
          } else {
              is_reverse = true;
              return k_reverse;
          }
      }
  }

  position_t symmetric_key() const {
      bool dummy;
      return symmetric_key(dummy);
  }

  position_t key3(bool &is_reverse) const {
    if constexpr (WRAP && W != -1) {
        // Wraparound: find canonical form across all W rotations × mirror
        position_t base_k = key();
        int w_bits = W * (H + 1);
        position_t wrap_mask = (position_t(1) << w_bits) - 1;
        position_t best_k3 = ~position_t(0);
        bool best_reverse = false;
        int best_c = 0;
        for (int c = 0; c < W; c++) {
            position_t k_shift = base_k;
            if (c > 0) {
                int shift_bits = c * (H + 1);
                k_shift = ((base_k << shift_bits) | (base_k >> (w_bits - shift_bits))) & wrap_mask;
            }
            position_t k_rev = mirror_key(k_shift);
            // Compute k3 for forward rotation
            GenericPosition tmp_f = *this;
            if (c > 0) {
                int shift_bits = c * (H + 1);
                tmp_f.current_position = ((current_position << shift_bits) | (current_position >> (w_bits - shift_bits))) & wrap_mask;
                tmp_f.mask = ((mask << shift_bits) | (mask >> (w_bits - shift_bits))) & wrap_mask;
            }
            position_t fwd = 0;
            for (int i = 0; i < W; i++) tmp_f.partialKey3(fwd, i);
            fwd /= 3;
            position_t rev = 0;
            for (int i = W; i--;) tmp_f.partialKey3(rev, i);
            rev /= 3;
            if (fwd < best_k3) { best_k3 = fwd; best_c = c; best_reverse = false; }
            if (rev < best_k3) { best_k3 = rev; best_c = c; best_reverse = true; }
        }
        (void)best_c;
        is_reverse = best_reverse;
        return best_k3;
    } else {
        position_t key_forward = 0;
        for(int i = 0; i < width(); i++) partialKey3(key_forward, i);

        position_t key_reverse = 0;
        for(int i = width(); i--;) partialKey3(key_reverse, i);

        if (key_forward < key_reverse) {
            is_reverse = false;
            return key_forward / 3;
        } else {
            is_reverse = true;
            return key_reverse / 3;
        }
    }
  }

  position_t key3() const {
      bool is_reverse;
      return key3(is_reverse);
  }

  position_t possibleNonLosingMoves() const {
    assert(!canWinNext());
    position_t possible_mask = possible();
    position_t opponent_win = opponent_winning_position();
    position_t forced_moves = possible_mask & opponent_win;
    if(forced_moves) {
      if(forced_moves & (forced_moves - 1)) return 0;
      else possible_mask = forced_moves;
    }
    return possible_mask & ~(opponent_win >> 1);
  }

  int moveScore(position_t move) const {
    return popcount_impl(compute_winning_position(current_position | move, mask));
  }

  template <typename CenterMasksT, typename CenterWeightsT>
  int heuristic_evaluate(const CenterMasksT& center_masks, const CenterWeightsT& center_weights, int double_threat_weight = 10, int uncontested_parity_weight = 57, int tempo_weight = 76, int center_multiplier = 5, int base_threat_weight = 23) const {
    int score = 0;
    position_t opp_position = current_position ^ mask;
    position_t my_threats = compute_winning_position(current_position, mask);
    position_t opp_threats = compute_winning_position(opp_position, mask);
    position_t playable = possible();
    position_t double_edged = (playable << 1) & get_board_mask();

    score += popcount(my_threats & double_edged) * double_threat_weight;
    score -= popcount(opp_threats & double_edged) * double_threat_weight;

    position_t opp_threats_above = (opp_threats << 1) & get_board_mask();
    opp_threats_above |= (opp_threats_above << 1) & get_board_mask();
    opp_threats_above |= (opp_threats_above << 2) & get_board_mask();
    opp_threats_above |= (opp_threats_above << 4) & get_board_mask();
    if (height() >= 8) opp_threats_above |= (opp_threats_above << 8) & get_board_mask();

    position_t my_threats_above = (my_threats << 1) & get_board_mask();
    my_threats_above |= (my_threats_above << 1) & get_board_mask();
    my_threats_above |= (my_threats_above << 2) & get_board_mask();
    my_threats_above |= (my_threats_above << 4) & get_board_mask();
    if (height() >= 8) my_threats_above |= (my_threats_above << 8) & get_board_mask();

    position_t my_useless_threats = my_threats & opp_threats_above;
    position_t opp_useless_threats = opp_threats & my_threats_above;

    position_t even_rows = 0;
    for (int r = 0; r < height(); r += 2) {
        even_rows |= (get_bottom_mask() << r);
    }
    position_t odd_rows = (even_rows << 1) & get_board_mask();
    
    position_t my_parity = (moves % 2 == 0) ? even_rows : odd_rows;
    position_t opp_parity = (moves % 2 == 0) ? odd_rows : even_rows;

    position_t lowest_my_threats = my_threats & ~my_threats_above;
    position_t lowest_opp_threats = opp_threats & ~opp_threats_above;

    position_t my_uncontested_parity = (lowest_my_threats & my_parity) & ~my_useless_threats;
    position_t opp_uncontested_parity = (lowest_opp_threats & opp_parity) & ~opp_useless_threats;

    score += popcount(my_uncontested_parity) * uncontested_parity_weight;
    score -= popcount(opp_uncontested_parity) * uncontested_parity_weight;
    
    position_t all_threats = my_threats | opp_threats;
    position_t empty_squares = get_board_mask() ^ (current_position | opp_position);

    position_t all_threats_above = all_threats;
    all_threats_above |= (all_threats_above << 1) & get_board_mask();
    all_threats_above |= (all_threats_above << 2) & get_board_mask();
    all_threats_above |= (all_threats_above << 4) & get_board_mask();
    if (height() >= 8) all_threats_above |= (all_threats_above << 8) & get_board_mask();

    int safe_squares = popcount(empty_squares & ~all_threats_above);
    
    score += ((safe_squares % 2) != (moves % 2) ? tempo_weight : -tempo_weight);
    
    score += (popcount(lowest_my_threats & ~my_useless_threats) - popcount(lowest_opp_threats & ~opp_useless_threats)) * base_threat_weight;
    
    for(int i = 0; i < width(); i++) {
      score += (popcount(current_position & center_masks[i]) - popcount(opp_position & center_masks[i])) * center_weights[i] * center_multiplier;
    }
    
    return score;
  }

  GenericPosition(uint8_t w = W == -1 ? 7 : W, uint8_t h = W == -1 ? 6 : H) : dynamic_w(w), dynamic_h(h), current_position{0}, mask{0}, moves{0} {}

  template <int OW, int OH, int OA = 4, bool OWR = false>
  GenericPosition(const GenericPosition<OW, OH, OA, OWR>& o) : dynamic_w(o.width()), dynamic_h(o.height()), current_position(static_cast<position_t>(o.getCurrentPosition())), mask(static_cast<position_t>(o.getMask())), moves(o.nbMoves()) {}

  bool canPlay(int col) const {
    return (mask & top_mask_col(col)) == 0;
  }

  void playCol(int col) {
    play((mask + bottom_mask_col(col)) & column_mask(col));
  }

  bool isWinningMove(int col) const {
    return (bool)(winning_position() & possible() & column_mask(col));
  }

  static GenericPosition fromKey(position_t key, uint8_t w = W == -1 ? 7 : W, uint8_t h = W == -1 ? 6 : H) {
    GenericPosition P(w, h);
    P.current_position = 0;
    P.mask = 0;
    P.moves = 0;
    for (int col = 0; col < P.width(); col++) {
      position_t col_shift = col * (P.height() + 1);
      position_t col_mask = (position_t(1) << (P.height() + 1)) - 1;
      position_t k_col = (key >> col_shift) & col_mask;
      
      if (k_col == 0) continue;
      
      
      int msb = 0;
      for(int i = P.height(); i >= 0; i--) if(k_col & (position_t(1) << i)) { msb = i; break; }
      
      position_t pos_col = k_col - (position_t(1) << msb);
      position_t m_col = (position_t(1) << msb) - 1;
      
      P.current_position |= (pos_col << col_shift);
      P.mask |= (m_col << col_shift);
      P.moves += msb;
    }
    return P;
  }

  position_t getCurrentPosition() const { return current_position; }
  position_t getMask() const { return mask; }

 private:
  position_t current_position;
  position_t mask;
  unsigned int moves;

public:
  void printBoard() const {
      for (int r = height() - 1; r >= 0; r--) {
          for (int c = 0; c < width(); c++) {
              position_t bit = position_t(1) << (c * (height() + 1) + r);
              if (mask & bit) {
                  if (current_position & bit) std::cout << "O ";
                  else std::cout << "X ";
              } else {
                  std::cout << ". ";
              }
          }
          std::cout << "\n";
      }
      std::cout << "\n";
  }
private:

  void partialKey3(position_t &key, int col) const {
    for(position_t pos = position_t(1) << (col * (height() + 1)); pos & mask; pos <<= 1) {
      key *= 3;
      if(pos & current_position) key += 1;
      else key += 2;
    }
    key *= 3;
  }

 public:
  inline __attribute__((always_inline)) position_t opponent_winning_position() const {
    return compute_winning_position(current_position ^ mask, mask);
  }

  inline __attribute__((always_inline)) position_t winning_position() const {
    return compute_winning_position(current_position, mask);
  }

  inline __attribute__((always_inline)) position_t possible() const {
    return (mask + get_bottom_mask()) & get_board_mask();
  }

  template <typename T>
  static typename std::enable_if<sizeof(T) <= 8, unsigned int>::type popcount_impl(T m) {
    return __builtin_popcountll((uint64_t)m);
  }

  template <typename T>
  static typename std::enable_if<(sizeof(T) > 8), unsigned int>::type popcount_impl(T m) {
    uint64_t low = (uint64_t)m;
    uint64_t high = (uint64_t)(m >> 64);
    return __builtin_popcountll(low) + __builtin_popcountll(high);
  }

  static unsigned int popcount(position_t m) {
    return popcount_impl<position_t>(m);
  }

  template <typename T>
  static typename std::enable_if<sizeof(T) <= 8, unsigned int>::type ctz_impl(T m) {
    return __builtin_ctzll((uint64_t)m);
  }

  template <typename T>
  static typename std::enable_if<(sizeof(T) > 8), unsigned int>::type ctz_impl(T m) {
    uint64_t low = (uint64_t)m;
    if (low) return __builtin_ctzll(low);
    return 64 + __builtin_ctzll((uint64_t)(m >> 64));
  }

  unsigned int getCol(position_t m) const {
    return ctz_impl<position_t>(m) / (height() + 1);
  }

  template <int W_CONST, int H_CONST>
  struct PositionConstants {
      static constexpr position_t bottom_mask() {
          position_t res = 0;
          for (int i = 0; i < W_CONST; i++) res |= position_t(1) << (i * (H_CONST + 1));
          return res;
      }
      static constexpr position_t board_mask() {
          return bottom_mask() * ((position_t(1) << H_CONST) - 1);
      }
      static constexpr position_t top() {
          return bottom_mask() << H_CONST;
      }
      static constexpr position_t alt_col() {
          position_t res = 0;
          for (int i = 0; i < H_CONST; i += 2) res |= (position_t(1) << i);
          return res;
      }
      static constexpr position_t altx() {
          return (bottom_mask() * alt_col()) << 1;
      }
  };

  template <int W_CONST, int H_CONST>
  inline __attribute__((always_inline)) position_t compute_winning_position_impl(position_t position, position_t mask) const {
    if constexpr (ALIGN == 4) {
      position_t r = (position << 1) & (position << 2) & (position << 3);
      position_t p = wrap_left(position, H_CONST + 1) & wrap_left(position, 2 * (H_CONST + 1));
      r |= p & wrap_left(position, 3 * (H_CONST + 1));
      r |= p & wrap_right(position, H_CONST + 1);
      p = wrap_right(position, H_CONST + 1) & wrap_right(position, 2 * (H_CONST + 1));
      r |= p & wrap_left(position, H_CONST + 1);
      r |= p & wrap_right(position, 3 * (H_CONST + 1));
      p = wrap_left(position, H_CONST) & wrap_left(position, 2 * H_CONST);
      r |= p & wrap_left(position, 3 * H_CONST);
      r |= p & wrap_right(position, H_CONST);
      p = wrap_right(position, H_CONST) & wrap_right(position, 2 * H_CONST);
      r |= p & wrap_left(position, H_CONST);
      r |= p & wrap_right(position, 3 * H_CONST);
      p = wrap_left(position, H_CONST + 2) & wrap_left(position, 2 * (H_CONST + 2));
      r |= p & wrap_left(position, 3 * (H_CONST + 2));
      r |= p & wrap_right(position, H_CONST + 2);
      p = wrap_right(position, H_CONST + 2) & wrap_right(position, 2 * (H_CONST + 2));
      r |= p & wrap_left(position, H_CONST + 2);
      r |= p & wrap_right(position, 3 * (H_CONST + 2));
      return r & (PositionConstants<W_CONST, H_CONST>::board_mask() ^ mask);
    } else { // ALIGN == 5
      // Vertical (4-in-column already excluded above since we need 5)
      position_t r = (position << 1) & (position << 2) & (position << 3) & (position << 4);
      // Horizontal
      position_t l1 = wrap_left(position, H_CONST + 1);
      position_t l2 = l1 & wrap_left(position, 2 * (H_CONST + 1));
      position_t l3 = l2 & wrap_left(position, 3 * (H_CONST + 1));
      position_t r1 = wrap_right(position, H_CONST + 1);
      position_t r2 = r1 & wrap_right(position, 2 * (H_CONST + 1));
      position_t r3 = r2 & wrap_right(position, 3 * (H_CONST + 1));
      r |= l3 & wrap_left(position, 4 * (H_CONST + 1));
      r |= l3 & r1;
      r |= l2 & r2;
      r |= l1 & r3;
      r |= r3 & wrap_right(position, 4 * (H_CONST + 1));
      // Diagonal 1
      l1 = wrap_left(position, H_CONST); l2 = l1 & wrap_left(position, 2 * H_CONST);
      l3 = l2 & wrap_left(position, 3 * H_CONST); r1 = wrap_right(position, H_CONST);
      r2 = r1 & wrap_right(position, 2 * H_CONST); r3 = r2 & wrap_right(position, 3 * H_CONST);
      r |= l3 & wrap_left(position, 4 * H_CONST); r |= l3 & r1; r |= l2 & r2;
      r |= l1 & r3; r |= r3 & wrap_right(position, 4 * H_CONST);
      // Diagonal 2
      l1 = wrap_left(position, H_CONST + 2); l2 = l1 & wrap_left(position, 2 * (H_CONST + 2));
      l3 = l2 & wrap_left(position, 3 * (H_CONST + 2)); r1 = wrap_right(position, H_CONST + 2);
      r2 = r1 & wrap_right(position, 2 * (H_CONST + 2)); r3 = r2 & wrap_right(position, 3 * (H_CONST + 2));
      r |= l3 & wrap_left(position, 4 * (H_CONST + 2)); r |= l3 & r1; r |= l2 & r2;
      r |= l1 & r3; r |= r3 & wrap_right(position, 4 * (H_CONST + 2));
      return r & (PositionConstants<W_CONST, H_CONST>::board_mask() ^ mask);
    }
  }

  inline __attribute__((always_inline)) position_t compute_winning_position_dynamic(position_t position, position_t mask, int h) const {
    // Dynamic (W=-1) path always uses ALIGN=4, no WRAP
    position_t r = (position << 1) & (position << 2) & (position << 3);
    position_t p = (position << (h + 1)) & (position << 2 * (h + 1));
    r |= p & (position << 3 * (h + 1));
    r |= p & (position >> (h + 1));
    p = (position >> (h + 1)) & (position >> 2 * (h + 1));
    r |= p & (position << (h + 1));
    r |= p & (position >> 3 * (h + 1));
    p = (position << h) & (position << 2 * h);
    r |= p & (position << 3 * h);
    r |= p & (position >> h);
    p = (position >> h) & (position >> 2 * h);
    r |= p & (position << h);
    r |= p & (position >> 3 * h);
    p = (position << (h + 2)) & (position << 2 * (h + 2));
    r |= p & (position << 3 * (h + 2));
    r |= p & (position >> (h + 2));
    p = (position >> (h + 2)) & (position >> 2 * (h + 2));
    r |= p & (position << (h + 2));
    r |= p & (position >> 3 * (h + 2));
    return r & (get_board_mask() ^ mask);
  }

  inline __attribute__((always_inline)) position_t compute_winning_position(position_t position, position_t mask) const {
      if constexpr (W != -1) {
          return compute_winning_position_impl<W, H>(position, mask);
      } else {
          // Dynamic solver: always standard 4-in-a-row, no wrap
          if (width() == 7 && height() == 6) return compute_winning_position_impl<7, 6>(position, mask);
          if (width() == 8 && height() == 6) return compute_winning_position_impl<8, 6>(position, mask);
          if (width() == 8 && height() == 8) return compute_winning_position_impl<8, 8>(position, mask);
          return compute_winning_position_dynamic(position, mask, height());
      }
  }

  template<int width, int height> struct bottom {static constexpr position_t mask = bottom<width-1, height>::mask | position_t(1) << (width - 1) * (height + 1);};
  template <int height> struct bottom<0, height> {static constexpr position_t mask = 0;};

  constexpr position_t get_bottom_mask() const {
      if constexpr (W != -1) return bottom<W, H>::mask;
      position_t res = 0;
      for (int i = 0; i < dynamic_w; i++) res |= position_t(1) << (i * (dynamic_h + 1));
      return res;
  }
  constexpr position_t get_board_mask() const {
      return get_bottom_mask() * ((position_t(1) << height()) - 1);
  }
  constexpr position_t get_top() const {
      return get_bottom_mask() << height();
  }
  constexpr position_t get_top_plus_1() const {
      return get_top() + 1;
  }
  constexpr position_t get_alt_col() const {
      position_t res = 0;
      for (int i = 0; i < height(); i += 2) res |= (position_t(1) << i);
      return res;
  }
  constexpr position_t get_alto() const {
      return get_bottom_mask() * get_alt_col();
  }
  constexpr position_t get_altx() const {
      return get_alto() << 1;
  }

  template <int dir>
  static position_t haswond_const(position_t x1) {
    position_t x2 = x1 & (x1 >> dir);
    return x2 & (x2 >> (2 * dir));
  }

  static position_t haswond(position_t x1, int dir) {
    position_t x2 = x1 & (x1 >> dir);
    return x2 & (x2 >> (2 * dir));
  }

  template <int W_CONST, int H_CONST>
  int computeEvensStrategy_impl() const {
    if (H_CONST % 2 != 0) return 1000;
    if (moves % 2 != 0) return 1000;
    position_t color0 = current_position;
    position_t color1 = current_position ^ mask;
    
    position_t bottom_mask = PositionConstants<W_CONST, H_CONST>::bottom_mask();
    position_t altx = PositionConstants<W_CONST, H_CONST>::altx();
    position_t board_mask = PositionConstants<W_CONST, H_CONST>::board_mask();
    
    position_t xe = color1 | (altx & ~(color0 * 2 + color1 + bottom_mask));
    position_t oe = board_mask - xe;
    
    if (haswond_const<1>(oe)) return 1000;
    position_t xeh = haswond_const<H_CONST + 1>(xe);
    position_t xed1 = haswond_const<H_CONST>(xe);
    position_t xed2 = haswond_const<H_CONST + 2>(xe);
    position_t xeany = xeh | xed1 | xed2;
    
    position_t oeh = haswond_const<H_CONST + 1>(oe);
    position_t oed1 = haswond_const<H_CONST>(oe);
    position_t oed2 = haswond_const<H_CONST + 2>(oe);
    position_t oeany = oeh | oed1 | oed2;
    
    position_t top_plus_1 = PositionConstants<W_CONST, H_CONST>::top() + 1;
    
    if (oeh & (xeany - top_plus_1)) return 1000;
    if (oed1 && ((oeh | oed1) & ((xeh | xed1) - top_plus_1))) return 1000;
    if (oed2 && ((oeh | oed2) & ((xeh | xed2) - top_plus_1))) return 1000;
    if (xeany) {
      if (xeh) {
        for (int r = H_CONST / 2; r > 1; r--) {
          int check_row = H_CONST - (2 * r - 1);
          if (xeh & (bottom_mask << check_row)) return -r;
        }
      } else {
        position_t diag_cells = 0;
        if (xed1) diag_cells |= xed1 | (xed1 << H_CONST) | (xed1 << (2*H_CONST)) | (xed1 << (3*H_CONST));
        if (xed2) diag_cells |= xed2 | (xed2 << (H_CONST + 2)) | (xed2 << (2*(H_CONST + 2))) | (xed2 << (3*(H_CONST + 2)));
        position_t empty_cells = diag_cells & ~(color0 | color1);
        for (int r = 1; r <= H_CONST / 2; r++) {
          int check_row = H_CONST - (2 * r - 1);
          if (empty_cells & (bottom_mask << check_row)) return -r;
        }
      }
      return -1;
    }
    return 0;
  }

  int computeEvensStrategy() const {
    // Evens strategy does not apply to wraparound boards or non-standard alignment
    if constexpr (WRAP || ALIGN != 4) return 0;
    if constexpr (W != -1) {
        return computeEvensStrategy_impl<W, H>();
    } else {
        if (width() == 7 && height() == 6) return computeEvensStrategy_impl<7, 6>();
        if (width() == 8 && height() == 6) return computeEvensStrategy_impl<8, 6>();
        if (width() == 8 && height() == 8) return computeEvensStrategy_impl<8, 8>();
        
        if (height() % 2 != 0) return 1000;
        if (moves % 2 != 0) return 1000;
        position_t color0 = current_position;
        position_t color1 = current_position ^ mask;
        position_t xe = color1 | (get_altx() & ~(color0 * 2 + color1 + get_bottom_mask()));
        position_t oe = get_board_mask() - xe;
        if (haswond(oe, 1)) return 1000;
        position_t xeh = haswond(xe, height() + 1);
        position_t xed1 = haswond(xe, height());
        position_t xed2 = haswond(xe, height() + 2);
        position_t xeany = xeh | xed1 | xed2;
        position_t oeh = haswond(oe, height() + 1);
        position_t oed1 = haswond(oe, height());
        position_t oed2 = haswond(oe, height() + 2);
        if (oeh & (xeany - get_top_plus_1())) return 1000;
        if (oed1 && ((oeh | oed1) & ((xeh | xed1) - get_top_plus_1()))) return 1000;
        if (oed2 && ((oeh | oed2) & ((xeh | xed2) - get_top_plus_1()))) return 1000;
        if (xeany) {
          if (xeh) {
            for (int r = height() / 2; r > 1; r--) {
              int check_row = height() - (2 * r - 1);
              if (xeh & (get_bottom_mask() << check_row)) return -r;
            }
          } else {
            position_t diag_cells = 0;
            if (xed1) diag_cells |= xed1 | (xed1 << height()) | (xed1 << (2*height())) | (xed1 << (3*height()));
            if (xed2) diag_cells |= xed2 | (xed2 << (height() + 2)) | (xed2 << (2*(height() + 2))) | (xed2 << (3*(height() + 2)));
            position_t empty_cells = diag_cells & ~(color0 | color1);
            for (int r = 1; r <= height() / 2; r++) {
              int check_row = height() - (2 * r - 1);
              if (empty_cells & (get_bottom_mask() << check_row)) return -r;
            }
          }
          return -1;
        }
        return 0;
    }
  }

  struct DynamicCache {
      position_t column_masks[13][13];
      position_t top_mask_cols[13][13];
      position_t bottom_mask_cols[13][13];

      DynamicCache() {
          for (int h = 1; h <= 12; h++) {
              for (int col = 0; col <= 12; col++) {
                  column_masks[h][col] = ((position_t(1) << h) - 1) << (col * (h + 1));
                  top_mask_cols[h][col] = position_t(1) << ((h - 1) + col * (h + 1));
                  bottom_mask_cols[h][col] = position_t(1) << (col * (h + 1));
              }
          }
      }
  };
  
  static const DynamicCache& get_dynamic_cache() {
      static DynamicCache cache;
      return cache;
  }

  constexpr position_t top_mask_col(int col) const {
    if constexpr (W != -1) {
        return position_t(1) << ((H - 1) + col * (H + 1));
    } else {
        return get_dynamic_cache().top_mask_cols[height()][col];
    }
  }

  constexpr position_t bottom_mask_col(int col) const {
    if constexpr (W != -1) {
        return position_t(1) << (col * (H + 1));
    } else {
        return get_dynamic_cache().bottom_mask_cols[height()][col];
    }
  }

  constexpr position_t column_mask(int col) const {
    if constexpr (W != -1) {
        return ((position_t(1) << H) - 1) << (col * (H + 1));
    } else {
        return get_dynamic_cache().column_masks[height()][col];
    }
  }
};

#ifndef BOARD_WIDTH_MACRO
#define BOARD_WIDTH_MACRO 7
#define BOARD_HEIGHT_MACRO 6
#endif
using Position = GenericPosition<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>;

} // namespace Connect4
} // namespace GameSolver
#endif
