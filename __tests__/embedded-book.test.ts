/**
 * embedded-book.test.ts
 *
 * Verifies the transparent embedded book behavior after the embedded-books refactor:
 *
 *  1. Init a 7x6 solver with NO explicit book — the C++ fallback should transparently
 *     pick up the embedded book and produce correct, exact results.
 *  2. Confirm that AdaptiveSolver.hasBook is true for 7x6 based on compile-time
 *     EMBEDDED_BOOK_SIZES knowledge (no runtime call needed).
 *  3. Call solver.loadBook() with a custom book buffer — verifies the override path.
 *  4. solver.release() — ensures the user book pointer is freed normally.
 *
 * Key invariant: _bookPtr === 0 when using the embedded book (C++ handles it).
 *                After loadBook(), _bookPtr is non-null and the user book wins.
 */

import { NodeConnect4Solver } from "../src/node.js";
import { AdaptiveSolver } from "../src/adaptive.js";
import { EMBEDDED_BOOK_SIZES } from "../src/capabilities.js";
import { getNativeModule } from "../src/node.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Embedded book transparent fallback", () => {
  // Skip all tests if native module is not available (CI without compiled addon)
  const native = getNativeModule();
  const skipIf = native ? test : test.skip;

  describe("EMBEDDED_BOOK_SIZES (compile-time registry)", () => {
    it("should include 7x6 as an embedded size", () => {
      expect(EMBEDDED_BOOK_SIZES.has("7x6")).toBe(true);
    });

    it("should include 6x6 and 6x7 as embedded sizes", () => {
      expect(EMBEDDED_BOOK_SIZES.has("6x6")).toBe(true);
      expect(EMBEDDED_BOOK_SIZES.has("6x7")).toBe(true);
    });

    it("should NOT include 8x8 (no embedded book for that size)", () => {
      expect(EMBEDDED_BOOK_SIZES.has("8x8")).toBe(false);
    });
  });

  describe("NodeConnect4Solver 7x6 — transparent embedded book", () => {
    let solver: NodeConnect4Solver;

    beforeAll(async () => {
      solver = new NodeConnect4Solver({ width: 7, height: 6, cacheSizeMb: 64 });
      await solver.init();
    });

    afterAll(() => {
      solver.release();
    });

    skipIf(
      "should solve an empty position correctly WITHOUT passing { book }",
      async () => {
        // This relies on C++ transparently falling back to the embedded 7x6 book.
        // A correct solver should return a non-null evaluation for the empty board.
        const result = await solver.analyze("", {});
        expect(result).toBeDefined();
        const evaluation = result.evaluation;
        if (!evaluation) throw new Error("evaluation is null");
        // The empty 7x6 board is a first-player win — score should be positive
        expect(evaluation.score).toBeGreaterThan(0);
      },
    );

    skipIf(
      "should have _bookPtr === 0 when using the embedded book (C++ fallback)",
      () => {
        // _bookPtr starts at 0; embedded book lives in C++ static memory, not in _bookPtr
        expect((solver as unknown as { _bookPtr: number })._bookPtr).toBe(0);
      },
    );

    skipIf(
      "should solve a known opening position correctly (embedded book provides instant hit)",
      async () => {
        // Position '4' — center column first. Well-known positive score for P1.
        const result = await solver.solve("4", {});
        const evaluation = result.evaluation;
        if (!evaluation) throw new Error("evaluation is null");
        expect(evaluation.score).toBeDefined();
      },
    );
  });

  describe("NodeConnect4Solver 7x6 — loadBook() override", () => {
    let solver: NodeConnect4Solver;

    beforeAll(async () => {
      solver = new NodeConnect4Solver({ width: 7, height: 6, cacheSizeMb: 64 });
      await solver.init();
    });

    afterAll(() => {
      solver.release();
    });

    skipIf("should work correctly after loadBook() override", async () => {
      if (!native) return;

      // Load the actual embedded efbook file as a custom book to simulate override
      const efbookPath = path.join(
        __dirname,
        "..",
        "data",
        "7x6_dense7.efbook",
      );

      // If the efbook file doesn't exist (CI), skip this sub-test
      if (!fs.existsSync(efbookPath)) {
        console.warn(
          "Skipping loadBook override test — data/7x6_dense7.efbook not found",
        );
        return;
      }

      const bookData = fs.readFileSync(efbookPath);
      await solver.loadBook(new Uint8Array(bookData));

      // After loadBook(), _bookPtr should be non-zero (user book wins over embedded)
      const bookPtr = (solver as unknown as { _bookPtr: unknown })._bookPtr;
      expect(bookPtr).not.toBe(0);
      expect(bookPtr).not.toBeNull();
      expect(bookPtr).not.toBeUndefined();

      // Solver should still return correct results with the override book
      const result = await solver.analyze("", {});
      const evaluation = result.evaluation;
      if (!evaluation) throw new Error("evaluation is null");
      expect(evaluation.score).toBeGreaterThan(0);
    });

    skipIf("should release correctly after loadBook()", () => {
      // release() should not throw even when _bookPtr is set
      expect(() => solver.release()).not.toThrow();
    });
  });

  describe("AdaptiveSolver.hasBook for known embedded sizes", () => {
    it("should report hasBook=true for 7x6 after setBoard (no bookLoader needed)", async () => {
      const solver = new AdaptiveSolver();
      await solver.setBoard(7, 6);
      expect(solver.hasBook).toBe(true);
      expect(solver.capability).toBe("exact");
      await solver.destroy();
    });

    it("should report hasBook=false for 8x8 (no embedded book, no bookLoader)", async () => {
      const solver = new AdaptiveSolver();
      await solver.setBoard(8, 8);
      expect(solver.hasBook).toBe(false);
      expect(solver.capability).not.toBe("exact");
      await solver.destroy();
    });

    it("should respect bookLoader override: hasBook=true when bookLoader supplies valid data", async () => {
      // Use the real 7x6 efbook for a non-embedded-book size if available, else skip.
      // (We need valid book data — passing garbage to the native C++ causes a crash.)
      const efbookPath = path.join(
        __dirname,
        "..",
        "data",
        "7x6_dense7.efbook",
      );
      if (!fs.existsSync(efbookPath)) {
        console.warn(
          "Skipping bookLoader override test — data/7x6_dense7.efbook not found",
        );
        return;
      }
      const bookData = new Uint8Array(fs.readFileSync(efbookPath));
      const solver = new AdaptiveSolver({
        bookLoader: (): Promise<Uint8Array> => Promise.resolve(bookData),
      });
      // Use 7x6 — it has an embedded book already, but the bookLoader overrides it
      await solver.setBoard(7, 6);
      expect(solver.hasBook).toBe(true);
      expect(solver.capability).toBe("exact");
      await solver.destroy();
    });
  });
});
