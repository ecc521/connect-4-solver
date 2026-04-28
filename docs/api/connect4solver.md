# Connect4Solver

The standard, single-threaded exact solver. This engine searches positions to absolute terminal depths using Alpha-Beta pruning to return mathematically perfect win/loss/draw scores.

**Import:** 
```typescript
import { Connect4Solver } from "connect-4-solver";
```

## Constructor
```typescript
new Connect4Solver(width: number, height: number);
// OR explicitly pass a cache:
new Connect4Solver({ width: number, height: number, cache: SolverCache });
```

::: warning ⚠️ Synchronous Execution
Calling `.analyze()` runs the C++ WebAssembly module synchronously on the thread that invoked it. This means your JavaScript event loop (and your Browser UI) will completely freeze while the solver is evaluating the position.

To achieve fluid, non-blocking evaluation, you must offload the solver into a background thread. Read our [WebWorkers (Async)](/web-workers.md) guide for copy-paste implementation templates!
:::

## Methods

### `init()`
Bootstraps the WASM binary and allocates the implicit solver cache (if none was provided). 
**Returns:** `Promise<void>`
*(Must be awaited before calling `analyze`)*.

### `loadBook(bookData: Uint8Array)`
Loads an Opening Book (`.book` or `.efbook`) into memory. This allows the solver to instantly query pre-evaluated early-game states instead of invoking expensive tree searches.
**Returns:** `Promise<void>`

### `analyze(position: string)`
Computes the perfect score for the current board state and evaluates all valid child move columns.
**Returns:** `PositionAnalysis` object containing the best `evaluation` and all available `moveOptions`.

### `unload()`
Destroys the explicitly allocated WASM pointer instances (including the implicit cache, if applicable).
**Returns:** `void`
