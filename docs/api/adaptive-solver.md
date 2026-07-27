# AdaptiveSolver

The `AdaptiveSolver` is the primary high-level entry point recommended for most application-level integrations.

Unlike the lower-level environment-specific solvers, a single `AdaptiveSolver` instance manages:

- **Environment Detection**: Automatically selects the fastest native Node.js addon or WASM runner for the current runtime.
- **Dynamic Board Resizing & Lifecycle**: Instantiates and tears down underlying engine caches and state dynamically when calling `setBoard()`, ensuring native heap/WASM memory is cleanly freed.
- **Unified Timeouts**: Enforces a default timeout limit to prevent indefinite search hangs.

## Constructor Options

When instantiating `AdaptiveSolver`, you can pass the following optional configuration:

```typescript
import { AdaptiveSolver } from "connect-4-solver";

const solver = new AdaptiveSolver({
  cacheSizeMb: 128,
  defaultTimeoutMs: 3000,
});
```

| Parameter          | Default     | Description                                                                                                                                            |
| ------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cacheSizeMb`      | `128`       | Total transposition table memory allocation in megabytes.                                                                                              |
| `defaultTimeoutMs` | `5000`      | Default timeout in milliseconds applied to all searches. Can be overridden per-call. Set to `0` to disable (not recommended on large boards without a book). |
| `bookLoader`       | `undefined` | `(width, height, align?, wrap?) => Promise<Uint8Array \| null \| undefined>` — async callback invoked during `setBoard()` to supply a custom opening book. A non-null return **replaces** the embedded book. |
| `workerProvider`   | `undefined` | `() => Worker` — factory for WASM Web Worker threads. If provided on the browser, the solver runs off the main thread. Has no effect in Node.js or React Native. |

---

## Core Methods

### `setBoard(width, height, align?, wrap?)`

```typescript
setBoard(width: number, height: number, align?: number, wrap?: boolean): Promise<void>
```

Switches the active solver to the specified board geometry. Handles the full solver lifecycle:

1. Safely interrupts and stops any active search.
2. Destroys the old solver instance and frees its native cache memory.
3. Creates and initializes a new solver for the requested size.
4. Auto-loads the embedded opening book if one exists for this geometry.
5. Invokes the `bookLoader` callback (if supplied) to override/replace the book.

| Param   | Default | Description |
| ------- | ------- | ----------- |
| `width` | —       | Board columns. |
| `height`| —       | Board rows. |
| `align` | `4`     | Win condition (4 = Connect 4, 5 = Connect 5). |
| `wrap`  | `false` | Cylindrical board (horizontal wrap). See [Supported Sizes](./base-solver.md#supported-board-sizes). |

**Returns:** `Promise<void>`  
_(Must be awaited before calling `solve`, `analyze`, or `queryBook`)_.

### `solve(position: string, options?: AnalyzeOptions)`

Performs a fast minimax search for the best move.  
By default, searches have a `5000` ms timeout. Running without a timeout (explicitly setting `timeoutMs: 0`) is allowed, but will trigger a console warning, as deep searches on large boards without a book can block the thread or search indefinitely.

**Returns:** `Promise<PositionAnalysis>`

### `analyze(position: string, options?: AnalyzeOptions)`

Computes evaluations for all columns. Like `solve()`, running without a timeout (setting `timeoutMs: 0`) will trigger a console warning on large boards without a book.

**Returns:** `Promise<PositionAnalysis>`

### `queryBook(position: string)`

Book-only lookup — no search is performed. Returns a `BookResult` on a hit or `null` on a miss. Useful for showing an instant result before deciding whether to run a timed solve.

**Returns:** `Promise<BookResult | null>`

### `loadBook(data: Uint8Array)`

Manually loads a custom opening book buffer, replacing the active book (if any). Must not be called while a search is running — call `stop()` first.

**Returns:** `Promise<void>`

### `stop()`

Gracefully interrupts any in-flight search.

**Returns:** `Promise<void>` (resolves when the engine has fully stopped and settled).

### `destroy()`

Permanently tears down the active solver, releases all native heap/WASM memory, and makes the instance unusable.

**Returns:** `Promise<void>`

---

## Properties

| Property              | Type      | Description                                                                            |
| --------------------- | --------- | -------------------------------------------------------------------------------------- |
| `width`               | `number`  | Active board width in columns.                                                         |
| `height`              | `number`  | Active board height in rows.                                                           |
| `align`               | `number`  | Active win condition (4 or 5).                                                         |
| `wrap`                | `boolean` | Whether the active board wraps horizontally.                                           |
| `hasBook`             | `boolean` | `true` if an opening book (embedded or custom) is currently loaded.                   |
| `bookKind`            | `"exact" \| "bounded" \| null` | Kind of the active book decoded from its v2 header, or `null` if none. See [bookKind](./base-solver.md#bookkind-property). |
| `isReady`             | `boolean` | `true` once `setBoard()` has completed and the solver is ready for queries.            |
| `allocatedCacheSizeMb`| `number`  | Cache actually allocated in MB (may be less than `cacheSizeMb` if OOM retry kicked in).|

The engine is always exact. To bound searches on large boards without an opening book, pass a `timeoutMs` (or rely on the `defaultTimeoutMs` constructor option).
