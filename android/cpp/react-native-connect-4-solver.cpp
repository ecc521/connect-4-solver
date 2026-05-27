#include <jni.h>
#include <vector>
#include <string>
#include <sstream>
#include "../../native/dispatch_table.hpp"
#include "../../native/embedded_books.hpp"

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
Java_com_connect4solver_Connect4SolverModule_nativeCreateCache(JNIEnv *env, jobject, jint w, jint h, jdouble sizeBytes, jboolean is_heuristic, jint align, jboolean wrap) {
    size_t bytes = static_cast<size_t>(sizeBytes);
    void* ptr = nullptr;
    if (is_heuristic) {
        ptr = dispatch<void*>(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::HeuristicSolver::createCache(bytes).release();
        });
    } else {
        ptr = dispatch<void*>(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::Solver::createCache(bytes).release();
        });
    }
    return ptrToString(env, ptr);
}


extern "C" JNIEXPORT jstring JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeCreateBookFromBuffer(JNIEnv *env, jobject, jint w, jint h, jbyteArray base64Bytes) {
    jsize length = env->GetArrayLength(base64Bytes);
    jbyte* bytes = env->GetByteArrayElements(base64Bytes, 0);
    const uint8_t* unsignedBytes = reinterpret_cast<const uint8_t*>(bytes);
    
    int align = 4; bool wrap = false;
    void* ptr = dispatch<void*>(w, h, align, wrap, [&](auto tag) {
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
    
    int align = 4; bool wrap = false;
    dispatch_void(w, h, align, wrap, [&](auto tag) {
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
Java_com_connect4solver_Connect4SolverModule_nativeCreateSolver(JNIEnv *env, jobject, jint w, jint h, jstring cachePtrStr, jboolean is_heuristic, jint align, jboolean wrap) {
    auto cache = stringToPtr<GameSolver::Connect4::Cache>(env, cachePtrStr);
    void* ptr = nullptr;
    if (is_heuristic) {
        ptr = dispatch<void*>(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::HeuristicSolver::createWithCache(cache).release();
        });
    } else {
        ptr = dispatch<void*>(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            return Size::Solver::createWithCache(cache).release();
        });
    }
    return ptrToString(env, ptr);
}


extern "C" JNIEXPORT void JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeDestroySolver(JNIEnv *env, jobject, jstring solverPtrStr, jint w, jint h, jboolean is_heuristic, jint align, jboolean wrap) {
    void* solver = stringToPtr<void>(env, solverPtrStr);
    if (!solver) return;
    
    if (is_heuristic) {
        dispatch_void(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            delete static_cast<typename Size::HeuristicSolver*>(solver);
        });
    } else {
        dispatch_void(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            delete static_cast<typename Size::Solver*>(solver);
        });
    }
}


extern "C" JNIEXPORT void JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeStop(JNIEnv *env, jobject, jstring solverPtrStr, jint w, jint h, jboolean is_heuristic, jint align, jboolean wrap) {
    void* solver = stringToPtr<void>(env, solverPtrStr);
    if (!solver) return;
    
    if (is_heuristic) {
        dispatch_void(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            static_cast<typename Size::HeuristicSolver*>(solver)->stop();
        });
    } else {
        dispatch_void(w, h, align, wrap, [&](auto tag) {
            using Size = typename decltype(tag)::type;
            static_cast<typename Size::Solver*>(solver)->stop();
        });
    }
}

// Resolves the effective book: user-supplied if set, else the embedded static book.
template <int W, int H, typename CoreBook>
const CoreBook* getEffectiveBookAndroid(void* book_ptr) {
    if (book_ptr) return static_cast<const CoreBook*>(book_ptr);
    const uint8_t* data = EmbeddedBooks::getBookData(W, H);
    if (!data) return nullptr;
    static const CoreBook* embedded =
        static_cast<const CoreBook*>(
            GameSolver::Connect4::OpeningBookBase<W, H>::load_from_memory(
                data, EmbeddedBooks::getBookSize(W, H), W, H).release());
    return embedded;
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
jintArray runNativeAnalysis(JNIEnv *env, int w, int h, CoreSolver& solver, const char* positionStr, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString(positionStr);
  CorePosition P(w, h);
  int active_w = W == -1 ? w : W;
  std::vector<int> result;
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result.push_back(P.isWinningMove(lastColPlayed) ? 1 : 2);
    result.push_back(P.nbMoves());
    for(int i = 0; i < active_w; i++) result.push_back(0);
  } else {
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookAndroid<W, H, CoreBook>(book_ptr)));
    result.push_back(0);
    result.push_back(P.nbMoves());
    std::vector<int> scores = solver.analyze(P, false, threads, nullptr, timeout_ms);
    for(int i = 0; i < active_w; i++) result.push_back(scores[i]);
  }
  jintArray jResult = env->NewIntArray(result.size());
  env->SetIntArrayRegion(jResult, 0, result.size(), &result[0]);
  return jResult;
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
jintArray runNativeSolve(JNIEnv *env, int w, int h, CoreSolver& solver, const char* positionStr, int threads, void* book_ptr, double timeout_ms) {
  std::string positionString(positionStr);
  CorePosition P(w, h);
  std::vector<int> result;
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result.push_back(P.isWinningMove(lastColPlayed) ? 1 : 2);
    result.push_back(P.nbMoves());
    for(int i = 2; i < 8; i++) result.push_back(0);
  } else {
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookAndroid<W, H, CoreBook>(book_ptr)));
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

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
jintArray runNativeHeuristicAnalysis(JNIEnv *env, int w, int h, CoreSolver& solver, const char* positionStr, int max_depth, int threads, double timeout_ms, void* book_ptr) {
  std::string positionString(positionStr);
  CorePosition P(w, h);
  int active_w = W == -1 ? w : W;
  std::vector<int> result;
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result.push_back(P.isWinningMove(lastColPlayed) ? 1 : 2);
    result.push_back(P.nbMoves());
    for(int i = 0; i < active_w; i++) result.push_back(0);
    result.push_back(0);
  } else {
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookAndroid<W, H, CoreBook>(book_ptr)));
    result.push_back(0);
    result.push_back(P.nbMoves());
    auto res = solver.analyze_heuristic(P, max_depth, threads, timeout_ms);
    std::vector<int> scores = res.first;
    for(int i = 0; i < active_w; i++) result.push_back(scores[i]);
    result.push_back(res.second);
  }
  jintArray jResult = env->NewIntArray(result.size());
  env->SetIntArrayRegion(jResult, 0, result.size(), &result[0]);
  return jResult;
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
jintArray runNativeHeuristicSolve(JNIEnv *env, int w, int h, CoreSolver& solver, const char* positionStr, int max_depth, int threads, double timeout_ms, void* book_ptr) {
  std::string positionString(positionStr);
  CorePosition P(w, h);
  std::vector<int> result;
  if(P.play(positionString) != positionString.size()) {
    int lastColPlayed = positionString[P.nbMoves()] - '1';
    result.push_back(P.isWinningMove(lastColPlayed) ? 1 : 2);
    result.push_back(P.nbMoves());
    for(int i = 2; i < 8; i++) result.push_back(0);
  } else {
    solver.loadBook(const_cast<CoreBook*>(getEffectiveBookAndroid<W, H, CoreBook>(book_ptr)));
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
Java_com_connect4solver_Connect4SolverModule_nativeAnalyze(JNIEnv *env, jobject, jstring solverPtrStr, jstring position, jint threads, jint w, jint h, jstring bookPtrStr, jint align, jboolean wrap) {
    const char *posChars = env->GetStringUTFChars(position, 0);
    void* solver = stringToPtr<void>(env, solverPtrStr);
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    
    jintArray result = dispatch<jintArray>(w, h, align, wrap, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeAnalysis<typename Size::Solver, GameSolver::Connect4::GenericPosition<Size::w, Size::h, Size::align, Size::wrap>, Size::w, Size::h, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            env, w, h, *static_cast<typename Size::Solver*>(solver), posChars, threads, bookPtr, 0
        );
    });
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeSolve(JNIEnv *env, jobject, jstring solverPtrStr, jstring position, jint threads, jint w, jint h, jstring bookPtrStr, jint align, jboolean wrap) {
    const char *posChars = env->GetStringUTFChars(position, 0);
    void* solver = stringToPtr<void>(env, solverPtrStr);
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    
    jintArray result = dispatch<jintArray>(w, h, align, wrap, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeSolve<typename Size::Solver, GameSolver::Connect4::GenericPosition<Size::w, Size::h, Size::align, Size::wrap>, Size::w, Size::h, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            env, w, h, *static_cast<typename Size::Solver*>(solver), posChars, threads, bookPtr, 0
        );
    });
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeAnalyzeHeuristic(JNIEnv *env, jobject, jstring solverPtrStr, jstring position, jint maxDepth, jint threads, jdouble timeoutMs, jint w, jint h, jstring bookPtrStr, jint align, jboolean wrap) {
    const char *posChars = env->GetStringUTFChars(position, 0);
    void* solver = stringToPtr<void>(env, solverPtrStr);
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    
    jintArray result = dispatch<jintArray>(w, h, align, wrap, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeHeuristicAnalysis<typename Size::HeuristicSolver, GameSolver::Connect4::GenericPosition<Size::w, Size::h, Size::align, Size::wrap>, Size::w, Size::h, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            env, w, h, *static_cast<typename Size::HeuristicSolver*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr
        );
    });
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}

extern "C" JNIEXPORT jintArray JNICALL
Java_com_connect4solver_Connect4SolverModule_nativeSolveHeuristic(JNIEnv *env, jobject, jstring solverPtrStr, jstring position, jint maxDepth, jint threads, jdouble timeoutMs, jint w, jint h, jstring bookPtrStr, jint align, jboolean wrap) {
    const char *posChars = env->GetStringUTFChars(position, 0);
    void* solver = stringToPtr<void>(env, solverPtrStr);
    void* bookPtr = stringToPtr<void>(env, bookPtrStr);
    
    jintArray result = dispatch<jintArray>(w, h, align, wrap, [&](auto tag) {
        using Size = typename decltype(tag)::type;
        return runNativeHeuristicSolve<typename Size::HeuristicSolver, GameSolver::Connect4::GenericPosition<Size::w, Size::h, Size::align, Size::wrap>, Size::w, Size::h, GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>>(
            env, w, h, *static_cast<typename Size::HeuristicSolver*>(solver), posChars, maxDepth, threads, timeoutMs, bookPtr
        );
    });
    
    env->ReleaseStringUTFChars(position, posChars);
    return result;
}
