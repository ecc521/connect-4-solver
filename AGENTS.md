# Connect 4 Game Solver - Agent Overview

**Repository Purpose**
This repository provides an extremely fast, high-performance, and "perfect" Connect 4 solver. The core algorithm is written in C++ and compiled into WebAssembly (WASM) for use in web and Node.js environments. It also provides native C++ bindings for React Native (iOS and Android), entirely bypassing WASM on mobile devices. The project is distributed as a strongly-typed TypeScript npm package (`connect-4-solver`) that acts as a wrapper bridging the TS world to the native/WASM engines. 

## Key Directories and Files

* **`native/`**
  Contains the core C++ algorithm (`Solver.cpp`, `TranspositionTable.hpp`, `MoveSorter.hpp`) alongside Emscripten binding hooks (`analyze.cpp`) and native JSI-compatible bridging logic. This is where the actual mathematical evaluation takes place.

* **`src/`**
  Contains the TypeScript library source code (e.g. `index.ts`, `core.ts`, `threaded.ts`). It wraps the WebAssembly and Native module hooks to expose a clean, object-oriented, and strongly-typed API to the end-user.

* **`ios/`**, **`android/`**, and **`connect-4-solver.podspec`**
  Provide the platform-specific boilerplate for React Native. They map the C++ solver directly to Obj-C/Swift (iOS) and JNI/Java (Android), allowing mobile developers to use this library natively without WebAssembly overhead.

* **`test-data/`**
  Stores large `.txt` files containing tens of thousands of pre-evaluated Connect 4 positions across various board sizes. These are used extensively by Jest to run continuous parity tests to ensure the TS wrapper outputs match the pure C++ expectations.

* **`build.sh`**
  The script responsible for running `emcc` (Emscripten) against the `native/` C++ files. It generates the `build/analyze.js` and `build/analyze_threaded.js` WASM bundles.

* **`Dockerfile`**
  Provides an isolated environment for compiling the WebAssembly code. Useful for developers (or agents) who do not have Emscripten installed natively on their machine.

* **`eslint.config.mjs`** & **`tsconfig.json`**
  Establish rigorous code-quality constraints for the TypeScript portion of the repository. They utilize `recommendedTypeChecked`, prohibit `any` types, and enforce explicit function return types.
