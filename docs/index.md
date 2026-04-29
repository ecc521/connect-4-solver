---
layout: home

hero:
  name: "Connect 4 Solver"
  text: "High-performance WASM & Native Solver"
  tagline: "Perfect Connect 4 solver in C++ with WebAssembly and TypeScript bindings for Node.js, browser, and React Native."
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
  - title: Native C++ Power
    details: Multi-threaded C++ compiled to WebAssembly with a lock-free transposition table optimized for L1 cache.
  - title: React Native Bridge
    details: True native C++ bindings for iOS & Android via JSI/JNI. Bypasses WebAssembly overhead entirely for maximum mobile performance.
  - title: Zero Latency Books
    details: Supports pre-evaluated Opening Books to solve early-game states instantly without invoking search routines.
---
