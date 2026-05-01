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

## Usage & Documentation

We have comprehensive documentation covering API usage, WebWorkers, Solution Books, and Memory Management.

**[📚 Read the Official Documentation](https://ecc521.github.io/connect-4-solver/)**
_(If the link is dead, run `npm run docs:dev` locally to view the full Vitepress site!)_

### Building from source

If you want to recompile the WASM module and have Emscripten installed:

```bash
npm run build
```

If you want to manually compile the native bindings for your system (e.g., to squeeze out maximum performance for a backend server):

```bash
# This triggers node-gyp to compile the C++ core natively for your OS
npm install
```

### High-Performance PGO Builds

If you want to squeeze out every last drop of solving speed (yielding an extra ~15-20% throughput by optimizing branch prediction and instruction caching), you can build the library using Profile-Guided Optimization (PGO) and Link-Time Optimization (LTO).

For the Node.js native extension:
```bash
npm run build:native:pgo
```
*Note: This will take a few minutes to run. It compiles an instrumented C++ binary, evaluates hundreds of millions of test nodes to generate an execution profile, and finally triggers `node-gyp rebuild` to inject the generated `default.profdata` profile back into the final addon with `-flto` enabled.*

For the WebAssembly binary:
```bash
npm run build:wasm:pgo
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

- Published under **AGPL v3** license.
- Partially based off the work of [Pascal Pons](http://blog.gamesolver.org), [John Tromp](https://tromp.github.io/c4/c4.html), and [Christophe Steininger](https://github.com/ChristopheSteininger/c4).
- Extensively modified to add multi-threaded support, NNUE, tiered-cache tables, and a variety of other optimizations as well as multi-platform support.
