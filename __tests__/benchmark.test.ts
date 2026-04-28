import { HeuristicConnect4Solver as HeuristicSolver } from "../src/index";
import { Connect4Solver as PerfectSolver } from "../src/index";

describe("Heuristic vs Perfect Connectivity Benchmark", () => {
  it("heuristically evaluates complex positions without books", async () => {
    const perfectEngine = new PerfectSolver();
    await perfectEngine.init();

    const heuristicEngine = new HeuristicSolver(7, 6);
    await heuristicEngine.init();

    // Random non-terminal mid-game positions
    const positions = [
      "444452233",
      "454545",
      "4545454",
      "1234567"
    ];

    for (const pos of positions) {
      // Analyze perfectly using actual book + massive tree
      const perfect = await perfectEngine.analyzeAsync(pos);
      
      // Analyze heuristics up to depth 10 - Single Threaded
      const heuristicResult = await heuristicEngine.analyzeAsync(pos, { threads: 1 });
      
      // Analyze heuristics up to depth 10 - Multi Threaded
      const heuristicThreaded = await heuristicEngine.analyzeAsync(pos, { threads: 4 });

      console.log(`[Pos: ${pos}] Perfect Score: ${perfect.evaluation?.score} | Heuristic (1T): ${heuristicResult.evaluation?.score} | Heuristic (4T): ${heuristicThreaded.evaluation?.score}`);
      
      // Ensure the evaluations are not null and returned valid move option structures
      expect(heuristicResult.moveOptions.length).toBe(perfect.moveOptions.length);
      expect(heuristicThreaded.moveOptions.length).toBe(perfect.moveOptions.length);
      
      // Note: We don't strictly assert equality between 1T and 4T scores here because 
      // multithreaded Alpha-Beta inherently visits nodes in a slightly different order (Lazy SMP),
      // leading to valid but slightly non-deterministic heuristic scores at strict depth cutoffs.
    }
  }, 120000);
});
