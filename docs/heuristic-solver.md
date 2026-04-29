# Heuristic Solver

The **Heuristic Solver** is an incredibly fast, non-exact evaluation engine. Unlike the exact solver—which rigorously calculates the mathematically perfect sequence to force a win or draw—the heuristic solver uses positional "rules of thumb" to evaluate the board state.

It is designed for real-time applications (like playing against an AI on a mobile app or browser) where waiting for an exact solution is impractical, especially on large boards without an Opening Book.

## When to use it?

* **Playing against humans:** The heuristic solver plays extremely strong Connect 4 and will easily beat most human players.
* **Large boards without books:** If you are analyzing a 7x6 or larger board and *do not* have a Solution Book loaded, the exact solver might hang for minutes or hours. The heuristic solver will return an incredibly strong move instantly.
* **Time-constrained environments:** If you need guaranteed low latency (e.g., `< 25ms`).

## Enabling the Heuristic Solver

You can enable the heuristic engine by passing `heuristic: true` during the initialization of your solver:

```typescript
import { SyncWasmConnect4Solver } from "connect-4-solver";

const solver = new SyncWasmConnect4Solver({
  width: 7, 
  height: 6,
  heuristic: true // Enable the heuristic engine
});

await solver.init();
```

## Configuration Parameters

When calling `.analyze()` on a heuristic solver, you can dynamically tune its strength and speed via two optional parameters:

* `maxDepth` *(Default: Infinity)*: The maximum ply-depth the engine is allowed to search. By default, this is dynamically clamped to the maximum mathematical depth of the board (e.g., `42` for a 7x6 board), meaning the engine will search as deep as it possibly can until it hits the timeout. 
* `timeoutMs` *(Default: 25)*: A safety timeout in milliseconds. If the engine takes longer than this to search to `maxDepth`, it will immediately abort the search and return the best move it has found so far.

```typescript
// Search extremely deep, but strictly abort after 100 milliseconds
const result = await solver.analyze("1122", { 
  maxDepth: 30, 
  timeoutMs: 100 
});

console.log(`The solver successfully reached depth: ${result.depthReached}`);
```

### Depth vs. Timeout

Because the heuristic solver uses iterative deepening, it always has a "best guess" available. If it hits the `timeoutMs` limit while searching depth 14, it will gracefully abort the depth 14 search and return the completed evaluation from depth 13.

You can inspect `result.depthReached` to see exactly how deep the solver managed to look before returning.

## Evaluation & Win Probability

Because the heuristic solver estimates the strength of a position rather than calculating an exact win/loss, the returned `Evaluation` object includes a Stockfish-style `eval` wrapper. 

The engine normalizes the neural network output into a standard `eval.value` float and maps it to a **WDL (Win/Draw/Loss)** probability curve. This allows you to easily display human-readable progress bars in your UI without needing to understand the raw mathematical scores!

*The following table provides a rough approximation of how `eval.value` maps to the WDL curve. Do not hardcode these thresholds—always read from the `eval.wdl` object directly in your application!*

| `eval.value` | Win Probability | Draw Probability | Loss Probability | Meaning |
|---|---|---|---|---|
| `+Infinity` | 100% | 0% | 0% | Forced Win found |
| `+8.0` | 88% | <1% | 12% | Crushing Advantage |
| `+4.0` | 73% | 1% | 26% | Strong Advantage |
| `0.0` | 25% | 50% | 25% | Dead Even |
| `-4.0` | 26% | 1% | 73% | Strong Disadvantage |
| `-8.0` | 12% | <1% | 88% | Crushing Disadvantage |
| `-Infinity` | 0% | 0% | 100% | Forced Loss found |

> **Note:** The exact mapping coefficients of the sigmoid curve will be continuously refined in future releases as the NNUE weights are trained. The table above is simply an example. The `0.0` to `1.0` probability interface in `eval.wdl`, however, will remain perfectly stable!

> **Books:** The heuristic solver *never* uses Opening Books. Passing a `book` to a heuristic solver's `analyze` method will be ignored.
