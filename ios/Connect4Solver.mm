#import "Connect4Solver.h"
#import <React/RCTLog.h>
#import <vector>
#import <string>
#import <sstream>

// Include the deeply optimized singleton instantiations seamlessly mapped into pure ARM binary output natively
#include "../native/bindings_core.hpp"
#include "../native/embedded_books.hpp"

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

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(createBookFromBuffer:(int)w height:(int)h base64:(NSString *)base64Str)
{
    NSData *data = [[NSData alloc] initWithBase64EncodedString:base64Str options:0];
    const uint8_t *bytes = (const uint8_t *)[data bytes];
    size_t length = [data length];
    void* ptr = nullptr;
    
    if (w == 6 && h == 5) ptr = GameSolver::Connect4::OpeningBookBase<6, 5>::load_from_memory(bytes, length, w, h).release();
    else if (w == 6 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<6, 6>::load_from_memory(bytes, length, w, h).release();
    else if (w == 7 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<7, 6>::load_from_memory(bytes, length, w, h).release();
    else if (w == 7 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<7, 7>::load_from_memory(bytes, length, w, h).release();
    else if (w == 8 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<8, 6>::load_from_memory(bytes, length, w, h).release();
    else if (w == 9 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<9, 7>::load_from_memory(bytes, length, w, h).release();
    else if (w == 8 && h == 8) ptr = GameSolver::Connect4::OpeningBookBase<8, 8>::load_from_memory(bytes, length, w, h).release();
    else if (w == 10 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<10, 7>::load_from_memory(bytes, length, w, h).release();
    else if (w == 9 && h == 9) ptr = GameSolver::Connect4::OpeningBookBase<9, 9>::load_from_memory(bytes, length, w, h).release();
    else if (w == 10 && h == 10) ptr = GameSolver::Connect4::OpeningBookBase<10, 10>::load_from_memory(bytes, length, w, h).release();
    else if (w == 9 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<9, 6>::load_from_memory(bytes, length, w, h).release();
    else if (w == 11 && h == 4) ptr = GameSolver::Connect4::OpeningBookBase<11, 4>::load_from_memory(bytes, length, w, h).release();
    
    return ptrToString(ptr);
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(destroyBook:(int)w height:(int)h bookPtrStr:(NSString *)bookPtrStr)
{
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    if (!bookPtr) return @(NO);
    
    if (w == 6 && h == 5) delete static_cast<GameSolver::Connect4::OpeningBookBase<6, 5>*>(bookPtr);
    else if (w == 6 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<6, 6>*>(bookPtr);
    else if (w == 7 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<7, 6>*>(bookPtr);
    else if (w == 7 && h == 7) delete static_cast<GameSolver::Connect4::OpeningBookBase<7, 7>*>(bookPtr);
    else if (w == 8 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<8, 6>*>(bookPtr);
    else if (w == 9 && h == 7) delete static_cast<GameSolver::Connect4::OpeningBookBase<9, 7>*>(bookPtr);
    else if (w == 8 && h == 8) delete static_cast<GameSolver::Connect4::OpeningBookBase<8, 8>*>(bookPtr);
    else if (w == 10 && h == 7) delete static_cast<GameSolver::Connect4::OpeningBookBase<10, 7>*>(bookPtr);
    else if (w == 9 && h == 9) delete static_cast<GameSolver::Connect4::OpeningBookBase<9, 9>*>(bookPtr);
    else if (w == 10 && h == 10) delete static_cast<GameSolver::Connect4::OpeningBookBase<10, 10>*>(bookPtr);
    else if (w == 9 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<9, 6>*>(bookPtr);
    else if (w == 11 && h == 4) delete static_cast<GameSolver::Connect4::OpeningBookBase<11, 4>*>(bookPtr);
    
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

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(stop:(NSString *)solverPtrStr width:(int)w height:(int)h isHeuristic:(BOOL)is_heuristic)
{
    void* solver = stringToPtr<void>(solverPtrStr);
    if (!solver) return @(NO);
    
    if (is_heuristic) {
        if (w == 6 && h == 5) static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver)->stop();
        else if (w == 6 && h == 6) static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver)->stop();
        else if (w == 7 && h == 6) static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver)->stop();
        else if (w == 7 && h == 7) static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver)->stop();
        else if (w == 8 && h == 6) static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver)->stop();
        else if (w == 9 && h == 7) static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver)->stop();
        else if (w == 8 && h == 8) static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver)->stop();
        else if (w == 10 && h == 7) static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver)->stop();
        else if (w == 9 && h == 9) static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver)->stop();
        else if (w == 10 && h == 10) static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver)->stop();
        else if (w == 9 && h == 6) static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver)->stop();
        else if (w == 11 && h == 4) static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver)->stop();
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

template <int W, int H, typename CoreBook>
const CoreBook* getEffectiveBookIOS(void* book_ptr) {
    if (book_ptr) return static_cast<const CoreBook*>(book_ptr);
    const uint8_t* data = EmbeddedBooks::getBookData(W, H);
    if (!data) return nullptr;
    static const CoreBook* embedded =
        static_cast<const CoreBook*>(
            GameSolver::Connect4::OpeningBookBase<W, H>::load_from_memory(
                data, EmbeddedBooks::getBookSize(W, H), W, H).release());
    return embedded;
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
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookIOS<CorePosition::WIDTH, CorePosition::HEIGHT, CoreBook>(book_ptr)));
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
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookIOS<CorePosition::WIDTH, CorePosition::HEIGHT, CoreBook>(book_ptr)));
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
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookIOS<CorePosition::WIDTH, CorePosition::HEIGHT, CoreBook>(book_ptr)));
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
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookIOS<CorePosition::WIDTH, CorePosition::HEIGHT, CoreBook>(book_ptr)));
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
    NSArray *resultArray;
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    if (width == 6 && height == 5) resultArray = runNativeAnalysis<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6, GameSolver::Connect4::OpeningBookBase<6,5>>(*static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 6 && height == 6) resultArray = runNativeAnalysis<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6, GameSolver::Connect4::OpeningBookBase<6,6>>(*static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 7 && height == 6) resultArray = runNativeAnalysis<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7, GameSolver::Connect4::OpeningBookBase<7,6>>(*static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 7 && height == 7) resultArray = runNativeAnalysis<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7, GameSolver::Connect4::OpeningBookBase<7,7>>(*static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 8 && height == 6) resultArray = runNativeAnalysis<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8, GameSolver::Connect4::OpeningBookBase<8,6>>(*static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 9 && height == 7) resultArray = runNativeAnalysis<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9, GameSolver::Connect4::OpeningBookBase<9,7>>(*static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 9 && height == 6) resultArray = runNativeAnalysis<C4_9x6::GameSolver::Connect4::Solver, C4_9x6::GameSolver::Connect4::Position, 9, GameSolver::Connect4::OpeningBookBase<9,6>>(*static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 11 && height == 4) resultArray = runNativeAnalysis<C4_11x4::GameSolver::Connect4::Solver, C4_11x4::GameSolver::Connect4::Position, 11, GameSolver::Connect4::OpeningBookBase<11,4>>(*static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else {
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
    NSArray *resultArray;
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    if (width == 6 && height == 5) resultArray = runNativeSolve<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6, GameSolver::Connect4::OpeningBookBase<6,5>>(*static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 6 && height == 6) resultArray = runNativeSolve<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6, GameSolver::Connect4::OpeningBookBase<6,6>>(*static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 7 && height == 6) resultArray = runNativeSolve<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7, GameSolver::Connect4::OpeningBookBase<7,6>>(*static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 7 && height == 7) resultArray = runNativeSolve<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7, GameSolver::Connect4::OpeningBookBase<7,7>>(*static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 8 && height == 6) resultArray = runNativeSolve<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8, GameSolver::Connect4::OpeningBookBase<8,6>>(*static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 9 && height == 7) resultArray = runNativeSolve<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9, GameSolver::Connect4::OpeningBookBase<9,7>>(*static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 9 && height == 6) resultArray = runNativeSolve<C4_9x6::GameSolver::Connect4::Solver, C4_9x6::GameSolver::Connect4::Position, 9, GameSolver::Connect4::OpeningBookBase<9,6>>(*static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
    else if (width == 11 && height == 4) resultArray = runNativeSolve<C4_11x4::GameSolver::Connect4::Solver, C4_11x4::GameSolver::Connect4::Position, 11, GameSolver::Connect4::OpeningBookBase<11,4>>(*static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver), positionStr, threads, bookPtr, 0);
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
                 bookPtrStr:(NSString *)bookPtrStr
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0), ^{
    NSArray *resultArray;
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    if (width == 6 && height == 5) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6, GameSolver::Connect4::OpeningBookBase<6,5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 6 && height == 6) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6, GameSolver::Connect4::OpeningBookBase<6,6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 7 && height == 6) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7, GameSolver::Connect4::OpeningBookBase<7,6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 7 && height == 7) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7, GameSolver::Connect4::OpeningBookBase<7,7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 8 && height == 6) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8, GameSolver::Connect4::OpeningBookBase<8,6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 9 && height == 7) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9, GameSolver::Connect4::OpeningBookBase<9,7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 8 && height == 8) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8, GameSolver::Connect4::OpeningBookBase<8,8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 10 && height == 7) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10, GameSolver::Connect4::OpeningBookBase<10,7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 9 && height == 9) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9, GameSolver::Connect4::OpeningBookBase<9,9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 10 && height == 10) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10, GameSolver::Connect4::OpeningBookBase<10,10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 9 && height == 6) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 6>, GameSolver::Connect4::GenericPosition<9, 6>, 9, GameSolver::Connect4::OpeningBookBase<9,6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 11 && height == 4) resultArray = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<11, 4>, GameSolver::Connect4::GenericPosition<11, 4>, 11, GameSolver::Connect4::OpeningBookBase<11,4>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else {
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
    NSArray *resultArray;
    void* solver = stringToPtr<void>(solverPtrStr);
    void* bookPtr = stringToPtr<void>(bookPtrStr);
    
    if (width == 6 && height == 5) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6, GameSolver::Connect4::OpeningBookBase<6,5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 6 && height == 6) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6, GameSolver::Connect4::OpeningBookBase<6,6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 7 && height == 6) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7, GameSolver::Connect4::OpeningBookBase<7,6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 7 && height == 7) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7, GameSolver::Connect4::OpeningBookBase<7,7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 8 && height == 6) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8, GameSolver::Connect4::OpeningBookBase<8,6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 9 && height == 7) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9, GameSolver::Connect4::OpeningBookBase<9,7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 8 && height == 8) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8, GameSolver::Connect4::OpeningBookBase<8,8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 10 && height == 7) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10, GameSolver::Connect4::OpeningBookBase<10,7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 9 && height == 9) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9, GameSolver::Connect4::OpeningBookBase<9,9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 10 && height == 10) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10, GameSolver::Connect4::OpeningBookBase<10,10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 9 && height == 6) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<9, 6>, GameSolver::Connect4::GenericPosition<9, 6>, 9, GameSolver::Connect4::OpeningBookBase<9,6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else if (width == 11 && height == 4) resultArray = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<11, 4>, GameSolver::Connect4::GenericPosition<11, 4>, 11, GameSolver::Connect4::OpeningBookBase<11,4>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver), positionStr, maxDepth, threads, timeoutMs, bookPtr);
    else {
      NSError *error = [NSError errorWithDomain:@"Connect4Solver" code:400 userInfo:@{NSLocalizedDescriptionKey: @"Unsupported board size"}];
      reject(@"unsupported_size", @"Unsupported board size", error);
      return;
    }
    resolve(resultArray);
  });
}

@end
