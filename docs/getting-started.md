# Getting Started

Welcome to the **Connect 4 Solver** documentation! This guide will help you install the package and run your first perfect evaluation.

## Installation

Install the package via npm:

```bash
npm install connect-4-solver
```

## Quick Start

The core class is `Connect4Solver`. It automatically detects the best environment available (Native N-API for Node.js, or WebAssembly for browsers) and manages memory safely.

```typescript
import { Connect4Solver, Player, Outcome } from "connect-4-solver";

async function run() {
  // Initialize the standard solver (e.g. 7x6 board)
  // By default, this provisions a 128MB cache.
  const solver = new Connect4Solver({ width: 7, height: 6 });
  await solver.init();

  // Analyze a position (column sequence: 1 to board width)
  // The solver evaluates asynchronously via native threads/libuv!
  const result = await solver.analyze("4424");

  if (result.evaluation) {
    if (result.evaluation.outcome === Outcome.Win) {
      console.log(`${result.evaluation.winner} wins in ${result.evaluation.movesToEnd} moves`);
    } else if (result.evaluation.outcome === Outcome.Draw) {
      console.log("The game is a draw");
    }
  }

  // ⚠️ IMPORTANT: To prevent memory leaks, always release the solver when finished!
  solver.release();
}

run();
```

## Multithreading

By default, the solver utilizes a single thread. For extremely deep calculations (e.g., empty or nearly empty boards), you can dramatically speed up the evaluation by allocating more threads. 

```typescript
// Scale up to 4 threads natively!
const result = await solver.analyze("4424", { threads: 4 });
```

::: warning ⚠️ Node.js Concurrent Evaluations
When running `connect-4-solver` in Node.js, asynchronous tasks are offloaded to Node's `libuv` thread pool, which defaults to **4 parallel threads**. If you are evaluating multiple positions concurrently using `Promise.all` across multiple `Connect4Solver` instances, you **must** increase your thread pool size before your application starts:

```bash
export UV_THREADPOOL_SIZE=32
```
:::

## Next Steps

- Explore the [API Reference](/api/connect4solver) for advanced configuration.
- Read about [Opening Books](/solution-books) to get instant evaluations for the first 14+ moves.
- Deploying to the browser? Read the [WebWorkers Guide](/web-workers) for best practices.
