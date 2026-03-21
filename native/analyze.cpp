#include <emscripten/emscripten.h>
#include <cstdlib>
#include <string>
#include <vector>
#include <cstdint>
#include <cassert>
#include <iostream>
#include <fstream>
#include <cstring>

template <typename CoreSolver, typename CorePosition, int W>
int32_t* runAnalysis(CoreSolver& solver, const char* positionCharArr) {
  std::string positionString(positionCharArr);
  CorePosition P;
  
  int32_t* result = (int32_t*)malloc((2 + W) * sizeof(int32_t));
  
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
    result[1] = P.nbMoves();
    for(int i = 0; i < W; i++) result[2 + i] = 0;
  } 
  else {
    result[0] = 0;
    result[1] = P.nbMoves();
    std::vector<int> scores = solver.analyze(P, false);
    for(int i = 0; i < W; i++) result[2 + i] = scores[i];
  }
  return result;
}

// ==========================================
// 6x5 Instantiation
// ==========================================
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
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

// ==========================================
// 6x6 Instantiation
// ==========================================
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
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

// ==========================================
// 7x6 Instantiation
// ==========================================
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
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

// ==========================================
// 7x7 Instantiation
// ==========================================
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
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

// ==========================================
// 8x6 Instantiation
// ==========================================
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
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

// ==========================================
// 9x7 Instantiation
// ==========================================
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
#undef OPENING_BOOK_HPP
#undef MOVE_SORTER_HPP

// ==========================================
// Exposed WebAssembly Bridge
// ==========================================
extern "C" {

C4_6x5::GameSolver::Connect4::Solver solver6x5;
C4_6x6::GameSolver::Connect4::Solver solver6x6;
C4_7x6::GameSolver::Connect4::Solver solver7x6;
C4_7x7::GameSolver::Connect4::Solver solver7x7;
C4_8x6::GameSolver::Connect4::Solver solver8x6;
C4_9x7::GameSolver::Connect4::Solver solver9x7;

EMSCRIPTEN_KEEPALIVE void loadBook6x5(const char* path) { solver6x5.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition6x5(const char* pos) { return runAnalysis<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6>(solver6x5, pos); }

EMSCRIPTEN_KEEPALIVE void loadBook6x6(const char* path) { solver6x6.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition6x6(const char* pos) { return runAnalysis<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6>(solver6x6, pos); }

EMSCRIPTEN_KEEPALIVE void loadBook7x6(const char* path) { solver7x6.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition7x6(const char* pos) { return runAnalysis<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7>(solver7x6, pos); }

EMSCRIPTEN_KEEPALIVE void loadBook7x7(const char* path) { solver7x7.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition7x7(const char* pos) { return runAnalysis<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7>(solver7x7, pos); }

EMSCRIPTEN_KEEPALIVE void loadBook8x6(const char* path) { solver8x6.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition8x6(const char* pos) { return runAnalysis<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8>(solver8x6, pos); }

EMSCRIPTEN_KEEPALIVE void loadBook9x7(const char* path) { solver9x7.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition9x7(const char* pos) { return runAnalysis<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9>(solver9x7, pos); }

} // extern "C"