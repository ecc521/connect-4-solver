// Shared macro un-defs to construct the 6 distinct board sizes securely natively for Mobile Bridges without duplicating code.

#include <string>
#include <cstdint>
#include <cassert>
#include <cstring>
#include <atomic>
#include <iostream>
#include <fstream>
#include <thread>
#include <algorithm>
#include <vector>

#include "HeuristicSolver.hpp"

#define USE_PTHREADS 1

#undef POSITION_HPP
#undef TRANSPOSITION_TABLE_HPP
#undef MOVE_SORTER_HPP

#define BOARD_WIDTH_MACRO 6
#define BOARD_HEIGHT_MACRO 5
namespace C4_6x5 {
#include "Solver.cpp"
}
#undef BOARD_WIDTH_MACRO
#undef BOARD_HEIGHT_MACRO
#undef POSITION_HPP
#undef SOLVER_HPP
#undef TRANSPOSITION_TABLE_HPP
#undef CUCKOO_TABLE_HPP
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

#define BOARD_WIDTH_MACRO 6
#define BOARD_HEIGHT_MACRO 6
namespace C4_6x6 {
#include "Solver.cpp"
}
#undef BOARD_WIDTH_MACRO
#undef BOARD_HEIGHT_MACRO
#undef POSITION_HPP
#undef SOLVER_HPP
#undef TRANSPOSITION_TABLE_HPP
#undef CUCKOO_TABLE_HPP
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

#define BOARD_WIDTH_MACRO 7
#define BOARD_HEIGHT_MACRO 6
namespace C4_7x6 {
#include "Solver.cpp"
}
#undef BOARD_WIDTH_MACRO
#undef BOARD_HEIGHT_MACRO
#undef POSITION_HPP
#undef SOLVER_HPP
#undef TRANSPOSITION_TABLE_HPP
#undef CUCKOO_TABLE_HPP
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

#define BOARD_WIDTH_MACRO 7
#define BOARD_HEIGHT_MACRO 7
namespace C4_7x7 {
#include "Solver.cpp"
}
#undef BOARD_WIDTH_MACRO
#undef BOARD_HEIGHT_MACRO
#undef POSITION_HPP
#undef SOLVER_HPP
#undef TRANSPOSITION_TABLE_HPP
#undef CUCKOO_TABLE_HPP
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

#define BOARD_WIDTH_MACRO 8
#define BOARD_HEIGHT_MACRO 6
namespace C4_8x6 {
#include "Solver.cpp"
}
#undef BOARD_WIDTH_MACRO
#undef BOARD_HEIGHT_MACRO
#undef POSITION_HPP
#undef SOLVER_HPP
#undef TRANSPOSITION_TABLE_HPP
#undef CUCKOO_TABLE_HPP
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

#define BOARD_WIDTH_MACRO 9
#define BOARD_HEIGHT_MACRO 7
namespace C4_9x7 {
#include "Solver.cpp"
}
#undef BOARD_WIDTH_MACRO
#undef BOARD_HEIGHT_MACRO
#undef POSITION_HPP
#undef SOLVER_HPP
#undef TRANSPOSITION_TABLE_HPP
#undef CUCKOO_TABLE_HPP
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

// Expose singletons gracefully to whoever includes this header
namespace SharedInstances {
    static C4_6x5::GameSolver::Connect4::Solver solver6x5;
    static C4_6x6::GameSolver::Connect4::Solver solver6x6;
    static C4_7x6::GameSolver::Connect4::Solver solver7x6;
    static C4_7x7::GameSolver::Connect4::Solver solver7x7;
    static C4_8x6::GameSolver::Connect4::Solver solver8x6;
    static C4_9x7::GameSolver::Connect4::Solver solver9x7;

    static GameSolver::Connect4::HeuristicSolver<6, 5> heuristicSolver6x5;
    static GameSolver::Connect4::HeuristicSolver<6, 6> heuristicSolver6x6;
    static GameSolver::Connect4::HeuristicSolver<7, 6> heuristicSolver7x6;
    static GameSolver::Connect4::HeuristicSolver<7, 7> heuristicSolver7x7;
    static GameSolver::Connect4::HeuristicSolver<8, 6> heuristicSolver8x6;
    static GameSolver::Connect4::HeuristicSolver<9, 7> heuristicSolver9x7;
    static GameSolver::Connect4::HeuristicSolver<8, 8> heuristicSolver8x8;
    static GameSolver::Connect4::HeuristicSolver<10, 7> heuristicSolver10x7;
    static GameSolver::Connect4::HeuristicSolver<9, 9> heuristicSolver9x9;
    static GameSolver::Connect4::HeuristicSolver<10, 10> heuristicSolver10x10;
}
