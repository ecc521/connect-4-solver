# Memory & Threading

The Connect 4 engine uses a C++ core, and WebAssembly/Native pointers are not garbage collected. You must manually free memory to prevent leaks.

## Cache Allocation

Every time you instantiate a solver (e.g. `NodeConnect4Solver`, `SyncWasmConnect4Solver`), it automatically creates a Transposition Table cache on the heap. You can control the size of this cache using the `cacheSizeMb` option.

```typescript
import { NodeConnect4Solver } from "connect-4-solver";

// Implicit Memory Allocation (defaults to 100MB)
const solver = new StandardConnect4Solver({ width: 7, height: 6 });

// Explicit Memory Allocation
const solver = new StandardConnect4Solver({
  width: 7,
  height: 6,
  cacheSizeMb: 100,
});

await solver.init(); // Allocates ~100MB of Memory automatically

// ... run operations ...

// You MUST manually trigger the deallocation!
solver.unload();
```

::: warning ⚠️ MANDATORY DEALLOCATION
Failing to call `solver.unload()` when you are done with the solver will result in a permanent memory leak. Node.js and the Browser cannot automatically clean up the C++ pointers.
:::

## Multithreading

By default, the solver uses a single thread. For deep calculations (e.g., empty or nearly empty boards), you can speed up evaluation by allocating more threads:

```typescript
const result = await solver.analyze("4424", { threads: 4 });
```

### Browser Requirements

Multithreaded WASM requires `SharedArrayBuffer`, which is only available when your server sends Cross-Origin Isolation headers (`COOP`/`COEP`). Use `SyncWasmConnect4Solver` or `WebWorkerWasmConnect4Solver` for multithreading; the `NoSAB` variants are single-threaded only.

### WebAssembly Thread Pool

The distributed multithreaded WASM binary (`analyze_threaded.js`) is pre-compiled using Emscripten with a `PTHREAD_POOL_SIZE=4` and `PTHREAD_POOL_SIZE_STRICT=0`. This safely provisions 4 workers by default to handle common concurrent workloads without dynamically blocking the JS main thread, while allowing dynamic expansion (`_STRICT=0`) if more threads are requested.

### Node.js (Native) Persistent Thread Pool

In Node.js, the `NodeConnect4Solver` manages its own **Persistent Thread Pool** in C++.

- **No libuv limit:** It completely bypasses the Node.js `libuv` thread pool. You do NOT need to set `UV_THREADPOOL_SIZE`.
- **High Water Mark:** The pool is lazy-initialized. If you only use 1 thread, 0 background threads are spawned. If you request 12 threads, the solver spawns 11 persistent workers. These workers stay alive and go to sleep when idle, waking up instantly for the next `analyze()` call.
- **Resource Efficiency:** Threads are only spawned as needed. Once a solver has reached a certain thread count, it "remembers" that capacity for its entire lifetime to avoid the overhead of repeatedly creating and destroying threads.

### Mobile Thread Pools (React Native)

When using `ReactNativeConnect4Solver`, asynchronous tasks are offloaded to native background thread pools to prevent blocking the JS UI thread.

If you trigger concurrent evaluations across **multiple solver instances** at the exact same time, the bridge handles execution as follows:

- **Android:** The Kotlin module uses an unbounded cached thread pool. It will attempt to execute as many concurrent solvers as you request. It is entirely your responsibility not to overwhelm the device's CPU.
- **iOS:** The Objective-C++ module utilizes Grand Central Dispatch (`dispatch_get_global_queue`), which dynamically executes or queues concurrent evaluations based on the device's available CPU cores and thermal state.
