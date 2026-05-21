#import "Connect4Solver.h"
#import <React/RCTLog.h>
#import <vector>
#import <string>
#import <sstream>

// Include the deeply optimized singleton instantiations seamlessly mapped into pure ARM binary output natively
#include "../native/bindings_core.hpp"
#include "../native/dispatch_table.hpp"

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

@implementation Connect4Solver

RCT_EXPORT_MODULE()

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(createCache:(int)w height:(int)h sizeBytes:(double)sizeBytes isHeuristic:(BOOL)is_heuristic)
{
    size_t bytes = static_cast<size_t>(sizeBytes);
    void* ptr = nullptr;
    if (is_heuristic) {
        ptr = dispatch<void*>(w, h, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::HeuristicSolver::createCache(bytes).release();
        });
    } else {
        ptr = dispatch<void*>(w, h, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::Solver::createCache(bytes).release();
        });
    }
    return ptrToString(ptr);
} else {
        if (w == 6 && h == 5) ptr = C4_6x5::GameSolver::Connect4::Solver::createCache(bytes).release();
        else if (w == 6 && h == 6) ptr = C4_6x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        else if (w == 7 && h == 6) ptr = C4_7x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        else if (w == 7 && h == 7) ptr = C4_7x7::GameSolver::Connect4::Solver::createCache(bytes).release();
        else if (w == 8 && h == 6) ptr = C4_8x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        else if (w == 9 && h == 7) ptr = C4_9x7::GameSolver::Connect4::Solver::createCache(bytes).release();
        else if (w == 9 && h == 6) ptr = C4_9x6::GameSolver::Connect4::Solver::createCache(bytes).release();
        else if (w == 11 && h == 4) ptr = C4_11x4::GameSolver::Connect4::Solver::createCache(bytes).release();
    }
    return ptrToString(ptr);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(createBookFromBuffer:(int)w height:(int)h base64:(NSString *)base64Str)
{
    NSData *data = [[NSData alloc] initWithBase64EncodedString:base64Str options:0];
    const uint8_t *bytes = (const uint8_t *)[data bytes];
    size_t length = [data length];
    
    void* ptr = dispatch<void*>(w, h, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>::load_from_memory(bytes, length, Size::w, Size::h).release();
    });
    
    return ptrToString(ptr);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(destroyBook:(int)w height:(int)h bookPtrStr:(NSString *)bookPtrStr)
{
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    if (!bookPtr) return @(NO);
    
    dispatch_void(w, h, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        delete static_cast<GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>*>(bookPtr);
    });
    
    return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(destroyCache:(NSString *)cachePtrStr)
{
    auto cache = stringToPtr<GameSolver::Connect4::Cache>(cachePtrStr);
    delete cache;
    return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(createSolver:(int)w height:(int)h cachePtrStr:(NSString *)cachePtrStr isHeuristic:(BOOL)is_heuristic)
{
    auto cache = stringToPtr<GameSolver::Connect4::Cache>(cachePtrStr);
    void* ptr = nullptr;
    if (is_heuristic) {
        ptr = dispatch<void*>(w, h, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::HeuristicSolver::createWithCache(cache).release();
        });
    } else {
        ptr = dispatch<void*>(w, h, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::Solver::createWithCache(cache).release();
        });
    }
    return ptrToString(ptr);
} else {
        if (w == 6 && h == 5) ptr = C4_6x5::GameSolver::Connect4::Solver::createWithCache(cache).release();
        else if (w == 6 && h == 6) ptr = C4_6x6::GameSolver::Connect4::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 6) ptr = C4_7x6::GameSolver::Connect4::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 7) ptr = C4_7x7::GameSolver::Connect4::Solver::createWithCache(cache).release();
        else if (w == 8 && h == 6) ptr = C4_8x6::GameSolver::Connect4::Solver::createWithCache(cache).release();
        else if (w == 9 && h == 7) ptr = C4_9x7::GameSolver::Connect4::Solver::createWithCache(cache).release();
        else if (w == 9 && h == 6) ptr = C4_9x6::GameSolver::Connect4::Solver::createWithCache(cache).release();
        else if (w == 11 && h == 4) ptr = C4_11x4::GameSolver::Connect4::Solver::createWithCache(cache).release();
    }
    return ptrToString(ptr);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(destroySolver:(NSString *)solverPtrStr width:(int)w height:(int)h isHeuristic:(BOOL)is_heuristic)
{
    void* solver = stringToPtr<void>(solverPtrStr);
    if (!solver) return @(NO);
    
    if (is_heuristic) {
        dispatch_void(w, h, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            delete static_cast<typename Size::HeuristicSolver*>(solver);
        });
    } else {
        dispatch_void(w, h, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            delete static_cast<typename Size::Solver*>(solver);
        });
    }
    return @(YES);
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
    return @(YES);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(stop:(NSString *)solverPtrStr width:(int)w height:(int)h isHeuristic:(BOOL)is_heuristic)
{
    void* solver = stringToPtr<void>(solverPtrStr);
    if (!solver) return @(NO);
    
    if (is_heuristic) {
        dispatch_void(w, h, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            static_cast<typename Size::HeuristicSolver*>(solver)->stop();
        });
    } else {
        dispatch_void(w, h, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            static_cast<typename Size::Solver*>(solver)->stop();
        });
    }
    return @(YES);
} else {
        if (w == 6 && h == 5) static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver)->stop();
        else if (w == 6 && h == 6) static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver)->stop();
        else if (w == 7 && h == 6) static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver)->stop();
        else if (w == 7 && h == 7) static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver)->stop();
        else if (w == 8 && h == 6) static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver)->stop();
        else if (w == 9 && h == 7) static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver)->stop();
        else if (w == 9 && h == 6) static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver)->stop();
        else if (w == 11 && h == 4) static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver)->stop();
    }
    return @(YES);
}

template <typename CoreSolver, typename CorePosition, int W, typename CoreBook>
NSArray* runNativeAnalysis(CoreSolver& solver, NSString* positionStr, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString([positionStr UTF8String]);
  CorePosition P;
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:(2 + W)];
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    [result addObject:@(P.isWinningMove(lastColPlayed) ? 1 : 2)];
    [result addObject:@(P.nbMoves())];
    for(int i = 0; i < W; i++) [result addObject:@(0)];
  } else {
    if (book_ptr) solver.loadBook(static_cast<CoreBook*>(book_ptr));
    else solver.loadBook(nullptr);
    [result addObject:@(0)];
    [result addObject:@(P.nbMoves())];
    std::vector<int> scores = solver.analyze(P, false, threads, nullptr, timeout_ms);
    for(int i = 0; i < W; i++) [result addObject:@(scores[i])];
  }
  return result;
}

template <typename CoreSolver, typename CorePosition, int W, typename CoreBook>
NSArray* runNativeSolve(CoreSolver& solver, NSString* positionStr, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString([positionStr UTF8String]);
  CorePosition P;
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:8];
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    [result addObject:@(P.isWinningMove(lastColPlayed) ? 1 : 2)];
    [result addObject:@(P.nbMoves())];
    for(int i = 2; i < 8; i++) [result addObject:@(0)];
  } else {
    if (book_ptr) solver.loadBook(static_cast<CoreBook*>(book_ptr));
    else solver.loadBook(nullptr);
    auto res = solver.solve(P, false, threads, nullptr, timeout_ms);
    [result addObject:@(0)];
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

template <typename CoreSolver, typename CorePosition, int W, typename CoreBook>
NSArray* runNativeHeuristicAnalysis(CoreSolver& solver, NSString* positionStr, int max_depth, int threads, double timeout_ms, void* book_ptr) {
  std::string positionString([positionStr UTF8String]);
  CorePosition P;
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:(2 + W)];
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    [result addObject:@(P.isWinningMove(lastColPlayed) ? 1 : 2)];
    [result addObject:@(P.nbMoves())];
    for(int i = 0; i < W; i++) [result addObject:@(0)];
    [result addObject:@(0)];
  } else {
    if (book_ptr) solver.loadBook(static_cast<CoreBook*>(book_ptr));
    else solver.loadBook(nullptr);
    [result addObject:@(0)];
    [result addObject:@(P.nbMoves())];
    std::vector<int> scores = solver.analyze_heuristic(P, max_depth, threads, timeout_ms);
    for(int i = 0; i < W; i++) [result addObject:@(scores[i])];
    [result addObject:@(scores[i])];
  }
  return result;
}

template <typename CoreSolver, typename CorePosition, int W, typename CoreBook>
NSArray* runNativeHeuristicSolve(CoreSolver& solver, NSString* positionStr, int max_depth, int threads, double timeout_ms, void* book_ptr) {
  std::string positionString([positionStr UTF8String]);
  CorePosition P;
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:8];
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    [result addObject:@(P.isWinningMove(lastColPlayed) ? 1 : 2)];
    [result addObject:@(P.nbMoves())];
    for(int i = 2; i < 8; i++) [result addObject:@(0)];
  } else {
    if (book_ptr) solver.loadBook(static_cast<CoreBook*>(book_ptr));
    else solver.loadBook(nullptr);
    auto res = solver.solve_heuristic(P, max_depth, timeout_ms, false, nullptr, threads);
    [result addObject:@(0)];
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

RCT_REMAP_METHOD(analyze,
                 analyzeSolverPtrStr:(NSString *)solverPtrStr
                 position:(NSString *)positionStr
                 threads:(int)threads
                 width:(int)width
                 height:(int)height
                 weak:(BOOL)weak
                 bookPtrStr:(NSString *)bookPtrStr
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    NSArray* resultArray = dispatch<NSArray*>(width, height, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeAnalysis<typename Size::Solver, GameSolver::Connect4::GenericPosition<Size::w, Size::h>, Size::w, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            *static_cast<typename Size::Solver*>(solver), positionStr, threads, bookPtr, 0
        );
    });
    
    if (!resultArray) {
      NSError *error = [NSError errorWithDomain:@"Connect4Solver" code:400 userInfo:@{NSLocalizedDescriptionKey: @"Unsupported board size"}];
      reject(@"unsupported_size", @"Unsupported board size", error);
      return;
    }
    resolve(resultArray);
  });
}

RCT_REMAP_METHOD(solve,
                 solveSolverPtrStr:(NSString *)solverPtrStr
                 position:(NSString *)positionStr
                 threads:(int)threads
                 width:(int)width
                 height:(int)height
                 weak:(BOOL)weak
                 bookPtrStr:(NSString *)bookPtrStr
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    NSArray* resultArray = dispatch<NSArray*>(width, height, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeSolve<typename Size::Solver, GameSolver::Connect4::GenericPosition<Size::w, Size::h>, Size::w, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            *static_cast<typename Size::Solver*>(solver), positionStr, threads, bookPtr, 0
        );
    });
    
    if (!resultArray) {
      NSError *error = [NSError errorWithDomain:@"Connect4Solver" code:400 userInfo:@{NSLocalizedDescriptionKey: @"Unsupported board size"}];
      reject(@"unsupported_size", @"Unsupported board size", error);
      return;
    }
    resolve(resultArray);
  });
}

RCT_REMAP_METHOD(analyzeHeuristic,
                 analyzeHeuristicSolverPtrStr:(NSString *)solverPtrStr
                 position:(NSString *)positionStr
                 maxDepth:(int)maxDepth
                 threads:(int)threads
                 timeoutMs:(double)timeoutMs
                 width:(int)width
                 height:(int)height
                 bookPtrStr:(NSString *)bookPtrStr
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    NSArray* resultArray = dispatch<NSArray*>(width, height, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeHeuristicAnalysis<typename Size::HeuristicSolver, GameSolver::Connect4::GenericPosition<Size::w, Size::h>, Size::w, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            *static_cast<typename Size::HeuristicSolver*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr
        );
    });
    
    if (!resultArray) {
      NSError *error = [NSError errorWithDomain:@"Connect4Solver" code:400 userInfo:@{NSLocalizedDescriptionKey: @"Unsupported board size"}];
      reject(@"unsupported_size", @"Unsupported board size", error);
      return;
    }
    resolve(resultArray);
  });
}

RCT_REMAP_METHOD(solveHeuristic,
                 solveHeuristicSolverPtrStr:(NSString *)solverPtrStr
                 position:(NSString *)positionStr
                 maxDepth:(int)maxDepth
                 threads:(int)threads
                 timeoutMs:(double)timeoutMs
                 width:(int)width
                 height:(int)height
                 bookPtrStr:(NSString *)bookPtrStr
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    NSArray* resultArray = dispatch<NSArray*>(width, height, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeHeuristicSolve<typename Size::HeuristicSolver, GameSolver::Connect4::GenericPosition<Size::w, Size::h>, Size::w, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            *static_cast<typename Size::HeuristicSolver*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr
        );
    });
    
    if (!resultArray) {
      NSError *error = [NSError errorWithDomain:@"Connect4Solver" code:400 userInfo:@{NSLocalizedDescriptionKey: @"Unsupported board size"}];
      reject(@"unsupported_size", @"Unsupported board size", error);
      return;
    }
    resolve(resultArray);
  });
}

@end
