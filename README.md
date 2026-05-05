# Connect 4 Game Solver

High-performance, multi-board-size Connect 4 solver with NNUE heuristic evaluation and alpha-beta pruning. Native C++ core compiled to WebAssembly and Node.js native addons, wrapped in a strongly-typed TypeScript API.

## Installation

```bash
npm install connect-4-solver
```

On Node.js, the native C++ addon will automatically compile for maximum performance. If compilation fails (e.g., missing build tools), the package gracefully falls back to the included WebAssembly bundle.

## Features

- **Exact Solver** — Perfect play via alpha-beta pruning with Lazy SMP multi-threading
- **Heuristic Solver** — NNUE neural network evaluation for fast approximate analysis
- **Multi-Board Support** — Boards from 4×4 to 12×12 (up to 128-bit position masks)
- **Opening Books** — Dense and Elias-Fano compressed book formats for instant early-game lookups
- **Multi-Runtime** — Node.js native addon, single-threaded WASM, threaded WASM (SharedArrayBuffer), and React Native (iOS/Android JSI)
- **TypeScript First** — Full type definitions, object-oriented API, comprehensive WDL evaluation

## Quick Start

```typescript
import { createSolver } from "connect-4-solver";

const solver = await createSolver();
await solver.init();

// Analyze all columns from a position (moves are 1-indexed columns)
const result = await solver.analyze("44445223");
console.log(result.evaluation); // { outcome: 'Win', score: 5, ... }
console.log(result.moveOptions); // Per-column evaluations

// Solve for the optimal score
const solve = await solver.solve("44445223");
console.log(solve.evaluation?.score); // Exact minimax score
```

### Heuristic Mode

```typescript
import { createSolver } from "connect-4-solver";

const solver = await createSolver({ heuristic: true });
await solver.init();

// Fast approximate evaluation with depth/time limits
const result = await solver.analyze("44445223", {
  maxDepth: 15,
  timeoutMs: 50,
  threads: 4,
});
```

### Custom Board Sizes

```typescript
import { NodeConnect4Solver } from "connect-4-solver/node";

const solver = new NodeConnect4Solver({ width: 8, height: 8 });
await solver.init();

const result = await solver.analyze("44445223");
```

## Usage & Documentation

Comprehensive docs covering API usage, WebWorkers, Solution Books, and Memory Management:

**[📚 Read the Official Documentation](https://ecc521.github.io/connect-4-solver/)**
_(If the link is dead, run `npm run docs:dev` locally to view the full Vitepress site!)_

## Building from Source

### WASM Module

```bash
npm run build           # Requires Emscripten (emcc)
```

### Native Addon

```bash
npm run build:native    # Compiles C++ via node-gyp
```

### Docker Build (no local Emscripten needed)

```bash
npm run docker:build:image   # Build the Docker image once
npm run docker:build:wasm    # Compile WASM inside Docker
```

## Performance & Benchmarking

### Quick Benchmark

```bash
npm run bench                            # Node.js native addon (default: 7x6, 8x8)
npm run bench -- --sizes 7x6 9x7 --threads 1 4 8
npm run bench:wasm                       # WASM benchmark
npm run bench:cpp                        # Raw C++ engine (bypasses Node.js entirely)
npm run bench:book                       # Opening book lookup benchmark
```

### PGO Builds (Profile-Guided Optimization)

Native Node.js environments support PGO for maximum C++ throughput. (PGO yields mixed results, typically providing ~2% improvement on `bench:native`).

> [!WARNING]
> WebAssembly PGO has been intentionally removed from this repository. While Emscripten supports LLVM PGO, the aggressively inlined code inflates the WASM binary AST size beyond V8's optimization limits. This causes TurboFan to abort JIT compilation ("bailout"), forcing the engine to run the core solver loop in the baseline Liftoff interpreter, resulting in catastrophic performance regressions (often 30-80% slower).

```bash
# Native PGO
npm run build:native:pgo

# A/B comparison (builds baseline → runs bench → builds PGO → runs bench again)
npm run bench:pgo:native
```

## npm Scripts Reference

| Script                         | Description                           |
| ------------------------------ | ------------------------------------- |
| `npm run build`                | Build WASM + TypeScript               |
| `npm run build:ts`             | TypeScript compilation only           |
| `npm run build:native`         | Recompile native C++ addon            |
| `npm run build:native:pgo`     | PGO-optimized native build            |
| `npm run build:wasm`           | Compile WASM module                   |
| `npm test`                     | Lint + Jest unit tests                |
| `npm run bench` / `bench:node` | Benchmark via Node.js native addon    |
| `npm run bench:wasm`           | Benchmark via WASM                    |
| `npm run bench:cpp`            | Benchmark raw C++ engine (no Node.js) |
| `npm run bench:book`           | Opening book benchmark                |
| `npm run bench:pgo:native`     | PGO A/B comparison (native)           |
| `npm run docs:dev`             | Local VitePress dev server            |

## Board Size Support

| Board         | Position Bits | Status                           |
| ------------- | ------------- | -------------------------------- |
| 7×6           | 56-bit (u64)  | ✅ Primary — NNUE, opening books |
| 8×8           | 72-bit (u128) | ✅ Primary — NNUE, full support  |
| 6×5, 6×6, 8×6 | ≤56-bit       | ✅ Supported                     |
| 9×7, 7×7, 7×8 | >56-bit       | ✅ 128-bit fallback              |
| Up to 12×12   | ≤128-bit      | ✅ Generic template              |

## Credits & License

- Published under **AGPL v3** license.
- Partially based off the work of [Pascal Pons](http://blog.gamesolver.org), [John Tromp](https://tromp.github.io/c4/c4.html), and [Christophe Steininger](https://github.com/ChristopheSteininger/c4).
- Extensively modified to add multi-threaded support, NNUE, tiered-cache tables, and a variety of other optimizations as well as multi-platform support.
