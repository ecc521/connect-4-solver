#import "Connect4SolverWrapper.h"
#include <vector>
#include <string>
#include <sstream>
#include "../../native/dispatch_table.hpp"
#include "../../native/embedded_books.hpp"

// Pointer conversion helpers
template <typename T>
NSString* ptrToString(T* ptr) {
    if (!ptr) return @"0";
    std::ostringstream oss;
    oss << reinterpret_cast<uintptr_t>(ptr);
    return [NSString stringWithUTF8String:oss.str().c_str()];
}

template <typename T>
T* stringToPtr(NSString* str) {
    const char *chars = [str UTF8String];
    uintptr_t addr = 0;
    std::istringstream iss(chars);
    iss >> addr;
    return reinterpret_cast<T*>(addr);
}

@implementation Connect4SolverWrapper

+ (NSString*)createCache:(int)w height:(int)h sizeBytes:(double)sizeBytes isHeuristic:(BOOL)isHeuristic align:(int)align wrap:(BOOL)wrap {
    size_t bytes = static_cast<size_t>(sizeBytes);
    void* ptr = nullptr;
    if (isHeuristic) {
        ptr = dispatch<void*>(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::HeuristicSolver::createCache(bytes).release();
        });
    } else {
        ptr = dispatch<void*>(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::Solver::createCache(bytes).release();
        });
    }
    return ptrToString(ptr);
}

+ (void)destroyCache:(NSString*)cachePtrStr {
    auto cache = stringToPtr<GameSolver::Connect4::Cache>(cachePtrStr);
    delete cache;
}

+ (NSString*)createSolver:(int)w height:(int)h cachePtrStr:(NSString*)cachePtrStr isHeuristic:(BOOL)isHeuristic align:(int)align wrap:(BOOL)wrap {
    auto cache = stringToPtr<GameSolver::Connect4::Cache>(cachePtrStr);
    void* ptr = nullptr;
    if (isHeuristic) {
        ptr = dispatch<void*>(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::HeuristicSolver::createWithCache(cache).release();
        });
    } else {
        ptr = dispatch<void*>(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::Solver::createWithCache(cache).release();
        });
    }
    return ptrToString(ptr);
}

+ (void)destroySolver:(NSString*)solverPtrStr width:(int)w height:(int)h isHeuristic:(BOOL)isHeuristic align:(int)align wrap:(BOOL)wrap {
    void* solver = stringToPtr<void>(solverPtrStr);
    if (!solver) return;
    
    if (isHeuristic) {
        dispatch_void(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            delete static_cast<typename Size::HeuristicSolver*>(solver);
        });
    } else {
        dispatch_void(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            delete static_cast<typename Size::Solver*>(solver);
        });
    }
}

+ (void)stop:(NSString*)solverPtrStr width:(int)w height:(int)h isHeuristic:(BOOL)isHeuristic align:(int)align wrap:(BOOL)wrap {
    void* solver = stringToPtr<void>(solverPtrStr);
    if (!solver) return;
    
    if (isHeuristic) {
        dispatch_void(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            static_cast<typename Size::HeuristicSolver*>(solver)->stop();
        });
    } else {
        dispatch_void(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            static_cast<typename Size::Solver*>(solver)->stop();
        });
    }
}

+ (NSString*)createBookFromBuffer:(int)w height:(int)h base64Str:(NSString*)base64Str {
    NSData *data = [[NSData alloc] initWithBase64EncodedString:base64Str options:0];
    const uint8_t* unsignedBytes = reinterpret_cast<const uint8_t*>([data bytes]);
    NSUInteger length = [data length];
    
    int align = 4; bool wrap = false;
    void* ptr = dispatch<void*>(w, h, align, wrap, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>::load_from_memory(unsignedBytes, length, Size::w, Size::h).release();
    });
    
    return ptrToString(ptr);
}

+ (void)destroyBook:(int)w height:(int)h bookPtrStr:(NSString*)bookPtrStr {
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    if (!bookPtr) return;
    
    int align = 4; bool wrap = false;
    dispatch_void(w, h, align, wrap, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        delete static_cast<GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>*>(bookPtr);
    });
}

// Resolves the effective book: user-supplied if set, else the embedded static book.
template <int W, int H, typename CoreBook>
const CoreBook* getEffectiveBookObjc(void* book_ptr) {
    if (book_ptr) return static_cast<const CoreBook*>(book_ptr);
    const uint8_t* data = EmbeddedBooks::getBookData(W, H);
    if (!data) return nullptr;
    static const CoreBook* embedded =
        static_cast<const CoreBook*>(
            GameSolver::Connect4::OpeningBookBase<W, H>::load_from_memory(
                data, EmbeddedBooks::getBookSize(W, H), W, H).release());
    return embedded;
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
NSArray<NSNumber*>* runObjcAnalysis(int w, int h, CoreSolver& solver, const char* positionStr, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString(positionStr);
  CorePosition P(w, h);
  int active_w = W == -1 ? w : W;
  NSMutableArray<NSNumber*>* result = [NSMutableArray array];
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    [result addObject:@(P.isWinningMove(lastColPlayed) ? 1 : 2)];
    [result addObject:@(P.nbMoves())];
    for(int i = 0; i < active_w; i++) [result addObject:@0];
  } else {
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookObjc<W, H, CoreBook>(book_ptr)));
    [result addObject:@0];
    [result addObject:@(P.nbMoves())];
    std::vector<int> scores = solver.analyze(P, false, threads, nullptr, timeout_ms);
    for(int i = 0; i < active_w; i++) [result addObject:@(scores[i])];
  }
  return result;
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
NSArray<NSNumber*>* runObjcSolve(int w, int h, CoreSolver& solver, const char* positionStr, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString(positionStr);
  CorePosition P(w, h);
  NSMutableArray<NSNumber*>* result = [NSMutableArray array];
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    [result addObject:@(P.isWinningMove(lastColPlayed) ? 1 : 2)];
    [result addObject:@(P.nbMoves())];
    for(int i = 2; i < 8; i++) [result addObject:@0];
  } else {
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookObjc<W, H, CoreBook>(book_ptr)));
    auto res = solver.solve(P, false, threads, nullptr, timeout_ms);
    [result addObject:@0];
    [result addObject:@(P.nbMoves())];
    [result addObject:@(res.score)];
    [result addObject:@(res.bestMove)];
    [result addObject:@(res.depth)];
    [result addObject:@((int)(res.nodes & 0xFFFFFFFF))];
    [result addObject:@((int)(res.nodes >> 32))];
    [result addObject:@(res.aborted ? 1 : 0)];
  }
  return result;
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
NSArray<NSNumber*>* runObjcHeuristicAnalysis(int w, int h, CoreSolver& solver, const char* positionStr, int max_depth, int threads, double timeout_ms, void* book_ptr) {
  std::string positionString(positionStr);
  CorePosition P(w, h);
  int active_w = W == -1 ? w : W;
  NSMutableArray<NSNumber*>* result = [NSMutableArray array];
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    [result addObject:@(P.isWinningMove(lastColPlayed) ? 1 : 2)];
    [result addObject:@(P.nbMoves())];
    for(int i = 0; i < active_w; i++) [result addObject:@0];
    [result addObject:@0];
  } else {
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookObjc<W, H, CoreBook>(book_ptr)));
    [result addObject:@0];
    [result addObject:@(P.nbMoves())];
    auto res = solver.analyze_heuristic(P, max_depth, threads, timeout_ms);
    std::vector<int> scores = res.first;
    for(int i = 0; i < active_w; i++) [result addObject:@(scores[i])];
    [result addObject:@(res.second)];
  }
  return result;
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
NSArray<NSNumber*>* runObjcHeuristicSolve(int w, int h, CoreSolver& solver, const char* positionStr, int max_depth, int threads, double timeout_ms, void* book_ptr) {
  std::string positionString(positionStr);
  CorePosition P(w, h);
  NSMutableArray<NSNumber*>* result = [NSMutableArray array];
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    [result addObject:@(P.isWinningMove(lastColPlayed) ? 1 : 2)];
    [result addObject:@(P.nbMoves())];
    for(int i = 2; i < 8; i++) [result addObject:@0];
  } else {
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookObjc<W, H, CoreBook>(book_ptr)));
    auto res = solver.solve_heuristic(P, max_depth, timeout_ms, false, nullptr, threads);
    [result addObject:@0];
    [result addObject:@(P.nbMoves())];
    [result addObject:@(res.score)];
    [result addObject:@(res.bestMove)];
    [result addObject:@(res.depth)];
    [result addObject:@((int)(res.nodes & 0xFFFFFFFF))];
    [result addObject:@((int)(res.nodes >> 32))];
    [result addObject:@(res.aborted ? 1 : 0)];
  }
  return result;
}


+ (NSArray<NSNumber*>*)analyze:(NSString*)solverPtrStr position:(NSString*)position threads:(int)threads width:(int)w height:(int)h bookPtrStr:(NSString*)bookPtrStr align:(int)align wrap:(BOOL)wrap {
    const char *posChars = [position UTF8String];
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    return dispatch<NSArray<NSNumber*>*>(w, h, align, wrap, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runObjcAnalysis<typename Size::Solver, GameSolver::Connect4::GenericPosition<Size::w, Size::h, Size::align, Size::wrap>, Size::w, Size::h, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            w, h, *static_cast<typename Size::Solver*>(solver), posChars, threads, bookPtr, 0
        );
    });
}

+ (NSArray<NSNumber*>*)solve:(NSString*)solverPtrStr position:(NSString*)position threads:(int)threads width:(int)w height:(int)h bookPtrStr:(NSString*)bookPtrStr align:(int)align wrap:(BOOL)wrap {
    const char *posChars = [position UTF8String];
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    return dispatch<NSArray<NSNumber*>*>(w, h, align, wrap, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runObjcSolve<typename Size::Solver, GameSolver::Connect4::GenericPosition<Size::w, Size::h, Size::align, Size::wrap>, Size::w, Size::h, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            w, h, *static_cast<typename Size::Solver*>(solver), posChars, threads, bookPtr, 0
        );
    });
}

+ (NSArray<NSNumber*>*)analyzeHeuristic:(NSString*)solverPtrStr position:(NSString*)position maxDepth:(int)maxDepth threads:(int)threads timeoutMs:(double)timeoutMs width:(int)w height:(int)h bookPtrStr:(NSString*)bookPtrStr align:(int)align wrap:(BOOL)wrap {
    const char *posChars = [position UTF8String];
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    return dispatch<NSArray<NSNumber*>*>(w, h, align, wrap, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runObjcHeuristicAnalysis<typename Size::HeuristicSolver, GameSolver::Connect4::GenericPosition<Size::w, Size::h, Size::align, Size::wrap>, Size::w, Size::h, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            w, h, *static_cast<typename Size::HeuristicSolver*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr
        );
    });
}

+ (NSArray<NSNumber*>*)solveHeuristic:(NSString*)solverPtrStr position:(NSString*)position maxDepth:(int)maxDepth threads:(int)threads timeoutMs:(double)timeoutMs width:(int)w height:(int)h bookPtrStr:(NSString*)bookPtrStr align:(int)align wrap:(BOOL)wrap {
    const char *posChars = [position UTF8String];
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    return dispatch<NSArray<NSNumber*>*>(w, h, align, wrap, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runObjcHeuristicSolve<typename Size::HeuristicSolver, GameSolver::Connect4::GenericPosition<Size::w, Size::h, Size::align, Size::wrap>, Size::w, Size::h, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            w, h, *static_cast<typename Size::HeuristicSolver*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr
        );
    });
}

@end
