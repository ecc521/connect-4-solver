# HeuristicConnect4Solver

The `HeuristicConnect4Solver` is designed for ultra-large boards (e.g. `8x8`, `9x9`, `10x10`) where absolute mathematical solving to terminal depth is physically impossible due to game-tree complexity limits.

Instead of running a full exact Alpha-Beta pass, this solver truncates the search tree after a specific timeout or depth, returning the best estimated (heuristic) move based on positional evaluations.

**Import:** 
```typescript
import { HeuristicConnect4Solver } from "connect-4-solver/heuristic";
```

::: warning ⚠️ Separate Cache Memory
Heuristic solvers evaluate non-terminal states and require an entirely different native pointer layout. You cannot share an exact `SolverCache` with a heuristic solver. You must explicitly instantiate a `HeuristicSolverCache`.
:::

## Constructor
```typescript
new HeuristicConnect4Solver(width: number, height: number);
// OR explicitly pass a cache:
new HeuristicConnect4Solver({ width: number, height: number, cache: HeuristicSolverCache });
```

## Methods

Inherits core memory lifecycle methods ([`init()`](./standard.md#init), [`unload()`](./standard.md#unload), [`loadBook()`](./standard.md#loadbook-bookdata-uint8array)) from the standard `Connect4Solver`.

### `analyze(position: string, opts?: { maxDepth?: number; timeoutMs?: number; threads?: number })`
Evaluates the board based on a heuristic cutoff.
- `maxDepth`: Forces the search to stop extending the tree at a specified depth.
- `timeoutMs`: Stops the search early if calculation time exceeds the specified millisecond boundary.
**Returns:** `PositionAnalysis` (scores will be non-terminal estimates, meaning they won't strictly map to -1, 0, or 1 outcomes).
