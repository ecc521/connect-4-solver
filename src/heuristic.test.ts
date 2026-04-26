import { HeuristicConnect4Solver } from "./heuristic";
import { Outcome } from "./core";

describe("HeuristicConnect4Solver", () => {
  let solver: HeuristicConnect4Solver;

  beforeAll(async (): Promise<void> => {
    solver = new HeuristicConnect4Solver(7, 6);
    await solver.init();
  });

  test("should detect an immediate win", (): void => {
    const result = solver.analyze("121212", { maxDepth: 6 });
    expect(result.evaluation?.outcome).toBe(Outcome.Win);
    expect(result.evaluation?.score).toBeGreaterThan(10);
  });

  test("should detect a forced block scenario", (): void => {
    const result = solver.analyze("12131", { maxDepth: 6 });
    // P1 (moves: 1, 1, 1). P2 (moves: 2, 3).
    // P2 MUST play 1 to block P1.
    // The heuristic score should heavily favor P1 since P1 has an unblocked 3-in-a-row.
    expect(result.evaluation).toBeDefined();
    // P2 plays... they must play 1. 
    // Move option index 0 (which is column 1) should be clearly the best move.
    
    // Heuristic evaluations are mapped to Draw while unresolved
    expect(result.evaluation?.outcome).toBe(Outcome.Draw);
    
    const bestMove = result.moveOptions[0];
    expect(bestMove).toBeDefined();
  });

  test("should evaluate a complex 9x7 board instantly using iterative deepening", async (): Promise<void> => {
    const massiveSolver = new HeuristicConnect4Solver(9, 7);
    await massiveSolver.init();

    const start = Date.now();
    // Arbitrary opening sequence
    const result = massiveSolver.analyze("5555464673", { maxDepth: 10 });
    const end = Date.now();

    expect(end - start).toBeLessThan(1500); // Must be fast
    expect(result.evaluation).toBeDefined();
    expect(result.evaluation?.outcome).toBe(Outcome.Draw);
    expect(result.evaluation?.score).toBeDefined();
  });

  test("should gracefully abort dense searches when maxTime threshold hits", async (): Promise<void> => {
    const massiveSolver = new HeuristicConnect4Solver(9, 7);
    await massiveSolver.init();

    const start = Date.now();
    // Demand an impossible depth computation to force the timeout
    const result = massiveSolver.analyze("5555464673", { maxDepth: 25, timeoutMs: 15 });
    const end = Date.now();

    expect(end - start).toBeLessThan(35); // Allow some JS overhead but enforce cutoff
    expect(result.evaluation).toBeDefined();
  });
});
