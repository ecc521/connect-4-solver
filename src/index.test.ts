import { Connect4Solver, Outcome, Player, BOARD_WIDTH } from "../src/index";
import * as fs from "fs";
import * as path from "path";

function runParityTest(
  solver: Connect4Solver,
  dataPath: string,
  w: number,
  h: number,
  ignoreEarlyGame = false,
): void {
  if (!fs.existsSync(dataPath)) {
    console.warn(`Skipping parity test, ${dataPath} not found.`);
    return;
  }

  const lines = fs
    .readFileSync(dataPath, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  expect(lines.length).toBeGreaterThan(0);

  for (const line of lines) {
    const parts = line.split(" ");
    const pos = parts[0];
    const expectedRawScore = parseInt(parts[1], 10);

    if (ignoreEarlyGame && pos.length <= 10) {
      continue;
    }

    const result = solver.analyze(pos);

    const nbMoves = pos.length;
    const isP1Turn = nbMoves % 2 === 0;
    const currentPlayer = isP1Turn ? Player.P1 : Player.P2;
    const opponent = isP1Turn ? Player.P2 : Player.P1;

    const movesRemaining = w * h - nbMoves;
    const halfMovesRemaining = Math.ceil(movesRemaining / 2);

    let expectedOutcome: Outcome = Outcome.Draw;
    let expectedWinner: Player | null = null;
    let expectedMoves: number | null = null;

    if (expectedRawScore > 0) {
      expectedOutcome = Outcome.Win;
      expectedWinner = currentPlayer;
      expectedMoves = halfMovesRemaining - expectedRawScore + 1;
    } else if (expectedRawScore < 0) {
      expectedOutcome = Outcome.Loss;
      expectedWinner = opponent;
      expectedMoves = halfMovesRemaining + expectedRawScore + 1;
    }

    if (
      result.evaluation?.outcome !== expectedOutcome ||
      result.evaluation.winner !== expectedWinner ||
      result.evaluation.movesToEnd !== expectedMoves ||
      result.evaluation.score !== expectedRawScore
    ) {
      throw new Error(
        `Mismatch at position ${pos}. Expected ${expectedOutcome}/${expectedWinner}/${expectedMoves} (score=${expectedRawScore}), got ${result.evaluation?.outcome}/${result.evaluation?.winner}/${result.evaluation?.movesToEnd} (score=${result.evaluation?.score})`,
      );
    }

    expect(result.originalPosition).toBe(pos);
  }
}

describe("Connect4Solver", () => {
  let solver: Connect4Solver;
  let bookLoaded = false;

  beforeAll(async () => {
    solver = new Connect4Solver();
    await solver.init();

    // Check both legacy root and new data/ directory for the book
    const pathsToTry = [
      path.join(__dirname, "..", "data", "7x6.book"),
      path.join(__dirname, "..", "7x6.book"),
    ];

    for (const bookPath of pathsToTry) {
      if (fs.existsSync(bookPath)) {
        const bookData = new Uint8Array(fs.readFileSync(bookPath));
        await solver.loadBook(bookData);
        bookLoaded = true;
        break;
      }
    }

    if (!bookLoaded) {
      console.warn(
        "Opening book (7x6.book) not found. Solver will run in pure logic mode and skip early game positions (<= 10 moves) in parity tests.",
      );
    }
  }, 15000);

  test("should analyze a deep position", () => {
    const result = solver.analyze("121212333");
    expect(result.originalPosition).toBe("121212333");
    expect(result.evaluation).not.toBeNull();
    expect(result.moveOptions).toHaveLength(BOARD_WIDTH);
  });

  test("should detect a winning position", () => {
    const result = solver.analyze("1212121");
    expect(result.evaluation?.outcome).toBe(Outcome.Win);
    expect(result.evaluation?.winner).toBe(Player.P1);
    expect(result.position).toBe("1212121");
  });

  test("should handle invalid moves", () => {
    const result = solver.analyze("1111111");
    expect(result.position).not.toBe(result.originalPosition);
    expect(result.evaluation).toBeNull();
  });

  test("should correctly analyze 200 positions against expected C++ raw solver output", () => {
    const dataPath = path.join(__dirname, "..", "test-data", "positions.txt");
    runParityTest(solver, dataPath, 7, 6, !bookLoaded);
  });

  describe("Generic Board Sizes Support", () => {
    it("should correctly instantiate and evaluate an 8x6 board at depth 34", async () => {
      const solver = new Connect4Solver(8, 6);
      await solver.init();
      // P1 plays 1, 2, 3, 4. P2 plays 8, 8, 8. P1 Wins on move 7!
      const result = solver.analyze("1828384");
      expect(result.evaluation?.outcome).toBe(Outcome.Win);
    });

    it("should correctly instantiate and evaluate a massive 9x7 board using the 128-bit fallback math", async () => {
      const solver = new Connect4Solver(9, 7);
      await solver.init();
      // P1 plays 1, 2, 3, 4. P2 plays 9, 9, 9. P1 Wins on move 7!
      const result = solver.analyze("1929394");
      expect(result.evaluation?.outcome).toBe(Outcome.Win);
    });

    const sizes = [
      [6, 5],
      [6, 6],
      [7, 7],
      [8, 6],
      [9, 7],
    ];

    for (const [w, h] of sizes) {
      it(`should correctly analyze generated positions for ${w}x${h} against expected solver output`, async () => {
        const dataPath = path.join(
          __dirname,
          "..",
          "test-data",
          `positions_${w}x${h}.txt`,
        );
        const testSolver = new Connect4Solver(w, h);
        await testSolver.init();

        runParityTest(testSolver, dataPath, w, h, false);
      });
    }
  });
});
