# Partitioned BFS State Counts (Sylvan BDD Engine)

Calculating state counts for massive Connect-4 board sizes like $7\times8$ and $8\times7$ requires substantial memory resources. If a single-pass run is attempted, the Binary Decision Diagram (BDD) size exceeds the available physical memory, resulting in Out-of-Memory (OOM) failures.

To solve this, we partition the Breadth-First Search (BFS) state space using **Negative-Constraint BDD Partitioning** and combine the results using the **Inclusion-Exclusion Principle**. This allows us to run the computations in independent, memory-bounded phases.

---

## 1. Resource & Partition Summary

The following table summarizes the partitions, peak memory allocations, and execution footprints for these massive boards:

|   Board Size   | Partitions | Peak BDD Nodes (Single Partition) | Memory Allocated per Partition | Total Execution Time (Sequential) |    Total Legal States    |
| :------------: | :--------: | :-------------------------------: | :----------------------------: | :-------------------------------: | :----------------------: |
| **$8\times7$** |     3      |           1.03 Billion            |             105 GB             |            ~5.16 Hours            | `16,201,664,614,728,216` |
| **$7\times8$** |     9      |           1.52 Billion            |             105 GB             |            ~8.70 Hours            | `5,518,269,672,329,901`  |

### Why $7\times8$ Required More Partitions than $8\times7$

Although both boards have the same area (56 cells), the column-major BDD variable ordering used in our solver makes BDDs for height-8 columns deeper and mathematically more complex. A 3-way partition on a single column still exceeded Sylvan's node table limits. By partitioning across **two columns**, the peak BDD size of the largest partition was reduced by approximately a factor of 4, keeping the nodes well within table capacity limits.

---

## 2. Partition Formulas (Inclusion-Exclusion)

At the bottom of any column $A$, there are exactly three mutually exclusive and exhaustive configurations for the cell:

1. $p_A$: Player 1 occupies the cell.
2. $q_A$: Player 2 occupies the cell.
3. $e_A$: The cell is empty ($\neg p_A \land \neg q_A$).

As indicator functions over the state space, these sum to 1:
$$p_A + q_A + e_A = 1$$

We define our negative constraint filters as:

- $mA = \neg q_A$ (Exclude Player 2 from $A$)
- $nA = \neg p_A$ (Exclude Player 1 from $A$)
- $eA = \neg p_A \land \neg q_A$ ($A$ is empty)

These filters satisfy the algebraic identity:
$$mA + nA - eA = 1$$

### A. 3-Way Single-Column Partition (Used for 8x7)

To partition on a single center column $A$:
$$\text{Total} = P_1 + P_2 - P_3$$
Where:

- $P_1$ = Run BFS excluding Player 2 from column $A$ ($mA$)
- $P_2$ = Run BFS excluding Player 1 from column $A$ ($nA$)
- $P_3$ = Run BFS with column $A$ completely empty ($eA$)

---

### B. 9-Way Two-Column Partition (Used for 7x8)

Multiplying the algebraic identities for columns $A$ and $B$:
$$(mA + nA - eA)(mB + nB - eB) = 1$$

Expanding this product yields 9 terms:
$$\text{Total} = Q_4 + Q_5 - Q_6 + Q_7 + Q_8 - Q_9 - Q_{10} - Q_{11} + Q_{12}$$

Where each $Q_i$ is a BFS run with a specific filter mask:

- **$Q_4$ (Partition 4):** $mA \cdot mB$ (Exclude P2 from $A$, Exclude P2 from $B$)
- **$Q_5$ (Partition 5):** $mA \cdot nB$ (Exclude P2 from $A$, Exclude P1 from $B$)
- **$Q_6$ (Partition 6):** $mA \cdot eB$ (Exclude P2 from $A$, $B$ empty)
- **$Q_7$ (Partition 7):** $nA \cdot mB$ (Exclude P1 from $A$, Exclude P2 from $B$)
- **$Q_8$ (Partition 8):** $nA \cdot nB$ (Exclude P1 from $A$, Exclude P1 from $B$)
- **$Q_9$ (Partition 9):** $nA \cdot eB$ (Exclude P1 from $A$, $B$ empty)
- **$Q_{10}$ (Partition 10):** $eA \cdot mB$ ($A$ empty, Exclude P2 from $B$)
- **$Q_{11}$ (Partition 11):** $eA \cdot nB$ ($A$ empty, Exclude P1 from $B$)
- **$Q_{12}$ (Partition 12):** $eA \cdot eB$ ($A$ empty, $B$ empty)

---

## 3. C++ Solver Implementation

The partitioning filters are implemented natively inside [compute_sylvan_counts.cpp](./compute_sylvan_counts.cpp) under the `--partition` (`-p`) flag (modes 1–12).

For example, the two-column 9-way partition logic (modes 4–12) is initialized as:

```cpp
int A = W / 2;
int B = W / 2 - 1;

Bdd nA = !p[A][0]; // Exclude P1 from A
Bdd mA = !q[A][0]; // Exclude P2 from A
Bdd eA = (!p[A][0]) * (!q[A][0]); // col A empty

Bdd nB = !p[B][0]; // Exclude P1 from B
Bdd mB = !q[B][0]; // Exclude P2 from B
Bdd eB = (!p[B][0]) * (!q[B][0]); // col B empty

if (partition_mode == 4)       filter_mask = mA * mB;
else if (partition_mode == 5)  filter_mask = mA * nB;
else if (partition_mode == 6)  filter_mask = mA * eB;
else if (partition_mode == 7)  filter_mask = nA * mB;
else if (partition_mode == 8)  filter_mask = nA * nB;
else if (partition_mode == 9)  filter_mask = nA * eB;
else if (partition_mode == 10) filter_mask = eA * mB;
else if (partition_mode == 11) filter_mask = eA * nB;
else if (partition_mode == 12) filter_mask = eA * eB;
```

Inside the BFS loop, the filter is applied at the beginning of each level $d$:

```cpp
if (partition_mode > 0) {
    S = S * filter_mask;
}
```

This prunes paths violating the constraints, reducing BDD nodes at intermediate levels.
