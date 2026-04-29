import { BaseConnect4Solver, Player, Outcome, Evaluation, PositionAnalysis, calculateWDL } from "./core";

interface NativeSolverType {
  analyze(
    pos: string,
    threads: number,
    w: number,
    h: number,
    weak: boolean,
  ): Promise<number[]>;
  releaseSolver(w: number, h: number): Promise<boolean>;
}

export class ReactNativeConnect4Solver extends BaseConnect4Solver {
  init(): Promise<void> {
    this.initialized = true; // Native layer doesn't require WASM initialization promises
    return Promise.resolve();
  }

  loadBook(_data: Uint8Array): Promise<void> {
    console.warn(
      "loadBook is natively bypassed for React Native deployments. The C++ multithreading heuristic is robust enough to not require a book payload.",
    );
    return Promise.resolve();
  }

  async analyze(
    positionStr: string,
    opts?: { threads?: number },
  ): Promise<PositionAnalysis> {
    let Connect4SolverNative: NativeSolverType;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const rn = require("react-native") as {
        NativeModules: { Connect4Solver?: NativeSolverType };
      };
      if (!rn.NativeModules.Connect4Solver) throw new Error();
      Connect4SolverNative = rn.NativeModules.Connect4Solver;
    } catch {
      throw new Error(
        "NativeModules.Connect4Solver is completely missing from the bridge block. Ensure the native libraries were properly bundled.",
      );
    }

    // Sanitize and strict-clamp the arguments before crossing the JNI bridge
    const { threads, maxDepth, timeoutMs } = this.sanitizeOpts(opts);

    // Call the Objective-C++ / JNI Layer passing the raw arguments strongly
    const nativeResArr = await Connect4SolverNative.analyze(
      positionStr,
      threads,
      this.width,
      this.height,
      false, // weak=false
    );

    const status = nativeResArr[0];
    const nbMoves = nativeResArr[1];

    let currentPosition = positionStr;
    const currentPlayer = nbMoves % 2 === 0 ? Player.P1 : Player.P2;
    let evaluation: Evaluation | null = null;
    const moveOptions: (Evaluation | null)[] = [];

    if (status === 2) {
      currentPosition = positionStr.slice(0, nbMoves);
    } else if (status === 1) {
      currentPosition = positionStr.slice(0, nbMoves + 1);
      const winningMoveIndex = nbMoves;
      const winner = winningMoveIndex % 2 === 0 ? Player.P1 : Player.P2;
      evaluation = {
        eval: { value: Number.POSITIVE_INFINITY, wdl: calculateWDL(Number.POSITIVE_INFINITY, true, Outcome.Win) },
        outcome: Outcome.Win,
        winner: winner,
        movesToEnd: 0,
        score: Math.floor((this.width * this.height + 1 - nbMoves) / 2),
      };
    } else {
      for (let i = 0; i < this.width; i++) {
        const n = nativeResArr[2 + i];
        if (n === -1000) {
          moveOptions.push(null);
        } else {
          const isPlayer1Turn = nbMoves % 2 === 0;
          const owner = isPlayer1Turn ? Player.P1 : Player.P2;
          const opp = isPlayer1Turn ? Player.P2 : Player.P1;
          const movesRemaining = this.width * this.height - nbMoves;
          const halfMovesRemaining = Math.ceil(movesRemaining / 2);

          if (n === 0) {
            moveOptions.push({
              eval: { value: 0, wdl: calculateWDL(0, true, Outcome.Draw) },
              outcome: Outcome.Draw,
              winner: null,
              movesToEnd: null,
              score: 0,
            });
          } else if (n > 0) {
            moveOptions.push({
              eval: { value: Number.POSITIVE_INFINITY, wdl: calculateWDL(Number.POSITIVE_INFINITY, true, Outcome.Win) },
              outcome: Outcome.Win,
              winner: owner,
              movesToEnd: halfMovesRemaining - n + 1,
              score: n,
            });
          } else {
            moveOptions.push({
              eval: { value: Number.NEGATIVE_INFINITY, wdl: calculateWDL(Number.NEGATIVE_INFINITY, true, Outcome.Loss) },
              outcome: Outcome.Loss,
              winner: opp,
              movesToEnd: halfMovesRemaining + n + 1,
              score: n,
            });
          }
        }
      }

      let bestEval: Evaluation | null = null;
      for (const ev of moveOptions) {
        if (!ev) continue;
        if (!bestEval) {
          bestEval = ev;
          continue;
        }

        if (ev.outcome === Outcome.Win) {
          if (
            bestEval.outcome !== Outcome.Win ||
            (ev.movesToEnd !== null &&
              ev.movesToEnd !== undefined &&
              bestEval.movesToEnd !== null &&
              bestEval.movesToEnd !== undefined &&
              ev.movesToEnd < bestEval.movesToEnd)
          ) {
            bestEval = ev;
          }
        } else if (ev.outcome === Outcome.Draw) {
          if (bestEval.outcome === Outcome.Loss) {
            bestEval = ev;
          }
        } else if (ev.outcome === Outcome.Loss) {
          if (
            bestEval.outcome === Outcome.Loss &&
            ev.movesToEnd !== null &&
            ev.movesToEnd !== undefined &&
            bestEval.movesToEnd !== null &&
            bestEval.movesToEnd !== undefined &&
            ev.movesToEnd > bestEval.movesToEnd
          ) {
            bestEval = ev;
          }
        }
      }
      evaluation = bestEval;
    }

    return {
      position: currentPosition,
      originalPosition: positionStr,
      currentPlayer,
      evaluation,
      moveOptions,
      isHeuristic: false,
    };
  }

  async analyzeAsync(positionStr: string, opts?: any): Promise<PositionAnalysis> {
    return this.analyze(positionStr, opts);
  }

  /**
   * Instantly releases the native Android/iOS memory caches allocated for this specific board size back to the OS.
   * Useful when navigating away from a game screen to prevent memory stacking.
   */
  unload(): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const rn = require("react-native") as {
        NativeModules: { Connect4Solver?: NativeSolverType };
      };
      if (rn.NativeModules.Connect4Solver) {
        rn.NativeModules.Connect4Solver.releaseSolver(this.width, this.height).catch(() => {});
      }
    } catch {
      // Ignore if not in React Native environment
    }
  }
}
