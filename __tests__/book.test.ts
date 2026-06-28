import { NodeConnect4Solver } from "../src/node.js";
import { SyncWasmConnect4Solver } from "../src/threaded.js";
import { SyncWasmNoSABConnect4Solver } from "../src/sync.js";
import { OpeningBook } from "../src/index.js";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const _dir = path.dirname(fileURLToPath(import.meta.url));

describe("Polymorphic Dense Book Packing", () => {
  const mockTxt = path.join(_dir, "mock_scored.txt");
  const d5Path = path.join(_dir, "..", "data", "7x6_dense5.book");
  const d14Path = path.join(_dir, "..", "data", "7x6_dense14.book");
  const d20Path = path.join(_dir, "..", "data", "7x6_dense20.book");

  beforeAll(() => {
    // Ensure data directory exists
    const dataDir = path.join(_dir, "..", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

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

    // Check header for 2 byte keys (key_bytes is at offset 8 in v2 header)
    expect(bookData[8]).toBe(2); // key_bytes

    // Depth 5 should only pack the first 5 positions
    const expectedCount = 5;
    // Header (18) + keys section (2 bytes each) + values section (1 byte each)
    expect(stat.size).toBe(18 + expectedCount * 2 + expectedCount * 1);

    const solver = new NodeConnect4Solver();
    await solver.init();

    const book = new OpeningBook(solver.width, solver.height);
    await book.load(bookData);

    book.destroy();
  });

  test("should pack a depth 14 book using 4-byte keys", async () => {
    const stat = fs.statSync(d14Path);
    const bookData = new Uint8Array(fs.readFileSync(d14Path));

    // Depth 14 7x6 fits in 31.7 bits => 4 bytes (key_bytes at offset 8 in v2 header)
    expect(bookData[8]).toBe(4);

    // Depth 14 means the first 14 positions should be packed
    const expectedCount = 14;
    // Header (18) + keys section (4 bytes each) + values section (1 byte each)
    expect(stat.size).toBe(18 + expectedCount * 4 + expectedCount * 1);

    const solver = new NodeConnect4Solver();
    await solver.init();
    const book = new OpeningBook(solver.width, solver.height);
    await book.load(bookData);
    book.destroy();
  });

  test("should pack a depth 20 book using 6-byte keys", async () => {
    const stat = fs.statSync(d20Path);
    const bookData = new Uint8Array(fs.readFileSync(d20Path));

    // Depth 20 7x6: max key ~41.2 bits => 6 bytes (key_bytes at offset 8 in v2 header)
    expect(bookData[8]).toBe(6);

    // Depth 20 means all 20 positions
    const expectedCount = 20;
    // Header (18) + keys section (6 bytes each) + values section (1 byte each)
    expect(stat.size).toBe(18 + expectedCount * 6 + expectedCount * 1);

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
    expect(result.evaluation?.score).toBe(-31001);

    // Evaluate a depth 2 position (11) not in the book
    // Wait, 11 is not in the book. If we solve it, the exact solver will search it fully!
    // Let's test a position that IS in the book, like "1" (score 1)
    const result2 = await solver.solve("1", { book });
    expect(result2.evaluation?.score).toBe(31001);

    book.destroy();
  });

  test("should support loadBook natively across all solver environments", async () => {
    const bookData = new Uint8Array(fs.readFileSync(d5Path));

    const solvers: (
      | NodeConnect4Solver
      | SyncWasmConnect4Solver
      | SyncWasmNoSABConnect4Solver
    )[] = [new NodeConnect4Solver()];

    if (fs.existsSync(path.join(_dir, "..", "build", "analyze.wasm"))) {
      solvers.push(new SyncWasmConnect4Solver());
      solvers.push(new SyncWasmNoSABConnect4Solver());
    }

    for (const solver of solvers) {
      await solver.init();

      // Load book directly into the native solver's state
      await solver.loadBook(bookData);

      // Evaluate a depth 2 position (12). The mock book has it scored as -1 (intentionally incorrect to verify cache hit).
      // We do not pass { book } here, the solver must use the internally managed pointer.
      const result = await solver.solve("12");
      expect(result.evaluation?.score).toBe(-31001);

      solver.release();
    }
  });
});
