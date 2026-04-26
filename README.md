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
import { Connect4Solver, Player, Outcome } from "connect-4-solver";
import { ThreadedConnect4Solver } from "connect-4-solver/threaded";
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
  const bookBuffer = fs.readFileSync("path/to/downloaded/7x6_dense10.book");
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

### 📱 React Native (iOS & Android)

For mobile development, `connect-4-solver` includes true native C++ bindings for React Native via JSI/JNI. This entirely bypasses the WebAssembly engine and executes the solver directly on the device's native CPU architecture for maximum performance.

```typescript
import { ReactNativeConnect4Solver } from "connect-4-solver/native";

const runMobile = async () => {
  const solver = new ReactNativeConnect4Solver(7, 6);
  await solver.init();

  // The React Native bindings execute fully asynchronously off the main JS thread automatically
  const result = await solver.analyzeAsync("121212");
  
  if (result.evaluation?.outcome === "Win") {
    console.log("Win detected via Native C++ execution!");
  }
};
```

#### Testing with the Example App

This repository includes a bare-bones React Native `example` application configured to build and test the local `connect-4-solver` library natively.

To test the native bindings on your machine:
1. Ensure you have the Android SDK (for Android) or Xcode/CocoaPods (for iOS) installed.
2. From the root directory, run:
   ```bash
   npm run example:ios
   # or
   npm run example:android
   ```

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

- **`6x5`:** Depth `0` _(No book required; WASM evaluates instantly)_
- **`6x6`:** Depth `4` _(WASM takes ~8s from scratch, but a `6x6_dense4.book` evaluates instantly)_
- **`7x6` (Standard):** Depth `10` or `14` _(The `7x6_dense10.book` is 4MB, `7x6_sparse0-10.book` is 1MB; `7x6_sparse14-16.book` is 33MB)_
- **`7x7`:** Depth `16` to `18`
- **`8x6`:** Depth `20` to `22`
- **`9x7`:** Astronomical complexity. Effectively unsolvable seamlessly without colossal initial caching overheads (> Depth `26`).

Generating opening books for larger board sizes (like `8x6`) can take significant CPU time to compute locally. You can drastically speed this up by building the books natively in C++ across all your CPU cores using GNU Parallel:

1. Navigate to the native directory and compile the solver and generator for your target board size (by updating `WIDTH` and `HEIGHT` in `native/Position.hpp`):
   ```bash
   cd native
   make c4solver generator
   ```
2. Generate all unique positional configurations up to your desired book depth (e.g. depth 14):
   ```bash
   ./generator 14 > positions.txt
   ```
3. Use GNU Parallel to instantly multithread the solver across all CPU cores:
   ```bash
   cat positions.txt | parallel --jobs $(nproc) ./c4solver > scored.txt
   ```
4. Compress the scored outcomes back into a compact `.book` file (rename it matching `widthxheight_denseXX.book` or `widthxheight_sparseXX-YY.book`):
   ```bash
   cat scored.txt | ./generator
   ```

### Choosing Your Dense Book Format (v2 Architecture)

The native solver exclusively operates on the **v2 Packed Memory Architecture**. Older `.book` files (generated prior to the v2 update) use a split-array layout that will gracefully fail to load.

We offer two mathematically perfect v2 architectures natively. **Both formats inherently guarantee 100% collision-free capacities with absolutely zero dropped states**, but they leverage different RAM topological layouts to perfectly optimize for your deployment targets (Mobile vs Desktop):

#### 1. Desktop Performance: Linear Probing (`.book`)
- **Optimal for:** Desktops, Servers, Research computation, Web workloads.
- **Performance:** **Extremely Fast** (`~500 ms` natively across 5 million sequential cache operations).
- **How it works:** Open Addressing via "Linear Probing" naturally stacks state collisions sequentially into matching generic 64-byte CPU L1 Cache Lines natively. You receive perfectly flawless evaluation hits without triggering any additional independent hardware thread stalls.
- **Trade-off:** Structural memory mappings demand power-of-two block dimensions natively (e.g., exactly forcing a 4.0 MB size disk-cap for `dense10`). 
  > *Note: When distributed natively across standard iOS/Android APKs or Node modules, GZIP/ZIP natively squashes this padded structural array to ~2.0MB!*

#### 2. Mobile Bundle Constraint: Cuckoo Hashing (`.cbook`)
- **Optimal for:** Strict Mobile Bundles unsupporting explicit compression topologies.
- **Performance:** **Fast** (`~720 ms` natively across 5 million cache ops - universally negligible for UI response).
- **How it works:** Bucketed Cuckoo Graphs dynamically evaluate the strictly densest physical memory grid mathematical limits. Meaning a typical 4.0 MB data signature can safely squash raw memory natively into **~2.7 MB**. 
- **Trade-off:** Cuckoo math strictly requires scanning two drastically decoupled memory arrays randomly distributed across physical RAM natively, artificially stalling sequential CPU performance slightly to achieve that aggressive compression point.

---

### Upgrading Legacy Books to v2 (.book)

You can instantly convert any legacy v1 `.book` file to the high-performance v2 linear format losslessly using the included `pack_book` converter. (This natively shifts items maintaining 100% flawless compatibility).

1. Compile the packing script natively:
   ```bash
   cd native
   g++ --std=c++11 -W -Wall -O3 pack_book.cpp -o pack_book
   ```
2. Convert your legacy book (saving to a new file or overwriting):
   ```bash
   ./pack_book data/7x6_sparse14-16.book data/7x6_sparse14-16_v2.book
   ```

### Generation of Collision-Free Cuckoo Books (.cbook)

To natively build a size-constrained Mobile `.cbook` off of raw search data organically, utilize the `cuckoo_pack` offline graph expansion protocol dynamically:

1. Compile the cuckoo packer:
   ```bash
   g++ --std=c++11 -W -Wall -O3 cuckoo_pack.cpp -o cuckoo_pack
   ```
2. Feed your fully evaluated solver move list explicitly directly to the packer via stdin:
   ```bash
   ./cuckoo_pack <max_depth> <num_lines_in_file> < scored.txt
   ```
The offline graph builder iteratively expands array constraints seamlessly in 1% increments until all requested states organically bind losslessly.  
> **Tuning Cuckoo Parameters**: The `.cbook` targets 95% density out of the box, producing mathematical maximum compressions. To trade disk compactness back into raw execution speeds gracefully, simply modify `cuckoo_pack.cpp` natively lowering `num_lines / 0.95` toward `0.60`. Expanding the load array natively forces search paths securely into their 1st immediate bucket choice dynamically.

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
