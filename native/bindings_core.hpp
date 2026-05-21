#pragma once

#include "Solver.hpp"
#include "HeuristicSolver.hpp"
#include "Position.hpp"
#include "MoveSorter.hpp"
#include "Cache.hpp"
#include <tuple>

#ifdef __EMSCRIPTEN__
#define WASM_U128_T GameSolver::Connect4::wasm_uint128_t
#else
#define WASM_U128_T unsigned __int128
#endif

// X-Macro for supported sizes
#define SUPPORTED_SIZES_X_MACRO \
    X(4, 4, uint64_t) \
    X(4, 5, uint64_t) \
    X(4, 6, uint64_t) \
    X(4, 7, uint64_t) \
    X(4, 8, uint64_t) \
    X(4, 9, uint64_t) \
    X(4, 10, uint64_t) \
    X(4, 11, uint64_t) \
    X(4, 12, uint64_t) \
    X(5, 4, uint64_t) \
    X(5, 5, uint64_t) \
    X(5, 6, uint64_t) \
    X(5, 7, uint64_t) \
    X(5, 8, uint64_t) \
    X(5, 9, uint64_t) \
    X(5, 10, uint64_t) \
    X(5, 11, uint64_t) \
    X(5, 12, WASM_U128_T) \
    X(6, 4, uint64_t) \
    X(6, 5, uint64_t) \
    X(6, 6, uint64_t) \
    X(6, 7, uint64_t) \
    X(6, 8, uint64_t) \
    X(6, 9, uint64_t) \
    X(6, 10, WASM_U128_T) \
    X(6, 11, WASM_U128_T) \
    X(6, 12, WASM_U128_T) \
    X(7, 4, uint64_t) \
    X(7, 5, uint64_t) \
    X(7, 6, uint64_t) \
    X(7, 7, uint64_t) \
    X(7, 8, uint64_t) \
    X(7, 9, WASM_U128_T) \
    X(7, 10, WASM_U128_T) \
    X(7, 11, WASM_U128_T) \
    X(7, 12, WASM_U128_T) \
    X(7, 13, WASM_U128_T) \
    X(8, 4, uint64_t) \
    X(8, 5, uint64_t) \
    X(8, 6, uint64_t) \
    X(8, 7, uint64_t) \
    X(8, 8, WASM_U128_T) \
    X(8, 9, WASM_U128_T) \
    X(8, 10, WASM_U128_T) \
    X(8, 11, WASM_U128_T) \
    X(8, 12, WASM_U128_T) \
    X(8, 13, WASM_U128_T) \
    X(9, 4, uint64_t) \
    X(9, 5, uint64_t) \
    X(9, 6, uint64_t) \
    X(9, 7, WASM_U128_T) \
    X(9, 8, WASM_U128_T) \
    X(9, 9, WASM_U128_T) \
    X(9, 10, WASM_U128_T) \
    X(9, 11, WASM_U128_T) \
    X(9, 12, WASM_U128_T) \
    X(10, 4, uint64_t) \
    X(10, 5, uint64_t) \
    X(10, 6, WASM_U128_T) \
    X(10, 7, WASM_U128_T) \
    X(10, 8, WASM_U128_T) \
    X(10, 9, WASM_U128_T) \
    X(10, 10, WASM_U128_T) \
    X(10, 11, WASM_U128_T) \
    X(11, 4, uint64_t) \
    X(11, 5, WASM_U128_T) \
    X(11, 6, WASM_U128_T) \
    X(11, 7, WASM_U128_T) \
    X(11, 8, WASM_U128_T) \
    X(11, 9, WASM_U128_T) \
    X(11, 10, WASM_U128_T) \
    X(12, 4, uint64_t) \
    X(12, 5, WASM_U128_T) \
    X(12, 6, WASM_U128_T) \
    X(12, 7, WASM_U128_T) \
    X(12, 8, WASM_U128_T) \
    X(12, 9, WASM_U128_T) \
    X(13, 4, WASM_U128_T) \
    X(13, 5, WASM_U128_T) \
    X(13, 6, WASM_U128_T) \
    X(13, 7, WASM_U128_T) \
    X(13, 8, WASM_U128_T) 


// Define the namespaces using the X-Macro
#define X(w, h, slottype) \
    namespace C4_##w##x##h { \
        using Solver = ::GameSolver::Connect4::SolverImpl<w, h, slottype>; \
        using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<w, h>; \
    }
SUPPORTED_SIZES_X_MACRO
#undef X


template <int W, int H, typename SolverT, typename HeuristicSolverT>
struct SupportedSize {
    static constexpr int w = W;
    static constexpr int h = H;
    using Solver = SolverT;
    using HeuristicSolver = HeuristicSolverT;
};

// Define the tuple of supported sizes
using AllSupportedSizes = std::tuple<
SupportedSize<4, 4, C4_4x4::Solver, C4_4x4::HeuristicSolver>,
SupportedSize<4, 5, C4_4x5::Solver, C4_4x5::HeuristicSolver>,
SupportedSize<4, 6, C4_4x6::Solver, C4_4x6::HeuristicSolver>,
SupportedSize<4, 7, C4_4x7::Solver, C4_4x7::HeuristicSolver>,
SupportedSize<4, 8, C4_4x8::Solver, C4_4x8::HeuristicSolver>,
SupportedSize<4, 9, C4_4x9::Solver, C4_4x9::HeuristicSolver>,
SupportedSize<4, 10, C4_4x10::Solver, C4_4x10::HeuristicSolver>,
SupportedSize<4, 11, C4_4x11::Solver, C4_4x11::HeuristicSolver>,
SupportedSize<4, 12, C4_4x12::Solver, C4_4x12::HeuristicSolver>,
SupportedSize<5, 4, C4_5x4::Solver, C4_5x4::HeuristicSolver>,
SupportedSize<5, 5, C4_5x5::Solver, C4_5x5::HeuristicSolver>,
SupportedSize<5, 6, C4_5x6::Solver, C4_5x6::HeuristicSolver>,
SupportedSize<5, 7, C4_5x7::Solver, C4_5x7::HeuristicSolver>,
SupportedSize<5, 8, C4_5x8::Solver, C4_5x8::HeuristicSolver>,
SupportedSize<5, 9, C4_5x9::Solver, C4_5x9::HeuristicSolver>,
SupportedSize<5, 10, C4_5x10::Solver, C4_5x10::HeuristicSolver>,
SupportedSize<5, 11, C4_5x11::Solver, C4_5x11::HeuristicSolver>,
SupportedSize<5, 12, C4_5x12::Solver, C4_5x12::HeuristicSolver>,
SupportedSize<6, 4, C4_6x4::Solver, C4_6x4::HeuristicSolver>,
SupportedSize<6, 5, C4_6x5::Solver, C4_6x5::HeuristicSolver>,
SupportedSize<6, 6, C4_6x6::Solver, C4_6x6::HeuristicSolver>,
SupportedSize<6, 7, C4_6x7::Solver, C4_6x7::HeuristicSolver>,
SupportedSize<6, 8, C4_6x8::Solver, C4_6x8::HeuristicSolver>,
SupportedSize<6, 9, C4_6x9::Solver, C4_6x9::HeuristicSolver>,
SupportedSize<6, 10, C4_6x10::Solver, C4_6x10::HeuristicSolver>,
SupportedSize<6, 11, C4_6x11::Solver, C4_6x11::HeuristicSolver>,
SupportedSize<6, 12, C4_6x12::Solver, C4_6x12::HeuristicSolver>,
SupportedSize<7, 4, C4_7x4::Solver, C4_7x4::HeuristicSolver>,
SupportedSize<7, 5, C4_7x5::Solver, C4_7x5::HeuristicSolver>,
SupportedSize<7, 6, C4_7x6::Solver, C4_7x6::HeuristicSolver>,
SupportedSize<7, 7, C4_7x7::Solver, C4_7x7::HeuristicSolver>,
SupportedSize<7, 8, C4_7x8::Solver, C4_7x8::HeuristicSolver>,
SupportedSize<7, 9, C4_7x9::Solver, C4_7x9::HeuristicSolver>,
SupportedSize<7, 10, C4_7x10::Solver, C4_7x10::HeuristicSolver>,
SupportedSize<7, 11, C4_7x11::Solver, C4_7x11::HeuristicSolver>,
SupportedSize<7, 12, C4_7x12::Solver, C4_7x12::HeuristicSolver>,
SupportedSize<7, 13, C4_7x13::Solver, C4_7x13::HeuristicSolver>,
SupportedSize<8, 4, C4_8x4::Solver, C4_8x4::HeuristicSolver>,
SupportedSize<8, 5, C4_8x5::Solver, C4_8x5::HeuristicSolver>,
SupportedSize<8, 6, C4_8x6::Solver, C4_8x6::HeuristicSolver>,
SupportedSize<8, 7, C4_8x7::Solver, C4_8x7::HeuristicSolver>,
SupportedSize<8, 8, C4_8x8::Solver, C4_8x8::HeuristicSolver>,
SupportedSize<8, 9, C4_8x9::Solver, C4_8x9::HeuristicSolver>,
SupportedSize<8, 10, C4_8x10::Solver, C4_8x10::HeuristicSolver>,
SupportedSize<8, 11, C4_8x11::Solver, C4_8x11::HeuristicSolver>,
SupportedSize<8, 12, C4_8x12::Solver, C4_8x12::HeuristicSolver>,
SupportedSize<8, 13, C4_8x13::Solver, C4_8x13::HeuristicSolver>,
SupportedSize<9, 4, C4_9x4::Solver, C4_9x4::HeuristicSolver>,
SupportedSize<9, 5, C4_9x5::Solver, C4_9x5::HeuristicSolver>,
SupportedSize<9, 6, C4_9x6::Solver, C4_9x6::HeuristicSolver>,
SupportedSize<9, 7, C4_9x7::Solver, C4_9x7::HeuristicSolver>,
SupportedSize<9, 8, C4_9x8::Solver, C4_9x8::HeuristicSolver>,
SupportedSize<9, 9, C4_9x9::Solver, C4_9x9::HeuristicSolver>,
SupportedSize<9, 10, C4_9x10::Solver, C4_9x10::HeuristicSolver>,
SupportedSize<9, 11, C4_9x11::Solver, C4_9x11::HeuristicSolver>,
SupportedSize<9, 12, C4_9x12::Solver, C4_9x12::HeuristicSolver>,
SupportedSize<10, 4, C4_10x4::Solver, C4_10x4::HeuristicSolver>,
SupportedSize<10, 5, C4_10x5::Solver, C4_10x5::HeuristicSolver>,
SupportedSize<10, 6, C4_10x6::Solver, C4_10x6::HeuristicSolver>,
SupportedSize<10, 7, C4_10x7::Solver, C4_10x7::HeuristicSolver>,
SupportedSize<10, 8, C4_10x8::Solver, C4_10x8::HeuristicSolver>,
SupportedSize<10, 9, C4_10x9::Solver, C4_10x9::HeuristicSolver>,
SupportedSize<10, 10, C4_10x10::Solver, C4_10x10::HeuristicSolver>,
SupportedSize<10, 11, C4_10x11::Solver, C4_10x11::HeuristicSolver>,
SupportedSize<11, 4, C4_11x4::Solver, C4_11x4::HeuristicSolver>,
SupportedSize<11, 5, C4_11x5::Solver, C4_11x5::HeuristicSolver>,
SupportedSize<11, 6, C4_11x6::Solver, C4_11x6::HeuristicSolver>,
SupportedSize<11, 7, C4_11x7::Solver, C4_11x7::HeuristicSolver>,
SupportedSize<11, 8, C4_11x8::Solver, C4_11x8::HeuristicSolver>,
SupportedSize<11, 9, C4_11x9::Solver, C4_11x9::HeuristicSolver>,
SupportedSize<11, 10, C4_11x10::Solver, C4_11x10::HeuristicSolver>,
SupportedSize<12, 4, C4_12x4::Solver, C4_12x4::HeuristicSolver>,
SupportedSize<12, 5, C4_12x5::Solver, C4_12x5::HeuristicSolver>,
SupportedSize<12, 6, C4_12x6::Solver, C4_12x6::HeuristicSolver>,
SupportedSize<12, 7, C4_12x7::Solver, C4_12x7::HeuristicSolver>,
SupportedSize<12, 8, C4_12x8::Solver, C4_12x8::HeuristicSolver>,
SupportedSize<12, 9, C4_12x9::Solver, C4_12x9::HeuristicSolver>,
SupportedSize<13, 4, C4_13x4::Solver, C4_13x4::HeuristicSolver>,
SupportedSize<13, 5, C4_13x5::Solver, C4_13x5::HeuristicSolver>,
SupportedSize<13, 6, C4_13x6::Solver, C4_13x6::HeuristicSolver>,
SupportedSize<13, 7, C4_13x7::Solver, C4_13x7::HeuristicSolver>,
SupportedSize<13, 8, C4_13x8::Solver, C4_13x8::HeuristicSolver>
>;
