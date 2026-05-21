import { AdaptiveSolver, getSolverCapability } from "./index.js";
import { Outcome, Player } from "./core.js";
import { jest } from "@jest/globals";

describe("AdaptiveSolver & Capability Logic", () => {
  describe("getSolverCapability()", () => {
    it("should resolve small boards (w < 7 && h < 7) as 'exact'", () => {
      expect(getSolverCapability(6, 6, false)).toBe("exact");
      expect(getSolverCapability(5, 5, false)).toBe("exact");
    });

    it("should resolve boards with embedded books as 'exact'", () => {
      expect(getSolverCapability(7, 6, false)).toBe("exact");
      expect(getSolverCapability(6, 7, false)).toBe("exact");
    });

    it("should resolve boards with custom loaded books as 'exact'", () => {
      expect(getSolverCapability(8, 8, true)).toBe("exact");
    });

    it("should resolve boards with NNUE models as 'nnue'", () => {
      expect(getSolverCapability(8, 8, false)).toBe("nnue");
    });

    it("should resolve other board sizes as 'tactical'", () => {
      expect(getSolverCapability(6, 8, false)).toBe("tactical");
      expect(getSolverCapability(8, 7, false)).toBe("tactical");
    });
  });

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
      expect(solver.capability).toBe("exact");
      expect(solver.hasBook).toBe(true);
      expect(solver.isReady).toBe(true);

      // P1 wins in 7 moves
      const res = await solver.solve("1212121");
      expect(res.evaluation?.outcome).toBe(Outcome.Win);
      expect(res.evaluation?.winner).toBe(Player.P1);
    });

    it("should switch to 8x8 board and solve with nnue capability", async () => {
      await solver.setBoard(8, 8);
      expect(solver.width).toBe(8);
      expect(solver.height).toBe(8);
      expect(solver.capability).toBe("nnue");
      expect(solver.hasBook).toBe(false);

      // Use a shallow depth and heuristic to solve quickly
      const res = await solver.analyze("12345678", {
        maxDepth: 4,
        timeoutMs: 2000,
      });
      expect(res.evaluation).not.toBeNull();
      expect(res.moveOptions).toHaveLength(8);
    });

    it("should warn on tactical boards if timeoutMs is explicitly set to 0 (no timeout)", async () => {
      await solver.setBoard(6, 8);
      expect(solver.capability).toBe("tactical");

      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {
        /* noop */
      });

      const res = await solver.solve("123", { timeoutMs: 0, maxDepth: 4 });
      expect(res.evaluation).toBeDefined();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Running a heuristic search (tactical) without a timeout limit",
        ),
      );

      warnSpy.mockRestore();
    });

    it("should succeed on tactical boards if timeoutMs is provided", async () => {
      await solver.setBoard(6, 8);
      expect(solver.capability).toBe("tactical");

      const res = await solver.solve("123", { timeoutMs: 500, maxDepth: 4 });
      expect(res.evaluation).toBeDefined();
    });

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
