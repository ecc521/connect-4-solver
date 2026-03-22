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

@end
