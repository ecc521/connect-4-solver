#import "Connect4Solver.h"
#import <React/RCTLog.h>
#import <vector>
#import <string>
#import <sstream>

// Include the deeply optimized singleton instantiations seamlessly mapped into pure ARM binary output natively
#include "../native/bindings_core.hpp"

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
    void* ptr = nullptr;
    size_t bytes = static_cast<size_t>(sizeBytes);
    if (is_heuristic) {
        if (w == 6 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<6, 5>::createCache(bytes).release();
        else if (w == 6 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<6, 6>::createCache(bytes).release();
        else if (w == 7 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<7, 6>::createCache(bytes).release();
        else if (w == 7 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<7, 7>::createCache(bytes).release();
        else if (w == 8 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<8, 6>::createCache(bytes).release();
        else if (w == 9 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<9, 7>::createCache(bytes).release();
        else if (w == 8 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<8, 8>::createCache(bytes).release();
        else if (w == 10 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<10, 7>::createCache(bytes).release();
        else if (w == 9 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<9, 9>::createCache(bytes).release();
        else if (w == 10 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<10, 10>::createCache(bytes).release();
        else if (w == 9 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<9, 6>::createCache(bytes).release();
        else if (w == 11 && h == 4) ptr = GameSolver::Connect4::HeuristicSolver<11, 4>::createCache(bytes).release();
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
        if (w == 6 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<6, 5>::createWithCache(cache).release();
        else if (w == 6 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<6, 6>::createWithCache(cache).release();
        else if (w == 7 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<7, 6>::createWithCache(cache).release();
        else if (w == 7 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<7, 7>::createWithCache(cache).release();
        else if (w == 8 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<8, 6>::createWithCache(cache).release();
        else if (w == 9 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<9, 7>::createWithCache(cache).release();
        else if (w == 8 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<8, 8>::createWithCache(cache).release();
        else if (w == 10 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<10, 7>::createWithCache(cache).release();
        else if (w == 9 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<9, 9>::createWithCache(cache).release();
        else if (w == 10 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<10, 10>::createWithCache(cache).release();
        else if (w == 9 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<9, 6>::createWithCache(cache).release();
        else if (w == 11 && h == 4) ptr = GameSolver::Connect4::HeuristicSolver<11, 4>::createWithCache(cache).release();
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
    return @(YES);
}

template <typename CoreSolver, typename CorePosition, int W>
NSArray* runNativeAnalysis(CoreSolver& solver, NSString* positionStr, int threads) {
  std::string positionString([positionStr UTF8String]);
  CorePosition P;
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:(2 + W)];
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    [result addObject:@(P.isWinningMove(lastColPlayed) ? 1 : 2)];
    [result addObject:@(P.nbMoves())];
    for(int i = 0; i < W; i++) [result addObject:@(0)];
  } else {
    [result addObject:@(0)];
    [result addObject:@(P.nbMoves())];
    std::vector<int> scores = solver.analyze(P, false, threads);
    for(int i = 0; i < W; i++) [result addObject:@(scores[i])];
  }
  return result;
}

template <typename CoreSolver, typename CorePosition, int W>
NSArray* runNativeHeuristicAnalysis(CoreSolver& solver, NSString* positionStr, int max_depth, int threads, double timeout_ms) {
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
    [result addObject:@(0)];
    [result addObject:@(P.nbMoves())];
    std::vector<int> scores = solver.analyze_heuristic(P, max_depth, threads, timeout_ms);
    for(int i = 0; i < W; i++) [result addObject:@(scores[i])];
    [result addObject:@(scores[i])];
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
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
    NSArray *resultArray;
    void* solver = stringToPtr<void>(solverPtrStr);
    
    if (width == 6 && height == 5) resultArray = runNativeAnalysis<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6>(*static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver), positionStr, threads);
    else if (width == 6 && height == 6) resultArray = runNativeAnalysis<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6>(*static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads);
    else if (width == 7 && height == 6) resultArray = runNativeAnalysis<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7>(*static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads);
    else if (width == 7 && height == 7) resultArray = runNativeAnalysis<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7>(*static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver), positionStr, threads);
    else if (width == 8 && height == 6) resultArray = runNativeAnalysis<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8>(*static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads);
    else if (width == 9 && height == 7) resultArray = runNativeAnalysis<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9>(*static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver), positionStr, threads);
    else if (width == 9 && height == 6) resultArray = runNativeAnalysis<C4_9x6::GameSolver::Connect4::Solver, C4_9x6::GameSolver::Connect4::Position, 9>(*static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads);
    else if (width == 11 && height == 4) resultArray = runNativeAnalysis<C4_11x4::GameSolver::Connect4::Solver, C4_11x4::GameSolver::Connect4::Position, 11>(*static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver), positionStr, threads);
    else {
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
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
    NSArray *resultArray;
    void* solver = stringToPtr<void>(solverPtrStr);
    
    if (width == 6 && height == 5) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else if (width == 6 && height == 6) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else if (width == 7 && height == 6) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else if (width == 7 && height == 7) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else if (w == 8 && h == 6) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else if (width == 9 && height == 7) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else if (width == 8 && height == 8) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else if (width == 10 && height == 7) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else if (width == 9 && height == 9) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else if (width == 10 && height == 10) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else if (width == 9 && height == 6) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 6>, GameSolver::Connect4::GenericPosition<9, 6>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else if (width == 11 && height == 4) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<11, 4>, GameSolver::Connect4::GenericPosition<11, 4>, 11>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver), positionStr, maxDepth, threads, timeoutMs);
    else {
      NSError *error = [NSError errorWithDomain:@"Connect4Solver" code:400 userInfo:@{NSLocalizedDescriptionKey: @"Unsupported board size"}];
      reject(@"unsupported_size", @"Unsupported board size", error);
      return;
    }
    resolve(resultArray);
  });
}

@end
