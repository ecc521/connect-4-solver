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
#include <queue>
#include <functional>
#include <mutex>
#include <condition_variable>

#include "HeuristicSolver.hpp"

#define USE_PTHREADS 1

#undef POSITION_HPP
#undef TRANSPOSITION_TABLE_HPP
#undef MOVE_SORTER_HPP
#undef OPENING_BOOK_HPP
#undef SOLVER_HPP
#undef BOARD_WIDTH_MACRO
#undef BOARD_HEIGHT_MACRO

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

#define BOARD_WIDTH_MACRO 9
#define BOARD_HEIGHT_MACRO 6
namespace C4_9x6 {
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
#define BOARD_HEIGHT_MACRO 8
namespace C4_8x8 {
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

#define BOARD_WIDTH_MACRO 11
#define BOARD_HEIGHT_MACRO 4
namespace C4_11x4 {
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

#include <memory>


