import { Outcome, Player } from "./core";
import { ReactNativeConnect4Solver } from "./native";

// Mock React Native universally before tests run
jest.mock(
  "react-native",
  () => {
    return {
      NativeModules: {
        Connect4Solver: {
          // Return a mock output raw JNI/Obj-C IntArray matching what WASM usually returns
          // [status, nbmoves, scores...]
          analyze: jest.fn(
            (
              pos: string,
              _threads: number,
              _w: number,
              _h: number,
              _weak: boolean,
            ) => {
              return new Promise((resolve) => {
                if (pos === "121212") {
                  // If it's a 7x6 board, output 2 (status) + 7 = 9 length array
                  // Let's pretend it evaluated column 1 as a Win (+11)
                  resolve([0, 6, 11, -1000, -10, 0, -2, -1, 3]);
                } else if (pos === "1212121") {
                  // Instantly won (status = 1) on the 7th move. C++ parser will halt at 6 parsed moves.
                  resolve([1, 6, 0, 0, 0, 0, 0, 0, 0]);
                } else if (pos === "1111111") {
                  // Invalid play (column overfill)
                  resolve([2, 6, 0, 0, 0, 0, 0, 0, 0]);
                } else {
                  resolve([0, pos.length, 0, 0, 0, 0, 0, 0, 0]);
                }
              });
            },
          ),
        },
      },
      Platform: {
        select: jest.fn((opts: { default: string }) => opts.default),
      },
    };
  },
  { virtual: true },
);

describe("ReactNativeConnect4Solver Bridge Tests", () => {
  let solver: ReactNativeConnect4Solver;

  beforeAll(async () => {
    solver = new ReactNativeConnect4Solver(7, 6);
    await solver.init(); // Mock init is instant
  });

  test("should seamlessly route async analysis down through NativeModules map", async () => {
    const result = await solver.analyzeAsync("121212");

    // Validate structural parity over to Javascript runtime mappings:
    expect(result.originalPosition).toBe("121212");
    expect(result.evaluation?.outcome).toBe(Outcome.Win); // Our mock hardcoded a +11 score on col 1
    expect(result.evaluation?.winner).toBe(Player.P1);
    expect(result.moveOptions).toHaveLength(7);
  });

  test("should interpret hard winning native states perfectly", async () => {
    const result = await solver.analyzeAsync("1212121");
    // Status 1 triggers instant win evaluation parsing logic natively
    expect(result.evaluation?.outcome).toBe(Outcome.Win);
    expect(result.evaluation?.winner).toBe(Player.P1);
  });

  test("should correctly bypass the unneeded Opening Book loading payload securely natively", async () => {
    // Should warn, not throw
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {
      return;
    });
    await solver.loadBook(new Uint8Array([1, 2, 3]));
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("natively bypassed"),
    );
    consoleSpy.mockRestore();
  });
});
