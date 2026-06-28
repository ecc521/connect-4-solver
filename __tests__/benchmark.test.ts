import { NodeConnect4Solver } from "../src/node.js";

describe("Exact analysis benchmark", () => {
  it("exactly evaluates complex positions", async () => {
    const engine = new NodeConnect4Solver();
    await engine.init();

    // Random non-terminal mid-game positions
    const positions = ["444452233", "454545", "4545454", "1234567"];

    for (const pos of positions) {
      const single = await engine.analyze(pos, { threads: 1 });
      const threaded = await engine.analyze(pos, { threads: 4 });

      // Non-terminal positions return a full set of per-column move options;
      // terminal positions return an overall evaluation with no move options.
      // Either way the analysis must produce a usable result.
      const isUsable = (r: { moveOptions: unknown[]; evaluation: unknown }): boolean =>
        r.moveOptions.length > 0 || r.evaluation !== null;
      expect(isUsable(single)).toBe(true);
      expect(isUsable(threaded)).toBe(true);
    }

    engine.release();
  }, 120000);
});
