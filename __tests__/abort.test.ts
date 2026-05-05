import { NodeConnect4Solver } from "../src/node.js";

describe("Solver Abort/Timeout", () => {
  let solver: NodeConnect4Solver;

  beforeAll(async () => {
    solver = new NodeConnect4Solver();
    await solver.init();
  });

  afterAll(() => {
    solver.release();
  });

  test("exact solver should abort on timeout", async () => {
    // A complex position that takes time to solve
    const position = "444444";

    // Set a very short timeout (1ms)
    const result = await solver.analyze(position, { timeoutMs: 1 });

    expect(result.aborted).toBe(true);
    expect(result.evaluation).toBeNull();
  });

  test("manual stop should terminate search", async () => {
    const position = "444444";

    const solvePromise = solver.analyze(position, { timeoutMs: 10000 });

    // Stop immediately
    setTimeout(() => {
      void solver.stop();
    }, 10);

    const result = await solvePromise;
    expect(result.aborted).toBe(true);
    expect(result.evaluation).toBeNull();
  });
});
