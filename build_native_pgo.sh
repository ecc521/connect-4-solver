#!/bin/bash
set -e

# We use clang++ because it has standard support for PGO on both macOS and Linux.
# g++ on macOS is an alias for clang++, but on Linux it is GCC. We prefer clang if available.
CXX="clang++"
if ! command -v clang++ &> /dev/null; then
    CXX="g++"
fi

# Clean any stale profiling data from previous runs to prevent out-of-date warnings
rm -f *.profraw *.profdata default.profraw default.profdata

echo "Building Native Benchmark with PGO Generation ($CXX)..."
if [ "$CXX" = "clang++" ]; then
    GEN_FLAGS="-fprofile-instr-generate"
    USE_FLAGS="-fprofile-instr-use=default.profdata"
else
    GEN_FLAGS="-fprofile-generate"
    USE_FLAGS="-fprofile-use"
fi

$CXX --std=c++20 -W -Wall -O3 -flto $GEN_FLAGS -DNDEBUG -DUSE_PTHREADS -Inative -march=native -DBOARD_WIDTH_MACRO=7 -DBOARD_HEIGHT_MACRO=6 tools/benchmarks/bench_native.cpp native/Solver.cpp -o tools/benchmarks/bench_native_7x6_pgo

echo "Running benchmark to generate profile data..."
./tools/benchmarks/bench_native_7x6_pgo

if [ "$CXX" = "clang++" ]; then
    echo "Merging Profile Data..."
    xcrun llvm-profdata merge -output=default.profdata default.profraw 2>/dev/null || llvm-profdata merge -output=default.profdata default.profraw
fi

echo "Building final benchmark with PGO Use..."
$CXX --std=c++20 -W -Wall -O3 -flto $USE_FLAGS -DNDEBUG -DUSE_PTHREADS -Inative -march=native -DBOARD_WIDTH_MACRO=7 -DBOARD_HEIGHT_MACRO=6 tools/benchmarks/bench_native.cpp native/Solver.cpp -o tools/benchmarks/bench_native_7x6_pgo_optimized

echo "Running optimized benchmark..."
./tools/benchmarks/bench_native_7x6_pgo_optimized

echo "Cleaning up..."
rm -f tools/benchmarks/bench_native_7x6_pgo default.profraw default.profdata

echo "Done!"
