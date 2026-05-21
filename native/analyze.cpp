#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <cstring>
#include <memory>
#include <atomic>
#include "bindings_core.hpp"
#include "embedded_books.hpp"

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

using namespace GameSolver::Connect4;

template <int W, int H>
const OpeningBookBase<W, H>* getEffectiveBook(void* book_ptr) {
  if (book_ptr) return static_cast<const OpeningBookBase<W, H>*>(book_ptr);
  const uint8_t* data = EmbeddedBooks::getBookData(W, H);
  if (!data) return nullptr;
  // Load once per board size, cache for the lifetime of the process.
  static const OpeningBookBase<W, H>* embedded =
      OpeningBookBase<W, H>::load_from_memory(data, EmbeddedBooks::getBookSize(W, H), W, H).release();
  return embedded;
}

template <int W, int H>
int32_t* runAnalysis(Solver<W, H>& solver, const char* positionCharArr, bool weak, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString(positionCharArr);
  GenericPosition<W, H> P;
  int32_t* result = (int32_t*)malloc((6 + W) * sizeof(int32_t));
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
    result[1] = P.nbMoves();
    for(int i = 0; i < W; i++) result[2 + i] = 0;
    result[2 + W] = 0;
    result[3 + W] = 0;
    result[4 + W] = 0;
    result[5 + W] = 0;
  } else {
    solver.loadBook(getEffectiveBook<W, H>(book_ptr));
    double end_time_ms = 0;
    if (timeout_ms > 0) end_time_ms = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count() + timeout_ms;
    auto res = solver.analyze(P, weak, threads, nullptr, end_time_ms);
    result[0] = 0;
    result[1] = P.nbMoves();
    for(int i = 0; i < W; i++) result[2 + i] = res[i];
    result[2 + W] = 0; // Depth reached undefined for exact
    result[3 + W] = solver.isAborted() ? 1 : 0;
    uint64_t nodes = solver.getNodeCount();
    result[4 + W] = (int32_t)(nodes & 0xFFFFFFFF);
    result[5 + W] = (int32_t)((nodes >> 32) & 0xFFFFFFFF);
  }
  return result;
}

template <int W, int H>
int32_t* runSolve(Solver<W, H>& solver, const char* positionCharArr, bool weak, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString(positionCharArr);
  GenericPosition<W, H> P;
  int32_t* result = (int32_t*)malloc(8 * sizeof(int32_t));
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
    result[1] = P.nbMoves();
    for(int i = 2; i < 8; i++) result[i] = 0;
  } else {
    solver.loadBook(getEffectiveBook<W, H>(book_ptr));
    double end_time_ms = 0;
    if (timeout_ms > 0) end_time_ms = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count() + timeout_ms;
    auto res = solver.solve(P, weak, threads, nullptr, end_time_ms);
    result[0] = 0;
    result[1] = P.nbMoves();
    result[2] = res.score;
    result[3] = res.bestMove;
    result[4] = res.depth;
    result[5] = (int32_t)(res.nodes & 0xFFFFFFFF);
    result[6] = (int32_t)((res.nodes >> 32) & 0xFFFFFFFF);
    result[7] = res.aborted ? 1 : 0;
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
    solver.loadBook(getEffectiveBook<W, H>(book_ptr));
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
int32_t* runHeuristicAnalysis(HeuristicSolver<W, H>& solver, const char* positionCharArr, int max_depth, int threads, double timeout_ms) {
  std::string positionString(positionCharArr);
  GenericPosition<W, H> P;
  int32_t* result = (int32_t*)malloc((6 + W) * sizeof(int32_t));
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
    result[1] = P.nbMoves();
    for(int i = 0; i < W; i++) result[2 + i] = 0;
    result[2 + W] = 0;
    result[3 + W] = 0;
    result[4 + W] = 0;
    result[5 + W] = 0;
  } else {
    result[0] = 0;
    result[1] = P.nbMoves();
    double end_time_ms = 0;
    if (timeout_ms > 0) end_time_ms = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count() + timeout_ms;
    auto res = solver.analyze_heuristic(P, max_depth, threads, end_time_ms);
    for(int i = 0; i < W; i++) result[2 + i] = res.first[i];
    result[2 + W] = res.second;
    result[3 + W] = solver.isAborted() ? 1 : 0;
    uint64_t nodes = solver.getNodeCount();
    result[4 + W] = (int32_t)(nodes & 0xFFFFFFFF);
    result[5 + W] = (int32_t)((nodes >> 32) & 0xFFFFFFFF);
  }
  return result;
}

template <int W, int H>
void runHeuristicStop(HeuristicSolver<W, H>& solver, bool /*dummy*/) {
    solver.stop();
}

template <int W, int H>
double runHeuristicGetNodeCount(HeuristicSolver<W, H>& solver, bool /*dummy*/) {
    return (double)solver.getNodeCount();
}

template <int W, int H>
void runHeuristicDelete(HeuristicSolver<W, H>& solver, bool /*dummy*/) {
    delete &solver;
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
    return nullptr;
}

EMSCRIPTEN_KEEPALIVE
void destroyCache(void* cache) {
    if (cache) {
        delete static_cast<::GameSolver::Connect4::Cache*>(cache);
    }
}

EMSCRIPTEN_KEEPALIVE
void* createSolver(int w, int h, void* cache_ptr, bool is_heuristic) {
    if (is_heuristic) {
        DISPATCH_CREATE_HEURISTIC(w, h, cache_ptr);
    } else {
        DISPATCH_CREATE_EXACT(w, h, cache_ptr);
    }
    return nullptr;
}

EMSCRIPTEN_KEEPALIVE
void destroySolver(int w, int h, void* solver, bool is_heuristic) {
    if (is_heuristic) {
        DISPATCH_HEURISTIC_VOID(runHeuristicDelete, false);
    } else {
        DISPATCH_DELETE(w, h, solver);
    }
}

EMSCRIPTEN_KEEPALIVE
void stopSolver(int w, int h, void* solver, bool is_heuristic) {
    if (is_heuristic) {
        DISPATCH_HEURISTIC_VOID(runHeuristicStop, false);
    } else {
        DISPATCH_EXACT_VOID(w, h, stop, solver);
    }
}

EMSCRIPTEN_KEEPALIVE
void* createBookFromBuffer(int w, int h, const uint8_t* data, size_t size) {
    DISPATCH_STATIC(w, h, runCreateBook, data, size);
}

EMSCRIPTEN_KEEPALIVE
void destroyBook(int w, int h, void* book) {
    DISPATCH_DELETE_BOOK(w, h, book);
}

EMSCRIPTEN_KEEPALIVE
int32_t* solveExact(int w, int h, void* solver, const char* position, bool weak, int threads, void* book_ptr, double timeout_ms) {
    DISPATCH_EXACT(runSolve, position, weak, threads, book_ptr, timeout_ms);
}

EMSCRIPTEN_KEEPALIVE
int32_t* solveHeuristic(int w, int h, void* solver, const char* position, int max_depth, int threads, double timeout_ms, void* book_ptr) {
    DISPATCH_HEURISTIC(runSolveHeuristic, position, max_depth, threads, book_ptr, timeout_ms);
}

EMSCRIPTEN_KEEPALIVE
int32_t* analyzeExact(int w, int h, void* solver, const char* position, bool weak, int threads, void* book_ptr, double timeout_ms) {
    DISPATCH_EXACT(runAnalysis, position, weak, threads, book_ptr, timeout_ms);
}

EMSCRIPTEN_KEEPALIVE
int32_t* analyzeHeuristic(int w, int h, void* solver, const char* position, int max_depth, int threads, double timeout_ms) {
    DISPATCH_HEURISTIC(runHeuristicAnalysis, position, max_depth, threads, timeout_ms);
}

EMSCRIPTEN_KEEPALIVE
double getNodeCount(int w, int h, void* solver, bool is_heuristic) {
    if (is_heuristic) {
        DISPATCH_HEURISTIC_DOUBLE(runHeuristicGetNodeCount, false);
    } else {
        DISPATCH_EXACT_RETURN(w, h, getNodeCount, solver);
    }
}

}

