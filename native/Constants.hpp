#ifndef CONSTANTS_HPP
#define CONSTANTS_HPP

namespace GameSolver {
namespace Connect4 {

    /**
     * Evaluation coordinate space for the solver engines.
     * These scores are passed around in 32-bit integers during search, 
     * but are designed to safely pack into 16-bit signed integers (-32768 to 32767) 
     * when stored in the Transposition Table.
     * 
     * - The NNUE neural network clamps its raw heuristic predictions to [-SCORE_NNUE_MAX, SCORE_NNUE_MAX].
     * - Forced exact wins are offset to +/- SCORE_FORCED_WIN_BASE.
     */
    constexpr int SCORE_FORCED_WIN_BASE = 31000;
    constexpr int SCORE_NNUE_MAX = 30000;

    /**
     * Alpha-Beta infinity bounds that still fit within the 16-bit limits
     * if they happen to be clipped or manipulated.
     */
    constexpr int SCORE_INFINITY = 32000;

}
}

#endif
