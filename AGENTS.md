# Connect 4 Game Solver - Agent Overview

**Repository Purpose**
This repository provides an extremely fast, high-performance, and "perfect" Connect 4 solver. The core algorithm is written in C++ and compiled into WebAssembly (WASM) for use in web and Node.js environments. It also provides native C++ bindings for React Native (iOS and Android), entirely bypassing WASM on mobile devices. The project is distributed as a strongly-typed TypeScript npm package (`connect-4-solver`) that acts as a wrapper bridging the TS world to the native/WASM engines.

## Key Directories and Files

- **`native/`**
  Contains the core C++ algorithm (`Solver.cpp`, `TranspositionTable.hpp`, `MoveSorter.hpp`, `HeuristicSolver.hpp`) alongside Emscripten binding hooks (`analyze.cpp`) and native JSI-compatible bridging logic. This is where the actual mathematical evaluation takes place.
- **`src/`**
  Contains the TypeScript library source code (e.g. `index.ts`, `core.ts`, `threaded.ts`, `heuristic.ts`). It wraps the WebAssembly and Native module hooks to expose a clean, object-oriented, and strongly-typed API to the end-user.

- **`ios/`** & **`android/`**
  Provide the platform-specific boilerplate for React Native mapping the C++ solver directly to Obj-C/Swift (iOS) and JNI/Java (Android). This allows mobile developers to use this library natively without WebAssembly overhead, including the newly added `HeuristicSolver` endpoints.

- **`test-data/`**
  Stores `.txt` files containing tens of thousands of pre-evaluated Connect 4 positions across various board sizes. These are used extensively by Jest to run continuous parity tests to ensure the TS wrapper outputs match the pure C++ expectations.

- **`data/`**
  Houses the highly-optimized `.cbook` (Compressed Book) and `.book` (Dense Book) opening books. These files are securely read and loaded by the solver to instantiate zero-latency early-game positional caches.

- **`build.sh`**
  The script responsible for running `emcc` (Emscripten) against the `native/` C++ files. It generates the `build/analyze.js` and `build/analyze_threaded.js` WASM bundles.

- **`Dockerfile`**
  Provides an isolated environment for compiling the WebAssembly code. Useful for compiling the C++ to WASM without having Emscripten installed natively on the host machine.

- **`eslint.config.mjs`** & **`tsconfig.json`**
  Establish rigorous code-quality constraints for the TypeScript portion of the repository. They utilize `recommendedTypeChecked`, prohibit `any` types, and enforce explicit function return types.

## Building the Native Addon

When compiling the native C++ bindings for Node.js (especially during development or by agents), you should use the `--jobs` flag to enable parallel compilation. The `package.json` install script is already configured to use `--jobs max`, but if running manually, prefer:

```bash
npx node-gyp rebuild --jobs max
```

To compile the native addon with Profile-Guided Optimization (PGO) and Link-Time Optimization (LTO) for maximum node-throughput, run:
```bash
npm run build:native:pgo
```
This generates the `default.profdata` profile via the C++ benchmark suite and automatically injects `-flto` and the profile data into `node-gyp`.

## Generating New Books

The `TranspositionTable` cache sizes natively default to tight memory constraints optimized for WebAssembly, mobile environments, and browsers (e.g. `TABLE_SIZE=23` mapping to ~32MB, and `HEURISTIC_TABLE_SIZE=22` mapping to ~24MB).

If you are running the `tools/generate-book.ts` script to recursively generate a highly complex dense opening book natively, the script will automatically pass your `--cache` allocation argument downward into the native `ThreadedSolverCache`. This temporarily inflates the transposition table size (e.g., to multiple gigabytes) to utilize host RAM during the alpha-beta search without forcing massive memory footprints onto the consumer-facing `.wasm` libraries.
