#!/bin/bash
set -e

SIZES=("6x5" "6x6" "7x7" "8x6" "8x8" "9x7" "7x8" "10x10")

for SIZE in "${SIZES[@]}"; do
    W=$(echo $SIZE | cut -d'x' -f1)
    H=$(echo $SIZE | cut -d'x' -f2)
    echo "Re-generating $SIZE..."
    
    FILE="../test-data/positions_$SIZE.txt"
    if [ ! -f "$FILE" ]; then
        echo "File $FILE not found, skipping."
        continue
    fi

    # Compile solver for this size
    g++ -O3 -std=c++17 -DNDEBUG -I../native -DBOARD_WIDTH_MACRO=$W -DBOARD_HEIGHT_MACRO=$H ../native/Solver.cpp main.cpp -o solver_temp -lpthread
    
    # Filter for valid positions, solve, and save
    # We look for lines starting with a move (1-9 or a-z)
    grep -E '^[1-9a-zA-Z]+' "$FILE" | cut -d' ' -f1 | ./solver_temp --memory 134217728 > "$FILE.new"
    
    mv "$FILE.new" "$FILE"
    rm solver_temp
done

echo "Done!"
