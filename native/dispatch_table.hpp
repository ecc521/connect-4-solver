#pragma once
#include "bindings_core.hpp"
#include <optional>

// Helper to pass types to generic lambdas
template <typename SizeInfo>
struct SizeTag {
    using type = SizeInfo;
};

// Main dispatcher function
template <typename R, typename F, typename... Ts>
R dispatch_impl(int w, int h, F&& f, std::tuple<Ts...>) {
    std::optional<R> result;
    bool found = false;
    (void)((w == Ts::w && h == Ts::h ? (
        result = f(SizeTag<Ts>{}),
        found = true
    ) : false) || ...);
    
    if (found) return *result;
    return R{};
}

// Void dispatcher function
template <typename F, typename... Ts>
void dispatch_void_impl(int w, int h, F&& f, std::tuple<Ts...>) {
    (void)((w == Ts::w && h == Ts::h ? (
        f(SizeTag<Ts>{}),
        true
    ) : false) || ...);
}

template <typename R, typename F>
R dispatch(int w, int h, F&& f) {
    return dispatch_impl<R>(w, h, std::forward<F>(f), AllSupportedSizes{});
}

template <typename F>
void dispatch_void(int w, int h, F&& f) {
    dispatch_void_impl(w, h, std::forward<F>(f), AllSupportedSizes{});
}

// Macros provided to wrap the dispatch functions, serving as drop-in replacements 
// to keep legacy API transitions minimal and localized.

#define DISPATCH_EXACT(ACTION, ...) \
    return dispatch<decltype(ACTION<4,4>(*static_cast<C4_4x4::Solver*>(solver), __VA_ARGS__))>(w, h, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return ACTION<Size::w, Size::h>(*static_cast<typename Size::Solver*>(solver), __VA_ARGS__); \
    });

#define DISPATCH_HEURISTIC_VOID(ACTION, ...) \
    dispatch_void(w, h, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        ACTION<Size::w, Size::h>(*static_cast<typename Size::HeuristicSolver*>(solver), __VA_ARGS__); \
    }); \
    return;

#define DISPATCH_HEURISTIC_RETURN(ACTION, ...) \
    return dispatch<decltype(ACTION<4,4>(*static_cast<C4_4x4::HeuristicSolver*>(solver), __VA_ARGS__))>(w, h, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return ACTION<Size::w, Size::h>(*static_cast<typename Size::HeuristicSolver*>(solver), __VA_ARGS__); \
    });

#define DISPATCH_HEURISTIC_DOUBLE(ACTION, ...) \
    return dispatch<double>(w, h, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return ACTION<Size::w, Size::h>(*static_cast<typename Size::HeuristicSolver*>(solver), __VA_ARGS__); \
    });

#define DISPATCH_HEURISTIC DISPATCH_HEURISTIC_RETURN

#define DISPATCH_CREATE_EXACT(W, H, CACHE_PTR) \
    return dispatch<void*>(W, H, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return Size::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    });

#define DISPATCH_CREATE_HEURISTIC(W, H, CACHE_PTR) \
    return dispatch<void*>(W, H, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return Size::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR)).release(); \
    });

#define DISPATCH_DELETE(W, H, SOLVER) \
    dispatch_void(W, H, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        delete static_cast<typename Size::Solver*>(SOLVER); \
    }); \
    return;

#define DISPATCH_CREATE_EXACT_CACHE(W, H, TABLE_BYTES) \
    return dispatch<void*>(W, H, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return Size::Solver::createCache(TABLE_BYTES).release(); \
    });

#define DISPATCH_CREATE_HEURISTIC_CACHE(W, H, TABLE_BYTES) \
    return dispatch<void*>(W, H, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return Size::HeuristicSolver::createCache(TABLE_BYTES).release(); \
    });

#define DISPATCH_DELETE_BOOK(W, H, BOOK) \
    dispatch_void(W, H, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        delete static_cast<::GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>*>(BOOK); \
    }); \
    return;

#define DISPATCH_EXACT_VOID(W, H, ACTION, SOLVER, ...) \
    dispatch_void(W, H, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        static_cast<typename Size::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    }); \
    return;

#define DISPATCH_EXACT_RETURN(W, H, ACTION, SOLVER, ...) \
    return dispatch<decltype(static_cast<C4_4x4::Solver*>(SOLVER)->ACTION(__VA_ARGS__))>(W, H, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return static_cast<typename Size::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    });

#define DISPATCH_STATIC(W, H, ACTION, ...) \
    return dispatch<decltype(ACTION<4, 4>(__VA_ARGS__))>(W, H, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return ACTION<Size::w, Size::h>(__VA_ARGS__); \
    });

#define DISPATCH_VOID_STATIC(W, H, ACTION, ...) \
    dispatch_void(W, H, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        ACTION<Size::w, Size::h>(__VA_ARGS__); \
    }); \
    return;
