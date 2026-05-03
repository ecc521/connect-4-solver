import { NodeConnect4Solver } from "./node";
import { Player, Outcome } from "./index";

const BOARD_WIDTH = 7;

describe("NodeConnect4Solver", () => {
  let solver: NodeConnect4Solver;

  beforeAll(async (): Promise<void> => {
    solver = new NodeConnect4Solver();
    await solver.init();
  }, 15000);

  afterAll(() => {
    solver.release();
  });

  test("should analyze a deep position asynchronously", async (): Promise<void> => {
    const result = await solver.analyze("121212333");
    expect(result.originalPosition).toBe("121212333");
    expect(result.evaluation).not.toBeNull();
    expect(result.moveOptions).toHaveLength(BOARD_WIDTH);
  });

  test("should detect a winning position", async (): Promise<void> => {
    const result = await solver.analyze("1212121");
    expect(result.evaluation?.outcome).toBe(Outcome.Win);
    expect(result.evaluation?.winner).toBe(Player.P1);
    expect(result.position).toBe("1212121");
  });

  test("should handle invalid moves", async (): Promise<void> => {
    const result = await solver.analyze("1111111");
    expect(result.position).not.toBe(result.originalPosition);
    expect(result.evaluation).toBeNull();
  });

  test("should correctly evaluate a known position", async (): Promise<void> => {
    // A deep position that should be resolvable quickly
    const result = await solver.analyze("121212333", { timeoutMs: 5000 });
    expect(result.evaluation).not.toBeNull();
    expect(result.evaluation?.score).toBeDefined();
  });

  describe("Generic Board Sizes Support", () => {
    it("should correctly instantiate and evaluate an 8x6 board", async () => {
      const testSolver = new NodeConnect4Solver(8, 6);
      await testSolver.init();
      // P1 plays 1, 2, 3, 4. P2 plays 8, 8, 8. P1 Wins on move 7!
      const result = await testSolver.analyze("1828384");
      expect(result.evaluation?.outcome).toBe(Outcome.Win);
      testSolver.release();
    });

    it("should correctly instantiate and evaluate a 9x7 board using 128-bit fallback", async () => {
      const testSolver = new NodeConnect4Solver(9, 7);
      await testSolver.init();
      // P1 plays 1, 2, 3, 4. P2 plays 9, 9, 9. P1 Wins on move 7!
      const result = await testSolver.analyze("1929394");
      expect(result.evaluation?.outcome).toBe(Outcome.Win);
      testSolver.release();
    });

    it("should correctly instantiate a 6x5 board", async () => {
      const testSolver = new NodeConnect4Solver(6, 5);
      await testSolver.init();
      const result = await testSolver.analyze("123456");
      expect(result.evaluation).not.toBeNull();
      testSolver.release();
    });

    it("should correctly instantiate an 8x8 board (128-bit)", async () => {
      const testSolver = new NodeConnect4Solver({ width: 8, height: 8, heuristic: true });
      await testSolver.init();
      // Use heuristic with shallow depth to avoid timeout — this is a structural smoke test
      const result = await testSolver.analyze("12345678", { maxDepth: 4, timeoutMs: 2000 });
      expect(result.evaluation).not.toBeNull();
      testSolver.release();
    });
  });
});
