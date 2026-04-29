# BaseConnect4Solver

`connect-4-solver` exports separate solver classes for each environment (Node.js, browser WASM, React Native). All share the same `BaseConnect4Solver` interface, so your code stays consistent across platforms.

## Constructor Options

Every solver accepts the following configuration object upon instantiation:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `width` | 7 | Board width columns |
| `height` | 6 | Board height rows |
| `cacheSizeMb` | 128 | Cache memory allocation in MB |
| `heuristic` | false | Uses the heuristic evaluator instead of the exact solver |

## Core Methods

### `init()`
Bootstraps the native module, WebAssembly binary, or WebWorker, and automatically allocates the memory cache. 
**Returns:** `Promise<void>`
*(Must be awaited before calling `analyze`)*.

### `analyze(position: string, options?: { threads?: number, maxDepth?: number, timeoutMs?: number, book?: OpeningBook })`
Computes the score for the current board state and evaluates all valid child move columns. 

**Options:**
- `threads`: Maximum number of worker threads allowed (default: `1`). Will be clamped to maximum allowed by the specific solver used.
- `maxDepth`: (Heuristic only) The maximum search depth before falling back to evaluation functions (default: `20`).
- `timeoutMs`: (Heuristic only) The maximum time in milliseconds to spend searching before returning the best result found so far (default: `25`).
- `book`: An optional `OpeningBook` instance to query for instant early-game solutions.

**Returns:** `Promise<PositionAnalysis>` (for async solvers) or `PositionAnalysis` (for sync solvers)

> **Queueing:** Multiple calls to `analyze()` will be queued sequentially per solver instance.

> **Thread Limits:** Each platform has an automatic thread limit. These may be configurable.

### Supported Board Sizes
The WASM bundle includes evaluators for the following board sizes:
`"6x5", "6x6", "7x6", "7x7", "8x6", "9x6", "8x8", "9x7", "11x4"`

> Additional sizes can be supported by compiling the C++ source with Emscripten yourself.

### `unload()`
Safely destroys the explicitly allocated pointers and frees the cache memory from RAM.
**Returns:** `void`

> **Note:** Once `unload()` is called, the solver instance is permanently destroyed and cannot be reused. Create a new solver to continue evaluating.

## Returned Types

### `PositionAnalysis`
The object returned when an `analyze()` call completes successfully.

```typescript
export interface PositionAnalysis {
  position: string; // Validated position (may differ if input was invalid)
  originalPosition: string; // Raw input string
  currentPlayer: "P1" | "P2"; // Whose turn it is at the analyzed position
  evaluation: Evaluation | null; // Overall evaluation of the position
  moveOptions: (Evaluation | null)[]; // Evaluation for playing in each column (index 0 = col 1)
  depthReached?: number; // (Heuristic only) The actual search depth the engine achieved before timing out
}
```

### `Evaluation`
Represents the calculated strength of a specific move sequence.

```typescript
export interface Evaluation {
  outcome: "Win" | "Loss" | "Draw";
  winner: "P1" | "P2" | null; // null when Draw
  movesToEnd: number | null; // null when Draw
  score: number; // Raw underlying score (positive = current player is winning)
}
```
