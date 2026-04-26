#include <jni.h>
#include <vector>
#include <string>
#include "../../native/bindings_core.hpp"

template <typename CoreSolver, typename CorePosition, int W>
jintArray runNativeAnalysis(JNIEnv *env, CoreSolver& solver, const char* positionStr, int threads) {
  std::string positionString(positionStr);
  CorePosition P;
  
  std::vector<int> result;
  
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result.push_back(P.isWinningMove(lastColPlayed) ? 1 : 2);
    result.push_back(P.nbMoves());
    for(int i = 0; i < W; i++) result.push_back(0);
  } else {
    result.push_back(0);
    result.push_back(P.nbMoves());
    std::vector<int> scores = solver.analyze(P, false, threads);
    for(int i = 0; i < W; i++) result.push_back(scores[i]);
  }
  
  jintArray jResult = env->NewIntArray(result.size());
  env->SetIntArrayRegion(jResult, 0, result.size(), &result[0]);
  return jResult;
}

template <typename CoreSolver, typename CorePosition, int W>
jintArray runNativeHeuristicAnalysis(JNIEnv *env, CoreSolver& solver, const char* positionStr, int max_depth, int threads, double timeout_ms) {
  std::string positionString(positionStr);
  CorePosition P;
  
  std::vector<int> result;
  
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result.push_back(P.isWinningMove(lastColPlayed) ? 1 : 2);
    result.push_back(P.nbMoves());
    for(int i = 0; i < W; i++) result.push_back(0);
  } else {
    result.push_back(0);
    result.push_back(P.nbMoves());
    std::vector<int> scores = solver.analyze_heuristic(P, max_depth, threads, timeout_ms);
    for(int i = 0; i < W; i++) result.push_back(scores[i]);
  }
  
  jintArray jResult = env->NewIntArray(result.size());
  env->SetIntArrayRegion(jResult, 0, result.size(), &result[0]);
  return jResult;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeAnalyze(
        JNIEnv *env,
        jobject /* this */,
        jstring position,
        jint threads,
        jint width,
        jint height) {
        
    const char *posChars = env->GetStringUTFChars(position, 0);
    
    jintArray result = nullptr;
    
    if (width == 6 && height == 5) {
      result = runNativeAnalysis<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6>(env, SharedInstances::solver6x5, posChars, threads);
    } else if (width == 6 && height == 6) {
      result = runNativeAnalysis<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6>(env, SharedInstances::solver6x6, posChars, threads);
    } else if (width == 7 && height == 6) {
      result = runNativeAnalysis<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7>(env, SharedInstances::solver7x6, posChars, threads);
    } else if (width == 7 && height == 7) {
      result = runNativeAnalysis<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7>(env, SharedInstances::solver7x7, posChars, threads);
    } else if (width == 8 && height == 6) {
      result = runNativeAnalysis<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8>(env, SharedInstances::solver8x6, posChars, threads);
    } else if (width == 9 && height == 7) {
      result = runNativeAnalysis<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9>(env, SharedInstances::solver9x7, posChars, threads);
    }
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeAnalyzeHeuristic(
        JNIEnv *env,
        jobject /* this */,
        jstring position,
        jint maxDepth,
        jint threads,
        jdouble timeoutMs,
        jint width,
        jint height) {
        
    const char *posChars = env->GetStringUTFChars(position, 0);
    
    jintArray result = nullptr;
    
    if (width == 6 && height == 5) {
      result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6>(env, SharedInstances::heuristicSolver6x5, posChars, maxDepth, threads, timeoutMs);
    } else if (width == 6 && height == 6) {
      result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6>(env, SharedInstances::heuristicSolver6x6, posChars, maxDepth, threads, timeoutMs);
    } else if (width == 7 && height == 6) {
      result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7>(env, SharedInstances::heuristicSolver7x6, posChars, maxDepth, threads, timeoutMs);
    } else if (width == 7 && height == 7) {
      result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7>(env, SharedInstances::heuristicSolver7x7, posChars, maxDepth, threads, timeoutMs);
    } else if (width == 8 && height == 6) {
      result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8>(env, SharedInstances::heuristicSolver8x6, posChars, maxDepth, threads, timeoutMs);
    } else if (width == 9 && height == 7) {
      result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9>(env, SharedInstances::heuristicSolver9x7, posChars, maxDepth, threads, timeoutMs);
    } else if (width == 8 && height == 8) {
      result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8>(env, SharedInstances::heuristicSolver8x8, posChars, maxDepth, threads, timeoutMs);
    } else if (width == 10 && height == 7) {
      result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10>(env, SharedInstances::heuristicSolver10x7, posChars, maxDepth, threads, timeoutMs);
    } else if (width == 9 && height == 9) {
      result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9>(env, SharedInstances::heuristicSolver9x9, posChars, maxDepth, threads, timeoutMs);
    } else if (width == 10 && height == 10) {
      result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10>(env, SharedInstances::heuristicSolver10x10, posChars, maxDepth, threads, timeoutMs);
    }
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}
