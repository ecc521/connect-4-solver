#!/bin/bash

# Compile and run the pure C++ benchmark for specific board sizes.
# This bypasses Node.js/WASM entirely and measures raw engine throughput.
#
# Usage:
#   bash tools/benchmarks/run_native_bench.sh [--size 7x6 8x8] [--heuristic] [--exact] [--solve] [--analyze]

SIZES=()
ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --size|--sizes)
            shift
            while [[ $# -gt 0 ]] && [[ ! "$1" == --* ]]; do
                SIZES+=("$1")
                shift
            done
            ;;
        *)
            ARGS+=("$1")
            shift
            ;;
    esac
done

if [ ${#SIZES[@]} -eq 0 ]; then
    for f in test-data/positions_*.txt; do
        [ -f "$f" ] || continue
        size=$(basename "$f" | sed 's/positions_//' | sed 's/.txt//')
        SIZES+=("$size")
    done
fi
if [ ${#SIZES[@]} -eq 0 ]; then
    SIZES=("7x6" "8x8")
fi

for SIZE in "${SIZES[@]}"; do
    WIDTH=$(echo $SIZE | cut -d'x' -f1)
    HEIGHT=$(echo $SIZE | cut -d'x' -f2)

    BIN="tools/benchmarks/bench_native_${SIZE}"

    echo "Compiling core engine for ${SIZE}..."
    clang++ -std=c++20 -O3 -DNDEBUG -DUSE_PTHREADS -Inative -march=native \
        -DBOARD_WIDTH_MACRO=${WIDTH} -DBOARD_HEIGHT_MACRO=${HEIGHT} \
        tools/benchmarks/bench_native.cpp \
        -o ${BIN}

    if [ $? -eq 0 ]; then
        ./${BIN} "${ARGS[@]}"
        rm -f ${BIN}
    else
        echo "Compilation failed for ${SIZE}."
        exit 1
    fi
done
