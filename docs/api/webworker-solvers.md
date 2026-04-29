# WebWorker Solvers

The WebWorker solvers wrap the synchronous WASM engine in a WebWorker, offloading computation to a background thread so your UI stays responsive.

**Import:**

```typescript
import {
  WebWorkerWasmConnect4Solver,
  WebWorkerWasmNoSABConnect4Solver,
} from "connect-4-solver/async";
```

::: info ℹ️ Note on Node.js & React Native
You do **not** need this class for Node.js or React Native.
In those environments, the explicit base `NodeConnect4Solver` and `ReactNativeConnect4Solver` execute asynchronously via native threads automatically.
:::

**Implements:** [`BaseConnect4Solver`](./base-solver)

```typescript
new WebWorkerWasmConnect4Solver(worker: Worker, options: { width: number, height: number, cacheSizeMb?: number, heuristic?: boolean });
new WebWorkerWasmNoSABConnect4Solver(worker: Worker, options: { width: number, height: number, cacheSizeMb?: number, heuristic?: boolean });
```

### Which class should I use? (SharedArrayBuffer)

- **`WebWorkerWasmConnect4Solver`**: Requires your web server to provide Cross-Origin Isolation headers (`COOP`/`COEP`). This enables `SharedArrayBuffer` in the browser, which allows the WebWorker to perform **multithreaded** WASM evaluations using WebWorkers as background PThreads.
- **`WebWorkerWasmNoSABConnect4Solver`**: The fallback solver. Requires **no special server headers** and works out-of-the-box on GitHub Pages, Vercel, or any standard host. It is strictly single-threaded.

## Setup Instructions

Because NPM libraries cannot reliably "guess" the relative path to instantiate `new Worker()` inside modern web bundlers (like Next.js, Vite, or Webpack), we split the logic into two parts: a `worker-handler` you drop into your own worker file, and an async solver wrapper you use on your main thread.

### 1. Create your Worker File

Create a dedicated file for your worker in your project (e.g. `c4-worker.ts`) and initialize the handler matching your target environment. This file will be bundled as a WebWorker by your build tool.

For environments **with** Cross-Origin Headers (allows `SharedArrayBuffer` for multithreading):

```typescript
// c4-worker.ts
import { setupWorkerHandler } from "connect-4-solver/worker-handler";

setupWorkerHandler();
```

For standard environments (like Vercel, GitHub Pages) **without** Cross-Origin Headers:

```typescript
// c4-worker-nosab.ts
import { setupNoSABWorkerHandler } from "connect-4-solver/worker-handler";

setupNoSABWorkerHandler();
```

### 2. Use the Async Solver on your Main Thread

On your main UI thread, instantiate the worker using your framework's native `new Worker()` syntax, and pass it to the specific Async wrapper for your CORS environment:

```typescript
// App.tsx
import { WebWorkerWasmNoSABConnect4Solver } from "connect-4-solver/async";

// 1. Instantiate the Worker using your NoSAB worker file
const worker = new Worker(new URL("./c4-worker-nosab.ts", import.meta.url), {
  type: "module",
});

// 2. Wrap it with the Async Solver
const solver = new WebWorkerWasmNoSABConnect4Solver(worker, {
  width: 7,
  height: 6,
});

async function play() {
  // 3. Initialize and Search!
  await solver.init();
  const result = await solver.analyze("11112222"); // Non-blocking
  console.log(result.evaluation);
}
```

### Using Threads or Heuristics

The worker-handler supports heuristics and threads automatically via `init()`. Just pass the options:

```typescript
import { WebWorkerWasmConnect4Solver } from "connect-4-solver/async";

// Offload the PThread WASM engine to a WebWorker
const threadedSolver = new WebWorkerWasmConnect4Solver(worker, {
  width: 7,
  height: 6,
});
await threadedSolver.init();
await threadedSolver.analyze("1122", { threads: 4 });

// Offload the Heuristic WASM engine
const heuristicSolver = new WebWorkerWasmConnect4Solver(worker, {
  width: 7,
  height: 6,
  heuristic: true,
});
await heuristicSolver.init();
await heuristicSolver.analyze("1122");
```

::: tip 💡 Memory Management
When you are completely finished with an async solver, you can call `solver.unload()` to safely destroy the WASM pointers. However, because the WebWorker runs in a completely isolated memory space, simply calling `worker.terminate()` from your main thread will also instantly destroy the entire WASM module and its caches!
:::
