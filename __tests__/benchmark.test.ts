import { NodeConnect4Solver } from "../src/index";

describe("Heuristic vs Perfect Connectivity Benchmark", () => {
  it("heuristically evaluates complex positions without books", async () => {
    const perfectEngine = new NodeConnect4Solver();
    await perfectEngine.init();

    const heuristicEngine = new NodeConnect4Solver({
      width: 7,
      height: 6,
      heuristic: true,
    });
    await heuristicEngine.init();

    // Random non-terminal mid-game positions
    const positions = ["444452233", "454545", "4545454", "1234567"];

    for (const pos of positions) {
      // Analyze perfectly using actual book + massive tree
      const perfect = await perfectEngine.analyze(pos);

      // Analyze heuristics up to depth 10 - Single Threaded
      const heuristicResult = await heuristicEngine.analyze(pos, {
        threads: 1,
      });

      // Analyze heuristics up to depth 10 - Multi Threaded
      const heuristicThreaded = await heuristicEngine.analyze(pos, {
        threads: 4,
      });



      // Ensure the evaluations are not null and returned valid move option structures
      expect(heuristicResult.moveOptions.length).toBe(
        perfect.moveOptions.length,
      );
      expect(heuristicThreaded.moveOptions.length).toBe(
        perfect.moveOptions.length,
      );

      // Note: We don't strictly assert equality between 1T and 4T scores here because
      // multithreaded Alpha-Beta inherently visits nodes in a slightly different order (Lazy SMP),
      // leading to valid but slightly non-deterministic heuristic scores at strict depth cutoffs.
    }
  }, 120000);
});
