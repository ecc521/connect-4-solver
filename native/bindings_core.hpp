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
    X(6, 8, uint64_t) \
    X(7, 6, uint64_t) \
    X(7, 7, uint64_t) \
    X(8, 6, uint64_t)

// Define the namespaces using the X-Macro
#define X(w, h, slottype) \
    namespace C4_##w##x##h { \
        using Solver = ::GameSolver::Connect4::SolverImpl<w, h, slottype>; \
        using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<w, h>; \
    }
SUPPORTED_SIZES_X_MACRO
#undef X

namespace C4_Dynamic {
    using Solver = ::GameSolver::Connect4::SolverImpl<-1, -1, WASM_U128_T>;
    using HeuristicSolver = ::GameSolver::Connect4::HeuristicSolver<-1, -1>;
}



template <int W, int H, typename SolverT, typename HeuristicSolverT>
struct SupportedSize {
    static constexpr int w = W;
    static constexpr int h = H;
    using Solver = SolverT;
    using HeuristicSolver = HeuristicSolverT;
};

// Define the tuple of supported sizes
using AllSupportedSizes = std::tuple<
    SupportedSize<6, 8, C4_6x8::Solver, C4_6x8::HeuristicSolver>,
    SupportedSize<7, 6, C4_7x6::Solver, C4_7x6::HeuristicSolver>,
    SupportedSize<7, 7, C4_7x7::Solver, C4_7x7::HeuristicSolver>,
    SupportedSize<8, 6, C4_8x6::Solver, C4_8x6::HeuristicSolver>,
    SupportedSize<-1, -1, C4_Dynamic::Solver, C4_Dynamic::HeuristicSolver>
>;
