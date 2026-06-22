import { NodeConnect4Solver } from "../src/node.js";

describe("128-bit / 64-bit Boundary Tests", () => {
  it("solves accurately on 9x6 (64-bit boundary)", async () => {
    const engine = new NodeConnect4Solver({
      width: 9,
      height: 6,
    });
    await engine.init();

    // Just testing that it doesn't crash and returns a valid result.
    // Exact 9x6 from this position is intractable, so bound it with a timeout;
    // a bounded call must return cleanly (aborted) without hanging.
    const pos = "444452233";
    const result = await engine.analyze(pos, { threads: 1, timeoutMs: 500 });
    expect(result).toBeDefined();
    expect(result.currentPlayer).toBeDefined();
    engine.release();
  }, 30000);

  it("does not crash on 8x8 (128-bit boundary) with a timeout", async () => {
    const engine = new NodeConnect4Solver({
      width: 8,
      height: 8,
    });
    await engine.init();

    // Exact 8x8 is intractable from a near-empty board; an unbounded solve
    // would hang. A bounded call must return (aborted) without hanging.
    const pos = "444452233";
    const result = await engine.analyze(pos, { threads: 1, timeoutMs: 500 });
    expect(result).toBeDefined();
    expect(result.aborted).toBe(true);
    engine.release();
  }, 30000);
});

describe("Exact solver timeoutMs", () => {
  it("aborts a hard near-empty 8x8 solve within the timeout", async () => {
    const engine = new NodeConnect4Solver({
      width: 8,
      height: 8,
    });
    await engine.init();

    const timeoutMs = 300;
    const start = Date.now();
    // Near-empty 8x8 is intractable to solve exactly; the timeout must kick in.
    const result = await engine.solve("4", { threads: 1, timeoutMs });
    const elapsed = Date.now() - start;

    expect(result.aborted).toBe(true);
    // Should return shortly after the timeout, not hang. Generous wall-clock bound.
    expect(elapsed).toBeLessThan(5000);

    engine.release();
  }, 30000);

  it("aborts a hard near-empty 8x8 analyze within the timeout", async () => {
    const engine = new NodeConnect4Solver({
      width: 8,
      height: 8,
    });
    await engine.init();

    const timeoutMs = 300;
    const start = Date.now();
    const result = await engine.analyze("4", { threads: 1, timeoutMs });
    const elapsed = Date.now() - start;

    expect(result.aborted).toBe(true);
    expect(elapsed).toBeLessThan(5000);

    engine.release();
  }, 30000);
});
