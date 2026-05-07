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

template <int W, int H>
class GenericPosition {
 public:

  // Board size is 64bits or 128 bits depending on W and H
#if defined(__EMSCRIPTEN__)
  using position_t = typename std::conditional < W * (H + 1) <= 64, uint64_t, wasm_uint128_t>::type;
#else
  using position_t = typename std::conditional < W * (H + 1) <= 64, uint64_t, unsigned __int128>::type;
#endif

  static constexpr int WIDTH = W;
  static constexpr int HEIGHT = H;

  static constexpr int MIN_SCORE = -(W * H + 1) / 2;
  static constexpr int MAX_SCORE = (W * H + 1) / 2;
  std::string move_history; // Added for debugging

  static constexpr std::array<int32_t, WIDTH * (HEIGHT + 1)> compute_tromp_weights() {
    std::array<int32_t, WIDTH * (HEIGHT + 1)> weights = {};
    for (int col = 0; col < WIDTH; col++) {
      for (int row = 0; row < HEIGHT; row++) {
        int i = col < WIDTH / 2 ? col : WIDTH - 1 - col;
        int h = row < HEIGHT / 2 ? row : HEIGHT - 1 - row;
        
        int min_3_i = i < 3 ? i : 3;
        int min_3_h = h < 3 ? h : 3;
        int max_0_3_i = (3 - i) > 0 ? (3 - i) : 0;
        int diff = min_3_h - max_0_3_i;
        int max_neg1_diff = diff > -1 ? diff : -1;
        int min_i_h = i < h ? i : h;
        int min_3_min_i_h = min_i_h < 3 ? min_i_h : 3;
        
        int val = 4 + min_3_i + max_neg1_diff + min_3_min_i_h + min_3_h;
        weights[col * (HEIGHT + 1) + row] = val;
      }
    }
    return weights;
  }

  static constexpr std::array<position_t, WIDTH> compute_center_masks() {
    std::array<position_t, WIDTH> masks = {};
    for(int i = 0; i < WIDTH; i++) masks[i] = column_mask(i);
    return masks;
  }

  static constexpr std::array<int, WIDTH> compute_center_weights() {
    std::array<int, WIDTH> w = {};
    for(int i = 0; i < WIDTH; i++) {
        int dist = i - WIDTH / 2;
        if (dist < 0) dist = -dist;
        w[i] = WIDTH - dist; 
    }
    return w;
  }

  static constexpr std::array<int, WIDTH> compute_column_order() {
    std::array<int, WIDTH> order = {};
    for (int i = 0; i < WIDTH; i++) {
      order[i] = WIDTH / 2 + (1 - 2 * (i % 2)) * (i + 1) / 2;
    }
    return order;
  }

  static constexpr std::array<int32_t, WIDTH * (HEIGHT + 1)> TROMP_WEIGHTS = compute_tromp_weights();
  static constexpr std::array<position_t, WIDTH> CENTER_MASKS = compute_center_masks();
  static constexpr std::array<int, WIDTH> CENTER_WEIGHTS = compute_center_weights();
  static constexpr std::array<int, WIDTH> COLUMN_ORDER = compute_column_order();

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
      if(col < 0 || col >= WIDTH || !canPlay(col) || isWinningMove(col)) return i;
      playCol(col);
    }
    return seq.size();
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

  position_t mirror_key(position_t k) const {
      position_t res = 0;
      for (int i = 0; i < WIDTH; i++) {
          position_t col_mask = ((position_t(1) << (HEIGHT + 1)) - 1) << (i * (HEIGHT + 1));
          int target_i = WIDTH - 1 - i;
          if (target_i > i) {
              res |= (k & col_mask) << ((target_i - i) * (HEIGHT + 1));
          } else if (target_i < i) {
              res |= (k & col_mask) >> ((i - target_i) * (HEIGHT + 1));
          } else {
              res |= (k & col_mask);
          }
      }
      return res;
  }

  position_t symmetric_key(bool &is_reverse) const {
      position_t k_forward = key();
      position_t k_reverse = mirror_key(k_forward);
      if (k_forward < k_reverse) {
          is_reverse = false;
          return k_forward;
      } else {
          is_reverse = true;
          return k_reverse;
      }
  }

  position_t symmetric_key() const {
      bool dummy;
      return symmetric_key(dummy);
  }

  position_t key3(bool &is_reverse) const {
    position_t key_forward = 0;
    for(int i = 0; i < WIDTH; i++) partialKey3(key_forward, i);

    position_t key_reverse = 0;
    for(int i = WIDTH; i--;) partialKey3(key_reverse, i);

    if (key_forward < key_reverse) {
        is_reverse = false;
        return key_forward / 3;
    } else {
        is_reverse = true;
        return key_reverse / 3;
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

  int heuristic_evaluate(int double_threat_weight = 10, int uncontested_parity_weight = 57, int tempo_weight = 76, int center_multiplier = 5, int base_threat_weight = 23) const {
    int score = 0;
    position_t opp_position = current_position ^ mask;
    position_t my_threats = compute_winning_position(current_position, mask);
    position_t opp_threats = compute_winning_position(opp_position, mask);
    position_t playable = possible();
    position_t double_edged = (playable << 1) & board_mask;

    score += popcount(my_threats & double_edged) * double_threat_weight;
    score -= popcount(opp_threats & double_edged) * double_threat_weight;

    position_t opp_threats_above = (opp_threats << 1) & board_mask;
    opp_threats_above |= (opp_threats_above << 1) & board_mask;
    opp_threats_above |= (opp_threats_above << 2) & board_mask;
    opp_threats_above |= (opp_threats_above << 4) & board_mask;
    if constexpr (HEIGHT >= 8) opp_threats_above |= (opp_threats_above << 8) & board_mask;

    position_t my_threats_above = (my_threats << 1) & board_mask;
    my_threats_above |= (my_threats_above << 1) & board_mask;
    my_threats_above |= (my_threats_above << 2) & board_mask;
    my_threats_above |= (my_threats_above << 4) & board_mask;
    if constexpr (HEIGHT >= 8) my_threats_above |= (my_threats_above << 8) & board_mask;

    position_t my_useless_threats = my_threats & opp_threats_above;
    position_t opp_useless_threats = opp_threats & my_threats_above;

    position_t even_rows = 0;
    for (int r = 0; r < HEIGHT; r += 2) {
        even_rows |= (bottom_mask << r);
    }
    position_t odd_rows = (even_rows << 1) & board_mask;
    
    position_t my_parity = (moves % 2 == 0) ? even_rows : odd_rows;
    position_t opp_parity = (moves % 2 == 0) ? odd_rows : even_rows;

    position_t lowest_my_threats = my_threats & ~my_threats_above;
    position_t lowest_opp_threats = opp_threats & ~opp_threats_above;

    position_t my_uncontested_parity = (lowest_my_threats & my_parity) & ~my_useless_threats;
    position_t opp_uncontested_parity = (lowest_opp_threats & opp_parity) & ~opp_useless_threats;

    score += popcount(my_uncontested_parity) * uncontested_parity_weight;
    score -= popcount(opp_uncontested_parity) * uncontested_parity_weight;
    
    position_t all_threats = my_threats | opp_threats;
    position_t empty_squares = board_mask ^ (current_position | opp_position);

    position_t all_threats_above = all_threats;
    all_threats_above |= (all_threats_above << 1) & board_mask;
    all_threats_above |= (all_threats_above << 2) & board_mask;
    all_threats_above |= (all_threats_above << 4) & board_mask;
    if constexpr (HEIGHT >= 8) all_threats_above |= (all_threats_above << 8) & board_mask;

    int safe_squares = popcount(empty_squares & ~all_threats_above);
    
    score += ((safe_squares % 2) != (moves % 2) ? tempo_weight : -tempo_weight);
    
    score += (popcount(lowest_my_threats & ~my_useless_threats) - popcount(lowest_opp_threats & ~opp_useless_threats)) * base_threat_weight;
    
    for(int i = 0; i < WIDTH; i++) {
      score += (popcount(current_position & CENTER_MASKS[i]) - popcount(opp_position & CENTER_MASKS[i])) * CENTER_WEIGHTS[i] * center_multiplier;
    }
    
    return score;
  }

  GenericPosition() : current_position{0}, mask{0}, moves{0} {}

  bool canPlay(int col) const {
    return (mask & top_mask_col(col)) == 0;
  }

  void playCol(int col) {
    play((mask + bottom_mask_col(col)) & column_mask(col));
  }

  bool isWinningMove(int col) const {
    return (bool)(winning_position() & possible() & column_mask(col));
  }

  static GenericPosition fromKey(position_t key) {
    GenericPosition P;
    P.current_position = 0;
    P.mask = 0;
    P.moves = 0;
    for (int col = 0; col < WIDTH; col++) {
      position_t col_shift = col * (HEIGHT + 1);
      position_t col_mask = (position_t(1) << (HEIGHT + 1)) - 1;
      position_t k_col = (key >> col_shift) & col_mask;
      
      if (k_col == 0) continue;
      
      
      // Actually we need to find MSB.
      int msb = 0;
      for(int i = HEIGHT; i >= 0; i--) if(k_col & (position_t(1) << i)) { msb = i; break; }
      
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
      for (int r = HEIGHT - 1; r >= 0; r--) {
          for (int c = 0; c < WIDTH; c++) {
              position_t bit = position_t(1) << (c * (HEIGHT + 1) + r);
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
    for(position_t pos = position_t(1) << (col * (HEIGHT + 1)); pos & mask; pos <<= 1) {
      key *= 3;
      if(pos & current_position) key += 1;
      else key += 2;
    }
    key *= 3;
  }

 public:
  position_t winning_position() const {
    return compute_winning_position(current_position, mask);
  }

  position_t opponent_winning_position() const {
    return compute_winning_position(current_position ^ mask, mask);
  }

  position_t possible() const {
    return (mask + bottom_mask) & board_mask;
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

  static unsigned int getCol(position_t m) {
    return ctz_impl<position_t>(m) / (HEIGHT + 1);
  }

  static position_t compute_winning_position(position_t position, position_t mask) {
    position_t r = (position << 1) & (position << 2) & (position << 3);
    position_t p = (position << (HEIGHT + 1)) & (position << 2 * (HEIGHT + 1));
    r |= p & (position << 3 * (HEIGHT + 1));
    r |= p & (position >> (HEIGHT + 1));
    p = (position >> (HEIGHT + 1)) & (position >> 2 * (HEIGHT + 1));
    r |= p & (position << (HEIGHT + 1));
    r |= p & (position >> 3 * (HEIGHT + 1));
    p = (position << HEIGHT) & (position << 2 * HEIGHT);
    r |= p & (position << 3 * HEIGHT);
    r |= p & (position >> HEIGHT);
    p = (position >> HEIGHT) & (position >> 2 * HEIGHT);
    r |= p & (position << HEIGHT);
    r |= p & (position >> 3 * HEIGHT);
    p = (position << (HEIGHT + 2)) & (position << 2 * (HEIGHT + 2));
    r |= p & (position << 3 * (HEIGHT + 2));
    r |= p & (position >> (HEIGHT + 2));
    p = (position >> (HEIGHT + 2)) & (position >> 2 * (HEIGHT + 2));
    r |= p & (position << (HEIGHT + 2));
    r |= p & (position >> 3 * (HEIGHT + 2));
    return r & (board_mask ^ mask);
  }

  template<int width, int height> struct bottom {static constexpr position_t mask = bottom<width-1, height>::mask | position_t(1) << (width - 1) * (height + 1);};
  template <int height> struct bottom<0, height> {static constexpr position_t mask = 0;};

  static constexpr position_t bottom_mask = bottom<WIDTH, HEIGHT>::mask;
  static constexpr position_t board_mask = bottom_mask * ((position_t(1) << HEIGHT) - 1);
  static constexpr position_t TOP = bottom_mask << HEIGHT;
  static constexpr position_t TOP_PLUS_1 = TOP + 1;

  static constexpr position_t get_alt_col() {
      position_t res = 0;
      for (int i = 0; i < HEIGHT; i += 2) res |= (position_t(1) << i);
      return res;
  }
  static constexpr position_t ALTO = bottom_mask * get_alt_col();
  static constexpr position_t ALTX = ALTO << 1;

  static position_t haswond(position_t x1, int dir) {
    position_t x2 = x1 & (x1 >> dir);
    return x2 & (x2 >> (2 * dir));
  }

  int computeEvensStrategy() const {
    if constexpr (HEIGHT % 2 != 0) return 1000;
    if (moves % 2 != 0) return 1000;
    position_t color0 = current_position;
    position_t color1 = current_position ^ mask;
    position_t xe = color1 | (ALTX & ~(color0 * 2 + color1 + bottom_mask));
    position_t oe = board_mask - xe;
    if (haswond(oe, 1)) return 1000;
    position_t xeh = haswond(xe, HEIGHT + 1);
    position_t xed1 = haswond(xe, HEIGHT);
    position_t xed2 = haswond(xe, HEIGHT + 2);
    position_t xeany = xeh | xed1 | xed2;
    position_t oeh = haswond(oe, HEIGHT + 1);
    position_t oed1 = haswond(oe, HEIGHT);
    position_t oed2 = haswond(oe, HEIGHT + 2);
    if (oeh & (xeany - TOP_PLUS_1)) return 1000;
    if (oed1 && ((oeh | oed1) & ((xeh | xed1) - TOP_PLUS_1))) return 1000;
    if (oed2 && ((oeh | oed2) & ((xeh | xed2) - TOP_PLUS_1))) return 1000;
    if (xeany) {
      if (xeh) {
        for (int r = HEIGHT / 2; r > 1; r--) {
          int check_row = HEIGHT - (2 * r - 1);
          if (xeh & (bottom_mask << check_row)) return -r;
        }
      } else {
        position_t diag_cells = 0;
        if (xed1) diag_cells |= xed1 | (xed1 << HEIGHT) | (xed1 << (2*HEIGHT)) | (xed1 << (3*HEIGHT));
        if (xed2) diag_cells |= xed2 | (xed2 << (HEIGHT + 2)) | (xed2 << (2*(HEIGHT + 2))) | (xed2 << (3*(HEIGHT + 2)));
        position_t empty_cells = diag_cells & ~(color0 | color1);
        for (int r = 1; r <= HEIGHT / 2; r++) {
          int check_row = HEIGHT - (2 * r - 1);
          if (empty_cells & (bottom_mask << check_row)) return -r;
        }
      }
      return -1;
    }
    return 0;
  }

  static constexpr position_t top_mask_col(int col) {
    return position_t(1) << ((HEIGHT - 1) + col * (HEIGHT + 1));
  }

  static constexpr position_t bottom_mask_col(int col) {
    return position_t(1) << (col * (HEIGHT + 1));
  }

  static constexpr position_t column_mask(int col) {
    return ((position_t(1) << HEIGHT) - 1) << (col * (HEIGHT + 1));
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
