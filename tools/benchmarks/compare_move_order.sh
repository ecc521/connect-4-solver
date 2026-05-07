#!/bin/bash
# compare_move_order.sh
# Compares 4 move-ordering strategies across 5 board sizes.
# Uses generated mid-game positions (fresh TT per position) for reproducible node counts.
# Compiles and runs all 20 strategy×size combinations in parallel.
#
# Usage: bash tools/benchmarks/compare_move_order.sh
#   (run from repo root)

set -e
cd "$(git rev-parse --show-toplevel)"

SIZES=(7x6 8x8 10x7 12x7 13x7)
STRAT_IDS=(0 1 2 3)
STRAT_NAMES=(
  "S0: baseline (moveScore)"
  "S1: two-tier (immediate 2x)"
  "S2: three-tier kenshin"
  "S3: immediate-only"
)

# Fresh-TT mode: each position solved with a cold TT for isolated node counts.
# Per-position timeout: solver-level abort after TIMEOUT_MS ms.
TIMEOUT_MS=10000
BUDGET_MS=9999999
export CACHE_MB=16

TMPDIR_BIN=$(mktemp -d /tmp/mo_bench_XXXXXX)
TMPDIR_OUT=$(mktemp -d /tmp/mo_out_XXXXXX)
trap "rm -rf $TMPDIR_BIN $TMPDIR_OUT" EXIT

echo ""
echo "=========================================="
echo " Move Ordering Strategy Comparison"
echo " Cache: ${CACHE_MB}MB  Fresh-TT  Timeout/pos: ${TIMEOUT_MS}ms"
echo " Compiling ${#STRAT_IDS[@]} strategies × ${#SIZES[@]} sizes in parallel..."
echo "=========================================="

# ---- Compile phase (all 20 binaries in parallel) ----
PIDS_COMPILE=()
for SIZE in "${SIZES[@]}"; do
  W=$(echo "$SIZE" | cut -d'x' -f1)
  H=$(echo "$SIZE" | cut -d'x' -f2)
  for STRAT in "${STRAT_IDS[@]}"; do
    BIN="$TMPDIR_BIN/bench_${SIZE}_s${STRAT}"
    LOG="$TMPDIR_OUT/compile_${SIZE}_s${STRAT}.log"
    clang++ -std=c++20 -O3 -flto -DNDEBUG -DUSE_PTHREADS -Inative \
      -DBOARD_WIDTH_MACRO="${W}" -DBOARD_HEIGHT_MACRO="${H}" \
      -DMOVE_ORDER_STRATEGY="${STRAT}" \
      tools/benchmarks/bench_native.cpp \
      -o "$BIN" >"$LOG" 2>&1 &
    PIDS_COMPILE+=($!)
  done
done

# Wait for all compilations; report failures
COMPILE_FAILED=0
for PID in "${PIDS_COMPILE[@]}"; do
  wait "$PID" || COMPILE_FAILED=1
done
if [ "$COMPILE_FAILED" -ne 0 ]; then
  echo "ERROR: One or more compilations failed. Logs:"
  for SIZE in "${SIZES[@]}"; do
    for STRAT in "${STRAT_IDS[@]}"; do
      LOG="$TMPDIR_OUT/compile_${SIZE}_s${STRAT}.log"
      if [ -s "$LOG" ]; then echo "--- ${SIZE} S${STRAT} ---"; head -10 "$LOG"; fi
    done
  done
  exit 1
fi
echo "All binaries compiled."

# ---- Run phase (all 20 benchmarks in parallel) ----
echo "Running benchmarks in parallel..."
PIDS_RUN=()
for SIZE in "${SIZES[@]}"; do
  for STRAT in "${STRAT_IDS[@]}"; do
    BIN="$TMPDIR_BIN/bench_${SIZE}_s${STRAT}"
    OUT="$TMPDIR_OUT/result_${SIZE}_s${STRAT}.txt"
    FILE="tools/benchmarks/mo_test_${SIZE}.txt"
    CACHE_MB="${CACHE_MB}" "$BIN" --exact --solve --fresh \
      --file="$FILE" \
      --budget "$BUDGET_MS" \
      --timeout "$TIMEOUT_MS" >"$OUT" 2>/dev/null &
    PIDS_RUN+=($!)
  done
done
for PID in "${PIDS_RUN[@]}"; do wait "$PID" || true; done
echo "All benchmarks complete."

# ---- Results table ----
echo ""
# Determine column count from SIZES
HEADER="%-34s"
SEP=""
for SIZE in "${SIZES[@]}"; do
  HEADER="${HEADER} | %14s"
  SEP="${SEP}----------------+-"
done
HEADER="${HEADER} | %14s"
printf "${HEADER}\n" "Strategy" "${SIZES[@]}" "total"
printf "%s\n" "$(printf '%0.s-' {1..160})"

for STRAT in "${STRAT_IDS[@]}"; do
  TOTAL=0
  ROW_NODES=()
  for SIZE in "${SIZES[@]}"; do
    OUT="$TMPDIR_OUT/result_${SIZE}_s${STRAT}.txt"
    # fresh-TT output uses "solve()*" marker; nodes are field $17 in whitespace split
    NODES=$(awk '/solve\(\)\*/{print $17; exit}' "$OUT" 2>/dev/null)
    NODES=${NODES:-0}
    ROW_NODES+=("$NODES")
    TOTAL=$((TOTAL + NODES))
  done
  printf "%-34s" "${STRAT_NAMES[$STRAT]}"
  for N in "${ROW_NODES[@]}"; do printf " | %14s" "$N"; done
  printf " | %14s\n" "$TOTAL"
done

echo ""
echo "Lower node count = better pruning efficiency."
echo "Mode: solve(strong, fresh-TT per position, ${CACHE_MB}MB, ${TIMEOUT_MS}ms/pos)"
echo "Positions: mid-game generated (fixed seed 42), score=0 placeholder (parity not validated)"
