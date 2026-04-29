# NodeConnect4Solver

The Node.js solver for exact and heuristic evaluation. Uses **Node N-API** to call the C++ engine directly — no WASM involved.

**Import:**

```typescript
import { NodeConnect4Solver } from "connect-4-solver";
```

## Constructor

**Implements:** [`BaseConnect4Solver`](./base-solver)

```typescript
new NodeConnect4Solver(options?: { width?: number, height?: number, cacheSizeMb?: number, heuristic?: boolean });
```

::: info ℹ️ Configuring Thread Limits
When running `connect-4-solver` in Node.js, asynchronous tasks are offloaded to Node's `libuv` thread pool, which defaults to **4 parallel threads**. Increasing the thread pool size allows for greater concurrency, and frees up space for other applications in the threadpool:

```bash
export UV_THREADPOOL_SIZE=32
```

:::

::: info ℹ️ Bulk Solving Parallelization
If you are generating large data sets, running concurrent single-threaded solvers is significantly faster than using one solver with multiple threads.

While you can safely instantiate an array of `NodeConnect4Solver` classes to achieve this, each instance allocates its own isolated cache, which prevents Transposition Table reuse. Instead, use the raw internal `native` bridge to share a single cache across multiple solvers:
:::

### Example: Concurrent Solving with a Shared Cache

```typescript
import { getNativeModule } from "connect-4-solver";

const width = 7;
const height = 6;
const threads = 1;
const cacheSizeBytes = 4096 * 1024 * 1024; // 4GB

async function runBulk(positions: string[]) {
  const native = getNativeModule();

  // 1. Allocate a single 4GB shared cache in C++
  const cachePtr = native._createCache(width, height, cacheSizeBytes, false);

  // 2. Instantiate 12 unique solvers that all point to the SAME shared cache
  const solverPtrs: number[] = [];
  for (let i = 0; i < 12; i++) {
    solverPtrs.push(native._createSolver(width, height, cachePtr, false));
  }

  // 3. Map positions across the Solvers safely using threads: 1
  const results = await Promise.all(
    positions.map((pos, index) => {
      const solverIndex = index % solverPtrs.length;
      return native._analyzeExact(
        width,
        height,
        solverPtrs[solverIndex],
        pos,
        threads,
        null,
      );
    }),
  );

  // 4. Free the pointers
  solverPtrs.forEach((ptr) => native._destroySolver(width, height, ptr, false));
  native._destroyCache(cachePtr);
}
```

## Native Module API (Advanced)

For developers doing heavy bulk-processing who need to interact directly with the C++ cache and memory allocators, you can bypass the `NodeConnect4Solver` wrapper and import the raw `getNativeModule()` endpoints. These bypass all validation and JSON parsing for maximum performance.

```typescript
import { getNativeModule } from "connect-4-solver";
const native = getNativeModule();
```

### `_createCache(width: number, height: number, bytes: number, isHeuristic: boolean): number`

Allocates a shared Transposition Table in C++ RAM. Returns a raw pointer to the instance.

### `_destroyCache(cachePtr: number): void`

Frees the memory allocated by `_createCache`.

### `_createSolver(width: number, height: number, cachePtr: number, isHeuristic: boolean): number`

Instantiates an evaluator bound to the specified shared cache. Returns a raw pointer to the solver instance.

### `_destroySolver(width: number, height: number, solverPtr: number, isHeuristic: boolean): void`

Frees the memory allocated by `_createSolver`.

### `_analyzeExact(width: number, height: number, solverPtr: number, position: string, threads: number, bookPtr: number | null): Promise<number[]>`

Executes an asynchronous exact evaluation natively via Node's `libuv` pool. Returns a raw array of scores mapping to the evaluation outcomes.

### `_analyzeHeuristic(width: number, height: number, solverPtr: number, position: string, threads: number, maxDepth: number, timeoutMs: number): Promise<number[]>`

Executes an asynchronous heuristic evaluation. Returns a raw array of scores.

### `BookBuilder` Class

A native C++ class for compiling evaluated positions into binary `.book` and `.efbook` files.

```typescript
const builder = new native.BookBuilder(7, 6, 10); // width, height, depth

// Add evaluated positions
builder.addPosition("4444", 5);

// Write to disk
builder.saveDense("output.book");
builder.saveEliasFano("output.efbook");
```
