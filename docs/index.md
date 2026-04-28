---
layout: home

hero:
  name: "Connect 4 Solver"
  text: "High-performance WASM & Native Solver"
  tagline: "Perfect Connect 4 solver in C++ with a high-performance WebAssembly binary bridge and an object-oriented TypeScript wrapper."
  actions:
    - theme: brand
      text: API Reference
      link: /api/standard
    - theme: alt
      text: View on GitHub
      link: https://github.com/ecc521/connect-4-solver

features:
  - title: Native C++ Power
    details: Written in highly optimized, multi-threaded C++ and compiled to WebAssembly. Features a highly-dense L1-optimized transposition table lock-free architecture.
  - title: React Native Bridge
    details: True native C++ bindings for iOS & Android via JSI/JNI. Bypasses WebAssembly overhead entirely for maximum mobile performance.
  - title: Zero Latency Books
    details: Supports pre-evaluated Opening Books to solve early-game states instantly without invoking search routines.
---

## Installation

```bash
npm install connect-4-solver
```

## Quick Start

```typescript
import { Connect4Solver, Player, Outcome } from "connect-4-solver";

// Initialize the standard single-threaded solver (e.g. 7x6 board)
const solver = new Connect4Solver(7, 6);
await solver.init();

// Analyze a position (column sequence: 1 to board width)
const result = solver.analyze("4424");

if (result.evaluation) {
  if (result.evaluation.outcome === Outcome.Win) {
    console.log(`${result.evaluation.winner} wins in ${result.evaluation.movesToEnd} moves`);
  } else if (result.evaluation.outcome === Outcome.Draw) {
    console.log("The game is a draw");
  }
}

// ⚠️ IMPORTANT: To prevent WebAssembly memory leaks, always unload the solver when finished!
solver.unload();
```
