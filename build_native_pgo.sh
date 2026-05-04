#!/bin/bash
set -e

# Profile-Guided Optimization (PGO) build pipeline for the native addon.
# 
# This script:
# 1. Compiles an instrumented C++ benchmark binary for multiple board sizes
# 2. Runs the benchmark to generate profile data (2s budget per size, same as bench.ts)
# 3. Merges the profiles into default.profdata
# 4. The calling script (build:native:pgo or build_wasm_pgo.sh) then uses this data.
#
# Uses thread-safe PGO (-fprofile-update=atomic) for accurate multi-threaded profiling.

# We use clang++ because it has standard support for PGO on both macOS and Linux.
CXX="clang++"
if ! command -v clang++ &> /dev/null; then
    CXX="g++"
fi

# Auto-discover board sizes from test-data/ (profile all available sizes)
SIZES=()
for f in test-data/positions_*.txt; do
    size=$(basename "$f" | sed 's/positions_//' | sed 's/.txt//')
    if [[ "$size" =~ ^[0-9]+x[0-9]+$ ]]; then
        SIZES+=("$size")
    fi
done
if [ ${#SIZES[@]} -eq 0 ]; then
    SIZES=("7x6" "8x8" "9x7" "10x10")
    echo "  Warning: No test-data found, using default sizes"
fi
echo "  Discovered ${#SIZES[@]} board sizes: ${SIZES[*]}"

# Clean any stale profiling data from previous runs
rm -f *.profraw *.profdata

echo "═══════════════════════════════════════════════"
echo " PGO Phase 1: Compiling Instrumented Binaries"
echo "═══════════════════════════════════════════════"

if [ "$CXX" = "clang++" ]; then
    GEN_FLAGS="-fprofile-instr-generate -fcoverage-mapping -fprofile-update=atomic"
    USE_FLAGS="-fprofile-instr-use=default.profdata"
else
    GEN_FLAGS="-fprofile-generate -fprofile-update=atomic"
    USE_FLAGS="-fprofile-use"
fi

# Compile all sizes in parallel
for SIZE in "${SIZES[@]}"; do
    WIDTH=$(echo $SIZE | cut -d'x' -f1)
    HEIGHT=$(echo $SIZE | cut -d'x' -f2)
    echo "  Compiling ${SIZE}..."
    MARCH_FLAG="-march=native"
    if [ "$SKIP_NATIVE_MARCH" = "true" ]; then
        MARCH_FLAG=""
    fi
    $CXX --std=c++20 -W -Wall -O3 $GEN_FLAGS -DNDEBUG -DUSE_PTHREADS -Inative $MARCH_FLAG \
        -DBOARD_WIDTH_MACRO=${WIDTH} -DBOARD_HEIGHT_MACRO=${HEIGHT} \
        tools/benchmarks/bench_native.cpp \
        -o tools/benchmarks/bench_native_${SIZE}_pgo &
done
wait

echo ""
echo "═══════════════════════════════════════════════"
echo " PGO Phase 2: Generating Profile Data"
echo "═══════════════════════════════════════════════"

# Run each size benchmark with --pgo for minimal workload
# Sizes with 0 valid positions will exit non-zero; that's fine
for SIZE in "${SIZES[@]}"; do
    echo "  Profiling ${SIZE}..."
    LLVM_PROFILE_FILE="${SIZE}.profraw" ./tools/benchmarks/bench_native_${SIZE}_pgo --pgo --budget 10000 2>/dev/null || true
done

echo ""
echo "═══════════════════════════════════════════════"
echo " PGO Phase 3: Merging Profile Data"
echo "═══════════════════════════════════════════════"

if [ "$CXX" = "clang++" ]; then
    PROFRAW_FILES=""
    for SIZE in "${SIZES[@]}"; do
        PROFRAW_FILES="${PROFRAW_FILES} ${SIZE}.profraw"
    done
    xcrun llvm-profdata merge -output=default.profdata $PROFRAW_FILES 2>/dev/null || \
        llvm-profdata merge -output=default.profdata $PROFRAW_FILES
    echo "  Merged into default.profdata"
fi

# Clean up instrumented binaries (keep profdata)
for SIZE in "${SIZES[@]}"; do
    rm -f tools/benchmarks/bench_native_${SIZE}_pgo
    rm -f ${SIZE}.profraw
done

echo ""
echo "═══════════════════════════════════════════════"
echo " PGO Profile generation complete!"
echo " Profile data saved to: default.profdata"
echo "═══════════════════════════════════════════════"
