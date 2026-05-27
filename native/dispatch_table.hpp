#pragma once
#include "bindings_core.hpp"
#include <optional>

// Helper to pass types to generic lambdas
template <typename SizeInfo>
struct SizeTag {
    using type = SizeInfo;
};

// Main dispatcher function — matches on (w, h, align, wrap)
template <typename R, typename F, typename... Ts>
R dispatch_impl(int w, int h, int align, bool wrap, F&& f, std::tuple<Ts...>) {
    std::optional<R> result;
    bool found = false;
    (void)((w == Ts::w && h == Ts::h && align == Ts::align && wrap == Ts::wrap ? (
        result = f(SizeTag<Ts>{}),
        found = true
    ) : false) || ...);

    if (found) return *result;

    if (w * (h + 1) > 127) {
        throw std::invalid_argument("Board dimensions too large. Max supported generic configuration requires w * (h + 1) <= 127 bits.");
    }
    // Dynamic fallback: only valid for standard C4 (align=4, no wrap)
    if (align != 4 || wrap) {
        throw std::invalid_argument("This game variant (align/wrap combination) is not supported for this board size.");
    }
    return f(SizeTag<SupportedSize<-1, -1, 4, false, C4_Dynamic::Solver, C4_Dynamic::HeuristicSolver>>{});
}

// Void dispatcher function — matches on (w, h, align, wrap)
template <typename F, typename... Ts>
void dispatch_void_impl(int w, int h, int align, bool wrap, F&& f, std::tuple<Ts...>) {
    bool found = false;
    (void)((w == Ts::w && h == Ts::h && align == Ts::align && wrap == Ts::wrap ? (
        f(SizeTag<Ts>{}),
        found = true
    ) : false) || ...);

    if (!found) {
        if (w * (h + 1) > 127) {
            throw std::invalid_argument("Board dimensions too large. Max supported generic configuration requires w * (h + 1) <= 127 bits.");
        }
        if (align != 4 || wrap) {
            throw std::invalid_argument("This game variant (align/wrap combination) is not supported for this board size.");
        }
        f(SizeTag<SupportedSize<-1, -1, 4, false, C4_Dynamic::Solver, C4_Dynamic::HeuristicSolver>>{});
    }
}

template <typename R, typename F>
R dispatch(int w, int h, int align, bool wrap, F&& f) {
    return dispatch_impl<R>(w, h, align, wrap, std::forward<F>(f), AllSupportedSizes{});
}

template <typename F>
void dispatch_void(int w, int h, int align, bool wrap, F&& f) {
    dispatch_void_impl(w, h, align, wrap, std::forward<F>(f), AllSupportedSizes{});
}

// Macros provided to wrap the dispatch functions.
// NOTE: 'align' and 'wrap' must be in scope when macros are invoked (provided by caller).

#define DISPATCH_EXACT(ACTION, ...) \
    return dispatch<decltype(ACTION<7,6,4,false>(*static_cast<C4_7x6::Solver*>(solver), __VA_ARGS__))>(w, h, align, wrap, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return ACTION<Size::w, Size::h, Size::align, Size::wrap>(*static_cast<typename Size::Solver*>(solver), __VA_ARGS__); \
    });

#define DISPATCH_HEURISTIC_VOID(ACTION, ...) \
    dispatch_void(w, h, align, wrap, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        ACTION<Size::w, Size::h>(*static_cast<typename Size::HeuristicSolver*>(solver), __VA_ARGS__); \
    }); \
    return;

#define DISPATCH_HEURISTIC_RETURN(ACTION, ...) \
    return dispatch<decltype(ACTION<7,6>(*static_cast<C4_7x6::HeuristicSolver*>(solver), __VA_ARGS__))>(w, h, align, wrap, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return ACTION<Size::w, Size::h>(*static_cast<typename Size::HeuristicSolver*>(solver), __VA_ARGS__); \
    });

#define DISPATCH_HEURISTIC_DOUBLE(ACTION, ...) \
    return dispatch<double>(w, h, align, wrap, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return ACTION<Size::w, Size::h>(*static_cast<typename Size::HeuristicSolver*>(solver), __VA_ARGS__); \
    });

#define DISPATCH_HEURISTIC DISPATCH_HEURISTIC_RETURN

#define DISPATCH_CREATE_EXACT(W, H, ALIGN, WRAP, CACHE_PTR) \
    return dispatch<void*>(W, H, ALIGN, WRAP, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return Size::Solver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR), W, H).release(); \
    });

#define DISPATCH_CREATE_HEURISTIC(W, H, ALIGN, WRAP, CACHE_PTR) \
    return dispatch<void*>(W, H, ALIGN, WRAP, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return Size::HeuristicSolver::createWithCache(static_cast<::GameSolver::Connect4::Cache*>(CACHE_PTR), W, H).release(); \
    });

#define DISPATCH_DELETE(W, H, ALIGN, WRAP, SOLVER) \
    dispatch_void(W, H, ALIGN, WRAP, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        delete static_cast<typename Size::Solver*>(SOLVER); \
    }); \
    return;

#define DISPATCH_CREATE_EXACT_CACHE(W, H, ALIGN, WRAP, TABLE_BYTES) \
    return dispatch<void*>(W, H, ALIGN, WRAP, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return Size::Solver::createCache(TABLE_BYTES, W, H).release(); \
    });

#define DISPATCH_CREATE_HEURISTIC_CACHE(W, H, ALIGN, WRAP, TABLE_BYTES) \
    return dispatch<void*>(W, H, ALIGN, WRAP, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return Size::HeuristicSolver::createCache(TABLE_BYTES, W, H).release(); \
    });

#define DISPATCH_DELETE_BOOK(W, H, ALIGN, WRAP, BOOK) \
    dispatch_void(W, H, ALIGN, WRAP, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        delete static_cast<::GameSolver::Connect4::OpeningBookBase<Size::w, Size::h>*>(BOOK); \
    }); \
    return;

#define DISPATCH_EXACT_VOID(W, H, ALIGN, WRAP, ACTION, SOLVER, ...) \
    dispatch_void(W, H, ALIGN, WRAP, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        static_cast<typename Size::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    }); \
    return;

#define DISPATCH_EXACT_RETURN(W, H, ALIGN, WRAP, ACTION, SOLVER, ...) \
    return dispatch<decltype(static_cast<C4_7x6::Solver*>(SOLVER)->ACTION(__VA_ARGS__))>(W, H, ALIGN, WRAP, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return static_cast<typename Size::Solver*>(SOLVER)->ACTION(__VA_ARGS__); \
    });

#define DISPATCH_STATIC(W, H, ALIGN, WRAP, ACTION, ...) \
    return dispatch<decltype(ACTION<7, 6, 4, false>(__VA_ARGS__))>(W, H, ALIGN, WRAP, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        return ACTION<Size::w, Size::h, Size::align, Size::wrap>(__VA_ARGS__); \
    });

#define DISPATCH_VOID_STATIC(W, H, ALIGN, WRAP, ACTION, ...) \
    dispatch_void(W, H, ALIGN, WRAP, [&](auto tag) { \
        using Size = typename decltype(tag)::type; \
        ACTION<Size::w, Size::h, Size::align, Size::wrap>(__VA_ARGS__); \
    }); \
    return;
