# BaseConnect4Solver

`connect-4-solver` exports separate solver classes for each environment (Node.js, browser WASM, React Native). All share the same `BaseConnect4Solver` interface, so your code stays consistent across platforms.

## Constructor Options

Every solver accepts the following configuration object upon instantiation:

| Parameter     | Default | Description                                              |
| ------------- | ------- | -------------------------------------------------------- |
| `width`       | 7       | Board width columns                                      |
| `height`      | 6       | Board height rows                                        |
| `cacheSizeMb` | 100     | Cache memory allocation in MB                            |
| `heuristic`   | false   | Uses the heuristic evaluator instead of the exact solver |

## Core Methods

### `init()`

Bootstraps the native module, WebAssembly binary, or WebWorker, and automatically allocates the memory cache.
**Returns:** `Promise<void>`
_(Must be awaited before calling `analyze`)_.

### `analyze(position: string, options?: AnalyzeOptions)`

Computes the score for the current board state and evaluates all valid child move columns.

**Options:**

- `threads`: Maximum number of worker threads allowed (default: `1`). Will be clamped to the maximum allowed by the specific solver used.
- `maxDepth`: (Heuristic only) The maximum search depth before falling back to evaluation functions (default: `20`).
- `timeoutMs`: Maximum time in milliseconds to spend searching. On exact solvers, returns `aborted: true` if the search cannot complete in time. On heuristic solvers, returns the best depth found so far (default: `0` = no limit).
- `book`: An optional `OpeningBook` instance to query for instant early-game solutions.

**Returns:** `Promise<PositionAnalysis>`

> **Thread Limits:** Each Solver's thread count is internally capped at the lesser of one-per-column and platform-specific limits. While this guarantees threads never perform wasted effort, it means that some threads will exit early, resulting in sub-linear speedups with additional threads.

### `solve(position: string, options?: AnalyzeOptions & { weak?: boolean })`

Performs a **Fast Search** for the best move and score.

Unlike `analyze()`, which evaluates every possible column to create a heat-map, `solve()` uses an aggressive alpha-beta prune (null-window search) to find the best move as quickly as possible. This is typically **3-5x faster** than `analyze()` and is recommended for engine-vs-engine play or hint systems.

**Options:**

- `weak`: (Exact only) If `true`, the solver only determines if the position is a Win, Loss, or Draw, without calculating the exact number of moves to the end (default: `false`).
- `maxDepth`: (Heuristic only) The maximum search depth.
- `timeoutMs`: Maximum search time. Returns `aborted: true` if the exact solver cannot complete in time.
- `book`: An optional `OpeningBook` instance.

**Returns:** `Promise<PositionAnalysis>`

> **Result Difference:** When using `solve()`, the `moveOptions` array in the returned `PositionAnalysis` will be empty. The best move is instead available in the top-level `bestMove` field.

### `stop()`

Signals the solver to abort the current search at the next opportunity.

**Platform behavior differs significantly:**

| Platform | Effective? | Notes |
|---|---|---|
| **Node.js native** | ✅ Yes | The search runs on a libuv thread pool worker; the main thread can write the abort flag concurrently |
| **React Native** | ❌ No | JNI binding not yet implemented; solver timeouts on its own |
| **All WASM** | ❌ No | The web worker's JS event loop is **blocked** by the synchronous WASM call. The stop signal queues up but cannot be delivered until the search returns |

> **On WASM, use `timeoutMs` exclusively.** The timeout is set as a wall-clock deadline *before* the search starts and is polled by the C++ negamax loop on every node — no JS interop required.

### `getNodeCount()`

Returns the total number of positions searched by this solver since the last `init()` call. Useful for benchmarking and debugging.

**Returns:** `Promise<number>`

> **Note:** Not all platforms support live node counts. The web worker solvers query the count asynchronously via a message round-trip; React Native currently returns `0` (JNI binding pending).

### `release()`

Safely destroys the explicitly allocated pointers and frees the cache memory from RAM.
**Returns:** `void`

> **Note:** Once `release()` is called, the solver instance is permanently destroyed and cannot be reused. Create a new solver to continue evaluating.

### Supported Board Sizes

The WASM bundle includes evaluators for the following board sizes:
`"6x5", "6x6", "7x6", "7x7", "8x6", "9x6", "8x8", "9x7", "11x4"`

> Additional sizes can be supported by compiling the C++ source with Emscripten yourself.

## Returned Types

### `PositionAnalysis`

The object returned when an `analyze()` or `solve()` call completes.

```typescript
export interface PositionAnalysis {
  position: string;              // Validated position (may differ if input was invalid)
  originalPosition: string;      // Raw input string
  currentPlayer: "P1" | "P2";  // Whose turn it is at the analyzed position
  evaluation: Evaluation | null; // Overall evaluation (null if aborted or invalid)
  moveOptions: (Evaluation | null)[]; // Per-column evaluations (empty when using solve())
  depthReached?: number;         // Actual search depth reached (heuristic only)
  isHeuristic: boolean;          // True if generated by the heuristic engine
  bestMove?: number;             // 0-indexed column of the best move (solve() only)
  nodes?: number;                // Total positions searched (solve() only)
  aborted?: boolean;             // True if the search was cut short by timeoutMs (exact only)
}
```

### `Evaluation`

Represents the calculated strength of a move or position.

```typescript
export interface Evaluation {
  eval: {
    value: number; // Decimal score:
                   //   Exact wins → +Infinity, exact losses → -Infinity, draws → 0
                   //   Heuristic → raw_score / 100.0 (typically ±5)
  };
  outcome?: "Win" | "Loss" | "Draw"; // Only present on exact solutions
  winner?: "P1" | "P2" | null;       // null on draws; only present on exact solutions
  movesToEnd?: number | null;         // Plies to terminal state; null on draws
  score: number;                      // Raw C++ engine score (positive = current player winning)
}
```

> **Heuristic `eval.value`:** The heuristic engine does not produce Win/Draw/Loss probabilities. The decimal `eval.value` (score ÷ 100) is suitable for bar-chart display. A value of `+3.5` means the position is strongly winning; `0.0` is roughly equal.
