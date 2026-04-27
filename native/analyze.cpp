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
  
  int32_t* result = (int32_t*)malloc((3 + W) * sizeof(int32_t));
  
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
    result[1] = P.nbMoves();
    for(int i = 0; i < W; i++) result[2 + i] = 0;
    result[2 + W] = 0;
  } 
  else {
    result[0] = 0;
    result[1] = P.nbMoves();
    auto res = solver.analyze_heuristic(P, max_depth, threads, timeout_ms);
    std::vector<int> scores = res.first;
    for(int i = 0; i < W; i++) result[2 + i] = scores[i];
    result[2 + W] = res.second; // Depth reached
  }
  return result;
}

// Include the shared template instantiations
#include "bindings_core.hpp"

// ==========================================
// Exposed WebAssembly Bridge
// ==========================================
extern "C" {

EMSCRIPTEN_KEEPALIVE void loadBook6x5(const char* path) { SharedInstances::getSolver6x5()->loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition6x5(const char* pos, int threads) { return runAnalysis<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6>(*SharedInstances::getSolver6x5(), pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition6x5(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6>(*SharedInstances::getHeuristicSolver6x5(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE void releaseSolver6x5() { SharedInstances::releaseSolver6x5(); SharedInstances::releaseHeuristicSolver6x5(); }

EMSCRIPTEN_KEEPALIVE void loadBook6x6(const char* path) { SharedInstances::getSolver6x6()->loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition6x6(const char* pos, int threads) { return runAnalysis<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6>(*SharedInstances::getSolver6x6(), pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition6x6(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6>(*SharedInstances::getHeuristicSolver6x6(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE void releaseSolver6x6() { SharedInstances::releaseSolver6x6(); SharedInstances::releaseHeuristicSolver6x6(); }

EMSCRIPTEN_KEEPALIVE void loadBook7x6(const char* path) { SharedInstances::getSolver7x6()->loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition7x6(const char* pos, int threads) { return runAnalysis<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7>(*SharedInstances::getSolver7x6(), pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition7x6(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7>(*SharedInstances::getHeuristicSolver7x6(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE uint64_t getNodeCount7x6() { return SharedInstances::getSolver7x6()->getNodeCount(); }
EMSCRIPTEN_KEEPALIVE uint64_t getNodeCountHeuristic7x6() { return SharedInstances::getHeuristicSolver7x6()->getNodeCount(); }
EMSCRIPTEN_KEEPALIVE void releaseSolver7x6() { SharedInstances::releaseSolver7x6(); SharedInstances::releaseHeuristicSolver7x6(); }

// Instance-based API for 7x6 Shared Cache
EMSCRIPTEN_KEEPALIVE void* createCache7x6(size_t bytes) { return C4_7x6::GameSolver::Connect4::Solver::createCache(bytes).release(); }
EMSCRIPTEN_KEEPALIVE void destroyCache7x6(void* cache) { delete static_cast<C4_7x6::GameSolver::Connect4::Cache*>(cache); }
EMSCRIPTEN_KEEPALIVE void* createSolverWithCache7x6(void* cache) { return C4_7x6::GameSolver::Connect4::Solver::createWithCache(static_cast<C4_7x6::GameSolver::Connect4::Cache*>(cache)).release(); }
EMSCRIPTEN_KEEPALIVE void destroySolver7x6(void* solver) { delete static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePositionInstance7x6(void* solver, const char* pos, int threads) { return runAnalysis<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7>(*static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver), pos, threads); }

EMSCRIPTEN_KEEPALIVE void loadBook7x7(const char* path) { SharedInstances::getSolver7x7()->loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition7x7(const char* pos, int threads) { return runAnalysis<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7>(*SharedInstances::getSolver7x7(), pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition7x7(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7>(*SharedInstances::getHeuristicSolver7x7(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE void releaseSolver7x7() { SharedInstances::releaseSolver7x7(); SharedInstances::releaseHeuristicSolver7x7(); }

EMSCRIPTEN_KEEPALIVE void loadBook8x6(const char* path) { SharedInstances::getSolver8x6()->loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition8x6(const char* pos, int threads) { return runAnalysis<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8>(*SharedInstances::getSolver8x6(), pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition8x6(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8>(*SharedInstances::getHeuristicSolver8x6(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE void releaseSolver8x6() { SharedInstances::releaseSolver8x6(); SharedInstances::releaseHeuristicSolver8x6(); }

EMSCRIPTEN_KEEPALIVE void loadBook9x7(const char* path) { SharedInstances::getSolver9x7()->loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition9x7(const char* pos, int threads) { return runAnalysis<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9>(*SharedInstances::getSolver9x7(), pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition9x7(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9>(*SharedInstances::getHeuristicSolver9x7(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE void releaseSolver9x7() { SharedInstances::releaseSolver9x7(); SharedInstances::releaseHeuristicSolver9x7(); }

EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition8x8(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8>(*SharedInstances::getHeuristicSolver8x8(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE void releaseSolver8x8() { SharedInstances::releaseHeuristicSolver8x8(); }

EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition10x7(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10>(*SharedInstances::getHeuristicSolver10x7(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE void releaseSolver10x7() { SharedInstances::releaseHeuristicSolver10x7(); }

EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition9x9(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9>(*SharedInstances::getHeuristicSolver9x9(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE void releaseSolver9x9() { SharedInstances::releaseHeuristicSolver9x9(); }

EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition10x10(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10>(*SharedInstances::getHeuristicSolver10x10(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE void releaseSolver10x10() { SharedInstances::releaseHeuristicSolver10x10(); }

} // extern "C"
extern "C" {
EMSCRIPTEN_KEEPALIVE void loadBook9x6(const char* path) { SharedInstances::getSolver9x6()->loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition9x6(const char* pos, int threads) { return runAnalysis<C4_9x6::GameSolver::Connect4::Solver, C4_9x6::GameSolver::Connect4::Position, 9>(*SharedInstances::getSolver9x6(), pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition9x6(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 6>, GameSolver::Connect4::GenericPosition<9, 6>, 9>(*SharedInstances::getHeuristicSolver9x6(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE void releaseSolver9x6() { SharedInstances::releaseSolver9x6(); SharedInstances::releaseHeuristicSolver9x6(); }

EMSCRIPTEN_KEEPALIVE void loadBook11x4(const char* path) { SharedInstances::getSolver11x4()->loadBook(std::string(path)); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzePosition11x4(const char* pos, int threads) { return runAnalysis<C4_11x4::GameSolver::Connect4::Solver, C4_11x4::GameSolver::Connect4::Position, 11>(*SharedInstances::getSolver11x4(), pos, threads); }
EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristicPosition11x4(const char* pos, int max_depth, int threads, double timeout_ms) { return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<11, 4>, GameSolver::Connect4::GenericPosition<11, 4>, 11>(*SharedInstances::getHeuristicSolver11x4(), pos, max_depth, threads, timeout_ms); }
EMSCRIPTEN_KEEPALIVE void releaseSolver11x4() { SharedInstances::releaseSolver11x4(); SharedInstances::releaseHeuristicSolver11x4(); }
}
