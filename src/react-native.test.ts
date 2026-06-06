/* eslint-disable */

import { Outcome, Player } from "./core.js";
import { jest } from "@jest/globals";
import { ReactNativeConnect4Solver } from "./native.js";

describe("ReactNativeConnect4Solver Bridge Tests", () => {
  let solver: ReactNativeConnect4Solver;
  let rnMock: any;

  beforeAll(async () => {
    rnMock = {
      NativeModules: {
        Connect4Solver: {
          createCache: jest.fn(() => "mockCachePtr"),
          createSolver: jest.fn(() => "mockSolverPtr"),
          createBookFromBuffer: jest.fn(() => "mockBookPtr"),
          destroyBook: jest.fn(),
          destroySolver: jest.fn(),
          destroyCache: jest.fn(),
          analyze: jest.fn(
            (
              _solverPtr: string,
              pos: string,
              _threads: number,
              _timeoutMs: number,
              _w: number,
              _h: number,
              _weak: boolean,
              _bookPtr: string,
            ) => {
              return new Promise((resolve) => {
                if (pos === "121212") {
                  resolve([0, 6, 11, -1000, -10, 0, -2, -1, 3, 0]); // aborted=0
                } else if (pos === "1212121") {
                  resolve([1, 6, 0, 0, 0, 0, 0, 0, 0, 0]);
                } else if (pos === "1111111") {
                  resolve([2, 6, 0, 0, 0, 0, 0, 0, 0, 0]);
                } else {
                  resolve([0, pos.length, 0, 0, 0, 0, 0, 0, 0, 0]);
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

    const expoCoreMock = {
      requireNativeModule: jest.fn((moduleName: string) => {
        if (moduleName === "Connect4Solver") {
          return rnMock.NativeModules.Connect4Solver;
        }
        return null;
      }),
    };

    (global as any).require = (moduleName: string) => {
      if (moduleName === "react-native") {
        return rnMock;
      }
      if (moduleName === "expo-modules-core") {
        return expoCoreMock;
      }
      throw new Error(`Cannot find module '${moduleName}'`);
    };

    solver = new ReactNativeConnect4Solver(7, 6);
    await solver.init(); // Mock init is instant
  });

  test("should seamlessly route async analysis down through NativeModules map", async () => {
    const result = await solver.analyze("121212");

    // Validate structural parity over to Javascript runtime mappings:
    expect(result.originalPosition).toBe("121212");
    expect(result.evaluation?.outcome).toBe(Outcome.Win); // Our mock hardcoded a +11 score on col 1
    expect(result.evaluation?.winner).toBe(Player.P1);
    expect(result.moveOptions).toHaveLength(7);
  });

  test("should interpret hard winning native states perfectly", async () => {
    const result = await solver.analyze("1212121");
    // Status 1 triggers instant win evaluation parsing logic natively
    expect(result.evaluation?.outcome).toBe(Outcome.Win);
    expect(result.evaluation?.winner).toBe(Player.P1);
  });

  test("should correctly pass the Opening Book loading payload natively", async () => {
    await solver.loadBook(new Uint8Array([1, 2, 3]));
    // Should call createBookFromBuffer natively
    const rn = require("react-native");
    expect(
      rn.NativeModules.Connect4Solver.createBookFromBuffer,
    ).toHaveBeenCalled();
  });
});
