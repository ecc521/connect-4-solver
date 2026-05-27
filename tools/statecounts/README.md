# Connect-4 State Counts (Sylvan Engine)

This directory contains a specialized script to compute the exact number of legal game states for massive Connect-4 board sizes using the Sylvan BDD (Binary Decision Diagram) engine.

## Setup

Because of the massive scale of the larger boards, this solver is written in C++ and utilizes the Sylvan multi-core BDD framework.

1. Ensure you have CMake and a C++17 compiler installed.
2. In the `tools/statecounts/` directory, clone the Sylvan library:
```bash
git clone https://github.com/trolando/sylvan.git
cd sylvan
mkdir build && cd build
cmake ..
make -j
```
3. Return to the `tools/statecounts/` directory and build the solver:
```bash
cd ..
make compute_sylvan_counts
```

## Usage

We provide a Python orchestrator [compute_board.py](./compute_board.py) to execute the BDD solver. It supports standard single-pass runs as well as partitioned runs for massive boards.

The script accepts the following arguments:
* `-w`, `--width`: Board width (required)
* `-H`, `--height`: Board height (required)
* `-r`, `--ram`: RAM limit in GB (required)
* `-m`, `--mode`: Partitioning mode (`none`, `3-way`, `9-way`) (required)
* `-t`, `--threads`: Number of Sylvan threads (optional, default auto-detect)
* `-o`, `--order`: Variable ordering (`col`/`row`) (optional, default `col`)

### Example: Standard 7x6 Run (Requires ~8GB RAM)
The standard $7\times6$ board is perfectly viable on modern laptops in a single pass:
```bash
python3 compute_board.py -w 7 -H 6 -r 8 -m none
```

### Example: Partitioned 8x7 Run (Requires ~106GB RAM)
The $8\times7$ board can be solved using the center column 3-way partition:
```bash
python3 compute_board.py -w 8 -H 7 -r 106 -m 3-way
```

### Example: Partitioned 7x8 Run (Requires ~106GB RAM)
The $7\times8$ board has a deep height of 8, causing BDD node counts to swell during intermediate levels. We solve it using the two-column 9-way partition:
```bash
python3 compute_board.py -w 7 -H 8 -r 106 -m 9-way
```

## Out of Memory Errors
If you request a computation that requires more intermediate nodes than your provided RAM can physically store, Sylvan will throw a fatal `sylvan_unique_table_full` error and crash. To fix this, you must run the computation on a machine with more physical RAM and increase the `--ram` argument. Alternatively, you can use partitioning (such as the `3-way` or `9-way` modes in `compute_board.py`) to reduce the peak RAM requirements by splitting the BDD state space into smaller, independent sub-problems.

## Partitioned BFS for Massive Boards (7x8 and 8x7)
For boards larger than available memory space, we use a partitioned BFS scheme based on Negative-Constraint BDD Partitioning and the Inclusion-Exclusion Principle.

See the detailed [Partitioning Methodology](./PARTITIONING.md) guide for:
- Mathematical proof of Negative Constraints (preserving Level 0 empty board states).
- 3-Way single-column partitioning formula for $8\times7$.
- 9-Way two-column partitioning formula for $7\times8$.
- Using `compute_board.py` to run partitions sequentially and automatically aggregate counts.

