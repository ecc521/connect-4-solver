import { NodeConnect4Solver } from "./node";
import { Player, Outcome, OpeningBook } from "./index";
import * as fs from "fs";
import * as path from "path";

const BOARD_WIDTH = 7;

async function runParityTest(
  solver: NodeConnect4Solver,
  dataPath: string,
  w: number,
  h: number,
  _ignoreEarlyGame = false,
  book?: OpeningBook,
): Promise<void> {
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

    if (pos.length <= 10) {
      continue;
    }

    const result = await solver.analyze(pos, { book });

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
      result.evaluation?.winner !== expectedWinner ||
      result.evaluation?.movesToEnd !== expectedMoves ||
      result.evaluation?.score !== expectedRawScore
    ) {
      throw new Error(
        `Mismatch at position ${pos}. Expected ${expectedOutcome}/${expectedWinner}/${expectedMoves} (score=${expectedRawScore}), got ${result.evaluation?.outcome}/${result.evaluation?.winner}/${result.evaluation?.movesToEnd} (score=${result.evaluation?.score})`,
      );
    }

    expect(result.originalPosition).toBe(pos);
  }
}

describe("NodeConnect4Solver Async Parity Test", () => {
  let solver: NodeConnect4Solver;
  let bookLoaded = false;

  beforeAll(async (): Promise<void> => {
    solver = new NodeConnect4Solver();
    await solver.init();

    // Check both legacy root and new data/ directory for the book
    const pathsToTry = [
      path.join(__dirname, "..", "data", "7x6_dense4.book"),
      path.join(__dirname, "..", "7x6.book"),
    ];

    for (const bookPath of pathsToTry) {
      if (fs.existsSync(bookPath)) {
        const bookData = new Uint8Array(fs.readFileSync(bookPath));
        const book = new OpeningBook(solver.width, solver.height);
        await book.load(bookData);
        // Attach it to solver as a mock property for cleanup/testing if needed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (solver as any)._testBook = book;
        bookLoaded = true;
        break;
      }
    }
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

  test("should correctly analyze all 7x6 positions against expected C++ raw solver output", async () => {
    const dataPath = path.join(
      __dirname,
      "..",
      "test-data",
      "positions_7x6.txt",
    );
    await runParityTest(solver, dataPath, 7, 6, !bookLoaded);
  }, 120000);

  describe("Generic Board Sizes Support", () => {
    it("should correctly instantiate and evaluate an 8x6 board at depth 34", async () => {
      const testSolver = new NodeConnect4Solver(8, 6);
      await testSolver.init();
      // P1 plays 1, 2, 3, 4. P2 plays 8, 8, 8. P1 Wins on move 7!
      const result = await testSolver.analyze("1828384");
      expect(result.evaluation?.outcome).toBe(Outcome.Win);
      testSolver.release();
    });

    it("should correctly instantiate and evaluate a massive 9x7 board using the 128-bit fallback math", async () => {
      const testSolver = new NodeConnect4Solver(9, 7);
      await testSolver.init();
      // P1 plays 1, 2, 3, 4. P2 plays 9, 9, 9. P1 Wins on move 7!
      const result = await testSolver.analyze("1929394");
      expect(result.evaluation?.outcome).toBe(Outcome.Win);
      testSolver.release();
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
        const testSolver = new NodeConnect4Solver(w, h);
        await testSolver.init();

        // For generic sizes, we check for a book in the data directory
        let testBook: OpeningBook | undefined = undefined;
        const bookPath = path.join(__dirname, "..", "data", `${w}x${h}.book`);
        if (fs.existsSync(bookPath)) {
          testBook = new OpeningBook(testSolver.width, testSolver.height);
          await testBook.load(new Uint8Array(fs.readFileSync(bookPath)));
        }

        await runParityTest(testSolver, dataPath, w, h, !testBook, testBook);
        if (testBook) testBook.destroy();
        testSolver.release();
      });
    }
  });
});
