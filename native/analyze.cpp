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
#include "OpeningBook.hpp"

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
int32_t* runAnalysis(CoreSolver& solver, const char* positionCharArr, bool weak, int threads, void* book_ptr) {
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
    const CoreBook* book = static_cast<const CoreBook*>(book_ptr);
    std::vector<int> scores = solver.analyze(P, weak, threads, book);
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
        if (w == 6 && h == 7) return GameSolver::Connect4::HeuristicSolver<6, 7>::createCache(bytes).release();
        if (w == 6 && h == 8) return GameSolver::Connect4::HeuristicSolver<6, 6>::createCache(bytes).release();
        if (w == 6 && h == 9) return GameSolver::Connect4::HeuristicSolver<6, 9>::createCache(bytes).release();
        if (w == 6 && h == 10) return GameSolver::Connect4::HeuristicSolver<6, 10>::createCache(bytes).release();
        if (w == 6 && h == 11) return GameSolver::Connect4::HeuristicSolver<6, 11>::createCache(bytes).release();
        if (w == 6 && h == 12) return GameSolver::Connect4::HeuristicSolver<6, 12>::createCache(bytes).release();
        if (w == 7 && h == 5) return GameSolver::Connect4::HeuristicSolver<7, 5>::createCache(bytes).release();
        if (w == 7 && h == 8) return GameSolver::Connect4::HeuristicSolver<7, 7>::createCache(bytes).release();
        if (w == 7 && h == 9) return GameSolver::Connect4::HeuristicSolver<7, 9>::createCache(bytes).release();
        if (w == 7 && h == 10) return GameSolver::Connect4::HeuristicSolver<7, 10>::createCache(bytes).release();
        if (w == 7 && h == 11) return GameSolver::Connect4::HeuristicSolver<7, 11>::createCache(bytes).release();
        if (w == 7 && h == 12) return GameSolver::Connect4::HeuristicSolver<7, 12>::createCache(bytes).release();
        if (w == 8 && h == 5) return GameSolver::Connect4::HeuristicSolver<8, 5>::createCache(bytes).release();
        if (w == 8 && h == 7) return GameSolver::Connect4::HeuristicSolver<8, 7>::createCache(bytes).release();
        if (w == 8 && h == 9) return GameSolver::Connect4::HeuristicSolver<8, 9>::createCache(bytes).release();
        if (w == 8 && h == 10) return GameSolver::Connect4::HeuristicSolver<8, 10>::createCache(bytes).release();
        if (w == 8 && h == 11) return GameSolver::Connect4::HeuristicSolver<8, 11>::createCache(bytes).release();
        if (w == 8 && h == 12) return GameSolver::Connect4::HeuristicSolver<8, 12>::createCache(bytes).release();
        if (w == 9 && h == 5) return GameSolver::Connect4::HeuristicSolver<9, 5>::createCache(bytes).release();
        if (w == 9 && h == 8) return GameSolver::Connect4::HeuristicSolver<9, 9>::createCache(bytes).release();
        if (w == 9 && h == 10) return GameSolver::Connect4::HeuristicSolver<9, 10>::createCache(bytes).release();
        if (w == 9 && h == 11) return GameSolver::Connect4::HeuristicSolver<9, 11>::createCache(bytes).release();
        if (w == 9 && h == 12) return GameSolver::Connect4::HeuristicSolver<9, 12>::createCache(bytes).release();
        if (w == 10 && h == 5) return GameSolver::Connect4::HeuristicSolver<10, 5>::createCache(bytes).release();
        if (w == 10 && h == 6) return GameSolver::Connect4::HeuristicSolver<10, 6>::createCache(bytes).release();
        if (w == 10 && h == 8) return GameSolver::Connect4::HeuristicSolver<10, 10>::createCache(bytes).release();
        if (w == 10 && h == 9) return GameSolver::Connect4::HeuristicSolver<10, 9>::createCache(bytes).release();
        if (w == 10 && h == 11) return GameSolver::Connect4::HeuristicSolver<10, 11>::createCache(bytes).release();
        if (w == 11 && h == 5) return GameSolver::Connect4::HeuristicSolver<11, 5>::createCache(bytes).release();
        if (w == 11 && h == 6) return GameSolver::Connect4::HeuristicSolver<11, 6>::createCache(bytes).release();
        if (w == 11 && h == 7) return GameSolver::Connect4::HeuristicSolver<11, 7>::createCache(bytes).release();
        if (w == 11 && h == 8) return GameSolver::Connect4::HeuristicSolver<11, 11>::createCache(bytes).release();
        if (w == 11 && h == 9) return GameSolver::Connect4::HeuristicSolver<11, 9>::createCache(bytes).release();
        if (w == 11 && h == 10) return GameSolver::Connect4::HeuristicSolver<11, 10>::createCache(bytes).release();
        if (w == 12 && h == 5) return GameSolver::Connect4::HeuristicSolver<12, 5>::createCache(bytes).release();
        if (w == 12 && h == 6) return GameSolver::Connect4::HeuristicSolver<12, 6>::createCache(bytes).release();
        if (w == 12 && h == 7) return GameSolver::Connect4::HeuristicSolver<12, 7>::createCache(bytes).release();
        if (w == 12 && h == 8) return GameSolver::Connect4::HeuristicSolver<12, 12>::createCache(bytes).release();
        if (w == 12 && h == 9) return GameSolver::Connect4::HeuristicSolver<12, 9>::createCache(bytes).release();
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
        if (w == 4 && h == 4) return C4_4x4::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 4 && h == 5) return C4_4x5::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 4 && h == 6) return C4_4x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 4 && h == 7) return C4_4x7::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 4 && h == 8) return C4_4x8::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 4 && h == 9) return C4_4x9::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 4 && h == 10) return C4_4x10::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 4 && h == 11) return C4_4x11::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 4 && h == 12) return C4_4x12::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 5 && h == 4) return C4_5x4::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 5 && h == 5) return C4_5x5::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 5 && h == 6) return C4_5x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 5 && h == 7) return C4_5x7::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 5 && h == 8) return C4_5x8::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 5 && h == 9) return C4_5x9::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 5 && h == 10) return C4_5x10::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 5 && h == 11) return C4_5x11::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 5 && h == 12) return C4_5x12::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 6 && h == 4) return C4_6x4::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 6 && h == 7) return C4_6x7::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 6 && h == 8) return C4_6x8::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 6 && h == 9) return C4_6x9::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 6 && h == 10) return C4_6x10::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 6 && h == 11) return C4_6x11::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 6 && h == 12) return C4_6x12::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 7 && h == 4) return C4_7x4::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 7 && h == 5) return C4_7x5::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 7 && h == 8) return C4_7x8::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 7 && h == 9) return C4_7x9::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 7 && h == 10) return C4_7x10::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 7 && h == 11) return C4_7x11::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 7 && h == 12) return C4_7x12::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 8 && h == 4) return C4_8x4::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 8 && h == 5) return C4_8x5::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 8 && h == 7) return C4_8x7::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 8 && h == 9) return C4_8x9::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 8 && h == 10) return C4_8x10::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 8 && h == 11) return C4_8x11::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 8 && h == 12) return C4_8x12::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 9 && h == 4) return C4_9x4::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 9 && h == 5) return C4_9x5::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 9 && h == 8) return C4_9x8::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 9 && h == 10) return C4_9x10::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 9 && h == 11) return C4_9x11::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 9 && h == 12) return C4_9x12::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 10 && h == 4) return C4_10x4::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 10 && h == 5) return C4_10x5::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 10 && h == 6) return C4_10x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 10 && h == 8) return C4_10x8::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 10 && h == 9) return C4_10x9::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 10 && h == 11) return C4_10x11::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 11 && h == 5) return C4_11x5::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 11 && h == 6) return C4_11x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 11 && h == 7) return C4_11x7::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 11 && h == 8) return C4_11x8::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 11 && h == 9) return C4_11x9::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 11 && h == 10) return C4_11x10::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 12 && h == 4) return C4_12x4::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 12 && h == 5) return C4_12x5::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 12 && h == 6) return C4_12x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 12 && h == 7) return C4_12x7::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 12 && h == 8) return C4_12x8::GameSolver::Connect4::Solver::createCache(bytes).release();
        if (w == 12 && h == 9) return C4_12x9::GameSolver::Connect4::Solver::createCache(bytes).release();
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
        if (w == 6 && h == 7) return GameSolver::Connect4::HeuristicSolver<6, 7>::createWithCache(c).release();
        if (w == 6 && h == 8) return GameSolver::Connect4::HeuristicSolver<6, 6>::createWithCache(c).release();
        if (w == 6 && h == 9) return GameSolver::Connect4::HeuristicSolver<6, 9>::createWithCache(c).release();
        if (w == 6 && h == 10) return GameSolver::Connect4::HeuristicSolver<6, 10>::createWithCache(c).release();
        if (w == 6 && h == 11) return GameSolver::Connect4::HeuristicSolver<6, 11>::createWithCache(c).release();
        if (w == 6 && h == 12) return GameSolver::Connect4::HeuristicSolver<6, 12>::createWithCache(c).release();
        if (w == 7 && h == 5) return GameSolver::Connect4::HeuristicSolver<7, 5>::createWithCache(c).release();
        if (w == 7 && h == 8) return GameSolver::Connect4::HeuristicSolver<7, 7>::createWithCache(c).release();
        if (w == 7 && h == 9) return GameSolver::Connect4::HeuristicSolver<7, 9>::createWithCache(c).release();
        if (w == 7 && h == 10) return GameSolver::Connect4::HeuristicSolver<7, 10>::createWithCache(c).release();
        if (w == 7 && h == 11) return GameSolver::Connect4::HeuristicSolver<7, 11>::createWithCache(c).release();
        if (w == 7 && h == 12) return GameSolver::Connect4::HeuristicSolver<7, 12>::createWithCache(c).release();
        if (w == 8 && h == 5) return GameSolver::Connect4::HeuristicSolver<8, 5>::createWithCache(c).release();
        if (w == 8 && h == 7) return GameSolver::Connect4::HeuristicSolver<8, 7>::createWithCache(c).release();
        if (w == 8 && h == 9) return GameSolver::Connect4::HeuristicSolver<8, 9>::createWithCache(c).release();
        if (w == 8 && h == 10) return GameSolver::Connect4::HeuristicSolver<8, 10>::createWithCache(c).release();
        if (w == 8 && h == 11) return GameSolver::Connect4::HeuristicSolver<8, 11>::createWithCache(c).release();
        if (w == 8 && h == 12) return GameSolver::Connect4::HeuristicSolver<8, 12>::createWithCache(c).release();
        if (w == 9 && h == 5) return GameSolver::Connect4::HeuristicSolver<9, 5>::createWithCache(c).release();
        if (w == 9 && h == 8) return GameSolver::Connect4::HeuristicSolver<9, 9>::createWithCache(c).release();
        if (w == 9 && h == 10) return GameSolver::Connect4::HeuristicSolver<9, 10>::createWithCache(c).release();
        if (w == 9 && h == 11) return GameSolver::Connect4::HeuristicSolver<9, 11>::createWithCache(c).release();
        if (w == 9 && h == 12) return GameSolver::Connect4::HeuristicSolver<9, 12>::createWithCache(c).release();
        if (w == 10 && h == 5) return GameSolver::Connect4::HeuristicSolver<10, 5>::createWithCache(c).release();
        if (w == 10 && h == 6) return GameSolver::Connect4::HeuristicSolver<10, 6>::createWithCache(c).release();
        if (w == 10 && h == 8) return GameSolver::Connect4::HeuristicSolver<10, 10>::createWithCache(c).release();
        if (w == 10 && h == 9) return GameSolver::Connect4::HeuristicSolver<10, 9>::createWithCache(c).release();
        if (w == 10 && h == 11) return GameSolver::Connect4::HeuristicSolver<10, 11>::createWithCache(c).release();
        if (w == 11 && h == 5) return GameSolver::Connect4::HeuristicSolver<11, 5>::createWithCache(c).release();
        if (w == 11 && h == 6) return GameSolver::Connect4::HeuristicSolver<11, 6>::createWithCache(c).release();
        if (w == 11 && h == 7) return GameSolver::Connect4::HeuristicSolver<11, 7>::createWithCache(c).release();
        if (w == 11 && h == 8) return GameSolver::Connect4::HeuristicSolver<11, 11>::createWithCache(c).release();
        if (w == 11 && h == 9) return GameSolver::Connect4::HeuristicSolver<11, 9>::createWithCache(c).release();
        if (w == 11 && h == 10) return GameSolver::Connect4::HeuristicSolver<11, 10>::createWithCache(c).release();
        if (w == 12 && h == 5) return GameSolver::Connect4::HeuristicSolver<12, 5>::createWithCache(c).release();
        if (w == 12 && h == 6) return GameSolver::Connect4::HeuristicSolver<12, 6>::createWithCache(c).release();
        if (w == 12 && h == 7) return GameSolver::Connect4::HeuristicSolver<12, 7>::createWithCache(c).release();
        if (w == 12 && h == 8) return GameSolver::Connect4::HeuristicSolver<12, 12>::createWithCache(c).release();
        if (w == 12 && h == 9) return GameSolver::Connect4::HeuristicSolver<12, 9>::createWithCache(c).release();
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
        if (w == 4 && h == 4) return C4_4x4::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 4 && h == 5) return C4_4x5::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 4 && h == 6) return C4_4x6::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 4 && h == 7) return C4_4x7::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 4 && h == 8) return C4_4x8::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 4 && h == 9) return C4_4x9::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 4 && h == 10) return C4_4x10::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 4 && h == 11) return C4_4x11::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 4 && h == 12) return C4_4x12::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 5 && h == 4) return C4_5x4::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 5 && h == 5) return C4_5x5::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 5 && h == 6) return C4_5x6::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 5 && h == 7) return C4_5x7::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 5 && h == 8) return C4_5x8::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 5 && h == 9) return C4_5x9::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 5 && h == 10) return C4_5x10::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 5 && h == 11) return C4_5x11::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 5 && h == 12) return C4_5x12::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 6 && h == 4) return C4_6x4::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 6 && h == 7) return C4_6x7::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 6 && h == 8) return C4_6x8::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 6 && h == 9) return C4_6x9::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 6 && h == 10) return C4_6x10::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 6 && h == 11) return C4_6x11::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 6 && h == 12) return C4_6x12::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 7 && h == 4) return C4_7x4::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 7 && h == 5) return C4_7x5::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 7 && h == 8) return C4_7x8::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 7 && h == 9) return C4_7x9::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 7 && h == 10) return C4_7x10::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 7 && h == 11) return C4_7x11::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 7 && h == 12) return C4_7x12::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 8 && h == 4) return C4_8x4::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 8 && h == 5) return C4_8x5::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 8 && h == 7) return C4_8x7::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 8 && h == 9) return C4_8x9::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 8 && h == 10) return C4_8x10::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 8 && h == 11) return C4_8x11::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 8 && h == 12) return C4_8x12::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 9 && h == 4) return C4_9x4::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 9 && h == 5) return C4_9x5::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 9 && h == 8) return C4_9x8::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 9 && h == 10) return C4_9x10::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 9 && h == 11) return C4_9x11::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 9 && h == 12) return C4_9x12::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 10 && h == 4) return C4_10x4::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 10 && h == 5) return C4_10x5::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 10 && h == 6) return C4_10x6::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 10 && h == 8) return C4_10x8::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 10 && h == 9) return C4_10x9::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 10 && h == 11) return C4_10x11::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 11 && h == 5) return C4_11x5::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 11 && h == 6) return C4_11x6::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 11 && h == 7) return C4_11x7::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 11 && h == 8) return C4_11x8::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 11 && h == 9) return C4_11x9::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 11 && h == 10) return C4_11x10::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 12 && h == 4) return C4_12x4::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 12 && h == 5) return C4_12x5::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 12 && h == 6) return C4_12x6::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 12 && h == 7) return C4_12x7::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 12 && h == 8) return C4_12x8::GameSolver::Connect4::Solver::createWithCache(c).release();
        if (w == 12 && h == 9) return C4_12x9::GameSolver::Connect4::Solver::createWithCache(c).release();
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
        else if (w == 6 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 7>*>(solver);
        else if (w == 6 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver);
        else if (w == 6 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 9>*>(solver);
        else if (w == 6 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 10>*>(solver);
        else if (w == 6 && h == 11) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 11>*>(solver);
        else if (w == 6 && h == 12) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 12>*>(solver);
        else if (w == 7 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 5>*>(solver);
        else if (w == 7 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver);
        else if (w == 7 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 9>*>(solver);
        else if (w == 7 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 10>*>(solver);
        else if (w == 7 && h == 11) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 11>*>(solver);
        else if (w == 7 && h == 12) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 12>*>(solver);
        else if (w == 8 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 5>*>(solver);
        else if (w == 8 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 7>*>(solver);
        else if (w == 8 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 9>*>(solver);
        else if (w == 8 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 10>*>(solver);
        else if (w == 8 && h == 11) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 11>*>(solver);
        else if (w == 8 && h == 12) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 12>*>(solver);
        else if (w == 9 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 5>*>(solver);
        else if (w == 9 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver);
        else if (w == 9 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 10>*>(solver);
        else if (w == 9 && h == 11) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 11>*>(solver);
        else if (w == 9 && h == 12) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 12>*>(solver);
        else if (w == 10 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 5>*>(solver);
        else if (w == 10 && h == 6) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 6>*>(solver);
        else if (w == 10 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver);
        else if (w == 10 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 9>*>(solver);
        else if (w == 10 && h == 11) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 11>*>(solver);
        else if (w == 11 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 5>*>(solver);
        else if (w == 11 && h == 6) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 6>*>(solver);
        else if (w == 11 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 7>*>(solver);
        else if (w == 11 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 11>*>(solver);
        else if (w == 11 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 9>*>(solver);
        else if (w == 11 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 10>*>(solver);
        else if (w == 12 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<12, 5>*>(solver);
        else if (w == 12 && h == 6) delete static_cast<GameSolver::Connect4::HeuristicSolver<12, 6>*>(solver);
        else if (w == 12 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<12, 7>*>(solver);
        else if (w == 12 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<12, 12>*>(solver);
        else if (w == 12 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<12, 9>*>(solver);
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
        else if (w == 4 && h == 4) delete static_cast<C4_4x4::GameSolver::Connect4::Solver*>(solver);
        else if (w == 4 && h == 5) delete static_cast<C4_4x5::GameSolver::Connect4::Solver*>(solver);
        else if (w == 4 && h == 6) delete static_cast<C4_4x6::GameSolver::Connect4::Solver*>(solver);
        else if (w == 4 && h == 7) delete static_cast<C4_4x7::GameSolver::Connect4::Solver*>(solver);
        else if (w == 4 && h == 8) delete static_cast<C4_4x8::GameSolver::Connect4::Solver*>(solver);
        else if (w == 4 && h == 9) delete static_cast<C4_4x9::GameSolver::Connect4::Solver*>(solver);
        else if (w == 4 && h == 10) delete static_cast<C4_4x10::GameSolver::Connect4::Solver*>(solver);
        else if (w == 4 && h == 11) delete static_cast<C4_4x11::GameSolver::Connect4::Solver*>(solver);
        else if (w == 4 && h == 12) delete static_cast<C4_4x12::GameSolver::Connect4::Solver*>(solver);
        else if (w == 5 && h == 4) delete static_cast<C4_5x4::GameSolver::Connect4::Solver*>(solver);
        else if (w == 5 && h == 5) delete static_cast<C4_5x5::GameSolver::Connect4::Solver*>(solver);
        else if (w == 5 && h == 6) delete static_cast<C4_5x6::GameSolver::Connect4::Solver*>(solver);
        else if (w == 5 && h == 7) delete static_cast<C4_5x7::GameSolver::Connect4::Solver*>(solver);
        else if (w == 5 && h == 8) delete static_cast<C4_5x8::GameSolver::Connect4::Solver*>(solver);
        else if (w == 5 && h == 9) delete static_cast<C4_5x9::GameSolver::Connect4::Solver*>(solver);
        else if (w == 5 && h == 10) delete static_cast<C4_5x10::GameSolver::Connect4::Solver*>(solver);
        else if (w == 5 && h == 11) delete static_cast<C4_5x11::GameSolver::Connect4::Solver*>(solver);
        else if (w == 5 && h == 12) delete static_cast<C4_5x12::GameSolver::Connect4::Solver*>(solver);
        else if (w == 6 && h == 4) delete static_cast<C4_6x4::GameSolver::Connect4::Solver*>(solver);
        else if (w == 6 && h == 7) delete static_cast<C4_6x7::GameSolver::Connect4::Solver*>(solver);
        else if (w == 6 && h == 8) delete static_cast<C4_6x8::GameSolver::Connect4::Solver*>(solver);
        else if (w == 6 && h == 9) delete static_cast<C4_6x9::GameSolver::Connect4::Solver*>(solver);
        else if (w == 6 && h == 10) delete static_cast<C4_6x10::GameSolver::Connect4::Solver*>(solver);
        else if (w == 6 && h == 11) delete static_cast<C4_6x11::GameSolver::Connect4::Solver*>(solver);
        else if (w == 6 && h == 12) delete static_cast<C4_6x12::GameSolver::Connect4::Solver*>(solver);
        else if (w == 7 && h == 4) delete static_cast<C4_7x4::GameSolver::Connect4::Solver*>(solver);
        else if (w == 7 && h == 5) delete static_cast<C4_7x5::GameSolver::Connect4::Solver*>(solver);
        else if (w == 7 && h == 8) delete static_cast<C4_7x8::GameSolver::Connect4::Solver*>(solver);
        else if (w == 7 && h == 9) delete static_cast<C4_7x9::GameSolver::Connect4::Solver*>(solver);
        else if (w == 7 && h == 10) delete static_cast<C4_7x10::GameSolver::Connect4::Solver*>(solver);
        else if (w == 7 && h == 11) delete static_cast<C4_7x11::GameSolver::Connect4::Solver*>(solver);
        else if (w == 7 && h == 12) delete static_cast<C4_7x12::GameSolver::Connect4::Solver*>(solver);
        else if (w == 8 && h == 4) delete static_cast<C4_8x4::GameSolver::Connect4::Solver*>(solver);
        else if (w == 8 && h == 5) delete static_cast<C4_8x5::GameSolver::Connect4::Solver*>(solver);
        else if (w == 8 && h == 7) delete static_cast<C4_8x7::GameSolver::Connect4::Solver*>(solver);
        else if (w == 8 && h == 9) delete static_cast<C4_8x9::GameSolver::Connect4::Solver*>(solver);
        else if (w == 8 && h == 10) delete static_cast<C4_8x10::GameSolver::Connect4::Solver*>(solver);
        else if (w == 8 && h == 11) delete static_cast<C4_8x11::GameSolver::Connect4::Solver*>(solver);
        else if (w == 8 && h == 12) delete static_cast<C4_8x12::GameSolver::Connect4::Solver*>(solver);
        else if (w == 9 && h == 4) delete static_cast<C4_9x4::GameSolver::Connect4::Solver*>(solver);
        else if (w == 9 && h == 5) delete static_cast<C4_9x5::GameSolver::Connect4::Solver*>(solver);
        else if (w == 9 && h == 8) delete static_cast<C4_9x8::GameSolver::Connect4::Solver*>(solver);
        else if (w == 9 && h == 10) delete static_cast<C4_9x10::GameSolver::Connect4::Solver*>(solver);
        else if (w == 9 && h == 11) delete static_cast<C4_9x11::GameSolver::Connect4::Solver*>(solver);
        else if (w == 9 && h == 12) delete static_cast<C4_9x12::GameSolver::Connect4::Solver*>(solver);
        else if (w == 10 && h == 4) delete static_cast<C4_10x4::GameSolver::Connect4::Solver*>(solver);
        else if (w == 10 && h == 5) delete static_cast<C4_10x5::GameSolver::Connect4::Solver*>(solver);
        else if (w == 10 && h == 6) delete static_cast<C4_10x6::GameSolver::Connect4::Solver*>(solver);
        else if (w == 10 && h == 8) delete static_cast<C4_10x8::GameSolver::Connect4::Solver*>(solver);
        else if (w == 10 && h == 9) delete static_cast<C4_10x9::GameSolver::Connect4::Solver*>(solver);
        else if (w == 10 && h == 11) delete static_cast<C4_10x11::GameSolver::Connect4::Solver*>(solver);
        else if (w == 11 && h == 5) delete static_cast<C4_11x5::GameSolver::Connect4::Solver*>(solver);
        else if (w == 11 && h == 6) delete static_cast<C4_11x6::GameSolver::Connect4::Solver*>(solver);
        else if (w == 11 && h == 7) delete static_cast<C4_11x7::GameSolver::Connect4::Solver*>(solver);
        else if (w == 11 && h == 8) delete static_cast<C4_11x8::GameSolver::Connect4::Solver*>(solver);
        else if (w == 11 && h == 9) delete static_cast<C4_11x9::GameSolver::Connect4::Solver*>(solver);
        else if (w == 11 && h == 10) delete static_cast<C4_11x10::GameSolver::Connect4::Solver*>(solver);
        else if (w == 12 && h == 4) delete static_cast<C4_12x4::GameSolver::Connect4::Solver*>(solver);
        else if (w == 12 && h == 5) delete static_cast<C4_12x5::GameSolver::Connect4::Solver*>(solver);
        else if (w == 12 && h == 6) delete static_cast<C4_12x6::GameSolver::Connect4::Solver*>(solver);
        else if (w == 12 && h == 7) delete static_cast<C4_12x7::GameSolver::Connect4::Solver*>(solver);
        else if (w == 12 && h == 8) delete static_cast<C4_12x8::GameSolver::Connect4::Solver*>(solver);
        else if (w == 12 && h == 9) delete static_cast<C4_12x9::GameSolver::Connect4::Solver*>(solver);
        else if (w == 9 && h == 7) delete static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver);
        else if (w == 9 && h == 6) delete static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver);
        else if (w == 11 && h == 4) delete static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver);
    }
}

EMSCRIPTEN_KEEPALIVE void* createBook(int w, int h, const char* path) {
    std::string p(path);
    if (w == 6 && h == 5) return C4_6x5::GameSolver::Connect4::OpeningBookBase<6, 5>::load(p, w, h).release();
    if (w == 6 && h == 6) return C4_6x6::GameSolver::Connect4::OpeningBookBase<6, 6>::load(p, w, h).release();
    if (w == 7 && h == 6) return C4_7x6::GameSolver::Connect4::OpeningBookBase<7, 6>::load(p, w, h).release();
    if (w == 7 && h == 7) return C4_7x7::GameSolver::Connect4::OpeningBookBase<7, 7>::load(p, w, h).release();
    if (w == 8 && h == 6) return C4_8x6::GameSolver::Connect4::OpeningBookBase<8, 6>::load(p, w, h).release();
    if (w == 4 && h == 4) return C4_4x4::GameSolver::Connect4::OpeningBookBase<4, 4>::load(p, w, h).release();
    if (w == 4 && h == 5) return C4_4x5::GameSolver::Connect4::OpeningBookBase<4, 5>::load(p, w, h).release();
    if (w == 4 && h == 6) return C4_4x6::GameSolver::Connect4::OpeningBookBase<4, 6>::load(p, w, h).release();
    if (w == 4 && h == 7) return C4_4x7::GameSolver::Connect4::OpeningBookBase<4, 7>::load(p, w, h).release();
    if (w == 4 && h == 8) return C4_4x8::GameSolver::Connect4::OpeningBookBase<4, 4>::load(p, w, h).release();
    if (w == 4 && h == 9) return C4_4x9::GameSolver::Connect4::OpeningBookBase<4, 9>::load(p, w, h).release();
    if (w == 4 && h == 10) return C4_4x10::GameSolver::Connect4::OpeningBookBase<4, 10>::load(p, w, h).release();
    if (w == 4 && h == 11) return C4_4x11::GameSolver::Connect4::OpeningBookBase<4, 11>::load(p, w, h).release();
    if (w == 4 && h == 12) return C4_4x12::GameSolver::Connect4::OpeningBookBase<4, 12>::load(p, w, h).release();
    if (w == 5 && h == 4) return C4_5x4::GameSolver::Connect4::OpeningBookBase<5, 4>::load(p, w, h).release();
    if (w == 5 && h == 5) return C4_5x5::GameSolver::Connect4::OpeningBookBase<5, 5>::load(p, w, h).release();
    if (w == 5 && h == 6) return C4_5x6::GameSolver::Connect4::OpeningBookBase<5, 6>::load(p, w, h).release();
    if (w == 5 && h == 7) return C4_5x7::GameSolver::Connect4::OpeningBookBase<5, 7>::load(p, w, h).release();
    if (w == 5 && h == 8) return C4_5x8::GameSolver::Connect4::OpeningBookBase<5, 5>::load(p, w, h).release();
    if (w == 5 && h == 9) return C4_5x9::GameSolver::Connect4::OpeningBookBase<5, 9>::load(p, w, h).release();
    if (w == 5 && h == 10) return C4_5x10::GameSolver::Connect4::OpeningBookBase<5, 10>::load(p, w, h).release();
    if (w == 5 && h == 11) return C4_5x11::GameSolver::Connect4::OpeningBookBase<5, 11>::load(p, w, h).release();
    if (w == 5 && h == 12) return C4_5x12::GameSolver::Connect4::OpeningBookBase<5, 12>::load(p, w, h).release();
    if (w == 6 && h == 4) return C4_6x4::GameSolver::Connect4::OpeningBookBase<6, 4>::load(p, w, h).release();
    if (w == 6 && h == 7) return C4_6x7::GameSolver::Connect4::OpeningBookBase<6, 7>::load(p, w, h).release();
    if (w == 6 && h == 8) return C4_6x8::GameSolver::Connect4::OpeningBookBase<6, 6>::load(p, w, h).release();
    if (w == 6 && h == 9) return C4_6x9::GameSolver::Connect4::OpeningBookBase<6, 9>::load(p, w, h).release();
    if (w == 6 && h == 10) return C4_6x10::GameSolver::Connect4::OpeningBookBase<6, 10>::load(p, w, h).release();
    if (w == 6 && h == 11) return C4_6x11::GameSolver::Connect4::OpeningBookBase<6, 11>::load(p, w, h).release();
    if (w == 6 && h == 12) return C4_6x12::GameSolver::Connect4::OpeningBookBase<6, 12>::load(p, w, h).release();
    if (w == 7 && h == 4) return C4_7x4::GameSolver::Connect4::OpeningBookBase<7, 4>::load(p, w, h).release();
    if (w == 7 && h == 5) return C4_7x5::GameSolver::Connect4::OpeningBookBase<7, 5>::load(p, w, h).release();
    if (w == 7 && h == 8) return C4_7x8::GameSolver::Connect4::OpeningBookBase<7, 7>::load(p, w, h).release();
    if (w == 7 && h == 9) return C4_7x9::GameSolver::Connect4::OpeningBookBase<7, 9>::load(p, w, h).release();
    if (w == 7 && h == 10) return C4_7x10::GameSolver::Connect4::OpeningBookBase<7, 10>::load(p, w, h).release();
    if (w == 7 && h == 11) return C4_7x11::GameSolver::Connect4::OpeningBookBase<7, 11>::load(p, w, h).release();
    if (w == 7 && h == 12) return C4_7x12::GameSolver::Connect4::OpeningBookBase<7, 12>::load(p, w, h).release();
    if (w == 8 && h == 4) return C4_8x4::GameSolver::Connect4::OpeningBookBase<8, 4>::load(p, w, h).release();
    if (w == 8 && h == 5) return C4_8x5::GameSolver::Connect4::OpeningBookBase<8, 5>::load(p, w, h).release();
    if (w == 8 && h == 7) return C4_8x7::GameSolver::Connect4::OpeningBookBase<8, 7>::load(p, w, h).release();
    if (w == 8 && h == 9) return C4_8x9::GameSolver::Connect4::OpeningBookBase<8, 9>::load(p, w, h).release();
    if (w == 8 && h == 10) return C4_8x10::GameSolver::Connect4::OpeningBookBase<8, 10>::load(p, w, h).release();
    if (w == 8 && h == 11) return C4_8x11::GameSolver::Connect4::OpeningBookBase<8, 11>::load(p, w, h).release();
    if (w == 8 && h == 12) return C4_8x12::GameSolver::Connect4::OpeningBookBase<8, 12>::load(p, w, h).release();
    if (w == 9 && h == 4) return C4_9x4::GameSolver::Connect4::OpeningBookBase<9, 4>::load(p, w, h).release();
    if (w == 9 && h == 5) return C4_9x5::GameSolver::Connect4::OpeningBookBase<9, 5>::load(p, w, h).release();
    if (w == 9 && h == 8) return C4_9x8::GameSolver::Connect4::OpeningBookBase<9, 9>::load(p, w, h).release();
    if (w == 9 && h == 10) return C4_9x10::GameSolver::Connect4::OpeningBookBase<9, 10>::load(p, w, h).release();
    if (w == 9 && h == 11) return C4_9x11::GameSolver::Connect4::OpeningBookBase<9, 11>::load(p, w, h).release();
    if (w == 9 && h == 12) return C4_9x12::GameSolver::Connect4::OpeningBookBase<9, 12>::load(p, w, h).release();
    if (w == 10 && h == 4) return C4_10x4::GameSolver::Connect4::OpeningBookBase<10, 4>::load(p, w, h).release();
    if (w == 10 && h == 5) return C4_10x5::GameSolver::Connect4::OpeningBookBase<10, 5>::load(p, w, h).release();
    if (w == 10 && h == 6) return C4_10x6::GameSolver::Connect4::OpeningBookBase<10, 6>::load(p, w, h).release();
    if (w == 10 && h == 8) return C4_10x8::GameSolver::Connect4::OpeningBookBase<10, 10>::load(p, w, h).release();
    if (w == 10 && h == 9) return C4_10x9::GameSolver::Connect4::OpeningBookBase<10, 9>::load(p, w, h).release();
    if (w == 10 && h == 11) return C4_10x11::GameSolver::Connect4::OpeningBookBase<10, 11>::load(p, w, h).release();
    if (w == 11 && h == 5) return C4_11x5::GameSolver::Connect4::OpeningBookBase<11, 5>::load(p, w, h).release();
    if (w == 11 && h == 6) return C4_11x6::GameSolver::Connect4::OpeningBookBase<11, 6>::load(p, w, h).release();
    if (w == 11 && h == 7) return C4_11x7::GameSolver::Connect4::OpeningBookBase<11, 7>::load(p, w, h).release();
    if (w == 11 && h == 8) return C4_11x8::GameSolver::Connect4::OpeningBookBase<11, 11>::load(p, w, h).release();
    if (w == 11 && h == 9) return C4_11x9::GameSolver::Connect4::OpeningBookBase<11, 9>::load(p, w, h).release();
    if (w == 11 && h == 10) return C4_11x10::GameSolver::Connect4::OpeningBookBase<11, 10>::load(p, w, h).release();
    if (w == 12 && h == 4) return C4_12x4::GameSolver::Connect4::OpeningBookBase<12, 4>::load(p, w, h).release();
    if (w == 12 && h == 5) return C4_12x5::GameSolver::Connect4::OpeningBookBase<12, 5>::load(p, w, h).release();
    if (w == 12 && h == 6) return C4_12x6::GameSolver::Connect4::OpeningBookBase<12, 6>::load(p, w, h).release();
    if (w == 12 && h == 7) return C4_12x7::GameSolver::Connect4::OpeningBookBase<12, 7>::load(p, w, h).release();
    if (w == 12 && h == 8) return C4_12x8::GameSolver::Connect4::OpeningBookBase<12, 12>::load(p, w, h).release();
    if (w == 12 && h == 9) return C4_12x9::GameSolver::Connect4::OpeningBookBase<12, 9>::load(p, w, h).release();
    if (w == 9 && h == 7) return C4_9x7::GameSolver::Connect4::OpeningBookBase<9, 7>::load(p, w, h).release();
    if (w == 9 && h == 6) return C4_9x6::GameSolver::Connect4::OpeningBookBase<9, 6>::load(p, w, h).release();
    if (w == 11 && h == 4) return C4_11x4::GameSolver::Connect4::OpeningBookBase<11, 4>::load(p, w, h).release();
    return nullptr;
}

EMSCRIPTEN_KEEPALIVE void destroyBook(int w, int h, void* book_ptr) {
    if (w == 6 && h == 5) delete static_cast<C4_6x5::GameSolver::Connect4::OpeningBookBase<6, 5>*>(book_ptr);
    else if (w == 6 && h == 6) delete static_cast<C4_6x6::GameSolver::Connect4::OpeningBookBase<6, 6>*>(book_ptr);
    else if (w == 7 && h == 6) delete static_cast<C4_7x6::GameSolver::Connect4::OpeningBookBase<7, 6>*>(book_ptr);
    else if (w == 7 && h == 7) delete static_cast<C4_7x7::GameSolver::Connect4::OpeningBookBase<7, 7>*>(book_ptr);
    else if (w == 8 && h == 6) delete static_cast<C4_8x6::GameSolver::Connect4::OpeningBookBase<8, 6>*>(book_ptr);
    else if (w == 4 && h == 4) delete static_cast<C4_4x4::GameSolver::Connect4::OpeningBookBase<4, 4>*>(book_ptr);
    else if (w == 4 && h == 5) delete static_cast<C4_4x5::GameSolver::Connect4::OpeningBookBase<4, 5>*>(book_ptr);
    else if (w == 4 && h == 6) delete static_cast<C4_4x6::GameSolver::Connect4::OpeningBookBase<4, 6>*>(book_ptr);
    else if (w == 4 && h == 7) delete static_cast<C4_4x7::GameSolver::Connect4::OpeningBookBase<4, 7>*>(book_ptr);
    else if (w == 4 && h == 8) delete static_cast<C4_4x8::GameSolver::Connect4::OpeningBookBase<4, 4>*>(book_ptr);
    else if (w == 4 && h == 9) delete static_cast<C4_4x9::GameSolver::Connect4::OpeningBookBase<4, 9>*>(book_ptr);
    else if (w == 4 && h == 10) delete static_cast<C4_4x10::GameSolver::Connect4::OpeningBookBase<4, 10>*>(book_ptr);
    else if (w == 4 && h == 11) delete static_cast<C4_4x11::GameSolver::Connect4::OpeningBookBase<4, 11>*>(book_ptr);
    else if (w == 4 && h == 12) delete static_cast<C4_4x12::GameSolver::Connect4::OpeningBookBase<4, 12>*>(book_ptr);
    else if (w == 5 && h == 4) delete static_cast<C4_5x4::GameSolver::Connect4::OpeningBookBase<5, 4>*>(book_ptr);
    else if (w == 5 && h == 5) delete static_cast<C4_5x5::GameSolver::Connect4::OpeningBookBase<5, 5>*>(book_ptr);
    else if (w == 5 && h == 6) delete static_cast<C4_5x6::GameSolver::Connect4::OpeningBookBase<5, 6>*>(book_ptr);
    else if (w == 5 && h == 7) delete static_cast<C4_5x7::GameSolver::Connect4::OpeningBookBase<5, 7>*>(book_ptr);
    else if (w == 5 && h == 8) delete static_cast<C4_5x8::GameSolver::Connect4::OpeningBookBase<5, 5>*>(book_ptr);
    else if (w == 5 && h == 9) delete static_cast<C4_5x9::GameSolver::Connect4::OpeningBookBase<5, 9>*>(book_ptr);
    else if (w == 5 && h == 10) delete static_cast<C4_5x10::GameSolver::Connect4::OpeningBookBase<5, 10>*>(book_ptr);
    else if (w == 5 && h == 11) delete static_cast<C4_5x11::GameSolver::Connect4::OpeningBookBase<5, 11>*>(book_ptr);
    else if (w == 5 && h == 12) delete static_cast<C4_5x12::GameSolver::Connect4::OpeningBookBase<5, 12>*>(book_ptr);
    else if (w == 6 && h == 4) delete static_cast<C4_6x4::GameSolver::Connect4::OpeningBookBase<6, 4>*>(book_ptr);
    else if (w == 6 && h == 7) delete static_cast<C4_6x7::GameSolver::Connect4::OpeningBookBase<6, 7>*>(book_ptr);
    else if (w == 6 && h == 8) delete static_cast<C4_6x8::GameSolver::Connect4::OpeningBookBase<6, 6>*>(book_ptr);
    else if (w == 6 && h == 9) delete static_cast<C4_6x9::GameSolver::Connect4::OpeningBookBase<6, 9>*>(book_ptr);
    else if (w == 6 && h == 10) delete static_cast<C4_6x10::GameSolver::Connect4::OpeningBookBase<6, 10>*>(book_ptr);
    else if (w == 6 && h == 11) delete static_cast<C4_6x11::GameSolver::Connect4::OpeningBookBase<6, 11>*>(book_ptr);
    else if (w == 6 && h == 12) delete static_cast<C4_6x12::GameSolver::Connect4::OpeningBookBase<6, 12>*>(book_ptr);
    else if (w == 7 && h == 4) delete static_cast<C4_7x4::GameSolver::Connect4::OpeningBookBase<7, 4>*>(book_ptr);
    else if (w == 7 && h == 5) delete static_cast<C4_7x5::GameSolver::Connect4::OpeningBookBase<7, 5>*>(book_ptr);
    else if (w == 7 && h == 8) delete static_cast<C4_7x8::GameSolver::Connect4::OpeningBookBase<7, 7>*>(book_ptr);
    else if (w == 7 && h == 9) delete static_cast<C4_7x9::GameSolver::Connect4::OpeningBookBase<7, 9>*>(book_ptr);
    else if (w == 7 && h == 10) delete static_cast<C4_7x10::GameSolver::Connect4::OpeningBookBase<7, 10>*>(book_ptr);
    else if (w == 7 && h == 11) delete static_cast<C4_7x11::GameSolver::Connect4::OpeningBookBase<7, 11>*>(book_ptr);
    else if (w == 7 && h == 12) delete static_cast<C4_7x12::GameSolver::Connect4::OpeningBookBase<7, 12>*>(book_ptr);
    else if (w == 8 && h == 4) delete static_cast<C4_8x4::GameSolver::Connect4::OpeningBookBase<8, 4>*>(book_ptr);
    else if (w == 8 && h == 5) delete static_cast<C4_8x5::GameSolver::Connect4::OpeningBookBase<8, 5>*>(book_ptr);
    else if (w == 8 && h == 7) delete static_cast<C4_8x7::GameSolver::Connect4::OpeningBookBase<8, 7>*>(book_ptr);
    else if (w == 8 && h == 9) delete static_cast<C4_8x9::GameSolver::Connect4::OpeningBookBase<8, 9>*>(book_ptr);
    else if (w == 8 && h == 10) delete static_cast<C4_8x10::GameSolver::Connect4::OpeningBookBase<8, 10>*>(book_ptr);
    else if (w == 8 && h == 11) delete static_cast<C4_8x11::GameSolver::Connect4::OpeningBookBase<8, 11>*>(book_ptr);
    else if (w == 8 && h == 12) delete static_cast<C4_8x12::GameSolver::Connect4::OpeningBookBase<8, 12>*>(book_ptr);
    else if (w == 9 && h == 4) delete static_cast<C4_9x4::GameSolver::Connect4::OpeningBookBase<9, 4>*>(book_ptr);
    else if (w == 9 && h == 5) delete static_cast<C4_9x5::GameSolver::Connect4::OpeningBookBase<9, 5>*>(book_ptr);
    else if (w == 9 && h == 8) delete static_cast<C4_9x8::GameSolver::Connect4::OpeningBookBase<9, 9>*>(book_ptr);
    else if (w == 9 && h == 10) delete static_cast<C4_9x10::GameSolver::Connect4::OpeningBookBase<9, 10>*>(book_ptr);
    else if (w == 9 && h == 11) delete static_cast<C4_9x11::GameSolver::Connect4::OpeningBookBase<9, 11>*>(book_ptr);
    else if (w == 9 && h == 12) delete static_cast<C4_9x12::GameSolver::Connect4::OpeningBookBase<9, 12>*>(book_ptr);
    else if (w == 10 && h == 4) delete static_cast<C4_10x4::GameSolver::Connect4::OpeningBookBase<10, 4>*>(book_ptr);
    else if (w == 10 && h == 5) delete static_cast<C4_10x5::GameSolver::Connect4::OpeningBookBase<10, 5>*>(book_ptr);
    else if (w == 10 && h == 6) delete static_cast<C4_10x6::GameSolver::Connect4::OpeningBookBase<10, 6>*>(book_ptr);
    else if (w == 10 && h == 8) delete static_cast<C4_10x8::GameSolver::Connect4::OpeningBookBase<10, 10>*>(book_ptr);
    else if (w == 10 && h == 9) delete static_cast<C4_10x9::GameSolver::Connect4::OpeningBookBase<10, 9>*>(book_ptr);
    else if (w == 10 && h == 11) delete static_cast<C4_10x11::GameSolver::Connect4::OpeningBookBase<10, 11>*>(book_ptr);
    else if (w == 11 && h == 5) delete static_cast<C4_11x5::GameSolver::Connect4::OpeningBookBase<11, 5>*>(book_ptr);
    else if (w == 11 && h == 6) delete static_cast<C4_11x6::GameSolver::Connect4::OpeningBookBase<11, 6>*>(book_ptr);
    else if (w == 11 && h == 7) delete static_cast<C4_11x7::GameSolver::Connect4::OpeningBookBase<11, 7>*>(book_ptr);
    else if (w == 11 && h == 8) delete static_cast<C4_11x8::GameSolver::Connect4::OpeningBookBase<11, 11>*>(book_ptr);
    else if (w == 11 && h == 9) delete static_cast<C4_11x9::GameSolver::Connect4::OpeningBookBase<11, 9>*>(book_ptr);
    else if (w == 11 && h == 10) delete static_cast<C4_11x10::GameSolver::Connect4::OpeningBookBase<11, 10>*>(book_ptr);
    else if (w == 12 && h == 4) delete static_cast<C4_12x4::GameSolver::Connect4::OpeningBookBase<12, 4>*>(book_ptr);
    else if (w == 12 && h == 5) delete static_cast<C4_12x5::GameSolver::Connect4::OpeningBookBase<12, 5>*>(book_ptr);
    else if (w == 12 && h == 6) delete static_cast<C4_12x6::GameSolver::Connect4::OpeningBookBase<12, 6>*>(book_ptr);
    else if (w == 12 && h == 7) delete static_cast<C4_12x7::GameSolver::Connect4::OpeningBookBase<12, 7>*>(book_ptr);
    else if (w == 12 && h == 8) delete static_cast<C4_12x8::GameSolver::Connect4::OpeningBookBase<12, 12>*>(book_ptr);
    else if (w == 12 && h == 9) delete static_cast<C4_12x9::GameSolver::Connect4::OpeningBookBase<12, 9>*>(book_ptr);
    else if (w == 9 && h == 7) delete static_cast<C4_9x7::GameSolver::Connect4::OpeningBookBase<9, 7>*>(book_ptr);
    else if (w == 9 && h == 6) delete static_cast<C4_9x6::GameSolver::Connect4::OpeningBookBase<9, 6>*>(book_ptr);
    else if (w == 11 && h == 4) delete static_cast<C4_11x4::GameSolver::Connect4::OpeningBookBase<11, 4>*>(book_ptr);
}

EMSCRIPTEN_KEEPALIVE int32_t* analyzeExact(int w, int h, void* solver, const char* pos, bool weak, int threads, void* book_ptr) {
    if (w == 6 && h == 5) return runAnalysis<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6, 5, C4_6x5::GameSolver::Connect4::OpeningBookBase<6, 5>>(*static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 6 && h == 6) return runAnalysis<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6, 6, C4_6x6::GameSolver::Connect4::OpeningBookBase<6, 6>>(*static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 7 && h == 6) return runAnalysis<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7, 6, C4_7x6::GameSolver::Connect4::OpeningBookBase<7, 6>>(*static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 7 && h == 7) return runAnalysis<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7, 7, C4_7x7::GameSolver::Connect4::OpeningBookBase<7, 7>>(*static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 8 && h == 6) return runAnalysis<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8, 6, C4_8x6::GameSolver::Connect4::OpeningBookBase<8, 6>>(*static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 4 && h == 4) return runAnalysis<C4_4x4::GameSolver::Connect4::Solver, C4_4x4::GameSolver::Connect4::Position, 8, 6, C4_4x4::GameSolver::Connect4::OpeningBookBase<4, 4>>(*static_cast<C4_4x4::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 4 && h == 5) return runAnalysis<C4_4x5::GameSolver::Connect4::Solver, C4_4x5::GameSolver::Connect4::Position, 8, 6, C4_4x5::GameSolver::Connect4::OpeningBookBase<4, 5>>(*static_cast<C4_4x5::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 4 && h == 6) return runAnalysis<C4_4x6::GameSolver::Connect4::Solver, C4_4x6::GameSolver::Connect4::Position, 8, 6, C4_4x6::GameSolver::Connect4::OpeningBookBase<4, 6>>(*static_cast<C4_4x6::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 4 && h == 7) return runAnalysis<C4_4x7::GameSolver::Connect4::Solver, C4_4x7::GameSolver::Connect4::Position, 8, 6, C4_4x7::GameSolver::Connect4::OpeningBookBase<4, 7>>(*static_cast<C4_4x7::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 4 && h == 8) return runAnalysis<C4_4x8::GameSolver::Connect4::Solver, C4_4x8::GameSolver::Connect4::Position, 8, 6, C4_4x8::GameSolver::Connect4::OpeningBookBase<4, 4>>(*static_cast<C4_4x8::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 4 && h == 9) return runAnalysis<C4_4x9::GameSolver::Connect4::Solver, C4_4x9::GameSolver::Connect4::Position, 8, 6, C4_4x9::GameSolver::Connect4::OpeningBookBase<4, 9>>(*static_cast<C4_4x9::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 4 && h == 10) return runAnalysis<C4_4x10::GameSolver::Connect4::Solver, C4_4x10::GameSolver::Connect4::Position, 8, 6, C4_4x10::GameSolver::Connect4::OpeningBookBase<4, 10>>(*static_cast<C4_4x10::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 4 && h == 11) return runAnalysis<C4_4x11::GameSolver::Connect4::Solver, C4_4x11::GameSolver::Connect4::Position, 8, 6, C4_4x11::GameSolver::Connect4::OpeningBookBase<4, 11>>(*static_cast<C4_4x11::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 4 && h == 12) return runAnalysis<C4_4x12::GameSolver::Connect4::Solver, C4_4x12::GameSolver::Connect4::Position, 8, 6, C4_4x12::GameSolver::Connect4::OpeningBookBase<4, 12>>(*static_cast<C4_4x12::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 5 && h == 4) return runAnalysis<C4_5x4::GameSolver::Connect4::Solver, C4_5x4::GameSolver::Connect4::Position, 8, 6, C4_5x4::GameSolver::Connect4::OpeningBookBase<5, 4>>(*static_cast<C4_5x4::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 5 && h == 5) return runAnalysis<C4_5x5::GameSolver::Connect4::Solver, C4_5x5::GameSolver::Connect4::Position, 8, 6, C4_5x5::GameSolver::Connect4::OpeningBookBase<5, 5>>(*static_cast<C4_5x5::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 5 && h == 6) return runAnalysis<C4_5x6::GameSolver::Connect4::Solver, C4_5x6::GameSolver::Connect4::Position, 8, 6, C4_5x6::GameSolver::Connect4::OpeningBookBase<5, 6>>(*static_cast<C4_5x6::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 5 && h == 7) return runAnalysis<C4_5x7::GameSolver::Connect4::Solver, C4_5x7::GameSolver::Connect4::Position, 8, 6, C4_5x7::GameSolver::Connect4::OpeningBookBase<5, 7>>(*static_cast<C4_5x7::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 5 && h == 8) return runAnalysis<C4_5x8::GameSolver::Connect4::Solver, C4_5x8::GameSolver::Connect4::Position, 8, 6, C4_5x8::GameSolver::Connect4::OpeningBookBase<5, 5>>(*static_cast<C4_5x8::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 5 && h == 9) return runAnalysis<C4_5x9::GameSolver::Connect4::Solver, C4_5x9::GameSolver::Connect4::Position, 8, 6, C4_5x9::GameSolver::Connect4::OpeningBookBase<5, 9>>(*static_cast<C4_5x9::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 5 && h == 10) return runAnalysis<C4_5x10::GameSolver::Connect4::Solver, C4_5x10::GameSolver::Connect4::Position, 8, 6, C4_5x10::GameSolver::Connect4::OpeningBookBase<5, 10>>(*static_cast<C4_5x10::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 5 && h == 11) return runAnalysis<C4_5x11::GameSolver::Connect4::Solver, C4_5x11::GameSolver::Connect4::Position, 8, 6, C4_5x11::GameSolver::Connect4::OpeningBookBase<5, 11>>(*static_cast<C4_5x11::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 5 && h == 12) return runAnalysis<C4_5x12::GameSolver::Connect4::Solver, C4_5x12::GameSolver::Connect4::Position, 8, 6, C4_5x12::GameSolver::Connect4::OpeningBookBase<5, 12>>(*static_cast<C4_5x12::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 6 && h == 4) return runAnalysis<C4_6x4::GameSolver::Connect4::Solver, C4_6x4::GameSolver::Connect4::Position, 8, 6, C4_6x4::GameSolver::Connect4::OpeningBookBase<6, 4>>(*static_cast<C4_6x4::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 6 && h == 7) return runAnalysis<C4_6x7::GameSolver::Connect4::Solver, C4_6x7::GameSolver::Connect4::Position, 8, 6, C4_6x7::GameSolver::Connect4::OpeningBookBase<6, 7>>(*static_cast<C4_6x7::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 6 && h == 8) return runAnalysis<C4_6x8::GameSolver::Connect4::Solver, C4_6x8::GameSolver::Connect4::Position, 8, 6, C4_6x8::GameSolver::Connect4::OpeningBookBase<6, 6>>(*static_cast<C4_6x8::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 6 && h == 9) return runAnalysis<C4_6x9::GameSolver::Connect4::Solver, C4_6x9::GameSolver::Connect4::Position, 8, 6, C4_6x9::GameSolver::Connect4::OpeningBookBase<6, 9>>(*static_cast<C4_6x9::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 6 && h == 10) return runAnalysis<C4_6x10::GameSolver::Connect4::Solver, C4_6x10::GameSolver::Connect4::Position, 8, 6, C4_6x10::GameSolver::Connect4::OpeningBookBase<6, 10>>(*static_cast<C4_6x10::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 6 && h == 11) return runAnalysis<C4_6x11::GameSolver::Connect4::Solver, C4_6x11::GameSolver::Connect4::Position, 8, 6, C4_6x11::GameSolver::Connect4::OpeningBookBase<6, 11>>(*static_cast<C4_6x11::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 6 && h == 12) return runAnalysis<C4_6x12::GameSolver::Connect4::Solver, C4_6x12::GameSolver::Connect4::Position, 8, 6, C4_6x12::GameSolver::Connect4::OpeningBookBase<6, 12>>(*static_cast<C4_6x12::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 7 && h == 4) return runAnalysis<C4_7x4::GameSolver::Connect4::Solver, C4_7x4::GameSolver::Connect4::Position, 8, 6, C4_7x4::GameSolver::Connect4::OpeningBookBase<7, 4>>(*static_cast<C4_7x4::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 7 && h == 5) return runAnalysis<C4_7x5::GameSolver::Connect4::Solver, C4_7x5::GameSolver::Connect4::Position, 8, 6, C4_7x5::GameSolver::Connect4::OpeningBookBase<7, 5>>(*static_cast<C4_7x5::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 7 && h == 8) return runAnalysis<C4_7x8::GameSolver::Connect4::Solver, C4_7x8::GameSolver::Connect4::Position, 8, 6, C4_7x8::GameSolver::Connect4::OpeningBookBase<7, 7>>(*static_cast<C4_7x8::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 7 && h == 9) return runAnalysis<C4_7x9::GameSolver::Connect4::Solver, C4_7x9::GameSolver::Connect4::Position, 8, 6, C4_7x9::GameSolver::Connect4::OpeningBookBase<7, 9>>(*static_cast<C4_7x9::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 7 && h == 10) return runAnalysis<C4_7x10::GameSolver::Connect4::Solver, C4_7x10::GameSolver::Connect4::Position, 8, 6, C4_7x10::GameSolver::Connect4::OpeningBookBase<7, 10>>(*static_cast<C4_7x10::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 7 && h == 11) return runAnalysis<C4_7x11::GameSolver::Connect4::Solver, C4_7x11::GameSolver::Connect4::Position, 8, 6, C4_7x11::GameSolver::Connect4::OpeningBookBase<7, 11>>(*static_cast<C4_7x11::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 7 && h == 12) return runAnalysis<C4_7x12::GameSolver::Connect4::Solver, C4_7x12::GameSolver::Connect4::Position, 8, 6, C4_7x12::GameSolver::Connect4::OpeningBookBase<7, 12>>(*static_cast<C4_7x12::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 8 && h == 4) return runAnalysis<C4_8x4::GameSolver::Connect4::Solver, C4_8x4::GameSolver::Connect4::Position, 8, 6, C4_8x4::GameSolver::Connect4::OpeningBookBase<8, 4>>(*static_cast<C4_8x4::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 8 && h == 5) return runAnalysis<C4_8x5::GameSolver::Connect4::Solver, C4_8x5::GameSolver::Connect4::Position, 8, 6, C4_8x5::GameSolver::Connect4::OpeningBookBase<8, 5>>(*static_cast<C4_8x5::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 8 && h == 7) return runAnalysis<C4_8x7::GameSolver::Connect4::Solver, C4_8x7::GameSolver::Connect4::Position, 8, 6, C4_8x7::GameSolver::Connect4::OpeningBookBase<8, 7>>(*static_cast<C4_8x7::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 8 && h == 9) return runAnalysis<C4_8x9::GameSolver::Connect4::Solver, C4_8x9::GameSolver::Connect4::Position, 8, 6, C4_8x9::GameSolver::Connect4::OpeningBookBase<8, 9>>(*static_cast<C4_8x9::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 8 && h == 10) return runAnalysis<C4_8x10::GameSolver::Connect4::Solver, C4_8x10::GameSolver::Connect4::Position, 8, 6, C4_8x10::GameSolver::Connect4::OpeningBookBase<8, 10>>(*static_cast<C4_8x10::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 8 && h == 11) return runAnalysis<C4_8x11::GameSolver::Connect4::Solver, C4_8x11::GameSolver::Connect4::Position, 8, 6, C4_8x11::GameSolver::Connect4::OpeningBookBase<8, 11>>(*static_cast<C4_8x11::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 8 && h == 12) return runAnalysis<C4_8x12::GameSolver::Connect4::Solver, C4_8x12::GameSolver::Connect4::Position, 8, 6, C4_8x12::GameSolver::Connect4::OpeningBookBase<8, 12>>(*static_cast<C4_8x12::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 9 && h == 4) return runAnalysis<C4_9x4::GameSolver::Connect4::Solver, C4_9x4::GameSolver::Connect4::Position, 8, 6, C4_9x4::GameSolver::Connect4::OpeningBookBase<9, 4>>(*static_cast<C4_9x4::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 9 && h == 5) return runAnalysis<C4_9x5::GameSolver::Connect4::Solver, C4_9x5::GameSolver::Connect4::Position, 8, 6, C4_9x5::GameSolver::Connect4::OpeningBookBase<9, 5>>(*static_cast<C4_9x5::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 9 && h == 8) return runAnalysis<C4_9x8::GameSolver::Connect4::Solver, C4_9x8::GameSolver::Connect4::Position, 8, 6, C4_9x8::GameSolver::Connect4::OpeningBookBase<9, 9>>(*static_cast<C4_9x8::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 9 && h == 10) return runAnalysis<C4_9x10::GameSolver::Connect4::Solver, C4_9x10::GameSolver::Connect4::Position, 8, 6, C4_9x10::GameSolver::Connect4::OpeningBookBase<9, 10>>(*static_cast<C4_9x10::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 9 && h == 11) return runAnalysis<C4_9x11::GameSolver::Connect4::Solver, C4_9x11::GameSolver::Connect4::Position, 8, 6, C4_9x11::GameSolver::Connect4::OpeningBookBase<9, 11>>(*static_cast<C4_9x11::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 9 && h == 12) return runAnalysis<C4_9x12::GameSolver::Connect4::Solver, C4_9x12::GameSolver::Connect4::Position, 8, 6, C4_9x12::GameSolver::Connect4::OpeningBookBase<9, 12>>(*static_cast<C4_9x12::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 10 && h == 4) return runAnalysis<C4_10x4::GameSolver::Connect4::Solver, C4_10x4::GameSolver::Connect4::Position, 8, 6, C4_10x4::GameSolver::Connect4::OpeningBookBase<10, 4>>(*static_cast<C4_10x4::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 10 && h == 5) return runAnalysis<C4_10x5::GameSolver::Connect4::Solver, C4_10x5::GameSolver::Connect4::Position, 8, 6, C4_10x5::GameSolver::Connect4::OpeningBookBase<10, 5>>(*static_cast<C4_10x5::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 10 && h == 6) return runAnalysis<C4_10x6::GameSolver::Connect4::Solver, C4_10x6::GameSolver::Connect4::Position, 8, 6, C4_10x6::GameSolver::Connect4::OpeningBookBase<10, 6>>(*static_cast<C4_10x6::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 10 && h == 8) return runAnalysis<C4_10x8::GameSolver::Connect4::Solver, C4_10x8::GameSolver::Connect4::Position, 8, 6, C4_10x8::GameSolver::Connect4::OpeningBookBase<10, 10>>(*static_cast<C4_10x8::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 10 && h == 9) return runAnalysis<C4_10x9::GameSolver::Connect4::Solver, C4_10x9::GameSolver::Connect4::Position, 8, 6, C4_10x9::GameSolver::Connect4::OpeningBookBase<10, 9>>(*static_cast<C4_10x9::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 10 && h == 11) return runAnalysis<C4_10x11::GameSolver::Connect4::Solver, C4_10x11::GameSolver::Connect4::Position, 8, 6, C4_10x11::GameSolver::Connect4::OpeningBookBase<10, 11>>(*static_cast<C4_10x11::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 11 && h == 5) return runAnalysis<C4_11x5::GameSolver::Connect4::Solver, C4_11x5::GameSolver::Connect4::Position, 8, 6, C4_11x5::GameSolver::Connect4::OpeningBookBase<11, 5>>(*static_cast<C4_11x5::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 11 && h == 6) return runAnalysis<C4_11x6::GameSolver::Connect4::Solver, C4_11x6::GameSolver::Connect4::Position, 8, 6, C4_11x6::GameSolver::Connect4::OpeningBookBase<11, 6>>(*static_cast<C4_11x6::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 11 && h == 7) return runAnalysis<C4_11x7::GameSolver::Connect4::Solver, C4_11x7::GameSolver::Connect4::Position, 8, 6, C4_11x7::GameSolver::Connect4::OpeningBookBase<11, 7>>(*static_cast<C4_11x7::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 11 && h == 8) return runAnalysis<C4_11x8::GameSolver::Connect4::Solver, C4_11x8::GameSolver::Connect4::Position, 8, 6, C4_11x8::GameSolver::Connect4::OpeningBookBase<11, 11>>(*static_cast<C4_11x8::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 11 && h == 9) return runAnalysis<C4_11x9::GameSolver::Connect4::Solver, C4_11x9::GameSolver::Connect4::Position, 8, 6, C4_11x9::GameSolver::Connect4::OpeningBookBase<11, 9>>(*static_cast<C4_11x9::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 11 && h == 10) return runAnalysis<C4_11x10::GameSolver::Connect4::Solver, C4_11x10::GameSolver::Connect4::Position, 8, 6, C4_11x10::GameSolver::Connect4::OpeningBookBase<11, 10>>(*static_cast<C4_11x10::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 12 && h == 4) return runAnalysis<C4_12x4::GameSolver::Connect4::Solver, C4_12x4::GameSolver::Connect4::Position, 8, 6, C4_12x4::GameSolver::Connect4::OpeningBookBase<12, 4>>(*static_cast<C4_12x4::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 12 && h == 5) return runAnalysis<C4_12x5::GameSolver::Connect4::Solver, C4_12x5::GameSolver::Connect4::Position, 8, 6, C4_12x5::GameSolver::Connect4::OpeningBookBase<12, 5>>(*static_cast<C4_12x5::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 12 && h == 6) return runAnalysis<C4_12x6::GameSolver::Connect4::Solver, C4_12x6::GameSolver::Connect4::Position, 8, 6, C4_12x6::GameSolver::Connect4::OpeningBookBase<12, 6>>(*static_cast<C4_12x6::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 12 && h == 7) return runAnalysis<C4_12x7::GameSolver::Connect4::Solver, C4_12x7::GameSolver::Connect4::Position, 8, 6, C4_12x7::GameSolver::Connect4::OpeningBookBase<12, 7>>(*static_cast<C4_12x7::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 12 && h == 8) return runAnalysis<C4_12x8::GameSolver::Connect4::Solver, C4_12x8::GameSolver::Connect4::Position, 8, 6, C4_12x8::GameSolver::Connect4::OpeningBookBase<12, 12>>(*static_cast<C4_12x8::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 12 && h == 9) return runAnalysis<C4_12x9::GameSolver::Connect4::Solver, C4_12x9::GameSolver::Connect4::Position, 8, 6, C4_12x9::GameSolver::Connect4::OpeningBookBase<12, 9>>(*static_cast<C4_12x9::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 9 && h == 7) return runAnalysis<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9, 7, C4_9x7::GameSolver::Connect4::OpeningBookBase<9, 7>>(*static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 9 && h == 6) return runAnalysis<C4_9x6::GameSolver::Connect4::Solver, C4_9x6::GameSolver::Connect4::Position, 9, 6, C4_9x6::GameSolver::Connect4::OpeningBookBase<9, 6>>(*static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    if (w == 11 && h == 4) return runAnalysis<C4_11x4::GameSolver::Connect4::Solver, C4_11x4::GameSolver::Connect4::Position, 11, 4, C4_11x4::GameSolver::Connect4::OpeningBookBase<11, 4>>(*static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver), pos, weak, threads, book_ptr);
    return nullptr;
}

EMSCRIPTEN_KEEPALIVE int32_t* analyzeHeuristic(int w, int h, void* solver, const char* pos, int threads, int max_depth, double timeout_ms) {
    if (w == 6 && h == 5) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 6 && h == 6) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 7 && h == 6) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 7 && h == 7) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 8 && h == 6) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 6 && h == 7) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 7>, GameSolver::Connect4::GenericPosition<6, 7>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 7>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 6 && h == 8) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 6 && h == 9) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 9>, GameSolver::Connect4::GenericPosition<6, 9>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 9>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 6 && h == 10) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 10>, GameSolver::Connect4::GenericPosition<6, 10>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 10>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 6 && h == 11) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 11>, GameSolver::Connect4::GenericPosition<6, 11>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 11>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 6 && h == 12) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 12>, GameSolver::Connect4::GenericPosition<6, 12>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 12>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 7 && h == 5) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 5>, GameSolver::Connect4::GenericPosition<7, 5>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 5>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 7 && h == 8) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 7 && h == 9) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 9>, GameSolver::Connect4::GenericPosition<7, 9>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 9>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 7 && h == 10) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 10>, GameSolver::Connect4::GenericPosition<7, 10>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 10>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 7 && h == 11) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 11>, GameSolver::Connect4::GenericPosition<7, 11>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 11>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 7 && h == 12) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 12>, GameSolver::Connect4::GenericPosition<7, 12>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 12>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 8 && h == 5) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 5>, GameSolver::Connect4::GenericPosition<8, 5>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 5>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 8 && h == 7) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 7>, GameSolver::Connect4::GenericPosition<8, 7>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 7>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 8 && h == 9) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 9>, GameSolver::Connect4::GenericPosition<8, 9>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 9>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 8 && h == 10) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 10>, GameSolver::Connect4::GenericPosition<8, 10>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 10>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 8 && h == 11) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 11>, GameSolver::Connect4::GenericPosition<8, 11>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 11>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 8 && h == 12) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 12>, GameSolver::Connect4::GenericPosition<8, 12>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 12>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 9 && h == 5) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 5>, GameSolver::Connect4::GenericPosition<9, 5>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 5>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 9 && h == 8) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 9 && h == 10) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 10>, GameSolver::Connect4::GenericPosition<9, 10>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 10>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 9 && h == 11) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 11>, GameSolver::Connect4::GenericPosition<9, 11>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 11>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 9 && h == 12) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 12>, GameSolver::Connect4::GenericPosition<9, 12>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 12>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 10 && h == 5) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 5>, GameSolver::Connect4::GenericPosition<10, 5>, 10>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 5>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 10 && h == 6) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 6>, GameSolver::Connect4::GenericPosition<10, 6>, 10>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 6>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 10 && h == 8) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 10 && h == 9) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 9>, GameSolver::Connect4::GenericPosition<10, 9>, 10>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 9>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 10 && h == 11) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 11>, GameSolver::Connect4::GenericPosition<10, 11>, 10>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 11>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 11 && h == 5) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<11, 5>, GameSolver::Connect4::GenericPosition<11, 5>, 11>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 5>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 11 && h == 6) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<11, 6>, GameSolver::Connect4::GenericPosition<11, 6>, 11>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 6>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 11 && h == 7) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<11, 7>, GameSolver::Connect4::GenericPosition<11, 7>, 11>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 7>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 11 && h == 8) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<11, 11>, GameSolver::Connect4::GenericPosition<11, 11>, 11>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 11>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 11 && h == 9) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<11, 9>, GameSolver::Connect4::GenericPosition<11, 9>, 11>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 9>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 11 && h == 10) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<11, 10>, GameSolver::Connect4::GenericPosition<11, 10>, 11>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 10>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 12 && h == 5) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<12, 5>, GameSolver::Connect4::GenericPosition<12, 5>, 12>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 5>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 12 && h == 6) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<12, 6>, GameSolver::Connect4::GenericPosition<12, 6>, 12>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 6>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 12 && h == 7) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<12, 7>, GameSolver::Connect4::GenericPosition<12, 7>, 12>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 7>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 12 && h == 8) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<12, 12>, GameSolver::Connect4::GenericPosition<12, 12>, 12>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 12>*>(solver), pos, max_depth, threads, timeout_ms);
    if (w == 12 && h == 9) return runHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<12, 9>, GameSolver::Connect4::GenericPosition<12, 9>, 12>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 9>*>(solver), pos, max_depth, threads, timeout_ms);
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
        if (w == 6 && h == 7) return static_cast<GameSolver::Connect4::HeuristicSolver<6, 7>*>(solver)->getNodeCount();
        if (w == 6 && h == 8) return static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver)->getNodeCount();
        if (w == 6 && h == 9) return static_cast<GameSolver::Connect4::HeuristicSolver<6, 9>*>(solver)->getNodeCount();
        if (w == 6 && h == 10) return static_cast<GameSolver::Connect4::HeuristicSolver<6, 10>*>(solver)->getNodeCount();
        if (w == 6 && h == 11) return static_cast<GameSolver::Connect4::HeuristicSolver<6, 11>*>(solver)->getNodeCount();
        if (w == 6 && h == 12) return static_cast<GameSolver::Connect4::HeuristicSolver<6, 12>*>(solver)->getNodeCount();
        if (w == 7 && h == 5) return static_cast<GameSolver::Connect4::HeuristicSolver<7, 5>*>(solver)->getNodeCount();
        if (w == 7 && h == 8) return static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver)->getNodeCount();
        if (w == 7 && h == 9) return static_cast<GameSolver::Connect4::HeuristicSolver<7, 9>*>(solver)->getNodeCount();
        if (w == 7 && h == 10) return static_cast<GameSolver::Connect4::HeuristicSolver<7, 10>*>(solver)->getNodeCount();
        if (w == 7 && h == 11) return static_cast<GameSolver::Connect4::HeuristicSolver<7, 11>*>(solver)->getNodeCount();
        if (w == 7 && h == 12) return static_cast<GameSolver::Connect4::HeuristicSolver<7, 12>*>(solver)->getNodeCount();
        if (w == 8 && h == 5) return static_cast<GameSolver::Connect4::HeuristicSolver<8, 5>*>(solver)->getNodeCount();
        if (w == 8 && h == 7) return static_cast<GameSolver::Connect4::HeuristicSolver<8, 7>*>(solver)->getNodeCount();
        if (w == 8 && h == 9) return static_cast<GameSolver::Connect4::HeuristicSolver<8, 9>*>(solver)->getNodeCount();
        if (w == 8 && h == 10) return static_cast<GameSolver::Connect4::HeuristicSolver<8, 10>*>(solver)->getNodeCount();
        if (w == 8 && h == 11) return static_cast<GameSolver::Connect4::HeuristicSolver<8, 11>*>(solver)->getNodeCount();
        if (w == 8 && h == 12) return static_cast<GameSolver::Connect4::HeuristicSolver<8, 12>*>(solver)->getNodeCount();
        if (w == 9 && h == 5) return static_cast<GameSolver::Connect4::HeuristicSolver<9, 5>*>(solver)->getNodeCount();
        if (w == 9 && h == 8) return static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver)->getNodeCount();
        if (w == 9 && h == 10) return static_cast<GameSolver::Connect4::HeuristicSolver<9, 10>*>(solver)->getNodeCount();
        if (w == 9 && h == 11) return static_cast<GameSolver::Connect4::HeuristicSolver<9, 11>*>(solver)->getNodeCount();
        if (w == 9 && h == 12) return static_cast<GameSolver::Connect4::HeuristicSolver<9, 12>*>(solver)->getNodeCount();
        if (w == 10 && h == 5) return static_cast<GameSolver::Connect4::HeuristicSolver<10, 5>*>(solver)->getNodeCount();
        if (w == 10 && h == 6) return static_cast<GameSolver::Connect4::HeuristicSolver<10, 6>*>(solver)->getNodeCount();
        if (w == 10 && h == 8) return static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver)->getNodeCount();
        if (w == 10 && h == 9) return static_cast<GameSolver::Connect4::HeuristicSolver<10, 9>*>(solver)->getNodeCount();
        if (w == 10 && h == 11) return static_cast<GameSolver::Connect4::HeuristicSolver<10, 11>*>(solver)->getNodeCount();
        if (w == 11 && h == 5) return static_cast<GameSolver::Connect4::HeuristicSolver<11, 5>*>(solver)->getNodeCount();
        if (w == 11 && h == 6) return static_cast<GameSolver::Connect4::HeuristicSolver<11, 6>*>(solver)->getNodeCount();
        if (w == 11 && h == 7) return static_cast<GameSolver::Connect4::HeuristicSolver<11, 7>*>(solver)->getNodeCount();
        if (w == 11 && h == 8) return static_cast<GameSolver::Connect4::HeuristicSolver<11, 11>*>(solver)->getNodeCount();
        if (w == 11 && h == 9) return static_cast<GameSolver::Connect4::HeuristicSolver<11, 9>*>(solver)->getNodeCount();
        if (w == 11 && h == 10) return static_cast<GameSolver::Connect4::HeuristicSolver<11, 10>*>(solver)->getNodeCount();
        if (w == 12 && h == 5) return static_cast<GameSolver::Connect4::HeuristicSolver<12, 5>*>(solver)->getNodeCount();
        if (w == 12 && h == 6) return static_cast<GameSolver::Connect4::HeuristicSolver<12, 6>*>(solver)->getNodeCount();
        if (w == 12 && h == 7) return static_cast<GameSolver::Connect4::HeuristicSolver<12, 7>*>(solver)->getNodeCount();
        if (w == 12 && h == 8) return static_cast<GameSolver::Connect4::HeuristicSolver<12, 12>*>(solver)->getNodeCount();
        if (w == 12 && h == 9) return static_cast<GameSolver::Connect4::HeuristicSolver<12, 9>*>(solver)->getNodeCount();
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
        if (w == 4 && h == 4) return static_cast<C4_4x4::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 4 && h == 5) return static_cast<C4_4x5::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 4 && h == 6) return static_cast<C4_4x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 4 && h == 7) return static_cast<C4_4x7::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 4 && h == 8) return static_cast<C4_4x8::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 4 && h == 9) return static_cast<C4_4x9::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 4 && h == 10) return static_cast<C4_4x10::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 4 && h == 11) return static_cast<C4_4x11::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 4 && h == 12) return static_cast<C4_4x12::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 5 && h == 4) return static_cast<C4_5x4::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 5 && h == 5) return static_cast<C4_5x5::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 5 && h == 6) return static_cast<C4_5x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 5 && h == 7) return static_cast<C4_5x7::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 5 && h == 8) return static_cast<C4_5x8::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 5 && h == 9) return static_cast<C4_5x9::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 5 && h == 10) return static_cast<C4_5x10::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 5 && h == 11) return static_cast<C4_5x11::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 5 && h == 12) return static_cast<C4_5x12::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 6 && h == 4) return static_cast<C4_6x4::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 6 && h == 7) return static_cast<C4_6x7::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 6 && h == 8) return static_cast<C4_6x8::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 6 && h == 9) return static_cast<C4_6x9::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 6 && h == 10) return static_cast<C4_6x10::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 6 && h == 11) return static_cast<C4_6x11::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 6 && h == 12) return static_cast<C4_6x12::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 7 && h == 4) return static_cast<C4_7x4::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 7 && h == 5) return static_cast<C4_7x5::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 7 && h == 8) return static_cast<C4_7x8::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 7 && h == 9) return static_cast<C4_7x9::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 7 && h == 10) return static_cast<C4_7x10::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 7 && h == 11) return static_cast<C4_7x11::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 7 && h == 12) return static_cast<C4_7x12::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 8 && h == 4) return static_cast<C4_8x4::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 8 && h == 5) return static_cast<C4_8x5::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 8 && h == 7) return static_cast<C4_8x7::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 8 && h == 9) return static_cast<C4_8x9::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 8 && h == 10) return static_cast<C4_8x10::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 8 && h == 11) return static_cast<C4_8x11::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 8 && h == 12) return static_cast<C4_8x12::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 9 && h == 4) return static_cast<C4_9x4::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 9 && h == 5) return static_cast<C4_9x5::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 9 && h == 8) return static_cast<C4_9x8::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 9 && h == 10) return static_cast<C4_9x10::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 9 && h == 11) return static_cast<C4_9x11::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 9 && h == 12) return static_cast<C4_9x12::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 10 && h == 4) return static_cast<C4_10x4::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 10 && h == 5) return static_cast<C4_10x5::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 10 && h == 6) return static_cast<C4_10x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 10 && h == 8) return static_cast<C4_10x8::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 10 && h == 9) return static_cast<C4_10x9::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 10 && h == 11) return static_cast<C4_10x11::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 11 && h == 5) return static_cast<C4_11x5::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 11 && h == 6) return static_cast<C4_11x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 11 && h == 7) return static_cast<C4_11x7::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 11 && h == 8) return static_cast<C4_11x8::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 11 && h == 9) return static_cast<C4_11x9::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 11 && h == 10) return static_cast<C4_11x10::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 12 && h == 4) return static_cast<C4_12x4::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 12 && h == 5) return static_cast<C4_12x5::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 12 && h == 6) return static_cast<C4_12x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 12 && h == 7) return static_cast<C4_12x7::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 12 && h == 8) return static_cast<C4_12x8::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 12 && h == 9) return static_cast<C4_12x9::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 9 && h == 7) return static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 9 && h == 6) return static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        if (w == 11 && h == 4) return static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
    }
    return 0;
}

} // extern "C"
