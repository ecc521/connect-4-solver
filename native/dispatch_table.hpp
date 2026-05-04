
#define DISPATCH_EXACT(ACTION, ...) \
    if (w == 4 && h == 4) return ACTION<4, 4>(*static_cast<C4_4x4::Solver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 5) return ACTION<4, 5>(*static_cast<C4_4x5::Solver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 6) return ACTION<4, 6>(*static_cast<C4_4x6::Solver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 7) return ACTION<4, 7>(*static_cast<C4_4x7::Solver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 8) return ACTION<4, 8>(*static_cast<C4_4x8::Solver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 9) return ACTION<4, 9>(*static_cast<C4_4x9::Solver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 10) return ACTION<4, 10>(*static_cast<C4_4x10::Solver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 11) return ACTION<4, 11>(*static_cast<C4_4x11::Solver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 12) return ACTION<4, 12>(*static_cast<C4_4x12::Solver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 4) return ACTION<5, 4>(*static_cast<C4_5x4::Solver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 5) return ACTION<5, 5>(*static_cast<C4_5x5::Solver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 6) return ACTION<5, 6>(*static_cast<C4_5x6::Solver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 7) return ACTION<5, 7>(*static_cast<C4_5x7::Solver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 8) return ACTION<5, 8>(*static_cast<C4_5x8::Solver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 9) return ACTION<5, 9>(*static_cast<C4_5x9::Solver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 10) return ACTION<5, 10>(*static_cast<C4_5x10::Solver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 11) return ACTION<5, 11>(*static_cast<C4_5x11::Solver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 12) return ACTION<5, 12>(*static_cast<C4_5x12::Solver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 4) return ACTION<6, 4>(*static_cast<C4_6x4::Solver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 5) return ACTION<6, 5>(*static_cast<C4_6x5::Solver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 6) return ACTION<6, 6>(*static_cast<C4_6x6::Solver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 7) return ACTION<6, 7>(*static_cast<C4_6x7::Solver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 8) return ACTION<6, 8>(*static_cast<C4_6x8::Solver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 9) return ACTION<6, 9>(*static_cast<C4_6x9::Solver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 10) return ACTION<6, 10>(*static_cast<C4_6x10::Solver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 11) return ACTION<6, 11>(*static_cast<C4_6x11::Solver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 12) return ACTION<6, 12>(*static_cast<C4_6x12::Solver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 4) return ACTION<7, 4>(*static_cast<C4_7x4::Solver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 5) return ACTION<7, 5>(*static_cast<C4_7x5::Solver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 6) return ACTION<7, 6>(*static_cast<C4_7x6::Solver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 7) return ACTION<7, 7>(*static_cast<C4_7x7::Solver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 8) return ACTION<7, 8>(*static_cast<C4_7x8::Solver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 9) return ACTION<7, 9>(*static_cast<C4_7x9::Solver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 10) return ACTION<7, 10>(*static_cast<C4_7x10::Solver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 11) return ACTION<7, 11>(*static_cast<C4_7x11::Solver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 12) return ACTION<7, 12>(*static_cast<C4_7x12::Solver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 13) return ACTION<7, 13>(*static_cast<C4_7x13::Solver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 4) return ACTION<8, 4>(*static_cast<C4_8x4::Solver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 5) return ACTION<8, 5>(*static_cast<C4_8x5::Solver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 6) return ACTION<8, 6>(*static_cast<C4_8x6::Solver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 7) return ACTION<8, 7>(*static_cast<C4_8x7::Solver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 8) return ACTION<8, 8>(*static_cast<C4_8x8::Solver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 9) return ACTION<8, 9>(*static_cast<C4_8x9::Solver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 10) return ACTION<8, 10>(*static_cast<C4_8x10::Solver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 11) return ACTION<8, 11>(*static_cast<C4_8x11::Solver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 12) return ACTION<8, 12>(*static_cast<C4_8x12::Solver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 13) return ACTION<8, 13>(*static_cast<C4_8x13::Solver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 4) return ACTION<9, 4>(*static_cast<C4_9x4::Solver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 5) return ACTION<9, 5>(*static_cast<C4_9x5::Solver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 6) return ACTION<9, 6>(*static_cast<C4_9x6::Solver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 7) return ACTION<9, 7>(*static_cast<C4_9x7::Solver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 8) return ACTION<9, 8>(*static_cast<C4_9x8::Solver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 9) return ACTION<9, 9>(*static_cast<C4_9x9::Solver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 10) return ACTION<9, 10>(*static_cast<C4_9x10::Solver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 11) return ACTION<9, 11>(*static_cast<C4_9x11::Solver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 12) return ACTION<9, 12>(*static_cast<C4_9x12::Solver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 4) return ACTION<10, 4>(*static_cast<C4_10x4::Solver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 5) return ACTION<10, 5>(*static_cast<C4_10x5::Solver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 6) return ACTION<10, 6>(*static_cast<C4_10x6::Solver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 7) return ACTION<10, 7>(*static_cast<C4_10x7::Solver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 8) return ACTION<10, 8>(*static_cast<C4_10x8::Solver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 9) return ACTION<10, 9>(*static_cast<C4_10x9::Solver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 10) return ACTION<10, 10>(*static_cast<C4_10x10::Solver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 11) return ACTION<10, 11>(*static_cast<C4_10x11::Solver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 4) return ACTION<11, 4>(*static_cast<C4_11x4::Solver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 5) return ACTION<11, 5>(*static_cast<C4_11x5::Solver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 6) return ACTION<11, 6>(*static_cast<C4_11x6::Solver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 7) return ACTION<11, 7>(*static_cast<C4_11x7::Solver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 8) return ACTION<11, 8>(*static_cast<C4_11x8::Solver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 9) return ACTION<11, 9>(*static_cast<C4_11x9::Solver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 10) return ACTION<11, 10>(*static_cast<C4_11x10::Solver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 4) return ACTION<12, 4>(*static_cast<C4_12x4::Solver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 5) return ACTION<12, 5>(*static_cast<C4_12x5::Solver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 6) return ACTION<12, 6>(*static_cast<C4_12x6::Solver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 7) return ACTION<12, 7>(*static_cast<C4_12x7::Solver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 8) return ACTION<12, 8>(*static_cast<C4_12x8::Solver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 9) return ACTION<12, 9>(*static_cast<C4_12x9::Solver*>(solver), __VA_ARGS__); \
    if (w == 13 && h == 4) return ACTION<13, 4>(*static_cast<C4_13x4::Solver*>(solver), __VA_ARGS__); \
    if (w == 13 && h == 5) return ACTION<13, 5>(*static_cast<C4_13x5::Solver*>(solver), __VA_ARGS__); \
    if (w == 13 && h == 6) return ACTION<13, 6>(*static_cast<C4_13x6::Solver*>(solver), __VA_ARGS__); \
    if (w == 13 && h == 7) return ACTION<13, 7>(*static_cast<C4_13x7::Solver*>(solver), __VA_ARGS__); \
    if (w == 13 && h == 8) return ACTION<13, 8>(*static_cast<C4_13x8::Solver*>(solver), __VA_ARGS__); \
    return nullptr;

#define DISPATCH_HEURISTIC(ACTION, ...) \
    if (w == 4 && h == 4) return ACTION<4, 4>(*static_cast<C4_4x4::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 5) return ACTION<4, 5>(*static_cast<C4_4x5::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 6) return ACTION<4, 6>(*static_cast<C4_4x6::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 7) return ACTION<4, 7>(*static_cast<C4_4x7::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 8) return ACTION<4, 8>(*static_cast<C4_4x8::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 9) return ACTION<4, 9>(*static_cast<C4_4x9::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 10) return ACTION<4, 10>(*static_cast<C4_4x10::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 11) return ACTION<4, 11>(*static_cast<C4_4x11::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 4 && h == 12) return ACTION<4, 12>(*static_cast<C4_4x12::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 4) return ACTION<5, 4>(*static_cast<C4_5x4::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 5) return ACTION<5, 5>(*static_cast<C4_5x5::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 6) return ACTION<5, 6>(*static_cast<C4_5x6::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 7) return ACTION<5, 7>(*static_cast<C4_5x7::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 8) return ACTION<5, 8>(*static_cast<C4_5x8::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 9) return ACTION<5, 9>(*static_cast<C4_5x9::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 10) return ACTION<5, 10>(*static_cast<C4_5x10::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 11) return ACTION<5, 11>(*static_cast<C4_5x11::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 5 && h == 12) return ACTION<5, 12>(*static_cast<C4_5x12::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 4) return ACTION<6, 4>(*static_cast<C4_6x4::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 5) return ACTION<6, 5>(*static_cast<C4_6x5::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 6) return ACTION<6, 6>(*static_cast<C4_6x6::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 7) return ACTION<6, 7>(*static_cast<C4_6x7::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 8) return ACTION<6, 8>(*static_cast<C4_6x8::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 9) return ACTION<6, 9>(*static_cast<C4_6x9::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 10) return ACTION<6, 10>(*static_cast<C4_6x10::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 11) return ACTION<6, 11>(*static_cast<C4_6x11::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 6 && h == 12) return ACTION<6, 12>(*static_cast<C4_6x12::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 4) return ACTION<7, 4>(*static_cast<C4_7x4::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 5) return ACTION<7, 5>(*static_cast<C4_7x5::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 6) return ACTION<7, 6>(*static_cast<C4_7x6::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 7) return ACTION<7, 7>(*static_cast<C4_7x7::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 8) return ACTION<7, 8>(*static_cast<C4_7x8::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 9) return ACTION<7, 9>(*static_cast<C4_7x9::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 10) return ACTION<7, 10>(*static_cast<C4_7x10::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 11) return ACTION<7, 11>(*static_cast<C4_7x11::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 12) return ACTION<7, 12>(*static_cast<C4_7x12::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 7 && h == 13) return ACTION<7, 13>(*static_cast<C4_7x13::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 4) return ACTION<8, 4>(*static_cast<C4_8x4::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 5) return ACTION<8, 5>(*static_cast<C4_8x5::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 6) return ACTION<8, 6>(*static_cast<C4_8x6::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 7) return ACTION<8, 7>(*static_cast<C4_8x7::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 8) return ACTION<8, 8>(*static_cast<C4_8x8::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 9) return ACTION<8, 9>(*static_cast<C4_8x9::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 10) return ACTION<8, 10>(*static_cast<C4_8x10::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 11) return ACTION<8, 11>(*static_cast<C4_8x11::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 12) return ACTION<8, 12>(*static_cast<C4_8x12::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 8 && h == 13) return ACTION<8, 13>(*static_cast<C4_8x13::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 4) return ACTION<9, 4>(*static_cast<C4_9x4::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 5) return ACTION<9, 5>(*static_cast<C4_9x5::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 6) return ACTION<9, 6>(*static_cast<C4_9x6::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 7) return ACTION<9, 7>(*static_cast<C4_9x7::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 8) return ACTION<9, 8>(*static_cast<C4_9x8::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 9) return ACTION<9, 9>(*static_cast<C4_9x9::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 10) return ACTION<9, 10>(*static_cast<C4_9x10::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 11) return ACTION<9, 11>(*static_cast<C4_9x11::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 9 && h == 12) return ACTION<9, 12>(*static_cast<C4_9x12::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 4) return ACTION<10, 4>(*static_cast<C4_10x4::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 5) return ACTION<10, 5>(*static_cast<C4_10x5::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 6) return ACTION<10, 6>(*static_cast<C4_10x6::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 7) return ACTION<10, 7>(*static_cast<C4_10x7::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 8) return ACTION<10, 8>(*static_cast<C4_10x8::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 9) return ACTION<10, 9>(*static_cast<C4_10x9::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 10) return ACTION<10, 10>(*static_cast<C4_10x10::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 10 && h == 11) return ACTION<10, 11>(*static_cast<C4_10x11::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 4) return ACTION<11, 4>(*static_cast<C4_11x4::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 5) return ACTION<11, 5>(*static_cast<C4_11x5::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 6) return ACTION<11, 6>(*static_cast<C4_11x6::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 7) return ACTION<11, 7>(*static_cast<C4_11x7::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 8) return ACTION<11, 8>(*static_cast<C4_11x8::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 9) return ACTION<11, 9>(*static_cast<C4_11x9::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 11 && h == 10) return ACTION<11, 10>(*static_cast<C4_11x10::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 4) return ACTION<12, 4>(*static_cast<C4_12x4::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 5) return ACTION<12, 5>(*static_cast<C4_12x5::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 6) return ACTION<12, 6>(*static_cast<C4_12x6::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 7) return ACTION<12, 7>(*static_cast<C4_12x7::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 8) return ACTION<12, 8>(*static_cast<C4_12x8::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 12 && h == 9) return ACTION<12, 9>(*static_cast<C4_12x9::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 13 && h == 4) return ACTION<13, 4>(*static_cast<C4_13x4::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 13 && h == 5) return ACTION<13, 5>(*static_cast<C4_13x5::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 13 && h == 6) return ACTION<13, 6>(*static_cast<C4_13x6::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 13 && h == 7) return ACTION<13, 7>(*static_cast<C4_13x7::HeuristicSolver*>(solver), __VA_ARGS__); \
    if (w == 13 && h == 8) return ACTION<13, 8>(*static_cast<C4_13x8::HeuristicSolver*>(solver), __VA_ARGS__); \
    return nullptr;

#define DISPATCH_CREATE_EXACT(W, H, CACHE_PTR) \
    if (W == 4 && H == 4) return C4_4x4::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 5) return C4_4x5::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 6) return C4_4x6::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 7) return C4_4x7::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 8) return C4_4x8::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 9) return C4_4x9::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 10) return C4_4x10::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 11) return C4_4x11::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 12) return C4_4x12::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 4) return C4_5x4::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 5) return C4_5x5::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 6) return C4_5x6::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 7) return C4_5x7::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 8) return C4_5x8::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 9) return C4_5x9::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 10) return C4_5x10::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 11) return C4_5x11::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 12) return C4_5x12::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 4) return C4_6x4::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 5) return C4_6x5::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 6) return C4_6x6::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 7) return C4_6x7::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 8) return C4_6x8::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 9) return C4_6x9::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 10) return C4_6x10::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 11) return C4_6x11::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 12) return C4_6x12::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 4) return C4_7x4::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 5) return C4_7x5::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 6) return C4_7x6::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 7) return C4_7x7::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 8) return C4_7x8::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 9) return C4_7x9::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 10) return C4_7x10::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 11) return C4_7x11::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 12) return C4_7x12::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 13) return C4_7x13::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 4) return C4_8x4::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 5) return C4_8x5::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 6) return C4_8x6::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 7) return C4_8x7::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 8) return C4_8x8::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 9) return C4_8x9::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 10) return C4_8x10::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 11) return C4_8x11::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 12) return C4_8x12::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 13) return C4_8x13::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 4) return C4_9x4::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 5) return C4_9x5::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 6) return C4_9x6::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 7) return C4_9x7::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 8) return C4_9x8::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 9) return C4_9x9::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 10) return C4_9x10::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 11) return C4_9x11::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 12) return C4_9x12::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 4) return C4_10x4::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 5) return C4_10x5::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 6) return C4_10x6::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 7) return C4_10x7::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 8) return C4_10x8::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 9) return C4_10x9::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 10) return C4_10x10::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 11) return C4_10x11::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 4) return C4_11x4::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 5) return C4_11x5::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 6) return C4_11x6::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 7) return C4_11x7::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 8) return C4_11x8::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 9) return C4_11x9::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 10) return C4_11x10::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 4) return C4_12x4::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 5) return C4_12x5::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 6) return C4_12x6::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 7) return C4_12x7::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 8) return C4_12x8::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 9) return C4_12x9::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 13 && H == 4) return C4_13x4::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 13 && H == 5) return C4_13x5::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 13 && H == 6) return C4_13x6::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 13 && H == 7) return C4_13x7::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 13 && H == 8) return C4_13x8::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    return nullptr;

#define DISPATCH_CREATE_HEURISTIC(W, H, CACHE_PTR) \
    if (W == 4 && H == 4) return C4_4x4::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 5) return C4_4x5::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 6) return C4_4x6::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 7) return C4_4x7::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 8) return C4_4x8::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 9) return C4_4x9::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 10) return C4_4x10::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 11) return C4_4x11::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 4 && H == 12) return C4_4x12::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 4) return C4_5x4::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 5) return C4_5x5::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 6) return C4_5x6::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 7) return C4_5x7::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 8) return C4_5x8::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 9) return C4_5x9::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 10) return C4_5x10::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 11) return C4_5x11::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 5 && H == 12) return C4_5x12::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 4) return C4_6x4::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 5) return C4_6x5::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 6) return C4_6x6::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 7) return C4_6x7::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 8) return C4_6x8::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 9) return C4_6x9::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 10) return C4_6x10::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 11) return C4_6x11::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 6 && H == 12) return C4_6x12::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 4) return C4_7x4::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 5) return C4_7x5::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 6) return C4_7x6::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 7) return C4_7x7::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 8) return C4_7x8::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 9) return C4_7x9::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 10) return C4_7x10::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 11) return C4_7x11::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 12) return C4_7x12::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 7 && H == 13) return C4_7x13::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 4) return C4_8x4::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 5) return C4_8x5::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 6) return C4_8x6::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 7) return C4_8x7::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 8) return C4_8x8::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 9) return C4_8x9::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 10) return C4_8x10::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 11) return C4_8x11::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 12) return C4_8x12::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 8 && H == 13) return C4_8x13::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 4) return C4_9x4::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 5) return C4_9x5::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 6) return C4_9x6::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 7) return C4_9x7::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 8) return C4_9x8::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 9) return C4_9x9::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 10) return C4_9x10::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 11) return C4_9x11::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 9 && H == 12) return C4_9x12::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 4) return C4_10x4::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 5) return C4_10x5::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 6) return C4_10x6::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 7) return C4_10x7::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 8) return C4_10x8::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 9) return C4_10x9::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 10) return C4_10x10::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 10 && H == 11) return C4_10x11::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 4) return C4_11x4::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 5) return C4_11x5::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 6) return C4_11x6::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 7) return C4_11x7::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 8) return C4_11x8::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 9) return C4_11x9::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 11 && H == 10) return C4_11x10::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 4) return C4_12x4::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 5) return C4_12x5::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 6) return C4_12x6::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 7) return C4_12x7::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 8) return C4_12x8::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 12 && H == 9) return C4_12x9::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 13 && H == 4) return C4_13x4::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 13 && H == 5) return C4_13x5::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 13 && H == 6) return C4_13x6::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 13 && H == 7) return C4_13x7::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    if (W == 13 && H == 8) return C4_13x8::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    return nullptr;

#define DISPATCH_DELETE(W, H, SOLVER) \
    if (W == 4 && H == 4) { delete static_cast<C4_4x4::Solver*>(SOLVER); return; } \
    if (W == 4 && H == 5) { delete static_cast<C4_4x5::Solver*>(SOLVER); return; } \
    if (W == 4 && H == 6) { delete static_cast<C4_4x6::Solver*>(SOLVER); return; } \
    if (W == 4 && H == 7) { delete static_cast<C4_4x7::Solver*>(SOLVER); return; } \
    if (W == 4 && H == 8) { delete static_cast<C4_4x8::Solver*>(SOLVER); return; } \
    if (W == 4 && H == 9) { delete static_cast<C4_4x9::Solver*>(SOLVER); return; } \
    if (W == 4 && H == 10) { delete static_cast<C4_4x10::Solver*>(SOLVER); return; } \
    if (W == 4 && H == 11) { delete static_cast<C4_4x11::Solver*>(SOLVER); return; } \
    if (W == 4 && H == 12) { delete static_cast<C4_4x12::Solver*>(SOLVER); return; } \
    if (W == 5 && H == 4) { delete static_cast<C4_5x4::Solver*>(SOLVER); return; } \
    if (W == 5 && H == 5) { delete static_cast<C4_5x5::Solver*>(SOLVER); return; } \
    if (W == 5 && H == 6) { delete static_cast<C4_5x6::Solver*>(SOLVER); return; } \
    if (W == 5 && H == 7) { delete static_cast<C4_5x7::Solver*>(SOLVER); return; } \
    if (W == 5 && H == 8) { delete static_cast<C4_5x8::Solver*>(SOLVER); return; } \
    if (W == 5 && H == 9) { delete static_cast<C4_5x9::Solver*>(SOLVER); return; } \
    if (W == 5 && H == 10) { delete static_cast<C4_5x10::Solver*>(SOLVER); return; } \
    if (W == 5 && H == 11) { delete static_cast<C4_5x11::Solver*>(SOLVER); return; } \
    if (W == 5 && H == 12) { delete static_cast<C4_5x12::Solver*>(SOLVER); return; } \
    if (W == 6 && H == 4) { delete static_cast<C4_6x4::Solver*>(SOLVER); return; } \
    if (W == 6 && H == 5) { delete static_cast<C4_6x5::Solver*>(SOLVER); return; } \
    if (W == 6 && H == 6) { delete static_cast<C4_6x6::Solver*>(SOLVER); return; } \
    if (W == 6 && H == 7) { delete static_cast<C4_6x7::Solver*>(SOLVER); return; } \
    if (W == 6 && H == 8) { delete static_cast<C4_6x8::Solver*>(SOLVER); return; } \
    if (W == 6 && H == 9) { delete static_cast<C4_6x9::Solver*>(SOLVER); return; } \
    if (W == 6 && H == 10) { delete static_cast<C4_6x10::Solver*>(SOLVER); return; } \
    if (W == 6 && H == 11) { delete static_cast<C4_6x11::Solver*>(SOLVER); return; } \
    if (W == 6 && H == 12) { delete static_cast<C4_6x12::Solver*>(SOLVER); return; } \
    if (W == 7 && H == 4) { delete static_cast<C4_7x4::Solver*>(SOLVER); return; } \
    if (W == 7 && H == 5) { delete static_cast<C4_7x5::Solver*>(SOLVER); return; } \
    if (W == 7 && H == 6) { delete static_cast<C4_7x6::Solver*>(SOLVER); return; } \
    if (W == 7 && H == 7) { delete static_cast<C4_7x7::Solver*>(SOLVER); return; } \
    if (W == 7 && H == 8) { delete static_cast<C4_7x8::Solver*>(SOLVER); return; } \
    if (W == 7 && H == 9) { delete static_cast<C4_7x9::Solver*>(SOLVER); return; } \
    if (W == 7 && H == 10) { delete static_cast<C4_7x10::Solver*>(SOLVER); return; } \
    if (W == 7 && H == 11) { delete static_cast<C4_7x11::Solver*>(SOLVER); return; } \
    if (W == 7 && H == 12) { delete static_cast<C4_7x12::Solver*>(SOLVER); return; } \
    if (W == 7 && H == 13) { delete static_cast<C4_7x13::Solver*>(SOLVER); return; } \
    if (W == 8 && H == 4) { delete static_cast<C4_8x4::Solver*>(SOLVER); return; } \
    if (W == 8 && H == 5) { delete static_cast<C4_8x5::Solver*>(SOLVER); return; } \
    if (W == 8 && H == 6) { delete static_cast<C4_8x6::Solver*>(SOLVER); return; } \
    if (W == 8 && H == 7) { delete static_cast<C4_8x7::Solver*>(SOLVER); return; } \
    if (W == 8 && H == 8) { delete static_cast<C4_8x8::Solver*>(SOLVER); return; } \
    if (W == 8 && H == 9) { delete static_cast<C4_8x9::Solver*>(SOLVER); return; } \
    if (W == 8 && H == 10) { delete static_cast<C4_8x10::Solver*>(SOLVER); return; } \
    if (W == 8 && H == 11) { delete static_cast<C4_8x11::Solver*>(SOLVER); return; } \
    if (W == 8 && H == 12) { delete static_cast<C4_8x12::Solver*>(SOLVER); return; } \
    if (W == 8 && H == 13) { delete static_cast<C4_8x13::Solver*>(SOLVER); return; } \
    if (W == 9 && H == 4) { delete static_cast<C4_9x4::Solver*>(SOLVER); return; } \
    if (W == 9 && H == 5) { delete static_cast<C4_9x5::Solver*>(SOLVER); return; } \
    if (W == 9 && H == 6) { delete static_cast<C4_9x6::Solver*>(SOLVER); return; } \
    if (W == 9 && H == 7) { delete static_cast<C4_9x7::Solver*>(SOLVER); return; } \
    if (W == 9 && H == 8) { delete static_cast<C4_9x8::Solver*>(SOLVER); return; } \
    if (W == 9 && H == 9) { delete static_cast<C4_9x9::Solver*>(SOLVER); return; } \
    if (W == 9 && H == 10) { delete static_cast<C4_9x10::Solver*>(SOLVER); return; } \
    if (W == 9 && H == 11) { delete static_cast<C4_9x11::Solver*>(SOLVER); return; } \
    if (W == 9 && H == 12) { delete static_cast<C4_9x12::Solver*>(SOLVER); return; } \
    if (W == 10 && H == 4) { delete static_cast<C4_10x4::Solver*>(SOLVER); return; } \
    if (W == 10 && H == 5) { delete static_cast<C4_10x5::Solver*>(SOLVER); return; } \
    if (W == 10 && H == 6) { delete static_cast<C4_10x6::Solver*>(SOLVER); return; } \
    if (W == 10 && H == 7) { delete static_cast<C4_10x7::Solver*>(SOLVER); return; } \
    if (W == 10 && H == 8) { delete static_cast<C4_10x8::Solver*>(SOLVER); return; } \
    if (W == 10 && H == 9) { delete static_cast<C4_10x9::Solver*>(SOLVER); return; } \
    if (W == 10 && H == 10) { delete static_cast<C4_10x10::Solver*>(SOLVER); return; } \
    if (W == 10 && H == 11) { delete static_cast<C4_10x11::Solver*>(SOLVER); return; } \
    if (W == 11 && H == 4) { delete static_cast<C4_11x4::Solver*>(SOLVER); return; } \
    if (W == 11 && H == 5) { delete static_cast<C4_11x5::Solver*>(SOLVER); return; } \
    if (W == 11 && H == 6) { delete static_cast<C4_11x6::Solver*>(SOLVER); return; } \
    if (W == 11 && H == 7) { delete static_cast<C4_11x7::Solver*>(SOLVER); return; } \
    if (W == 11 && H == 8) { delete static_cast<C4_11x8::Solver*>(SOLVER); return; } \
    if (W == 11 && H == 9) { delete static_cast<C4_11x9::Solver*>(SOLVER); return; } \
    if (W == 11 && H == 10) { delete static_cast<C4_11x10::Solver*>(SOLVER); return; } \
    if (W == 12 && H == 4) { delete static_cast<C4_12x4::Solver*>(SOLVER); return; } \
    if (W == 12 && H == 5) { delete static_cast<C4_12x5::Solver*>(SOLVER); return; } \
    if (W == 12 && H == 6) { delete static_cast<C4_12x6::Solver*>(SOLVER); return; } \
    if (W == 12 && H == 7) { delete static_cast<C4_12x7::Solver*>(SOLVER); return; } \
    if (W == 12 && H == 8) { delete static_cast<C4_12x8::Solver*>(SOLVER); return; } \
    if (W == 12 && H == 9) { delete static_cast<C4_12x9::Solver*>(SOLVER); return; } \
    if (W == 13 && H == 4) { delete static_cast<C4_13x4::Solver*>(SOLVER); return; } \
    if (W == 13 && H == 5) { delete static_cast<C4_13x5::Solver*>(SOLVER); return; } \
    if (W == 13 && H == 6) { delete static_cast<C4_13x6::Solver*>(SOLVER); return; } \
    if (W == 13 && H == 7) { delete static_cast<C4_13x7::Solver*>(SOLVER); return; } \
    if (W == 13 && H == 8) { delete static_cast<C4_13x8::Solver*>(SOLVER); return; } \
    return;

#define DISPATCH_CREATE_EXACT_CACHE(W, H, TABLE_BYTES) \
    if (W == 4 && H == 4) return C4_4x4::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 5) return C4_4x5::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 6) return C4_4x6::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 7) return C4_4x7::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 8) return C4_4x8::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 9) return C4_4x9::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 10) return C4_4x10::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 11) return C4_4x11::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 12) return C4_4x12::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 4) return C4_5x4::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 5) return C4_5x5::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 6) return C4_5x6::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 7) return C4_5x7::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 8) return C4_5x8::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 9) return C4_5x9::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 10) return C4_5x10::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 11) return C4_5x11::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 12) return C4_5x12::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 4) return C4_6x4::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 5) return C4_6x5::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 6) return C4_6x6::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 7) return C4_6x7::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 8) return C4_6x8::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 9) return C4_6x9::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 10) return C4_6x10::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 11) return C4_6x11::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 12) return C4_6x12::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 4) return C4_7x4::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 5) return C4_7x5::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 6) return C4_7x6::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 7) return C4_7x7::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 8) return C4_7x8::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 9) return C4_7x9::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 10) return C4_7x10::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 11) return C4_7x11::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 12) return C4_7x12::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 13) return C4_7x13::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 4) return C4_8x4::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 5) return C4_8x5::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 6) return C4_8x6::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 7) return C4_8x7::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 8) return C4_8x8::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 9) return C4_8x9::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 10) return C4_8x10::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 11) return C4_8x11::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 12) return C4_8x12::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 13) return C4_8x13::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 4) return C4_9x4::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 5) return C4_9x5::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 6) return C4_9x6::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 7) return C4_9x7::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 8) return C4_9x8::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 9) return C4_9x9::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 10) return C4_9x10::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 11) return C4_9x11::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 12) return C4_9x12::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 4) return C4_10x4::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 5) return C4_10x5::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 6) return C4_10x6::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 7) return C4_10x7::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 8) return C4_10x8::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 9) return C4_10x9::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 10) return C4_10x10::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 11) return C4_10x11::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 4) return C4_11x4::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 5) return C4_11x5::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 6) return C4_11x6::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 7) return C4_11x7::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 8) return C4_11x8::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 9) return C4_11x9::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 10) return C4_11x10::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 4) return C4_12x4::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 5) return C4_12x5::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 6) return C4_12x6::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 7) return C4_12x7::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 8) return C4_12x8::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 9) return C4_12x9::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 13 && H == 4) return C4_13x4::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 13 && H == 5) return C4_13x5::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 13 && H == 6) return C4_13x6::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 13 && H == 7) return C4_13x7::Solver::createCache(TABLE_BYTES).release(); \
    if (W == 13 && H == 8) return C4_13x8::Solver::createCache(TABLE_BYTES).release(); \
    return nullptr;

#define DISPATCH_CREATE_HEURISTIC_CACHE(W, H, TABLE_BYTES) \
    if (W == 4 && H == 4) return C4_4x4::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 5) return C4_4x5::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 6) return C4_4x6::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 7) return C4_4x7::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 8) return C4_4x8::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 9) return C4_4x9::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 10) return C4_4x10::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 11) return C4_4x11::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 4 && H == 12) return C4_4x12::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 4) return C4_5x4::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 5) return C4_5x5::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 6) return C4_5x6::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 7) return C4_5x7::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 8) return C4_5x8::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 9) return C4_5x9::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 10) return C4_5x10::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 11) return C4_5x11::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 5 && H == 12) return C4_5x12::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 4) return C4_6x4::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 5) return C4_6x5::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 6) return C4_6x6::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 7) return C4_6x7::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 8) return C4_6x8::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 9) return C4_6x9::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 10) return C4_6x10::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 11) return C4_6x11::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 6 && H == 12) return C4_6x12::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 4) return C4_7x4::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 5) return C4_7x5::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 6) return C4_7x6::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 7) return C4_7x7::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 8) return C4_7x8::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 9) return C4_7x9::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 10) return C4_7x10::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 11) return C4_7x11::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 12) return C4_7x12::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 7 && H == 13) return C4_7x13::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 4) return C4_8x4::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 5) return C4_8x5::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 6) return C4_8x6::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 7) return C4_8x7::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 8) return C4_8x8::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 9) return C4_8x9::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 10) return C4_8x10::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 11) return C4_8x11::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 12) return C4_8x12::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 8 && H == 13) return C4_8x13::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 4) return C4_9x4::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 5) return C4_9x5::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 6) return C4_9x6::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 7) return C4_9x7::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 8) return C4_9x8::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 9) return C4_9x9::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 10) return C4_9x10::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 11) return C4_9x11::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 9 && H == 12) return C4_9x12::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 4) return C4_10x4::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 5) return C4_10x5::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 6) return C4_10x6::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 7) return C4_10x7::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 8) return C4_10x8::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 9) return C4_10x9::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 10) return C4_10x10::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 10 && H == 11) return C4_10x11::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 4) return C4_11x4::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 5) return C4_11x5::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 6) return C4_11x6::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 7) return C4_11x7::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 8) return C4_11x8::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 9) return C4_11x9::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 11 && H == 10) return C4_11x10::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 4) return C4_12x4::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 5) return C4_12x5::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 6) return C4_12x6::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 7) return C4_12x7::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 8) return C4_12x8::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 12 && H == 9) return C4_12x9::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 13 && H == 4) return C4_13x4::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 13 && H == 5) return C4_13x5::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 13 && H == 6) return C4_13x6::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 13 && H == 7) return C4_13x7::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    if (W == 13 && H == 8) return C4_13x8::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    return nullptr;

#define DISPATCH_DELETE_BOOK(W, H, BOOK) \
    if (W == 4 && H == 4) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<4, 4>*>(BOOK); return; } \
    if (W == 4 && H == 5) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<4, 5>*>(BOOK); return; } \
    if (W == 4 && H == 6) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<4, 6>*>(BOOK); return; } \
    if (W == 4 && H == 7) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<4, 7>*>(BOOK); return; } \
    if (W == 4 && H == 8) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<4, 8>*>(BOOK); return; } \
    if (W == 4 && H == 9) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<4, 9>*>(BOOK); return; } \
    if (W == 4 && H == 10) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<4, 10>*>(BOOK); return; } \
    if (W == 4 && H == 11) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<4, 11>*>(BOOK); return; } \
    if (W == 4 && H == 12) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<4, 12>*>(BOOK); return; } \
    if (W == 5 && H == 4) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<5, 4>*>(BOOK); return; } \
    if (W == 5 && H == 5) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<5, 5>*>(BOOK); return; } \
    if (W == 5 && H == 6) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<5, 6>*>(BOOK); return; } \
    if (W == 5 && H == 7) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<5, 7>*>(BOOK); return; } \
    if (W == 5 && H == 8) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<5, 8>*>(BOOK); return; } \
    if (W == 5 && H == 9) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<5, 9>*>(BOOK); return; } \
    if (W == 5 && H == 10) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<5, 10>*>(BOOK); return; } \
    if (W == 5 && H == 11) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<5, 11>*>(BOOK); return; } \
    if (W == 5 && H == 12) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<5, 12>*>(BOOK); return; } \
    if (W == 6 && H == 4) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<6, 4>*>(BOOK); return; } \
    if (W == 6 && H == 5) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<6, 5>*>(BOOK); return; } \
    if (W == 6 && H == 6) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<6, 6>*>(BOOK); return; } \
    if (W == 6 && H == 7) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<6, 7>*>(BOOK); return; } \
    if (W == 6 && H == 8) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<6, 8>*>(BOOK); return; } \
    if (W == 6 && H == 9) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<6, 9>*>(BOOK); return; } \
    if (W == 6 && H == 10) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<6, 10>*>(BOOK); return; } \
    if (W == 6 && H == 11) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<6, 11>*>(BOOK); return; } \
    if (W == 6 && H == 12) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<6, 12>*>(BOOK); return; } \
    if (W == 7 && H == 4) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<7, 4>*>(BOOK); return; } \
    if (W == 7 && H == 5) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<7, 5>*>(BOOK); return; } \
    if (W == 7 && H == 6) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<7, 6>*>(BOOK); return; } \
    if (W == 7 && H == 7) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<7, 7>*>(BOOK); return; } \
    if (W == 7 && H == 8) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<7, 8>*>(BOOK); return; } \
    if (W == 7 && H == 9) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<7, 9>*>(BOOK); return; } \
    if (W == 7 && H == 10) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<7, 10>*>(BOOK); return; } \
    if (W == 7 && H == 11) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<7, 11>*>(BOOK); return; } \
    if (W == 7 && H == 12) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<7, 12>*>(BOOK); return; } \
    if (W == 7 && H == 13) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<7, 13>*>(BOOK); return; } \
    if (W == 8 && H == 4) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<8, 4>*>(BOOK); return; } \
    if (W == 8 && H == 5) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<8, 5>*>(BOOK); return; } \
    if (W == 8 && H == 6) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<8, 6>*>(BOOK); return; } \
    if (W == 8 && H == 7) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<8, 7>*>(BOOK); return; } \
    if (W == 8 && H == 8) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<8, 8>*>(BOOK); return; } \
    if (W == 8 && H == 9) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<8, 9>*>(BOOK); return; } \
    if (W == 8 && H == 10) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<8, 10>*>(BOOK); return; } \
    if (W == 8 && H == 11) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<8, 11>*>(BOOK); return; } \
    if (W == 8 && H == 12) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<8, 12>*>(BOOK); return; } \
    if (W == 8 && H == 13) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<8, 13>*>(BOOK); return; } \
    if (W == 9 && H == 4) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<9, 4>*>(BOOK); return; } \
    if (W == 9 && H == 5) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<9, 5>*>(BOOK); return; } \
    if (W == 9 && H == 6) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<9, 6>*>(BOOK); return; } \
    if (W == 9 && H == 7) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<9, 7>*>(BOOK); return; } \
    if (W == 9 && H == 8) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<9, 8>*>(BOOK); return; } \
    if (W == 9 && H == 9) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<9, 9>*>(BOOK); return; } \
    if (W == 9 && H == 10) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<9, 10>*>(BOOK); return; } \
    if (W == 9 && H == 11) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<9, 11>*>(BOOK); return; } \
    if (W == 9 && H == 12) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<9, 12>*>(BOOK); return; } \
    if (W == 10 && H == 4) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<10, 4>*>(BOOK); return; } \
    if (W == 10 && H == 5) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<10, 5>*>(BOOK); return; } \
    if (W == 10 && H == 6) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<10, 6>*>(BOOK); return; } \
    if (W == 10 && H == 7) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<10, 7>*>(BOOK); return; } \
    if (W == 10 && H == 8) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<10, 8>*>(BOOK); return; } \
    if (W == 10 && H == 9) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<10, 9>*>(BOOK); return; } \
    if (W == 10 && H == 10) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<10, 10>*>(BOOK); return; } \
    if (W == 10 && H == 11) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<10, 11>*>(BOOK); return; } \
    if (W == 11 && H == 4) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<11, 4>*>(BOOK); return; } \
    if (W == 11 && H == 5) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<11, 5>*>(BOOK); return; } \
    if (W == 11 && H == 6) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<11, 6>*>(BOOK); return; } \
    if (W == 11 && H == 7) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<11, 7>*>(BOOK); return; } \
    if (W == 11 && H == 8) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<11, 8>*>(BOOK); return; } \
    if (W == 11 && H == 9) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<11, 9>*>(BOOK); return; } \
    if (W == 11 && H == 10) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<11, 10>*>(BOOK); return; } \
    if (W == 12 && H == 4) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<12, 4>*>(BOOK); return; } \
    if (W == 12 && H == 5) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<12, 5>*>(BOOK); return; } \
    if (W == 12 && H == 6) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<12, 6>*>(BOOK); return; } \
    if (W == 12 && H == 7) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<12, 7>*>(BOOK); return; } \
    if (W == 12 && H == 8) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<12, 8>*>(BOOK); return; } \
    if (W == 12 && H == 9) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<12, 9>*>(BOOK); return; } \
    if (W == 13 && H == 4) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<13, 4>*>(BOOK); return; } \
    if (W == 13 && H == 5) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<13, 5>*>(BOOK); return; } \
    if (W == 13 && H == 6) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<13, 6>*>(BOOK); return; } \
    if (W == 13 && H == 7) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<13, 7>*>(BOOK); return; } \
    if (W == 13 && H == 8) { delete static_cast<::GameSolver::Connect4::OpeningBookBase<13, 8>*>(BOOK); return; } \
    return;

#define DISPATCH_EXACT_VOID(W, H, ACTION, SOLVER, ...) \
    if (W == 4 && H == 4) { static_cast<C4_4x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 4 && H == 5) { static_cast<C4_4x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 4 && H == 6) { static_cast<C4_4x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 4 && H == 7) { static_cast<C4_4x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 4 && H == 8) { static_cast<C4_4x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 4 && H == 9) { static_cast<C4_4x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 4 && H == 10) { static_cast<C4_4x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 4 && H == 11) { static_cast<C4_4x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 4 && H == 12) { static_cast<C4_4x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 5 && H == 4) { static_cast<C4_5x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 5 && H == 5) { static_cast<C4_5x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 5 && H == 6) { static_cast<C4_5x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 5 && H == 7) { static_cast<C4_5x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 5 && H == 8) { static_cast<C4_5x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 5 && H == 9) { static_cast<C4_5x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 5 && H == 10) { static_cast<C4_5x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 5 && H == 11) { static_cast<C4_5x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 5 && H == 12) { static_cast<C4_5x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 6 && H == 4) { static_cast<C4_6x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 6 && H == 5) { static_cast<C4_6x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 6 && H == 6) { static_cast<C4_6x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 6 && H == 7) { static_cast<C4_6x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 6 && H == 8) { static_cast<C4_6x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 6 && H == 9) { static_cast<C4_6x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 6 && H == 10) { static_cast<C4_6x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 6 && H == 11) { static_cast<C4_6x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 6 && H == 12) { static_cast<C4_6x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 7 && H == 4) { static_cast<C4_7x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 7 && H == 5) { static_cast<C4_7x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 7 && H == 6) { static_cast<C4_7x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 7 && H == 7) { static_cast<C4_7x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 7 && H == 8) { static_cast<C4_7x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 7 && H == 9) { static_cast<C4_7x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 7 && H == 10) { static_cast<C4_7x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 7 && H == 11) { static_cast<C4_7x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 7 && H == 12) { static_cast<C4_7x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 7 && H == 13) { static_cast<C4_7x13::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 8 && H == 4) { static_cast<C4_8x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 8 && H == 5) { static_cast<C4_8x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 8 && H == 6) { static_cast<C4_8x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 8 && H == 7) { static_cast<C4_8x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 8 && H == 8) { static_cast<C4_8x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 8 && H == 9) { static_cast<C4_8x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 8 && H == 10) { static_cast<C4_8x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 8 && H == 11) { static_cast<C4_8x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 8 && H == 12) { static_cast<C4_8x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 8 && H == 13) { static_cast<C4_8x13::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 9 && H == 4) { static_cast<C4_9x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 9 && H == 5) { static_cast<C4_9x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 9 && H == 6) { static_cast<C4_9x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 9 && H == 7) { static_cast<C4_9x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 9 && H == 8) { static_cast<C4_9x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 9 && H == 9) { static_cast<C4_9x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 9 && H == 10) { static_cast<C4_9x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 9 && H == 11) { static_cast<C4_9x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 9 && H == 12) { static_cast<C4_9x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 10 && H == 4) { static_cast<C4_10x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 10 && H == 5) { static_cast<C4_10x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 10 && H == 6) { static_cast<C4_10x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 10 && H == 7) { static_cast<C4_10x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 10 && H == 8) { static_cast<C4_10x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 10 && H == 9) { static_cast<C4_10x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 10 && H == 10) { static_cast<C4_10x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 10 && H == 11) { static_cast<C4_10x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 11 && H == 4) { static_cast<C4_11x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 11 && H == 5) { static_cast<C4_11x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 11 && H == 6) { static_cast<C4_11x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 11 && H == 7) { static_cast<C4_11x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 11 && H == 8) { static_cast<C4_11x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 11 && H == 9) { static_cast<C4_11x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 11 && H == 10) { static_cast<C4_11x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 12 && H == 4) { static_cast<C4_12x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 12 && H == 5) { static_cast<C4_12x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 12 && H == 6) { static_cast<C4_12x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 12 && H == 7) { static_cast<C4_12x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 12 && H == 8) { static_cast<C4_12x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 12 && H == 9) { static_cast<C4_12x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 13 && H == 4) { static_cast<C4_13x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 13 && H == 5) { static_cast<C4_13x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 13 && H == 6) { static_cast<C4_13x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 13 && H == 7) { static_cast<C4_13x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    if (W == 13 && H == 8) { static_cast<C4_13x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); return; } \
    return;

#define DISPATCH_EXACT_RETURN(W, H, ACTION, SOLVER, ...) \
    if (W == 4 && H == 4) return static_cast<C4_4x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 4 && H == 5) return static_cast<C4_4x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 4 && H == 6) return static_cast<C4_4x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 4 && H == 7) return static_cast<C4_4x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 4 && H == 8) return static_cast<C4_4x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 4 && H == 9) return static_cast<C4_4x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 4 && H == 10) return static_cast<C4_4x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 4 && H == 11) return static_cast<C4_4x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 4 && H == 12) return static_cast<C4_4x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 5 && H == 4) return static_cast<C4_5x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 5 && H == 5) return static_cast<C4_5x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 5 && H == 6) return static_cast<C4_5x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 5 && H == 7) return static_cast<C4_5x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 5 && H == 8) return static_cast<C4_5x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 5 && H == 9) return static_cast<C4_5x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 5 && H == 10) return static_cast<C4_5x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 5 && H == 11) return static_cast<C4_5x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 5 && H == 12) return static_cast<C4_5x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 6 && H == 4) return static_cast<C4_6x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 6 && H == 5) return static_cast<C4_6x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 6 && H == 6) return static_cast<C4_6x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 6 && H == 7) return static_cast<C4_6x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 6 && H == 8) return static_cast<C4_6x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 6 && H == 9) return static_cast<C4_6x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 6 && H == 10) return static_cast<C4_6x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 6 && H == 11) return static_cast<C4_6x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 6 && H == 12) return static_cast<C4_6x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 7 && H == 4) return static_cast<C4_7x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 7 && H == 5) return static_cast<C4_7x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 7 && H == 6) return static_cast<C4_7x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 7 && H == 7) return static_cast<C4_7x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 7 && H == 8) return static_cast<C4_7x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 7 && H == 9) return static_cast<C4_7x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 7 && H == 10) return static_cast<C4_7x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 7 && H == 11) return static_cast<C4_7x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 7 && H == 12) return static_cast<C4_7x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 7 && H == 13) return static_cast<C4_7x13::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 8 && H == 4) return static_cast<C4_8x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 8 && H == 5) return static_cast<C4_8x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 8 && H == 6) return static_cast<C4_8x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 8 && H == 7) return static_cast<C4_8x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 8 && H == 8) return static_cast<C4_8x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 8 && H == 9) return static_cast<C4_8x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 8 && H == 10) return static_cast<C4_8x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 8 && H == 11) return static_cast<C4_8x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 8 && H == 12) return static_cast<C4_8x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 8 && H == 13) return static_cast<C4_8x13::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 9 && H == 4) return static_cast<C4_9x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 9 && H == 5) return static_cast<C4_9x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 9 && H == 6) return static_cast<C4_9x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 9 && H == 7) return static_cast<C4_9x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 9 && H == 8) return static_cast<C4_9x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 9 && H == 9) return static_cast<C4_9x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 9 && H == 10) return static_cast<C4_9x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 9 && H == 11) return static_cast<C4_9x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 9 && H == 12) return static_cast<C4_9x12::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 10 && H == 4) return static_cast<C4_10x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 10 && H == 5) return static_cast<C4_10x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 10 && H == 6) return static_cast<C4_10x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 10 && H == 7) return static_cast<C4_10x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 10 && H == 8) return static_cast<C4_10x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 10 && H == 9) return static_cast<C4_10x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 10 && H == 10) return static_cast<C4_10x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 10 && H == 11) return static_cast<C4_10x11::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 11 && H == 4) return static_cast<C4_11x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 11 && H == 5) return static_cast<C4_11x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 11 && H == 6) return static_cast<C4_11x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 11 && H == 7) return static_cast<C4_11x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 11 && H == 8) return static_cast<C4_11x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 11 && H == 9) return static_cast<C4_11x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 11 && H == 10) return static_cast<C4_11x10::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 12 && H == 4) return static_cast<C4_12x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 12 && H == 5) return static_cast<C4_12x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 12 && H == 6) return static_cast<C4_12x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 12 && H == 7) return static_cast<C4_12x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 12 && H == 8) return static_cast<C4_12x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 12 && H == 9) return static_cast<C4_12x9::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 13 && H == 4) return static_cast<C4_13x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 13 && H == 5) return static_cast<C4_13x5::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 13 && H == 6) return static_cast<C4_13x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 13 && H == 7) return static_cast<C4_13x7::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    if (W == 13 && H == 8) return static_cast<C4_13x8::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    return 0.0;

#define DISPATCH_STATIC(W, H, ACTION, ...) \
    if (W == 4 && H == 4) return ACTION<4, 4>(__VA_ARGS__); \
    if (W == 4 && H == 5) return ACTION<4, 5>(__VA_ARGS__); \
    if (W == 4 && H == 6) return ACTION<4, 6>(__VA_ARGS__); \
    if (W == 4 && H == 7) return ACTION<4, 7>(__VA_ARGS__); \
    if (W == 4 && H == 8) return ACTION<4, 8>(__VA_ARGS__); \
    if (W == 4 && H == 9) return ACTION<4, 9>(__VA_ARGS__); \
    if (W == 4 && H == 10) return ACTION<4, 10>(__VA_ARGS__); \
    if (W == 4 && H == 11) return ACTION<4, 11>(__VA_ARGS__); \
    if (W == 4 && H == 12) return ACTION<4, 12>(__VA_ARGS__); \
    if (W == 5 && H == 4) return ACTION<5, 4>(__VA_ARGS__); \
    if (W == 5 && H == 5) return ACTION<5, 5>(__VA_ARGS__); \
    if (W == 5 && H == 6) return ACTION<5, 6>(__VA_ARGS__); \
    if (W == 5 && H == 7) return ACTION<5, 7>(__VA_ARGS__); \
    if (W == 5 && H == 8) return ACTION<5, 8>(__VA_ARGS__); \
    if (W == 5 && H == 9) return ACTION<5, 9>(__VA_ARGS__); \
    if (W == 5 && H == 10) return ACTION<5, 10>(__VA_ARGS__); \
    if (W == 5 && H == 11) return ACTION<5, 11>(__VA_ARGS__); \
    if (W == 5 && H == 12) return ACTION<5, 12>(__VA_ARGS__); \
    if (W == 6 && H == 4) return ACTION<6, 4>(__VA_ARGS__); \
    if (W == 6 && H == 5) return ACTION<6, 5>(__VA_ARGS__); \
    if (W == 6 && H == 6) return ACTION<6, 6>(__VA_ARGS__); \
    if (W == 6 && H == 7) return ACTION<6, 7>(__VA_ARGS__); \
    if (W == 6 && H == 8) return ACTION<6, 8>(__VA_ARGS__); \
    if (W == 6 && H == 9) return ACTION<6, 9>(__VA_ARGS__); \
    if (W == 6 && H == 10) return ACTION<6, 10>(__VA_ARGS__); \
    if (W == 6 && H == 11) return ACTION<6, 11>(__VA_ARGS__); \
    if (W == 6 && H == 12) return ACTION<6, 12>(__VA_ARGS__); \
    if (W == 7 && H == 4) return ACTION<7, 4>(__VA_ARGS__); \
    if (W == 7 && H == 5) return ACTION<7, 5>(__VA_ARGS__); \
    if (W == 7 && H == 6) return ACTION<7, 6>(__VA_ARGS__); \
    if (W == 7 && H == 7) return ACTION<7, 7>(__VA_ARGS__); \
    if (W == 7 && H == 8) return ACTION<7, 8>(__VA_ARGS__); \
    if (W == 7 && H == 9) return ACTION<7, 9>(__VA_ARGS__); \
    if (W == 7 && H == 10) return ACTION<7, 10>(__VA_ARGS__); \
    if (W == 7 && H == 11) return ACTION<7, 11>(__VA_ARGS__); \
    if (W == 7 && H == 12) return ACTION<7, 12>(__VA_ARGS__); \
    if (W == 7 && H == 13) return ACTION<7, 13>(__VA_ARGS__); \
    if (W == 8 && H == 4) return ACTION<8, 4>(__VA_ARGS__); \
    if (W == 8 && H == 5) return ACTION<8, 5>(__VA_ARGS__); \
    if (W == 8 && H == 6) return ACTION<8, 6>(__VA_ARGS__); \
    if (W == 8 && H == 7) return ACTION<8, 7>(__VA_ARGS__); \
    if (W == 8 && H == 8) return ACTION<8, 8>(__VA_ARGS__); \
    if (W == 8 && H == 9) return ACTION<8, 9>(__VA_ARGS__); \
    if (W == 8 && H == 10) return ACTION<8, 10>(__VA_ARGS__); \
    if (W == 8 && H == 11) return ACTION<8, 11>(__VA_ARGS__); \
    if (W == 8 && H == 12) return ACTION<8, 12>(__VA_ARGS__); \
    if (W == 8 && H == 13) return ACTION<8, 13>(__VA_ARGS__); \
    if (W == 9 && H == 4) return ACTION<9, 4>(__VA_ARGS__); \
    if (W == 9 && H == 5) return ACTION<9, 5>(__VA_ARGS__); \
    if (W == 9 && H == 6) return ACTION<9, 6>(__VA_ARGS__); \
    if (W == 9 && H == 7) return ACTION<9, 7>(__VA_ARGS__); \
    if (W == 9 && H == 8) return ACTION<9, 8>(__VA_ARGS__); \
    if (W == 9 && H == 9) return ACTION<9, 9>(__VA_ARGS__); \
    if (W == 9 && H == 10) return ACTION<9, 10>(__VA_ARGS__); \
    if (W == 9 && H == 11) return ACTION<9, 11>(__VA_ARGS__); \
    if (W == 9 && H == 12) return ACTION<9, 12>(__VA_ARGS__); \
    if (W == 10 && H == 4) return ACTION<10, 4>(__VA_ARGS__); \
    if (W == 10 && H == 5) return ACTION<10, 5>(__VA_ARGS__); \
    if (W == 10 && H == 6) return ACTION<10, 6>(__VA_ARGS__); \
    if (W == 10 && H == 7) return ACTION<10, 7>(__VA_ARGS__); \
    if (W == 10 && H == 8) return ACTION<10, 8>(__VA_ARGS__); \
    if (W == 10 && H == 9) return ACTION<10, 9>(__VA_ARGS__); \
    if (W == 10 && H == 10) return ACTION<10, 10>(__VA_ARGS__); \
    if (W == 10 && H == 11) return ACTION<10, 11>(__VA_ARGS__); \
    if (W == 11 && H == 4) return ACTION<11, 4>(__VA_ARGS__); \
    if (W == 11 && H == 5) return ACTION<11, 5>(__VA_ARGS__); \
    if (W == 11 && H == 6) return ACTION<11, 6>(__VA_ARGS__); \
    if (W == 11 && H == 7) return ACTION<11, 7>(__VA_ARGS__); \
    if (W == 11 && H == 8) return ACTION<11, 8>(__VA_ARGS__); \
    if (W == 11 && H == 9) return ACTION<11, 9>(__VA_ARGS__); \
    if (W == 11 && H == 10) return ACTION<11, 10>(__VA_ARGS__); \
    if (W == 12 && H == 4) return ACTION<12, 4>(__VA_ARGS__); \
    if (W == 12 && H == 5) return ACTION<12, 5>(__VA_ARGS__); \
    if (W == 12 && H == 6) return ACTION<12, 6>(__VA_ARGS__); \
    if (W == 12 && H == 7) return ACTION<12, 7>(__VA_ARGS__); \
    if (W == 12 && H == 8) return ACTION<12, 8>(__VA_ARGS__); \
    if (W == 12 && H == 9) return ACTION<12, 9>(__VA_ARGS__); \
    if (W == 13 && H == 4) return ACTION<13, 4>(__VA_ARGS__); \
    if (W == 13 && H == 5) return ACTION<13, 5>(__VA_ARGS__); \
    if (W == 13 && H == 6) return ACTION<13, 6>(__VA_ARGS__); \
    if (W == 13 && H == 7) return ACTION<13, 7>(__VA_ARGS__); \
    if (W == 13 && H == 8) return ACTION<13, 8>(__VA_ARGS__); \
    return nullptr;

