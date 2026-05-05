import { NodeConnect4Solver } from "../src/node.js";
import { describe, it, expect } from "@jest/globals";

describe("Solver Concurrency Guard", () => {
  it("should throw if solve() is called while another search is in progress", async () => {
    const solver = new NodeConnect4Solver();
    await solver.init();

    // Start a search on a 7x6 board with a position that takes a bit of time
    // to ensure we can catch it in the middle.
    // "112233" is a simple position.
    const p1 = solver.solve("112233");

    try {
      // Try to start another search immediately
      await expect(solver.solve("112233")).rejects.toThrow(
        "Solver is busy: concurrent execution on the same instance is strictly prohibited.",
      );
    } finally {
      await p1;
      solver.release();
    }
  });

  it("should throw if analyze() is called while solve() is in progress", async () => {
    const solver = new NodeConnect4Solver();
    await solver.init();

    const p1 = solver.solve("112233");

    try {
      await expect(solver.analyze("112233")).rejects.toThrow(
        "Solver is busy: concurrent execution on the same instance is strictly prohibited.",
      );
    } finally {
      await p1;
      solver.release();
    }
  });
});
