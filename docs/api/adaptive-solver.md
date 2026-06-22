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

| Parameter          | Default     | Description                                                                          |
| ------------------ | ----------- | ------------------------------------------------------------------------------------ | ---- | ----------------------------------------------------------------------------------------- |
| `cacheSizeMb`      | `128`       | Total transposition table memory allocation in megabytes.                            |
| `defaultTimeoutMs` | `5000`      | Default timeout in milliseconds applied to all searches. Can be overridden per-call. |
| `bookLoader`       | `undefined` | An optional async callback `(width, height) => Promise<Uint8Array                    | null | undefined>` to fetch/supply a custom opening book dynamically when switching board sizes. |

---

## Core Methods

### `setBoard(width: number, height: number)`

Switches the active solver to the specified board size. This method handles solver lifecycle, cache teardown, and opening book loading:

1. Safely interrupts and stops any active search.
2. Destroys the old solver instance and frees its native cache memory.
3. Auto-loads the embedded binary opening book if available.
4. Invokes the `bookLoader` callback (if supplied) to override/replace the book.

**Returns:** `Promise<void>`  
_(Must be awaited before calling `solve` or `analyze`)_.

### `solve(position: string, options?: AnalyzeOptions)`

Performs a fast minimax search for the best move.  
By default, searches have a `5000` ms timeout. Running without a timeout (explicitly setting `timeoutMs: 0`) is allowed, but will trigger a console warning, as deep searches on large boards without a book can block the thread or search indefinitely.

**Returns:** `Promise<PositionAnalysis>`

### `analyze(position: string, options?: AnalyzeOptions)`

Computes evaluations for all columns. Like `solve()`, running without a timeout (setting `timeoutMs: 0`) will trigger a console warning on large boards without a book.

**Returns:** `Promise<PositionAnalysis>`

### `loadBook(data: Uint8Array)`

Manually loads a custom opening book buffer, replacing the active book (if any).

**Returns:** `Promise<void>`

### `stop()`

Gracefully interrupts any in-flight search.

**Returns:** `Promise<void>` (resolves when the engine has fully stopped and settled).

### `destroy()`

Permanently tears down the active solver, releases all native heap/WASM memory, and makes the instance unusable.

**Returns:** `Promise<void>`

---

## Properties

- `width` (`number`): The active board width.
- `height` (`number`): The active board height.
- `hasBook` (`boolean`): Whether an opening book (embedded or custom) is currently active.
- `isReady` (`boolean`): True if the solver is initialized and ready for queries.

The engine is always an exact solver. To bound long searches on large boards without an opening book, pass a `timeoutMs` (the default `defaultTimeoutMs` applies otherwise).
