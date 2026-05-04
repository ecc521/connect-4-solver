
#pragma once

#include "Solver.hpp"
#include "HeuristicSolver.hpp"
#include "Position.hpp"
#include "MoveSorter.hpp"
#include "Cache.hpp"

#ifdef __EMSCRIPTEN__
#define WASM_U128_T GameSolver::Connect4::wasm_uint128_t
#else
#define WASM_U128_T unsigned __int128
#endif


namespace C4_4x4 {
    using Solver = ::GameSolver::Connect4::SolverImpl<4, 4, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<4, 4>;
}

namespace C4_4x5 {
    using Solver = ::GameSolver::Connect4::SolverImpl<4, 5, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<4, 5>;
}

namespace C4_4x6 {
    using Solver = ::GameSolver::Connect4::SolverImpl<4, 6, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<4, 6>;
}

namespace C4_4x7 {
    using Solver = ::GameSolver::Connect4::SolverImpl<4, 7, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<4, 7>;
}

namespace C4_4x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<4, 8, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<4, 8>;
}

namespace C4_4x9 {
    using Solver = ::GameSolver::Connect4::SolverImpl<4, 9, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<4, 9>;
}

namespace C4_4x10 {
    using Solver = ::GameSolver::Connect4::SolverImpl<4, 10, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<4, 10>;
}

namespace C4_4x11 {
    using Solver = ::GameSolver::Connect4::SolverImpl<4, 11, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<4, 11>;
}

namespace C4_4x12 {
    using Solver = ::GameSolver::Connect4::SolverImpl<4, 12, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<4, 12>;
}

namespace C4_5x4 {
    using Solver = ::GameSolver::Connect4::SolverImpl<5, 4, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<5, 4>;
}

namespace C4_5x5 {
    using Solver = ::GameSolver::Connect4::SolverImpl<5, 5, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<5, 5>;
}

namespace C4_5x6 {
    using Solver = ::GameSolver::Connect4::SolverImpl<5, 6, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<5, 6>;
}

namespace C4_5x7 {
    using Solver = ::GameSolver::Connect4::SolverImpl<5, 7, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<5, 7>;
}

namespace C4_5x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<5, 8, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<5, 8>;
}

namespace C4_5x9 {
    using Solver = ::GameSolver::Connect4::SolverImpl<5, 9, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<5, 9>;
}

namespace C4_5x10 {
    using Solver = ::GameSolver::Connect4::SolverImpl<5, 10, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<5, 10>;
}

namespace C4_5x11 {
    using Solver = ::GameSolver::Connect4::SolverImpl<5, 11, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<5, 11>;
}

namespace C4_5x12 {
    using Solver = ::GameSolver::Connect4::SolverImpl<5, 12, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<5, 12>;
}

namespace C4_6x4 {
    using Solver = ::GameSolver::Connect4::SolverImpl<6, 4, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<6, 4>;
}

namespace C4_6x5 {
    using Solver = ::GameSolver::Connect4::SolverImpl<6, 5, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<6, 5>;
}

namespace C4_6x6 {
    using Solver = ::GameSolver::Connect4::SolverImpl<6, 6, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<6, 6>;
}

namespace C4_6x7 {
    using Solver = ::GameSolver::Connect4::SolverImpl<6, 7, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<6, 7>;
}

namespace C4_6x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<6, 8, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<6, 8>;
}

namespace C4_6x9 {
    using Solver = ::GameSolver::Connect4::SolverImpl<6, 9, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<6, 9>;
}

namespace C4_6x10 {
    using Solver = ::GameSolver::Connect4::SolverImpl<6, 10, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<6, 10>;
}

namespace C4_6x11 {
    using Solver = ::GameSolver::Connect4::SolverImpl<6, 11, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<6, 11>;
}

namespace C4_6x12 {
    using Solver = ::GameSolver::Connect4::SolverImpl<6, 12, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<6, 12>;
}

namespace C4_7x4 {
    using Solver = ::GameSolver::Connect4::SolverImpl<7, 4, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<7, 4>;
}

namespace C4_7x5 {
    using Solver = ::GameSolver::Connect4::SolverImpl<7, 5, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<7, 5>;
}

namespace C4_7x6 {
    using Solver = ::GameSolver::Connect4::SolverImpl<7, 6, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<7, 6>;
}

namespace C4_7x7 {
    using Solver = ::GameSolver::Connect4::SolverImpl<7, 7, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<7, 7>;
}

namespace C4_7x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<7, 8, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<7, 8>;
}

namespace C4_7x9 {
    using Solver = ::GameSolver::Connect4::SolverImpl<7, 9, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<7, 9>;
}

namespace C4_7x10 {
    using Solver = ::GameSolver::Connect4::SolverImpl<7, 10, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<7, 10>;
}

namespace C4_7x11 {
    using Solver = ::GameSolver::Connect4::SolverImpl<7, 11, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<7, 11>;
}

namespace C4_7x12 {
    using Solver = ::GameSolver::Connect4::SolverImpl<7, 12, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<7, 12>;
}

namespace C4_7x13 {
    using Solver = ::GameSolver::Connect4::SolverImpl<7, 13, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<7, 13>;
}

namespace C4_8x4 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 4, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<8, 4>;
}

namespace C4_8x5 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 5, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<8, 5>;
}

namespace C4_8x6 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 6, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<8, 6>;
}

namespace C4_8x7 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 7, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<8, 7>;
}

namespace C4_8x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 8, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<8, 8>;
}

namespace C4_8x9 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 9, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<8, 9>;
}

namespace C4_8x10 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 10, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<8, 10>;
}

namespace C4_8x11 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 11, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<8, 11>;
}

namespace C4_8x12 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 12, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<8, 12>;
}

namespace C4_8x13 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 13, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<8, 13>;
}

namespace C4_9x4 {
    using Solver = ::GameSolver::Connect4::SolverImpl<9, 4, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<9, 4>;
}

namespace C4_9x5 {
    using Solver = ::GameSolver::Connect4::SolverImpl<9, 5, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<9, 5>;
}

namespace C4_9x6 {
    using Solver = ::GameSolver::Connect4::SolverImpl<9, 6, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<9, 6>;
}

namespace C4_9x7 {
    using Solver = ::GameSolver::Connect4::SolverImpl<9, 7, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<9, 7>;
}

namespace C4_9x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<9, 8, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<9, 8>;
}

namespace C4_9x9 {
    using Solver = ::GameSolver::Connect4::SolverImpl<9, 9, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<9, 9>;
}

namespace C4_9x10 {
    using Solver = ::GameSolver::Connect4::SolverImpl<9, 10, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<9, 10>;
}

namespace C4_9x11 {
    using Solver = ::GameSolver::Connect4::SolverImpl<9, 11, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<9, 11>;
}

namespace C4_9x12 {
    using Solver = ::GameSolver::Connect4::SolverImpl<9, 12, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<9, 12>;
}

namespace C4_10x4 {
    using Solver = ::GameSolver::Connect4::SolverImpl<10, 4, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<10, 4>;
}

namespace C4_10x5 {
    using Solver = ::GameSolver::Connect4::SolverImpl<10, 5, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<10, 5>;
}

namespace C4_10x6 {
    using Solver = ::GameSolver::Connect4::SolverImpl<10, 6, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<10, 6>;
}

namespace C4_10x7 {
    using Solver = ::GameSolver::Connect4::SolverImpl<10, 7, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<10, 7>;
}

namespace C4_10x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<10, 8, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<10, 8>;
}

namespace C4_10x9 {
    using Solver = ::GameSolver::Connect4::SolverImpl<10, 9, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<10, 9>;
}

namespace C4_10x10 {
    using Solver = ::GameSolver::Connect4::SolverImpl<10, 10, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<10, 10>;
}

namespace C4_10x11 {
    using Solver = ::GameSolver::Connect4::SolverImpl<10, 11, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<10, 11>;
}

namespace C4_11x4 {
    using Solver = ::GameSolver::Connect4::SolverImpl<11, 4, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<11, 4>;
}

namespace C4_11x5 {
    using Solver = ::GameSolver::Connect4::SolverImpl<11, 5, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<11, 5>;
}

namespace C4_11x6 {
    using Solver = ::GameSolver::Connect4::SolverImpl<11, 6, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<11, 6>;
}

namespace C4_11x7 {
    using Solver = ::GameSolver::Connect4::SolverImpl<11, 7, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<11, 7>;
}

namespace C4_11x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<11, 8, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<11, 8>;
}

namespace C4_11x9 {
    using Solver = ::GameSolver::Connect4::SolverImpl<11, 9, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<11, 9>;
}

namespace C4_11x10 {
    using Solver = ::GameSolver::Connect4::SolverImpl<11, 10, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<11, 10>;
}

namespace C4_12x4 {
    using Solver = ::GameSolver::Connect4::SolverImpl<12, 4, uint64_t>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<12, 4>;
}

namespace C4_12x5 {
    using Solver = ::GameSolver::Connect4::SolverImpl<12, 5, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<12, 5>;
}

namespace C4_12x6 {
    using Solver = ::GameSolver::Connect4::SolverImpl<12, 6, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<12, 6>;
}

namespace C4_12x7 {
    using Solver = ::GameSolver::Connect4::SolverImpl<12, 7, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<12, 7>;
}

namespace C4_12x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<12, 8, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<12, 8>;
}

namespace C4_12x9 {
    using Solver = ::GameSolver::Connect4::SolverImpl<12, 9, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<12, 9>;
}

namespace C4_13x4 {
    using Solver = ::GameSolver::Connect4::SolverImpl<13, 4, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<13, 4>;
}

namespace C4_13x5 {
    using Solver = ::GameSolver::Connect4::SolverImpl<13, 5, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<13, 5>;
}

namespace C4_13x6 {
    using Solver = ::GameSolver::Connect4::SolverImpl<13, 6, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<13, 6>;
}

namespace C4_13x7 {
    using Solver = ::GameSolver::Connect4::SolverImpl<13, 7, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<13, 7>;
}

namespace C4_13x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<13, 8, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<13, 8>;
}
