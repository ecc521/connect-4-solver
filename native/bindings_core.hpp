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

// Expose singletons gracefully to whoever includes this header
namespace SharedInstances {
    // 6x5
    inline std::unique_ptr<C4_6x5::GameSolver::Connect4::Solver>& getSolver6x5(size_t table_bytes = 67108864) {
        static std::unique_ptr<C4_6x5::GameSolver::Connect4::Solver> solver = nullptr;
        if (!solver) solver = C4_6x5::GameSolver::Connect4::Solver::create(table_bytes);
        return solver;
    }
    inline void releaseSolver6x5() { getSolver6x5().reset(); }

    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<6, 5>>& getHeuristicSolver6x5() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<6, 5>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<6, 5>>();
        return solver;
    }
    inline void releaseHeuristicSolver6x5() { getHeuristicSolver6x5().reset(); }

    // 6x6
    inline std::unique_ptr<C4_6x6::GameSolver::Connect4::Solver>& getSolver6x6(size_t table_bytes = 67108864) {
        static std::unique_ptr<C4_6x6::GameSolver::Connect4::Solver> solver = nullptr;
        if (!solver) solver = C4_6x6::GameSolver::Connect4::Solver::create(table_bytes);
        return solver;
    }
    inline void releaseSolver6x6() { getSolver6x6().reset(); }

    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<6, 6>>& getHeuristicSolver6x6() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<6, 6>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<6, 6>>();
        return solver;
    }
    inline void releaseHeuristicSolver6x6() { getHeuristicSolver6x6().reset(); }

    // 7x6
    inline std::unique_ptr<C4_7x6::GameSolver::Connect4::Solver>& getSolver7x6(size_t table_bytes = 134217728) {
        static std::unique_ptr<C4_7x6::GameSolver::Connect4::Solver> solver = nullptr;
        if (!solver) solver = C4_7x6::GameSolver::Connect4::Solver::create(table_bytes);
        return solver;
    }
    inline void releaseSolver7x6() { getSolver7x6().reset(); }

    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<7, 6>>& getHeuristicSolver7x6() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<7, 6>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<7, 6>>();
        return solver;
    }
    inline void releaseHeuristicSolver7x6() { getHeuristicSolver7x6().reset(); }

    // 7x7
    inline std::unique_ptr<C4_7x7::GameSolver::Connect4::Solver>& getSolver7x7(size_t table_bytes = 134217728) {
        static std::unique_ptr<C4_7x7::GameSolver::Connect4::Solver> solver = nullptr;
        if (!solver) solver = C4_7x7::GameSolver::Connect4::Solver::create(table_bytes);
        return solver;
    }
    inline void releaseSolver7x7() { getSolver7x7().reset(); }

    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<7, 7>>& getHeuristicSolver7x7() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<7, 7>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<7, 7>>();
        return solver;
    }
    inline void releaseHeuristicSolver7x7() { getHeuristicSolver7x7().reset(); }

    // 8x6
    inline std::unique_ptr<C4_8x6::GameSolver::Connect4::Solver>& getSolver8x6(size_t table_bytes = 134217728) {
        static std::unique_ptr<C4_8x6::GameSolver::Connect4::Solver> solver = nullptr;
        if (!solver) solver = C4_8x6::GameSolver::Connect4::Solver::create(table_bytes);
        return solver;
    }
    inline void releaseSolver8x6() { getSolver8x6().reset(); }

    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<8, 6>>& getHeuristicSolver8x6() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<8, 6>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<8, 6>>();
        return solver;
    }
    inline void releaseHeuristicSolver8x6() { getHeuristicSolver8x6().reset(); }

    // 9x7
    inline std::unique_ptr<C4_9x7::GameSolver::Connect4::Solver>& getSolver9x7(size_t table_bytes = 134217728) {
        static std::unique_ptr<C4_9x7::GameSolver::Connect4::Solver> solver = nullptr;
        if (!solver) solver = C4_9x7::GameSolver::Connect4::Solver::create(table_bytes);
        return solver;
    }
    inline void releaseSolver9x7() { getSolver9x7().reset(); }

    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<9, 7>>& getHeuristicSolver9x7() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<9, 7>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<9, 7>>();
        return solver;
    }
    inline void releaseHeuristicSolver9x7() { getHeuristicSolver9x7().reset(); }

    // 8x8 (Heuristic Only)
    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<8, 8>>& getHeuristicSolver8x8() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<8, 8>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<8, 8>>();
        return solver;
    }
    inline void releaseHeuristicSolver8x8() { getHeuristicSolver8x8().reset(); }

    // 10x7 (Heuristic Only)
    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<10, 7>>& getHeuristicSolver10x7() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<10, 7>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<10, 7>>();
        return solver;
    }
    inline void releaseHeuristicSolver10x7() { getHeuristicSolver10x7().reset(); }

    // 9x9 (Heuristic Only)
    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<9, 9>>& getHeuristicSolver9x9() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<9, 9>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<9, 9>>();
        return solver;
    }
    inline void releaseHeuristicSolver9x9() { getHeuristicSolver9x9().reset(); }

    // 10x10 (Heuristic Only)
    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<10, 10>>& getHeuristicSolver10x10() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<10, 10>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<10, 10>>();
        return solver;
    }
    inline void releaseHeuristicSolver10x10() { getHeuristicSolver10x10().reset(); }

    // 9x6
    inline std::unique_ptr<C4_9x6::GameSolver::Connect4::Solver>& getSolver9x6(size_t table_bytes = 134217728) {
        static std::unique_ptr<C4_9x6::GameSolver::Connect4::Solver> solver = nullptr;
        if (!solver) solver = C4_9x6::GameSolver::Connect4::Solver::create(table_bytes);
        return solver;
    }
    inline void releaseSolver9x6() { getSolver9x6().reset(); }

    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<9, 6>>& getHeuristicSolver9x6() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<9, 6>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<9, 6>>();
        return solver;
    }
    inline void releaseHeuristicSolver9x6() { getHeuristicSolver9x6().reset(); }

    // 11x4
    inline std::unique_ptr<C4_11x4::GameSolver::Connect4::Solver>& getSolver11x4(size_t table_bytes = 134217728) {
        static std::unique_ptr<C4_11x4::GameSolver::Connect4::Solver> solver = nullptr;
        if (!solver) solver = C4_11x4::GameSolver::Connect4::Solver::create(table_bytes);
        return solver;
    }
    inline void releaseSolver11x4() { getSolver11x4().reset(); }

    inline std::unique_ptr<GameSolver::Connect4::HeuristicSolver<11, 4>>& getHeuristicSolver11x4() {
        static std::unique_ptr<GameSolver::Connect4::HeuristicSolver<11, 4>> solver = nullptr;
        if (!solver) solver = std::make_unique<GameSolver::Connect4::HeuristicSolver<11, 4>>();
        return solver;
    }
    inline void releaseHeuristicSolver11x4() { getHeuristicSolver11x4().reset(); }
}
