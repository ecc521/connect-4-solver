# AsyncConnect4Solver

The `AsyncConnect4Solver` acts as a proxy for the standard `Connect4Solver` designed specifically for use in standard Web browsers where WebAssembly execution is strictly synchronous. 

By wrapping the engine in a WebWorker, `AsyncConnect4Solver` safely offloads the heavy computations so your UI remains responsive!

**Import:**
```typescript
import { AsyncConnect4Solver } from "connect-4-solver";
```

::: info ℹ️ Note on Node.js & React Native
You do **not** need this class for Node.js or React Native. 
In those environments, the base `Connect4Solver` natively executes asynchronously via N-API `libuv` or JSI background threads!
:::

## Constructor
```typescript
new AsyncConnect4Solver(options: { width: number, height: number, cacheSizeMb?: number, heuristic?: boolean });
```

## Methods

### `init()`
Automatically spawns a WebWorker and bootstraps the solver natively inside it.
**Returns:** `Promise<void>`

### `loadBook(bookData: Uint8Array)`
Transfers the Opening Book into the WebWorker's memory.
**Returns:** `Promise<void>`

### `analyze(position: string, options?: { threads?: number })`
Sends the position to the worker and waits for the exact mathematically perfect resolution.
**Returns:** `Promise<PositionAnalysis>`

### `release()`
Terminates the WebWorker and deallocates its memory completely.
**Returns:** `void`
