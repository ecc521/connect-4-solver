import re

with open('native/dispatch_table.hpp', 'r') as f:
    data = f.read()

sizes = set()
for match in re.finditer(r'if \(W == (\d+) && H == (\d+)\)', data):
    sizes.add((int(match.group(1)), int(match.group(2))))
for match in re.finditer(r'if \(w == (\d+) && h == (\d+)\)', data):
    sizes.add((int(match.group(1)), int(match.group(2))))

sizes = sorted(list(sizes), key=lambda x: (x[0], x[1]))

def gen_if_else(sizes, fmt_str):
    res = []
    for i, (w, h) in enumerate(sizes):
        prefix = "if" if i == 0 else "else if"
        res.append(f"        {prefix} (w == {w} && h == {h}) {fmt_str.replace('WW', str(w)).replace('HH', str(h))}")
    return "\n".join(res)

with open('native/node_binding.cpp', 'w') as f:
    f.write(r'''#include <napi.h>
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
        else if (w == 6 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<6, 7>::createCache(bytes).release();
        else if (w == 6 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<6, 8>::createCache(bytes).release();
        else if (w == 6 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<6, 9>::createCache(bytes).release();
        else if (w == 6 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<6, 10>::createCache(bytes).release();
        else if (w == 6 && h == 11) ptr = GameSolver::Connect4::HeuristicSolver<6, 11>::createCache(bytes).release();
        else if (w == 6 && h == 12) ptr = GameSolver::Connect4::HeuristicSolver<6, 12>::createCache(bytes).release();
        else if (w == 7 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<7, 5>::createCache(bytes).release();
        else if (w == 7 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<7, 8>::createCache(bytes).release();
        else if (w == 7 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<7, 9>::createCache(bytes).release();
        else if (w == 7 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<7, 10>::createCache(bytes).release();
        else if (w == 7 && h == 11) ptr = GameSolver::Connect4::HeuristicSolver<7, 11>::createCache(bytes).release();
        else if (w == 7 && h == 12) ptr = GameSolver::Connect4::HeuristicSolver<7, 12>::createCache(bytes).release();
        else if (w == 8 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<8, 5>::createCache(bytes).release();
        else if (w == 8 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<8, 7>::createCache(bytes).release();
        else if (w == 8 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<8, 9>::createCache(bytes).release();
        else if (w == 8 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<8, 10>::createCache(bytes).release();
        else if (w == 8 && h == 11) ptr = GameSolver::Connect4::HeuristicSolver<8, 11>::createCache(bytes).release();
        else if (w == 8 && h == 12) ptr = GameSolver::Connect4::HeuristicSolver<8, 12>::createCache(bytes).release();
        else if (w == 9 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<9, 5>::createCache(bytes).release();
        else if (w == 9 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<9, 8>::createCache(bytes).release();
        else if (w == 9 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<9, 10>::createCache(bytes).release();
        else if (w == 9 && h == 11) ptr = GameSolver::Connect4::HeuristicSolver<9, 11>::createCache(bytes).release();
        else if (w == 9 && h == 12) ptr = GameSolver::Connect4::HeuristicSolver<9, 12>::createCache(bytes).release();
        else if (w == 10 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<10, 5>::createCache(bytes).release();
        else if (w == 10 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<10, 6>::createCache(bytes).release();
        else if (w == 10 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<10, 8>::createCache(bytes).release();
        else if (w == 10 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<10, 9>::createCache(bytes).release();
        else if (w == 10 && h == 11) ptr = GameSolver::Connect4::HeuristicSolver<10, 11>::createCache(bytes).release();
        else if (w == 11 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<11, 5>::createCache(bytes).release();
        else if (w == 11 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<11, 6>::createCache(bytes).release();
        else if (w == 11 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<11, 7>::createCache(bytes).release();
        else if (w == 11 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<11, 8>::createCache(bytes).release();
        else if (w == 11 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<11, 9>::createCache(bytes).release();
        else if (w == 11 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<11, 10>::createCache(bytes).release();
        else if (w == 12 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<12, 5>::createCache(bytes).release();
        else if (w == 12 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<12, 6>::createCache(bytes).release();
        else if (w == 12 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<12, 7>::createCache(bytes).release();
        else if (w == 12 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<12, 8>::createCache(bytes).release();
        else if (w == 12 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<12, 9>::createCache(bytes).release();
        else if (w == 9 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<9, 7>::createCache(bytes).release();
        else if (w == 8 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<8, 8>::createCache(bytes).release();
        else if (w == 10 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<10, 7>::createCache(bytes).release();
        else if (w == 9 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<9, 9>::createCache(bytes).release();
        else if (w == 10 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<10, 10>::createCache(bytes).release();
        else if (w == 9 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<9, 6>::createCache(bytes).release();
        else if (w == 11 && h == 4) ptr = GameSolver::Connect4::HeuristicSolver<11, 4>::createCache(bytes).release();
    } else {
        if (w == 6 && h == 5) ptr = C4_6x5::Solver::createCache(bytes).release();
        else if (w == 6 && h == 6) ptr = C4_6x6::Solver::createCache(bytes).release();
        else if (w == 7 && h == 6) ptr = C4_7x6::Solver::createCache(bytes).release();
        else if (w == 7 && h == 7) ptr = C4_7x7::Solver::createCache(bytes).release();
        else if (w == 8 && h == 6) ptr = C4_8x6::Solver::createCache(bytes).release();
        else if (w == 4 && h == 4) ptr = C4_4x4::Solver::createCache(bytes).release();
        else if (w == 4 && h == 5) ptr = C4_4x5::Solver::createCache(bytes).release();
        else if (w == 4 && h == 6) ptr = C4_4x6::Solver::createCache(bytes).release();
        else if (w == 4 && h == 7) ptr = C4_4x7::Solver::createCache(bytes).release();
        else if (w == 4 && h == 8) ptr = C4_4x8::Solver::createCache(bytes).release();
        else if (w == 4 && h == 9) ptr = C4_4x9::Solver::createCache(bytes).release();
        else if (w == 4 && h == 10) ptr = C4_4x10::Solver::createCache(bytes).release();
        else if (w == 4 && h == 11) ptr = C4_4x11::Solver::createCache(bytes).release();
        else if (w == 4 && h == 12) ptr = C4_4x12::Solver::createCache(bytes).release();
        else if (w == 5 && h == 4) ptr = C4_5x4::Solver::createCache(bytes).release();
        else if (w == 5 && h == 5) ptr = C4_5x5::Solver::createCache(bytes).release();
        else if (w == 5 && h == 6) ptr = C4_5x6::Solver::createCache(bytes).release();
        else if (w == 5 && h == 7) ptr = C4_5x7::Solver::createCache(bytes).release();
        else if (w == 5 && h == 8) ptr = C4_5x8::Solver::createCache(bytes).release();
        else if (w == 5 && h == 9) ptr = C4_5x9::Solver::createCache(bytes).release();
        else if (w == 5 && h == 10) ptr = C4_5x10::Solver::createCache(bytes).release();
        else if (w == 5 && h == 11) ptr = C4_5x11::Solver::createCache(bytes).release();
        else if (w == 5 && h == 12) ptr = C4_5x12::Solver::createCache(bytes).release();
        else if (w == 6 && h == 4) ptr = C4_6x4::Solver::createCache(bytes).release();
        else if (w == 6 && h == 7) ptr = C4_6x7::Solver::createCache(bytes).release();
        else if (w == 6 && h == 8) ptr = C4_6x8::Solver::createCache(bytes).release();
        else if (w == 6 && h == 9) ptr = C4_6x9::Solver::createCache(bytes).release();
        else if (w == 6 && h == 10) ptr = C4_6x10::Solver::createCache(bytes).release();
        else if (w == 6 && h == 11) ptr = C4_6x11::Solver::createCache(bytes).release();
        else if (w == 6 && h == 12) ptr = C4_6x12::Solver::createCache(bytes).release();
        else if (w == 7 && h == 4) ptr = C4_7x4::Solver::createCache(bytes).release();
        else if (w == 7 && h == 5) ptr = C4_7x5::Solver::createCache(bytes).release();
        else if (w == 7 && h == 8) ptr = C4_7x8::Solver::createCache(bytes).release();
        else if (w == 7 && h == 9) ptr = C4_7x9::Solver::createCache(bytes).release();
        else if (w == 7 && h == 10) ptr = C4_7x10::Solver::createCache(bytes).release();
        else if (w == 7 && h == 11) ptr = C4_7x11::Solver::createCache(bytes).release();
        else if (w == 7 && h == 12) ptr = C4_7x12::Solver::createCache(bytes).release();
        else if (w == 8 && h == 4) ptr = C4_8x4::Solver::createCache(bytes).release();
        else if (w == 8 && h == 5) ptr = C4_8x5::Solver::createCache(bytes).release();
        else if (w == 8 && h == 7) ptr = C4_8x7::Solver::createCache(bytes).release();
        else if (w == 8 && h == 9) ptr = C4_8x9::Solver::createCache(bytes).release();
        else if (w == 8 && h == 10) ptr = C4_8x10::Solver::createCache(bytes).release();
        else if (w == 8 && h == 11) ptr = C4_8x11::Solver::createCache(bytes).release();
        else if (w == 8 && h == 12) ptr = C4_8x12::Solver::createCache(bytes).release();
        else if (w == 9 && h == 4) ptr = C4_9x4::Solver::createCache(bytes).release();
        else if (w == 9 && h == 5) ptr = C4_9x5::Solver::createCache(bytes).release();
        else if (w == 9 && h == 8) ptr = C4_9x8::Solver::createCache(bytes).release();
        else if (w == 9 && h == 10) ptr = C4_9x10::Solver::createCache(bytes).release();
        else if (w == 9 && h == 11) ptr = C4_9x11::Solver::createCache(bytes).release();
        else if (w == 9 && h == 12) ptr = C4_9x12::Solver::createCache(bytes).release();
        else if (w == 10 && h == 4) ptr = C4_10x4::Solver::createCache(bytes).release();
        else if (w == 10 && h == 5) ptr = C4_10x5::Solver::createCache(bytes).release();
        else if (w == 10 && h == 6) ptr = C4_10x6::Solver::createCache(bytes).release();
        else if (w == 10 && h == 8) ptr = C4_10x8::Solver::createCache(bytes).release();
        else if (w == 10 && h == 9) ptr = C4_10x9::Solver::createCache(bytes).release();
        else if (w == 10 && h == 11) ptr = C4_10x11::Solver::createCache(bytes).release();
        else if (w == 11 && h == 5) ptr = C4_11x5::Solver::createCache(bytes).release();
        else if (w == 11 && h == 6) ptr = C4_11x6::Solver::createCache(bytes).release();
        else if (w == 11 && h == 7) ptr = C4_11x7::Solver::createCache(bytes).release();
        else if (w == 11 && h == 8) ptr = C4_11x8::Solver::createCache(bytes).release();
        else if (w == 11 && h == 9) ptr = C4_11x9::Solver::createCache(bytes).release();
        else if (w == 11 && h == 10) ptr = C4_11x10::Solver::createCache(bytes).release();
        else if (w == 12 && h == 4) ptr = C4_12x4::Solver::createCache(bytes).release();
        else if (w == 12 && h == 5) ptr = C4_12x5::Solver::createCache(bytes).release();
        else if (w == 12 && h == 6) ptr = C4_12x6::Solver::createCache(bytes).release();
        else if (w == 12 && h == 7) ptr = C4_12x7::Solver::createCache(bytes).release();
        else if (w == 12 && h == 8) ptr = C4_12x8::Solver::createCache(bytes).release();
        else if (w == 12 && h == 9) ptr = C4_12x9::Solver::createCache(bytes).release();
        else if (w == 8 && h == 8) ptr = C4_8x8::Solver::createCache(bytes).release();
        else if (w == 9 && h == 7) ptr = C4_9x7::Solver::createCache(bytes).release();
        else if (w == 9 && h == 6) ptr = C4_9x6::Solver::createCache(bytes).release();
        else if (w == 11 && h == 4) ptr = C4_11x4::Solver::createCache(bytes).release();
        else if (w == 7 && h == 13) ptr = C4_7x13::Solver::createCache(bytes).release();
        else if (w == 8 && h == 13) ptr = C4_8x13::Solver::createCache(bytes).release();
        else if (w == 10 && h == 10) ptr = C4_10x10::Solver::createCache(bytes).release();
        else if (w == 13 && h == 4) ptr = C4_13x4::Solver::createCache(bytes).release();
        else if (w == 13 && h == 5) ptr = C4_13x5::Solver::createCache(bytes).release();
        else if (w == 13 && h == 6) ptr = C4_13x6::Solver::createCache(bytes).release();
        else if (w == 13 && h == 7) ptr = C4_13x7::Solver::createCache(bytes).release();
        else if (w == 13 && h == 8) ptr = C4_13x8::Solver::createCache(bytes).release();
        else if (w == 9 && h == 9) ptr = C4_9x9::Solver::createCache(bytes).release();
    }
    return WrapPointer(info, static_cast<GameSolver::Connect4::Cache*>(ptr));
}

Value DestroyCache(const CallbackInfo& info) {
    auto cache = UnwrapPointer<GameSolver::Connect4::Cache>(info[0]);
    delete cache;
    return info.Env().Undefined();
}

Value CreateSolver(const CallbackInfo& info) {
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
        else if (w == 6 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<6, 7>::createWithCache(cache).release();
        else if (w == 6 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<6, 8>::createWithCache(cache).release();
        else if (w == 6 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<6, 9>::createWithCache(cache).release();
        else if (w == 6 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<6, 10>::createWithCache(cache).release();
        else if (w == 6 && h == 11) ptr = GameSolver::Connect4::HeuristicSolver<6, 11>::createWithCache(cache).release();
        else if (w == 6 && h == 12) ptr = GameSolver::Connect4::HeuristicSolver<6, 12>::createWithCache(cache).release();
        else if (w == 7 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<7, 5>::createWithCache(cache).release();
        else if (w == 7 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<7, 8>::createWithCache(cache).release();
        else if (w == 7 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<7, 9>::createWithCache(cache).release();
        else if (w == 7 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<7, 10>::createWithCache(cache).release();
        else if (w == 7 && h == 11) ptr = GameSolver::Connect4::HeuristicSolver<7, 11>::createWithCache(cache).release();
        else if (w == 7 && h == 12) ptr = GameSolver::Connect4::HeuristicSolver<7, 12>::createWithCache(cache).release();
        else if (w == 8 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<8, 5>::createWithCache(cache).release();
        else if (w == 8 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<8, 7>::createWithCache(cache).release();
        else if (w == 8 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<8, 9>::createWithCache(cache).release();
        else if (w == 8 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<8, 10>::createWithCache(cache).release();
        else if (w == 8 && h == 11) ptr = GameSolver::Connect4::HeuristicSolver<8, 11>::createWithCache(cache).release();
        else if (w == 8 && h == 12) ptr = GameSolver::Connect4::HeuristicSolver<8, 12>::createWithCache(cache).release();
        else if (w == 9 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<9, 5>::createWithCache(cache).release();
        else if (w == 9 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<9, 8>::createWithCache(cache).release();
        else if (w == 9 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<9, 10>::createWithCache(cache).release();
        else if (w == 9 && h == 11) ptr = GameSolver::Connect4::HeuristicSolver<9, 11>::createWithCache(cache).release();
        else if (w == 9 && h == 12) ptr = GameSolver::Connect4::HeuristicSolver<9, 12>::createWithCache(cache).release();
        else if (w == 10 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<10, 5>::createWithCache(cache).release();
        else if (w == 10 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<10, 6>::createWithCache(cache).release();
        else if (w == 10 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<10, 8>::createWithCache(cache).release();
        else if (w == 10 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<10, 9>::createWithCache(cache).release();
        else if (w == 10 && h == 11) ptr = GameSolver::Connect4::HeuristicSolver<10, 11>::createWithCache(cache).release();
        else if (w == 11 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<11, 5>::createWithCache(cache).release();
        else if (w == 11 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<11, 6>::createWithCache(cache).release();
        else if (w == 11 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<11, 7>::createWithCache(cache).release();
        else if (w == 11 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<11, 8>::createWithCache(cache).release();
        else if (w == 11 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<11, 9>::createWithCache(cache).release();
        else if (w == 11 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<11, 10>::createWithCache(cache).release();
        else if (w == 12 && h == 5) ptr = GameSolver::Connect4::HeuristicSolver<12, 5>::createWithCache(cache).release();
        else if (w == 12 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<12, 6>::createWithCache(cache).release();
        else if (w == 12 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<12, 7>::createWithCache(cache).release();
        else if (w == 12 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<12, 8>::createWithCache(cache).release();
        else if (w == 12 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<12, 9>::createWithCache(cache).release();
        else if (w == 9 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<9, 7>::createWithCache(cache).release();
        else if (w == 8 && h == 8) ptr = GameSolver::Connect4::HeuristicSolver<8, 8>::createWithCache(cache).release();
        else if (w == 10 && h == 7) ptr = GameSolver::Connect4::HeuristicSolver<10, 7>::createWithCache(cache).release();
        else if (w == 9 && h == 9) ptr = GameSolver::Connect4::HeuristicSolver<9, 9>::createWithCache(cache).release();
        else if (w == 10 && h == 10) ptr = GameSolver::Connect4::HeuristicSolver<10, 10>::createWithCache(cache).release();
        else if (w == 9 && h == 6) ptr = GameSolver::Connect4::HeuristicSolver<9, 6>::createWithCache(cache).release();
        else if (w == 11 && h == 4) ptr = GameSolver::Connect4::HeuristicSolver<11, 4>::createWithCache(cache).release();
    } else {
        if (w == 6 && h == 5) ptr = C4_6x5::Solver::createWithCache(cache).release();
        else if (w == 6 && h == 6) ptr = C4_6x6::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 6) ptr = C4_7x6::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 7) ptr = C4_7x7::Solver::createWithCache(cache).release();
        else if (w == 8 && h == 6) ptr = C4_8x6::Solver::createWithCache(cache).release();
        else if (w == 4 && h == 4) ptr = C4_4x4::Solver::createWithCache(cache).release();
        else if (w == 4 && h == 5) ptr = C4_4x5::Solver::createWithCache(cache).release();
        else if (w == 4 && h == 6) ptr = C4_4x6::Solver::createWithCache(cache).release();
        else if (w == 4 && h == 7) ptr = C4_4x7::Solver::createWithCache(cache).release();
        else if (w == 4 && h == 8) ptr = C4_4x8::Solver::createWithCache(cache).release();
        else if (w == 4 && h == 9) ptr = C4_4x9::Solver::createWithCache(cache).release();
        else if (w == 4 && h == 10) ptr = C4_4x10::Solver::createWithCache(cache).release();
        else if (w == 4 && h == 11) ptr = C4_4x11::Solver::createWithCache(cache).release();
        else if (w == 4 && h == 12) ptr = C4_4x12::Solver::createWithCache(cache).release();
        else if (w == 5 && h == 4) ptr = C4_5x4::Solver::createWithCache(cache).release();
        else if (w == 5 && h == 5) ptr = C4_5x5::Solver::createWithCache(cache).release();
        else if (w == 5 && h == 6) ptr = C4_5x6::Solver::createWithCache(cache).release();
        else if (w == 5 && h == 7) ptr = C4_5x7::Solver::createWithCache(cache).release();
        else if (w == 5 && h == 8) ptr = C4_5x8::Solver::createWithCache(cache).release();
        else if (w == 5 && h == 9) ptr = C4_5x9::Solver::createWithCache(cache).release();
        else if (w == 5 && h == 10) ptr = C4_5x10::Solver::createWithCache(cache).release();
        else if (w == 5 && h == 11) ptr = C4_5x11::Solver::createWithCache(cache).release();
        else if (w == 5 && h == 12) ptr = C4_5x12::Solver::createWithCache(cache).release();
        else if (w == 6 && h == 4) ptr = C4_6x4::Solver::createWithCache(cache).release();
        else if (w == 6 && h == 7) ptr = C4_6x7::Solver::createWithCache(cache).release();
        else if (w == 6 && h == 8) ptr = C4_6x8::Solver::createWithCache(cache).release();
        else if (w == 6 && h == 9) ptr = C4_6x9::Solver::createWithCache(cache).release();
        else if (w == 6 && h == 10) ptr = C4_6x10::Solver::createWithCache(cache).release();
        else if (w == 6 && h == 11) ptr = C4_6x11::Solver::createWithCache(cache).release();
        else if (w == 6 && h == 12) ptr = C4_6x12::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 4) ptr = C4_7x4::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 5) ptr = C4_7x5::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 8) ptr = C4_7x8::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 9) ptr = C4_7x9::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 10) ptr = C4_7x10::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 11) ptr = C4_7x11::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 12) ptr = C4_7x12::Solver::createWithCache(cache).release();
        else if (w == 8 && h == 4) ptr = C4_8x4::Solver::createWithCache(cache).release();
        else if (w == 8 && h == 5) ptr = C4_8x5::Solver::createWithCache(cache).release();
        else if (w == 8 && h == 7) ptr = C4_8x7::Solver::createWithCache(cache).release();
        else if (w == 8 && h == 9) ptr = C4_8x9::Solver::createWithCache(cache).release();
        else if (w == 8 && h == 10) ptr = C4_8x10::Solver::createWithCache(cache).release();
        else if (w == 8 && h == 11) ptr = C4_8x11::Solver::createWithCache(cache).release();
        else if (w == 8 && h == 12) ptr = C4_8x12::Solver::createWithCache(cache).release();
        else if (w == 9 && h == 4) ptr = C4_9x4::Solver::createWithCache(cache).release();
        else if (w == 9 && h == 5) ptr = C4_9x5::Solver::createWithCache(cache).release();
        else if (w == 9 && h == 8) ptr = C4_9x8::Solver::createWithCache(cache).release();
        else if (w == 9 && h == 10) ptr = C4_9x10::Solver::createWithCache(cache).release();
        else if (w == 9 && h == 11) ptr = C4_9x11::Solver::createWithCache(cache).release();
        else if (w == 9 && h == 12) ptr = C4_9x12::Solver::createWithCache(cache).release();
        else if (w == 10 && h == 4) ptr = C4_10x4::Solver::createWithCache(cache).release();
        else if (w == 10 && h == 5) ptr = C4_10x5::Solver::createWithCache(cache).release();
        else if (w == 10 && h == 6) ptr = C4_10x6::Solver::createWithCache(cache).release();
        else if (w == 10 && h == 8) ptr = C4_10x8::Solver::createWithCache(cache).release();
        else if (w == 10 && h == 9) ptr = C4_10x9::Solver::createWithCache(cache).release();
        else if (w == 10 && h == 11) ptr = C4_10x11::Solver::createWithCache(cache).release();
        else if (w == 11 && h == 5) ptr = C4_11x5::Solver::createWithCache(cache).release();
        else if (w == 11 && h == 6) ptr = C4_11x6::Solver::createWithCache(cache).release();
        else if (w == 11 && h == 7) ptr = C4_11x7::Solver::createWithCache(cache).release();
        else if (w == 11 && h == 8) ptr = C4_11x8::Solver::createWithCache(cache).release();
        else if (w == 11 && h == 9) ptr = C4_11x9::Solver::createWithCache(cache).release();
        else if (w == 11 && h == 10) ptr = C4_11x10::Solver::createWithCache(cache).release();
        else if (w == 12 && h == 4) ptr = C4_12x4::Solver::createWithCache(cache).release();
        else if (w == 12 && h == 5) ptr = C4_12x5::Solver::createWithCache(cache).release();
        else if (w == 12 && h == 6) ptr = C4_12x6::Solver::createWithCache(cache).release();
        else if (w == 12 && h == 7) ptr = C4_12x7::Solver::createWithCache(cache).release();
        else if (w == 12 && h == 8) ptr = C4_12x8::Solver::createWithCache(cache).release();
        else if (w == 12 && h == 9) ptr = C4_12x9::Solver::createWithCache(cache).release();
        else if (w == 8 && h == 8) ptr = C4_8x8::Solver::createWithCache(cache).release();
        else if (w == 9 && h == 7) ptr = C4_9x7::Solver::createWithCache(cache).release();
        else if (w == 9 && h == 6) ptr = C4_9x6::Solver::createWithCache(cache).release();
        else if (w == 11 && h == 4) ptr = C4_11x4::Solver::createWithCache(cache).release();
        else if (w == 7 && h == 13) ptr = C4_7x13::Solver::createWithCache(cache).release();
        else if (w == 8 && h == 13) ptr = C4_8x13::Solver::createWithCache(cache).release();
        else if (w == 10 && h == 10) ptr = C4_10x10::Solver::createWithCache(cache).release();
        else if (w == 13 && h == 4) ptr = C4_13x4::Solver::createWithCache(cache).release();
        else if (w == 13 && h == 5) ptr = C4_13x5::Solver::createWithCache(cache).release();
        else if (w == 13 && h == 6) ptr = C4_13x6::Solver::createWithCache(cache).release();
        else if (w == 13 && h == 7) ptr = C4_13x7::Solver::createWithCache(cache).release();
        else if (w == 13 && h == 8) ptr = C4_13x8::Solver::createWithCache(cache).release();
        else if (w == 9 && h == 9) ptr = C4_9x9::Solver::createWithCache(cache).release();
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
        else if (w == 6 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 7>*>(solver);
        else if (w == 6 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 8>*>(solver);
        else if (w == 6 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 9>*>(solver);
        else if (w == 6 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 10>*>(solver);
        else if (w == 6 && h == 11) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 11>*>(solver);
        else if (w == 6 && h == 12) delete static_cast<GameSolver::Connect4::HeuristicSolver<6, 12>*>(solver);
        else if (w == 7 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 5>*>(solver);
        else if (w == 7 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 8>*>(solver);
        else if (w == 7 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 9>*>(solver);
        else if (w == 7 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 10>*>(solver);
        else if (w == 7 && h == 11) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 11>*>(solver);
        else if (w == 7 && h == 12) delete static_cast<GameSolver::Connect4::HeuristicSolver<7, 12>*>(solver);
        else if (w == 8 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 5>*>(solver);
        else if (w == 8 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 7>*>(solver);
        else if (w == 8 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 9>*>(solver);
        else if (w == 8 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 10>*>(solver);
        else if (w == 8 && h == 11) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 11>*>(solver);
        else if (w == 8 && h == 12) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 12>*>(solver);
        else if (w == 9 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 5>*>(solver);
        else if (w == 9 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 8>*>(solver);
        else if (w == 9 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 10>*>(solver);
        else if (w == 9 && h == 11) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 11>*>(solver);
        else if (w == 9 && h == 12) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 12>*>(solver);
        else if (w == 10 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 5>*>(solver);
        else if (w == 10 && h == 6) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 6>*>(solver);
        else if (w == 10 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 8>*>(solver);
        else if (w == 10 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 9>*>(solver);
        else if (w == 10 && h == 11) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 11>*>(solver);
        else if (w == 11 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 5>*>(solver);
        else if (w == 11 && h == 6) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 6>*>(solver);
        else if (w == 11 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 7>*>(solver);
        else if (w == 11 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 8>*>(solver);
        else if (w == 11 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 9>*>(solver);
        else if (w == 11 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 10>*>(solver);
        else if (w == 12 && h == 5) delete static_cast<GameSolver::Connect4::HeuristicSolver<12, 5>*>(solver);
        else if (w == 12 && h == 6) delete static_cast<GameSolver::Connect4::HeuristicSolver<12, 6>*>(solver);
        else if (w == 12 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<12, 7>*>(solver);
        else if (w == 12 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<12, 8>*>(solver);
        else if (w == 12 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<12, 9>*>(solver);
        else if (w == 9 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver);
        else if (w == 8 && h == 8) delete static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver);
        else if (w == 10 && h == 7) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver);
        else if (w == 9 && h == 9) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver);
        else if (w == 10 && h == 10) delete static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver);
        else if (w == 9 && h == 6) delete static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver);
        else if (w == 11 && h == 4) delete static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver);
    } else {
        if (w == 6 && h == 5) delete static_cast<C4_6x5::Solver*>(solver);
        else if (w == 6 && h == 6) delete static_cast<C4_6x6::Solver*>(solver);
        else if (w == 7 && h == 6) delete static_cast<C4_7x6::Solver*>(solver);
        else if (w == 7 && h == 7) delete static_cast<C4_7x7::Solver*>(solver);
        else if (w == 8 && h == 6) delete static_cast<C4_8x6::Solver*>(solver);
        else if (w == 4 && h == 4) delete static_cast<C4_4x4::Solver*>(solver);
        else if (w == 4 && h == 5) delete static_cast<C4_4x5::Solver*>(solver);
        else if (w == 4 && h == 6) delete static_cast<C4_4x6::Solver*>(solver);
        else if (w == 4 && h == 7) delete static_cast<C4_4x7::Solver*>(solver);
        else if (w == 4 && h == 8) delete static_cast<C4_4x8::Solver*>(solver);
        else if (w == 4 && h == 9) delete static_cast<C4_4x9::Solver*>(solver);
        else if (w == 4 && h == 10) delete static_cast<C4_4x10::Solver*>(solver);
        else if (w == 4 && h == 11) delete static_cast<C4_4x11::Solver*>(solver);
        else if (w == 4 && h == 12) delete static_cast<C4_4x12::Solver*>(solver);
        else if (w == 5 && h == 4) delete static_cast<C4_5x4::Solver*>(solver);
        else if (w == 5 && h == 5) delete static_cast<C4_5x5::Solver*>(solver);
        else if (w == 5 && h == 6) delete static_cast<C4_5x6::Solver*>(solver);
        else if (w == 5 && h == 7) delete static_cast<C4_5x7::Solver*>(solver);
        else if (w == 5 && h == 8) delete static_cast<C4_5x8::Solver*>(solver);
        else if (w == 5 && h == 9) delete static_cast<C4_5x9::Solver*>(solver);
        else if (w == 5 && h == 10) delete static_cast<C4_5x10::Solver*>(solver);
        else if (w == 5 && h == 11) delete static_cast<C4_5x11::Solver*>(solver);
        else if (w == 5 && h == 12) delete static_cast<C4_5x12::Solver*>(solver);
        else if (w == 6 && h == 4) delete static_cast<C4_6x4::Solver*>(solver);
        else if (w == 6 && h == 7) delete static_cast<C4_6x7::Solver*>(solver);
        else if (w == 6 && h == 8) delete static_cast<C4_6x8::Solver*>(solver);
        else if (w == 6 && h == 9) delete static_cast<C4_6x9::Solver*>(solver);
        else if (w == 6 && h == 10) delete static_cast<C4_6x10::Solver*>(solver);
        else if (w == 6 && h == 11) delete static_cast<C4_6x11::Solver*>(solver);
        else if (w == 6 && h == 12) delete static_cast<C4_6x12::Solver*>(solver);
        else if (w == 7 && h == 4) delete static_cast<C4_7x4::Solver*>(solver);
        else if (w == 7 && h == 5) delete static_cast<C4_7x5::Solver*>(solver);
        else if (w == 7 && h == 8) delete static_cast<C4_7x8::Solver*>(solver);
        else if (w == 7 && h == 9) delete static_cast<C4_7x9::Solver*>(solver);
        else if (w == 7 && h == 10) delete static_cast<C4_7x10::Solver*>(solver);
        else if (w == 7 && h == 11) delete static_cast<C4_7x11::Solver*>(solver);
        else if (w == 7 && h == 12) delete static_cast<C4_7x12::Solver*>(solver);
        else if (w == 8 && h == 4) delete static_cast<C4_8x4::Solver*>(solver);
        else if (w == 8 && h == 5) delete static_cast<C4_8x5::Solver*>(solver);
        else if (w == 8 && h == 7) delete static_cast<C4_8x7::Solver*>(solver);
        else if (w == 8 && h == 9) delete static_cast<C4_8x9::Solver*>(solver);
        else if (w == 8 && h == 10) delete static_cast<C4_8x10::Solver*>(solver);
        else if (w == 8 && h == 11) delete static_cast<C4_8x11::Solver*>(solver);
        else if (w == 8 && h == 12) delete static_cast<C4_8x12::Solver*>(solver);
        else if (w == 9 && h == 4) delete static_cast<C4_9x4::Solver*>(solver);
        else if (w == 9 && h == 5) delete static_cast<C4_9x5::Solver*>(solver);
        else if (w == 9 && h == 8) delete static_cast<C4_9x8::Solver*>(solver);
        else if (w == 9 && h == 10) delete static_cast<C4_9x10::Solver*>(solver);
        else if (w == 9 && h == 11) delete static_cast<C4_9x11::Solver*>(solver);
        else if (w == 9 && h == 12) delete static_cast<C4_9x12::Solver*>(solver);
        else if (w == 10 && h == 4) delete static_cast<C4_10x4::Solver*>(solver);
        else if (w == 10 && h == 5) delete static_cast<C4_10x5::Solver*>(solver);
        else if (w == 10 && h == 6) delete static_cast<C4_10x6::Solver*>(solver);
        else if (w == 10 && h == 8) delete static_cast<C4_10x8::Solver*>(solver);
        else if (w == 10 && h == 9) delete static_cast<C4_10x9::Solver*>(solver);
        else if (w == 10 && h == 11) delete static_cast<C4_10x11::Solver*>(solver);
        else if (w == 11 && h == 5) delete static_cast<C4_11x5::Solver*>(solver);
        else if (w == 11 && h == 6) delete static_cast<C4_11x6::Solver*>(solver);
        else if (w == 11 && h == 7) delete static_cast<C4_11x7::Solver*>(solver);
        else if (w == 11 && h == 8) delete static_cast<C4_11x8::Solver*>(solver);
        else if (w == 11 && h == 9) delete static_cast<C4_11x9::Solver*>(solver);
        else if (w == 11 && h == 10) delete static_cast<C4_11x10::Solver*>(solver);
        else if (w == 12 && h == 4) delete static_cast<C4_12x4::Solver*>(solver);
        else if (w == 12 && h == 5) delete static_cast<C4_12x5::Solver*>(solver);
        else if (w == 12 && h == 6) delete static_cast<C4_12x6::Solver*>(solver);
        else if (w == 12 && h == 7) delete static_cast<C4_12x7::Solver*>(solver);
        else if (w == 12 && h == 8) delete static_cast<C4_12x8::Solver*>(solver);
        else if (w == 12 && h == 9) delete static_cast<C4_12x9::Solver*>(solver);
        else if (w == 8 && h == 8) delete static_cast<C4_8x8::Solver*>(solver);
        else if (w == 9 && h == 7) delete static_cast<C4_9x7::Solver*>(solver);
        else if (w == 9 && h == 6) delete static_cast<C4_9x6::Solver*>(solver);
        else if (w == 11 && h == 4) delete static_cast<C4_11x4::Solver*>(solver);
        else if (w == 7 && h == 13) delete static_cast<C4_7x13::Solver*>(solver);
        else if (w == 8 && h == 13) delete static_cast<C4_8x13::Solver*>(solver);
        else if (w == 10 && h == 10) delete static_cast<C4_10x10::Solver*>(solver);
        else if (w == 13 && h == 4) delete static_cast<C4_13x4::Solver*>(solver);
        else if (w == 13 && h == 5) delete static_cast<C4_13x5::Solver*>(solver);
        else if (w == 13 && h == 6) delete static_cast<C4_13x6::Solver*>(solver);
        else if (w == 13 && h == 7) delete static_cast<C4_13x7::Solver*>(solver);
        else if (w == 13 && h == 8) delete static_cast<C4_13x8::Solver*>(solver);
        else if (w == 9 && h == 9) delete static_cast<C4_9x9::Solver*>(solver);
    }
    return info.Env().Undefined();
}

Value CreateBook(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    std::string path = info[2].As<String>().Utf8Value();
    
    void* ptr = nullptr;
    if (w == 6 && h == 5) ptr = GameSolver::Connect4::OpeningBookBase<6, 5>::load(path, w, h).release();
    else if (w == 6 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<6, 6>::load(path, w, h).release();
    else if (w == 7 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<7, 6>::load(path, w, h).release();
    else if (w == 7 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<7, 7>::load(path, w, h).release();
    else if (w == 8 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<8, 6>::load(path, w, h).release();
    else if (w == 4 && h == 4) ptr = GameSolver::Connect4::OpeningBookBase<4, 4>::load(path, w, h).release();
    else if (w == 4 && h == 5) ptr = GameSolver::Connect4::OpeningBookBase<4, 5>::load(path, w, h).release();
    else if (w == 4 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<4, 6>::load(path, w, h).release();
    else if (w == 4 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<4, 7>::load(path, w, h).release();
    else if (w == 4 && h == 8) ptr = GameSolver::Connect4::OpeningBookBase<4, 8>::load(path, w, h).release();
    else if (w == 4 && h == 9) ptr = GameSolver::Connect4::OpeningBookBase<4, 9>::load(path, w, h).release();
    else if (w == 4 && h == 10) ptr = GameSolver::Connect4::OpeningBookBase<4, 10>::load(path, w, h).release();
    else if (w == 4 && h == 11) ptr = GameSolver::Connect4::OpeningBookBase<4, 11>::load(path, w, h).release();
    else if (w == 4 && h == 12) ptr = GameSolver::Connect4::OpeningBookBase<4, 12>::load(path, w, h).release();
    else if (w == 5 && h == 4) ptr = GameSolver::Connect4::OpeningBookBase<5, 4>::load(path, w, h).release();
    else if (w == 5 && h == 5) ptr = GameSolver::Connect4::OpeningBookBase<5, 5>::load(path, w, h).release();
    else if (w == 5 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<5, 6>::load(path, w, h).release();
    else if (w == 5 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<5, 7>::load(path, w, h).release();
    else if (w == 5 && h == 8) ptr = GameSolver::Connect4::OpeningBookBase<5, 8>::load(path, w, h).release();
    else if (w == 5 && h == 9) ptr = GameSolver::Connect4::OpeningBookBase<5, 9>::load(path, w, h).release();
    else if (w == 5 && h == 10) ptr = GameSolver::Connect4::OpeningBookBase<5, 10>::load(path, w, h).release();
    else if (w == 5 && h == 11) ptr = GameSolver::Connect4::OpeningBookBase<5, 11>::load(path, w, h).release();
    else if (w == 5 && h == 12) ptr = GameSolver::Connect4::OpeningBookBase<5, 12>::load(path, w, h).release();
    else if (w == 6 && h == 4) ptr = GameSolver::Connect4::OpeningBookBase<6, 4>::load(path, w, h).release();
    else if (w == 6 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<6, 7>::load(path, w, h).release();
    else if (w == 6 && h == 8) ptr = GameSolver::Connect4::OpeningBookBase<6, 8>::load(path, w, h).release();
    else if (w == 6 && h == 9) ptr = GameSolver::Connect4::OpeningBookBase<6, 9>::load(path, w, h).release();
    else if (w == 6 && h == 10) ptr = GameSolver::Connect4::OpeningBookBase<6, 10>::load(path, w, h).release();
    else if (w == 6 && h == 11) ptr = GameSolver::Connect4::OpeningBookBase<6, 11>::load(path, w, h).release();
    else if (w == 6 && h == 12) ptr = GameSolver::Connect4::OpeningBookBase<6, 12>::load(path, w, h).release();
    else if (w == 7 && h == 4) ptr = GameSolver::Connect4::OpeningBookBase<7, 4>::load(path, w, h).release();
    else if (w == 7 && h == 5) ptr = GameSolver::Connect4::OpeningBookBase<7, 5>::load(path, w, h).release();
    else if (w == 7 && h == 8) ptr = GameSolver::Connect4::OpeningBookBase<7, 8>::load(path, w, h).release();
    else if (w == 7 && h == 9) ptr = GameSolver::Connect4::OpeningBookBase<7, 9>::load(path, w, h).release();
    else if (w == 7 && h == 10) ptr = GameSolver::Connect4::OpeningBookBase<7, 10>::load(path, w, h).release();
    else if (w == 7 && h == 11) ptr = GameSolver::Connect4::OpeningBookBase<7, 11>::load(path, w, h).release();
    else if (w == 7 && h == 12) ptr = GameSolver::Connect4::OpeningBookBase<7, 12>::load(path, w, h).release();
    else if (w == 8 && h == 4) ptr = GameSolver::Connect4::OpeningBookBase<8, 4>::load(path, w, h).release();
    else if (w == 8 && h == 5) ptr = GameSolver::Connect4::OpeningBookBase<8, 5>::load(path, w, h).release();
    else if (w == 8 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<8, 7>::load(path, w, h).release();
    else if (w == 8 && h == 9) ptr = GameSolver::Connect4::OpeningBookBase<8, 9>::load(path, w, h).release();
    else if (w == 8 && h == 10) ptr = GameSolver::Connect4::OpeningBookBase<8, 10>::load(path, w, h).release();
    else if (w == 8 && h == 11) ptr = GameSolver::Connect4::OpeningBookBase<8, 11>::load(path, w, h).release();
    else if (w == 8 && h == 12) ptr = GameSolver::Connect4::OpeningBookBase<8, 12>::load(path, w, h).release();
    else if (w == 9 && h == 4) ptr = GameSolver::Connect4::OpeningBookBase<9, 4>::load(path, w, h).release();
    else if (w == 9 && h == 5) ptr = GameSolver::Connect4::OpeningBookBase<9, 5>::load(path, w, h).release();
    else if (w == 9 && h == 8) ptr = GameSolver::Connect4::OpeningBookBase<9, 8>::load(path, w, h).release();
    else if (w == 9 && h == 10) ptr = GameSolver::Connect4::OpeningBookBase<9, 10>::load(path, w, h).release();
    else if (w == 9 && h == 11) ptr = GameSolver::Connect4::OpeningBookBase<9, 11>::load(path, w, h).release();
    else if (w == 9 && h == 12) ptr = GameSolver::Connect4::OpeningBookBase<9, 12>::load(path, w, h).release();
    else if (w == 10 && h == 4) ptr = GameSolver::Connect4::OpeningBookBase<10, 4>::load(path, w, h).release();
    else if (w == 10 && h == 5) ptr = GameSolver::Connect4::OpeningBookBase<10, 5>::load(path, w, h).release();
    else if (w == 10 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<10, 6>::load(path, w, h).release();
    else if (w == 10 && h == 8) ptr = GameSolver::Connect4::OpeningBookBase<10, 8>::load(path, w, h).release();
    else if (w == 10 && h == 9) ptr = GameSolver::Connect4::OpeningBookBase<10, 9>::load(path, w, h).release();
    else if (w == 10 && h == 11) ptr = GameSolver::Connect4::OpeningBookBase<10, 11>::load(path, w, h).release();
    else if (w == 11 && h == 5) ptr = GameSolver::Connect4::OpeningBookBase<11, 5>::load(path, w, h).release();
    else if (w == 11 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<11, 6>::load(path, w, h).release();
    else if (w == 11 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<11, 7>::load(path, w, h).release();
    else if (w == 11 && h == 8) ptr = GameSolver::Connect4::OpeningBookBase<11, 8>::load(path, w, h).release();
    else if (w == 11 && h == 9) ptr = GameSolver::Connect4::OpeningBookBase<11, 9>::load(path, w, h).release();
    else if (w == 11 && h == 10) ptr = GameSolver::Connect4::OpeningBookBase<11, 10>::load(path, w, h).release();
    else if (w == 12 && h == 4) ptr = GameSolver::Connect4::OpeningBookBase<12, 4>::load(path, w, h).release();
    else if (w == 12 && h == 5) ptr = GameSolver::Connect4::OpeningBookBase<12, 5>::load(path, w, h).release();
    else if (w == 12 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<12, 6>::load(path, w, h).release();
    else if (w == 12 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<12, 7>::load(path, w, h).release();
    else if (w == 12 && h == 8) ptr = GameSolver::Connect4::OpeningBookBase<12, 8>::load(path, w, h).release();
    else if (w == 12 && h == 9) ptr = GameSolver::Connect4::OpeningBookBase<12, 9>::load(path, w, h).release();
    else if (w == 8 && h == 8) ptr = GameSolver::Connect4::OpeningBookBase<8, 8>::load(path, w, h).release();
    else if (w == 9 && h == 7) ptr = GameSolver::Connect4::OpeningBookBase<9, 7>::load(path, w, h).release();
    else if (w == 9 && h == 6) ptr = GameSolver::Connect4::OpeningBookBase<9, 6>::load(path, w, h).release();
    else if (w == 11 && h == 4) ptr = GameSolver::Connect4::OpeningBookBase<11, 4>::load(path, w, h).release();

    return WrapPointer(info, ptr);
}

Value DestroyBook(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* book_ptr = UnwrapPointer<void>(info[2]);
    
    if (w == 6 && h == 5) delete static_cast<GameSolver::Connect4::OpeningBookBase<6, 5>*>(book_ptr);
    else if (w == 6 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<6, 6>*>(book_ptr);
    else if (w == 7 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<7, 6>*>(book_ptr);
    else if (w == 7 && h == 7) delete static_cast<GameSolver::Connect4::OpeningBookBase<7, 7>*>(book_ptr);
    else if (w == 8 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<8, 6>*>(book_ptr);
    else if (w == 4 && h == 4) delete static_cast<GameSolver::Connect4::OpeningBookBase<4, 4>*>(book_ptr);
    else if (w == 4 && h == 5) delete static_cast<GameSolver::Connect4::OpeningBookBase<4, 5>*>(book_ptr);
    else if (w == 4 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<4, 6>*>(book_ptr);
    else if (w == 4 && h == 7) delete static_cast<GameSolver::Connect4::OpeningBookBase<4, 7>*>(book_ptr);
    else if (w == 4 && h == 8) delete static_cast<GameSolver::Connect4::OpeningBookBase<4, 8>*>(book_ptr);
    else if (w == 4 && h == 9) delete static_cast<GameSolver::Connect4::OpeningBookBase<4, 9>*>(book_ptr);
    else if (w == 4 && h == 10) delete static_cast<GameSolver::Connect4::OpeningBookBase<4, 10>*>(book_ptr);
    else if (w == 4 && h == 11) delete static_cast<GameSolver::Connect4::OpeningBookBase<4, 11>*>(book_ptr);
    else if (w == 4 && h == 12) delete static_cast<GameSolver::Connect4::OpeningBookBase<4, 12>*>(book_ptr);
    else if (w == 5 && h == 4) delete static_cast<GameSolver::Connect4::OpeningBookBase<5, 4>*>(book_ptr);
    else if (w == 5 && h == 5) delete static_cast<GameSolver::Connect4::OpeningBookBase<5, 5>*>(book_ptr);
    else if (w == 5 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<5, 6>*>(book_ptr);
    else if (w == 5 && h == 7) delete static_cast<GameSolver::Connect4::OpeningBookBase<5, 7>*>(book_ptr);
    else if (w == 5 && h == 8) delete static_cast<GameSolver::Connect4::OpeningBookBase<5, 8>*>(book_ptr);
    else if (w == 5 && h == 9) delete static_cast<GameSolver::Connect4::OpeningBookBase<5, 9>*>(book_ptr);
    else if (w == 5 && h == 10) delete static_cast<GameSolver::Connect4::OpeningBookBase<5, 10>*>(book_ptr);
    else if (w == 5 && h == 11) delete static_cast<GameSolver::Connect4::OpeningBookBase<5, 11>*>(book_ptr);
    else if (w == 5 && h == 12) delete static_cast<GameSolver::Connect4::OpeningBookBase<5, 12>*>(book_ptr);
    else if (w == 6 && h == 4) delete static_cast<GameSolver::Connect4::OpeningBookBase<6, 4>*>(book_ptr);
    else if (w == 6 && h == 7) delete static_cast<GameSolver::Connect4::OpeningBookBase<6, 7>*>(book_ptr);
    else if (w == 6 && h == 8) delete static_cast<GameSolver::Connect4::OpeningBookBase<6, 8>*>(book_ptr);
    else if (w == 6 && h == 9) delete static_cast<GameSolver::Connect4::OpeningBookBase<6, 9>*>(book_ptr);
    else if (w == 6 && h == 10) delete static_cast<GameSolver::Connect4::OpeningBookBase<6, 10>*>(book_ptr);
    else if (w == 6 && h == 11) delete static_cast<GameSolver::Connect4::OpeningBookBase<6, 11>*>(book_ptr);
    else if (w == 6 && h == 12) delete static_cast<GameSolver::Connect4::OpeningBookBase<6, 12>*>(book_ptr);
    else if (w == 7 && h == 4) delete static_cast<GameSolver::Connect4::OpeningBookBase<7, 4>*>(book_ptr);
    else if (w == 7 && h == 5) delete static_cast<GameSolver::Connect4::OpeningBookBase<7, 5>*>(book_ptr);
    else if (w == 7 && h == 8) delete static_cast<GameSolver::Connect4::OpeningBookBase<7, 8>*>(book_ptr);
    else if (w == 7 && h == 9) delete static_cast<GameSolver::Connect4::OpeningBookBase<7, 9>*>(book_ptr);
    else if (w == 7 && h == 10) delete static_cast<GameSolver::Connect4::OpeningBookBase<7, 10>*>(book_ptr);
    else if (w == 7 && h == 11) delete static_cast<GameSolver::Connect4::OpeningBookBase<7, 11>*>(book_ptr);
    else if (w == 7 && h == 12) delete static_cast<GameSolver::Connect4::OpeningBookBase<7, 12>*>(book_ptr);
    else if (w == 8 && h == 4) delete static_cast<GameSolver::Connect4::OpeningBookBase<8, 4>*>(book_ptr);
    else if (w == 8 && h == 5) delete static_cast<GameSolver::Connect4::OpeningBookBase<8, 5>*>(book_ptr);
    else if (w == 8 && h == 7) delete static_cast<GameSolver::Connect4::OpeningBookBase<8, 7>*>(book_ptr);
    else if (w == 8 && h == 9) delete static_cast<GameSolver::Connect4::OpeningBookBase<8, 9>*>(book_ptr);
    else if (w == 8 && h == 10) delete static_cast<GameSolver::Connect4::OpeningBookBase<8, 10>*>(book_ptr);
    else if (w == 8 && h == 11) delete static_cast<GameSolver::Connect4::OpeningBookBase<8, 11>*>(book_ptr);
    else if (w == 8 && h == 12) delete static_cast<GameSolver::Connect4::OpeningBookBase<8, 12>*>(book_ptr);
    else if (w == 9 && h == 4) delete static_cast<GameSolver::Connect4::OpeningBookBase<9, 4>*>(book_ptr);
    else if (w == 9 && h == 5) delete static_cast<GameSolver::Connect4::OpeningBookBase<9, 5>*>(book_ptr);
    else if (w == 9 && h == 8) delete static_cast<GameSolver::Connect4::OpeningBookBase<9, 8>*>(book_ptr);
    else if (w == 9 && h == 10) delete static_cast<GameSolver::Connect4::OpeningBookBase<9, 10>*>(book_ptr);
    else if (w == 9 && h == 11) delete static_cast<GameSolver::Connect4::OpeningBookBase<9, 11>*>(book_ptr);
    else if (w == 9 && h == 12) delete static_cast<GameSolver::Connect4::OpeningBookBase<9, 12>*>(book_ptr);
    else if (w == 10 && h == 4) delete static_cast<GameSolver::Connect4::OpeningBookBase<10, 4>*>(book_ptr);
    else if (w == 10 && h == 5) delete static_cast<GameSolver::Connect4::OpeningBookBase<10, 5>*>(book_ptr);
    else if (w == 10 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<10, 6>*>(book_ptr);
    else if (w == 10 && h == 8) delete static_cast<GameSolver::Connect4::OpeningBookBase<10, 8>*>(book_ptr);
    else if (w == 10 && h == 9) delete static_cast<GameSolver::Connect4::OpeningBookBase<10, 9>*>(book_ptr);
    else if (w == 10 && h == 11) delete static_cast<GameSolver::Connect4::OpeningBookBase<10, 11>*>(book_ptr);
    else if (w == 11 && h == 5) delete static_cast<GameSolver::Connect4::OpeningBookBase<11, 5>*>(book_ptr);
    else if (w == 11 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<11, 6>*>(book_ptr);
    else if (w == 11 && h == 7) delete static_cast<GameSolver::Connect4::OpeningBookBase<11, 7>*>(book_ptr);
    else if (w == 11 && h == 8) delete static_cast<GameSolver::Connect4::OpeningBookBase<11, 8>*>(book_ptr);
    else if (w == 11 && h == 9) delete static_cast<GameSolver::Connect4::OpeningBookBase<11, 9>*>(book_ptr);
    else if (w == 11 && h == 10) delete static_cast<GameSolver::Connect4::OpeningBookBase<11, 10>*>(book_ptr);
    else if (w == 12 && h == 4) delete static_cast<GameSolver::Connect4::OpeningBookBase<12, 4>*>(book_ptr);
    else if (w == 12 && h == 5) delete static_cast<GameSolver::Connect4::OpeningBookBase<12, 5>*>(book_ptr);
    else if (w == 12 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<12, 6>*>(book_ptr);
    else if (w == 12 && h == 7) delete static_cast<GameSolver::Connect4::OpeningBookBase<12, 7>*>(book_ptr);
    else if (w == 12 && h == 8) delete static_cast<GameSolver::Connect4::OpeningBookBase<12, 8>*>(book_ptr);
    else if (w == 12 && h == 9) delete static_cast<GameSolver::Connect4::OpeningBookBase<12, 9>*>(book_ptr);
    else if (w == 8 && h == 8) delete static_cast<GameSolver::Connect4::OpeningBookBase<8, 8>*>(book_ptr);
    else if (w == 9 && h == 7) delete static_cast<GameSolver::Connect4::OpeningBookBase<9, 7>*>(book_ptr);
    else if (w == 9 && h == 6) delete static_cast<GameSolver::Connect4::OpeningBookBase<9, 6>*>(book_ptr);
    else if (w == 11 && h == 4) delete static_cast<GameSolver::Connect4::OpeningBookBase<11, 4>*>(book_ptr);
    return info.Env().Undefined();
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
std::vector<int> runAnalysisRaw(CoreSolver& solver, const std::string& pos, bool weak, int threads, void* book_ptr, double timeout_ms) {
    CorePosition P;
    std::vector<int> result(4 + W, 0);
    
    int moves_played = P.play(pos);
    if((size_t)moves_played < pos.size()) {
        int lastColPlayed = pos[moves_played] - '1';
        bool isWin = P.isWinningMove(lastColPlayed);
        result[0] = isWin ? 1 : 2;
        result[1] = moves_played;
        if (isWin) {
            int score = -(W * H + 1 - (moves_played + 1)) / 2;
            for(int i = 0; i < W; i++) result[2 + i] = score;
        }
        return result;
    }

    result[0] = 0;
    result[1] = P.nbMoves();
    const CoreBook* book = static_cast<const CoreBook*>(book_ptr);
    std::vector<int> scores = solver.analyze(P, weak, threads, book, timeout_ms);
    for(int i = 0; i < W; i++) result[2 + i] = scores[i];
    result[2 + W] = 0; // depthReached
    result[3 + W] = solver.isAborted() ? 1 : 0;
    return result;
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename CoreBook>
std::vector<int> runSolveRaw(CoreSolver& solver, const std::string& pos, bool weak, int threads, void* book_ptr, double timeout_ms) {
    CorePosition P;
    std::vector<int> result(8, 0);
    
    int moves_played = P.play(pos);
    if((size_t)moves_played < pos.size()) {
        int lastColPlayed = pos[moves_played] - '1';
        bool isWin = P.isWinningMove(lastColPlayed);
        result[0] = isWin ? 1 : 2;
        result[1] = moves_played;
        if (isWin) {
            int score = -(W * H + 1 - (moves_played + 1)) / 2;
            result[2] = score;
        }
        return result;
    }

    result[0] = 0;
    result[1] = P.nbMoves();
    const CoreBook* book = static_cast<const CoreBook*>(book_ptr);
    auto res = solver.solve(P, weak, threads, book, timeout_ms);
    result[2] = res.score;
    result[3] = res.bestMove;
    result[4] = res.depth;
    result[5] = (int)(res.nodes & 0xFFFFFFFF);
    result[6] = (int)(res.nodes >> 32);
    result[7] = res.aborted ? 1 : 0;
    return result;
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename BookType>
std::vector<int> runSolveHeuristicRaw(CoreSolver& solver, const std::string& pos, int max_depth, int threads, double timeout_ms, void* book_ptr) {
    if (book_ptr) solver.loadBook(static_cast<BookType*>(book_ptr));
    else solver.loadBook(nullptr);
    CorePosition P;
    std::vector<int> result(8, 0);
    if(P.play(pos) != pos.size()) {
        int lastColPlayed = pos[P.nbMoves()] - '1';
        result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
        result[1] = P.nbMoves();
    } else {
        result[0] = 0;
        result[1] = P.nbMoves();
        double end_time_ms = timeout_ms > 0 ? (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count() + timeout_ms) : 0;
        auto res = solver.solve_heuristic(P, max_depth, end_time_ms, false, nullptr, threads);
        result[2] = res.score;
        result[3] = res.bestMove;
        result[4] = res.depth;
        result[5] = (int)(res.nodes & 0xFFFFFFFF);
        result[6] = (int)(res.nodes >> 32);
        result[7] = res.aborted ? 1 : 0;
    }
    return result;
}

class AnalyzeExactWorker : public Napi::AsyncWorker {
public:
    AnalyzeExactWorker(Napi::Env& env, Napi::Promise::Deferred deferred, int w, int h, void* solver, const std::string& pos, bool is_weak, int threads, void* book_ptr, double timeout_ms)
        : Napi::AsyncWorker(env), deferred(deferred), w(w), h(h), solver(solver), pos(pos), is_weak(is_weak), threads(threads), book_ptr(book_ptr), timeout_ms(timeout_ms) {}
    
    void Execute() override {
        try {
            if (w == 6 && h == 5) result_data = runAnalysisRaw<C4_6x5::Solver, GameSolver::Connect4::GenericPosition<6, 5>, 6, 5, GameSolver::Connect4::OpeningBookBase<6, 5>>(*static_cast<C4_6x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 6) result_data = runAnalysisRaw<C4_6x6::Solver, GameSolver::Connect4::GenericPosition<6, 6>, 6, 6, GameSolver::Connect4::OpeningBookBase<6, 6>>(*static_cast<C4_6x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 6) result_data = runAnalysisRaw<C4_7x6::Solver, GameSolver::Connect4::GenericPosition<7, 6>, 7, 6, GameSolver::Connect4::OpeningBookBase<7, 6>>(*static_cast<C4_7x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 7) result_data = runAnalysisRaw<C4_7x7::Solver, GameSolver::Connect4::GenericPosition<7, 7>, 7, 7, GameSolver::Connect4::OpeningBookBase<7, 7>>(*static_cast<C4_7x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 6) result_data = runAnalysisRaw<C4_8x6::Solver, GameSolver::Connect4::GenericPosition<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>::WIDTH, GameSolver::Connect4::GenericPosition<8, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 6>>(*static_cast<C4_8x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 4) result_data = runAnalysisRaw<C4_4x4::Solver, GameSolver::Connect4::GenericPosition<4, 4>, GameSolver::Connect4::GenericPosition<4, 4>::WIDTH, GameSolver::Connect4::GenericPosition<4, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 4>>(*static_cast<C4_4x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 5) result_data = runAnalysisRaw<C4_4x5::Solver, GameSolver::Connect4::GenericPosition<4, 5>, GameSolver::Connect4::GenericPosition<4, 5>::WIDTH, GameSolver::Connect4::GenericPosition<4, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 5>>(*static_cast<C4_4x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 6) result_data = runAnalysisRaw<C4_4x6::Solver, GameSolver::Connect4::GenericPosition<4, 6>, GameSolver::Connect4::GenericPosition<4, 6>::WIDTH, GameSolver::Connect4::GenericPosition<4, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 6>>(*static_cast<C4_4x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 7) result_data = runAnalysisRaw<C4_4x7::Solver, GameSolver::Connect4::GenericPosition<4, 7>, GameSolver::Connect4::GenericPosition<4, 7>::WIDTH, GameSolver::Connect4::GenericPosition<4, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 7>>(*static_cast<C4_4x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 8) result_data = runAnalysisRaw<C4_4x8::Solver, GameSolver::Connect4::GenericPosition<4, 8>, GameSolver::Connect4::GenericPosition<4, 8>::WIDTH, GameSolver::Connect4::GenericPosition<4, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 8>>(*static_cast<C4_4x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 9) result_data = runAnalysisRaw<C4_4x9::Solver, GameSolver::Connect4::GenericPosition<4, 9>, GameSolver::Connect4::GenericPosition<4, 9>::WIDTH, GameSolver::Connect4::GenericPosition<4, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 9>>(*static_cast<C4_4x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 10) result_data = runAnalysisRaw<C4_4x10::Solver, GameSolver::Connect4::GenericPosition<4, 10>, GameSolver::Connect4::GenericPosition<4, 10>::WIDTH, GameSolver::Connect4::GenericPosition<4, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 10>>(*static_cast<C4_4x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 11) result_data = runAnalysisRaw<C4_4x11::Solver, GameSolver::Connect4::GenericPosition<4, 11>, GameSolver::Connect4::GenericPosition<4, 11>::WIDTH, GameSolver::Connect4::GenericPosition<4, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 11>>(*static_cast<C4_4x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 12) result_data = runAnalysisRaw<C4_4x12::Solver, GameSolver::Connect4::GenericPosition<4, 12>, GameSolver::Connect4::GenericPosition<4, 12>::WIDTH, GameSolver::Connect4::GenericPosition<4, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 12>>(*static_cast<C4_4x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 4) result_data = runAnalysisRaw<C4_5x4::Solver, GameSolver::Connect4::GenericPosition<5, 4>, GameSolver::Connect4::GenericPosition<5, 4>::WIDTH, GameSolver::Connect4::GenericPosition<5, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 4>>(*static_cast<C4_5x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 5) result_data = runAnalysisRaw<C4_5x5::Solver, GameSolver::Connect4::GenericPosition<5, 5>, GameSolver::Connect4::GenericPosition<5, 5>::WIDTH, GameSolver::Connect4::GenericPosition<5, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 5>>(*static_cast<C4_5x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 6) result_data = runAnalysisRaw<C4_5x6::Solver, GameSolver::Connect4::GenericPosition<5, 6>, GameSolver::Connect4::GenericPosition<5, 6>::WIDTH, GameSolver::Connect4::GenericPosition<5, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 6>>(*static_cast<C4_5x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 7) result_data = runAnalysisRaw<C4_5x7::Solver, GameSolver::Connect4::GenericPosition<5, 7>, GameSolver::Connect4::GenericPosition<5, 7>::WIDTH, GameSolver::Connect4::GenericPosition<5, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 7>>(*static_cast<C4_5x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 8) result_data = runAnalysisRaw<C4_5x8::Solver, GameSolver::Connect4::GenericPosition<5, 8>, GameSolver::Connect4::GenericPosition<5, 8>::WIDTH, GameSolver::Connect4::GenericPosition<5, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 8>>(*static_cast<C4_5x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 9) result_data = runAnalysisRaw<C4_5x9::Solver, GameSolver::Connect4::GenericPosition<5, 9>, GameSolver::Connect4::GenericPosition<5, 9>::WIDTH, GameSolver::Connect4::GenericPosition<5, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 9>>(*static_cast<C4_5x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 10) result_data = runAnalysisRaw<C4_5x10::Solver, GameSolver::Connect4::GenericPosition<5, 10>, GameSolver::Connect4::GenericPosition<5, 10>::WIDTH, GameSolver::Connect4::GenericPosition<5, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 10>>(*static_cast<C4_5x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 11) result_data = runAnalysisRaw<C4_5x11::Solver, GameSolver::Connect4::GenericPosition<5, 11>, GameSolver::Connect4::GenericPosition<5, 11>::WIDTH, GameSolver::Connect4::GenericPosition<5, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 11>>(*static_cast<C4_5x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 12) result_data = runAnalysisRaw<C4_5x12::Solver, GameSolver::Connect4::GenericPosition<5, 12>, GameSolver::Connect4::GenericPosition<5, 12>::WIDTH, GameSolver::Connect4::GenericPosition<5, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 12>>(*static_cast<C4_5x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 4) result_data = runAnalysisRaw<C4_6x4::Solver, GameSolver::Connect4::GenericPosition<6, 4>, GameSolver::Connect4::GenericPosition<6, 4>::WIDTH, GameSolver::Connect4::GenericPosition<6, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 4>>(*static_cast<C4_6x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 7) result_data = runAnalysisRaw<C4_6x7::Solver, GameSolver::Connect4::GenericPosition<6, 7>, GameSolver::Connect4::GenericPosition<6, 7>::WIDTH, GameSolver::Connect4::GenericPosition<6, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 7>>(*static_cast<C4_6x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 8) result_data = runAnalysisRaw<C4_6x8::Solver, GameSolver::Connect4::GenericPosition<6, 8>, GameSolver::Connect4::GenericPosition<6, 8>::WIDTH, GameSolver::Connect4::GenericPosition<6, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 8>>(*static_cast<C4_6x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 9) result_data = runAnalysisRaw<C4_6x9::Solver, GameSolver::Connect4::GenericPosition<6, 9>, GameSolver::Connect4::GenericPosition<6, 9>::WIDTH, GameSolver::Connect4::GenericPosition<6, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 9>>(*static_cast<C4_6x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 10) result_data = runAnalysisRaw<C4_6x10::Solver, GameSolver::Connect4::GenericPosition<6, 10>, GameSolver::Connect4::GenericPosition<6, 10>::WIDTH, GameSolver::Connect4::GenericPosition<6, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 10>>(*static_cast<C4_6x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 11) result_data = runAnalysisRaw<C4_6x11::Solver, GameSolver::Connect4::GenericPosition<6, 11>, GameSolver::Connect4::GenericPosition<6, 11>::WIDTH, GameSolver::Connect4::GenericPosition<6, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 11>>(*static_cast<C4_6x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 12) result_data = runAnalysisRaw<C4_6x12::Solver, GameSolver::Connect4::GenericPosition<6, 12>, GameSolver::Connect4::GenericPosition<6, 12>::WIDTH, GameSolver::Connect4::GenericPosition<6, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 12>>(*static_cast<C4_6x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 4) result_data = runAnalysisRaw<C4_7x4::Solver, GameSolver::Connect4::GenericPosition<7, 4>, GameSolver::Connect4::GenericPosition<7, 4>::WIDTH, GameSolver::Connect4::GenericPosition<7, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 4>>(*static_cast<C4_7x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 5) result_data = runAnalysisRaw<C4_7x5::Solver, GameSolver::Connect4::GenericPosition<7, 5>, GameSolver::Connect4::GenericPosition<7, 5>::WIDTH, GameSolver::Connect4::GenericPosition<7, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 5>>(*static_cast<C4_7x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 8) result_data = runAnalysisRaw<C4_7x8::Solver, GameSolver::Connect4::GenericPosition<7, 8>, GameSolver::Connect4::GenericPosition<7, 8>::WIDTH, GameSolver::Connect4::GenericPosition<7, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 8>>(*static_cast<C4_7x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 9) result_data = runAnalysisRaw<C4_7x9::Solver, GameSolver::Connect4::GenericPosition<7, 9>, GameSolver::Connect4::GenericPosition<7, 9>::WIDTH, GameSolver::Connect4::GenericPosition<7, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 9>>(*static_cast<C4_7x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 10) result_data = runAnalysisRaw<C4_7x10::Solver, GameSolver::Connect4::GenericPosition<7, 10>, GameSolver::Connect4::GenericPosition<7, 10>::WIDTH, GameSolver::Connect4::GenericPosition<7, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 10>>(*static_cast<C4_7x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 11) result_data = runAnalysisRaw<C4_7x11::Solver, GameSolver::Connect4::GenericPosition<7, 11>, GameSolver::Connect4::GenericPosition<7, 11>::WIDTH, GameSolver::Connect4::GenericPosition<7, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 11>>(*static_cast<C4_7x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 12) result_data = runAnalysisRaw<C4_7x12::Solver, GameSolver::Connect4::GenericPosition<7, 12>, GameSolver::Connect4::GenericPosition<7, 12>::WIDTH, GameSolver::Connect4::GenericPosition<7, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 12>>(*static_cast<C4_7x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 4) result_data = runAnalysisRaw<C4_8x4::Solver, GameSolver::Connect4::GenericPosition<8, 4>, GameSolver::Connect4::GenericPosition<8, 4>::WIDTH, GameSolver::Connect4::GenericPosition<8, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 4>>(*static_cast<C4_8x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 5) result_data = runAnalysisRaw<C4_8x5::Solver, GameSolver::Connect4::GenericPosition<8, 5>, GameSolver::Connect4::GenericPosition<8, 5>::WIDTH, GameSolver::Connect4::GenericPosition<8, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 5>>(*static_cast<C4_8x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 7) result_data = runAnalysisRaw<C4_8x7::Solver, GameSolver::Connect4::GenericPosition<8, 7>, GameSolver::Connect4::GenericPosition<8, 7>::WIDTH, GameSolver::Connect4::GenericPosition<8, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 7>>(*static_cast<C4_8x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 9) result_data = runAnalysisRaw<C4_8x9::Solver, GameSolver::Connect4::GenericPosition<8, 9>, GameSolver::Connect4::GenericPosition<8, 9>::WIDTH, GameSolver::Connect4::GenericPosition<8, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 9>>(*static_cast<C4_8x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 10) result_data = runAnalysisRaw<C4_8x10::Solver, GameSolver::Connect4::GenericPosition<8, 10>, GameSolver::Connect4::GenericPosition<8, 10>::WIDTH, GameSolver::Connect4::GenericPosition<8, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 10>>(*static_cast<C4_8x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 11) result_data = runAnalysisRaw<C4_8x11::Solver, GameSolver::Connect4::GenericPosition<8, 11>, GameSolver::Connect4::GenericPosition<8, 11>::WIDTH, GameSolver::Connect4::GenericPosition<8, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 11>>(*static_cast<C4_8x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 12) result_data = runAnalysisRaw<C4_8x12::Solver, GameSolver::Connect4::GenericPosition<8, 12>, GameSolver::Connect4::GenericPosition<8, 12>::WIDTH, GameSolver::Connect4::GenericPosition<8, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 12>>(*static_cast<C4_8x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 4) result_data = runAnalysisRaw<C4_9x4::Solver, GameSolver::Connect4::GenericPosition<9, 4>, GameSolver::Connect4::GenericPosition<9, 4>::WIDTH, GameSolver::Connect4::GenericPosition<9, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 4>>(*static_cast<C4_9x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 5) result_data = runAnalysisRaw<C4_9x5::Solver, GameSolver::Connect4::GenericPosition<9, 5>, GameSolver::Connect4::GenericPosition<9, 5>::WIDTH, GameSolver::Connect4::GenericPosition<9, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 5>>(*static_cast<C4_9x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 8) result_data = runAnalysisRaw<C4_9x8::Solver, GameSolver::Connect4::GenericPosition<9, 8>, GameSolver::Connect4::GenericPosition<9, 8>::WIDTH, GameSolver::Connect4::GenericPosition<9, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 8>>(*static_cast<C4_9x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 10) result_data = runAnalysisRaw<C4_9x10::Solver, GameSolver::Connect4::GenericPosition<9, 10>, GameSolver::Connect4::GenericPosition<9, 10>::WIDTH, GameSolver::Connect4::GenericPosition<9, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 10>>(*static_cast<C4_9x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 11) result_data = runAnalysisRaw<C4_9x11::Solver, GameSolver::Connect4::GenericPosition<9, 11>, GameSolver::Connect4::GenericPosition<9, 11>::WIDTH, GameSolver::Connect4::GenericPosition<9, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 11>>(*static_cast<C4_9x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 12) result_data = runAnalysisRaw<C4_9x12::Solver, GameSolver::Connect4::GenericPosition<9, 12>, GameSolver::Connect4::GenericPosition<9, 12>::WIDTH, GameSolver::Connect4::GenericPosition<9, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 12>>(*static_cast<C4_9x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 4) result_data = runAnalysisRaw<C4_10x4::Solver, GameSolver::Connect4::GenericPosition<10, 4>, GameSolver::Connect4::GenericPosition<10, 4>::WIDTH, GameSolver::Connect4::GenericPosition<10, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 4>>(*static_cast<C4_10x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 5) result_data = runAnalysisRaw<C4_10x5::Solver, GameSolver::Connect4::GenericPosition<10, 5>, GameSolver::Connect4::GenericPosition<10, 5>::WIDTH, GameSolver::Connect4::GenericPosition<10, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 5>>(*static_cast<C4_10x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 6) result_data = runAnalysisRaw<C4_10x6::Solver, GameSolver::Connect4::GenericPosition<10, 6>, GameSolver::Connect4::GenericPosition<10, 6>::WIDTH, GameSolver::Connect4::GenericPosition<10, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 6>>(*static_cast<C4_10x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 8) result_data = runAnalysisRaw<C4_10x8::Solver, GameSolver::Connect4::GenericPosition<10, 8>, GameSolver::Connect4::GenericPosition<10, 8>::WIDTH, GameSolver::Connect4::GenericPosition<10, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 8>>(*static_cast<C4_10x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 9) result_data = runAnalysisRaw<C4_10x9::Solver, GameSolver::Connect4::GenericPosition<10, 9>, GameSolver::Connect4::GenericPosition<10, 9>::WIDTH, GameSolver::Connect4::GenericPosition<10, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 9>>(*static_cast<C4_10x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 11) result_data = runAnalysisRaw<C4_10x11::Solver, GameSolver::Connect4::GenericPosition<10, 11>, GameSolver::Connect4::GenericPosition<10, 11>::WIDTH, GameSolver::Connect4::GenericPosition<10, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 11>>(*static_cast<C4_10x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 5) result_data = runAnalysisRaw<C4_11x5::Solver, GameSolver::Connect4::GenericPosition<11, 5>, GameSolver::Connect4::GenericPosition<11, 5>::WIDTH, GameSolver::Connect4::GenericPosition<11, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 5>>(*static_cast<C4_11x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 6) result_data = runAnalysisRaw<C4_11x6::Solver, GameSolver::Connect4::GenericPosition<11, 6>, GameSolver::Connect4::GenericPosition<11, 6>::WIDTH, GameSolver::Connect4::GenericPosition<11, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 6>>(*static_cast<C4_11x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 7) result_data = runAnalysisRaw<C4_11x7::Solver, GameSolver::Connect4::GenericPosition<11, 7>, GameSolver::Connect4::GenericPosition<11, 7>::WIDTH, GameSolver::Connect4::GenericPosition<11, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 7>>(*static_cast<C4_11x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 8) result_data = runAnalysisRaw<C4_11x8::Solver, GameSolver::Connect4::GenericPosition<11, 8>, GameSolver::Connect4::GenericPosition<11, 8>::WIDTH, GameSolver::Connect4::GenericPosition<11, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 8>>(*static_cast<C4_11x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 9) result_data = runAnalysisRaw<C4_11x9::Solver, GameSolver::Connect4::GenericPosition<11, 9>, GameSolver::Connect4::GenericPosition<11, 9>::WIDTH, GameSolver::Connect4::GenericPosition<11, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 9>>(*static_cast<C4_11x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 10) result_data = runAnalysisRaw<C4_11x10::Solver, GameSolver::Connect4::GenericPosition<11, 10>, GameSolver::Connect4::GenericPosition<11, 10>::WIDTH, GameSolver::Connect4::GenericPosition<11, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 10>>(*static_cast<C4_11x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 4) result_data = runAnalysisRaw<C4_12x4::Solver, GameSolver::Connect4::GenericPosition<12, 4>, GameSolver::Connect4::GenericPosition<12, 4>::WIDTH, GameSolver::Connect4::GenericPosition<12, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 4>>(*static_cast<C4_12x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 5) result_data = runAnalysisRaw<C4_12x5::Solver, GameSolver::Connect4::GenericPosition<12, 5>, GameSolver::Connect4::GenericPosition<12, 5>::WIDTH, GameSolver::Connect4::GenericPosition<12, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 5>>(*static_cast<C4_12x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 6) result_data = runAnalysisRaw<C4_12x6::Solver, GameSolver::Connect4::GenericPosition<12, 6>, GameSolver::Connect4::GenericPosition<12, 6>::WIDTH, GameSolver::Connect4::GenericPosition<12, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 6>>(*static_cast<C4_12x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 7) result_data = runAnalysisRaw<C4_12x7::Solver, GameSolver::Connect4::GenericPosition<12, 7>, GameSolver::Connect4::GenericPosition<12, 7>::WIDTH, GameSolver::Connect4::GenericPosition<12, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 7>>(*static_cast<C4_12x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 8) result_data = runAnalysisRaw<C4_12x8::Solver, GameSolver::Connect4::GenericPosition<12, 8>, GameSolver::Connect4::GenericPosition<12, 8>::WIDTH, GameSolver::Connect4::GenericPosition<12, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 8>>(*static_cast<C4_12x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 9) result_data = runAnalysisRaw<C4_12x9::Solver, GameSolver::Connect4::GenericPosition<12, 9>, GameSolver::Connect4::GenericPosition<12, 9>::WIDTH, GameSolver::Connect4::GenericPosition<12, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 9>>(*static_cast<C4_12x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 8) result_data = runAnalysisRaw<C4_8x8::Solver, GameSolver::Connect4::GenericPosition<8, 8>, 8, 8, GameSolver::Connect4::OpeningBookBase<8, 8>>(*static_cast<C4_8x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 7) result_data = runAnalysisRaw<C4_9x7::Solver, GameSolver::Connect4::GenericPosition<9, 7>, 9, 7, GameSolver::Connect4::OpeningBookBase<9, 7>>(*static_cast<C4_9x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 6) result_data = runAnalysisRaw<C4_9x6::Solver, GameSolver::Connect4::GenericPosition<9, 6>, 9, 6, GameSolver::Connect4::OpeningBookBase<9, 6>>(*static_cast<C4_9x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 4) result_data = runAnalysisRaw<C4_11x4::Solver, GameSolver::Connect4::GenericPosition<11, 4>, 11, 4, GameSolver::Connect4::OpeningBookBase<11, 4>>(*static_cast<C4_11x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 13) result_data = runAnalysisRaw<C4_7x13::Solver, GameSolver::Connect4::GenericPosition<7, 13>, 7, 13, GameSolver::Connect4::OpeningBookBase<7, 13>>(*static_cast<C4_7x13::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 13) result_data = runAnalysisRaw<C4_8x13::Solver, GameSolver::Connect4::GenericPosition<8, 13>, 8, 13, GameSolver::Connect4::OpeningBookBase<8, 13>>(*static_cast<C4_8x13::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 10) result_data = runAnalysisRaw<C4_10x10::Solver, GameSolver::Connect4::GenericPosition<10, 10>, 10, 10, GameSolver::Connect4::OpeningBookBase<10, 10>>(*static_cast<C4_10x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 4) result_data = runAnalysisRaw<C4_13x4::Solver, GameSolver::Connect4::GenericPosition<13, 4>, 13, 4, GameSolver::Connect4::OpeningBookBase<13, 4>>(*static_cast<C4_13x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 5) result_data = runAnalysisRaw<C4_13x5::Solver, GameSolver::Connect4::GenericPosition<13, 5>, 13, 5, GameSolver::Connect4::OpeningBookBase<13, 5>>(*static_cast<C4_13x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 6) result_data = runAnalysisRaw<C4_13x6::Solver, GameSolver::Connect4::GenericPosition<13, 6>, 13, 6, GameSolver::Connect4::OpeningBookBase<13, 6>>(*static_cast<C4_13x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 7) result_data = runAnalysisRaw<C4_13x7::Solver, GameSolver::Connect4::GenericPosition<13, 7>, 13, 7, GameSolver::Connect4::OpeningBookBase<13, 7>>(*static_cast<C4_13x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 8) result_data = runAnalysisRaw<C4_13x8::Solver, GameSolver::Connect4::GenericPosition<13, 8>, 13, 8, GameSolver::Connect4::OpeningBookBase<13, 8>>(*static_cast<C4_13x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 9) result_data = runAnalysisRaw<C4_9x9::Solver, GameSolver::Connect4::GenericPosition<9, 9>, 9, 9, GameSolver::Connect4::OpeningBookBase<9, 9>>(*static_cast<C4_9x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 13) result_data = runAnalysisRaw<C4_7x13::Solver, GameSolver::Connect4::GenericPosition<7, 13>, 7, 13, GameSolver::Connect4::OpeningBookBase<7, 13>>(*static_cast<C4_7x13::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 13) result_data = runAnalysisRaw<C4_8x13::Solver, GameSolver::Connect4::GenericPosition<8, 13>, 8, 13, GameSolver::Connect4::OpeningBookBase<8, 13>>(*static_cast<C4_8x13::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 10) result_data = runAnalysisRaw<C4_10x10::Solver, GameSolver::Connect4::GenericPosition<10, 10>, 10, 10, GameSolver::Connect4::OpeningBookBase<10, 10>>(*static_cast<C4_10x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 4) result_data = runAnalysisRaw<C4_13x4::Solver, GameSolver::Connect4::GenericPosition<13, 4>, 13, 4, GameSolver::Connect4::OpeningBookBase<13, 4>>(*static_cast<C4_13x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 5) result_data = runAnalysisRaw<C4_13x5::Solver, GameSolver::Connect4::GenericPosition<13, 5>, 13, 5, GameSolver::Connect4::OpeningBookBase<13, 5>>(*static_cast<C4_13x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 6) result_data = runAnalysisRaw<C4_13x6::Solver, GameSolver::Connect4::GenericPosition<13, 6>, 13, 6, GameSolver::Connect4::OpeningBookBase<13, 6>>(*static_cast<C4_13x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 7) result_data = runAnalysisRaw<C4_13x7::Solver, GameSolver::Connect4::GenericPosition<13, 7>, 13, 7, GameSolver::Connect4::OpeningBookBase<13, 7>>(*static_cast<C4_13x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 8) result_data = runAnalysisRaw<C4_13x8::Solver, GameSolver::Connect4::GenericPosition<13, 8>, 13, 8, GameSolver::Connect4::OpeningBookBase<13, 8>>(*static_cast<C4_13x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 9) result_data = runAnalysisRaw<C4_9x9::Solver, GameSolver::Connect4::GenericPosition<9, 9>, 9, 9, GameSolver::Connect4::OpeningBookBase<9, 9>>(*static_cast<C4_9x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
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
    bool is_weak;
    int threads;
    void* book_ptr;
    double timeout_ms;
    std::vector<int> result_data;
};

class SolveExactWorker : public Napi::AsyncWorker {
public:
    SolveExactWorker(Napi::Env& env, Napi::Promise::Deferred deferred, int w, int h, void* solver, const std::string& pos, bool is_weak, int threads, void* book_ptr, double timeout_ms)
        : Napi::AsyncWorker(env), deferred(deferred), w(w), h(h), solver(solver), pos(pos), is_weak(is_weak), threads(threads), book_ptr(book_ptr), timeout_ms(timeout_ms) {}
    
    void Execute() override {
        try {
            if (w == 6 && h == 5) result_data = runSolveRaw<C4_6x5::Solver, GameSolver::Connect4::GenericPosition<6, 5>, 6, 5, GameSolver::Connect4::OpeningBookBase<6, 5>>(*static_cast<C4_6x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 6) result_data = runSolveRaw<C4_6x6::Solver, GameSolver::Connect4::GenericPosition<6, 6>, 6, 6, GameSolver::Connect4::OpeningBookBase<6, 6>>(*static_cast<C4_6x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 6) result_data = runSolveRaw<C4_7x6::Solver, GameSolver::Connect4::GenericPosition<7, 6>, 7, 6, GameSolver::Connect4::OpeningBookBase<7, 6>>(*static_cast<C4_7x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 7) result_data = runSolveRaw<C4_7x7::Solver, GameSolver::Connect4::GenericPosition<7, 7>, 7, 7, GameSolver::Connect4::OpeningBookBase<7, 7>>(*static_cast<C4_7x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 6) result_data = runSolveRaw<C4_8x6::Solver, GameSolver::Connect4::GenericPosition<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>::WIDTH, GameSolver::Connect4::GenericPosition<8, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 6>>(*static_cast<C4_8x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 4) result_data = runSolveRaw<C4_4x4::Solver, GameSolver::Connect4::GenericPosition<4, 4>, GameSolver::Connect4::GenericPosition<4, 4>::WIDTH, GameSolver::Connect4::GenericPosition<4, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 4>>(*static_cast<C4_4x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 5) result_data = runSolveRaw<C4_4x5::Solver, GameSolver::Connect4::GenericPosition<4, 5>, GameSolver::Connect4::GenericPosition<4, 5>::WIDTH, GameSolver::Connect4::GenericPosition<4, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 5>>(*static_cast<C4_4x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 6) result_data = runSolveRaw<C4_4x6::Solver, GameSolver::Connect4::GenericPosition<4, 6>, GameSolver::Connect4::GenericPosition<4, 6>::WIDTH, GameSolver::Connect4::GenericPosition<4, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 6>>(*static_cast<C4_4x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 7) result_data = runSolveRaw<C4_4x7::Solver, GameSolver::Connect4::GenericPosition<4, 7>, GameSolver::Connect4::GenericPosition<4, 7>::WIDTH, GameSolver::Connect4::GenericPosition<4, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 7>>(*static_cast<C4_4x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 8) result_data = runSolveRaw<C4_4x8::Solver, GameSolver::Connect4::GenericPosition<4, 8>, GameSolver::Connect4::GenericPosition<4, 8>::WIDTH, GameSolver::Connect4::GenericPosition<4, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 8>>(*static_cast<C4_4x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 9) result_data = runSolveRaw<C4_4x9::Solver, GameSolver::Connect4::GenericPosition<4, 9>, GameSolver::Connect4::GenericPosition<4, 9>::WIDTH, GameSolver::Connect4::GenericPosition<4, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 9>>(*static_cast<C4_4x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 10) result_data = runSolveRaw<C4_4x10::Solver, GameSolver::Connect4::GenericPosition<4, 10>, GameSolver::Connect4::GenericPosition<4, 10>::WIDTH, GameSolver::Connect4::GenericPosition<4, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 10>>(*static_cast<C4_4x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 11) result_data = runSolveRaw<C4_4x11::Solver, GameSolver::Connect4::GenericPosition<4, 11>, GameSolver::Connect4::GenericPosition<4, 11>::WIDTH, GameSolver::Connect4::GenericPosition<4, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 11>>(*static_cast<C4_4x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 4 && h == 12) result_data = runSolveRaw<C4_4x12::Solver, GameSolver::Connect4::GenericPosition<4, 12>, GameSolver::Connect4::GenericPosition<4, 12>::WIDTH, GameSolver::Connect4::GenericPosition<4, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<4, 12>>(*static_cast<C4_4x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 4) result_data = runSolveRaw<C4_5x4::Solver, GameSolver::Connect4::GenericPosition<5, 4>, GameSolver::Connect4::GenericPosition<5, 4>::WIDTH, GameSolver::Connect4::GenericPosition<5, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 4>>(*static_cast<C4_5x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 5) result_data = runSolveRaw<C4_5x5::Solver, GameSolver::Connect4::GenericPosition<5, 5>, GameSolver::Connect4::GenericPosition<5, 5>::WIDTH, GameSolver::Connect4::GenericPosition<5, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 5>>(*static_cast<C4_5x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 6) result_data = runSolveRaw<C4_5x6::Solver, GameSolver::Connect4::GenericPosition<5, 6>, GameSolver::Connect4::GenericPosition<5, 6>::WIDTH, GameSolver::Connect4::GenericPosition<5, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 6>>(*static_cast<C4_5x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 7) result_data = runSolveRaw<C4_5x7::Solver, GameSolver::Connect4::GenericPosition<5, 7>, GameSolver::Connect4::GenericPosition<5, 7>::WIDTH, GameSolver::Connect4::GenericPosition<5, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 7>>(*static_cast<C4_5x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 8) result_data = runSolveRaw<C4_5x8::Solver, GameSolver::Connect4::GenericPosition<5, 8>, GameSolver::Connect4::GenericPosition<5, 8>::WIDTH, GameSolver::Connect4::GenericPosition<5, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 8>>(*static_cast<C4_5x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 9) result_data = runSolveRaw<C4_5x9::Solver, GameSolver::Connect4::GenericPosition<5, 9>, GameSolver::Connect4::GenericPosition<5, 9>::WIDTH, GameSolver::Connect4::GenericPosition<5, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 9>>(*static_cast<C4_5x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 10) result_data = runSolveRaw<C4_5x10::Solver, GameSolver::Connect4::GenericPosition<5, 10>, GameSolver::Connect4::GenericPosition<5, 10>::WIDTH, GameSolver::Connect4::GenericPosition<5, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 10>>(*static_cast<C4_5x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 11) result_data = runSolveRaw<C4_5x11::Solver, GameSolver::Connect4::GenericPosition<5, 11>, GameSolver::Connect4::GenericPosition<5, 11>::WIDTH, GameSolver::Connect4::GenericPosition<5, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 11>>(*static_cast<C4_5x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 5 && h == 12) result_data = runSolveRaw<C4_5x12::Solver, GameSolver::Connect4::GenericPosition<5, 12>, GameSolver::Connect4::GenericPosition<5, 12>::WIDTH, GameSolver::Connect4::GenericPosition<5, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<5, 12>>(*static_cast<C4_5x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 4) result_data = runSolveRaw<C4_6x4::Solver, GameSolver::Connect4::GenericPosition<6, 4>, GameSolver::Connect4::GenericPosition<6, 4>::WIDTH, GameSolver::Connect4::GenericPosition<6, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 4>>(*static_cast<C4_6x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 7) result_data = runSolveRaw<C4_6x7::Solver, GameSolver::Connect4::GenericPosition<6, 7>, GameSolver::Connect4::GenericPosition<6, 7>::WIDTH, GameSolver::Connect4::GenericPosition<6, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 7>>(*static_cast<C4_6x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 8) result_data = runSolveRaw<C4_6x8::Solver, GameSolver::Connect4::GenericPosition<6, 8>, GameSolver::Connect4::GenericPosition<6, 8>::WIDTH, GameSolver::Connect4::GenericPosition<6, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 8>>(*static_cast<C4_6x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 9) result_data = runSolveRaw<C4_6x9::Solver, GameSolver::Connect4::GenericPosition<6, 9>, GameSolver::Connect4::GenericPosition<6, 9>::WIDTH, GameSolver::Connect4::GenericPosition<6, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 9>>(*static_cast<C4_6x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 10) result_data = runSolveRaw<C4_6x10::Solver, GameSolver::Connect4::GenericPosition<6, 10>, GameSolver::Connect4::GenericPosition<6, 10>::WIDTH, GameSolver::Connect4::GenericPosition<6, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 10>>(*static_cast<C4_6x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 11) result_data = runSolveRaw<C4_6x11::Solver, GameSolver::Connect4::GenericPosition<6, 11>, GameSolver::Connect4::GenericPosition<6, 11>::WIDTH, GameSolver::Connect4::GenericPosition<6, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 11>>(*static_cast<C4_6x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 6 && h == 12) result_data = runSolveRaw<C4_6x12::Solver, GameSolver::Connect4::GenericPosition<6, 12>, GameSolver::Connect4::GenericPosition<6, 12>::WIDTH, GameSolver::Connect4::GenericPosition<6, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<6, 12>>(*static_cast<C4_6x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 4) result_data = runSolveRaw<C4_7x4::Solver, GameSolver::Connect4::GenericPosition<7, 4>, GameSolver::Connect4::GenericPosition<7, 4>::WIDTH, GameSolver::Connect4::GenericPosition<7, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 4>>(*static_cast<C4_7x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 5) result_data = runSolveRaw<C4_7x5::Solver, GameSolver::Connect4::GenericPosition<7, 5>, GameSolver::Connect4::GenericPosition<7, 5>::WIDTH, GameSolver::Connect4::GenericPosition<7, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 5>>(*static_cast<C4_7x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 8) result_data = runSolveRaw<C4_7x8::Solver, GameSolver::Connect4::GenericPosition<7, 8>, GameSolver::Connect4::GenericPosition<7, 8>::WIDTH, GameSolver::Connect4::GenericPosition<7, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 8>>(*static_cast<C4_7x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 9) result_data = runSolveRaw<C4_7x9::Solver, GameSolver::Connect4::GenericPosition<7, 9>, GameSolver::Connect4::GenericPosition<7, 9>::WIDTH, GameSolver::Connect4::GenericPosition<7, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 9>>(*static_cast<C4_7x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 10) result_data = runSolveRaw<C4_7x10::Solver, GameSolver::Connect4::GenericPosition<7, 10>, GameSolver::Connect4::GenericPosition<7, 10>::WIDTH, GameSolver::Connect4::GenericPosition<7, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 10>>(*static_cast<C4_7x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 11) result_data = runSolveRaw<C4_7x11::Solver, GameSolver::Connect4::GenericPosition<7, 11>, GameSolver::Connect4::GenericPosition<7, 11>::WIDTH, GameSolver::Connect4::GenericPosition<7, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 11>>(*static_cast<C4_7x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 12) result_data = runSolveRaw<C4_7x12::Solver, GameSolver::Connect4::GenericPosition<7, 12>, GameSolver::Connect4::GenericPosition<7, 12>::WIDTH, GameSolver::Connect4::GenericPosition<7, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<7, 12>>(*static_cast<C4_7x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 4) result_data = runSolveRaw<C4_8x4::Solver, GameSolver::Connect4::GenericPosition<8, 4>, GameSolver::Connect4::GenericPosition<8, 4>::WIDTH, GameSolver::Connect4::GenericPosition<8, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 4>>(*static_cast<C4_8x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 5) result_data = runSolveRaw<C4_8x5::Solver, GameSolver::Connect4::GenericPosition<8, 5>, GameSolver::Connect4::GenericPosition<8, 5>::WIDTH, GameSolver::Connect4::GenericPosition<8, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 5>>(*static_cast<C4_8x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 7) result_data = runSolveRaw<C4_8x7::Solver, GameSolver::Connect4::GenericPosition<8, 7>, GameSolver::Connect4::GenericPosition<8, 7>::WIDTH, GameSolver::Connect4::GenericPosition<8, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 7>>(*static_cast<C4_8x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 9) result_data = runSolveRaw<C4_8x9::Solver, GameSolver::Connect4::GenericPosition<8, 9>, GameSolver::Connect4::GenericPosition<8, 9>::WIDTH, GameSolver::Connect4::GenericPosition<8, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 9>>(*static_cast<C4_8x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 10) result_data = runSolveRaw<C4_8x10::Solver, GameSolver::Connect4::GenericPosition<8, 10>, GameSolver::Connect4::GenericPosition<8, 10>::WIDTH, GameSolver::Connect4::GenericPosition<8, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 10>>(*static_cast<C4_8x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 11) result_data = runSolveRaw<C4_8x11::Solver, GameSolver::Connect4::GenericPosition<8, 11>, GameSolver::Connect4::GenericPosition<8, 11>::WIDTH, GameSolver::Connect4::GenericPosition<8, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 11>>(*static_cast<C4_8x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 12) result_data = runSolveRaw<C4_8x12::Solver, GameSolver::Connect4::GenericPosition<8, 12>, GameSolver::Connect4::GenericPosition<8, 12>::WIDTH, GameSolver::Connect4::GenericPosition<8, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<8, 12>>(*static_cast<C4_8x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 4) result_data = runSolveRaw<C4_9x4::Solver, GameSolver::Connect4::GenericPosition<9, 4>, GameSolver::Connect4::GenericPosition<9, 4>::WIDTH, GameSolver::Connect4::GenericPosition<9, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 4>>(*static_cast<C4_9x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 5) result_data = runSolveRaw<C4_9x5::Solver, GameSolver::Connect4::GenericPosition<9, 5>, GameSolver::Connect4::GenericPosition<9, 5>::WIDTH, GameSolver::Connect4::GenericPosition<9, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 5>>(*static_cast<C4_9x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 8) result_data = runSolveRaw<C4_9x8::Solver, GameSolver::Connect4::GenericPosition<9, 8>, GameSolver::Connect4::GenericPosition<9, 8>::WIDTH, GameSolver::Connect4::GenericPosition<9, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 8>>(*static_cast<C4_9x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 10) result_data = runSolveRaw<C4_9x10::Solver, GameSolver::Connect4::GenericPosition<9, 10>, GameSolver::Connect4::GenericPosition<9, 10>::WIDTH, GameSolver::Connect4::GenericPosition<9, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 10>>(*static_cast<C4_9x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 11) result_data = runSolveRaw<C4_9x11::Solver, GameSolver::Connect4::GenericPosition<9, 11>, GameSolver::Connect4::GenericPosition<9, 11>::WIDTH, GameSolver::Connect4::GenericPosition<9, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 11>>(*static_cast<C4_9x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 12) result_data = runSolveRaw<C4_9x12::Solver, GameSolver::Connect4::GenericPosition<9, 12>, GameSolver::Connect4::GenericPosition<9, 12>::WIDTH, GameSolver::Connect4::GenericPosition<9, 12>::HEIGHT, GameSolver::Connect4::OpeningBookBase<9, 12>>(*static_cast<C4_9x12::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 4) result_data = runSolveRaw<C4_10x4::Solver, GameSolver::Connect4::GenericPosition<10, 4>, GameSolver::Connect4::GenericPosition<10, 4>::WIDTH, GameSolver::Connect4::GenericPosition<10, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 4>>(*static_cast<C4_10x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 5) result_data = runSolveRaw<C4_10x5::Solver, GameSolver::Connect4::GenericPosition<10, 5>, GameSolver::Connect4::GenericPosition<10, 5>::WIDTH, GameSolver::Connect4::GenericPosition<10, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 5>>(*static_cast<C4_10x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 6) result_data = runSolveRaw<C4_10x6::Solver, GameSolver::Connect4::GenericPosition<10, 6>, GameSolver::Connect4::GenericPosition<10, 6>::WIDTH, GameSolver::Connect4::GenericPosition<10, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 6>>(*static_cast<C4_10x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 8) result_data = runSolveRaw<C4_10x8::Solver, GameSolver::Connect4::GenericPosition<10, 8>, GameSolver::Connect4::GenericPosition<10, 8>::WIDTH, GameSolver::Connect4::GenericPosition<10, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 8>>(*static_cast<C4_10x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 9) result_data = runSolveRaw<C4_10x9::Solver, GameSolver::Connect4::GenericPosition<10, 9>, GameSolver::Connect4::GenericPosition<10, 9>::WIDTH, GameSolver::Connect4::GenericPosition<10, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 9>>(*static_cast<C4_10x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 11) result_data = runSolveRaw<C4_10x11::Solver, GameSolver::Connect4::GenericPosition<10, 11>, GameSolver::Connect4::GenericPosition<10, 11>::WIDTH, GameSolver::Connect4::GenericPosition<10, 11>::HEIGHT, GameSolver::Connect4::OpeningBookBase<10, 11>>(*static_cast<C4_10x11::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 5) result_data = runSolveRaw<C4_11x5::Solver, GameSolver::Connect4::GenericPosition<11, 5>, GameSolver::Connect4::GenericPosition<11, 5>::WIDTH, GameSolver::Connect4::GenericPosition<11, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 5>>(*static_cast<C4_11x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 6) result_data = runSolveRaw<C4_11x6::Solver, GameSolver::Connect4::GenericPosition<11, 6>, GameSolver::Connect4::GenericPosition<11, 6>::WIDTH, GameSolver::Connect4::GenericPosition<11, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 6>>(*static_cast<C4_11x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 7) result_data = runSolveRaw<C4_11x7::Solver, GameSolver::Connect4::GenericPosition<11, 7>, GameSolver::Connect4::GenericPosition<11, 7>::WIDTH, GameSolver::Connect4::GenericPosition<11, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 7>>(*static_cast<C4_11x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 8) result_data = runSolveRaw<C4_11x8::Solver, GameSolver::Connect4::GenericPosition<11, 8>, GameSolver::Connect4::GenericPosition<11, 8>::WIDTH, GameSolver::Connect4::GenericPosition<11, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 8>>(*static_cast<C4_11x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 9) result_data = runSolveRaw<C4_11x9::Solver, GameSolver::Connect4::GenericPosition<11, 9>, GameSolver::Connect4::GenericPosition<11, 9>::WIDTH, GameSolver::Connect4::GenericPosition<11, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 9>>(*static_cast<C4_11x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 10) result_data = runSolveRaw<C4_11x10::Solver, GameSolver::Connect4::GenericPosition<11, 10>, GameSolver::Connect4::GenericPosition<11, 10>::WIDTH, GameSolver::Connect4::GenericPosition<11, 10>::HEIGHT, GameSolver::Connect4::OpeningBookBase<11, 10>>(*static_cast<C4_11x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 4) result_data = runSolveRaw<C4_12x4::Solver, GameSolver::Connect4::GenericPosition<12, 4>, GameSolver::Connect4::GenericPosition<12, 4>::WIDTH, GameSolver::Connect4::GenericPosition<12, 4>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 4>>(*static_cast<C4_12x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 5) result_data = runSolveRaw<C4_12x5::Solver, GameSolver::Connect4::GenericPosition<12, 5>, GameSolver::Connect4::GenericPosition<12, 5>::WIDTH, GameSolver::Connect4::GenericPosition<12, 5>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 5>>(*static_cast<C4_12x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 6) result_data = runSolveRaw<C4_12x6::Solver, GameSolver::Connect4::GenericPosition<12, 6>, GameSolver::Connect4::GenericPosition<12, 6>::WIDTH, GameSolver::Connect4::GenericPosition<12, 6>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 6>>(*static_cast<C4_12x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 7) result_data = runSolveRaw<C4_12x7::Solver, GameSolver::Connect4::GenericPosition<12, 7>, GameSolver::Connect4::GenericPosition<12, 7>::WIDTH, GameSolver::Connect4::GenericPosition<12, 7>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 7>>(*static_cast<C4_12x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 8) result_data = runSolveRaw<C4_12x8::Solver, GameSolver::Connect4::GenericPosition<12, 8>, GameSolver::Connect4::GenericPosition<12, 8>::WIDTH, GameSolver::Connect4::GenericPosition<12, 8>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 8>>(*static_cast<C4_12x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 12 && h == 9) result_data = runSolveRaw<C4_12x9::Solver, GameSolver::Connect4::GenericPosition<12, 9>, GameSolver::Connect4::GenericPosition<12, 9>::WIDTH, GameSolver::Connect4::GenericPosition<12, 9>::HEIGHT, GameSolver::Connect4::OpeningBookBase<12, 9>>(*static_cast<C4_12x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 8) result_data = runSolveRaw<C4_8x8::Solver, GameSolver::Connect4::GenericPosition<8, 8>, 8, 8, GameSolver::Connect4::OpeningBookBase<8, 8>>(*static_cast<C4_8x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 7) result_data = runSolveRaw<C4_9x7::Solver, GameSolver::Connect4::GenericPosition<9, 7>, 9, 7, GameSolver::Connect4::OpeningBookBase<9, 7>>(*static_cast<C4_9x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 6) result_data = runSolveRaw<C4_9x6::Solver, GameSolver::Connect4::GenericPosition<9, 6>, 9, 6, GameSolver::Connect4::OpeningBookBase<9, 6>>(*static_cast<C4_9x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 11 && h == 4) result_data = runSolveRaw<C4_11x4::Solver, GameSolver::Connect4::GenericPosition<11, 4>, 11, 4, GameSolver::Connect4::OpeningBookBase<11, 4>>(*static_cast<C4_11x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 13) result_data = runSolveRaw<C4_7x13::Solver, GameSolver::Connect4::GenericPosition<7, 13>, 7, 13, GameSolver::Connect4::OpeningBookBase<7, 13>>(*static_cast<C4_7x13::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 13) result_data = runSolveRaw<C4_8x13::Solver, GameSolver::Connect4::GenericPosition<8, 13>, 8, 13, GameSolver::Connect4::OpeningBookBase<8, 13>>(*static_cast<C4_8x13::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 10) result_data = runSolveRaw<C4_10x10::Solver, GameSolver::Connect4::GenericPosition<10, 10>, 10, 10, GameSolver::Connect4::OpeningBookBase<10, 10>>(*static_cast<C4_10x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 4) result_data = runSolveRaw<C4_13x4::Solver, GameSolver::Connect4::GenericPosition<13, 4>, 13, 4, GameSolver::Connect4::OpeningBookBase<13, 4>>(*static_cast<C4_13x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 5) result_data = runSolveRaw<C4_13x5::Solver, GameSolver::Connect4::GenericPosition<13, 5>, 13, 5, GameSolver::Connect4::OpeningBookBase<13, 5>>(*static_cast<C4_13x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 6) result_data = runSolveRaw<C4_13x6::Solver, GameSolver::Connect4::GenericPosition<13, 6>, 13, 6, GameSolver::Connect4::OpeningBookBase<13, 6>>(*static_cast<C4_13x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 7) result_data = runSolveRaw<C4_13x7::Solver, GameSolver::Connect4::GenericPosition<13, 7>, 13, 7, GameSolver::Connect4::OpeningBookBase<13, 7>>(*static_cast<C4_13x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 8) result_data = runSolveRaw<C4_13x8::Solver, GameSolver::Connect4::GenericPosition<13, 8>, 13, 8, GameSolver::Connect4::OpeningBookBase<13, 8>>(*static_cast<C4_13x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 9) result_data = runSolveRaw<C4_9x9::Solver, GameSolver::Connect4::GenericPosition<9, 9>, 9, 9, GameSolver::Connect4::OpeningBookBase<9, 9>>(*static_cast<C4_9x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 7 && h == 13) result_data = runSolveRaw<C4_7x13::Solver, GameSolver::Connect4::GenericPosition<7, 13>, 7, 13, GameSolver::Connect4::OpeningBookBase<7, 13>>(*static_cast<C4_7x13::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 8 && h == 13) result_data = runSolveRaw<C4_8x13::Solver, GameSolver::Connect4::GenericPosition<8, 13>, 8, 13, GameSolver::Connect4::OpeningBookBase<8, 13>>(*static_cast<C4_8x13::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 10 && h == 10) result_data = runSolveRaw<C4_10x10::Solver, GameSolver::Connect4::GenericPosition<10, 10>, 10, 10, GameSolver::Connect4::OpeningBookBase<10, 10>>(*static_cast<C4_10x10::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 4) result_data = runSolveRaw<C4_13x4::Solver, GameSolver::Connect4::GenericPosition<13, 4>, 13, 4, GameSolver::Connect4::OpeningBookBase<13, 4>>(*static_cast<C4_13x4::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 5) result_data = runSolveRaw<C4_13x5::Solver, GameSolver::Connect4::GenericPosition<13, 5>, 13, 5, GameSolver::Connect4::OpeningBookBase<13, 5>>(*static_cast<C4_13x5::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 6) result_data = runSolveRaw<C4_13x6::Solver, GameSolver::Connect4::GenericPosition<13, 6>, 13, 6, GameSolver::Connect4::OpeningBookBase<13, 6>>(*static_cast<C4_13x6::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 7) result_data = runSolveRaw<C4_13x7::Solver, GameSolver::Connect4::GenericPosition<13, 7>, 13, 7, GameSolver::Connect4::OpeningBookBase<13, 7>>(*static_cast<C4_13x7::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 13 && h == 8) result_data = runSolveRaw<C4_13x8::Solver, GameSolver::Connect4::GenericPosition<13, 8>, 13, 8, GameSolver::Connect4::OpeningBookBase<13, 8>>(*static_cast<C4_13x8::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else if (w == 9 && h == 9) result_data = runSolveRaw<C4_9x9::Solver, GameSolver::Connect4::GenericPosition<9, 9>, 9, 9, GameSolver::Connect4::OpeningBookBase<9, 9>>(*static_cast<C4_9x9::Solver*>(solver), pos, is_weak, threads, book_ptr, timeout_ms);
            else SetError("Unsupported board size for SolveExact");
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
    bool is_weak;
    int threads;
    void* book_ptr;
    double timeout_ms;
    std::vector<int> result_data;
};

Value SolveExact(const CallbackInfo& info) {
    Env env = info.Env();
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* solver = UnwrapPointer<void>(info[2]);
    std::string pos = info[3].As<String>().Utf8Value();
    bool weak = info[4].As<Boolean>().Value();
    int threads = info[5].As<Number>().Int32Value();
    void* book_ptr = UnwrapPointer<void>(info[6]);
    double timeout_ms = info[7].As<Number>().DoubleValue();

    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
    SolveExactWorker* worker = new SolveExactWorker(env, deferred, w, h, solver, pos, weak, threads, book_ptr, timeout_ms);
    worker->Queue();
    return deferred.Promise();
}

Value AnalyzeExact(const CallbackInfo& info) {
    Env env = info.Env();
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* solver = UnwrapPointer<void>(info[2]);
    std::string pos = info[3].As<String>().Utf8Value();
    bool weak = info[4].As<Boolean>().Value();
    int threads = info[5].As<Number>().Int32Value();
    void* book_ptr = UnwrapPointer<void>(info[6]);

    
    

    double timeout_ms = info[7].As<Number>().DoubleValue();
    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
    AnalyzeExactWorker* worker = new AnalyzeExactWorker(env, deferred, w, h, solver, pos, weak, threads, book_ptr, timeout_ms);
    worker->Queue();
    
    return deferred.Promise();
}

template <typename CoreSolver, typename CorePosition, int W, int H, typename BookType>
std::vector<int> runHeuristicAnalysisRaw(CoreSolver& solver, const std::string& pos, int max_depth, int threads, double timeout_ms, void* book_ptr) {
    if (book_ptr) solver.loadBook(static_cast<BookType*>(book_ptr));
    else solver.loadBook(nullptr);
    CorePosition P;
    std::vector<int> result(4 + W, 0);
    
    if(P.play(pos) != pos.size()) {
        int lastColPlayed = pos[P.nbMoves()] - '1';
        result[0] = P.isWinningMove(lastColPlayed) ? 1 : 2;
        result[1] = P.nbMoves();
    } else {
        result[0] = 0;
        result[1] = P.nbMoves();
        double end_time_ms = timeout_ms > 0 ? (std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count() + timeout_ms) : 0;
        auto res = solver.analyze_heuristic(P, max_depth, threads, end_time_ms);
        std::vector<int> scores = res.first;
        for(int i = 0; i < W; i++) result[2 + i] = scores[i];
        result[2 + W] = res.second;
        result[3 + W] = solver.isAborted() ? 1 : 0;
    }
    return result;
}

class AnalyzeHeuristicWorker : public Napi::AsyncWorker {
public:
    AnalyzeHeuristicWorker(Napi::Env& env, Napi::Promise::Deferred deferred, int w, int h, void* solver, const std::string& pos, int threads, int max_depth, double timeout_ms, void* book_ptr)
        : Napi::AsyncWorker(env), deferred(deferred), w(w), h(h), solver(solver), pos(pos), threads(threads), max_depth(max_depth), timeout_ms(timeout_ms), book_ptr(book_ptr) {}
    
    void Execute() override { double timeout_ms = this->timeout_ms;
        try {
            if (w == 6 && h == 5) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6, 5, GameSolver::Connect4::OpeningBookBase<6, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 6) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6, 6, GameSolver::Connect4::OpeningBookBase<6, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 6) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7, 6, GameSolver::Connect4::OpeningBookBase<7, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 7) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7, 7, GameSolver::Connect4::OpeningBookBase<7, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 6) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8, 6, GameSolver::Connect4::OpeningBookBase<8, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 7) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<6, 7>, GameSolver::Connect4::GenericPosition<6, 7>, 6, 7, GameSolver::Connect4::OpeningBookBase<6, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 8) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<6, 8>, GameSolver::Connect4::GenericPosition<6, 8>, 6, 8, GameSolver::Connect4::OpeningBookBase<6, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 9) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<6, 9>, GameSolver::Connect4::GenericPosition<6, 9>, 6, 9, GameSolver::Connect4::OpeningBookBase<6, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 10) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<6, 10>, GameSolver::Connect4::GenericPosition<6, 10>, 6, 10, GameSolver::Connect4::OpeningBookBase<6, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 11) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<6, 11>, GameSolver::Connect4::GenericPosition<6, 11>, 6, 11, GameSolver::Connect4::OpeningBookBase<6, 11>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 11>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 12) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<6, 12>, GameSolver::Connect4::GenericPosition<6, 12>, 6, 12, GameSolver::Connect4::OpeningBookBase<6, 12>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 12>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 5) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<7, 5>, GameSolver::Connect4::GenericPosition<7, 5>, 7, 5, GameSolver::Connect4::OpeningBookBase<7, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 8) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<7, 8>, GameSolver::Connect4::GenericPosition<7, 8>, 7, 8, GameSolver::Connect4::OpeningBookBase<7, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 9) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<7, 9>, GameSolver::Connect4::GenericPosition<7, 9>, 7, 9, GameSolver::Connect4::OpeningBookBase<7, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 10) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<7, 10>, GameSolver::Connect4::GenericPosition<7, 10>, 7, 10, GameSolver::Connect4::OpeningBookBase<7, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 11) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<7, 11>, GameSolver::Connect4::GenericPosition<7, 11>, 7, 11, GameSolver::Connect4::OpeningBookBase<7, 11>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 11>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 12) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<7, 12>, GameSolver::Connect4::GenericPosition<7, 12>, 7, 12, GameSolver::Connect4::OpeningBookBase<7, 12>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 12>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 5) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<8, 5>, GameSolver::Connect4::GenericPosition<8, 5>, 8, 5, GameSolver::Connect4::OpeningBookBase<8, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 7) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<8, 7>, GameSolver::Connect4::GenericPosition<8, 7>, 8, 7, GameSolver::Connect4::OpeningBookBase<8, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 9) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<8, 9>, GameSolver::Connect4::GenericPosition<8, 9>, 8, 9, GameSolver::Connect4::OpeningBookBase<8, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 10) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<8, 10>, GameSolver::Connect4::GenericPosition<8, 10>, 8, 10, GameSolver::Connect4::OpeningBookBase<8, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 11) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<8, 11>, GameSolver::Connect4::GenericPosition<8, 11>, 8, 11, GameSolver::Connect4::OpeningBookBase<8, 11>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 11>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 12) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<8, 12>, GameSolver::Connect4::GenericPosition<8, 12>, 8, 12, GameSolver::Connect4::OpeningBookBase<8, 12>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 12>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 5) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<9, 5>, GameSolver::Connect4::GenericPosition<9, 5>, 9, 5, GameSolver::Connect4::OpeningBookBase<9, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 8) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<9, 8>, GameSolver::Connect4::GenericPosition<9, 8>, 9, 8, GameSolver::Connect4::OpeningBookBase<9, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 10) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<9, 10>, GameSolver::Connect4::GenericPosition<9, 10>, 9, 10, GameSolver::Connect4::OpeningBookBase<9, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 11) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<9, 11>, GameSolver::Connect4::GenericPosition<9, 11>, 9, 11, GameSolver::Connect4::OpeningBookBase<9, 11>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 11>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 12) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<9, 12>, GameSolver::Connect4::GenericPosition<9, 12>, 9, 12, GameSolver::Connect4::OpeningBookBase<9, 12>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 12>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 5) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<10, 5>, GameSolver::Connect4::GenericPosition<10, 5>, 10, 5, GameSolver::Connect4::OpeningBookBase<10, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 6) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<10, 6>, GameSolver::Connect4::GenericPosition<10, 6>, 10, 6, GameSolver::Connect4::OpeningBookBase<10, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 8) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<10, 8>, GameSolver::Connect4::GenericPosition<10, 8>, 10, 8, GameSolver::Connect4::OpeningBookBase<10, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 9) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<10, 9>, GameSolver::Connect4::GenericPosition<10, 9>, 10, 9, GameSolver::Connect4::OpeningBookBase<10, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 11) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<10, 11>, GameSolver::Connect4::GenericPosition<10, 11>, 10, 11, GameSolver::Connect4::OpeningBookBase<10, 11>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 11>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 5) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<11, 5>, GameSolver::Connect4::GenericPosition<11, 5>, 11, 5, GameSolver::Connect4::OpeningBookBase<11, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 6) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<11, 6>, GameSolver::Connect4::GenericPosition<11, 6>, 11, 6, GameSolver::Connect4::OpeningBookBase<11, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 7) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<11, 7>, GameSolver::Connect4::GenericPosition<11, 7>, 11, 7, GameSolver::Connect4::OpeningBookBase<11, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 8) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<11, 8>, GameSolver::Connect4::GenericPosition<11, 8>, 11, 8, GameSolver::Connect4::OpeningBookBase<11, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 9) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<11, 9>, GameSolver::Connect4::GenericPosition<11, 9>, 11, 9, GameSolver::Connect4::OpeningBookBase<11, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 10) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<11, 10>, GameSolver::Connect4::GenericPosition<11, 10>, 11, 10, GameSolver::Connect4::OpeningBookBase<11, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 12 && h == 5) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<12, 5>, GameSolver::Connect4::GenericPosition<12, 5>, 12, 5, GameSolver::Connect4::OpeningBookBase<12, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 12 && h == 6) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<12, 6>, GameSolver::Connect4::GenericPosition<12, 6>, 12, 6, GameSolver::Connect4::OpeningBookBase<12, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 12 && h == 7) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<12, 7>, GameSolver::Connect4::GenericPosition<12, 7>, 12, 7, GameSolver::Connect4::OpeningBookBase<12, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 12 && h == 8) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<12, 8>, GameSolver::Connect4::GenericPosition<12, 8>, 12, 8, GameSolver::Connect4::OpeningBookBase<12, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 12 && h == 9) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<12, 9>, GameSolver::Connect4::GenericPosition<12, 9>, 12, 9, GameSolver::Connect4::OpeningBookBase<12, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 7) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9, 7, GameSolver::Connect4::OpeningBookBase<9, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 8) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8, 8, GameSolver::Connect4::OpeningBookBase<8, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 7) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10, 7, GameSolver::Connect4::OpeningBookBase<10, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 9) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9, 9, GameSolver::Connect4::OpeningBookBase<9, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 10) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10, 10, GameSolver::Connect4::OpeningBookBase<10, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 6) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<9, 6>, GameSolver::Connect4::GenericPosition<9, 6>, 9, 6, GameSolver::Connect4::OpeningBookBase<9, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 4) result_data = runHeuristicAnalysisRaw<GameSolver::Connect4::HeuristicSolver<11, 4>, GameSolver::Connect4::GenericPosition<11, 4>, 11, 4, GameSolver::Connect4::OpeningBookBase<11, 4>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
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
    void* book_ptr;
    std::vector<int> result_data;
};

class SolveHeuristicWorker : public Napi::AsyncWorker {
public:
    SolveHeuristicWorker(Napi::Env& env, Napi::Promise::Deferred deferred, int w, int h, void* solver, const std::string& pos, int threads, int max_depth, double timeout_ms, void* book_ptr)
        : Napi::AsyncWorker(env), deferred(deferred), w(w), h(h), solver(solver), pos(pos), threads(threads), max_depth(max_depth), timeout_ms(timeout_ms), book_ptr(book_ptr) {}
    
    void Execute() override { double timeout_ms = this->timeout_ms;
        try {
            if (w == 6 && h == 5) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<6, 5>, GameSolver::Connect4::GenericPosition<6, 5>, 6, 5, GameSolver::Connect4::OpeningBookBase<6, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 6) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<6, 6>, GameSolver::Connect4::GenericPosition<6, 6>, 6, 6, GameSolver::Connect4::OpeningBookBase<6, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 6) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<7, 6>, GameSolver::Connect4::GenericPosition<7, 6>, 7, 6, GameSolver::Connect4::OpeningBookBase<7, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 7) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<7, 7>, GameSolver::Connect4::GenericPosition<7, 7>, 7, 7, GameSolver::Connect4::OpeningBookBase<7, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 6) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<8, 6>, GameSolver::Connect4::GenericPosition<8, 6>, 8, 6, GameSolver::Connect4::OpeningBookBase<8, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 7) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<6, 7>, GameSolver::Connect4::GenericPosition<6, 7>, 6, 7, GameSolver::Connect4::OpeningBookBase<6, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 8) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<6, 8>, GameSolver::Connect4::GenericPosition<6, 8>, 6, 8, GameSolver::Connect4::OpeningBookBase<6, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 9) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<6, 9>, GameSolver::Connect4::GenericPosition<6, 9>, 6, 9, GameSolver::Connect4::OpeningBookBase<6, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 10) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<6, 10>, GameSolver::Connect4::GenericPosition<6, 10>, 6, 10, GameSolver::Connect4::OpeningBookBase<6, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 11) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<6, 11>, GameSolver::Connect4::GenericPosition<6, 11>, 6, 11, GameSolver::Connect4::OpeningBookBase<6, 11>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 11>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 6 && h == 12) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<6, 12>, GameSolver::Connect4::GenericPosition<6, 12>, 6, 12, GameSolver::Connect4::OpeningBookBase<6, 12>>(*static_cast<GameSolver::Connect4::HeuristicSolver<6, 12>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 5) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<7, 5>, GameSolver::Connect4::GenericPosition<7, 5>, 7, 5, GameSolver::Connect4::OpeningBookBase<7, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 8) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<7, 8>, GameSolver::Connect4::GenericPosition<7, 8>, 7, 8, GameSolver::Connect4::OpeningBookBase<7, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 9) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<7, 9>, GameSolver::Connect4::GenericPosition<7, 9>, 7, 9, GameSolver::Connect4::OpeningBookBase<7, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 10) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<7, 10>, GameSolver::Connect4::GenericPosition<7, 10>, 7, 10, GameSolver::Connect4::OpeningBookBase<7, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 11) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<7, 11>, GameSolver::Connect4::GenericPosition<7, 11>, 7, 11, GameSolver::Connect4::OpeningBookBase<7, 11>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 11>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 7 && h == 12) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<7, 12>, GameSolver::Connect4::GenericPosition<7, 12>, 7, 12, GameSolver::Connect4::OpeningBookBase<7, 12>>(*static_cast<GameSolver::Connect4::HeuristicSolver<7, 12>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 5) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<8, 5>, GameSolver::Connect4::GenericPosition<8, 5>, 8, 5, GameSolver::Connect4::OpeningBookBase<8, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 7) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<8, 7>, GameSolver::Connect4::GenericPosition<8, 7>, 8, 7, GameSolver::Connect4::OpeningBookBase<8, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 9) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<8, 9>, GameSolver::Connect4::GenericPosition<8, 9>, 8, 9, GameSolver::Connect4::OpeningBookBase<8, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 10) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<8, 10>, GameSolver::Connect4::GenericPosition<8, 10>, 8, 10, GameSolver::Connect4::OpeningBookBase<8, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 11) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<8, 11>, GameSolver::Connect4::GenericPosition<8, 11>, 8, 11, GameSolver::Connect4::OpeningBookBase<8, 11>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 11>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 12) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<8, 12>, GameSolver::Connect4::GenericPosition<8, 12>, 8, 12, GameSolver::Connect4::OpeningBookBase<8, 12>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 12>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 5) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<9, 5>, GameSolver::Connect4::GenericPosition<9, 5>, 9, 5, GameSolver::Connect4::OpeningBookBase<9, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 8) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<9, 8>, GameSolver::Connect4::GenericPosition<9, 8>, 9, 8, GameSolver::Connect4::OpeningBookBase<9, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 10) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<9, 10>, GameSolver::Connect4::GenericPosition<9, 10>, 9, 10, GameSolver::Connect4::OpeningBookBase<9, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 11) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<9, 11>, GameSolver::Connect4::GenericPosition<9, 11>, 9, 11, GameSolver::Connect4::OpeningBookBase<9, 11>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 11>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 12) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<9, 12>, GameSolver::Connect4::GenericPosition<9, 12>, 9, 12, GameSolver::Connect4::OpeningBookBase<9, 12>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 12>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 5) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<10, 5>, GameSolver::Connect4::GenericPosition<10, 5>, 10, 5, GameSolver::Connect4::OpeningBookBase<10, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 6) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<10, 6>, GameSolver::Connect4::GenericPosition<10, 6>, 10, 6, GameSolver::Connect4::OpeningBookBase<10, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 8) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<10, 8>, GameSolver::Connect4::GenericPosition<10, 8>, 10, 8, GameSolver::Connect4::OpeningBookBase<10, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 9) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<10, 9>, GameSolver::Connect4::GenericPosition<10, 9>, 10, 9, GameSolver::Connect4::OpeningBookBase<10, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 11) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<10, 11>, GameSolver::Connect4::GenericPosition<10, 11>, 10, 11, GameSolver::Connect4::OpeningBookBase<10, 11>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 11>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 5) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<11, 5>, GameSolver::Connect4::GenericPosition<11, 5>, 11, 5, GameSolver::Connect4::OpeningBookBase<11, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 6) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<11, 6>, GameSolver::Connect4::GenericPosition<11, 6>, 11, 6, GameSolver::Connect4::OpeningBookBase<11, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 7) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<11, 7>, GameSolver::Connect4::GenericPosition<11, 7>, 11, 7, GameSolver::Connect4::OpeningBookBase<11, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 8) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<11, 8>, GameSolver::Connect4::GenericPosition<11, 8>, 11, 8, GameSolver::Connect4::OpeningBookBase<11, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 9) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<11, 9>, GameSolver::Connect4::GenericPosition<11, 9>, 11, 9, GameSolver::Connect4::OpeningBookBase<11, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 10) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<11, 10>, GameSolver::Connect4::GenericPosition<11, 10>, 11, 10, GameSolver::Connect4::OpeningBookBase<11, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 12 && h == 5) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<12, 5>, GameSolver::Connect4::GenericPosition<12, 5>, 12, 5, GameSolver::Connect4::OpeningBookBase<12, 5>>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 5>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 12 && h == 6) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<12, 6>, GameSolver::Connect4::GenericPosition<12, 6>, 12, 6, GameSolver::Connect4::OpeningBookBase<12, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 12 && h == 7) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<12, 7>, GameSolver::Connect4::GenericPosition<12, 7>, 12, 7, GameSolver::Connect4::OpeningBookBase<12, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 12 && h == 8) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<12, 8>, GameSolver::Connect4::GenericPosition<12, 8>, 12, 8, GameSolver::Connect4::OpeningBookBase<12, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 12 && h == 9) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<12, 9>, GameSolver::Connect4::GenericPosition<12, 9>, 12, 9, GameSolver::Connect4::OpeningBookBase<12, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<12, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 7) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<9, 7>, GameSolver::Connect4::GenericPosition<9, 7>, 9, 7, GameSolver::Connect4::OpeningBookBase<9, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 8 && h == 8) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<8, 8>, GameSolver::Connect4::GenericPosition<8, 8>, 8, 8, GameSolver::Connect4::OpeningBookBase<8, 8>>(*static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 7) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<10, 7>, GameSolver::Connect4::GenericPosition<10, 7>, 10, 7, GameSolver::Connect4::OpeningBookBase<10, 7>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 9) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<9, 9>, GameSolver::Connect4::GenericPosition<9, 9>, 9, 9, GameSolver::Connect4::OpeningBookBase<9, 9>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 10 && h == 10) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<10, 10>, GameSolver::Connect4::GenericPosition<10, 10>, 10, 10, GameSolver::Connect4::OpeningBookBase<10, 10>>(*static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 9 && h == 6) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<9, 6>, GameSolver::Connect4::GenericPosition<9, 6>, 9, 6, GameSolver::Connect4::OpeningBookBase<9, 6>>(*static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else if (w == 11 && h == 4) result_data = runSolveHeuristicRaw<GameSolver::Connect4::HeuristicSolver<11, 4>, GameSolver::Connect4::GenericPosition<11, 4>, 11, 4, GameSolver::Connect4::OpeningBookBase<11, 4>>(*static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver), pos, max_depth, threads, timeout_ms, book_ptr);
            else SetError("Unsupported board size for SolveHeuristic");
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
    void* book_ptr;
    std::vector<int> result_data;
};

Value SolveHeuristic(const CallbackInfo& info) {
    Env env = info.Env();
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* solver = UnwrapPointer<void>(info[2]);
    std::string pos = info[3].As<String>().Utf8Value();
    int threads = info[4].As<Number>().Int32Value();
    int max_depth = info[5].As<Number>().Int32Value();
    double timeout_ms = info[6].As<Number>().DoubleValue();
    void* book_ptr = UnwrapPointer<void>(info[7]);

    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
    SolveHeuristicWorker* worker = new SolveHeuristicWorker(env, deferred, w, h, solver, pos, threads, max_depth, timeout_ms, book_ptr);
    worker->Queue();
    return deferred.Promise();
}

Value AnalyzeHeuristic(const CallbackInfo& info) {
    Env env = info.Env();
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* solver = UnwrapPointer<void>(info[2]);
    std::string pos = info[3].As<String>().Utf8Value();
    int threads = info[4].As<Number>().Int32Value();
    int max_depth = info[5].As<Number>().Int32Value();
    double timeout_ms = info[6].As<Number>().DoubleValue();
    void* book_ptr = UnwrapPointer<void>(info[7]);

    
    

    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
    AnalyzeHeuristicWorker* worker = new AnalyzeHeuristicWorker(env, deferred, w, h, solver, pos, threads, max_depth, timeout_ms, book_ptr);
    worker->Queue();
    
    return deferred.Promise();
}


Value StopSolver(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* solver = UnwrapPointer<void>(info[2]);
    bool is_heuristic = info[3].As<Boolean>().Value();

    if (is_heuristic) {
        if (w == 6 && h == 5) static_cast<GameSolver::Connect4::HeuristicSolver<6, 5>*>(solver)->stop();
        else if (w == 6 && h == 6) static_cast<GameSolver::Connect4::HeuristicSolver<6, 6>*>(solver)->stop();
        else if (w == 7 && h == 6) static_cast<GameSolver::Connect4::HeuristicSolver<7, 6>*>(solver)->stop();
        else if (w == 7 && h == 7) static_cast<GameSolver::Connect4::HeuristicSolver<7, 7>*>(solver)->stop();
        else if (w == 8 && h == 6) static_cast<GameSolver::Connect4::HeuristicSolver<8, 6>*>(solver)->stop();
        else if (w == 6 && h == 7) static_cast<GameSolver::Connect4::HeuristicSolver<6, 7>*>(solver)->stop();
        else if (w == 6 && h == 8) static_cast<GameSolver::Connect4::HeuristicSolver<6, 8>*>(solver)->stop();
        else if (w == 6 && h == 9) static_cast<GameSolver::Connect4::HeuristicSolver<6, 9>*>(solver)->stop();
        else if (w == 6 && h == 10) static_cast<GameSolver::Connect4::HeuristicSolver<6, 10>*>(solver)->stop();
        else if (w == 6 && h == 11) static_cast<GameSolver::Connect4::HeuristicSolver<6, 11>*>(solver)->stop();
        else if (w == 6 && h == 12) static_cast<GameSolver::Connect4::HeuristicSolver<6, 12>*>(solver)->stop();
        else if (w == 7 && h == 5) static_cast<GameSolver::Connect4::HeuristicSolver<7, 5>*>(solver)->stop();
        else if (w == 7 && h == 8) static_cast<GameSolver::Connect4::HeuristicSolver<7, 8>*>(solver)->stop();
        else if (w == 7 && h == 9) static_cast<GameSolver::Connect4::HeuristicSolver<7, 9>*>(solver)->stop();
        else if (w == 7 && h == 10) static_cast<GameSolver::Connect4::HeuristicSolver<7, 10>*>(solver)->stop();
        else if (w == 7 && h == 11) static_cast<GameSolver::Connect4::HeuristicSolver<7, 11>*>(solver)->stop();
        else if (w == 7 && h == 12) static_cast<GameSolver::Connect4::HeuristicSolver<7, 12>*>(solver)->stop();
        else if (w == 8 && h == 5) static_cast<GameSolver::Connect4::HeuristicSolver<8, 5>*>(solver)->stop();
        else if (w == 8 && h == 7) static_cast<GameSolver::Connect4::HeuristicSolver<8, 7>*>(solver)->stop();
        else if (w == 8 && h == 9) static_cast<GameSolver::Connect4::HeuristicSolver<8, 9>*>(solver)->stop();
        else if (w == 8 && h == 10) static_cast<GameSolver::Connect4::HeuristicSolver<8, 10>*>(solver)->stop();
        else if (w == 8 && h == 11) static_cast<GameSolver::Connect4::HeuristicSolver<8, 11>*>(solver)->stop();
        else if (w == 8 && h == 12) static_cast<GameSolver::Connect4::HeuristicSolver<8, 12>*>(solver)->stop();
        else if (w == 9 && h == 5) static_cast<GameSolver::Connect4::HeuristicSolver<9, 5>*>(solver)->stop();
        else if (w == 9 && h == 8) static_cast<GameSolver::Connect4::HeuristicSolver<9, 8>*>(solver)->stop();
        else if (w == 9 && h == 10) static_cast<GameSolver::Connect4::HeuristicSolver<9, 10>*>(solver)->stop();
        else if (w == 9 && h == 11) static_cast<GameSolver::Connect4::HeuristicSolver<9, 11>*>(solver)->stop();
        else if (w == 9 && h == 12) static_cast<GameSolver::Connect4::HeuristicSolver<9, 12>*>(solver)->stop();
        else if (w == 10 && h == 5) static_cast<GameSolver::Connect4::HeuristicSolver<10, 5>*>(solver)->stop();
        else if (w == 10 && h == 6) static_cast<GameSolver::Connect4::HeuristicSolver<10, 6>*>(solver)->stop();
        else if (w == 10 && h == 8) static_cast<GameSolver::Connect4::HeuristicSolver<10, 8>*>(solver)->stop();
        else if (w == 10 && h == 9) static_cast<GameSolver::Connect4::HeuristicSolver<10, 9>*>(solver)->stop();
        else if (w == 10 && h == 11) static_cast<GameSolver::Connect4::HeuristicSolver<10, 11>*>(solver)->stop();
        else if (w == 11 && h == 5) static_cast<GameSolver::Connect4::HeuristicSolver<11, 5>*>(solver)->stop();
        else if (w == 11 && h == 6) static_cast<GameSolver::Connect4::HeuristicSolver<11, 6>*>(solver)->stop();
        else if (w == 11 && h == 7) static_cast<GameSolver::Connect4::HeuristicSolver<11, 7>*>(solver)->stop();
        else if (w == 11 && h == 8) static_cast<GameSolver::Connect4::HeuristicSolver<11, 8>*>(solver)->stop();
        else if (w == 11 && h == 9) static_cast<GameSolver::Connect4::HeuristicSolver<11, 9>*>(solver)->stop();
        else if (w == 11 && h == 10) static_cast<GameSolver::Connect4::HeuristicSolver<11, 10>*>(solver)->stop();
        else if (w == 12 && h == 5) static_cast<GameSolver::Connect4::HeuristicSolver<12, 5>*>(solver)->stop();
        else if (w == 12 && h == 6) static_cast<GameSolver::Connect4::HeuristicSolver<12, 6>*>(solver)->stop();
        else if (w == 12 && h == 7) static_cast<GameSolver::Connect4::HeuristicSolver<12, 7>*>(solver)->stop();
        else if (w == 12 && h == 8) static_cast<GameSolver::Connect4::HeuristicSolver<12, 8>*>(solver)->stop();
        else if (w == 12 && h == 9) static_cast<GameSolver::Connect4::HeuristicSolver<12, 9>*>(solver)->stop();
        else if (w == 9 && h == 7) static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver)->stop();
        else if (w == 8 && h == 8) static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver)->stop();
        else if (w == 10 && h == 7) static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver)->stop();
        else if (w == 9 && h == 9) static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver)->stop();
        else if (w == 10 && h == 10) static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver)->stop();
        else if (w == 9 && h == 6) static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver)->stop();
        else if (w == 11 && h == 4) static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver)->stop();
    } else {
        if (w == 6 && h == 5) static_cast<C4_6x5::Solver*>(solver)->stop();
        else if (w == 6 && h == 6) static_cast<C4_6x6::Solver*>(solver)->stop();
        else if (w == 7 && h == 6) static_cast<C4_7x6::Solver*>(solver)->stop();
        else if (w == 7 && h == 7) static_cast<C4_7x7::Solver*>(solver)->stop();
        else if (w == 8 && h == 6) static_cast<C4_8x6::Solver*>(solver)->stop();
        else if (w == 4 && h == 4) static_cast<C4_4x4::Solver*>(solver)->stop();
        else if (w == 4 && h == 5) static_cast<C4_4x5::Solver*>(solver)->stop();
        else if (w == 4 && h == 6) static_cast<C4_4x6::Solver*>(solver)->stop();
        else if (w == 4 && h == 7) static_cast<C4_4x7::Solver*>(solver)->stop();
        else if (w == 4 && h == 8) static_cast<C4_4x8::Solver*>(solver)->stop();
        else if (w == 4 && h == 9) static_cast<C4_4x9::Solver*>(solver)->stop();
        else if (w == 4 && h == 10) static_cast<C4_4x10::Solver*>(solver)->stop();
        else if (w == 4 && h == 11) static_cast<C4_4x11::Solver*>(solver)->stop();
        else if (w == 4 && h == 12) static_cast<C4_4x12::Solver*>(solver)->stop();
        else if (w == 5 && h == 4) static_cast<C4_5x4::Solver*>(solver)->stop();
        else if (w == 5 && h == 5) static_cast<C4_5x5::Solver*>(solver)->stop();
        else if (w == 5 && h == 6) static_cast<C4_5x6::Solver*>(solver)->stop();
        else if (w == 5 && h == 7) static_cast<C4_5x7::Solver*>(solver)->stop();
        else if (w == 5 && h == 8) static_cast<C4_5x8::Solver*>(solver)->stop();
        else if (w == 5 && h == 9) static_cast<C4_5x9::Solver*>(solver)->stop();
        else if (w == 5 && h == 10) static_cast<C4_5x10::Solver*>(solver)->stop();
        else if (w == 5 && h == 11) static_cast<C4_5x11::Solver*>(solver)->stop();
        else if (w == 5 && h == 12) static_cast<C4_5x12::Solver*>(solver)->stop();
        else if (w == 6 && h == 4) static_cast<C4_6x4::Solver*>(solver)->stop();
        else if (w == 6 && h == 7) static_cast<C4_6x7::Solver*>(solver)->stop();
        else if (w == 6 && h == 8) static_cast<C4_6x8::Solver*>(solver)->stop();
        else if (w == 6 && h == 9) static_cast<C4_6x9::Solver*>(solver)->stop();
        else if (w == 6 && h == 10) static_cast<C4_6x10::Solver*>(solver)->stop();
        else if (w == 6 && h == 11) static_cast<C4_6x11::Solver*>(solver)->stop();
        else if (w == 6 && h == 12) static_cast<C4_6x12::Solver*>(solver)->stop();
        else if (w == 7 && h == 4) static_cast<C4_7x4::Solver*>(solver)->stop();
        else if (w == 7 && h == 5) static_cast<C4_7x5::Solver*>(solver)->stop();
        else if (w == 7 && h == 8) static_cast<C4_7x8::Solver*>(solver)->stop();
        else if (w == 7 && h == 9) static_cast<C4_7x9::Solver*>(solver)->stop();
        else if (w == 7 && h == 10) static_cast<C4_7x10::Solver*>(solver)->stop();
        else if (w == 7 && h == 11) static_cast<C4_7x11::Solver*>(solver)->stop();
        else if (w == 7 && h == 12) static_cast<C4_7x12::Solver*>(solver)->stop();
        else if (w == 8 && h == 4) static_cast<C4_8x4::Solver*>(solver)->stop();
        else if (w == 8 && h == 5) static_cast<C4_8x5::Solver*>(solver)->stop();
        else if (w == 8 && h == 7) static_cast<C4_8x7::Solver*>(solver)->stop();
        else if (w == 8 && h == 9) static_cast<C4_8x9::Solver*>(solver)->stop();
        else if (w == 8 && h == 10) static_cast<C4_8x10::Solver*>(solver)->stop();
        else if (w == 8 && h == 11) static_cast<C4_8x11::Solver*>(solver)->stop();
        else if (w == 8 && h == 12) static_cast<C4_8x12::Solver*>(solver)->stop();
        else if (w == 9 && h == 4) static_cast<C4_9x4::Solver*>(solver)->stop();
        else if (w == 9 && h == 5) static_cast<C4_9x5::Solver*>(solver)->stop();
        else if (w == 9 && h == 8) static_cast<C4_9x8::Solver*>(solver)->stop();
        else if (w == 9 && h == 10) static_cast<C4_9x10::Solver*>(solver)->stop();
        else if (w == 9 && h == 11) static_cast<C4_9x11::Solver*>(solver)->stop();
        else if (w == 9 && h == 12) static_cast<C4_9x12::Solver*>(solver)->stop();
        else if (w == 10 && h == 4) static_cast<C4_10x4::Solver*>(solver)->stop();
        else if (w == 10 && h == 5) static_cast<C4_10x5::Solver*>(solver)->stop();
        else if (w == 10 && h == 6) static_cast<C4_10x6::Solver*>(solver)->stop();
        else if (w == 10 && h == 8) static_cast<C4_10x8::Solver*>(solver)->stop();
        else if (w == 10 && h == 9) static_cast<C4_10x9::Solver*>(solver)->stop();
        else if (w == 10 && h == 11) static_cast<C4_10x11::Solver*>(solver)->stop();
        else if (w == 11 && h == 5) static_cast<C4_11x5::Solver*>(solver)->stop();
        else if (w == 11 && h == 6) static_cast<C4_11x6::Solver*>(solver)->stop();
        else if (w == 11 && h == 7) static_cast<C4_11x7::Solver*>(solver)->stop();
        else if (w == 11 && h == 8) static_cast<C4_11x8::Solver*>(solver)->stop();
        else if (w == 11 && h == 9) static_cast<C4_11x9::Solver*>(solver)->stop();
        else if (w == 11 && h == 10) static_cast<C4_11x10::Solver*>(solver)->stop();
        else if (w == 12 && h == 4) static_cast<C4_12x4::Solver*>(solver)->stop();
        else if (w == 12 && h == 5) static_cast<C4_12x5::Solver*>(solver)->stop();
        else if (w == 12 && h == 6) static_cast<C4_12x6::Solver*>(solver)->stop();
        else if (w == 12 && h == 7) static_cast<C4_12x7::Solver*>(solver)->stop();
        else if (w == 12 && h == 8) static_cast<C4_12x8::Solver*>(solver)->stop();
        else if (w == 12 && h == 9) static_cast<C4_12x9::Solver*>(solver)->stop();
        else if (w == 9 && h == 7) static_cast<C4_9x7::Solver*>(solver)->stop();
        else if (w == 9 && h == 6) static_cast<C4_9x6::Solver*>(solver)->stop();
        else if (w == 11 && h == 4) static_cast<C4_11x4::Solver*>(solver)->stop();
        else if (w == 7 && h == 13) static_cast<C4_7x13::Solver*>(solver)->stop();
        else if (w == 8 && h == 13) static_cast<C4_8x13::Solver*>(solver)->stop();
        else if (w == 10 && h == 10) static_cast<C4_10x10::Solver*>(solver)->stop();
        else if (w == 13 && h == 4) static_cast<C4_13x4::Solver*>(solver)->stop();
        else if (w == 13 && h == 5) static_cast<C4_13x5::Solver*>(solver)->stop();
        else if (w == 13 && h == 6) static_cast<C4_13x6::Solver*>(solver)->stop();
        else if (w == 13 && h == 7) static_cast<C4_13x7::Solver*>(solver)->stop();
        else if (w == 13 && h == 8) static_cast<C4_13x8::Solver*>(solver)->stop();
        else if (w == 9 && h == 9) static_cast<C4_9x9::Solver*>(solver)->stop();
    }
    return info.Env().Undefined();
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
        else if (w == 6 && h == 7) count = static_cast<GameSolver::Connect4::HeuristicSolver<6, 7>*>(solver)->getNodeCount();
        else if (w == 6 && h == 8) count = static_cast<GameSolver::Connect4::HeuristicSolver<6, 8>*>(solver)->getNodeCount();
        else if (w == 6 && h == 9) count = static_cast<GameSolver::Connect4::HeuristicSolver<6, 9>*>(solver)->getNodeCount();
        else if (w == 6 && h == 10) count = static_cast<GameSolver::Connect4::HeuristicSolver<6, 10>*>(solver)->getNodeCount();
        else if (w == 6 && h == 11) count = static_cast<GameSolver::Connect4::HeuristicSolver<6, 11>*>(solver)->getNodeCount();
        else if (w == 6 && h == 12) count = static_cast<GameSolver::Connect4::HeuristicSolver<6, 12>*>(solver)->getNodeCount();
        else if (w == 7 && h == 5) count = static_cast<GameSolver::Connect4::HeuristicSolver<7, 5>*>(solver)->getNodeCount();
        else if (w == 7 && h == 8) count = static_cast<GameSolver::Connect4::HeuristicSolver<7, 8>*>(solver)->getNodeCount();
        else if (w == 7 && h == 9) count = static_cast<GameSolver::Connect4::HeuristicSolver<7, 9>*>(solver)->getNodeCount();
        else if (w == 7 && h == 10) count = static_cast<GameSolver::Connect4::HeuristicSolver<7, 10>*>(solver)->getNodeCount();
        else if (w == 7 && h == 11) count = static_cast<GameSolver::Connect4::HeuristicSolver<7, 11>*>(solver)->getNodeCount();
        else if (w == 7 && h == 12) count = static_cast<GameSolver::Connect4::HeuristicSolver<7, 12>*>(solver)->getNodeCount();
        else if (w == 8 && h == 5) count = static_cast<GameSolver::Connect4::HeuristicSolver<8, 5>*>(solver)->getNodeCount();
        else if (w == 8 && h == 7) count = static_cast<GameSolver::Connect4::HeuristicSolver<8, 7>*>(solver)->getNodeCount();
        else if (w == 8 && h == 9) count = static_cast<GameSolver::Connect4::HeuristicSolver<8, 9>*>(solver)->getNodeCount();
        else if (w == 8 && h == 10) count = static_cast<GameSolver::Connect4::HeuristicSolver<8, 10>*>(solver)->getNodeCount();
        else if (w == 8 && h == 11) count = static_cast<GameSolver::Connect4::HeuristicSolver<8, 11>*>(solver)->getNodeCount();
        else if (w == 8 && h == 12) count = static_cast<GameSolver::Connect4::HeuristicSolver<8, 12>*>(solver)->getNodeCount();
        else if (w == 9 && h == 5) count = static_cast<GameSolver::Connect4::HeuristicSolver<9, 5>*>(solver)->getNodeCount();
        else if (w == 9 && h == 8) count = static_cast<GameSolver::Connect4::HeuristicSolver<9, 8>*>(solver)->getNodeCount();
        else if (w == 9 && h == 10) count = static_cast<GameSolver::Connect4::HeuristicSolver<9, 10>*>(solver)->getNodeCount();
        else if (w == 9 && h == 11) count = static_cast<GameSolver::Connect4::HeuristicSolver<9, 11>*>(solver)->getNodeCount();
        else if (w == 9 && h == 12) count = static_cast<GameSolver::Connect4::HeuristicSolver<9, 12>*>(solver)->getNodeCount();
        else if (w == 10 && h == 5) count = static_cast<GameSolver::Connect4::HeuristicSolver<10, 5>*>(solver)->getNodeCount();
        else if (w == 10 && h == 6) count = static_cast<GameSolver::Connect4::HeuristicSolver<10, 6>*>(solver)->getNodeCount();
        else if (w == 10 && h == 8) count = static_cast<GameSolver::Connect4::HeuristicSolver<10, 8>*>(solver)->getNodeCount();
        else if (w == 10 && h == 9) count = static_cast<GameSolver::Connect4::HeuristicSolver<10, 9>*>(solver)->getNodeCount();
        else if (w == 10 && h == 11) count = static_cast<GameSolver::Connect4::HeuristicSolver<10, 11>*>(solver)->getNodeCount();
        else if (w == 11 && h == 5) count = static_cast<GameSolver::Connect4::HeuristicSolver<11, 5>*>(solver)->getNodeCount();
        else if (w == 11 && h == 6) count = static_cast<GameSolver::Connect4::HeuristicSolver<11, 6>*>(solver)->getNodeCount();
        else if (w == 11 && h == 7) count = static_cast<GameSolver::Connect4::HeuristicSolver<11, 7>*>(solver)->getNodeCount();
        else if (w == 11 && h == 8) count = static_cast<GameSolver::Connect4::HeuristicSolver<11, 8>*>(solver)->getNodeCount();
        else if (w == 11 && h == 9) count = static_cast<GameSolver::Connect4::HeuristicSolver<11, 9>*>(solver)->getNodeCount();
        else if (w == 11 && h == 10) count = static_cast<GameSolver::Connect4::HeuristicSolver<11, 10>*>(solver)->getNodeCount();
        else if (w == 12 && h == 5) count = static_cast<GameSolver::Connect4::HeuristicSolver<12, 5>*>(solver)->getNodeCount();
        else if (w == 12 && h == 6) count = static_cast<GameSolver::Connect4::HeuristicSolver<12, 6>*>(solver)->getNodeCount();
        else if (w == 12 && h == 7) count = static_cast<GameSolver::Connect4::HeuristicSolver<12, 7>*>(solver)->getNodeCount();
        else if (w == 12 && h == 8) count = static_cast<GameSolver::Connect4::HeuristicSolver<12, 8>*>(solver)->getNodeCount();
        else if (w == 12 && h == 9) count = static_cast<GameSolver::Connect4::HeuristicSolver<12, 9>*>(solver)->getNodeCount();
        else if (w == 9 && h == 7) count = static_cast<GameSolver::Connect4::HeuristicSolver<9, 7>*>(solver)->getNodeCount();
        else if (w == 8 && h == 8) count = static_cast<GameSolver::Connect4::HeuristicSolver<8, 8>*>(solver)->getNodeCount();
        else if (w == 10 && h == 7) count = static_cast<GameSolver::Connect4::HeuristicSolver<10, 7>*>(solver)->getNodeCount();
        else if (w == 9 && h == 9) count = static_cast<GameSolver::Connect4::HeuristicSolver<9, 9>*>(solver)->getNodeCount();
        else if (w == 10 && h == 10) count = static_cast<GameSolver::Connect4::HeuristicSolver<10, 10>*>(solver)->getNodeCount();
        else if (w == 9 && h == 6) count = static_cast<GameSolver::Connect4::HeuristicSolver<9, 6>*>(solver)->getNodeCount();
        else if (w == 11 && h == 4) count = static_cast<GameSolver::Connect4::HeuristicSolver<11, 4>*>(solver)->getNodeCount();
    } else {
        if (w == 6 && h == 5) count = static_cast<C4_6x5::Solver*>(solver)->getNodeCount();
        else if (w == 6 && h == 6) count = static_cast<C4_6x6::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 6) count = static_cast<C4_7x6::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 7) count = static_cast<C4_7x7::Solver*>(solver)->getNodeCount();
        else if (w == 8 && h == 6) count = static_cast<C4_8x6::Solver*>(solver)->getNodeCount();
        else if (w == 4 && h == 4) count = static_cast<C4_4x4::Solver*>(solver)->getNodeCount();
        else if (w == 4 && h == 5) count = static_cast<C4_4x5::Solver*>(solver)->getNodeCount();
        else if (w == 4 && h == 6) count = static_cast<C4_4x6::Solver*>(solver)->getNodeCount();
        else if (w == 4 && h == 7) count = static_cast<C4_4x7::Solver*>(solver)->getNodeCount();
        else if (w == 4 && h == 8) count = static_cast<C4_4x8::Solver*>(solver)->getNodeCount();
        else if (w == 4 && h == 9) count = static_cast<C4_4x9::Solver*>(solver)->getNodeCount();
        else if (w == 4 && h == 10) count = static_cast<C4_4x10::Solver*>(solver)->getNodeCount();
        else if (w == 4 && h == 11) count = static_cast<C4_4x11::Solver*>(solver)->getNodeCount();
        else if (w == 4 && h == 12) count = static_cast<C4_4x12::Solver*>(solver)->getNodeCount();
        else if (w == 5 && h == 4) count = static_cast<C4_5x4::Solver*>(solver)->getNodeCount();
        else if (w == 5 && h == 5) count = static_cast<C4_5x5::Solver*>(solver)->getNodeCount();
        else if (w == 5 && h == 6) count = static_cast<C4_5x6::Solver*>(solver)->getNodeCount();
        else if (w == 5 && h == 7) count = static_cast<C4_5x7::Solver*>(solver)->getNodeCount();
        else if (w == 5 && h == 8) count = static_cast<C4_5x8::Solver*>(solver)->getNodeCount();
        else if (w == 5 && h == 9) count = static_cast<C4_5x9::Solver*>(solver)->getNodeCount();
        else if (w == 5 && h == 10) count = static_cast<C4_5x10::Solver*>(solver)->getNodeCount();
        else if (w == 5 && h == 11) count = static_cast<C4_5x11::Solver*>(solver)->getNodeCount();
        else if (w == 5 && h == 12) count = static_cast<C4_5x12::Solver*>(solver)->getNodeCount();
        else if (w == 6 && h == 4) count = static_cast<C4_6x4::Solver*>(solver)->getNodeCount();
        else if (w == 6 && h == 7) count = static_cast<C4_6x7::Solver*>(solver)->getNodeCount();
        else if (w == 6 && h == 8) count = static_cast<C4_6x8::Solver*>(solver)->getNodeCount();
        else if (w == 6 && h == 9) count = static_cast<C4_6x9::Solver*>(solver)->getNodeCount();
        else if (w == 6 && h == 10) count = static_cast<C4_6x10::Solver*>(solver)->getNodeCount();
        else if (w == 6 && h == 11) count = static_cast<C4_6x11::Solver*>(solver)->getNodeCount();
        else if (w == 6 && h == 12) count = static_cast<C4_6x12::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 4) count = static_cast<C4_7x4::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 5) count = static_cast<C4_7x5::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 8) count = static_cast<C4_7x8::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 9) count = static_cast<C4_7x9::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 10) count = static_cast<C4_7x10::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 11) count = static_cast<C4_7x11::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 12) count = static_cast<C4_7x12::Solver*>(solver)->getNodeCount();
        else if (w == 8 && h == 4) count = static_cast<C4_8x4::Solver*>(solver)->getNodeCount();
        else if (w == 8 && h == 5) count = static_cast<C4_8x5::Solver*>(solver)->getNodeCount();
        else if (w == 8 && h == 7) count = static_cast<C4_8x7::Solver*>(solver)->getNodeCount();
        else if (w == 8 && h == 9) count = static_cast<C4_8x9::Solver*>(solver)->getNodeCount();
        else if (w == 8 && h == 10) count = static_cast<C4_8x10::Solver*>(solver)->getNodeCount();
        else if (w == 8 && h == 11) count = static_cast<C4_8x11::Solver*>(solver)->getNodeCount();
        else if (w == 8 && h == 12) count = static_cast<C4_8x12::Solver*>(solver)->getNodeCount();
        else if (w == 9 && h == 4) count = static_cast<C4_9x4::Solver*>(solver)->getNodeCount();
        else if (w == 9 && h == 5) count = static_cast<C4_9x5::Solver*>(solver)->getNodeCount();
        else if (w == 9 && h == 8) count = static_cast<C4_9x8::Solver*>(solver)->getNodeCount();
        else if (w == 9 && h == 10) count = static_cast<C4_9x10::Solver*>(solver)->getNodeCount();
        else if (w == 9 && h == 11) count = static_cast<C4_9x11::Solver*>(solver)->getNodeCount();
        else if (w == 9 && h == 12) count = static_cast<C4_9x12::Solver*>(solver)->getNodeCount();
        else if (w == 10 && h == 4) count = static_cast<C4_10x4::Solver*>(solver)->getNodeCount();
        else if (w == 10 && h == 5) count = static_cast<C4_10x5::Solver*>(solver)->getNodeCount();
        else if (w == 10 && h == 6) count = static_cast<C4_10x6::Solver*>(solver)->getNodeCount();
        else if (w == 10 && h == 8) count = static_cast<C4_10x8::Solver*>(solver)->getNodeCount();
        else if (w == 10 && h == 9) count = static_cast<C4_10x9::Solver*>(solver)->getNodeCount();
        else if (w == 10 && h == 11) count = static_cast<C4_10x11::Solver*>(solver)->getNodeCount();
        else if (w == 11 && h == 5) count = static_cast<C4_11x5::Solver*>(solver)->getNodeCount();
        else if (w == 11 && h == 6) count = static_cast<C4_11x6::Solver*>(solver)->getNodeCount();
        else if (w == 11 && h == 7) count = static_cast<C4_11x7::Solver*>(solver)->getNodeCount();
        else if (w == 11 && h == 8) count = static_cast<C4_11x8::Solver*>(solver)->getNodeCount();
        else if (w == 11 && h == 9) count = static_cast<C4_11x9::Solver*>(solver)->getNodeCount();
        else if (w == 11 && h == 10) count = static_cast<C4_11x10::Solver*>(solver)->getNodeCount();
        else if (w == 12 && h == 4) count = static_cast<C4_12x4::Solver*>(solver)->getNodeCount();
        else if (w == 12 && h == 5) count = static_cast<C4_12x5::Solver*>(solver)->getNodeCount();
        else if (w == 12 && h == 6) count = static_cast<C4_12x6::Solver*>(solver)->getNodeCount();
        else if (w == 12 && h == 7) count = static_cast<C4_12x7::Solver*>(solver)->getNodeCount();
        else if (w == 12 && h == 8) count = static_cast<C4_12x8::Solver*>(solver)->getNodeCount();
        else if (w == 12 && h == 9) count = static_cast<C4_12x9::Solver*>(solver)->getNodeCount();
        else if (w == 8 && h == 8) count = static_cast<C4_8x8::Solver*>(solver)->getNodeCount();
        else if (w == 9 && h == 7) count = static_cast<C4_9x7::Solver*>(solver)->getNodeCount();
        else if (w == 9 && h == 6) count = static_cast<C4_9x6::Solver*>(solver)->getNodeCount();
        else if (w == 11 && h == 4) count = static_cast<C4_11x4::Solver*>(solver)->getNodeCount();
        else if (w == 7 && h == 13) count = static_cast<C4_7x13::Solver*>(solver)->getNodeCount();
        else if (w == 8 && h == 13) count = static_cast<C4_8x13::Solver*>(solver)->getNodeCount();
        else if (w == 10 && h == 10) count = static_cast<C4_10x10::Solver*>(solver)->getNodeCount();
        else if (w == 13 && h == 4) count = static_cast<C4_13x4::Solver*>(solver)->getNodeCount();
        else if (w == 13 && h == 5) count = static_cast<C4_13x5::Solver*>(solver)->getNodeCount();
        else if (w == 13 && h == 6) count = static_cast<C4_13x6::Solver*>(solver)->getNodeCount();
        else if (w == 13 && h == 7) count = static_cast<C4_13x7::Solver*>(solver)->getNodeCount();
        else if (w == 13 && h == 8) count = static_cast<C4_13x8::Solver*>(solver)->getNodeCount();
        else if (w == 9 && h == 9) count = static_cast<C4_9x9::Solver*>(solver)->getNodeCount();
    }
    return Number::New(info.Env(), (double)count);
}

// Helper macro for book operations
#define DISPATCH_BOOK(w, h, Ptr, ACTION) \
    if (w == 6 && h == 5) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<6, 5>*>(Ptr); (void)b; ACTION(C4_6x5, 6, 5, b); } \
    else if (w == 6 && h == 6) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<6, 6>*>(Ptr); (void)b; ACTION(C4_6x6, 6, 6, b); } \
    else if (w == 7 && h == 6) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<7, 6>*>(Ptr); (void)b; ACTION(C4_7x6, 7, 6, b); } \
    else if (w == 7 && h == 7) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<7, 7>*>(Ptr); (void)b; ACTION(C4_7x7, 7, 7, b); } \
    else if (w == 8 && h == 6) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<8, 6>*>(Ptr); (void)b; ACTION(C4_8x6, 8, 6, b); } \
    else if (w == 4 && h == 4) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<4, 4>*>(Ptr); (void)b; ACTION(C4_4x4, 4, 4, b); } \
    else if (w == 4 && h == 5) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<4, 5>*>(Ptr); (void)b; ACTION(C4_4x5, 4, 5, b); } \
    else if (w == 4 && h == 6) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<4, 6>*>(Ptr); (void)b; ACTION(C4_4x6, 4, 6, b); } \
    else if (w == 4 && h == 7) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<4, 7>*>(Ptr); (void)b; ACTION(C4_4x7, 4, 7, b); } \
    else if (w == 4 && h == 8) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<4, 8>*>(Ptr); (void)b; ACTION(C4_4x8, 4, 8, b); } \
    else if (w == 4 && h == 9) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<4, 9>*>(Ptr); (void)b; ACTION(C4_4x9, 4, 9, b); } \
    else if (w == 4 && h == 10) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<4, 10>*>(Ptr); (void)b; ACTION(C4_4x10, 4, 10, b); } \
    else if (w == 4 && h == 11) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<4, 11>*>(Ptr); (void)b; ACTION(C4_4x11, 4, 11, b); } \
    else if (w == 4 && h == 12) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<4, 12>*>(Ptr); (void)b; ACTION(C4_4x12, 4, 12, b); } \
    else if (w == 5 && h == 4) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<5, 4>*>(Ptr); (void)b; ACTION(C4_5x4, 5, 4, b); } \
    else if (w == 5 && h == 5) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<5, 5>*>(Ptr); (void)b; ACTION(C4_5x5, 5, 5, b); } \
    else if (w == 5 && h == 6) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<5, 6>*>(Ptr); (void)b; ACTION(C4_5x6, 5, 6, b); } \
    else if (w == 5 && h == 7) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<5, 7>*>(Ptr); (void)b; ACTION(C4_5x7, 5, 7, b); } \
    else if (w == 5 && h == 8) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<5, 8>*>(Ptr); (void)b; ACTION(C4_5x8, 5, 8, b); } \
    else if (w == 5 && h == 9) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<5, 9>*>(Ptr); (void)b; ACTION(C4_5x9, 5, 9, b); } \
    else if (w == 5 && h == 10) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<5, 10>*>(Ptr); (void)b; ACTION(C4_5x10, 5, 10, b); } \
    else if (w == 5 && h == 11) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<5, 11>*>(Ptr); (void)b; ACTION(C4_5x11, 5, 11, b); } \
    else if (w == 5 && h == 12) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<5, 12>*>(Ptr); (void)b; ACTION(C4_5x12, 5, 12, b); } \
    else if (w == 6 && h == 4) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<6, 4>*>(Ptr); (void)b; ACTION(C4_6x4, 6, 4, b); } \
    else if (w == 6 && h == 7) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<6, 7>*>(Ptr); (void)b; ACTION(C4_6x7, 6, 7, b); } \
    else if (w == 6 && h == 8) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<6, 8>*>(Ptr); (void)b; ACTION(C4_6x8, 6, 8, b); } \
    else if (w == 6 && h == 9) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<6, 9>*>(Ptr); (void)b; ACTION(C4_6x9, 6, 9, b); } \
    else if (w == 6 && h == 10) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<6, 10>*>(Ptr); (void)b; ACTION(C4_6x10, 6, 10, b); } \
    else if (w == 6 && h == 11) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<6, 11>*>(Ptr); (void)b; ACTION(C4_6x11, 6, 11, b); } \
    else if (w == 6 && h == 12) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<6, 12>*>(Ptr); (void)b; ACTION(C4_6x12, 6, 12, b); } \
    else if (w == 7 && h == 4) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<7, 4>*>(Ptr); (void)b; ACTION(C4_7x4, 7, 4, b); } \
    else if (w == 7 && h == 5) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<7, 5>*>(Ptr); (void)b; ACTION(C4_7x5, 7, 5, b); } \
    else if (w == 7 && h == 8) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<7, 8>*>(Ptr); (void)b; ACTION(C4_7x8, 7, 8, b); } \
    else if (w == 7 && h == 9) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<7, 9>*>(Ptr); (void)b; ACTION(C4_7x9, 7, 9, b); } \
    else if (w == 7 && h == 10) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<7, 10>*>(Ptr); (void)b; ACTION(C4_7x10, 7, 10, b); } \
    else if (w == 7 && h == 11) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<7, 11>*>(Ptr); (void)b; ACTION(C4_7x11, 7, 11, b); } \
    else if (w == 7 && h == 12) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<7, 12>*>(Ptr); (void)b; ACTION(C4_7x12, 7, 12, b); } \
    else if (w == 8 && h == 4) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<8, 4>*>(Ptr); (void)b; ACTION(C4_8x4, 8, 4, b); } \
    else if (w == 8 && h == 5) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<8, 5>*>(Ptr); (void)b; ACTION(C4_8x5, 8, 5, b); } \
    else if (w == 8 && h == 7) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<8, 7>*>(Ptr); (void)b; ACTION(C4_8x7, 8, 7, b); } \
    else if (w == 8 && h == 8) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<8, 8>*>(Ptr); (void)b; ACTION(C4_8x8, 8, 8, b); } \
    else if (w == 8 && h == 9) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<8, 9>*>(Ptr); (void)b; ACTION(C4_8x9, 8, 9, b); } \
    else if (w == 8 && h == 10) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<8, 10>*>(Ptr); (void)b; ACTION(C4_8x10, 8, 10, b); } \
    else if (w == 8 && h == 11) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<8, 11>*>(Ptr); (void)b; ACTION(C4_8x11, 8, 11, b); } \
    else if (w == 8 && h == 12) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<8, 12>*>(Ptr); (void)b; ACTION(C4_8x12, 8, 12, b); } \
    else if (w == 9 && h == 4) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<9, 4>*>(Ptr); (void)b; ACTION(C4_9x4, 9, 4, b); } \
    else if (w == 9 && h == 5) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<9, 5>*>(Ptr); (void)b; ACTION(C4_9x5, 9, 5, b); } \
    else if (w == 9 && h == 6) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<9, 6>*>(Ptr); (void)b; ACTION(C4_9x6, 9, 6, b); } \
    else if (w == 9 && h == 7) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<9, 7>*>(Ptr); (void)b; ACTION(C4_9x7, 9, 7, b); } \
    else if (w == 9 && h == 8) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<9, 8>*>(Ptr); (void)b; ACTION(C4_9x8, 9, 8, b); } \
    else if (w == 9 && h == 10) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<9, 10>*>(Ptr); (void)b; ACTION(C4_9x10, 9, 10, b); } \
    else if (w == 9 && h == 11) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<9, 11>*>(Ptr); (void)b; ACTION(C4_9x11, 9, 11, b); } \
    else if (w == 9 && h == 12) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<9, 12>*>(Ptr); (void)b; ACTION(C4_9x12, 9, 12, b); } \
    else if (w == 10 && h == 4) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<10, 4>*>(Ptr); (void)b; ACTION(C4_10x4, 10, 4, b); } \
    else if (w == 10 && h == 5) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<10, 5>*>(Ptr); (void)b; ACTION(C4_10x5, 10, 5, b); } \
    else if (w == 10 && h == 6) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<10, 6>*>(Ptr); (void)b; ACTION(C4_10x6, 10, 6, b); } \
    else if (w == 10 && h == 8) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<10, 8>*>(Ptr); (void)b; ACTION(C4_10x8, 10, 8, b); } \
    else if (w == 10 && h == 9) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<10, 9>*>(Ptr); (void)b; ACTION(C4_10x9, 10, 9, b); } \
    else if (w == 10 && h == 11) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<10, 11>*>(Ptr); (void)b; ACTION(C4_10x11, 10, 11, b); } \
    else if (w == 11 && h == 4) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<11, 4>*>(Ptr); (void)b; ACTION(C4_11x4, 11, 4, b); } \
    else if (w == 7 && h == 13) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<7, 13>*>(Ptr); (void)b; ACTION(C4_7x13, 7, 13, b); } \
    else if (w == 8 && h == 13) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<8, 13>*>(Ptr); (void)b; ACTION(C4_8x13, 8, 13, b); } \
    else if (w == 10 && h == 10) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<10, 10>*>(Ptr); (void)b; ACTION(C4_10x10, 10, 10, b); } \
    else if (w == 13 && h == 4) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<13, 4>*>(Ptr); (void)b; ACTION(C4_13x4, 13, 4, b); } \
    else if (w == 13 && h == 5) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<13, 5>*>(Ptr); (void)b; ACTION(C4_13x5, 13, 5, b); } \
    else if (w == 13 && h == 6) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<13, 6>*>(Ptr); (void)b; ACTION(C4_13x6, 13, 6, b); } \
    else if (w == 13 && h == 7) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<13, 7>*>(Ptr); (void)b; ACTION(C4_13x7, 13, 7, b); } \
    else if (w == 13 && h == 8) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<13, 8>*>(Ptr); (void)b; ACTION(C4_13x8, 13, 8, b); } \
    else if (w == 9 && h == 9) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<9, 9>*>(Ptr); (void)b; ACTION(C4_9x9, 9, 9, b); } \
    else if (w == 11 && h == 5) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<11, 5>*>(Ptr); (void)b; ACTION(C4_11x5, 11, 5, b); } \
    else if (w == 11 && h == 6) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<11, 6>*>(Ptr); (void)b; ACTION(C4_11x6, 11, 6, b); } \
    else if (w == 11 && h == 7) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<11, 7>*>(Ptr); (void)b; ACTION(C4_11x7, 11, 7, b); } \
    else if (w == 11 && h == 8) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<11, 8>*>(Ptr); (void)b; ACTION(C4_11x8, 11, 8, b); } \
    else if (w == 11 && h == 9) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<11, 9>*>(Ptr); (void)b; ACTION(C4_11x9, 11, 9, b); } \
    else if (w == 11 && h == 10) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<11, 10>*>(Ptr); (void)b; ACTION(C4_11x10, 11, 10, b); } \
    else if (w == 12 && h == 4) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<12, 4>*>(Ptr); (void)b; ACTION(C4_12x4, 12, 4, b); } \
    else if (w == 12 && h == 5) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<12, 5>*>(Ptr); (void)b; ACTION(C4_12x5, 12, 5, b); } \
    else if (w == 12 && h == 6) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<12, 6>*>(Ptr); (void)b; ACTION(C4_12x6, 12, 6, b); } \
    else if (w == 12 && h == 7) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<12, 7>*>(Ptr); (void)b; ACTION(C4_12x7, 12, 7, b); } \
    else if (w == 12 && h == 8) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<12, 8>*>(Ptr); (void)b; ACTION(C4_12x8, 12, 8, b); } \
    else if (w == 12 && h == 9) { auto* b = static_cast<GameSolver::Connect4::OpeningBookBase<12, 9>*>(Ptr); (void)b; ACTION(C4_12x9, 12, 9, b); }

Value CreateBookFromBuffer(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    Buffer<uint8_t> buffer = info[2].As<Buffer<uint8_t>>();
    
    void* ptr = nullptr;
    const uint8_t* data = buffer.Data();
    size_t size = buffer.Length();

    try {
        #define CREATE_BUF_ACTION(NS, W, H, _) \
            ptr = ::GameSolver::Connect4::OpeningBookBase<W, H>::load_from_memory(data, size, W, H).release();
        
        DISPATCH_BOOK(w, h, nullptr, CREATE_BUF_ACTION);
    } catch(const std::exception& e) {
        Error::New(info.Env(), e.what()).ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }
    
    return WrapPointer(info, ptr);
}

Value ConvertBookToDense(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* ptr = UnwrapPointer<void>(info[2]);
    void* new_ptr = nullptr;

    try {
        #define CONVERT_DENSE_ACTION(NS, W, H, b) \
            if (dynamic_cast<::GameSolver::Connect4::DenseBook<W, H, ::GameSolver::Connect4::GenericPosition<W, H>::position_t, uint8_t>*>(b)) { \
                new_ptr = ptr; \
            } else { \
                auto dump = b->dump(); \
                std::vector<::GameSolver::Connect4::GenericPosition<W, H>::position_t> keys; \
                std::vector<uint8_t> values; \
                keys.reserve(dump.size()); \
                values.reserve(dump.size()); \
                for(const auto& entry : dump) { keys.push_back(entry.first); values.push_back(entry.second); } \
                new_ptr = new ::GameSolver::Connect4::DenseBook<W, H, ::GameSolver::Connect4::GenericPosition<W, H>::position_t, uint8_t>(b->getDepth(), std::move(keys), std::move(values)); \
            }
        
        DISPATCH_BOOK(w, h, ptr, CONVERT_DENSE_ACTION);
    } catch(const std::exception& e) {
        Error::New(info.Env(), e.what()).ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }
    return WrapPointer(info, new_ptr);
}

Value ConvertBookToEF(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* ptr = UnwrapPointer<void>(info[2]);
    void* new_ptr = nullptr;

    try {
        #define CONVERT_EF_ACTION(NS, W, H, b) \
            if (dynamic_cast<::GameSolver::Connect4::EliasFanoBook<W, H>*>(b)) { \
                new_ptr = ptr; \
            } else { \
                auto dump = b->dump(); \
                auto depth = b->getDepth(); \
                auto num_entries = dump.size(); \
                std::sort(dump.begin(), dump.end()); \
                dump.erase(std::unique(dump.begin(), dump.end(), [](const auto& a, const auto& b) { return a.first == b.first; }), dump.end()); \
                uint64_t max_key = dump.empty() ? 0 : dump.back().first; \
                uint64_t u = 0; \
                while ((1ULL << u) <= max_key) u++; \
                uint64_t l = 0; \
                if (num_entries > 0) { \
                    while ((1ULL << l) <= (max_key / num_entries)) l++; \
                } \
                std::vector<uint64_t> upper_bits((num_entries + (u >> l) + 64) / 64, 0); \
                std::vector<uint64_t> lower_bits((num_entries * l + 63) / 64, 0); \
                std::vector<uint8_t> values(num_entries); \
                uint64_t last_upper = 0; \
                uint64_t upper_idx = 0; \
                for (size_t i = 0; i < dump.size(); i++) { \
                    uint64_t key = dump[i].first; \
                    uint64_t upper = key >> l; \
                    uint64_t lower = key & ((1ULL << l) - 1); \
                    while (last_upper < upper) { upper_idx++; last_upper++; } \
                    upper_bits[upper_idx / 64] |= (1ULL << (upper_idx % 64)); \
                    upper_idx++; \
                    if (l > 0) { \
                        uint64_t bit_idx = i * l; \
                        lower_bits[bit_idx / 64] |= (lower << (bit_idx % 64)); \
                        if ((bit_idx % 64) + l > 64) { \
                            lower_bits[bit_idx / 64 + 1] |= (lower >> (64 - (bit_idx % 64))); \
                        } \
                    } \
                    values[i] = dump[i].second; \
                } \
                new_ptr = new ::GameSolver::Connect4::EliasFanoBook<W, H>(num_entries, u, l, depth, std::move(upper_bits), std::move(lower_bits), std::move(values)); \
            }
        
        DISPATCH_BOOK(w, h, ptr, CONVERT_EF_ACTION);
    } catch(const std::exception& e) {
        Error::New(info.Env(), e.what()).ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }
    return WrapPointer(info, new_ptr);
}

Value SaveBookToFile(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* ptr = UnwrapPointer<void>(info[2]);
    std::string path = info[3].As<String>().Utf8Value();
    std::string format = info[4].As<String>().Utf8Value();

    try {
        #define SAVE_FILE_ACTION(NS, W, H, b) \
            if (format == "dense") ::GameSolver::Connect4::OpeningBookBase<W, H>::save_dense(path, b->getDepth(), b->dump()); \
            else ::GameSolver::Connect4::OpeningBookBase<W, H>::save_elias_fano(path, b->getDepth(), b->dump());
        
        DISPATCH_BOOK(w, h, ptr, SAVE_FILE_ACTION);
    } catch(const std::exception& e) {
        Error::New(info.Env(), e.what()).ThrowAsJavaScriptException();
    }
    return info.Env().Undefined();
}

Value GetBookFormat(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* ptr = UnwrapPointer<void>(info[2]);
    std::string format = "unknown";

    #define GET_FORMAT_ACTION(NS, W, H, b) \
        if (dynamic_cast<::GameSolver::Connect4::DenseBook<W, H, ::GameSolver::Connect4::GenericPosition<W, H>::position_t, uint8_t>*>(b)) format = "dense"; \
        else if (dynamic_cast<::GameSolver::Connect4::EliasFanoBook<W, H>*>(b)) format = "elias-fano";
    
    DISPATCH_BOOK(w, h, ptr, GET_FORMAT_ACTION);
    return String::New(info.Env(), format);
}

Value DumpBook(const CallbackInfo& info) {
    Env env = info.Env();
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* Ptr = UnwrapPointer<void>(info[2]);
    
    Object result = Object::New(env);
    
    #define DUMP_ACTION(NS, W, H, b) \
        { \
            auto entries = b->dump(); \
            Array keys = Array::New(env, entries.size()); \
            Array values = Array::New(env, entries.size()); \
            for (size_t i = 0; i < entries.size(); i++) { \
                keys.Set(i, BigInt::New(env, (uint64_t)entries[i].first)); \
                values.Set(i, Number::New(env, (int)entries[i].second)); \
            } \
            result.Set("keys", keys); \
            result.Set("values", values); \
        }
    
    DISPATCH_BOOK(w, h, Ptr, DUMP_ACTION);
    
    return result;
}

Value GetBookScore(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* ptr = UnwrapPointer<void>(info[2]);
    std::string pos_str = info[3].As<String>().Utf8Value();

    int score = -32000;

    #define GET_SCORE_ACTION(NS, W, H, b) \
        { \
            ::GameSolver::Connect4::GenericPosition<W, H> P; \
            if (P.play(pos_str) == pos_str.length()) { \
                int val = b->get(P); \
                if (val != 0) score = val + ::GameSolver::Connect4::GenericPosition<W, H>::MIN_SCORE - 1; \
            } \
        }
    
    DISPATCH_BOOK(w, h, ptr, GET_SCORE_ACTION);

    if (score <= -32000 || score >= 32000) {
        return info.Env().Undefined();
    }
    return Number::New(info.Env(), score);
}

Value GetBookBuffer(const CallbackInfo& info) {
    int w = info[0].As<Number>().Int32Value();
    int h = info[1].As<Number>().Int32Value();
    void* ptr = UnwrapPointer<void>(info[2]);
    std::string format = info[3].As<String>().Utf8Value();

    std::vector<uint8_t> buf;

    try {
        #define GET_BUFFER_ACTION(NS, W, H, b) \
            if (format == "dense") buf = ::GameSolver::Connect4::OpeningBookBase<W, H>::serialize_dense(b->getDepth(), b->dump()); \
            else buf = ::GameSolver::Connect4::OpeningBookBase<W, H>::serialize_elias_fano(b->getDepth(), b->dump());
        
        DISPATCH_BOOK(w, h, ptr, GET_BUFFER_ACTION);
    } catch(const std::exception& e) {
        Error::New(info.Env(), e.what()).ThrowAsJavaScriptException();
        return info.Env().Undefined();
    }

    return Buffer<uint8_t>::Copy(info.Env(), buf.data(), buf.size());
}


// ----------------------------------------------------------------------------
// Book Builder
class BookBuilder : public ObjectWrap<BookBuilder> {
public:
    static Object Init(Napi::Env env, Object exports) {
        Function func = DefineClass(env, "BookBuilder", {
            InstanceMethod("add", &BookBuilder::Add),
            InstanceMethod("addPosition", &BookBuilder::AddPosition),
            InstanceMethod("loadFromBook", &BookBuilder::LoadFromBook),
            InstanceMethod("saveDense", &BookBuilder::SaveDense),
            InstanceMethod("getDenseBuffer", &BookBuilder::GetDenseBuffer),
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

    Napi::Value LoadFromBook(const CallbackInfo& info) {
        void* book_ptr = UnwrapPointer<void>(info[0]);
        if (!book_ptr) return info.Env().Undefined();

        if (width == 6 && height == 5) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<6, 5>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 6 && height == 6) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<6, 6>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 7 && height == 6) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<7, 6>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 7 && height == 7) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<7, 7>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 8 && height == 6) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<8, 6>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 4 && height == 4) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<4, 4>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 4 && height == 5) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<4, 5>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 4 && height == 6) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<4, 6>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 4 && height == 7) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<4, 7>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 4 && height == 8) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<4, 8>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 4 && height == 9) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<4, 9>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 4 && height == 10) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<4, 10>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 4 && height == 11) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<4, 11>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 4 && height == 12) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<4, 12>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 5 && height == 4) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<5, 4>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 5 && height == 5) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<5, 5>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 5 && height == 6) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<5, 6>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 5 && height == 7) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<5, 7>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 5 && height == 8) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<5, 8>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 5 && height == 9) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<5, 9>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 5 && height == 10) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<5, 10>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 5 && height == 11) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<5, 11>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 5 && height == 12) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<5, 12>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 6 && height == 4) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<6, 4>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 6 && height == 7) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<6, 7>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 6 && height == 8) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<6, 8>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 6 && height == 9) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<6, 9>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 6 && height == 10) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<6, 10>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 6 && height == 11) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<6, 11>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 6 && height == 12) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<6, 12>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 7 && height == 4) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<7, 4>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 7 && height == 5) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<7, 5>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 7 && height == 8) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<7, 8>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 7 && height == 9) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<7, 9>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 7 && height == 10) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<7, 10>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 7 && height == 11) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<7, 11>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 7 && height == 12) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<7, 12>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 8 && height == 4) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<8, 4>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 8 && height == 5) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<8, 5>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 8 && height == 7) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<8, 7>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 8 && height == 9) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<8, 9>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 8 && height == 10) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<8, 10>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 8 && height == 11) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<8, 11>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 8 && height == 12) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<8, 12>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 9 && height == 4) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<9, 4>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 9 && height == 5) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<9, 5>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 9 && height == 8) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<9, 8>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 9 && height == 10) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<9, 10>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 9 && height == 11) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<9, 11>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 9 && height == 12) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<9, 12>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 10 && height == 4) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<10, 4>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 10 && height == 5) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<10, 5>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 10 && height == 6) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<10, 6>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 10 && height == 8) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<10, 8>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 10 && height == 9) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<10, 9>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 10 && height == 11) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<10, 11>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 11 && height == 5) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<11, 5>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 11 && height == 6) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<11, 6>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 11 && height == 7) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<11, 7>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 11 && height == 8) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<11, 8>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 11 && height == 9) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<11, 9>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 11 && height == 10) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<11, 10>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 12 && height == 4) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<12, 4>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 12 && height == 5) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<12, 5>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 12 && height == 6) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<12, 6>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 12 && height == 7) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<12, 7>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 12 && height == 8) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<12, 8>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 12 && height == 9) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<12, 9>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 8 && height == 8) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<8, 8>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 9 && height == 7) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<9, 7>*>(book_ptr)->dump(); items128.insert(items128.end(), entries.begin(), entries.end()); }
        else if (width == 9 && height == 6) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<9, 6>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }
        else if (width == 11 && height == 4) { auto entries = static_cast<GameSolver::Connect4::OpeningBookBase<11, 4>*>(book_ptr)->dump(); items64.insert(items64.end(), entries.begin(), entries.end()); }

        return info.Env().Undefined();
    }

    bool is128() const {
        return width * (height + 1) > 64;
    }

    Napi::Value Add(const CallbackInfo& info) {
        bool lossless;
        uint64_t key = info[0].As<BigInt>().Uint64Value(&lossless);
        int raw_score = info[1].As<Number>().Int32Value();
        uint8_t score = 0;
        
        #define ENCODE_SCORE_ACTION(NS, W, H, b) \
            score = (uint8_t)(raw_score - ::GameSolver::Connect4::GenericPosition<W, H>::MIN_SCORE + 1);
            
        DISPATCH_BOOK(width, height, nullptr, ENCODE_SCORE_ACTION);

        if (is128()) items128.push_back({key, score});
        else items64.push_back({key, score});
        return info.Env().Undefined();
    }

    Napi::Value AddPosition(const CallbackInfo& info) {
        std::string pos = info[0].As<String>().Utf8Value();
        int raw_score = info[1].As<Number>().Int32Value();
        uint8_t score = 0;

        #define ENCODE_POS_SCORE_ACTION(NS, W, H, b) \
            score = (uint8_t)(raw_score - ::GameSolver::Connect4::GenericPosition<W, H>::MIN_SCORE + 1);
            
        DISPATCH_BOOK(width, height, nullptr, ENCODE_POS_SCORE_ACTION);
        
        if (width == 6 && height == 5) { GameSolver::Connect4::GenericPosition<6, 5> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 6 && height == 6) { GameSolver::Connect4::GenericPosition<6, 6> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 7 && height == 6) { GameSolver::Connect4::GenericPosition<7, 6> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 7 && height == 7) { GameSolver::Connect4::GenericPosition<7, 7> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 8 && height == 6) { GameSolver::Connect4::GenericPosition<8, 6> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 4 && height == 4) { GameSolver::Connect4::GenericPosition<4, 4> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 4 && height == 5) { GameSolver::Connect4::GenericPosition<4, 5> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 4 && height == 6) { GameSolver::Connect4::GenericPosition<4, 6> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 4 && height == 7) { GameSolver::Connect4::GenericPosition<4, 7> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 4 && height == 8) { GameSolver::Connect4::GenericPosition<4, 8> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 4 && height == 9) { GameSolver::Connect4::GenericPosition<4, 9> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 4 && height == 10) { GameSolver::Connect4::GenericPosition<4, 10> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 4 && height == 11) { GameSolver::Connect4::GenericPosition<4, 11> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 4 && height == 12) { GameSolver::Connect4::GenericPosition<4, 12> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 5 && height == 4) { GameSolver::Connect4::GenericPosition<5, 4> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 5 && height == 5) { GameSolver::Connect4::GenericPosition<5, 5> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 5 && height == 6) { GameSolver::Connect4::GenericPosition<5, 6> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 5 && height == 7) { GameSolver::Connect4::GenericPosition<5, 7> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 5 && height == 8) { GameSolver::Connect4::GenericPosition<5, 8> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 5 && height == 9) { GameSolver::Connect4::GenericPosition<5, 9> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 5 && height == 10) { GameSolver::Connect4::GenericPosition<5, 10> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 5 && height == 11) { GameSolver::Connect4::GenericPosition<5, 11> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 5 && height == 12) { GameSolver::Connect4::GenericPosition<5, 12> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 6 && height == 4) { GameSolver::Connect4::GenericPosition<6, 4> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 6 && height == 7) { GameSolver::Connect4::GenericPosition<6, 7> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 6 && height == 8) { GameSolver::Connect4::GenericPosition<6, 8> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 6 && height == 9) { GameSolver::Connect4::GenericPosition<6, 9> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 6 && height == 10) { GameSolver::Connect4::GenericPosition<6, 10> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 6 && height == 11) { GameSolver::Connect4::GenericPosition<6, 11> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 6 && height == 12) { GameSolver::Connect4::GenericPosition<6, 12> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 7 && height == 4) { GameSolver::Connect4::GenericPosition<7, 4> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 7 && height == 5) { GameSolver::Connect4::GenericPosition<7, 5> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 7 && height == 8) { GameSolver::Connect4::GenericPosition<7, 8> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 7 && height == 9) { GameSolver::Connect4::GenericPosition<7, 9> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 7 && height == 10) { GameSolver::Connect4::GenericPosition<7, 10> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 7 && height == 11) { GameSolver::Connect4::GenericPosition<7, 11> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 7 && height == 12) { GameSolver::Connect4::GenericPosition<7, 12> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 8 && height == 4) { GameSolver::Connect4::GenericPosition<8, 4> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 8 && height == 5) { GameSolver::Connect4::GenericPosition<8, 5> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 8 && height == 7) { GameSolver::Connect4::GenericPosition<8, 7> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 8 && height == 9) { GameSolver::Connect4::GenericPosition<8, 9> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 8 && height == 10) { GameSolver::Connect4::GenericPosition<8, 10> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 8 && height == 11) { GameSolver::Connect4::GenericPosition<8, 11> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 8 && height == 12) { GameSolver::Connect4::GenericPosition<8, 12> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 9 && height == 4) { GameSolver::Connect4::GenericPosition<9, 4> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 9 && height == 5) { GameSolver::Connect4::GenericPosition<9, 5> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 9 && height == 8) { GameSolver::Connect4::GenericPosition<9, 8> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 9 && height == 10) { GameSolver::Connect4::GenericPosition<9, 10> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 9 && height == 11) { GameSolver::Connect4::GenericPosition<9, 11> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 9 && height == 12) { GameSolver::Connect4::GenericPosition<9, 12> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 10 && height == 4) { GameSolver::Connect4::GenericPosition<10, 4> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 10 && height == 5) { GameSolver::Connect4::GenericPosition<10, 5> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 10 && height == 6) { GameSolver::Connect4::GenericPosition<10, 6> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 10 && height == 8) { GameSolver::Connect4::GenericPosition<10, 8> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 10 && height == 9) { GameSolver::Connect4::GenericPosition<10, 9> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 10 && height == 11) { GameSolver::Connect4::GenericPosition<10, 11> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 11 && height == 5) { GameSolver::Connect4::GenericPosition<11, 5> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 11 && height == 6) { GameSolver::Connect4::GenericPosition<11, 6> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 11 && height == 7) { GameSolver::Connect4::GenericPosition<11, 7> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 11 && height == 8) { GameSolver::Connect4::GenericPosition<11, 8> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 11 && height == 9) { GameSolver::Connect4::GenericPosition<11, 9> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 11 && height == 10) { GameSolver::Connect4::GenericPosition<11, 10> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 12 && height == 4) { GameSolver::Connect4::GenericPosition<12, 4> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 12 && height == 5) { GameSolver::Connect4::GenericPosition<12, 5> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 12 && height == 6) { GameSolver::Connect4::GenericPosition<12, 6> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 12 && height == 7) { GameSolver::Connect4::GenericPosition<12, 7> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 12 && height == 8) { GameSolver::Connect4::GenericPosition<12, 8> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 12 && height == 9) { GameSolver::Connect4::GenericPosition<12, 9> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 8 && height == 8) { GameSolver::Connect4::GenericPosition<8, 8> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 9 && height == 7) { GameSolver::Connect4::GenericPosition<9, 7> P; P.play(pos); items128.push_back({P.key3(), score}); }
        else if (width == 9 && height == 6) { GameSolver::Connect4::GenericPosition<9, 6> P; P.play(pos); items64.push_back({P.key3(), score}); }
        else if (width == 11 && height == 4) { GameSolver::Connect4::GenericPosition<11, 4> P; P.play(pos); items64.push_back({P.key3(), score}); }

        return info.Env().Undefined();
    }

    Napi::Value Size(const CallbackInfo& info) {
        return Number::New(info.Env(), (double)(is128() ? items128.size() : items64.size()));
    }

    Napi::Value SaveDense(const CallbackInfo& info) {
        std::string filename = info[0].As<String>().Utf8Value();
        if (width == 6 && height == 5) GameSolver::Connect4::OpeningBookBase<6, 5>::save_dense(filename, depth, items64);
        else if (width == 6 && height == 6) GameSolver::Connect4::OpeningBookBase<6, 6>::save_dense(filename, depth, items64);
        else if (width == 7 && height == 6) GameSolver::Connect4::OpeningBookBase<7, 6>::save_dense(filename, depth, items64);
        else if (width == 7 && height == 7) GameSolver::Connect4::OpeningBookBase<7, 7>::save_dense(filename, depth, items64);
        else if (width == 8 && height == 6) GameSolver::Connect4::OpeningBookBase<8, 6>::save_dense(filename, depth, items64);
        else if (width == 4 && height == 4) GameSolver::Connect4::OpeningBookBase<4, 4>::save_dense(filename, depth, items64);
        else if (width == 4 && height == 5) GameSolver::Connect4::OpeningBookBase<4, 5>::save_dense(filename, depth, items64);
        else if (width == 4 && height == 6) GameSolver::Connect4::OpeningBookBase<4, 6>::save_dense(filename, depth, items64);
        else if (width == 4 && height == 7) GameSolver::Connect4::OpeningBookBase<4, 7>::save_dense(filename, depth, items64);
        else if (width == 4 && height == 8) GameSolver::Connect4::OpeningBookBase<4, 8>::save_dense(filename, depth, items64);
        else if (width == 4 && height == 9) GameSolver::Connect4::OpeningBookBase<4, 9>::save_dense(filename, depth, items64);
        else if (width == 4 && height == 10) GameSolver::Connect4::OpeningBookBase<4, 10>::save_dense(filename, depth, items64);
        else if (width == 4 && height == 11) GameSolver::Connect4::OpeningBookBase<4, 11>::save_dense(filename, depth, items64);
        else if (width == 4 && height == 12) GameSolver::Connect4::OpeningBookBase<4, 12>::save_dense(filename, depth, items64);
        else if (width == 5 && height == 4) GameSolver::Connect4::OpeningBookBase<5, 4>::save_dense(filename, depth, items64);
        else if (width == 5 && height == 5) GameSolver::Connect4::OpeningBookBase<5, 5>::save_dense(filename, depth, items64);
        else if (width == 5 && height == 6) GameSolver::Connect4::OpeningBookBase<5, 6>::save_dense(filename, depth, items64);
        else if (width == 5 && height == 7) GameSolver::Connect4::OpeningBookBase<5, 7>::save_dense(filename, depth, items64);
        else if (width == 5 && height == 8) GameSolver::Connect4::OpeningBookBase<5, 8>::save_dense(filename, depth, items64);
        else if (width == 5 && height == 9) GameSolver::Connect4::OpeningBookBase<5, 9>::save_dense(filename, depth, items64);
        else if (width == 5 && height == 10) GameSolver::Connect4::OpeningBookBase<5, 10>::save_dense(filename, depth, items64);
        else if (width == 5 && height == 11) GameSolver::Connect4::OpeningBookBase<5, 11>::save_dense(filename, depth, items64);
        else if (width == 5 && height == 12) GameSolver::Connect4::OpeningBookBase<5, 12>::save_dense(filename, depth, items128);
        else if (width == 6 && height == 4) GameSolver::Connect4::OpeningBookBase<6, 4>::save_dense(filename, depth, items64);
        else if (width == 6 && height == 7) GameSolver::Connect4::OpeningBookBase<6, 7>::save_dense(filename, depth, items64);
        else if (width == 6 && height == 8) GameSolver::Connect4::OpeningBookBase<6, 8>::save_dense(filename, depth, items64);
        else if (width == 6 && height == 9) GameSolver::Connect4::OpeningBookBase<6, 9>::save_dense(filename, depth, items64);
        else if (width == 6 && height == 10) GameSolver::Connect4::OpeningBookBase<6, 10>::save_dense(filename, depth, items128);
        else if (width == 6 && height == 11) GameSolver::Connect4::OpeningBookBase<6, 11>::save_dense(filename, depth, items128);
        else if (width == 6 && height == 12) GameSolver::Connect4::OpeningBookBase<6, 12>::save_dense(filename, depth, items128);
        else if (width == 7 && height == 4) GameSolver::Connect4::OpeningBookBase<7, 4>::save_dense(filename, depth, items64);
        else if (width == 7 && height == 5) GameSolver::Connect4::OpeningBookBase<7, 5>::save_dense(filename, depth, items64);
        else if (width == 7 && height == 8) GameSolver::Connect4::OpeningBookBase<7, 8>::save_dense(filename, depth, items64);
        else if (width == 7 && height == 9) GameSolver::Connect4::OpeningBookBase<7, 9>::save_dense(filename, depth, items128);
        else if (width == 7 && height == 10) GameSolver::Connect4::OpeningBookBase<7, 10>::save_dense(filename, depth, items128);
        else if (width == 7 && height == 11) GameSolver::Connect4::OpeningBookBase<7, 11>::save_dense(filename, depth, items128);
        else if (width == 7 && height == 12) GameSolver::Connect4::OpeningBookBase<7, 12>::save_dense(filename, depth, items128);
        else if (width == 8 && height == 4) GameSolver::Connect4::OpeningBookBase<8, 4>::save_dense(filename, depth, items64);
        else if (width == 8 && height == 5) GameSolver::Connect4::OpeningBookBase<8, 5>::save_dense(filename, depth, items64);
        else if (width == 8 && height == 7) GameSolver::Connect4::OpeningBookBase<8, 7>::save_dense(filename, depth, items64);
        else if (width == 8 && height == 9) GameSolver::Connect4::OpeningBookBase<8, 9>::save_dense(filename, depth, items128);
        else if (width == 8 && height == 10) GameSolver::Connect4::OpeningBookBase<8, 10>::save_dense(filename, depth, items128);
        else if (width == 8 && height == 11) GameSolver::Connect4::OpeningBookBase<8, 11>::save_dense(filename, depth, items128);
        else if (width == 8 && height == 12) GameSolver::Connect4::OpeningBookBase<8, 12>::save_dense(filename, depth, items128);
        else if (width == 9 && height == 4) GameSolver::Connect4::OpeningBookBase<9, 4>::save_dense(filename, depth, items64);
        else if (width == 9 && height == 5) GameSolver::Connect4::OpeningBookBase<9, 5>::save_dense(filename, depth, items64);
        else if (width == 9 && height == 8) GameSolver::Connect4::OpeningBookBase<9, 8>::save_dense(filename, depth, items128);
        else if (width == 9 && height == 10) GameSolver::Connect4::OpeningBookBase<9, 10>::save_dense(filename, depth, items128);
        else if (width == 9 && height == 11) GameSolver::Connect4::OpeningBookBase<9, 11>::save_dense(filename, depth, items128);
        else if (width == 9 && height == 12) GameSolver::Connect4::OpeningBookBase<9, 12>::save_dense(filename, depth, items128);
        else if (width == 10 && height == 4) GameSolver::Connect4::OpeningBookBase<10, 4>::save_dense(filename, depth, items64);
        else if (width == 10 && height == 5) GameSolver::Connect4::OpeningBookBase<10, 5>::save_dense(filename, depth, items64);
        else if (width == 10 && height == 6) GameSolver::Connect4::OpeningBookBase<10, 6>::save_dense(filename, depth, items128);
        else if (width == 10 && height == 8) GameSolver::Connect4::OpeningBookBase<10, 8>::save_dense(filename, depth, items128);
        else if (width == 10 && height == 9) GameSolver::Connect4::OpeningBookBase<10, 9>::save_dense(filename, depth, items128);
        else if (width == 10 && height == 11) GameSolver::Connect4::OpeningBookBase<10, 11>::save_dense(filename, depth, items128);
        else if (width == 11 && height == 5) GameSolver::Connect4::OpeningBookBase<11, 5>::save_dense(filename, depth, items128);
        else if (width == 11 && height == 6) GameSolver::Connect4::OpeningBookBase<11, 6>::save_dense(filename, depth, items128);
        else if (width == 11 && height == 7) GameSolver::Connect4::OpeningBookBase<11, 7>::save_dense(filename, depth, items128);
        else if (width == 11 && height == 8) GameSolver::Connect4::OpeningBookBase<11, 8>::save_dense(filename, depth, items128);
        else if (width == 11 && height == 9) GameSolver::Connect4::OpeningBookBase<11, 9>::save_dense(filename, depth, items128);
        else if (width == 11 && height == 10) GameSolver::Connect4::OpeningBookBase<11, 10>::save_dense(filename, depth, items128);
        else if (width == 12 && height == 4) GameSolver::Connect4::OpeningBookBase<12, 4>::save_dense(filename, depth, items64);
        else if (width == 12 && height == 5) GameSolver::Connect4::OpeningBookBase<12, 5>::save_dense(filename, depth, items128);
        else if (width == 12 && height == 6) GameSolver::Connect4::OpeningBookBase<12, 6>::save_dense(filename, depth, items128);
        else if (width == 12 && height == 7) GameSolver::Connect4::OpeningBookBase<12, 7>::save_dense(filename, depth, items128);
        else if (width == 12 && height == 8) GameSolver::Connect4::OpeningBookBase<12, 8>::save_dense(filename, depth, items128);
        else if (width == 12 && height == 9) GameSolver::Connect4::OpeningBookBase<12, 9>::save_dense(filename, depth, items128);
        else if (width == 8 && height == 8) GameSolver::Connect4::OpeningBookBase<8, 8>::save_dense(filename, depth, items128);
        else if (width == 9 && height == 7) GameSolver::Connect4::OpeningBookBase<9, 7>::save_dense(filename, depth, items128);
        else if (width == 9 && height == 6) GameSolver::Connect4::OpeningBookBase<9, 6>::save_dense(filename, depth, items64);
        else if (width == 11 && height == 4) GameSolver::Connect4::OpeningBookBase<11, 4>::save_dense(filename, depth, items64);
        return info.Env().Undefined();
    }

    Napi::Value GetDenseBuffer(const CallbackInfo& info) {
        std::vector<uint8_t> buf;
        if (width == 6 && height == 5) buf = GameSolver::Connect4::OpeningBookBase<6, 5>::serialize_dense(depth, items64);
        else if (width == 6 && height == 6) buf = GameSolver::Connect4::OpeningBookBase<6, 6>::serialize_dense(depth, items64);
        else if (width == 7 && height == 6) buf = GameSolver::Connect4::OpeningBookBase<7, 6>::serialize_dense(depth, items64);
        else if (width == 7 && height == 7) buf = GameSolver::Connect4::OpeningBookBase<7, 7>::serialize_dense(depth, items64);
        else if (width == 8 && height == 6) buf = GameSolver::Connect4::OpeningBookBase<8, 6>::serialize_dense(depth, items64);
        else if (width == 4 && height == 4) buf = GameSolver::Connect4::OpeningBookBase<4, 4>::serialize_dense(depth, items64);
        else if (width == 4 && height == 5) buf = GameSolver::Connect4::OpeningBookBase<4, 5>::serialize_dense(depth, items64);
        else if (width == 4 && height == 6) buf = GameSolver::Connect4::OpeningBookBase<4, 6>::serialize_dense(depth, items64);
        else if (width == 4 && height == 7) buf = GameSolver::Connect4::OpeningBookBase<4, 7>::serialize_dense(depth, items64);
        else if (width == 4 && height == 8) buf = GameSolver::Connect4::OpeningBookBase<4, 8>::serialize_dense(depth, items64);
        else if (width == 4 && height == 9) buf = GameSolver::Connect4::OpeningBookBase<4, 9>::serialize_dense(depth, items64);
        else if (width == 4 && height == 10) buf = GameSolver::Connect4::OpeningBookBase<4, 10>::serialize_dense(depth, items64);
        else if (width == 4 && height == 11) buf = GameSolver::Connect4::OpeningBookBase<4, 11>::serialize_dense(depth, items64);
        else if (width == 4 && height == 12) buf = GameSolver::Connect4::OpeningBookBase<4, 12>::serialize_dense(depth, items64);
        else if (width == 5 && height == 4) buf = GameSolver::Connect4::OpeningBookBase<5, 4>::serialize_dense(depth, items64);
        else if (width == 5 && height == 5) buf = GameSolver::Connect4::OpeningBookBase<5, 5>::serialize_dense(depth, items64);
        else if (width == 5 && height == 6) buf = GameSolver::Connect4::OpeningBookBase<5, 6>::serialize_dense(depth, items64);
        else if (width == 5 && height == 7) buf = GameSolver::Connect4::OpeningBookBase<5, 7>::serialize_dense(depth, items64);
        else if (width == 5 && height == 8) buf = GameSolver::Connect4::OpeningBookBase<5, 8>::serialize_dense(depth, items64);
        else if (width == 5 && height == 9) buf = GameSolver::Connect4::OpeningBookBase<5, 9>::serialize_dense(depth, items64);
        else if (width == 5 && height == 10) buf = GameSolver::Connect4::OpeningBookBase<5, 10>::serialize_dense(depth, items64);
        else if (width == 5 && height == 11) buf = GameSolver::Connect4::OpeningBookBase<5, 11>::serialize_dense(depth, items64);
        else if (width == 5 && height == 12) buf = GameSolver::Connect4::OpeningBookBase<5, 12>::serialize_dense(depth, items128);
        else if (width == 6 && height == 4) buf = GameSolver::Connect4::OpeningBookBase<6, 4>::serialize_dense(depth, items64);
        else if (width == 6 && height == 7) buf = GameSolver::Connect4::OpeningBookBase<6, 7>::serialize_dense(depth, items64);
        else if (width == 6 && height == 8) buf = GameSolver::Connect4::OpeningBookBase<6, 8>::serialize_dense(depth, items64);
        else if (width == 6 && height == 9) buf = GameSolver::Connect4::OpeningBookBase<6, 9>::serialize_dense(depth, items64);
        else if (width == 6 && height == 10) buf = GameSolver::Connect4::OpeningBookBase<6, 10>::serialize_dense(depth, items128);
        else if (width == 6 && height == 11) buf = GameSolver::Connect4::OpeningBookBase<6, 11>::serialize_dense(depth, items128);
        else if (width == 6 && height == 12) buf = GameSolver::Connect4::OpeningBookBase<6, 12>::serialize_dense(depth, items128);
        else if (width == 7 && height == 4) buf = GameSolver::Connect4::OpeningBookBase<7, 4>::serialize_dense(depth, items64);
        else if (width == 7 && height == 5) buf = GameSolver::Connect4::OpeningBookBase<7, 5>::serialize_dense(depth, items64);
        else if (width == 7 && height == 8) buf = GameSolver::Connect4::OpeningBookBase<7, 8>::serialize_dense(depth, items64);
        else if (width == 7 && height == 9) buf = GameSolver::Connect4::OpeningBookBase<7, 9>::serialize_dense(depth, items128);
        else if (width == 7 && height == 10) buf = GameSolver::Connect4::OpeningBookBase<7, 10>::serialize_dense(depth, items128);
        else if (width == 7 && height == 11) buf = GameSolver::Connect4::OpeningBookBase<7, 11>::serialize_dense(depth, items128);
        else if (width == 7 && height == 12) buf = GameSolver::Connect4::OpeningBookBase<7, 12>::serialize_dense(depth, items128);
        else if (width == 8 && height == 4) buf = GameSolver::Connect4::OpeningBookBase<8, 4>::serialize_dense(depth, items64);
        else if (width == 8 && height == 5) buf = GameSolver::Connect4::OpeningBookBase<8, 5>::serialize_dense(depth, items64);
        else if (width == 8 && height == 7) buf = GameSolver::Connect4::OpeningBookBase<8, 7>::serialize_dense(depth, items64);
        else if (width == 8 && height == 9) buf = GameSolver::Connect4::OpeningBookBase<8, 9>::serialize_dense(depth, items128);
        else if (width == 8 && height == 10) buf = GameSolver::Connect4::OpeningBookBase<8, 10>::serialize_dense(depth, items128);
        else if (width == 8 && height == 11) buf = GameSolver::Connect4::OpeningBookBase<8, 11>::serialize_dense(depth, items128);
        else if (width == 8 && height == 12) buf = GameSolver::Connect4::OpeningBookBase<8, 12>::serialize_dense(depth, items128);
        else if (width == 9 && height == 4) buf = GameSolver::Connect4::OpeningBookBase<9, 4>::serialize_dense(depth, items64);
        else if (width == 9 && height == 5) buf = GameSolver::Connect4::OpeningBookBase<9, 5>::serialize_dense(depth, items64);
        else if (width == 9 && height == 8) buf = GameSolver::Connect4::OpeningBookBase<9, 8>::serialize_dense(depth, items128);
        else if (width == 9 && height == 10) buf = GameSolver::Connect4::OpeningBookBase<9, 10>::serialize_dense(depth, items128);
        else if (width == 9 && height == 11) buf = GameSolver::Connect4::OpeningBookBase<9, 11>::serialize_dense(depth, items128);
        else if (width == 9 && height == 12) buf = GameSolver::Connect4::OpeningBookBase<9, 12>::serialize_dense(depth, items128);
        else if (width == 10 && height == 4) buf = GameSolver::Connect4::OpeningBookBase<10, 4>::serialize_dense(depth, items64);
        else if (width == 10 && height == 5) buf = GameSolver::Connect4::OpeningBookBase<10, 5>::serialize_dense(depth, items64);
        else if (width == 10 && height == 6) buf = GameSolver::Connect4::OpeningBookBase<10, 6>::serialize_dense(depth, items128);
        else if (width == 10 && height == 8) buf = GameSolver::Connect4::OpeningBookBase<10, 8>::serialize_dense(depth, items128);
        else if (width == 10 && height == 9) buf = GameSolver::Connect4::OpeningBookBase<10, 9>::serialize_dense(depth, items128);
        else if (width == 10 && height == 11) buf = GameSolver::Connect4::OpeningBookBase<10, 11>::serialize_dense(depth, items128);
        else if (width == 11 && height == 5) buf = GameSolver::Connect4::OpeningBookBase<11, 5>::serialize_dense(depth, items128);
        else if (width == 11 && height == 6) buf = GameSolver::Connect4::OpeningBookBase<11, 6>::serialize_dense(depth, items128);
        else if (width == 11 && height == 7) buf = GameSolver::Connect4::OpeningBookBase<11, 7>::serialize_dense(depth, items128);
        else if (width == 11 && height == 8) buf = GameSolver::Connect4::OpeningBookBase<11, 8>::serialize_dense(depth, items128);
        else if (width == 11 && height == 9) buf = GameSolver::Connect4::OpeningBookBase<11, 9>::serialize_dense(depth, items128);
        else if (width == 11 && height == 10) buf = GameSolver::Connect4::OpeningBookBase<11, 10>::serialize_dense(depth, items128);
        else if (width == 12 && height == 4) buf = GameSolver::Connect4::OpeningBookBase<12, 4>::serialize_dense(depth, items64);
        else if (width == 12 && height == 5) buf = GameSolver::Connect4::OpeningBookBase<12, 5>::serialize_dense(depth, items128);
        else if (width == 12 && height == 6) buf = GameSolver::Connect4::OpeningBookBase<12, 6>::serialize_dense(depth, items128);
        else if (width == 12 && height == 7) buf = GameSolver::Connect4::OpeningBookBase<12, 7>::serialize_dense(depth, items128);
        else if (width == 12 && height == 8) buf = GameSolver::Connect4::OpeningBookBase<12, 8>::serialize_dense(depth, items128);
        else if (width == 12 && height == 9) buf = GameSolver::Connect4::OpeningBookBase<12, 9>::serialize_dense(depth, items128);
        else if (width == 8 && height == 8) buf = GameSolver::Connect4::OpeningBookBase<8, 8>::serialize_dense(depth, items128);
        else if (width == 9 && height == 7) buf = GameSolver::Connect4::OpeningBookBase<9, 7>::serialize_dense(depth, items128);
        else if (width == 9 && height == 6) buf = GameSolver::Connect4::OpeningBookBase<9, 6>::serialize_dense(depth, items64);
        else if (width == 11 && height == 4) buf = GameSolver::Connect4::OpeningBookBase<11, 4>::serialize_dense(depth, items64);

        return Napi::Buffer<uint8_t>::Copy(info.Env(), buf.data(), buf.size());
    }

    Napi::Value SaveEliasFano(const CallbackInfo& info) {
        std::string filename = info[0].As<String>().Utf8Value();
        if (width == 6 && height == 5) GameSolver::Connect4::OpeningBookBase<6, 5>::save_elias_fano(filename, depth, items64);
        else if (width == 6 && height == 6) GameSolver::Connect4::OpeningBookBase<6, 6>::save_elias_fano(filename, depth, items64);
        else if (width == 7 && height == 6) GameSolver::Connect4::OpeningBookBase<7, 6>::save_elias_fano(filename, depth, items64);
        else if (width == 7 && height == 7) GameSolver::Connect4::OpeningBookBase<7, 7>::save_elias_fano(filename, depth, items64);
        else if (width == 8 && height == 6) GameSolver::Connect4::OpeningBookBase<8, 6>::save_elias_fano(filename, depth, items64);
        else if (width == 4 && height == 4) GameSolver::Connect4::OpeningBookBase<4, 4>::save_elias_fano(filename, depth, items64);
        else if (width == 4 && height == 5) GameSolver::Connect4::OpeningBookBase<4, 5>::save_elias_fano(filename, depth, items64);
        else if (width == 4 && height == 6) GameSolver::Connect4::OpeningBookBase<4, 6>::save_elias_fano(filename, depth, items64);
        else if (width == 4 && height == 7) GameSolver::Connect4::OpeningBookBase<4, 7>::save_elias_fano(filename, depth, items64);
        else if (width == 4 && height == 8) GameSolver::Connect4::OpeningBookBase<4, 8>::save_elias_fano(filename, depth, items64);
        else if (width == 4 && height == 9) GameSolver::Connect4::OpeningBookBase<4, 9>::save_elias_fano(filename, depth, items64);
        else if (width == 4 && height == 10) GameSolver::Connect4::OpeningBookBase<4, 10>::save_elias_fano(filename, depth, items64);
        else if (width == 4 && height == 11) GameSolver::Connect4::OpeningBookBase<4, 11>::save_elias_fano(filename, depth, items64);
        else if (width == 4 && height == 12) GameSolver::Connect4::OpeningBookBase<4, 12>::save_elias_fano(filename, depth, items64);
        else if (width == 5 && height == 4) GameSolver::Connect4::OpeningBookBase<5, 4>::save_elias_fano(filename, depth, items64);
        else if (width == 5 && height == 5) GameSolver::Connect4::OpeningBookBase<5, 5>::save_elias_fano(filename, depth, items64);
        else if (width == 5 && height == 6) GameSolver::Connect4::OpeningBookBase<5, 6>::save_elias_fano(filename, depth, items64);
        else if (width == 5 && height == 7) GameSolver::Connect4::OpeningBookBase<5, 7>::save_elias_fano(filename, depth, items64);
        else if (width == 5 && height == 8) GameSolver::Connect4::OpeningBookBase<5, 8>::save_elias_fano(filename, depth, items64);
        else if (width == 5 && height == 9) GameSolver::Connect4::OpeningBookBase<5, 9>::save_elias_fano(filename, depth, items64);
        else if (width == 5 && height == 10) GameSolver::Connect4::OpeningBookBase<5, 10>::save_elias_fano(filename, depth, items64);
        else if (width == 5 && height == 11) GameSolver::Connect4::OpeningBookBase<5, 11>::save_elias_fano(filename, depth, items64);
        else if (width == 5 && height == 12) GameSolver::Connect4::OpeningBookBase<5, 12>::save_elias_fano(filename, depth, items128);
        else if (width == 6 && height == 4) GameSolver::Connect4::OpeningBookBase<6, 4>::save_elias_fano(filename, depth, items64);
        else if (width == 6 && height == 7) GameSolver::Connect4::OpeningBookBase<6, 7>::save_elias_fano(filename, depth, items64);
        else if (width == 6 && height == 8) GameSolver::Connect4::OpeningBookBase<6, 8>::save_elias_fano(filename, depth, items64);
        else if (width == 6 && height == 9) GameSolver::Connect4::OpeningBookBase<6, 9>::save_elias_fano(filename, depth, items64);
        else if (width == 6 && height == 10) GameSolver::Connect4::OpeningBookBase<6, 10>::save_elias_fano(filename, depth, items128);
        else if (width == 6 && height == 11) GameSolver::Connect4::OpeningBookBase<6, 11>::save_elias_fano(filename, depth, items128);
        else if (width == 6 && height == 12) GameSolver::Connect4::OpeningBookBase<6, 12>::save_elias_fano(filename, depth, items128);
        else if (width == 7 && height == 4) GameSolver::Connect4::OpeningBookBase<7, 4>::save_elias_fano(filename, depth, items64);
        else if (width == 7 && height == 5) GameSolver::Connect4::OpeningBookBase<7, 5>::save_elias_fano(filename, depth, items64);
        else if (width == 7 && height == 8) GameSolver::Connect4::OpeningBookBase<7, 8>::save_elias_fano(filename, depth, items64);
        else if (width == 7 && height == 9) GameSolver::Connect4::OpeningBookBase<7, 9>::save_elias_fano(filename, depth, items128);
        else if (width == 7 && height == 10) GameSolver::Connect4::OpeningBookBase<7, 10>::save_elias_fano(filename, depth, items128);
        else if (width == 7 && height == 11) GameSolver::Connect4::OpeningBookBase<7, 11>::save_elias_fano(filename, depth, items128);
        else if (width == 7 && height == 12) GameSolver::Connect4::OpeningBookBase<7, 12>::save_elias_fano(filename, depth, items128);
        else if (width == 8 && height == 4) GameSolver::Connect4::OpeningBookBase<8, 4>::save_elias_fano(filename, depth, items64);
        else if (width == 8 && height == 5) GameSolver::Connect4::OpeningBookBase<8, 5>::save_elias_fano(filename, depth, items64);
        else if (width == 8 && height == 7) GameSolver::Connect4::OpeningBookBase<8, 7>::save_elias_fano(filename, depth, items64);
        else if (width == 8 && height == 9) GameSolver::Connect4::OpeningBookBase<8, 9>::save_elias_fano(filename, depth, items128);
        else if (width == 8 && height == 10) GameSolver::Connect4::OpeningBookBase<8, 10>::save_elias_fano(filename, depth, items128);
        else if (width == 8 && height == 11) GameSolver::Connect4::OpeningBookBase<8, 11>::save_elias_fano(filename, depth, items128);
        else if (width == 8 && height == 12) GameSolver::Connect4::OpeningBookBase<8, 12>::save_elias_fano(filename, depth, items128);
        else if (width == 9 && height == 4) GameSolver::Connect4::OpeningBookBase<9, 4>::save_elias_fano(filename, depth, items64);
        else if (width == 9 && height == 5) GameSolver::Connect4::OpeningBookBase<9, 5>::save_elias_fano(filename, depth, items64);
        else if (width == 9 && height == 8) GameSolver::Connect4::OpeningBookBase<9, 8>::save_elias_fano(filename, depth, items128);
        else if (width == 9 && height == 10) GameSolver::Connect4::OpeningBookBase<9, 10>::save_elias_fano(filename, depth, items128);
        else if (width == 9 && height == 11) GameSolver::Connect4::OpeningBookBase<9, 11>::save_elias_fano(filename, depth, items128);
        else if (width == 9 && height == 12) GameSolver::Connect4::OpeningBookBase<9, 12>::save_elias_fano(filename, depth, items128);
        else if (width == 10 && height == 4) GameSolver::Connect4::OpeningBookBase<10, 4>::save_elias_fano(filename, depth, items64);
        else if (width == 10 && height == 5) GameSolver::Connect4::OpeningBookBase<10, 5>::save_elias_fano(filename, depth, items64);
        else if (width == 10 && height == 6) GameSolver::Connect4::OpeningBookBase<10, 6>::save_elias_fano(filename, depth, items128);
        else if (width == 10 && height == 8) GameSolver::Connect4::OpeningBookBase<10, 8>::save_elias_fano(filename, depth, items128);
        else if (width == 10 && height == 9) GameSolver::Connect4::OpeningBookBase<10, 9>::save_elias_fano(filename, depth, items128);
        else if (width == 10 && height == 11) GameSolver::Connect4::OpeningBookBase<10, 11>::save_elias_fano(filename, depth, items128);
        else if (width == 11 && height == 5) GameSolver::Connect4::OpeningBookBase<11, 5>::save_elias_fano(filename, depth, items128);
        else if (width == 11 && height == 6) GameSolver::Connect4::OpeningBookBase<11, 6>::save_elias_fano(filename, depth, items128);
        else if (width == 11 && height == 7) GameSolver::Connect4::OpeningBookBase<11, 7>::save_elias_fano(filename, depth, items128);
        else if (width == 11 && height == 8) GameSolver::Connect4::OpeningBookBase<11, 8>::save_elias_fano(filename, depth, items128);
        else if (width == 11 && height == 9) GameSolver::Connect4::OpeningBookBase<11, 9>::save_elias_fano(filename, depth, items128);
        else if (width == 11 && height == 10) GameSolver::Connect4::OpeningBookBase<11, 10>::save_elias_fano(filename, depth, items128);
        else if (width == 12 && height == 4) GameSolver::Connect4::OpeningBookBase<12, 4>::save_elias_fano(filename, depth, items64);
        else if (width == 12 && height == 5) GameSolver::Connect4::OpeningBookBase<12, 5>::save_elias_fano(filename, depth, items128);
        else if (width == 12 && height == 6) GameSolver::Connect4::OpeningBookBase<12, 6>::save_elias_fano(filename, depth, items128);
        else if (width == 12 && height == 7) GameSolver::Connect4::OpeningBookBase<12, 7>::save_elias_fano(filename, depth, items128);
        else if (width == 12 && height == 8) GameSolver::Connect4::OpeningBookBase<12, 8>::save_elias_fano(filename, depth, items128);
        else if (width == 12 && height == 9) GameSolver::Connect4::OpeningBookBase<12, 9>::save_elias_fano(filename, depth, items128);
        else if (width == 8 && height == 8) GameSolver::Connect4::OpeningBookBase<8, 8>::save_elias_fano(filename, depth, items128);
        else if (width == 9 && height == 7) GameSolver::Connect4::OpeningBookBase<9, 7>::save_elias_fano(filename, depth, items128);
        else if (width == 9 && height == 6) GameSolver::Connect4::OpeningBookBase<9, 6>::save_elias_fano(filename, depth, items64);
        else if (width == 11 && height == 4) GameSolver::Connect4::OpeningBookBase<11, 4>::save_elias_fano(filename, depth, items64);
        return info.Env().Undefined();
    }
};

template<int W, int H>
void explore_positions(const GameSolver::Connect4::GenericPosition<W, H>& P, std::string& pos_str, int max_depth, int target_depth, std::unordered_set<uint64_t>& visited, std::vector<std::string>& results, bool filter_forced) {
    uint64_t key = P.key3();
    if (!visited.insert(key).second) return;

    int nb_moves = P.nbMoves();
    if (nb_moves == target_depth) {
        bool add = true;
        if (filter_forced && !P.canWinNext()) {
            auto possible = P.possibleNonLosingMoves();
            if (possible != 0 && GameSolver::Connect4::GenericPosition<W, H>::popcount(possible) == 1) {
                add = false;
            }
        }
        if (add) {
            results.push_back(pos_str);
        }
    }

    if (nb_moves >= max_depth) return;

    for (int i = 0; i < W; i++) {
        if (P.canPlay(i) && !P.isWinningMove(i)) {
            GameSolver::Connect4::GenericPosition<W, H> P2(P);
            P2.playCol(i);
            pos_str.push_back(i < 9 ? '1' + i : 'a' + (i - 9));
            explore_positions(P2, pos_str, max_depth, target_depth, visited, results, filter_forced);
            pos_str.pop_back();
        }
    }
}

template<int W, int H>
void generate_positions_for_board(int max_depth, std::vector<std::string>& results, bool filter_forced) {
    std::string pos_str = "";
    for (int d = max_depth; d >= 0; d--) {
        std::unordered_set<uint64_t> visited;
        explore_positions(GameSolver::Connect4::GenericPosition<W, H>(), pos_str, d, d, visited, results, filter_forced);
    }
}

Value GeneratePositions(const CallbackInfo& info) {
    Env env = info.Env();
    int width = info[0].As<Number>().Uint32Value();
    int height = info[1].As<Number>().Uint32Value();
    int depth = info[2].As<Number>().Uint32Value();

    bool filter_forced = info.Length() > 3 && info[3].As<Boolean>().Value();

    std::vector<std::string> results;

    if (width == 6 && height == 5) generate_positions_for_board<6, 5>(depth, results, filter_forced);
    else if (width == 6 && height == 6) generate_positions_for_board<6, 6>(depth, results, filter_forced);
    else if (width == 7 && height == 6) generate_positions_for_board<7, 6>(depth, results, filter_forced);
    else if (width == 7 && height == 7) generate_positions_for_board<7, 7>(depth, results, filter_forced);
    else if (width == 8 && height == 6) generate_positions_for_board<8, 6>(depth, results, filter_forced);
    else if (width == 4 && height == 4) generate_positions_for_board<4, 4>(depth, results, filter_forced);
    else if (width == 4 && height == 5) generate_positions_for_board<4, 5>(depth, results, filter_forced);
    else if (width == 4 && height == 6) generate_positions_for_board<4, 6>(depth, results, filter_forced);
    else if (width == 4 && height == 7) generate_positions_for_board<4, 7>(depth, results, filter_forced);
    else if (width == 4 && height == 8) generate_positions_for_board<4, 8>(depth, results, filter_forced);
    else if (width == 4 && height == 9) generate_positions_for_board<4, 9>(depth, results, filter_forced);
    else if (width == 4 && height == 10) generate_positions_for_board<4, 10>(depth, results, filter_forced);
    else if (width == 4 && height == 11) generate_positions_for_board<4, 11>(depth, results, filter_forced);
    else if (width == 4 && height == 12) generate_positions_for_board<4, 12>(depth, results, filter_forced);
    else if (width == 5 && height == 4) generate_positions_for_board<5, 4>(depth, results, filter_forced);
    else if (width == 5 && height == 5) generate_positions_for_board<5, 5>(depth, results, filter_forced);
    else if (width == 5 && height == 6) generate_positions_for_board<5, 6>(depth, results, filter_forced);
    else if (width == 5 && height == 7) generate_positions_for_board<5, 7>(depth, results, filter_forced);
    else if (width == 5 && height == 8) generate_positions_for_board<5, 8>(depth, results, filter_forced);
    else if (width == 5 && height == 9) generate_positions_for_board<5, 9>(depth, results, filter_forced);
    else if (width == 5 && height == 10) generate_positions_for_board<5, 10>(depth, results, filter_forced);
    else if (width == 5 && height == 11) generate_positions_for_board<5, 11>(depth, results, filter_forced);
    else if (width == 5 && height == 12) generate_positions_for_board<5, 12>(depth, results, filter_forced);
    else if (width == 6 && height == 4) generate_positions_for_board<6, 4>(depth, results, filter_forced);
    else if (width == 6 && height == 7) generate_positions_for_board<6, 7>(depth, results, filter_forced);
    else if (width == 6 && height == 8) generate_positions_for_board<6, 8>(depth, results, filter_forced);
    else if (width == 6 && height == 9) generate_positions_for_board<6, 9>(depth, results, filter_forced);
    else if (width == 6 && height == 10) generate_positions_for_board<6, 10>(depth, results, filter_forced);
    else if (width == 6 && height == 11) generate_positions_for_board<6, 11>(depth, results, filter_forced);
    else if (width == 6 && height == 12) generate_positions_for_board<6, 12>(depth, results, filter_forced);
    else if (width == 7 && height == 4) generate_positions_for_board<7, 4>(depth, results, filter_forced);
    else if (width == 7 && height == 5) generate_positions_for_board<7, 5>(depth, results, filter_forced);
    else if (width == 7 && height == 8) generate_positions_for_board<7, 8>(depth, results, filter_forced);
    else if (width == 7 && height == 9) generate_positions_for_board<7, 9>(depth, results, filter_forced);
    else if (width == 7 && height == 10) generate_positions_for_board<7, 10>(depth, results, filter_forced);
    else if (width == 7 && height == 11) generate_positions_for_board<7, 11>(depth, results, filter_forced);
    else if (width == 7 && height == 12) generate_positions_for_board<7, 12>(depth, results, filter_forced);
    else if (width == 8 && height == 4) generate_positions_for_board<8, 4>(depth, results, filter_forced);
    else if (width == 8 && height == 5) generate_positions_for_board<8, 5>(depth, results, filter_forced);
    else if (width == 8 && height == 7) generate_positions_for_board<8, 7>(depth, results, filter_forced);
    else if (width == 8 && height == 9) generate_positions_for_board<8, 9>(depth, results, filter_forced);
    else if (width == 8 && height == 10) generate_positions_for_board<8, 10>(depth, results, filter_forced);
    else if (width == 8 && height == 11) generate_positions_for_board<8, 11>(depth, results, filter_forced);
    else if (width == 8 && height == 12) generate_positions_for_board<8, 12>(depth, results, filter_forced);
    else if (width == 9 && height == 4) generate_positions_for_board<9, 4>(depth, results, filter_forced);
    else if (width == 9 && height == 5) generate_positions_for_board<9, 5>(depth, results, filter_forced);
    else if (width == 9 && height == 8) generate_positions_for_board<9, 8>(depth, results, filter_forced);
    else if (width == 9 && height == 10) generate_positions_for_board<9, 10>(depth, results, filter_forced);
    else if (width == 9 && height == 11) generate_positions_for_board<9, 11>(depth, results, filter_forced);
    else if (width == 9 && height == 12) generate_positions_for_board<9, 12>(depth, results, filter_forced);
    else if (width == 10 && height == 4) generate_positions_for_board<10, 4>(depth, results, filter_forced);
    else if (width == 10 && height == 5) generate_positions_for_board<10, 5>(depth, results, filter_forced);
    else if (width == 10 && height == 6) generate_positions_for_board<10, 6>(depth, results, filter_forced);
    else if (width == 10 && height == 8) generate_positions_for_board<10, 8>(depth, results, filter_forced);
    else if (width == 10 && height == 9) generate_positions_for_board<10, 9>(depth, results, filter_forced);
    else if (width == 10 && height == 11) generate_positions_for_board<10, 11>(depth, results, filter_forced);
    else if (width == 11 && height == 5) generate_positions_for_board<11, 5>(depth, results, filter_forced);
    else if (width == 11 && height == 6) generate_positions_for_board<11, 6>(depth, results, filter_forced);
    else if (width == 11 && height == 7) generate_positions_for_board<11, 7>(depth, results, filter_forced);
    else if (width == 11 && height == 8) generate_positions_for_board<11, 8>(depth, results, filter_forced);
    else if (width == 11 && height == 9) generate_positions_for_board<11, 9>(depth, results, filter_forced);
    else if (width == 11 && height == 10) generate_positions_for_board<11, 10>(depth, results, filter_forced);
    else if (width == 12 && height == 4) generate_positions_for_board<12, 4>(depth, results, filter_forced);
    else if (width == 12 && height == 5) generate_positions_for_board<12, 5>(depth, results, filter_forced);
    else if (width == 12 && height == 6) generate_positions_for_board<12, 6>(depth, results, filter_forced);
    else if (width == 12 && height == 7) generate_positions_for_board<12, 7>(depth, results, filter_forced);
    else if (width == 12 && height == 8) generate_positions_for_board<12, 8>(depth, results, filter_forced);
    else if (width == 12 && height == 9) generate_positions_for_board<12, 9>(depth, results, filter_forced);
    else if (width == 9 && height == 7) generate_positions_for_board<9, 7>(depth, results, filter_forced);
    else if (width == 9 && height == 6) generate_positions_for_board<9, 6>(depth, results, filter_forced);
    else if (width == 11 && height == 4) generate_positions_for_board<11, 4>(depth, results, filter_forced);

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
    exports.Set(String::New(env, "_solveExact"), Function::New(env, SolveExact));
    exports.Set(String::New(env, "_solveHeuristic"), Function::New(env, SolveHeuristic));
    exports.Set(String::New(env, "_createBook"), Function::New(env, CreateBook));
    exports.Set(String::New(env, "_createBookFromBuffer"), Function::New(env, CreateBookFromBuffer));
    exports.Set(String::New(env, "_convertBookToDense"), Function::New(env, ConvertBookToDense));
    exports.Set(String::New(env, "_convertBookToEF"), Function::New(env, ConvertBookToEF));
    exports.Set(String::New(env, "_saveBookToFile"), Function::New(env, SaveBookToFile));
    exports.Set(String::New(env, "_getBookFormat"), Function::New(env, GetBookFormat));
    exports.Set(String::New(env, "_getBookScore"), Function::New(env, GetBookScore));
    exports.Set(String::New(env, "_getBookBuffer"), Function::New(env, GetBookBuffer));
    exports.Set(String::New(env, "_destroyBook"), Function::New(env, DestroyBook));
    exports.Set(String::New(env, "_stopSolver"), Function::New(env, StopSolver));
    exports.Set(String::New(env, "_getNodeCount"), Function::New(env, GetNodeCount));
    exports.Set(String::New(env, "_generatePositions"), Function::New(env, GeneratePositions));
    exports.Set(String::New(env, "_dumpBook"), Function::New(env, DumpBook));
    
    BookBuilder::Init(env, exports);
    return exports;
}

NODE_API_MODULE(connect4, Init)
''')
