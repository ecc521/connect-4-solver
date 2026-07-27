import { AdaptiveSolver } from "./index.js";
import { Outcome, Player } from "./core.js";

describe("AdaptiveSolver", () => {
  describe("AdaptiveSolver Lifecycle", () => {
    let solver: AdaptiveSolver;

    beforeEach(() => {
      solver = new AdaptiveSolver({ cacheSizeMb: 64 });
    });

    afterEach(async () => {
      await solver.destroy();
    });

    it("should switch to 7x6 board, auto-load embedded book, and solve exact winning position", async () => {
      await solver.setBoard(7, 6);
      expect(solver.width).toBe(7);
      expect(solver.height).toBe(6);
      expect(solver.hasBook).toBe(true);
      expect(solver.isReady).toBe(true);

      // P1 wins in 7 moves
      const res = await solver.solve("1212121");
      expect(res.evaluation?.outcome).toBe(Outcome.Win);
      expect(res.evaluation?.winner).toBe(Player.P1);
    });

    it("should switch to 8x8 board (no book)", async () => {
      await solver.setBoard(8, 8);
      expect(solver.width).toBe(8);
      expect(solver.height).toBe(8);
      expect(solver.hasBook).toBe(false);

      // Exact 8x8 from near-empty is intractable; bound it with a timeout so the
      // search aborts cleanly instead of hanging.
      const res = await solver.analyze("12345678", {
        timeoutMs: 500,
      });
      expect(res.aborted).toBe(true);
    }, 30000);

    it("should return a bounded result on large boards when timeoutMs is provided", async () => {
      await solver.setBoard(6, 8);

      const res = await solver.solve("123", { timeoutMs: 500 });
      // Either it solved quickly or it aborted — in both cases it must return.
      expect(res).toBeDefined();
      expect(res.currentPlayer).toBeDefined();
    }, 30000);

    it("should allow custom book overrides via options", async () => {
      let loaderCalled = false;
      const customSolver = new AdaptiveSolver({
        cacheSizeMb: 64,
        bookLoader: (_w: number, _h: number): Promise<Uint8Array> => {
          loaderCalled = true;
          // Return empty book data to simulate loader run
          return Promise.resolve(new Uint8Array());
        },
      });

      await customSolver.setBoard(7, 6);
      expect(loaderCalled).toBe(true);
      await customSolver.destroy();
    });
  });

  describe("Memory Leak Verification", () => {
    const runGc = (): void => {
      const g = global as unknown as { gc?: () => void };
      if (typeof g.gc === "function") {
        g.gc();
      }
    };

    // We repeatedly switch boards and recreate solvers, ensuring that RSS memory
    // doesn't continuously grow. If memory were leaking (e.g. 32MB cache each time),
    // 15 iterations would leak ~480MB, easily triggering our safety limit.
    it("should not leak native memory when switching board sizes repeatedly on a single solver instance", async () => {
      const testSolver = new AdaptiveSolver({ cacheSizeMb: 32 });

      // Warm up allocation
      await testSolver.setBoard(7, 6);
      runGc();

      const startRss = process.memoryUsage().rss;

      // Switch boards repeatedly
      for (let i = 0; i < 15; i++) {
        await testSolver.setBoard(7, 6);
        await testSolver.setBoard(6, 6);
      }

      await testSolver.destroy();
      runGc();

      const endRss = process.memoryUsage().rss;
      const growthMb = (endRss - startRss) / (1024 * 1024);

      // Verify growth is well under one cache allocation size
      expect(growthMb).toBeLessThan(32);
    }, 20000);

    it("should not leak native memory when instantiating and destroying solver instances repeatedly", async () => {
      runGc();
      const startRss = process.memoryUsage().rss;

      for (let i = 0; i < 15; i++) {
        const tempSolver = new AdaptiveSolver({ cacheSizeMb: 32 });
        await tempSolver.setBoard(7, 6);
        await tempSolver.destroy();
      }

      runGc();
      const endRss = process.memoryUsage().rss;
      const growthMb = (endRss - startRss) / (1024 * 1024);

      expect(growthMb).toBeLessThan(32);
    }, 20000);
  });
});
