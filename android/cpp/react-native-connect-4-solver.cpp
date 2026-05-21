#include <jni.h>
#include <vector>
#include <string>
#include <sstream>
#include "../../native/bindings_core.hpp"
#include "../../native/dispatch_table.hpp"

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
    return ptrToString(env, ptr);
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
    
    void* ptr = dispatch<void*>(w, h, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>::load_from_memory(unsignedBytes, length, Size::w, Size::h).release();
    });
    
    env->ReleaseByteArrayElements(base64Bytes, bytes, 0);
    return ptrToString(env, ptr);
}

extern "C" JNIEXPORT void JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeDestroyBook(JNIEnv *env, jobject, jint w, jint h, jstring bookPtrStr) {
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    if (!bookPtr) return;
    
    dispatch_void(w, h, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        delete static_cast<GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>*>(bookPtr);
    });
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
    return ptrToString(env, ptr);
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

extern "C" JNIEXPORT void JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeStop(JNIEnv *env, jobject, jstring solverPtrStr, jint w, jint h, jboolean is_heuristic) {
    void* solver = stringToPtr<void>(env, solverPtrStr);
    if (!solver) return;
    
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
    for(int i = 2; i < 8; i++) result.push_back(0);
  } else {
    if (book_ptr) solver.loadBook(static_cast<CoreBook*>(book_ptr));
    else solver.loadBook(nullptr);
    auto res = solver.solve(P, false, threads, nullptr, timeout_ms);
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
    
    jintArray result = dispatch<jintArray>(w, h, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeAnalysis<typename Size::Solver, GameSolver::Connect4::GenericPosition<Size::w, Size::h>, Size::w, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            env, *static_cast<typename Size::Solver*>(solver), posChars, threads, bookPtr, 0
        );
    });
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeSolve(JNIEnv *env, jobject, jstring solverPtrStr, jstring position, jint threads, jint w, jint h, jstring bookPtrStr) {
    const char *posChars = env->GetStringUTFChars(position, 0);
    void* solver = stringToPtr<void>(env, solverPtrStr);
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    
    jintArray result = dispatch<jintArray>(w, h, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeSolve<typename Size::Solver, GameSolver::Connect4::GenericPosition<Size::w, Size::h>, Size::w, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            env, *static_cast<typename Size::Solver*>(solver), posChars, threads, bookPtr, 0
        );
    });
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeAnalyzeHeuristic(JNIEnv *env, jobject, jstring solverPtrStr, jstring position, jint maxDepth, jint threads, jdouble timeoutMs, jint w, jint h, jstring bookPtrStr) {
    const char *posChars = env->GetStringUTFChars(position, 0);
    void* solver = stringToPtr<void>(env, solverPtrStr);
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    
    jintArray result = dispatch<jintArray>(w, h, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeHeuristicAnalysis<typename Size::HeuristicSolver, GameSolver::Connect4::GenericPosition<Size::w, Size::h>, Size::w, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            env, *static_cast<typename Size::HeuristicSolver*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr
        );
    });
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeSolveHeuristic(JNIEnv *env, jobject, jstring solverPtrStr, jstring position, jint maxDepth, jint threads, jdouble timeoutMs, jint w, jint h, jstring bookPtrStr) {
    const char *posChars = env->GetStringUTFChars(position, 0);
    void* solver = stringToPtr<void>(env, solverPtrStr);
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    
    jintArray result = dispatch<jintArray>(w, h, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeHeuristicSolve<typename Size::HeuristicSolver, GameSolver::Connect4::GenericPosition<Size::w, Size::h>, Size::w, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            env, *static_cast<typename Size::HeuristicSolver*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr
        );
    });
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}
