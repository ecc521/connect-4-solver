# Memory & Threading

The Connect 4 engine uses a C++ core, and WebAssembly/Native pointers are not garbage collected. You must manually free memory to prevent leaks.

## Cache Allocation

Every time you instantiate a solver (e.g. `NodeConnect4Solver`, `SyncWasmConnect4Solver`), it automatically creates a Transposition Table cache on the heap. You can control the size of this cache using the `cacheSizeMb` option.

```typescript
import { NodeConnect4Solver } from "connect-4-solver";

// Implicit Memory Allocation (defaults to 128MB)
const solver = new NodeConnect4Solver({
  width: 7,
  height: 6,
  cacheSizeMb: 128,
});
await solver.init(); // Allocates ~128MB of Memory automatically

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

The distributed multithreaded WASM binary (`analyze_threaded.js`) is pre-compiled using Emscripten with a strict `PTHREAD_POOL_SIZE=4` to optimize memory and startup latency. This means that requesting more than 4 threads will automatically be capped by the engine. To increase this limit, you must recompile the C++ source code using `emcc` and explicitly raise the `PTHREAD_POOL_SIZE` flag in `build.sh` and/or enable dynamic worker creation (`-s PTHREAD_POOL_SIZE_STRICT=0`).

### Node.js Thread Pool

When running in Node.js, asynchronous tasks are offloaded to Node's `libuv` thread pool, which defaults to **4 threads**. If you're running concurrent evaluations, increase the pool size before your application starts:

```bash
export UV_THREADPOOL_SIZE=32
```

### Mobile Thread Pools (React Native)

When using `ReactNativeConnect4Solver`, asynchronous tasks are offloaded to native background thread pools to prevent blocking the JS UI thread.

If you trigger concurrent evaluations across **multiple solver instances** at the exact same time, the bridge handles execution as follows:

- **Android:** The Kotlin module uses an unbounded cached thread pool. It will attempt to execute as many concurrent solvers as you request. It is entirely your responsibility not to overwhelm the device's CPU.
- **iOS:** The Objective-C++ module utilizes Grand Central Dispatch (`dispatch_get_global_queue`), which dynamically executes or queues concurrent evaluations based on the device's available CPU cores and thermal state.
