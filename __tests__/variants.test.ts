import { NodeConnect4Solver } from "../src/node.js";
import { describe, it, expect } from "@jest/globals";

describe("Extended Game Variants (Connect 5 & Wraparound)", () => {
  it("evaluates Connect-5 winning positions correctly", async () => {
    const solver = new NodeConnect4Solver({
      width: 8,
      height: 8,
      align: 5,
      wrap: false,
      heuristic: false,
    });
    await solver.init();

    // Play 5 moves in a row horizontally for P1
    // 112233445
    // P1: 1, 2, 3, 4, 5 (bottom row). P1 has connected 5!
    const res = await solver.solve("112233445");

    // It should evaluate as a win in 0 moves
    expect(res.evaluation?.outcome).toBe("Win");
    // Moves played = 9. Spaces remaining = 55. Half spaces = 27 (Wait, base score = 64-9 = 55. floor(55/2) = 27).
    expect(res.evaluation?.score).toBe(31028);

    solver.release();
  });

  it("evaluates Wraparound winning positions correctly", async () => {
    // 7x6 is the only supported C4 Wraparound variant
    const solver = new NodeConnect4Solver({
      width: 7,
      height: 6,
      align: 4,
      wrap: true,
      heuristic: false,
    });
    await solver.init();

    // Play 4 moves in a row horizontally, wrapping around edges
    // P1: 1, 7, 6, 2
    // P2: 1, 7, 6 (row 2)
    // 1177662
    const res = await solver.solve("1177662");

    // P1 has connected 6, 7, 1, 2 (wrap around!). This is 4 in a row.
    // It should be a Win in 0 moves.
    // Moves played = 7. Spaces remaining = 35. Half spaces = 17 (35/2 = 17).
    expect(res.evaluation?.outcome).toBe("Win");
    expect(res.evaluation?.score).toBe(31018);

    solver.release();
  });

  it("evaluates Connect-5 Wraparound combined correctly", async () => {
    // 8x8 is supported for C5-Wrap
    const solver = new NodeConnect4Solver({
      width: 8,
      height: 8,
      align: 5,
      wrap: true,
      heuristic: false,
    });
    await solver.init();

    // P1: 1, 2, 3, 8, 4
    // P2: 1, 2, 3, 8
    // 112233884
    const res = await solver.solve("112233884");
    expect(res.evaluation?.outcome).toBe("Win");
    // Moves played = 9. Spaces remaining = 55. Half spaces = 27.
    expect(res.evaluation?.score).toBe(31028);

    solver.release();
  });
});
