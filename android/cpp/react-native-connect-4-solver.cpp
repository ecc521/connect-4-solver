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
