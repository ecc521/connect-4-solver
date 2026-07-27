import { NodeConnect4Solver } from "../src/node.js";

describe("Small Cache Allocation Test", () => {
  it("throws on cache size less than 8 MB", () => {
    expect(() => {
      new NodeConnect4Solver({
        width: 7,
        height: 6,
        cacheSizeMb: 0,
      });
    }).toThrow();

    expect(() => {
      new NodeConnect4Solver({
        width: 7,
        height: 6,
        cacheSizeMb: 7,
      });
    }).toThrow();
  });

  it("does not crash or throw on minimum 8 MB cache size", async () => {
    const engine = new NodeConnect4Solver({
      width: 7,
      height: 6,
      cacheSizeMb: 8,
    });
    await engine.init();

    const pos = "444452233";
    const result = await engine.analyze(pos, { threads: 1 });
    expect(result.evaluation).toBeDefined();
    engine.release();
  });
});
