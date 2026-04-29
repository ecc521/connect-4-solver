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

## Methods

### `init(): Promise<void>`

Initializes the native solver and allocates the transposition table cache. Must be called before any evaluation.

### `analyze(position: string, opts?: AnalyzeOptions): Promise<PositionAnalysis>`

Executes an asynchronous evaluation of a position. 

In Node.js, this method uses a **persistent native C++ thread pool** that bypasses the standard libuv limitations. This means you can scale to your full CPU core count (e.g., 12, 16, or 32 threads) without any extra configuration.

### `solve(position: string, opts?: SolveOptions): Promise<Evaluation>`

Executes an exact evaluation of a position. Like `analyze()`, this uses the native persistent thread pool.

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

### `_analyzeExact(width: number, height: number, solverPtr: number, position: string, weak: boolean, threads: number, bookPtr: number | null): Promise<number[]>`

Executes an asynchronous exact evaluation natively via a persistent C++ thread pool. Returns a raw array of scores mapping to the evaluation outcomes.

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
