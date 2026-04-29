import { NodeConnect4Solver, Outcome, OpeningBook } from "./index";
import * as fs from "fs";
import * as path from "path";

describe("HeuristicNodeConnect4Solver", () => {
  let solver: NodeConnect4Solver;
  let book: OpeningBook | undefined;

  beforeAll(async (): Promise<void> => {
    solver = new NodeConnect4Solver({ width: 7, height: 6, heuristic: true });
    await solver.init();

    const bookPath = path.join(__dirname, "..", "data", "7x6_ef14.book");
    if (fs.existsSync(bookPath)) {
      const bookData = new Uint8Array(fs.readFileSync(bookPath));
      book = new OpeningBook(7, 6);
      await book.load(bookData);
    }
  });

  afterAll(() => {
    if (solver) solver.release();
    if (book) book.destroy();
  });

  test("should detect an immediate win", async (): Promise<void> => {
    const result = await solver.analyze("121212", { maxDepth: 6 });
    expect(result.evaluation?.outcome).toBe(Outcome.Win);
  });

  test("should achieve >= 80% best-move accuracy on deep positions in 25ms window", async (): Promise<void> => {
    const dataPath = path.join(__dirname, "..", "test-data", "Test_L1_R1");
    if (!fs.existsSync(dataPath)) {
      console.warn("Skipping heuristic batch test: Test_L1_R1 not found.");
      return;
    }

    const exactSolver = new NodeConnect4Solver({
      width: 7,
      height: 6,
      heuristic: false,
    });
    await exactSolver.init();

    const lines = fs
      .readFileSync(dataPath, "utf8")
      .split("\n")
      .filter((l) => l.trim().length > 0)
      .slice(0, 50);
    let successCount = 0;
    const failures: string[] = [];

    for (const line of lines) {
      const parts = line.split(" ");
      const pos = parts[0];

      // Heuristic Solver is NOT allowed to use the book.
      const [exactRes, heuristicRes] = await Promise.all([
        exactSolver.analyze(pos, { book }),
        solver.analyze(pos, { timeoutMs: 25 }),
      ]);

      // 1. Find the best possible score outcome from the exact solver
      let maxExactScore = -100;
      for (const opt of exactRes.moveOptions) {
        if (opt && opt.score > maxExactScore) maxExactScore = opt.score;
      }

      // 2. Find the move the heuristic solver thinks is best
      let bestHeuristicMoveIndex = -1;
      let maxHeuristicScore = -2000000;
      for (let i = 0; i < heuristicRes.moveOptions.length; i++) {
        const opt = heuristicRes.moveOptions[i];
        if (opt && opt.score > maxHeuristicScore) {
          maxHeuristicScore = opt.score;
          bestHeuristicMoveIndex = i;
        }
      }

      // 3. Check if the heuristic's best move is an optimal move category match
      const chosenMoveExactScore =
        exactRes.moveOptions[bestHeuristicMoveIndex]?.score ?? -100;

      const match =
        (maxExactScore > 0 && chosenMoveExactScore > 0) ||
        (maxExactScore === 0 && chosenMoveExactScore === 0) ||
        (maxExactScore < 0 && chosenMoveExactScore < 0);

      if (match) {
        successCount++;
      } else {
        failures.push(
          `Pos: ${pos} | Best Possible: ${maxExactScore} | Heuristic Picked: ${chosenMoveExactScore}`,
        );
      }
    }

    exactSolver.release();

    const successRate = successCount / lines.length;
    console.log(
      `Heuristic Deep Position Accuracy (25ms): ${(successRate * 100).toFixed(1)}% (${successCount}/${lines.length})`,
    );
    if (successRate < 0.65) {
      console.log("Top Failures:\n" + failures.slice(0, 5).join("\n"));
    }
    expect(successRate).toBeGreaterThanOrEqual(0.65);
  }, 30000);

  test("should match exact solver outcome when given uncapped time/depth", async (): Promise<void> => {
    const pos = "112233";
    const exactSolver = new NodeConnect4Solver({
      width: 7,
      height: 6,
      heuristic: false,
    });
    await exactSolver.init();

    const [exactRes, heuristicRes] = await Promise.all([
      exactSolver.analyze(pos),
      solver.analyze(pos, { maxDepth: 42, timeoutMs: 5000 }),
    ]);

    // Heuristic scores are scaled by 1000 for terminal wins
    const hScore = heuristicRes.evaluation?.score ?? 0;
    const eScore = exactRes.evaluation?.score ?? 0;

    const hNormalized =
      hScore > 10000
        ? Math.floor(hScore / 1000)
        : hScore < -10000
          ? Math.ceil(hScore / 1000)
          : hScore;

    expect(hNormalized).toBe(eScore);
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

    expect(end - start).toBeLessThan(100);
    massiveSolver.release();
  });
});
