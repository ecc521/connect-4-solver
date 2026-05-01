import { NodeConnect4Solver } from "../src/node";
import { OpeningBook } from "../src/index";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

describe("Polymorphic Dense Book Packing", () => {
  const mockTxt = path.join(__dirname, "mock_scored.txt");
  const d5Path = path.join(__dirname, "..", "data", "7x6_dense5.book");
  const d14Path = path.join(__dirname, "..", "data", "7x6_dense14.book");
  const d20Path = path.join(__dirname, "..", "data", "7x6_dense20.book");

  beforeAll(() => {
    // Valid connect 4 positions with arbitrary scores
    const positions = [
      "1 1",
      "12 -1",
      "123 2",
      "1234 -2",
      "12345 3",
      "123456 -3",
      "1234567 4",
      "12345671 5",
      "123456712 -5",
      "1234567123 6",
      "12345671234 -6",
      "123456712345 7",
      "1234567123456 -7",
      "12345671234567 8", // 14 moves
      "123456712345671 9", // 15 moves
      "1234567123456712 -9", // 16 moves
      "12345671234567123 10", // 17 moves
      "123456712345671234 -10", // 18 moves
      "1234567123456712345 11", // 19 moves
      "12345671234567123456 -11", // 20 moves
    ];
    fs.writeFileSync(mockTxt, positions.join("\n") + "\n");

    execSync(
      'cd tools && make clean && make pack_dense_book CXXFLAGS="--std=c++17 -W -Wall -O3 -DNDEBUG -I../native -march=native -DBOARD_WIDTH_MACRO=7 -DBOARD_HEIGHT_MACRO=6"',
      { stdio: "inherit" },
    );

    execSync(`cd tools && ./pack_dense_book 5 < ../__tests__/mock_scored.txt`, {
      stdio: "inherit",
    });
    execSync(
      `cd tools && ./pack_dense_book 14 < ../__tests__/mock_scored.txt`,
      { stdio: "inherit" },
    );
    execSync(
      `cd tools && ./pack_dense_book 20 < ../__tests__/mock_scored.txt`,
      { stdio: "ignore" },
    );
  });

  afterAll(() => {
    // cleanup
    if (fs.existsSync(mockTxt)) fs.unlinkSync(mockTxt);
    if (fs.existsSync(d5Path)) fs.unlinkSync(d5Path);
    if (fs.existsSync(d14Path)) fs.unlinkSync(d14Path);
    if (fs.existsSync(d20Path)) fs.unlinkSync(d20Path);
  });

  test("should pack a depth 5 book using 3-byte keys and ignore deeper elements", async () => {
    const stat = fs.statSync(d5Path);
    const bookData = new Uint8Array(fs.readFileSync(d5Path));

    // Check header for 3 byte keys
    expect(bookData[3]).toBe(3); // key_bytes

    // Depth 5 should only pack the first 5 positions
    const expectedCount = 5;
    // Header (6) + entries (3 bytes key + 1 byte value)
    expect(stat.size).toBe(6 + expectedCount * 4);

    const solver = new NodeConnect4Solver();
    await solver.init();

    const book = new OpeningBook(solver.width, solver.height);
    await book.load(bookData);

    book.destroy();
  });

  test("should pack a depth 14 book using 4-byte keys", async () => {
    const stat = fs.statSync(d14Path);
    const bookData = new Uint8Array(fs.readFileSync(d14Path));

    // Depth 14 7x7 fits in 31.7 bits => 4 bytes
    expect(bookData[3]).toBe(4);

    // Depth 14 means the first 14 positions should be packed
    const expectedCount = 14;
    // Header (6) + entries (4 bytes key + 1 byte value)
    expect(stat.size).toBe(6 + expectedCount * 5);

    const solver = new NodeConnect4Solver();
    await solver.init();
    const book = new OpeningBook(solver.width, solver.height);
    await book.load(bookData);
    book.destroy();
  });

  test("should pack a depth 20 book using 6-byte keys", async () => {
    const stat = fs.statSync(d20Path);
    const bookData = new Uint8Array(fs.readFileSync(d20Path));

    // Depth 20 7x7: 26 digits -> 41.2 bits => 6 bytes
    expect(bookData[3]).toBe(6);

    // Depth 20 means all 20 positions
    const expectedCount = 20;
    // Header (6) + entries (6 bytes key + 1 byte value)
    expect(stat.size).toBe(6 + expectedCount * 7);

    const solver = new NodeConnect4Solver();
    await solver.init();
    const book = new OpeningBook(solver.width, solver.height);
    await book.load(bookData);
    book.destroy();
  });

  test("should load the generated depth 5 book and return exact scores without searching", async () => {
    const bookData = new Uint8Array(fs.readFileSync(d5Path));

    const solver = new NodeConnect4Solver();
    await solver.init();

    const book = new OpeningBook(solver.width, solver.height);
    await book.load(bookData);

    // Evaluate a depth 2 position (12). The mock book has it scored as -1.
    // We use `solve` so it hits the book at the root instantly.
    const result = await solver.solve("12", { book });
    expect(result.evaluation?.score).toBe(-1);

    // Evaluate a depth 2 position (11) not in the book
    // Wait, 11 is not in the book. If we solve it, the exact solver will search it fully!
    // Let's test a position that IS in the book, like "1" (score 1)
    const result2 = await solver.solve("1", { book });
    expect(result2.evaluation?.score).toBe(1);

    book.destroy();
  });

  test("should load the generated depth 5 book into heuristic solver and translate exact scores", async () => {
    const bookData = new Uint8Array(fs.readFileSync(d5Path));

    const solver = new NodeConnect4Solver({ heuristic: true });
    await solver.init();

    const book = new OpeningBook(solver.width, solver.height);
    await book.load(bookData);

    // Evaluate a depth 2 position (12)
    // The exact score is cached in the book as -1 (Loss)
    // The heuristic solver should translate this to -31001
    // We use `solve` with a 1ms timeout. Without the book, 1ms would not find a deep loss.
    const result = await solver.solve("12", { book, timeoutMs: 1 });
    
    // Heuristic bounds translate exact Loss to <= -31000
    expect(result.evaluation?.score).toBeLessThanOrEqual(-31000);

    // Evaluate a depth 1 position (1) which is in the book with score 1
    const result2 = await solver.solve("1", { book, timeoutMs: 1 });
    expect(result2.evaluation?.score).toBeGreaterThanOrEqual(31000);

    book.destroy();
  });
});
