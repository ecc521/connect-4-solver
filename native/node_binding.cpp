#include <napi.h>
#include <cstdlib>
#include <string>
#include <vector>
#include <cstdint>
#include <iostream>
#include <unordered_set>

#include "HeuristicSolver.hpp"
#include "OpeningBook.hpp"
#include "bindings_core.hpp"

using namespace Napi;

// Helper to create an External pointer
template <typename T>
Value WrapPointer(const CallbackInfo& info, T* ptr) {
    if (!ptr) return info.Env().Null();
    return External<T>::New(info.Env(), ptr);
}

template <typename T>
T* UnwrapPointer(Value val) {
    if (val.IsNull() || val.IsUndefined()) return nullptr;
    return val.As<External<T>>().Data();
}

Value CreateCache(const CallbackInfo& info) {
    Env env = info.Env();
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    size_t bytes = info[2].As<Number>().Int64Value();
    bool is_heuristic = info[3].As<Boolean>().Value();

    void* ptr = nullptr;
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
    return WrapPointer(info, static_cast<GameSolver::Connect4::Cache*>(ptr));
}

Value DestroyCache(const CallbackInfo& info) {
    auto cache = UnwrapPointer<GameSolver::Connect4::Cache>(info[0]);
    delete cache;
    return info.Env().Undefined();
}

Value CreateSolver(const CallbackInfo& info) {
    Env env = info.Env();
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    auto cache = UnwrapPointer<GameSolver::Connect4::Cache>(info[2]);
    bool is_heuristic = info[3].As<Boolean>().Value();

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
    return WrapPointer(info, ptr);
}

Value DestroySolver(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* solver = UnwrapPointer<void>(info[2]);
    bool is_heuristic = info[3].As<Boolean>().Value();

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
    return info.Env().Undefined();
}

Value CreateBook(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    std::string path = info[2].As<String>().Utf8Value();
    
    void* ptr = nullptr;
    if (w == 6 && h == 5) ptr = C4_6x5::GameSolver::Connect4::OpeningBookBase<6, 5>::load(path, w, h).release();
    else if (w == 6 && h == 6) ptr = C4_6x6::GameSolver::Connect4::OpeningBookBase<6, 6>::load(path, w, h).release();
    else if (w == 7 && h == 6) ptr = C4_7x6::GameSolver::Connect4::OpeningBookBase<7, 6>::load(path, w, h).release();
    else if (w == 7 && h == 7) ptr = C4_7x7::GameSolver::Connect4::OpeningBookBase<7, 7>::load(path, w, h).release();
    else if (w == 8 && h == 6) ptr = C4_8x6::GameSolver::Connect4::OpeningBookBase<8, 6>::load(path, w, h).release();
    else if (w == 9 && h == 7) ptr = C4_9x7::GameSolver::Connect4::OpeningBookBase<9, 7>::load(path, w, h).release();
    else if (w == 9 && h == 6) ptr = C4_9x6::GameSolver::Connect4::OpeningBookBase<9, 6>::load(path, w, h).release();
    else if (w == 11 && h == 4) ptr = C4_11x4::GameSolver::Connect4::OpeningBookBase<11, 4>::load(path, w, h).release();

    return WrapPointer(info, ptr);
}

Value DestroyBook(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* book_ptr = UnwrapPointer<void>(info[2]);
    
    if (w == 6 && h == 5) delete static_cast<C4_6x5::GameSolver::Connect4::OpeningBookBase<6, 5>*>(book_ptr);
    else if (w == 6 && h == 6) delete static_cast<C4_6x6::GameSolver::Connect4::OpeningBookBase<6, 6>*>(book_ptr);
    else if (w == 7 && h == 6) delete static_cast<C4_7x6::GameSolver::Connect4::OpeningBookBase<7, 6>*>(book_ptr);
    else if (w == 7 && h == 7) delete static_cast<C4_7x7::GameSolver::Connect4::OpeningBookBase<7, 7>*>(book_ptr);
    else if (w == 8 && h == 6) delete static_cast<C4_8x6::GameSolver::Connect4::OpeningBookBase<8, 6>*>(book_ptr);
    else if (w == 9 && h == 7) delete static_cast<C4_9x7::GameSolver::Connect4::OpeningBookBase<9, 7>*>(book_ptr);
    else if (w == 9 && h == 6) delete static_cast<C4_9x6::GameSolver::Connect4::OpeningBookBase<9, 6>*>(book_ptr);
    else if (w == 11 && h == 4) delete static_cast<C4_11x4::GameSolver::Connect4::OpeningBookBase<11, 4>*>(book_ptr);
    return info.Env().Undefined();
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
std::vector<int> runAnalysisRaw(CoreSolver& solver, const std::string& pos, int threads, void* book_ptr) {
    CorePosition P;
    std::vector<int> result(2 + W, 0);
    
    if(P.play(pos) != pos.size()) {
        int lastColPlayed = pos[P.nbMoves()] - '1';
        result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
        result[1] = P.nbMoves();
    } else {
        result[0] = 0;
        result[1] = P.nbMoves();
        const CoreBook* book = static_cast<const CoreBook*>(book_ptr);
        std::vector<int> scores = solver.analyze(P, false, threads, book);
        for(int i = 0; i < W; i++) result[2 + i] = scores[i];
    }
    return result;
}

class AnalyzeExactWorker : public Napi::AsyncWorker {
public:
    AnalyzeExactWorker(Napi::Env& env, Napi::Promise::Deferred deferred, int w, int h, void* solver, const std::string& pos, int threads, void* book_ptr)
        : Napi::AsyncWorker(env), deferred(deferred), w(w), h(h), solver(solver), pos(pos), threads(threads), book_ptr(book_ptr) {}
    
    void Execute() override {
        try {
            if (w == 6 && h == 5) result_data = runAnalysisRaw<C4_6x5::GameSolver::Connect4::Solver, C4_6x5::GameSolver::Connect4::Position, 6, 5, C4_6x5::GameSolver::Connect4::OpeningBookBase<6, 5>>(*static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver), pos, threads, book_ptr);
            else if (w == 6 && h == 6) result_data = runAnalysisRaw<C4_6x6::GameSolver::Connect4::Solver, C4_6x6::GameSolver::Connect4::Position, 6, 6, C4_6x6::GameSolver::Connect4::OpeningBookBase<6, 6>>(*static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver), pos, threads, book_ptr);
            else if (w == 7 && h == 6) result_data = runAnalysisRaw<C4_7x6::GameSolver::Connect4::Solver, C4_7x6::GameSolver::Connect4::Position, 7, 6, C4_7x6::GameSolver::Connect4::OpeningBookBase<7, 6>>(*static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver), pos, threads, book_ptr);
            else if (w == 7 && h == 7) result_data = runAnalysisRaw<C4_7x7::GameSolver::Connect4::Solver, C4_7x7::GameSolver::Connect4::Position, 7, 7, C4_7x7::GameSolver::Connect4::OpeningBookBase<7, 7>>(*static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver), pos, threads, book_ptr);
            else if (w == 8 && h == 6) result_data = runAnalysisRaw<C4_8x6::GameSolver::Connect4::Solver, C4_8x6::GameSolver::Connect4::Position, 8, 6, C4_8x6::GameSolver::Connect4::OpeningBookBase<8, 6>>(*static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver), pos, threads, book_ptr);
            else if (w == 9 && h == 7) result_data = runAnalysisRaw<C4_9x7::GameSolver::Connect4::Solver, C4_9x7::GameSolver::Connect4::Position, 9, 7, C4_9x7::GameSolver::Connect4::OpeningBookBase<9, 7>>(*static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver), pos, threads, book_ptr);
            else if (w == 9 && h == 6) result_data = runAnalysisRaw<C4_9x6::GameSolver::Connect4::Solver, C4_9x6::GameSolver::Connect4::Position, 9, 6, C4_9x6::GameSolver::Connect4::OpeningBookBase<9, 6>>(*static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver), pos, threads, book_ptr);
            else if (w == 11 && h == 4) result_data = runAnalysisRaw<C4_11x4::GameSolver::Connect4::Solver, C4_11x4::GameSolver::Connect4::Position, 11, 4, C4_11x4::GameSolver::Connect4::OpeningBookBase<11, 4>>(*static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver), pos, threads, book_ptr);
            else SetError("Unsupported board size for AnalyzeExact");
        } catch (const std::exception& e) {
            SetError(e.what());
        }
    }

    void OnOK() override {
        Napi::Env env = Env();
        Napi::Int32Array js_result = Napi::Int32Array::New(env, result_data.size());
        for (size_t i = 0; i < result_data.size(); ++i) js_result[i] = result_data[i];
        deferred.Resolve(js_result);
    }

    void OnError(const Napi::Error& e) override {
        deferred.Reject(e.Value());
    }

private:
    Napi::Promise::Deferred deferred;
    int w, h;
    void* solver;
    std::string pos;
    int threads;
    void* book_ptr;
    std::vector<int> result_data;
};

Value AnalyzeExact(const CallbackInfo& info) {
    Env env = info.Env();
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* solver = UnwrapPointer<void>(info[2]);
    std::string pos = info[3].As<String>().Utf8Value();
    int threads = info[4].As<Number>().Int32Value();
    void* book_ptr = UnwrapPointer<void>(info[5]);

    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
    AnalyzeExactWorker* worker = new AnalyzeExactWorker(env, deferred, w, h, solver, pos, threads, book_ptr);
    worker->Queue();
    
    return deferred.Promise();
}

template <typename CoreSolver, typename CorePosition, int W>
std::vector<int> runHeuristicAnalysisRaw(CoreSolver& solver, const std::string& pos, int max_depth, int threads, double timeout_ms) {
    CorePosition P;
    std::vector<int> result(3 + W, 0);
    
    if(P.play(pos) != pos.size()) {
        int lastColPlayed = pos[P.nbMoves()] - '1';
        result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
        result[1] = P.nbMoves();
    } else {
        result[0] = 0;
        result[1] = P.nbMoves();
        auto res = solver.analyze_heuristic(P, max_depth, threads, timeout_ms);
        std::vector<int> scores = res.first;
        for(int i = 0; i < W; i++) result[2 + i] = scores[i];
        result[2 + W] = res.second;
    }
    return result;
}

class AnalyzeHeuristicWorker : public Napi::AsyncWorker {
public:
    AnalyzeHeuristicWorker(Napi::Env& env, Napi::Promise::Deferred deferred, int w, int h, void* solver, const std::string& pos, int threads, int max_depth, double timeout_ms)
        : Napi::AsyncWorker(env), deferred(deferred), w(w), h(h), solver(solver), pos(pos), threads(threads), max_depth(max_depth), timeout_ms(timeout_ms) {}
    
    void Execute() override {
        try {
            if (w == 6 && h == 5) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver), pos, max_depth, threads, timeout_ms);
            else if (w == 6 && h == 6) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver), pos, max_depth, threads, timeout_ms);
            else if (w == 7 && h == 6) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver), pos, max_depth, threads, timeout_ms);
            else if (w == 7 && h == 7) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver), pos, max_depth, threads, timeout_ms);
            else if (w == 8 && h == 6) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver), pos, max_depth, threads, timeout_ms);
            else if (w == 9 && h == 7) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver), pos, max_depth, threads, timeout_ms);
            else if (w == 8 && h == 8) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver), pos, max_depth, threads, timeout_ms);
            else if (w == 10 && h == 7) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver), pos, max_depth, threads, timeout_ms);
            else if (w == 9 && h == 9) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver), pos, max_depth, threads, timeout_ms);
            else if (w == 10 && h == 10) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver), pos, max_depth, threads, timeout_ms);
            else if (w == 9 && h == 6) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<9, 6>, GameSolver::Connect4::GenericPosition<9, 6>, 9>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver), pos, max_depth, threads, timeout_ms);
            else if (w == 11 && h == 4) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<11, 4>, GameSolver::Connect4::GenericPosition<11, 4>, 11>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver), pos, max_depth, threads, timeout_ms);
            else SetError("Unsupported board size for AnalyzeHeuristic");
        } catch (const std::exception& e) {
            SetError(e.what());
        }
    }

    void OnOK() override {
        Napi::Env env = Env();
        Napi::Int32Array js_result = Napi::Int32Array::New(env, result_data.size());
        for (size_t i = 0; i < result_data.size(); ++i) js_result[i] = result_data[i];
        deferred.Resolve(js_result);
    }

    void OnError(const Napi::Error& e) override {
        deferred.Reject(e.Value());
    }

private:
    Napi::Promise::Deferred deferred;
    int w, h;
    void* solver;
    std::string pos;
    int threads;
    int max_depth;
    double timeout_ms;
    std::vector<int> result_data;
};

Value AnalyzeHeuristic(const CallbackInfo& info) {
    Env env = info.Env();
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* solver = UnwrapPointer<void>(info[2]);
    std::string pos = info[3].As<String>().Utf8Value();
    int threads = info[4].As<Number>().Int32Value();
    int max_depth = info[5].As<Number>().Int32Value();
    double timeout_ms = info[6].As<Number>().DoubleValue();

    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
    AnalyzeHeuristicWorker* worker = new AnalyzeHeuristicWorker(env, deferred, w, h, solver, pos, threads, max_depth, timeout_ms);
    worker->Queue();
    
    return deferred.Promise();
}

Value GetNodeCount(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* solver = UnwrapPointer<void>(info[2]);
    bool is_heuristic = info[3].As<Boolean>().Value();

    uint64_t count = 0;
    if (is_heuristic) {
        if (w == 6 && h == 5) count = static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver)->getNodeCount();
        else if (w == 6 && h == 6) count = static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver)->getNodeCount();
        else if (w == 7 && h == 6) count = static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver)->getNodeCount();
        else if (w == 7 && h == 7) count = static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver)->getNodeCount();
        else if (w == 8 && h == 6) count = static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver)->getNodeCount();
        else if (w == 9 && h == 7) count = static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver)->getNodeCount();
        else if (w == 8 && h == 8) count = static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver)->getNodeCount();
        else if (w == 10 && h == 7) count = static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver)->getNodeCount();
        else if (w == 9 && h == 9) count = static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver)->getNodeCount();
        else if (w == 10 && h == 10) count = static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver)->getNodeCount();
        else if (w == 9 && h == 6) count = static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver)->getNodeCount();
        else if (w == 11 && h == 4) count = static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver)->getNodeCount();
    } else {
        if (w == 6 && h == 5) count = static_cast<C4_6x5::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        else if (w == 6 && h == 6) count = static_cast<C4_6x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 6) count = static_cast<C4_7x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 7) count = static_cast<C4_7x7::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        else if (w == 8 && h == 6) count = static_cast<C4_8x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        else if (w == 9 && h == 7) count = static_cast<C4_9x7::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        else if (w == 9 && h == 6) count = static_cast<C4_9x6::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
        else if (w == 11 && h == 4) count = static_cast<C4_11x4::GameSolver::Connect4::Solver*>(solver)->getNodeCount();
    }
    return Number::New(info.Env(), (double)count);
}

// ----------------------------------------------------------------------------
// Book Builder
// ----------------------------------------------------------------------------

class BookBuilder : public ObjectWrap<BookBuilder> {
public:
    static Object Init(Napi::Env env, Object exports) {
        Function func = DefineClass(env, "BookBuilder", {
            InstanceMethod("add", &BookBuilder::Add),
            InstanceMethod("addPosition", &BookBuilder::AddPosition),
            InstanceMethod("saveDense", &BookBuilder::SaveDense),
            InstanceMethod("saveEliasFano", &BookBuilder::SaveEliasFano),
            InstanceMethod("size", &BookBuilder::Size)
        });

        FunctionReference* constructor = new FunctionReference();
        *constructor = Persistent(func);
        env.SetInstanceData(constructor);

        exports.Set("BookBuilder", func);
        return exports;
    }

    BookBuilder(const CallbackInfo& info) : ObjectWrap<BookBuilder>(info) {
        width = info[0].As<Number>().Int32Value();
        height = info[1].As<Number>().Int32Value();
        depth = info[2].As<Number>().Int32Value();
    }

private:
    int width;
    int height;
    int depth;
    std::vector<std::pair<uint64_t, uint8_t>> items64;
    std::vector<std::pair<unsigned __int128, uint8_t>> items128;

    bool is128() const {
        return width * (height + 1) > 64;
    }

    Napi::Value Add(const CallbackInfo& info) {
        bool lossless;
        uint64_t key = info[0].As<BigInt>().Uint64Value(&lossless);
        uint8_t score = info[1].As<Number>().Uint32Value();
        if (is128()) items128.push_back({key, score});
        else items64.push_back({key, score});
        return info.Env().Undefined();
    }

    Napi::Value AddPosition(const CallbackInfo& info) {
        std::string pos = info[0].As<String>().Utf8Value();
        uint8_t score = info[1].As<Number>().Uint32Value();
        
        if (width == 6 && height == 5) { C4_6x5::GameSolver::Connect4::Position P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 6 && height == 6) { C4_6x6::GameSolver::Connect4::Position P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 7 && height == 6) { C4_7x6::GameSolver::Connect4::Position P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 7 && height == 7) { C4_7x7::GameSolver::Connect4::Position P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 8 && height == 6) { C4_8x6::GameSolver::Connect4::Position P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 9 && height == 7) { C4_9x7::GameSolver::Connect4::Position P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 9 && height == 6) { C4_9x6::GameSolver::Connect4::Position P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 11 && height == 4) { C4_11x4::GameSolver::Connect4::Position P; P.play(pos); items64.push_back({P.key3(), score}); }

        return info.Env().Undefined();
    }

    Napi::Value Size(const CallbackInfo& info) {
        return Number::New(info.Env(), (double)(is128() ? items128.size() : items64.size()));
    }

    Napi::Value SaveDense(const CallbackInfo& info) {
        std::string filename = info[0].As<String>().Utf8Value();
        if (width == 6 && height == 5) C4_6x5::GameSolver::Connect4::OpeningBookBase<6, 5>::save_dense(filename, depth, items64);
        else if (width == 6 && height == 6) C4_6x6::GameSolver::Connect4::OpeningBookBase<6, 6>::save_dense(filename, depth, items64);
        else if (width == 7 && height == 6) C4_7x6::GameSolver::Connect4::OpeningBookBase<7, 6>::save_dense(filename, depth, items64);
        else if (width == 7 && height == 7) C4_7x7::GameSolver::Connect4::OpeningBookBase<7, 7>::save_dense(filename, depth, items64);
        else if (width == 8 && height == 6) C4_8x6::GameSolver::Connect4::OpeningBookBase<8, 6>::save_dense(filename, depth, items64);
        else if (width == 9 && height == 7) C4_9x7::GameSolver::Connect4::OpeningBookBase<9, 7>::save_dense(filename, depth, items128);
        else if (width == 9 && height == 6) C4_9x6::GameSolver::Connect4::OpeningBookBase<9, 6>::save_dense(filename, depth, items64);
        else if (width == 11 && height == 4) C4_11x4::GameSolver::Connect4::OpeningBookBase<11, 4>::save_dense(filename, depth, items64);
        return info.Env().Undefined();
    }

    Napi::Value SaveEliasFano(const CallbackInfo& info) {
        std::string filename = info[0].As<String>().Utf8Value();
        if (width == 6 && height == 5) C4_6x5::GameSolver::Connect4::OpeningBookBase<6, 5>::save_elias_fano(filename, depth, items64);
        else if (width == 6 && height == 6) C4_6x6::GameSolver::Connect4::OpeningBookBase<6, 6>::save_elias_fano(filename, depth, items64);
        else if (width == 7 && height == 6) C4_7x6::GameSolver::Connect4::OpeningBookBase<7, 6>::save_elias_fano(filename, depth, items64);
        else if (width == 7 && height == 7) C4_7x7::GameSolver::Connect4::OpeningBookBase<7, 7>::save_elias_fano(filename, depth, items64);
        else if (width == 8 && height == 6) C4_8x6::GameSolver::Connect4::OpeningBookBase<8, 6>::save_elias_fano(filename, depth, items64);
        else if (width == 9 && height == 7) C4_9x7::GameSolver::Connect4::OpeningBookBase<9, 7>::save_elias_fano(filename, depth, items128);
        else if (width == 9 && height == 6) C4_9x6::GameSolver::Connect4::OpeningBookBase<9, 6>::save_elias_fano(filename, depth, items64);
        else if (width == 11 && height == 4) C4_11x4::GameSolver::Connect4::OpeningBookBase<11, 4>::save_elias_fano(filename, depth, items64);
        return info.Env().Undefined();
    }
};

template<int W, int H>
void explore_positions(const GameSolver::Connect4::GenericPosition<W, H>& P, std::string& pos_str, int max_depth, int target_depth, std::unordered_set<uint64_t>& visited, std::vector<std::string>& results) {
    uint64_t key = P.key3();
    if (!visited.insert(key).second) return;

    int nb_moves = P.nbMoves();
    if (nb_moves == target_depth) {
        results.push_back(pos_str);
    }

    if (nb_moves >= max_depth) return;

    for (int i = 0; i < W; i++) {
        if (P.canPlay(i) && !P.isWinningMove(i)) {
            GameSolver::Connect4::GenericPosition<W, H> P2(P);
            P2.playCol(i);
            pos_str.push_back('1' + i);
            explore_positions(P2, pos_str, max_depth, target_depth, visited, results);
            pos_str.pop_back();
        }
    }
}

template<int W, int H>
void generate_positions_for_board(int max_depth, std::vector<std::string>& results) {
    std::string pos_str = "";
    for (int d = max_depth; d >= 0; d--) {
        std::unordered_set<uint64_t> visited;
        explore_positions(GameSolver::Connect4::GenericPosition<W, H>(), pos_str, d, d, visited, results);
    }
}

Value GeneratePositions(const CallbackInfo& info) {
    Env env = info.Env();
    int width = info[0].As<Number>().Uint32Value();
    int height = info[1].As<Number>().Uint32Value();
    int depth = info[2].As<Number>().Uint32Value();

    std::vector<std::string> results;

    if (width == 6 && height == 5) generate_positions_for_board<6, 5>(depth, results);
    else if (width == 6 && height == 6) generate_positions_for_board<6, 6>(depth, results);
    else if (width == 7 && height == 6) generate_positions_for_board<7, 6>(depth, results);
    else if (width == 7 && height == 7) generate_positions_for_board<7, 7>(depth, results);
    else if (width == 8 && height == 6) generate_positions_for_board<8, 6>(depth, results);
    else if (width == 9 && height == 7) generate_positions_for_board<9, 7>(depth, results);
    else if (width == 9 && height == 6) generate_positions_for_board<9, 6>(depth, results);
    else if (width == 11 && height == 4) generate_positions_for_board<11, 4>(depth, results);

    Array js_results = Array::New(env, results.size());
    for (size_t i = 0; i < results.size(); i++) {
        js_results[i] = String::New(env, results[i]);
    }
    return js_results;
}

Object Init(Env env, Object exports) {
    exports.Set(String::New(env, "_createSolver"), Function::New(env, CreateSolver));
    exports.Set(String::New(env, "_destroySolver"), Function::New(env, DestroySolver));
    exports.Set(String::New(env, "_createCache"), Function::New(env, CreateCache));
    exports.Set(String::New(env, "_destroyCache"), Function::New(env, DestroyCache));
    exports.Set(String::New(env, "_analyzeExact"), Function::New(env, AnalyzeExact));
    exports.Set(String::New(env, "_analyzeHeuristic"), Function::New(env, AnalyzeHeuristic));
    exports.Set(String::New(env, "_createBook"), Function::New(env, CreateBook));
    exports.Set(String::New(env, "_destroyBook"), Function::New(env, DestroyBook));
    exports.Set(String::New(env, "_getNodeCount"), Function::New(env, GetNodeCount));
    exports.Set(String::New(env, "_generatePositions"), Function::New(env, GeneratePositions));
    
    BookBuilder::Init(env, exports);
    return exports;
}

NODE_API_MODULE(connect4, Init)
