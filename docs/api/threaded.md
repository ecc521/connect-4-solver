# ThreadedConnect4Solver

A WebAssembly Multi-Threaded variant of the standard solver.

**Import:** 
```typescript
import { ThreadedConnect4Solver, ThreadedSolverCache } from "connect-4-solver/threaded";
```

::: warning ⚠️ SharedArrayBuffer Requirement
This class utilizes Emscripten's multi-threading compilation target, which fundamentally relies on `SharedArrayBuffer` in the browser. 

To use this solver, your web server **must** return strict COOP/COEP HTTP headers:
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`
:::

::: warning ⚠️ Synchronous Execution
While this solver dispatches its work across multiple `WebWorkers` behind the scenes, the main WASM thread is still technically executing a synchronous block while waiting for the workers to converge.

**This means calling `analyze()` will still freeze your JavaScript event loop (and Browser UI) while it waits!**

To achieve true asynchronous background processing, you should instantiate this solver entirely within a master WebWorker. Read our [WebWorkers (Async)](/web-workers.md) guide for copy-paste implementation templates!
:::

## Methods

Inherits all core lifecycle methods ([`init()`](./standard.md#init), [`unload()`](./standard.md#unload), [`loadBook()`](./standard.md#loadbook-bookdata-uint8array)) from the standard `Connect4Solver`.

### Caching

If you want to explicitly share a cache across multiple Threaded solvers, you **must** use `ThreadedSolverCache` so that the pointer is allocated in the `SharedArrayBuffer` memory space, rather than the standard WASM memory.

```typescript
const sharedThreadedCache = new ThreadedSolverCache(7, 6);
await sharedThreadedCache.init();

const solver = new ThreadedConnect4Solver({ width: 7, height: 6, cache: sharedThreadedCache });
```

### `analyze(position: string, opts?: { threads?: number })`
Analyzes the board. The `threads` parameter dynamically dictates how many parallel native threads the WASM pool should split the root tree into.
- Default `threads`: `1` (or whatever the environment optimally supports).
**Returns:** `PositionAnalysis`
