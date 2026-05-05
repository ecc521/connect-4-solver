#include <jni.h>
#include <vector>
#include <string>
#include <sstream>
#include "../../native/bindings_core.hpp"

// Pointer conversion helpers
template <typename T>
jstring ptrToString(JNIEnv *env, T* ptr) {
    if (!ptr) return env->NewStringUTF("0");
    std::ostringstream oss;
    oss << reinterpret_cast<uintptr_t>(ptr);
    return env->NewStringUTF(oss.str().c_str());
}

template <typename T>
T* stringToPtr(JNIEnv *env, jstring str) {
    const char *chars = env->GetStringUTFChars(str, 0);
    uintptr_t addr = 0;
    std::istringstream iss(chars);
    iss >> addr;
    env->ReleaseStringUTFChars(str, chars);
    return reinterpret_cast<T*>(addr);
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeCreateCache(JNIEnv *env, jobject, jint w, jint h, jdouble sizeBytes, jboolean is_heuristic) {
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
    return ptrToString(env, ptr);
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeCreateBookFromBuffer(JNIEnv *env, jobject, jint w, jint h, jbyteArray base64Bytes) {
    jsize length = env->GetArrayLength(base64Bytes);
    jbyte* bytes = env->GetByteArrayElements(base64Bytes, 0);
    const uint8_t* unsignedBytes = reinterpret_cast<const uint8_t*>(bytes);
    void* ptr = nullptr;
    
    if (w == 6 && h == 5) ptr = GameSolver::Connect4::OpeningBookBase<6, 5>::load_from_memory(unsignedBytes, length, w, h).release();
    else if (w == 6 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<6, 6>::load_from_memory(unsignedBytes, length, w, h).release();
    else if (w == 7 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<7, 6>::load_from_memory(unsignedBytes, length, w, h).release();
    else if (w == 7 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<7, 7>::load_from_memory(unsignedBytes, length, w, h).release();
    else if (w == 8 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<8, 6>::load_from_memory(unsignedBytes, length, w, h).release();
    else if (w == 9 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<9, 7>::load_from_memory(unsignedBytes, length, w, h).release();
    else if (w == 8 && h == 8) ptr = GameSolver::Connect4::OpeningBookBase<8, 8>::load_from_memory(unsignedBytes, length, w, h).release();
    else if (w == 10 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<10, 7>::load_from_memory(unsignedBytes, length, w, h).release();
    else if (w == 9 && h == 9) ptr = GameSolver::Connect4::OpeningBookBase<9, 9>::load_from_memory(unsignedBytes, length, w, h).release();
    else if (w == 10 && h == 10) ptr = GameSolver::Connect4::OpeningBookBase<10, 10>::load_from_memory(unsignedBytes, length, w, h).release();
    else if (w == 9 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<9, 6>::load_from_memory(unsignedBytes, length, w, h).release();
    else if (w == 11 && h == 4) ptr = GameSolver::Connect4::OpeningBookBase<11, 4>::load_from_memory(unsignedBytes, length, w, h).release();
    
    env->ReleaseByteArrayElements(base64Bytes, bytes, 0);
    return ptrToString(env, ptr);
}

extern "C" JNIEXPORT void JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeDestroyBook(JNIEnv *env, jobject, jint w, jint h, jstring bookPtrStr) {
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    if (!bookPtr) return;
    
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
}

extern "C" JNIEXPORT void JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeDestroyCache(JNIEnv *env, jobject, jstring cachePtrStr) {
    auto cache = stringToPtr<GameSolver::Connect4::Cache>(env, cachePtrStr);
    delete cache;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeCreateSolver(JNIEnv *env, jobject, jint w, jint h, jstring cachePtrStr, jboolean is_heuristic) {
    auto cache = stringToPtr<GameSolver::Connect4::Cache>(env, cachePtrStr);
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
    return ptrToString(env, ptr);
}

extern "C" JNIEXPORT void JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeDestroySolver(JNIEnv *env, jobject, jstring solverPtrStr, jint w, jint h, jboolean is_heuristic) {
    void* solver = stringToPtr<void>(env, solverPtrStr);
    if (!solver) return;
    
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
}

template <typename CoreSolver, typename CorePosition, int W, typename CoreBook>
jintArray runNativeAnalysis(JNIEnv *env, CoreSolver& solver, const char* positionStr, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString(positionStr);
  CorePosition P;
  std::vector<int> result;
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result.push_back(P.isWinningMove(lastColPlayed) ? 1 : 2);
    result.push_back(P.nbMoves());
    for(int i = 0; i < W; i++) result.push_back(0);
  } else {
    if (book_ptr) solver.loadBook(static_cast<CoreBook*>(book_ptr));
    else solver.loadBook(nullptr);
    result.push_back(0);
    result.push_back(P.nbMoves());
    std::vector<int> scores = solver.analyze(P, false, threads, nullptr, timeout_ms);
    for(int i = 0; i < W; i++) result.push_back(scores[i]);
  }
  jintArray jResult = env->NewIntArray(result.size());
  env->SetIntArrayRegion(jResult, 0, result.size(), &result[0]);
  return jResult;
}

template <typename CoreSolver, typename CorePosition, int W, typename CoreBook>
jintArray runNativeSolve(JNIEnv *env, CoreSolver& solver, const char* positionStr, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString(positionStr);
  CorePosition P;
  std::vector<int> result;
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result.push_back(P.isWinningMove(lastColPlayed) ? 1 : 2);
    result.push_back(P.nbMoves());
    result.push_back(0);
    result.push_back(0);
  } else {
    if (book_ptr) solver.loadBook(static_cast<CoreBook*>(book_ptr));
    else solver.loadBook(nullptr);
    auto res = solver.solve(P, false, threads, nullptr, timeout_ms);
    result.push_back(0);
    result.push_back(P.nbMoves());
    result.push_back(res.score);
    result.push_back(res.aborted ? 1 : 0);
  }
  jintArray jResult = env->NewIntArray(result.size());
  env->SetIntArrayRegion(jResult, 0, result.size(), &result[0]);
  return jResult;
}

template <typename CoreSolver, typename CorePosition, int W, typename CoreBook>
jintArray runNativeHeuristicAnalysis(JNIEnv *env, CoreSolver& solver, const char* positionStr, int max_depth, int threads, double timeout_ms, void* book_ptr) {
  std::string positionString(positionStr);
  CorePosition P;
  std::vector<int> result;
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result.push_back(P.isWinningMove(lastColPlayed) ? 1 : 2);
    result.push_back(P.nbMoves());
    for(int i = 0; i < W; i++) result.push_back(0);
    result.push_back(0);
  } else {
    if (book_ptr) solver.loadBook(static_cast<CoreBook*>(book_ptr));
    else solver.loadBook(nullptr);
    result.push_back(0);
    result.push_back(P.nbMoves());
    auto res = solver.analyze_heuristic(P, max_depth, threads, timeout_ms);
    std::vector<int> scores = res.first;
    for(int i = 0; i < W; i++) result.push_back(scores[i]);
    result.push_back(res.second);
  }
  jintArray jResult = env->NewIntArray(result.size());
  env->SetIntArrayRegion(jResult, 0, result.size(), &result[0]);
  return jResult;
}

template <typename CoreSolver, typename CorePosition, int W, typename CoreBook>
jintArray runNativeHeuristicSolve(JNIEnv *env, CoreSolver& solver, const char* positionStr, int max_depth, int threads, double timeout_ms, void* book_ptr) {
  std::string positionString(positionStr);
  CorePosition P;
  std::vector<int> result;
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result.push_back(P.isWinningMove(lastColPlayed) ? 1 : 2);
    result.push_back(P.nbMoves());
    for(int i = 2; i < 8; i++) result.push_back(0);
  } else {
    if (book_ptr) solver.loadBook(static_cast<CoreBook*>(book_ptr));
    else solver.loadBook(nullptr);
    auto res = solver.solve_heuristic(P, max_depth, timeout_ms, false, nullptr, threads);
    result.push_back(0);
    result.push_back(P.nbMoves());
    result.push_back(res.score);
    result.push_back(res.bestMove);
    result.push_back(res.depth);
    result.push_back((int)(res.nodes & 0xFFFFFFFF));
    result.push_back((int)(res.nodes >> 32));
    result.push_back(res.aborted ? 1 : 0);
  }
  jintArray jResult = env->NewIntArray(result.size());
  env->SetIntArrayRegion(jResult, 0, result.size(), &result[0]);
  return jResult;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeAnalyze(JNIEnv *env, jobject, jstring solverPtrStr, jstring position, jint threads, jint w, jint h, jstring bookPtrStr) {
    const char *posChars = env->GetStringUTFChars(position, 0);
    void* solver = stringToPtr<void>(env, solverPtrStr);
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    jintArray result = nullptr;
    
    if (w == 6 && h == 5) result = runNativeAnalysis<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6, GameSolver::Connect4::OpeningBookBase<6,5>>(env, *static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 6 && h == 6) result = runNativeAnalysis<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6, GameSolver::Connect4::OpeningBookBase<6,6>>(env, *static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 7 && h == 6) result = runNativeAnalysis<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7, GameSolver::Connect4::OpeningBookBase<7,6>>(env, *static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 7 && h == 7) result = runNativeAnalysis<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7, GameSolver::Connect4::OpeningBookBase<7,7>>(env, *static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 8 && h == 6) result = runNativeAnalysis<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8, GameSolver::Connect4::OpeningBookBase<8,6>>(env, *static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 9 && h == 7) result = runNativeAnalysis<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9, GameSolver::Connect4::OpeningBookBase<9,7>>(env, *static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 9 && h == 6) result = runNativeAnalysis<C4_9x6::GameSolver::Connect4::Solver, C4_9x6::GameSolver::Connect4::Position, 9, GameSolver::Connect4::OpeningBookBase<9,6>>(env, *static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 11 && h == 4) result = runNativeAnalysis<C4_11x4::GameSolver::Connect4::Solver, C4_11x4::GameSolver::Connect4::Position, 11, GameSolver::Connect4::OpeningBookBase<11,4>>(env, *static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeSolve(JNIEnv *env, jobject, jstring solverPtrStr, jstring position, jint threads, jint w, jint h, jstring bookPtrStr) {
    const char *posChars = env->GetStringUTFChars(position, 0);
    void* solver = stringToPtr<void>(env, solverPtrStr);
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    jintArray result = nullptr;
    
    if (w == 6 && h == 5) result = runNativeSolve<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6, GameSolver::Connect4::OpeningBookBase<6,5>>(env, *static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 6 && h == 6) result = runNativeSolve<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6, GameSolver::Connect4::OpeningBookBase<6,6>>(env, *static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 7 && h == 6) result = runNativeSolve<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7, GameSolver::Connect4::OpeningBookBase<7,6>>(env, *static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 7 && h == 7) result = runNativeSolve<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7, GameSolver::Connect4::OpeningBookBase<7,7>>(env, *static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 8 && h == 6) result = runNativeSolve<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8, GameSolver::Connect4::OpeningBookBase<8,6>>(env, *static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 9 && h == 7) result = runNativeSolve<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9, GameSolver::Connect4::OpeningBookBase<9,7>>(env, *static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 9 && h == 6) result = runNativeSolve<C4_9x6::GameSolver::Connect4::Solver, C4_9x6::GameSolver::Connect4::Position, 9, GameSolver::Connect4::OpeningBookBase<9,6>>(env, *static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    else if (w == 11 && h == 4) result = runNativeSolve<C4_11x4::GameSolver::Connect4::Solver, C4_11x4::GameSolver::Connect4::Position, 11, GameSolver::Connect4::OpeningBookBase<11,4>>(env, *static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver), posChars, threads, bookPtr, 0);
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeAnalyzeHeuristic(JNIEnv *env, jobject, jstring solverPtrStr, jstring position, jint maxDepth, jint threads, jdouble timeoutMs, jint w, jint h, jstring bookPtrStr) {
    const char *posChars = env->GetStringUTFChars(position, 0);
    void* solver = stringToPtr<void>(env, solverPtrStr);
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    jintArray result = nullptr;
    
    if (w == 6 && h == 5) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6, GameSolver::Connect4::OpeningBookBase<6,5>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 6 && h == 6) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6, GameSolver::Connect4::OpeningBookBase<6,6>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 7 && h == 6) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7, GameSolver::Connect4::OpeningBookBase<7,6>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 7 && h == 7) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7, GameSolver::Connect4::OpeningBookBase<7,7>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 8 && h == 6) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8, GameSolver::Connect4::OpeningBookBase<8,6>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 9 && h == 7) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9, GameSolver::Connect4::OpeningBookBase<9,7>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 8 && h == 8) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8, GameSolver::Connect4::OpeningBookBase<8,8>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 10 && h == 7) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10, GameSolver::Connect4::OpeningBookBase<10,7>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 9 && h == 9) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9, GameSolver::Connect4::OpeningBookBase<9,9>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 10 && h == 10) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10, GameSolver::Connect4::OpeningBookBase<10,10>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 9 && h == 6) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<9, 6>, GameSolver::Connect4::GenericPosition<9, 6>, 9, GameSolver::Connect4::OpeningBookBase<9,6>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 11 && h == 4) result = runNativeHeuristicAnalysis<GameSolver::Connect4::HeuristicSolver<11, 4>, GameSolver::Connect4::GenericPosition<11, 4>, 11, GameSolver::Connect4::OpeningBookBase<11,4>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeSolveHeuristic(JNIEnv *env, jobject, jstring solverPtrStr, jstring position, jint maxDepth, jint threads, jdouble timeoutMs, jint w, jint h, jstring bookPtrStr) {
    const char *posChars = env->GetStringUTFChars(position, 0);
    void* solver = stringToPtr<void>(env, solverPtrStr);
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    jintArray result = nullptr;
    
    if (w == 6 && h == 5) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6, GameSolver::Connect4::OpeningBookBase<6,5>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 6 && h == 6) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6, GameSolver::Connect4::OpeningBookBase<6,6>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 7 && h == 6) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7, GameSolver::Connect4::OpeningBookBase<7,6>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 7 && h == 7) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7, GameSolver::Connect4::OpeningBookBase<7,7>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 8 && h == 6) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8, GameSolver::Connect4::OpeningBookBase<8,6>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 9 && h == 7) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9, GameSolver::Connect4::OpeningBookBase<9,7>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 8 && h == 8) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8, GameSolver::Connect4::OpeningBookBase<8,8>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 10 && h == 7) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10, GameSolver::Connect4::OpeningBookBase<10,7>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 9 && h == 9) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9, GameSolver::Connect4::OpeningBookBase<9,9>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 10 && h == 10) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10, GameSolver::Connect4::OpeningBookBase<10,10>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 9 && h == 6) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<9, 6>, GameSolver::Connect4::GenericPosition<9, 6>, 9, GameSolver::Connect4::OpeningBookBase<9,6>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    else if (w == 11 && h == 4) result = runNativeHeuristicSolve<GameSolver::Connect4::HeuristicSolver<11, 4>, GameSolver::Connect4::GenericPosition<11, 4>, 11, GameSolver::Connect4::OpeningBookBase<11,4>>(env, *static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr);
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}
