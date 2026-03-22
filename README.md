# Connect 4 Game Solver

Perfect Connect 4 solver in C++ with a high-performance WebAssembly binary bridge and an object-oriented TypeScript wrapper.

## Installation

```bash
npm install connect-4-solver
```

## Features

- **High Performance**: Native C++ solver compiled to WebAssembly.
- **Binary Bridge**: Efficient data transfer between WASM and JS (no string parsing).
- **TypeScript Ready**: Full type definitions included.
- **Opening Book Support**: Fast analysis even from move 0.

## Usage

```typescript
import { Connect4Solver, ThreadedConnect4Solver, Player, Outcome } from "connect-4-solver";
import * as fs from "fs";

  // Initialize the standard single-threaded solver
  // Supported sizes: 6x5, 6x6, 7x6, 7x7, 8x6, 9x7
  const solver = new Connect4Solver(7, 6);
  await solver.init();

  // Or explicitly use the powerful Multithreaded WASM engine (Requires COOP/COEP strict HTTP headers!)
  // The Emscripten memory isolation automatically bounds to SharedArrayBuffer mechanics natively.
  const threadedSolver = new ThreadedConnect4Solver(7, 6);
  await threadedSolver.init();

  // Load an opening book for instant performance (Required for evaluating positions with <= 6 moves in a reasonable amount of time)
  // Download book files from: https://github.com/ecc521/connect-4-solver/releases/tag/solutionbooks
  const bookBuffer = fs.readFileSync("path/to/downloaded/book_7x6.book");
  await solver.loadBook(new Uint8Array(bookBuffer));
  // await threadedSolver.loadBook(new Uint8Array(bookBuffer)); // The APIs are completely identical

  // Analyze a position (column sequence: 1 to board width)
  const result = solver.analyze("4424");

  // The threaded backend optionally accepts a concurrency argument (Defaults natively to 1 thread)
  // const threadedResult = threadedSolver.analyze("4424", { threads: 4 });

  if (result.evaluation) {
    if (result.evaluation.outcome === Outcome.Win) {
      console.log(
        `${result.evaluation.winner} wins in ${result.evaluation.movesToEnd} moves`,
      );
    } else if (result.evaluation.outcome === Outcome.Draw) {
      console.log("The game is a draw");
    }
  }

  // Iterate over move options (index 0-6 maps to columns 1-7)
  result.moveOptions.forEach((ev, index) => {
    if (ev) {
      console.log(`Column ${index + 1}: ${ev.outcome} (${ev.score})`);
    } else {
      console.log(`Column ${index + 1}: Full`);
    }
  });
}

run();
```

### Multithreading Scaling Expectations

The threaded solver uses a "Root Splitting" architecture alongside a global lock-free sequence-locked Transposition Table (inspired by strict chess engines like Stockfish). Because Alpha-Beta search relies heavily on sequential tree cutoffs, multithreading scaling is logarithmic, not linear.

- **2 Threads:** Executes in **~60-65%** of the baseline time.
- **4 Threads:** Executes in **~40-45%** of the baseline time.
- **8 Threads:** Executes in **~25-35%** of the baseline time.

The threads dynamically share their evaluated tree hashes with each other across the WebWorker memory pool in real-time, allowing sister-threads to instantly prune millions of branches the fraction of a second a branch refutation is discovered.

### ⚠️ Web Browsers & Node.js (Web Workers)

WebAssembly execution is fundamentally **synchronous and blocking**. Calling `solver.analyze()` directly on your main UI thread will instantly freeze your browser tab until the C++ algorithm formally completes its evaluation.

To achieve non-blocking execution safely on Web/Node environments, you **must** instantiate the solver natively inside your own application's Web Worker.

Here is a standard WebWorker architecture (`worker.ts`) you should securely deploy inside your app:

```typescript
// worker.ts (Inside your application codebase)
import { Connect4Solver } from "connect-4-solver";

let solver: Connect4Solver;

self.onmessage = async (e) => {
  const { type, position } = e.data;

  if (type === "INIT") {
    solver = new Connect4Solver(7, 6);
    await solver.init();
    // await solver.loadBook(bookBuffer);
    self.postMessage({ type: "READY" });
  } else if (type === "ANALYZE") {
    // The intensive C++ call executes safely out of the Main Thread here!
    const result = solver.analyze(position);
    self.postMessage({ type: "RESULT", result });
  }
};
```

_(Note: The React Native `"connect-4-solver/native"` plugins circumvent this entirely! They are exclusively engineered to run 100% asynchronously on true background CPU hooks natively!)_

### Analysis Result Structure

The `analyze` method returns a `PositionAnalysis` object:

```typescript
export enum Player {
  P1 = "P1", // Moves first
  P2 = "P2", // Moves second
}

export enum Outcome {
  Win = "Win",
  Loss = "Loss",
  Draw = "Draw",
}

export interface Evaluation {
  outcome: Outcome;
  winner: Player | null; // null when Draw
  movesToEnd: number | null; // null when Draw
  score: number; // raw score (positive = current player winning)
}

export interface PositionAnalysis {
  position: string; // Validated position (may differ if input was invalid)
  originalPosition: string; // Raw input string
  currentPlayer: Player; // Whose turn it is at the analyzed position
  evaluation: Evaluation | null; // Overall evaluation of the position
  moveOptions: (Evaluation | null)[]; // Evaluation for playing in each column (1 to board width)
}
```

## Advanced

### Building from source

If you want to recompile the WASM module and have Emscripten installed:

```bash
npm run build
```

### Generating Opening Books Natively

**What is "Depth"?**  
Depth refers to the exact number of moves (ply) pre-calculated consecutively starting from a completely empty board. Connect 4 branching logic scales _exponentially_ based on the remaining unplayed mathematical volume. By generating an opening book up to an explicit Depth (e.g. `14`), you are securely caching the perfect evaluations for every single valid board permutation that can possibly occur within the first 14 turns. The upstream user's device instantly fetches this cached scenario directly from the `.book` memory buffer without burning their processor cycle.

**Depth Recommendations (Targeting `<1s` UI Response Times):**

- **`6x5` & `6x6`:** Depth `0` _(No book required; WASM evaluates instantly)_
- **`7x6` (Standard):** Depth `12` or `14` _(Standard 14-depth book is ~4MB)_
- **`7x7`:** Depth `16` to `18`
- **`8x6`:** Depth `20` to `22`
- **`9x7`:** Astronomical complexity. Effectively unsolvable seamlessly without colossal initial caching overheads (> Depth `26`).

Generating opening books for larger board sizes (like `8x6`) can take significant CPU time to compute locally. You can drastically speed this up by building the books natively in C++ across all your CPU cores using GNU Parallel:

1. Compile the native solver and generator for your target board size (by updating `WIDTH` and `HEIGHT` in `native/Position.hpp`):
   ```bash
   make
   ```
2. Generate all unique positional configurations up to your desired book depth (e.g. depth 14):
   ```bash
   ./generator 14 > positions.txt
   ```
3. Use GNU Parallel to instantly multithread the solver across all CPU cores:
   ```bash
   cat positions.txt | parallel --jobs $(nproc) ./c4solver > scored.txt
   ```
4. Compress the scored outcomes back into a compact `.book` file:
   ```bash
   cat scored.txt | ./generator
   ```

### Building with Docker

If you don't want to install Emscripten locally, you can use the provided Dockerfile. This creates a complete environment for building both the WASM bridge and the TypeScript wrapper:

1. **Build the image**:

   ```bash
   docker build -t connect4-builder .
   ```

2. **Run the compile**:
   ```bash
   docker run --rm -v $(pwd):/workspace connect4-builder npm run build
   ```

## Credits & License

- Core algorithm by [Pascal Pons](http://blog.gamesolver.org).
- Original C++ source code is published under **AGPL v3** license.
- Wrapper and distribution by Tucker Willenborg (also AGPL v3).
