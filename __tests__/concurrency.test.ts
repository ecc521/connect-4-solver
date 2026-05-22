import { NodeConnect4Solver } from "../src/node.js";
import { SolverAbortedError } from "../src/core.js";
import { describe, it, expect } from "@jest/globals";

describe("Solver Concurrency Guard", () => {
  it("should queue a second solve() call while one is in progress", async () => {
    const solver = new NodeConnect4Solver();
    await solver.init();

    // Start a search, then immediately queue a second one.
    // With the queue model, both should resolve (not throw).
    const p1 = solver.solve("112233");
    const p2 = solver.solve("112233");

    try {
      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1).toBeDefined();
      expect(r2).toBeDefined();
    } finally {
      solver.release();
    }
  });

  it("should reject queued tasks with SolverAbortedError when stop() is called", async () => {
    const solver = new NodeConnect4Solver();
    await solver.init();

    // Queue two tasks — the second will be queued behind the first
    const p1 = solver.solve("112233", { timeoutMs: 30000 });
    const p2 = solver.solve("112233");

    // Attach handlers BEFORE calling stop() to avoid unhandled rejection warnings
    const p2Expectation = expect(p2).rejects.toBeInstanceOf(SolverAbortedError);
    const p1Settled = p1.catch(() => {
      /* allow rejection too */
    });

    // Stop immediately — flushes p2 from queue with SolverAbortedError
    await solver.stop();

    // Verify expectations
    await p2Expectation;
    await p1Settled;

    solver.release();
  });
});
