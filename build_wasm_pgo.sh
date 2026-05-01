#!/bin/bash
set -e

# Clean any stale profiling data from previous runs to prevent out-of-date warnings
rm -f *.profraw *.profdata default.profraw default.profdata

echo "Building WASM Benchmarks with PGO Instrumentation..."
emcc -O3 -flto -std=c++17 -fprofile-generate -DCACHE_BUCKET_SIZE=2 -DNDEBUG -DUSE_PTHREADS -s WASM=1 -s SINGLE_FILE=1 -s NODERAWFS=1 -s ALLOW_MEMORY_GROWTH=1 tools/benchmarks/bench_native.cpp native/Solver.cpp -o build/bench_native_pgo.js -s ENVIRONMENT=node -s EXIT_RUNTIME=1

echo "Running WASM Benchmarks to Generate Profile Data..."
node build/bench_native_pgo.js

echo "Merging Profile Data..."
llvm-profdata merge -output=default.profdata default.profraw



echo "Building Final WASM with PGO..."
export PGO_FLAGS="-fprofile-use=default.profdata"
bash build.sh

echo "Cleaning up..."
rm build/bench_native_pgo.js default.profraw default.profdata

echo "WASM PGO Build Complete!"
