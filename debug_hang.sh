#!/bin/bash
./bench_dyn &
PID=$!
sleep 15
echo "Interrupting PID $PID..."
lldb --batch -o bt -o quit -p $PID
kill -9 $PID
