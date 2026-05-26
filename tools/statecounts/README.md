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

The solver uses a column-major node expansion order.
You MUST provide the `--ram <GB>` flag to instruct the solver on how much memory it can safely allocate. Because Sylvan tables must be precise powers of 2, the script will automatically round down the requested gigabytes to the nearest safe mathematical tier.

### Example: Computing 6x8 on a Desktop (Requires 48GB+ RAM)
The $6\times8$ board peaks at 900 Million intermediate nodes, requiring a massive 48 GB table limit. 
```bash
./compute_sylvan_counts -w 6 -h 8 --ram 64
```

### Example: Computing 7x6 on a Laptop (Requires ~8GB RAM)
The standard $7\times6$ board is perfectly viable on modern laptops.
```bash
./compute_sylvan_counts -w 7 -h 6 --ram 8
```

## Out of Memory Errors
If you request a computation that requires more intermediate nodes than your provided RAM can physically store, Sylvan will throw a fatal `sylvan_unique_table_full` error and crash. To fix this, you must run the computation on a machine with more physical RAM and increase the `--ram` argument.

## Partitioned BFS for Massive Boards (7x8 and 8x7)
For boards larger than available memory space, we use a partitioned BFS scheme based on Negative-Constraint BDD Partitioning and the Inclusion-Exclusion Principle.

See the detailed [Partitioning Methodology](./PARTITIONING.md) guide for:
- Mathematical proof of Negative Constraints (preserving Level 0 empty board states).
- 3-Way single-column partitioning formula for $8\times7$.
- 9-Way two-column partitioning formula for $7\times8$.
- Using `compute_board.py` to run partitions sequentially and automatically aggregate counts.

