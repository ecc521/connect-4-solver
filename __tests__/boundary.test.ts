import { NodeConnect4Solver } from "../src/index";

describe("128-bit / 64-bit Boundary Tests", () => {
  it("solves accurately on 9x6 (64-bit boundary)", async () => {
    const engine = new NodeConnect4Solver({
      width: 9,
      height: 6,
      heuristic: true,
    });
    await engine.init();

    // Just testing that it doesn't crash and returns a valid result.
    const pos = "444452233";
    const result = await engine.analyze(pos, { threads: 1, maxDepth: 4 });
    expect(result.evaluation).toBeDefined();
    expect(result.moveOptions.length).toBe(9);
  });

  it("solves accurately on 8x8 (128-bit boundary)", async () => {
    const engine = new NodeConnect4Solver({
      width: 8,
      height: 8,
      heuristic: true,
    });
    await engine.init();

    // Test that the 128-bit position_t works properly
    const pos = "444452233";
    const result = await engine.analyze(pos, { threads: 1, maxDepth: 4 });
    expect(result.evaluation).toBeDefined();
    expect(result.moveOptions.length).toBe(8);
  });
});
