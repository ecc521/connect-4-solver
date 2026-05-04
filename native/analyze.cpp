#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <cstring>
#include <memory>
#include <atomic>
#include "bindings_core.hpp"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

using namespace GameSolver::Connect4;

template <int W, int H>
int32_t* runAnalysis(Solver<W, H>& solver, const char* positionCharArr, bool weak, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString(positionCharArr);
  GenericPosition<W, H> P;
  int32_t* result = (int32_t*)malloc((2 + W) * sizeof(int32_t));
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
    result[1] = P.nbMoves();
    for(int i = 0; i < W; i++) result[2 + i] = 0;
  } else {
    if (book_ptr) solver.loadBook(static_cast<OpeningBookBase<W, H>*>(book_ptr));
    else solver.loadBook(nullptr);
    double end_time_ms = 0;
    if (timeout_ms > 0) end_time_ms = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count() + timeout_ms;
    auto res = solver.analyze(P, weak, threads, nullptr, end_time_ms);
    result[0] = 0;
    result[1] = P.nbMoves();
    for(int i = 0; i < W; i++) result[2 + i] = res[i];
  }
  return result;
}

template <int W, int H>
int32_t* runSolve(Solver<W, H>& solver, const char* positionCharArr, bool weak, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString(positionCharArr);
  GenericPosition<W, H> P;
  int32_t* result = (int32_t*)malloc(4 * sizeof(int32_t));
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
    result[1] = P.nbMoves();
    result[2] = 0;
    result[3] = 0;
  } else {
    if (book_ptr) solver.loadBook(static_cast<OpeningBookBase<W, H>*>(book_ptr));
    else solver.loadBook(nullptr);
    double end_time_ms = 0;
    if (timeout_ms > 0) end_time_ms = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count() + timeout_ms;
    auto res = solver.solve(P, weak, threads, nullptr, end_time_ms);
    result[0] = 0;
    result[1] = P.nbMoves();
    result[2] = res.score;
    result[3] = res.aborted ? 1 : 0;
  }
  return result;
}

template <int W, int H>
int32_t* runSolveHeuristic(Solver<W, H>& solver, const char* positionCharArr, int max_depth, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString(positionCharArr);
  GenericPosition<W, H> P;
  int32_t* result = (int32_t*)malloc(8 * sizeof(int32_t));
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
    result[1] = P.nbMoves();
    for(int i = 2; i < 8; i++) result[i] = 0;
  } else {
    if (book_ptr) solver.loadBook(static_cast<OpeningBookBase<W, H>*>(book_ptr));
    else solver.loadBook(nullptr);
    double end_time_ms = 0;
    if (timeout_ms > 0) end_time_ms = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count() + timeout_ms;
    auto res = solver.solve(P, false, threads, nullptr, end_time_ms);
    result[0] = 0;
    result[1] = P.nbMoves();
    result[2] = res.score;
    result[3] = res.bestMove;
    result[4] = res.depth;
    result[5] = (int32_t)(res.nodes & 0xFFFFFFFF);
    result[6] = (int32_t)(res.nodes >> 32);
    result[7] = res.aborted ? 1 : 0;
  }
  return result;
}

template <int W, int H>
void* runCreateBook(const uint8_t* data, size_t size) {
  return OpeningBookBase<W, H>::load_from_memory(data, size, W, H).release();
}

template <int W, int H>
int32_t* runHeuristicAnalysis(Solver<W, H>& solver, const char* positionCharArr, int max_depth, int threads, double timeout_ms) {
  std::string positionString(positionCharArr);
  GenericPosition<W, H> P;
  int32_t* result = (int32_t*)malloc((3 + W) * sizeof(int32_t));
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
    result[1] = P.nbMoves();
    for(int i = 0; i < W; i++) result[2 + i] = 0;
    result[2 + W] = 0;
  } else {
    result[0] = 0;
    result[1] = P.nbMoves();
    double end_time_ms = 0;
    if (timeout_ms > 0) end_time_ms = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count() + timeout_ms;
    // Note: We use analyze directly since HeuristicSolver inherits from Solver
    auto res = solver.analyze(P, false, threads, nullptr, end_time_ms);
    for(int i = 0; i < W; i++) result[2 + i] = res[i];
    result[2 + W] = 0; // Depth reached not perfectly returned yet
  }
  return result;
}

extern "C" {

#include "dispatch_table.hpp"

EMSCRIPTEN_KEEPALIVE
void* createCache(int w, int h, size_t bytes, bool is_heuristic) {
    if (is_heuristic) {
        DISPATCH_CREATE_HEURISTIC_CACHE(w, h, bytes);
    } else {
        DISPATCH_CREATE_EXACT_CACHE(w, h, bytes);
    }
}

EMSCRIPTEN_KEEPALIVE
void destroyCache(void* cache) {
    // Shared pointer destruction handled in TS wrapper for TTs
}

EMSCRIPTEN_KEEPALIVE
void* createSolver(int w, int h, void* cache_ptr, bool is_heuristic) {
    if (is_heuristic) {
        DISPATCH_CREATE_HEURISTIC(w, h, cache_ptr);
    } else {
        DISPATCH_CREATE_EXACT(w, h, cache_ptr);
    }
}

EMSCRIPTEN_KEEPALIVE
void destroySolver(void* solver, int w, int h, bool is_heuristic) {
    DISPATCH_DELETE(w, h, solver);
}

EMSCRIPTEN_KEEPALIVE
void stopSolver(void* solver, int w, int h) {
    DISPATCH_EXACT_VOID(w, h, stop, solver);
}

EMSCRIPTEN_KEEPALIVE
void* createBook(int w, int h, const uint8_t* data, size_t size) {
    DISPATCH_STATIC(w, h, runCreateBook, data, size);
}

EMSCRIPTEN_KEEPALIVE
void destroyBook(void* book, int w, int h) {
    DISPATCH_DELETE_BOOK(w, h, book);
}

EMSCRIPTEN_KEEPALIVE
int32_t* solveExact(void* solver, int w, int h, const char* position, bool weak, int threads, void* book_ptr, double timeout_ms) {
    DISPATCH_EXACT(runSolve, position, weak, threads, book_ptr, timeout_ms);
}

EMSCRIPTEN_KEEPALIVE
int32_t* solveHeuristic(void* solver, int w, int h, const char* position, int max_depth, int threads, void* book_ptr, double timeout_ms) {
    DISPATCH_HEURISTIC(runSolveHeuristic, position, max_depth, threads, book_ptr, timeout_ms);
}

EMSCRIPTEN_KEEPALIVE
int32_t* analyzeExact(void* solver, int w, int h, const char* position, bool weak, int threads, void* book_ptr, double timeout_ms) {
    DISPATCH_EXACT(runAnalysis, position, weak, threads, book_ptr, timeout_ms);
}

EMSCRIPTEN_KEEPALIVE
int32_t* analyzeHeuristic(void* solver, int w, int h, const char* position, int max_depth, int threads, double timeout_ms) {
    DISPATCH_HEURISTIC(runHeuristicAnalysis, position, max_depth, threads, timeout_ms);
}

EMSCRIPTEN_KEEPALIVE
double getNodeCount(void* solver, int w, int h) {
    DISPATCH_EXACT_RETURN(w, h, getNodeCount, solver);
}

}
