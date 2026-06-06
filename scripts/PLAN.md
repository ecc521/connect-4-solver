# Plan - Connect-4 Solver Build Compilation Fix

## Problem Description

1. The compilation of the WASM target in `connect-4-solver-submodule` fails during the build step using Emscripten.
2. In `native/analyze.cpp`, `solveHeuristic` attempts to use `DISPATCH_HEURISTIC` which relies on `align` and `wrap` variables being in scope. However, these variables are not declared in `solveHeuristic`.
3. In `native/analyze.cpp`, `createBookFromBuffer` uses `DISPATCH_STATIC` to dispatch to `runCreateBook`. `DISPATCH_STATIC` expects `ACTION` to accept 4 template parameters (`W, H, ALIGN, WRAP`). However, `runCreateBook` is only defined with 2 template parameters (`W, H`), leading to a compilation substitution failure.

## Rationale

We need to:

- Declare `int align = 4; bool wrap = false;` in `solveHeuristic` in `native/analyze.cpp` so they are in scope for the dispatcher macro.
- Add template parameters `int ALIGN` and `bool WRAP` to `runCreateBook` template definition in `native/analyze.cpp` so it matches the 4-parameter template instantiation in `DISPATCH_STATIC`.

This will allow the WebAssembly modules to compile successfully.
