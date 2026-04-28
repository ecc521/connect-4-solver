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
// 
// These explicit `EMSCRIPTEN_KEEPALIVE` functions act as the C-API boundary.
// They replace the legacy "dimension-specific" functions (e.g. `analyzePosition7x6`)
// with dynamic routing parameters (`w`, `h`, `is_heuristic`). This allows the 
// TypeScript wrapper to instantiate the correct C++ template at runtime dynamically.
// ==========================================
extern "C" {

EMSCRIPTEN_KEEPALIVE void* createCache(int w, int h, size_t bytes, bool is_heuristic) {
    if (is_heuristic) {
        if (w == 6 && h == 5) return GameSolver::Connect4::HeuristicSolver<6, 5>::createCache(bytes).release();
        if (w == 6 && h == 6) return GameSolver::Connect4::HeuristicSolver<6, 6>::createCache(bytes).release();
        if (w == 7 && h == 6) return GameSolver::Connect4::HeuristicSolver<7, 6>::createCache(bytes).release();
        if (w == 7 && h == 7) return GameSolver::Connect4::HeuristicSolver<7, 7>::createCache(bytes).release();
        if (w == 8 && h == 6) return GameSolver::Connect4::HeuristicSolver<8, 6>::createCache(bytes).release();
        if (w == 9 && h == 7) return GameSolver::Connect4::HeuristicSolver<9, 7>::createCache(bytes).release();
        if (w == 8 && h == 8) return GameSolver::Connect4::HeuristicSolver<8, 8>::createCache(bytes).release();
        if (w == 10 && h == 7) return GameSolver::Connect4::HeuristicSolver<10, 7>::createCache(bytes).release();
        if (w == 9 && h == 9) return GameSolver::Connect4::HeuristicSolver<9, 9>::createCache(bytes).release();
        if (w == 10 && h == 10) return GameSolver::Connect4::HeuristicSolver<10, 10>::createCache(bytes).release();
        if (w == 9 && h == 6) return GameSolver::Connect4::HeuristicSolver<9, 6>::createCache(bytes).release();
        if (w == 11 && h == 4) return GameSolver::Connect4::HeuristicSolver<11, 4>::createCache(bytes).release();
    } else {
        if (w == 6 && h == 5) return C4_6x5::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 6 && h == 6) return C4_6x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 7 && h == 6) return C4_7x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 7 && h == 7) return C4_7x7::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 8 && h == 6) return C4_8x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 9 && h == 7) return C4_9x7::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 9 && h == 6) return C4_9x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 11 && h == 4) return C4_11x4::GameSolver::Connect4::Solver::createCache(bytes).release();
    }
    return nullptr;
}

EMSCRIPTEN_KEEPALIVE void destroyCache(void* cache) {
    delete static_cast<GameSolver::Connect4::Cache*>(cache);
}

EMSCRIPTEN_KEEPALIVE void* createSolver(int w, int h, void* cache, bool is_heuristic) {
    auto c = static_cast<GameSolver::Connect4::Cache*>(cache);
    if (is_heuristic) {
        if (w == 6 && h == 5) return GameSolver::Connect4::HeuristicSolver<6, 5>::createWithCache(c).release();
        if (w == 6 && h == 6) return GameSolver::Connect4::HeuristicSolver<6, 6>::createWithCache(c).release();
        if (w == 7 && h == 6) return GameSolver::Connect4::HeuristicSolver<7, 6>::createWithCache(c).release();
        if (w == 7 && h == 7) return GameSolver::Connect4::HeuristicSolver<7, 7>::createWithCache(c).release();
        if (w == 8 && h == 6) return GameSolver::Connect4::HeuristicSolver<8, 6>::createWithCache(c).release();
        if (w == 9 && h == 7) return GameSolver::Connect4::HeuristicSolver<9, 7>::createWithCache(c).release();
        if (w == 8 && h == 8) return GameSolver::Connect4::HeuristicSolver<8, 8>::createWithCache(c).release();
        if (w == 10 && h == 7) return GameSolver::Connect4::HeuristicSolver<10, 7>::createWithCache(c).release();
        if (w == 9 && h == 9) return GameSolver::Connect4::HeuristicSolver<9, 9>::createWithCache(c).release();
        if (w == 10 && h == 10) return GameSolver::Connect4::HeuristicSolver<10, 10>::createWithCache(c).release();
        if (w == 9 && h == 6) return GameSolver::Connect4::HeuristicSolver<9, 6>::createWithCache(c).release();
        if (w == 11 && h == 4) return GameSolver::Connect4::HeuristicSolver<11, 4>::createWithCache(c).release();
    } else {
        if (w == 6 && h == 5) return C4_6x5::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 6 && h == 6) return C4_6x6::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 7 && h == 6) return C4_7x6::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 7 && h == 7) return C4_7x7::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 8 && h == 6) return C4_8x6::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 9 && h == 7) return C4_9x7::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 9 && h == 6) return C4_9x6::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 11 && h == 4) return C4_11x4::GameSolver::Connect4::Solver::createWithCache(c).release();
    }
    return nullptr;
}

EMSCRIPTEN_KEEPALIVE void destroySolver(int w, int h, void* solver, bool is_heuristic) {
    if (is_heuristic) {
        if (w == 6 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver);
        else if (w == 6 && h == 6) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver);
        else if (w == 7 && h == 6) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver);
        else if (w == 7 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver);
        else if (w == 8 && h == 6) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver);
        else if (w == 9 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver);
        else if (w == 8 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver);
        else if (w == 10 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver);
        else if (w == 9 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver);
        else if (w == 10 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver);
        else if (w == 9 && h == 6) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver);
        else if (w == 11 && h == 4) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver);
    } else {
        if (w == 6 && h == 5) delete static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver);
        else if (w == 6 && h == 6) delete static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver);
        else if (w == 7 && h == 6) delete static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver);
        else if (w == 7 && h == 7) delete static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver);
        else if (w == 8 && h == 6) delete static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver);
        else if (w == 9 && h == 7) delete static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver);
        else if (w == 9 && h == 6) delete static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver);
        else if (w == 11 && h == 4) delete static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver);
    }
}

EMSCRIPTEN_KEEPALIVE void loadBook(int w, int h, void* solver, const char* path) {
    std::string p(path);
    if (w == 6 && h == 5) static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver)->loadBook(p);
    else if (w == 6 && h == 6) static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver)->loadBook(p);
    else if (w == 7 && h == 6) static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver)->loadBook(p);
    else if (w == 7 && h == 7) static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver)->loadBook(p);
    else if (w == 8 && h == 6) static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver)->loadBook(p);
    else if (w == 9 && h == 7) static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver)->loadBook(p);
    else if (w == 9 && h == 6) static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver)->loadBook(p);
    else if (w == 11 && h == 4) static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver)->loadBook(p);
}

EMSCRIPTEN_KEEPALIVE int32_t* analyzeExact(int w, int h, void* solver, const char* pos, int threads) {
    if (w == 6 && h == 5) return runAnalysis<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6>(*static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver), pos, threads);
    if (w == 6 && h == 6) return runAnalysis<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6>(*static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver), pos, threads);
    if (w == 7 && h == 6) return runAnalysis<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7>(*static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver), pos, threads);
    if (w == 7 && h == 7) return runAnalysis<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7>(*static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver), pos, threads);
    if (w == 8 && h == 6) return runAnalysis<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8>(*static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver), pos, threads);
    if (w == 9 && h == 7) return runAnalysis<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9>(*static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver), pos, threads);
    if (w == 9 && h == 6) return runAnalysis<C4_9x6::GameSolver::Connect4::Solver, C4_9x6::GameSolver::Connect4::Position, 9>(*static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver), pos, threads);
    if (w == 11 && h == 4) return runAnalysis<C4_11x4::GameSolver::Connect4::Solver, C4_11x4::GameSolver::Connect4::Position, 11>(*static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver), pos, threads);
    return nullptr;
}

EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristic(int w, int h, void* solver, const char* pos, int threads, int max_depth, double timeout_ms) {
    if (w == 6 && h == 5) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 6 && h == 6) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 7 && h == 6) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 7 && h == 7) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 8 && h == 6) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 9 && h == 7) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 8 && h == 8) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 10 && h == 7) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 9 && h == 9) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 10 && h == 10) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 9 && h == 6) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 6>, GameSolver::Connect4::GenericPosition<9, 6>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 11 && h == 4) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<11, 4>, GameSolver::Connect4::GenericPosition<11, 4>, 11>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver), pos, max_depth, threads, timeout_ms);
    return nullptr;
}

EMSCRIPTEN_KEEPALIVE uint64_t getNodeCount(int w, int h, void* solver, bool is_heuristic) {
    if (is_heuristic) {
        if (w == 6 && h == 5) return static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver)->getNodeCount();
        if (w == 6 && h == 6) return static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver)->getNodeCount();
        if (w == 7 && h == 6) return static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver)->getNodeCount();
        if (w == 7 && h == 7) return static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver)->getNodeCount();
        if (w == 8 && h == 6) return static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver)->getNodeCount();
        if (w == 9 && h == 7) return static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver)->getNodeCount();
        if (w == 8 && h == 8) return static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver)->getNodeCount();
        if (w == 10 && h == 7) return static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver)->getNodeCount();
        if (w == 9 && h == 9) return static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver)->getNodeCount();
        if (w == 10 && h == 10) return static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver)->getNodeCount();
        if (w == 9 && h == 6) return static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver)->getNodeCount();
        if (w == 11 && h == 4) return static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver)->getNodeCount();
    } else {
        if (w == 6 && h == 5) return static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 6 && h == 6) return static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 7 && h == 6) return static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 7 && h == 7) return static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 8 && h == 6) return static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 9 && h == 7) return static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 9 && h == 6) return static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 11 && h == 4) return static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
    }
    return 0;
}

} // extern "C"
