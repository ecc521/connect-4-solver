import { NodeConnect4Solver } from "./node.js";
import { Outcome, PositionAnalysis } from "./index.js";

describe("HeuristicNodeConnect4Solver", () => {
  let solver: NodeConnect4Solver;

  beforeAll(async (): Promise<void> => {
    solver = new NodeConnect4Solver({ width: 7, height: 6, heuristic: true });
    await solver.init();
  });

  afterAll(() => {
    if (solver) solver.release();
  });

  test("should detect an immediate win", async (): Promise<void> => {
    const result = await solver.analyze("121212", { maxDepth: 6 });
    expect(result.evaluation?.outcome).toBe(Outcome.Win);
  });

  test("should match exact solver outcome when given uncapped time/depth", async (): Promise<void> => {
    const pos = "112233";
    const exactSolver = new NodeConnect4Solver({
      width: 7,
      height: 6,
      heuristic: false,
    });
    await exactSolver.init();

    const [exactRes, heuristicRes] = await Promise.all([
      exactSolver.solve(pos),
      solver.solve(pos, { maxDepth: 42, timeoutMs: 5000 }),
    ]);

    // Heuristic scores are shifted by 31000 for terminal wins
    const hScore = heuristicRes.evaluation?.score ?? 0;
    const eScore = exactRes.evaluation?.score ?? 0;

    expect(hScore).toBe(eScore);
    exactSolver.release();
  });

  test("should gracefully abort dense searches when maxTime threshold hits", async (): Promise<void> => {
    const massiveSolver = new NodeConnect4Solver({
      width: 9,
      height: 7,
      heuristic: true,
    });
    await massiveSolver.init();

    const start = Date.now();
    await massiveSolver.analyze("5555464673", { maxDepth: 25, timeoutMs: 15 });
    const end = Date.now();

    expect(end - start).toBeLessThan(250);
    massiveSolver.release();
  });

  test("should return valid results for heuristic solve()", async (): Promise<void> => {
    const result: PositionAnalysis = await solver.solve("444452233", {
      maxDepth: 10,
      timeoutMs: 100,
    });
    expect(result.evaluation).not.toBeNull();
    expect(result.evaluation?.score).toBeDefined();
  });
});
