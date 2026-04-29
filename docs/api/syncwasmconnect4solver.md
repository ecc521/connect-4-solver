# SyncWasmConnect4Solver

The synchronous WASM solver evaluates positions directly on the main thread using the WebAssembly core compiled from C++.

If you want the simplest setup in a browser and can tolerate brief UI freezes during deep calculations, use the sync solvers.

**Import:** 
```typescript
import { SyncWasmConnect4Solver, SyncWasmNoSABConnect4Solver } from "connect-4-solver";
```

::: warning ⚠️ Main Thread Blocking
These solvers evaluate synchronously. The JavaScript main thread will be entirely blocked during this process, meaning your UI will freeze and events will not fire until execution completes. 

For the Heuristic Solver, the main thread will block until your `timeoutMs` threshold is reached. For the Exact Solver, the thread will block **until the position is fully calculated**. If you require long computations without freezing the browser, use the `WebWorkerWasmConnect4Solver` instead.
:::

## Constructors
**Implements:** [`BaseConnect4Solver`](./base-solver)

```typescript
new SyncWasmConnect4Solver(options?: { width?: number, height?: number, cacheSizeMb?: number, heuristic?: boolean });
new SyncWasmNoSABConnect4Solver(options?: { width?: number, height?: number, cacheSizeMb?: number, heuristic?: boolean });
```

### Which class should I use? (SharedArrayBuffer)

* **`SyncWasmConnect4Solver`**: Requires your web server to provide Cross-Origin Isolation headers (`COOP`/`COEP`). This enables `SharedArrayBuffer` in the browser, which allows the solver to perform **multithreaded** WASM evaluations.
* **`SyncWasmNoSABConnect4Solver`**: The fallback solver. Requires **no special server headers** and works out-of-the-box on GitHub Pages, Vercel, or any standard host. It is strictly single-threaded.
