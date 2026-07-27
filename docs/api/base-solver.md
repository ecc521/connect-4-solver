# BaseConnect4Solver

`connect-4-solver` exports separate solver classes for each environment (Node.js, browser WASM, React Native). All share the same `BaseConnect4Solver` interface, so your code stays consistent across platforms.

## Constructor Options

Every solver accepts the following configuration object upon instantiation:

| Parameter     | Default | Description                                                                                                                                   |
| ------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `width`       | 7       | Board width in columns.                                                                                                                       |
| `height`      | 6       | Board height in rows.                                                                                                                         |
| `cacheSizeMb` | 100     | Transposition table memory allocation in MB.                                                                                                  |
| `align`       | 4       | Win condition — pieces in a row required to win. `4` = standard Connect 4; `5` = Connect-5. See [Supported Sizes](#supported-board-sizes).    |
| `wrap`        | `false` | Cylindrical board — columns wrap horizontally. See [Supported Sizes](#supported-board-sizes) for which `(width, height, align)` combinations support wrapping. |

## Core Methods

### `init()`

Bootstraps the native module, WebAssembly binary, or WebWorker, and automatically allocates the memory cache.
**Returns:** `Promise<void>`
_(Must be awaited before calling `analyze`)_.

### `analyze(position: string, options?: AnalyzeOptions)`

Computes the score for the current board state and evaluates all valid child move columns.

**Options:**

- `threads`: Maximum number of worker threads allowed (default: `1`). Will be clamped to the maximum allowed by the specific solver used.
- `timeoutMs`: Maximum time in milliseconds to spend searching. Returns `aborted: true` if the search cannot complete in time. Useful for bounding long searches on large boards without an opening book (default: `0` = no limit).
- `book`: An optional `OpeningBook` instance to query for instant early-game solutions.

**Returns:** `Promise<PositionAnalysis>`

> **Thread Limits:** Each Solver's thread count is internally capped at the lesser of one-per-column and platform-specific limits. While this guarantees threads never perform wasted effort, it means that some threads will exit early, resulting in sub-linear speedups with additional threads.

### `solve(position: string, options?: AnalyzeOptions & { weak?: boolean })`

Performs a **Fast Search** for the best move and score.

Unlike `analyze()`, which evaluates every possible column to create a heat-map, `solve()` uses an aggressive alpha-beta prune (null-window search) to find the best move as quickly as possible. This is typically **3-5x faster** than `analyze()` and is recommended for engine-vs-engine play or hint systems.

**Options:**

- `weak`: If `true`, the solver only determines if the position is a Win, Loss, or Draw, without calculating the exact number of moves to the end (default: `false`).
- `timeoutMs`: Maximum search time. Returns `aborted: true` if the search cannot complete in time.
- `book`: An optional `OpeningBook` instance.

**Returns:** `Promise<PositionAnalysis>`

> **Result Difference:** When using `solve()`, the `moveOptions` array in the returned `PositionAnalysis` will be empty. The best move is instead available in the top-level `bestMove` field.

### `queryBook(position: string)`

Performs a book-only lookup — no search is run. Returns a `BookResult` on a hit, or `null` on a miss. Useful for displaying an instant result before deciding whether to run a timed solve.

The native and WASM solvers fall back to the embedded book automatically; `queryBook` exposes that lookup directly.

**Returns:** `Promise<BookResult | null>`

### `stop()`

Signals the solver to abort the current search.

> [!IMPORTANT]
> `stop()` forcefully terminates the solver. For **Node.js native** and **React Native**, it interrupts the background thread. For **Web Workers**, it will hard-terminate and restart the worker to interrupt blocking WASM calculations. Pending promises will resolve with `{ aborted: true }`.

### `getNodeCount()`

Returns the total number of positions searched by this solver since the last `init()` call. Useful for benchmarking and debugging.

**Returns:** `Promise<number>`

> **Note:** Not all platforms support live node counts. The web worker solvers query the count asynchronously via a message round-trip; React Native currently returns `0` (JNI binding pending).

### `release()`

Safely destroys the explicitly allocated pointers and frees the cache memory from RAM.
**Returns:** `void`

> **Note:** Once `release()` is called, the solver instance is permanently destroyed and cannot be reused. Create a new solver to continue evaluating.

### `bookKind` (property)

```typescript
get bookKind(): "exact" | "bounded" | null
```

The kind of the currently-loaded opening book, decoded from the v2 file header. Returns `null` if no book is loaded.

| Value       | Meaning                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------ |
| `"exact"`   | Full minimax scores (default). `BookResult.exact` is a distance-to-result.                |
| `"bounded"` | Score interval `[lower, upper]`. The solver uses these as alpha-beta bounds during search. A book generated with `--weak` is a bounded book whose intervals span the full Win or Loss range. |

---

### Supported Board Sizes

**Standard Connect 4** (`align=4`, `wrap=false`) — specialized, full speed:

`6×7`, `6×8`, `7×6`, `7×7`, `7×8`, `7×9`, `8×6`, `8×7`, `8×8`, `9×7`

**Variants** — specialized:

| `align` | `wrap`  | Board | Mode              |
| ------- | ------- | ----- | ----------------- |
| 5       | `false` | 8×8   | Connect-5         |
| 4       | `true`  | 7×6   | C4 Wraparound     |
| 5       | `true`  | 8×8   | C5 Wraparound     |

**Generic fallback** — any standard C4 board whose bitboard fits in 127 bits resolves automatically at roughly half the speed of a specialized size. Unsupported sizes (>127 bits, or variant combos not listed above) throw at init time.

> Additional sizes can be added by compiling the C++ source with custom `SUPPORTED_SIZES_X_MACRO` entries.

## Returned Types

### `PositionAnalysis`

The object returned when an `analyze()` or `solve()` call completes.

```typescript
export interface PositionAnalysis {
  position: string; // Validated position (may differ if input was invalid)
  originalPosition: string; // Raw input string
  currentPlayer: "P1" | "P2"; // Whose turn it is at the analyzed position
  evaluation: Evaluation | null; // Overall evaluation (null if aborted or invalid)
  moveOptions: (Evaluation | null)[]; // Per-column evaluations (empty when using solve())
  bestMove?: number; // 0-indexed column of the best move (solve() only)
  nodes?: number; // Total positions searched (solve() only)
  aborted?: boolean; // True if the search was cut short by timeoutMs
}
```

### `Evaluation`

Represents the calculated strength of a move or position.

```typescript
export interface Evaluation {
  outcome?: "Win" | "Loss" | "Draw"; // Win/Draw/Loss result
  winner?: "P1" | "P2" | null; // null on draws
  movesToEnd?: number | null; // Plies to terminal state; null on draws
  score: number; // Raw C++ engine score (positive = current player winning)
}
```

### `BookResult`

Returned by `queryBook()` on a hit.

```typescript
export interface BookResult {
  exact?: number;  // exact score (positive = player-to-move winning, 0 = draw)
  lower?: number;  // lower bound (bounded books)
  upper?: number;  // upper bound (bounded books)
}
```

An exact book populates `exact`. A bounded book populates `lower`/`upper`. A miss returns `null`, not an empty object.
