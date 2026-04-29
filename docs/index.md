---
layout: home

hero:
  name: "Connect 4 Solver"
  text: "C++ & WASM Bitboard Solver"
  tagline: "High-performance C++ exact & heuristic solver using NNUE + alpha-beta pruning. Bindings for WASM, Node.js, and React Native."
  actions:
    - theme: brand
      text: Getting Started
      link: /getting-started
    - theme: alt
      text: API Reference
      link: /api/base-solver
    - theme: alt
      text: View on GitHub
      link: https://github.com/ecc521/connect-4-solver

features:
  - title: Universal C++ Power
    details: Built in C++ for maximum evaluation speed. Runs natively across Node.js, mobile apps, and directly in the browser via WebAssembly.
  - title: Heuristic NNUE Engine
    details: Includes a fast heuristic evaluator powered by a lightweight Neural Network (NNUE) to instantly assess complex positions.
  - title: Pre-Computed Opening Books
    details: Use pre-computed Opening Books to solve early-game positions immediately.
---
