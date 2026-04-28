# Memory & Caching

Because the Connect 4 engine uses a highly optimized C++ core compiled to WebAssembly (WASM), it relies on manual memory management. **WebAssembly does not have a Garbage Collector for native pointers**, so developers must explicitly understand how caching works to avoid crashing the browser tab with memory leaks.

## The Transposition Table (Cache)

When a solver evaluates a position, it must evaluate millions of potential future board states. To prevent redundant calculations, the solver stores previously evaluated states in a high-density L1-optimized **Transposition Table** (the "Cache").

By default, every time you instantiate a `Connect4Solver`, it automatically creates an implicit, private cache for itself in the WASM heap:

```typescript
// Implicit Memory Allocation
const solver = new Connect4Solver(7, 6);
await solver.init(); // Allocates ~64MB of WASM Memory automatically

// ... run operations ...

// You MUST manually trigger the deallocation!
solver.unload(); 
```

::: warning ⚠️ MANDATORY DEALLOCATION
Failing to call `solver.unload()` when you are done with the solver will result in a permanent memory leak. The browser cannot automatically clean up the C++ pointers.
:::

## Cache Sharing

If you are spinning up multiple instances of the solver (for example, in a WebWorker pool to handle concurrent requests), you can explicitly instantiate a `SolverCache` and share it across multiple solvers:

```typescript
import { Connect4Solver, SolverCache } from "connect-4-solver";

// 1. Create a single 64MB Cache
const sharedCache = new SolverCache(7, 6, 1024 * 1024 * 64, false);
await sharedCache.init();

// 2. Pass the explicitly managed cache to multiple solvers
const solver1 = new Connect4Solver({ width: 7, height: 6, cache: sharedCache });
const solver2 = new Connect4Solver({ width: 7, height: 6, cache: sharedCache });

await solver1.init();
await solver2.init();

// ... run operations ...

// 3. Unload the solvers
solver1.unload();
solver2.unload();

// 4. Finally, explicitly destroy the shared cache when the app closes
sharedCache.destroy();
```

### Benefits of Shared Caches
1. **Algorithmic Efficiency:** One large shared cache pool is superior to multiple isolated caches. By aggregating the pool, solvers experience far fewer hash collisions.
2. **Knowledge Sharing:** Because solvers are reading and writing to the exact same pointer memory space, if `solver1` evaluates a complex sub-branch, `solver2` can instantly pull the result from the shared cache instead of recalculating it from scratch!

## Heuristic vs Exact Caches

The memory architecture natively utilizes different physical structs for heuristic scoring compared to exact terminal-depth scoring. **You cannot mix caches.**
If you are initializing a Heuristic solver, you must explicitly flag `isHeuristic = true` when creating the cache:

```typescript
import { HeuristicSolverCache } from "connect-4-solver";

const heuristicCache = new HeuristicSolverCache(8, 8, 1024 * 1024 * 32); 
await heuristicCache.init();
```
