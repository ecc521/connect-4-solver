// gen_mo_positions.cpp
// Generates reproducible mid-game board positions for move-ordering comparison.
//
// Compile:
//   clang++ -std=c++20 -O2 -Inative -DBOARD_WIDTH_MACRO=W -DBOARD_HEIGHT_MACRO=H \
//     tools/benchmarks/gen_mo_positions.cpp -o gen_pos_WxH
//
// Usage: ./gen_pos_WxH [count] [min_depth] [max_depth] [seed]
//   Outputs <count> lines of "position 0" with sequence lengths in [min_depth, max_depth].
//   Positions are filtered: no board where current player can win immediately.

#include <iostream>
#include <string>
#include <vector>
#include <random>
#include <cstdlib>

#ifndef BOARD_WIDTH_MACRO
#define BOARD_WIDTH_MACRO 7
#endif
#ifndef BOARD_HEIGHT_MACRO
#define BOARD_HEIGHT_MACRO 6
#endif

#include "Position.hpp"

using namespace GameSolver::Connect4;
using Pos = GenericPosition<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>;

// Column chars: '1'-'9' for cols 0-8, 'a'-'z' for cols 9-35
static char col_char(int col) {
    if (col < 9) return '1' + col;
    return 'a' + (col - 9);
}

int main(int argc, char* argv[]) {
    int target   = (argc > 1) ? std::atoi(argv[1]) : 30;
    int min_dep  = (argc > 2) ? std::atoi(argv[2]) : 10;
    int max_dep  = (argc > 3) ? std::atoi(argv[3]) : 16;
    uint64_t seed = (argc > 4) ? (uint64_t)std::atoll(argv[4]) : 42ULL;

    std::mt19937_64 rng(seed);
    int generated = 0;
    int attempts  = 0;
    const int MAX_ATTEMPTS = 1000000;

    while (generated < target && attempts < MAX_ATTEMPTS) {
        ++attempts;
        Pos P;
        std::string seq;
        int depth = min_dep + (int)(rng() % (max_dep - min_dep + 1));

        bool ok = true;
        for (int move = 0; move < depth; ++move) {
            // Collect playable, non-immediately-winning columns
            std::vector<int> candidates;
            for (int c = 0; c < BOARD_WIDTH_MACRO; ++c) {
                if (P.canPlay(c) && !P.isWinningMove(c)) {
                    candidates.push_back(c);
                }
            }
            if (candidates.empty()) { ok = false; break; }
            int col = candidates[rng() % candidates.size()];
            P.playCol(col);
            seq += col_char(col);
        }

        // Skip if the position has canWinNext (solver requires this pre-condition)
        if (!ok || P.canWinNext()) continue;

        // Also skip if the sequence is too short (board is already over)
        if ((int)seq.size() < min_dep) continue;

        std::cout << seq << " 0\n";
        ++generated;
    }

    if (generated < target) {
        std::cerr << "Warning: only generated " << generated
                  << "/" << target << " positions after " << attempts << " attempts.\n";
    }
    return 0;
}
