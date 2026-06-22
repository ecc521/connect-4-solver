#ifndef CONSTANTS_HPP
#define CONSTANTS_HPP

namespace GameSolver {
namespace Connect4 {

    constexpr int SCORE_FORCED_WIN_BASE = 31000;

    /**
     * Alpha-Beta infinity bounds that still fit within the 16-bit limits
     * if they happen to be clipped or manipulated.
     */
    constexpr int SCORE_INFINITY = 32000;

}
}

#endif
