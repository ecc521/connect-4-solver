// Validates findDeadStones() against c4's formal invariant
// (Position::are_dead_stones_valid): flipping the entire detected dead-stone
// set to either color must not add or remove any potential winning cell for
// either player. Run over a positions file:
//   clang++ -std=c++20 -O2 -Inative -DBOARD_WIDTH_MACRO=7 -DBOARD_HEIGHT_MACRO=6 \
//     tools/benchmarks/deadstone_validate.cpp -o /tmp/dsval && /tmp/dsval test-data/positions_7x6.txt
#include <fstream>
#include <iostream>
#include <string>

#ifndef BOARD_WIDTH_MACRO
#define BOARD_WIDTH_MACRO 7
#endif
#ifndef BOARD_HEIGHT_MACRO
#define BOARD_HEIGHT_MACRO 6
#endif

#include "../../native/Position.hpp"

using namespace GameSolver::Connect4;

constexpr int W = BOARD_WIDTH_MACRO, H = BOARD_HEIGHT_MACRO;
using Pos = GenericPosition<W, H>;
using board_t = typename Pos::position_t;

// 1 in any cell that is part of a completed 4-in-a-row of `b` (c4's
// find_winning_stones), per direction shift.
template <int shift>
static board_t winning_stones_dir(board_t b) {
  board_t pairs = b & (b << (2 * shift));
  board_t quads = pairs & (pairs << shift);
  board_t winning_pairs = quads | (quads >> shift);
  return winning_pairs | (winning_pairs >> (2 * shift));
}

static board_t winning_stones(board_t b) {
  return winning_stones_dir<1>(b)
       | winning_stones_dir<H + 1>(b)
       | winning_stones_dir<H>(b)
       | winning_stones_dir<H + 2>(b);
}

int main(int argc, char* argv[]) {
  if (argc < 2) { std::cerr << "usage: " << argv[0] << " positions.txt\n"; return 1; }
  std::ifstream file(argv[1]);
  std::string line;
  long long checked = 0, invalid = 0, nonzero = 0;
  unsigned long long dead_total = 0, stones_total = 0;
  const board_t valid_cells = Pos().get_board_mask();

  while (std::getline(file, line)) {
    auto sp = line.find(' ');
    std::string moves = sp == std::string::npos ? line : line.substr(0, sp);
    Pos p;
    if (p.play(moves) != moves.size()) continue;

    board_t b0 = p.getCurrentPosition();
    board_t b1 = p.getCurrentPosition() ^ p.getMask();
    board_t dead = p.findDeadStones();
    board_t empty = valid_cells & ~(b0 | b1);

    checked++;
    if (dead) {
      nonzero++;
      dead_total += Pos::popcount(dead);
      stones_total += Pos::popcount(p.getMask());
    }

    auto wins = [&](board_t b) { return winning_stones(b | empty) & empty; };
    board_t b0_wins = wins(b0), b1_wins = wins(b1);
    bool ok = b0_wins == wins(b0 & ~dead)      // flip dead -> opponent: no wins lost
           && b1_wins == wins(b1 & ~dead)
           && b0_wins == wins(b0 | dead)       // flip dead -> player: no wins gained
           && b1_wins == wins(b1 | dead);
    if (!ok) {
      invalid++;
      if (invalid <= 5) std::cerr << "INVALID dead mask for pos=" << moves << "\n";
    }
  }

  std::cout << "checked=" << checked << " invalid=" << invalid
            << " positions_with_dead=" << nonzero;
  if (stones_total)
    std::cout << " avg_dead_frac=" << (double)dead_total / (double)stones_total;
  std::cout << "\n";
  return invalid ? 2 : 0;
}
