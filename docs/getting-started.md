# Getting Started

This guide covers installation and basic usage.

## Installation

Install the package via npm:

```bash
npm install connect-4-solver
```

## Supported Environments

The library provides a universal factory function `createSolver()` that automatically detects your environment and dynamically loads the optimal execution engine. This ensures your application is fast and your bundle size remains small:

- **Node.js**: Automatically loads the native C++ N-API addon.
- **Modern Browsers**: Automatically loads the Threaded WASM module (if SAB/COOP/COEP are enabled).
- **Legacy Browsers**: Falls back to the single-threaded WASM module.

If you need explicit control over the engine architecture or are targeting specific platforms (e.g. React Native), you can bypass the factory and import explicit solver classes from their respective sub-paths:

- **`NodeConnect4Solver`** (import from `"connect-4-solver/node"`)
- **`SyncWasmConnect4Solver`** (import from `"connect-4-solver/threaded"`)
- **`SyncWasmNoSABConnect4Solver`** (import from `"connect-4-solver/sync"`)
- **`ReactNativeConnect4Solver`** (import from `"connect-4-solver/native"`)
- **`WebWorkerWasmConnect4Solver`** (import from `"connect-4-solver/async"`)

## Quick Start

::: warning ⚠️ Exact Solving vs. Heuristics on Large Boards
**Exact Solver (Default):** On 7x6 boards or larger, calculating a mathematically perfect sequence can take minutes or hours on early-game positions. For practical use, you must load a pre-computed [Solution Book](/solution-books) alongside the engine.

**Heuristic Solver:** The [Heuristic Solver](/heuristic-solver) (`heuristic: true`) does not require books at any size and returns instantly. However, it returns an _estimated_ score (positive means winning) and the `outcome` will always default to `Draw` unless it sees a forced win.
:::

::: code-group

```typescript [Universal Factory (Recommended)]
import { createSolver, OpeningBook, Outcome } from "connect-4-solver";
import fs from "fs";

async function run() {
  // Load a pre-computed opening book (required for practical exact solving on 7x6+)
  const bookData = fs.readFileSync("7x6.book");
  const book = await OpeningBook.fromBuffer(bookData);

  // Automatically detects Node vs Browser and loads the correct engine
  const solver = await createSolver({
    width: book.width,
    height: book.height,
  });
  await solver.init();

  // Analyze a position (column sequence: 1 to board width)
  const result = await solver.analyze("4424", { book });

  if (result.evaluation) {
    if (result.evaluation.outcome === Outcome.Win) {
      console.log(
        `${result.evaluation.winner} wins in ${result.evaluation.movesToEnd} moves`,
      );
    } else if (result.evaluation.outcome === Outcome.Draw) {
      console.log("The game is a draw");
    }
  }

  // Always free native memory when finished
  book.unload();
  solver.unload();
}

run();
```

```typescript [Browser (Async)]
// App.tsx
import {
  WebWorkerWasmConnect4Solver,
  OpeningBook,
  Outcome,
} from "connect-4-solver/async";

async function run() {
  // Fetch the binary opening book
  const res = await fetch("/books/7x6.book");
  const bookBuffer = new Uint8Array(await res.arrayBuffer());
  const book = await OpeningBook.fromBuffer(bookBuffer);

  // 1. Instantiate the Worker (Syntax may vary based on your bundler, e.g. Vite)
  const worker = new Worker(new URL("./c4-worker.ts", import.meta.url), {
    type: "module",
  });

  // 2. Wrap it with the Async Solver matching the book's size
  const solver = new WebWorkerWasmConnect4Solver(worker, {
    width: book.width,
    height: book.height,
  });
  await solver.init();

  const result = await solver.analyze("4424", { book }); // Non-blocking

  if (result.evaluation) {
    if (result.evaluation.outcome === Outcome.Win) {
      console.log(
        `${result.evaluation.winner} wins in ${result.evaluation.movesToEnd} moves`,
      );
    } else if (result.evaluation.outcome === Outcome.Draw) {
      console.log("The game is a draw");
    }
  }

  // Always free native memory
  book.unload();
  solver.unload();
}

run();
```

```typescript [React Native]
import {
  ReactNativeConnect4Solver,
  OpeningBook,
  Outcome,
} from "connect-4-solver/native";

async function run() {
  // Read the binary opening book
  const res = await fetch("https://your-domain.com/7x6.book");
  const bookBuffer = new Uint8Array(await res.arrayBuffer());
  const book = await OpeningBook.fromBuffer(bookBuffer);

  // Uses the C++ JSI bridge (no WASM overhead)
  const solver = new ReactNativeConnect4Solver({
    width: book.width,
    height: book.height,
  });
  await solver.init();

  const result = await solver.analyze("4424", { book });

  if (result.evaluation) {
    if (result.evaluation.outcome === Outcome.Win) {
      console.log(
        `${result.evaluation.winner} wins in ${result.evaluation.movesToEnd} moves`,
      );
    } else if (result.evaluation.outcome === Outcome.Draw) {
      console.log("The game is a draw");
    }
  }

  // Always free native memory
  book.unload();
  solver.unload();
}

run();
```

```typescript [Browser (Sync)]
import { SyncWasmNoSABConnect4Solver } from "connect-4-solver/sync";
import { OpeningBook, Outcome } from "connect-4-solver";

async function run() {
  // Fetch the binary opening book
  const res = await fetch("/books/7x6.book");
  const bookBuffer = new Uint8Array(await res.arrayBuffer());
  const book = await OpeningBook.fromBuffer(bookBuffer);

  // No WebWorker setup required, but blocks the main thread
  const solver = new SyncWasmNoSABConnect4Solver({
    width: book.width,
    height: book.height,
  });
  await solver.init();

  // ⚠️ Blocks the main thread until it finishes resolving!
  const result = solver.analyze("4424", { book });

  if (result.evaluation) {
    if (result.evaluation.outcome === Outcome.Win) {
      console.log(
        `${result.evaluation.winner} wins in ${result.evaluation.movesToEnd} moves`,
      );
    } else if (result.evaluation.outcome === Outcome.Draw) {
      console.log("The game is a draw");
    }
  }

  // Always free native memory
  book.unload();
  solver.unload();
}

run();
```

:::

## High-Speed Best Move Search

If you are building a Connect 4 engine or a hint system, you typically only need the **best move** rather than a full evaluation of every possible column.

The `solve()` method is optimized for this exact use case. It uses a narrow search window and aggressive pruning to find the optimal line up to **5x faster** than a full `analyze()` call.

```typescript
// Fast search for the best move
const result = await solver.solve("4424");

console.log(`Best Move (Col): ${result.bestMove + 1}`);
console.log(`Evaluation: ${result.evaluation?.score}`);
console.log(`Nodes Searched: ${result.nodes}`);

// Note: result.moveOptions will be empty [] when using solve()
```

::: tip 💡 Weak Solving for Maximum Speed
If you only care about the **outcome** (Win/Loss/Draw) and not finding the absolute fastest winning move, you can set `{ weak: true }`. This allows the solver to return even faster by stopping as soon as it confirms any winning path.

- **Winning**: Returns `1` (instead of the exact moves-to-win score).
- **Losing**: Returns `-1`.
- **Draw**: Returns `0`.
:::

## Next Steps

- **[Solution Books](/solution-books)** — Required for practical exact solving on 7x6 and larger boards.
- **[Memory & Threading](/cache)** — Cache sizing, multithreading, and `unload()` lifecycle.
- **[WebWorker Solvers](/api/webworker-solvers)** — Non-blocking browser integration.
- **[API Reference](/api/base-solver)** — Full method signatures and return types.
