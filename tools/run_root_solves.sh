#!/usr/bin/env bash
# run_root_solves.sh — build and run three opening-book solves:
#   7×6  depth 16
#   7×7  depth 18
#   7×8  depth auto (≤20, chosen to stay under ~100 MB based on 7×7 output size)
#
# Run from tools/ (or anywhere — script cd's to tools/ automatically):
#   ./run_root_solves.sh
#   ./run_root_solves.sh --oracle ../data/some.book   # feed an existing book as oracle
#
# Ctrl-C stops the current solve cleanly (atomic abort), then exits.

set -euo pipefail
cd "$(dirname "$0")"

DATA_DIR="$(pwd)/../data"
mkdir -p "$DATA_DIR"

ORACLE_FLAG=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --oracle) ORACLE_FLAG=(--oracle "$2"); shift 2 ;;
        *) echo "Unknown argument: $1" >&2; exit 1 ;;
    esac
done

file_size() {
    if [[ "$(uname)" == "Darwin" ]]; then
        stat -f%z "$1"
    else
        stat -c%s "$1"
    fi
}

# ── 1. Build binaries ────────────────────────────────────────────────────────
echo "=== Building binaries ==="
make build_strategy_book_7x6
make build_strategy_book_7x7
make build_strategy_book_7x8
echo ""

# ── 2. 7×6 depth 16 ─────────────────────────────────────────────────────────
OUT_7X6="$DATA_DIR/7x6_strategy16.book"
echo "================================================================="
echo "  7×6  depth 16  →  $OUT_7X6"
echo "================================================================="
./build_strategy_book_7x6 --depth 16 "${ORACLE_FLAG[@]}" --out "$OUT_7X6"
SZ_7X6=$(file_size "$OUT_7X6")
echo "  File: $(( SZ_7X6 / 1024 )) KB"
echo ""

# ── 3. 7×7 depth 18 ─────────────────────────────────────────────────────────
OUT_7X7="$DATA_DIR/7x7_strategy18.book"
echo "================================================================="
echo "  7×7  depth 18  →  $OUT_7X7"
echo "================================================================="
./build_strategy_book_7x7 --depth 18 "${ORACLE_FLAG[@]}" --out "$OUT_7X7"
SZ_7X7=$(file_size "$OUT_7X7")
echo "  File: $(( SZ_7X7 / 1024 )) KB"
echo ""

# ── 4. 7×8: auto-select depth ────────────────────────────────────────────────
#    Scale based on 7×7 output size to stay well under 100 MB:
#      7×7 < 5 MB  → 7×8 depth 20
#      7×7 < 20 MB → 7×8 depth 18
#      7×7 < 60 MB → 7×8 depth 16
#      else        → 7×8 depth 14
if   (( SZ_7X7 < 5000000  )); then D78=20
elif (( SZ_7X7 < 20000000 )); then D78=18
elif (( SZ_7X7 < 60000000 )); then D78=16
else                                D78=14; fi

OUT_7X8="$DATA_DIR/7x8_strategy${D78}.book"
echo "================================================================="
echo "  7×8  depth ${D78}  (auto: 7×7 was $(( SZ_7X7 / 1024 )) KB)  →  $OUT_7X8"
echo "================================================================="
./build_strategy_book_7x8 --depth "$D78" "${ORACLE_FLAG[@]}" --out "$OUT_7X8"
SZ_7X8=$(file_size "$OUT_7X8")
echo "  File: $(( SZ_7X8 / 1024 )) KB"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "================================================================="
echo "  All solves complete"
echo ""
printf "  %-18s  %7d KB  %s\n" "7x6  depth 16"  $(( SZ_7X6 / 1024 )) "$OUT_7X6"
printf "  %-18s  %7d KB  %s\n" "7x7  depth 18"  $(( SZ_7X7 / 1024 )) "$OUT_7X7"
printf "  %-18s  %7d KB  %s\n" "7x8  depth $D78" $(( SZ_7X8 / 1024 )) "$OUT_7X8"
echo "================================================================="
