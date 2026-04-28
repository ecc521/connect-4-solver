# Asynchronous WebWorkers

Performing computationally heavy Alpha-Beta searches on the main JavaScript thread is highly discouraged. While WebAssembly is incredibly fast, deep searches on complex board states can still take several milliseconds (or seconds), which will briefly freeze your website's UI.

To solve this, `connect-4-solver` provides a plug-and-play **Async WebWorker Wrapper** that completely offloads the WASM engine to a background thread.

Because NPM libraries cannot reliably "guess" the relative path to instantiate `new Worker()` inside modern web bundlers (like Next.js, Vite, or Webpack), we split the logic into two parts: a `worker-handler` you drop into your own worker file, and an `AsyncConnect4Solver` you use on your main thread.

## 1. Create your Worker File
Create a dedicated file for your worker in your project (e.g. `c4-worker.ts`) and initialize the handler. This file will be bundled as a WebWorker by your build tool.

```typescript
// c4-worker.ts
import { setupWorkerHandler } from "connect-4-solver/worker-handler";

setupWorkerHandler();
```

## 2. Use the Async Solver on your Main Thread
On your main UI thread, instantiate the worker using your framework's native `new Worker()` syntax, and pass it to the Async wrapper. 

The API for `AsyncConnect4Solver` is exactly identical to the standard `Connect4Solver`, except that `analyzeAsync()` is natively supported via Promise-based messaging!

```typescript
// App.tsx
import { AsyncConnect4Solver } from "connect-4-solver/async";

// 1. Instantiate the Worker (Syntax may vary based on your bundler, e.g. Vite)
const worker = new Worker(new URL('./c4-worker.ts', import.meta.url), { type: 'module' });

// 2. Wrap it with the Async Solver
const solver = new AsyncConnect4Solver(worker, "Connect4Solver", { width: 7, height: 6 });

async function play() {
  // 3. Initialize and Search!
  await solver.init();
  const result = await solver.analyzeAsync("11112222"); // 100% Non-blocking!
  console.log(result.evaluation);
}
```

## Supporting Other Solvers

The `worker-handler` automatically supports all 4 solver variants. You simply use the dedicated wrapper subclasses. They will automatically ask the background worker to instantiate the correct native WASM engine:

```typescript
import { AsyncThreadedConnect4Solver, AsyncHeuristicConnect4Solver } from "connect-4-solver/async";

// Offload the PThread WASM engine to a WebWorker
const threadedSolver = new AsyncThreadedConnect4Solver(worker, { width: 7, height: 6 });
await threadedSolver.init();
await threadedSolver.analyzeAsync("1122", { threads: 4 });

// Offload the Heuristic WASM engine
const heuristicSolver = new AsyncHeuristicConnect4Solver(worker, { width: 7, height: 6 });
await heuristicSolver.init();
await heuristicSolver.analyzeAsync("1122");
```

::: tip 💡 Memory Management
When you are completely finished with an async solver, you can call `solver.unload()` to safely destroy the WASM pointers. However, because the WebWorker runs in a completely isolated memory space, simply calling `worker.terminate()` from your main thread will also instantly destroy the entire WASM module and its caches!
:::
