#import <Foundation/Foundation.h>

@interface Connect4SolverWrapper : NSObject

+ (NSString*)createCache:(int)w height:(int)h sizeBytes:(double)sizeBytes isHeuristic:(BOOL)isHeuristic align:(int)align wrap:(BOOL)wrap;
+ (void)destroyCache:(NSString*)cachePtrStr;
+ (NSString*)createSolver:(int)w height:(int)h cachePtrStr:(NSString*)cachePtrStr isHeuristic:(BOOL)isHeuristic align:(int)align wrap:(BOOL)wrap;
+ (void)destroySolver:(NSString*)solverPtrStr width:(int)w height:(int)h isHeuristic:(BOOL)isHeuristic align:(int)align wrap:(BOOL)wrap;
+ (void)stop:(NSString*)solverPtrStr width:(int)w height:(int)h isHeuristic:(BOOL)isHeuristic align:(int)align wrap:(BOOL)wrap;
+ (NSString*)createBookFromBuffer:(int)w height:(int)h base64Str:(NSString*)base64Str;
+ (void)destroyBook:(int)w height:(int)h bookPtrStr:(NSString*)bookPtrStr;

+ (NSArray<NSNumber*>*)analyze:(NSString*)solverPtrStr position:(NSString*)position threads:(int)threads width:(int)w height:(int)h bookPtrStr:(NSString*)bookPtrStr align:(int)align wrap:(BOOL)wrap;
+ (NSArray<NSNumber*>*)analyzeHeuristic:(NSString*)solverPtrStr position:(NSString*)position maxDepth:(int)maxDepth threads:(int)threads timeoutMs:(double)timeoutMs width:(int)w height:(int)h bookPtrStr:(NSString*)bookPtrStr align:(int)align wrap:(BOOL)wrap;

+ (NSArray<NSNumber*>*)solve:(NSString*)solverPtrStr position:(NSString*)position threads:(int)threads width:(int)w height:(int)h bookPtrStr:(NSString*)bookPtrStr align:(int)align wrap:(BOOL)wrap;
+ (NSArray<NSNumber*>*)solveHeuristic:(NSString*)solverPtrStr position:(NSString*)position maxDepth:(int)maxDepth threads:(int)threads timeoutMs:(double)timeoutMs width:(int)w height:(int)h bookPtrStr:(NSString*)bookPtrStr align:(int)align wrap:(BOOL)wrap;

@end
