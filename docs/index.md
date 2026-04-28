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

Read the full [Getting Started](/getting-started) guide to begin.
