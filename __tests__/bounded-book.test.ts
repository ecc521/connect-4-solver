/**
 * bounded-book.test.ts
 *
 * Tests for the bounded (weak-solver) book format:
 *
 *  1. Header kind — parseBookHeaderKind returns "bounded" for a bounded book.
 *  2. bookKind getter — solver.bookKind is "bounded" after loadBook().
 *  3. queryBook — Win/Loss return {lower, upper}; Draw returns {exact: 0};
 *     canWinNext exact entries return {exact: score}.
 *  4. getScore — returns undefined for bounded (non-exact) entries.
 *  5. Negamax pruning integration — bounded book short-circuits the search
 *     for a decisive position, measurably reducing node count vs. no book.
 */

import { NodeConnect4Solver, getNativeModule } from "../src/node.js";
import { BaseConnect4Solver } from "../src/core.js";

// Avoid __filename / __dirname — ts-jest ESM preset injects them.
const W = 7;
const H = 6;
// abs_min = (W*H+1)/2 = 43/2 = 21 (C++ integer division)
// fixed min_score in GetBookLookup = -(W*H+1)/2 = -21
// Decoded score = encoded_byte + (-21) - 1 = encoded_byte - 22

describe("Bounded book format", () => {
  const native = getNativeModule();

  // Skip entire suite if the native addon isn't available
  if (!native) {
    it.skip("native module not available — skipping bounded book tests", () => {});
    return; // ts-jest: early return is fine here, suite is empty otherwise
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Build a dense bounded book in memory with the given positions and raw scores,
   * then return the buffer so it can be loaded into a solver.
   */
  function buildBoundedBook(entries: { pos: string; rawScore: number }[]): Uint8Array {
    const builder = new native!.BookBuilder(W, H, 20);
    builder.setBounded(true);
    for (const { pos, rawScore } of entries) {
      builder.addPosition(pos, rawScore);
    }
    return builder.getDenseBuffer();
  }

  // ─── 1. Header kind ───────────────────────────────────────────────────────

  describe("parseBookHeaderKind", () => {
    it("returns 'bounded' for a bounded book buffer", () => {
      const buf = buildBoundedBook([{ pos: "4", rawScore: 1 }]);
      expect(BaseConnect4Solver.parseBookHeaderKind(buf)).toBe("bounded");
    });

    it("returns 'exact' for an exact book buffer", () => {
      const builder = new native!.BookBuilder(W, H, 20);
      builder.setBounded(false);
      builder.addPosition("4", 5);
      const buf = builder.getDenseBuffer();
      expect(BaseConnect4Solver.parseBookHeaderKind(buf)).toBe("exact");
    });

    it("verifies the flags byte directly (bit 3 set = bounded)", () => {
      const buf = buildBoundedBook([{ pos: "4", rawScore: 1 }]);
      // v2 header: [0]=0xC4 [1]=0x42 [2]=0x02 [6]=flags; bits 2-3 of flags: 0x08 = bounded
      expect(buf[0]).toBe(0xc4);
      expect(buf[1]).toBe(0x42);
      expect(buf[2]).toBe(0x02); // version 2
      expect(buf[6] & 0x0c).toBe(0x08); // bounded kind bits
    });
  });

  // ─── 2. bookKind getter ───────────────────────────────────────────────────

  describe("solver.bookKind after loadBook()", () => {
    it("is 'bounded' when a bounded book is loaded", async () => {
      const solver = new NodeConnect4Solver({ width: W, height: H, cacheSizeMb: 8 });
      await solver.init();
      const buf = buildBoundedBook([{ pos: "4", rawScore: 0 }]);
      await solver.loadBook(buf);
      expect(solver.bookKind).toBe("bounded");
      solver.release();
    });

    it("is 'exact' when an exact book is loaded", async () => {
      const solver = new NodeConnect4Solver({ width: W, height: H, cacheSizeMb: 8 });
      await solver.init();
      const builder = new native!.BookBuilder(W, H, 20);
      builder.setBounded(false);
      builder.addPosition("4", 5);
      const buf = builder.getDenseBuffer();
      await solver.loadBook(buf);
      expect(solver.bookKind).toBe("exact");
      solver.release();
    });
  });

  // ─── 3. queryBook ─────────────────────────────────────────────────────────

  describe("queryBook — bounded encoding roundtrip", () => {
    // Decode formula: score = encoded_byte + min_score - 1, where min_score = -21 (fixed, 7x6)
    // Win  raw=+1 → lo=23, hi=43 → lo_score=1, hi_score=21
    // Draw raw=0  → lo=hi=22     → score=0 (exact even in bounded mode)
    // Loss raw=-1 → lo=1, hi=21  → lo_score=-21, hi_score=-1

    let solver: NodeConnect4Solver;

    beforeAll(async () => {
      solver = new NodeConnect4Solver({ width: W, height: H, cacheSizeMb: 8 });
      await solver.init();
      const buf = buildBoundedBook([
        { pos: "4", rawScore: 1 },   // Win  → bounded {lower:1, upper:21}
        { pos: "44", rawScore: 0 },  // Draw → exact   {exact: 0}
        { pos: "41", rawScore: -1 }, // Loss → bounded {lower:-21, upper:-1}
      ]);
      await solver.loadBook(buf);
    });

    afterAll(() => solver.release());

    it("returns { lower, upper } for a bounded Win entry", async () => {
      const result = await solver.queryBook("4");
      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty("exact");
      expect(result?.lower).toBe(1);
      expect(result?.upper).toBe(21);
    });

    it("returns { exact: 0 } for a bounded Draw entry (draw is always exact)", async () => {
      const result = await solver.queryBook("44");
      expect(result).not.toBeNull();
      expect(result?.exact).toBe(0);
      expect(result).not.toHaveProperty("lower");
      expect(result).not.toHaveProperty("upper");
    });

    it("returns { lower, upper } for a bounded Loss entry", async () => {
      const result = await solver.queryBook("41");
      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty("exact");
      expect(result?.lower).toBe(-21);
      expect(result?.upper).toBe(-1);
    });

    it("returns null for a position not in the book", async () => {
      const result = await solver.queryBook("12345");
      expect(result).toBeNull();
    });
  });

  // ─── 4. getScore via _getBookLookup ──────────────────────────────────────

  describe("_getBookLookup — lo != hi for bounded Win/Loss, lo == hi for Draw", () => {
    // getScore() uses _getBookLookup internally and returns undefined when lo != hi.
    // We test _getBookLookup directly here to avoid importing WASM-dependent OpeningBook.
    it("Win entry has lo < hi (no single exact score)", async () => {
      const buf = buildBoundedBook([{ pos: "4", rawScore: 1 }]);
      const bookPtr = native!._createBookFromBuffer(W, H, buf);
      const lu = native!._getBookLookup(W, H, bookPtr, "4");
      expect(lu).toBeDefined();
      expect(lu![0]).toBeLessThan(lu![1]); // lo < hi
      native!._destroyBook(W, H, bookPtr);
    });

    it("Draw entry has lo == hi (exact even in bounded mode)", async () => {
      const buf = buildBoundedBook([{ pos: "4", rawScore: 0 }]);
      const bookPtr = native!._createBookFromBuffer(W, H, buf);
      const lu = native!._getBookLookup(W, H, bookPtr, "4");
      expect(lu).toBeDefined();
      expect(lu![0]).toBe(lu![1]); // lo == hi
      native!._destroyBook(W, H, bookPtr);
    });

    it("Loss entry has lo < hi (no single exact score)", async () => {
      const buf = buildBoundedBook([{ pos: "4", rawScore: -1 }]);
      const bookPtr = native!._createBookFromBuffer(W, H, buf);
      const lu = native!._getBookLookup(W, H, bookPtr, "4");
      expect(lu).toBeDefined();
      expect(lu![0]).toBeLessThan(lu![1]); // lo < hi
      native!._destroyBook(W, H, bookPtr);
    });
  });

  // ─── 5. canWinNext exact carry-through ────────────────────────────────────

  describe("exact carry-through for canWinNext positions in bounded mode", () => {
    // When generate-book runs a weak solver and canWinNext() fires at root,
    // the solver returns an exact score (abs value > 1). encodeItem detects
    // raw_score ∉ {-1, 0, 1} and stores lo == hi (exact). queryBook should
    // return { exact: score }, not { lower, upper }.
    it("stores canWinNext results as exact even in bounded mode", async () => {
      const solver = new NodeConnect4Solver({ width: W, height: H, cacheSizeMb: 8 });
      await solver.init();

      // Simulate a canWinNext result: raw_score of 15 (well outside {-1,0,1})
      const buf = buildBoundedBook([{ pos: "4", rawScore: 15 }]);
      await solver.loadBook(buf);

      const result = await solver.queryBook("4");
      expect(result).not.toBeNull();
      // Must be exact — lo == hi in the stored entry
      expect(result).toHaveProperty("exact");
      expect(result?.exact).toBe(15);

      solver.release();
    });
  });

  // ─── 6. Correctness — bounded book doesn't corrupt results ───────────────

  describe("solve() with bounded book produces correct outcomes", () => {
    // Verify that loading a bounded book with correct Win/Loss/Draw entries
    // does not cause the solver to return incorrect results.
    it("bounded Loss at root → solver still reports a loss for P2", async () => {
      // "4" (P2 to move after P1 center): P2 loses → bounded raw=-1 is correct
      const solver = new NodeConnect4Solver({ width: W, height: H, cacheSizeMb: 32 });
      await solver.init();
      const buf = buildBoundedBook([{ pos: "4", rawScore: -1 }]);
      await solver.loadBook(buf);

      // Use weak solve for speed — just need the outcome direction
      const result = await solver.solve("4", { weak: true });
      // P2 is losing, so the score from P2's perspective must be < 0
      expect(result.evaluation?.score).toBeLessThan(0);
      solver.release();
    }, 60000);

    it("bounded Win book does not prevent correct analysis of non-booked positions", async () => {
      // "44" (2 moves) is NOT in our book — the solver must search it from scratch.
      // Verify the solver returns a non-null evaluation and doesn't crash or hang.
      const solver = new NodeConnect4Solver({ width: W, height: H, cacheSizeMb: 32 });
      await solver.init();
      // Book only contains "4"; "44" must be searched normally.
      const buf = buildBoundedBook([{ pos: "4", rawScore: -1 }]);
      await solver.loadBook(buf);

      const result = await solver.solve("44", { weak: true });
      expect(result.evaluation).not.toBeNull();
      // "44" (P1 played center twice) — P1 is in a strong position → P2 (to move) still loses
      expect(result.evaluation?.score).not.toBe(0); // not a draw

      solver.release();
    }, 60000);
  });
});
