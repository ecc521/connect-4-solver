#include <emscripten/emscripten.h>
#include <cstdlib>
#include <string>
#include <vector>
#include <cstdint>
#include <cassert>
#include <iostream>
#include <fstream>
#include <cstring>
#include <atomic>
#include <thread>
#include <algorithm>

#include "HeuristicSolver.hpp"

template <typename CoreSolver, typename CorePosition, int W>
int32_t* runAnalysis(CoreSolver& solver, const char* positionCharArr, int threads) {
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
    std::vector<int> scores = solver.analyze(P, false, threads);
    for(int i = 0; i < W; i++) result[2 + i] = scores[i];
  }
  return result;
}

template <typename CoreSolver, typename CorePosition, int W>
int32_t* runHeuristicAnalysis(CoreSolver& solver, const char* positionCharArr, int max_depth, int threads, double timeout_ms) {
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
    std::vector<int> scores = solver.analyze_heuristic(P, max_depth, threads, timeout_ms);
    for(int i = 0; i < W; i++) result[2 + i] = scores[i];
  }
  return result;
}

// Include the shared template instantiations
#include "bindings_core.hpp"

// ==========================================
// Exposed WebAssembly Bridge
// ==========================================
extern "C" {

EMSCRIPTEN_KEEPALIVE void loadBook6x5(const char* path) { SharedInstances::solver6x5.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition6x5(const char* pos, int threads) { return runAnalysis<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6>(SharedInstances::solver6x5, pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition6x5(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6>(SharedInstances::heuristicSolver6x5, pos, max_depth, threads, timeout_ms); }

EMSCRIPTEN_KEEPALIVE void loadBook6x6(const char* path) { SharedInstances::solver6x6.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition6x6(const char* pos, int threads) { return runAnalysis<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6>(SharedInstances::solver6x6, pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition6x6(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6>(SharedInstances::heuristicSolver6x6, pos, max_depth, threads, timeout_ms); }

EMSCRIPTEN_KEEPALIVE void loadBook7x6(const char* path) { SharedInstances::solver7x6.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition7x6(const char* pos, int threads) { return runAnalysis<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7>(SharedInstances::solver7x6, pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition7x6(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7>(SharedInstances::heuristicSolver7x6, pos, max_depth, threads, timeout_ms); }

EMSCRIPTEN_KEEPALIVE void loadBook7x7(const char* path) { SharedInstances::solver7x7.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition7x7(const char* pos, int threads) { return runAnalysis<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7>(SharedInstances::solver7x7, pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition7x7(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7>(SharedInstances::heuristicSolver7x7, pos, max_depth, threads, timeout_ms); }

EMSCRIPTEN_KEEPALIVE void loadBook8x6(const char* path) { SharedInstances::solver8x6.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition8x6(const char* pos, int threads) { return runAnalysis<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8>(SharedInstances::solver8x6, pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition8x6(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8>(SharedInstances::heuristicSolver8x6, pos, max_depth, threads, timeout_ms); }

EMSCRIPTEN_KEEPALIVE void loadBook9x7(const char* path) { SharedInstances::solver9x7.loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition9x7(const char* pos, int threads) { return runAnalysis<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9>(SharedInstances::solver9x7, pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition9x7(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9>(SharedInstances::heuristicSolver9x7, pos, max_depth, threads, timeout_ms); }

EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition8x8(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8>(SharedInstances::heuristicSolver8x8, pos, max_depth, threads, timeout_ms); }

EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition10x7(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10>(SharedInstances::heuristicSolver10x7, pos, max_depth, threads, timeout_ms); }

EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition9x9(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9>(SharedInstances::heuristicSolver9x9, pos, max_depth, threads, timeout_ms); }

EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition10x10(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10>(SharedInstances::heuristicSolver10x10, pos, max_depth, threads, timeout_ms); }

} // extern "C"