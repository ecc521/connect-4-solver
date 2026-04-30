import { NodeConnect4Solver } from "../src/index";

describe("Small Cache Allocation Test", () => {
  it("does not crash or throw on 0 MB cache size", async () => {
    const engine = new NodeConnect4Solver({
      width: 7,
      height: 6,
      cacheSizeMb: 0,
      heuristic: true,
    });
    await engine.init();

    // Just testing that it doesn't crash and returns a valid result.
    const pos = "444452233";
    const result = await engine.analyze(pos, { threads: 1, maxDepth: 4 });
    expect(result.evaluation).toBeDefined();
  });

  it("does not crash or throw on 1 MB cache size", async () => {
    const engine = new NodeConnect4Solver({
      width: 7,
      height: 6,
      cacheSizeMb: 1,
      heuristic: true,
    });
    await engine.init();

    const pos = "444452233";
    const result = await engine.analyze(pos, { threads: 1, maxDepth: 4 });
    expect(result.evaluation).toBeDefined();
  });
});
