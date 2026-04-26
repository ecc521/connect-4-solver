#import "Connect4Solver.h"
#import <React/RCTLog.h>
#import <vector>
#import <string>

// Include the deeply optimized singleton instantiations seamlessly mapped into pure ARM binary output natively
#include "../native/bindings_core.hpp"

@implementation Connect4Solver

RCT_EXPORT_MODULE()

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
  } else {
    [result addObject:@(0)];
    [result addObject:@(P.nbMoves())];
    std::vector<int> scores = solver.analyze_heuristic(P, max_depth, threads, timeout_ms);
    for(int i = 0; i < W; i++) [result addObject:@(scores[i])];
  }
  return result;
}

RCT_REMAP_METHOD(analyze,
                 analyzePosition:(NSString *)positionStr
                 threads:(int)threads
                 width:(int)width
                 height:(int)height
                 weak:(BOOL)weak
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
    NSArray *resultArray;
    
    if (width == 6 && height == 5) {
      resultArray = runNativeAnalysis<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6>(SharedInstances::solver6x5, positionStr, threads);
    } else if (width == 6 && height == 6) {
      resultArray = runNativeAnalysis<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6>(SharedInstances::solver6x6, positionStr, threads);
    } else if (width == 7 && height == 6) {
      resultArray = runNativeAnalysis<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7>(SharedInstances::solver7x6, positionStr, threads);
    } else if (width == 7 && height == 7) {
      resultArray = runNativeAnalysis<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7>(SharedInstances::solver7x7, positionStr, threads);
    } else if (width == 8 && height == 6) {
      resultArray = runNativeAnalysis<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8>(SharedInstances::solver8x6, positionStr, threads);
    } else if (width == 9 && height == 7) {
      resultArray = runNativeAnalysis<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9>(SharedInstances::solver9x7, positionStr, threads);
    } else {
      NSError *error = [NSError errorWithDomain:@"Connect4Solver" code:400 userInfo:@{NSLocalizedDescriptionKey: @"Unsupported board size"}];
      reject(@"unsupported_size", @"Unsupported board size", error);
      return;
    }
    
    resolve(resultArray);
  });
}

RCT_REMAP_METHOD(analyzeHeuristic,
                 analyzeHeuristicPosition:(NSString *)positionStr
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
    
    if (width == 6 && height == 5) {
      resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6>(SharedInstances::heuristicSolver6x5, positionStr, maxDepth, threads, timeoutMs);
    } else if (width == 6 && height == 6) {
      resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6>(SharedInstances::heuristicSolver6x6, positionStr, maxDepth, threads, timeoutMs);
    } else if (width == 7 && height == 6) {
      resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7>(SharedInstances::heuristicSolver7x6, positionStr, maxDepth, threads, timeoutMs);
    } else if (width == 7 && height == 7) {
      resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7>(SharedInstances::heuristicSolver7x7, positionStr, maxDepth, threads, timeoutMs);
    } else if (width == 8 && height == 6) {
      resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8>(SharedInstances::heuristicSolver8x6, positionStr, maxDepth, threads, timeoutMs);
    } else if (width == 9 && height == 7) {
      resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9>(SharedInstances::heuristicSolver9x7, positionStr, maxDepth, threads, timeoutMs);
    } else if (width == 8 && height == 8) {
      resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8>(SharedInstances::heuristicSolver8x8, positionStr, maxDepth, threads, timeoutMs);
    } else if (width == 10 && height == 7) {
      resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10>(SharedInstances::heuristicSolver10x7, positionStr, maxDepth, threads, timeoutMs);
    } else if (width == 9 && height == 9) {
      resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9>(SharedInstances::heuristicSolver9x9, positionStr, maxDepth, threads, timeoutMs);
    } else if (width == 10 && height == 10) {
      resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10>(SharedInstances::heuristicSolver10x10, positionStr, maxDepth, threads, timeoutMs);
    } else {
      NSError *error = [NSError errorWithDomain:@"Connect4Solver" code:400 userInfo:@{NSLocalizedDescriptionKey: @"Unsupported board size"}];
      reject(@"unsupported_size", @"Unsupported board size", error);
      return;
    }
    
    resolve(resultArray);
  });
}

@end
