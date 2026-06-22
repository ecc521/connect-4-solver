#pragma once

#include "Solver.hpp"
#include "Position.hpp"
#include "MoveSorter.hpp"
#include "Cache.hpp"
#include <tuple>

#ifdef __EMSCRIPTEN__
#define WASM_U128_T GameSolver::Connect4::wasm_uint128_t
#else
#define WASM_U128_T unsigned __int128
#endif

// ─── Standard Connect-4 pre-compiled sizes ───────────────────────────────────
// X-Macro for standard C4 (align=4, wrap=false) supported sizes
#define SUPPORTED_SIZES_X_MACRO \
    X(6, 7, uint64_t) \
    X(6, 8, uint64_t) \
    X(7, 6, uint64_t) \
    X(7, 7, uint64_t) \
    X(7, 8, uint64_t) \
    X(7, 9, WASM_U128_T) \
    X(8, 6, uint64_t) \
    X(8, 7, uint64_t) \
    X(8, 8, WASM_U128_T) \
    X(9, 7, WASM_U128_T)

// Define the namespaces using the X-Macro
#define X(w, h, slottype) \
    namespace C4_##w##x##h { \
        using Solver = ::GameSolver::Connect4::SolverImpl<w, h, 4, false, slottype>; \
    }
SUPPORTED_SIZES_X_MACRO
#undef X

// ─── Dynamic fallback (all standard C4 unsupported sizes) ────────────────────
namespace C4_Dynamic {
    using Solver = ::GameSolver::Connect4::SolverImpl<-1, -1, 4, false, WASM_U128_T>;
}

// ─── Game variant specializations ────────────────────────────────────────────
// Connect-5 on 8x8 (no wrap)
namespace C5_8x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 8, 5, false, WASM_U128_T>;
}

// Connect-4 Wraparound on 7x6
namespace C4W_7x6 {
    using Solver = ::GameSolver::Connect4::SolverImpl<7, 6, 4, true, uint64_t>;
}

// Connect-5 Wraparound on 8x8
namespace C5W_8x8 {
    using Solver = ::GameSolver::Connect4::SolverImpl<8, 8, 5, true, WASM_U128_T>;
}

// ─── SupportedSize trait ─────────────────────────────────────────────────────
template <int W, int H, int AL, bool WR, typename SolverT>
struct SupportedSize {
    static constexpr int w = W;
    static constexpr int h = H;
    static constexpr int align = AL;
    static constexpr bool wrap = WR;
    using Solver = SolverT;
};

// ─── Dispatch tuple ───────────────────────────────────────────────────────────
// Standard C4 pre-compiled sizes (matched first)
using AllSupportedSizes = std::tuple<
    SupportedSize<6, 7, 4, false, C4_6x7::Solver>,
    SupportedSize<6, 8, 4, false, C4_6x8::Solver>,
    SupportedSize<7, 6, 4, false, C4_7x6::Solver>,
    SupportedSize<7, 7, 4, false, C4_7x7::Solver>,
    SupportedSize<7, 8, 4, false, C4_7x8::Solver>,
    SupportedSize<7, 9, 4, false, C4_7x9::Solver>,
    SupportedSize<8, 6, 4, false, C4_8x6::Solver>,
    SupportedSize<8, 7, 4, false, C4_8x7::Solver>,
    SupportedSize<8, 8, 4, false, C4_8x8::Solver>,
    SupportedSize<9, 7, 4, false, C4_9x7::Solver>,
    // Variant specializations
    SupportedSize<8, 8, 5, false, C5_8x8::Solver>,
    SupportedSize<7, 6, 4, true,  C4W_7x6::Solver>,
    SupportedSize<8, 8, 5, true,  C5W_8x8::Solver>,
    // Dynamic fallback (must be last)
    SupportedSize<-1, -1, 4, false, C4_Dynamic::Solver>
>;
