#!/bin/bash
echo "Waiting for train_nnue.py to finish..."

# Wait for the python process to exit
while pgrep -f "train_nnue.py" > /dev/null; do
    sleep 5
done

echo "Training finished! Exporting weights..."
source venv/bin/activate
cd tools
python3 export_weights.py

echo "Compiling benchmark..."
g++ -std=c++17 -W -Wall -O3 -march=native -DNDEBUG -pthread -I../native -DBOARD_WIDTH_MACRO=8 -DBOARD_HEIGHT_MACRO=8 test_20ms_accuracy_8x8.cpp ../native/Solver.cpp -o test_20ms_accuracy_8x8

echo "Running benchmark..."
./test_20ms_accuracy_8x8 > ../data/final_benchmark.txt

echo "Pipeline complete. Results saved to data/final_benchmark.txt"
