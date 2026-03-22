import { Connect4Solver } from "./index";
import { Player, Outcome, Evaluation, PositionAnalysis } from "./core";

interface NativeSolverType {
  analyze(pos: string, threads: number, w: number, h: number, weak: boolean): Promise<number[]>;
}

export class ReactNativeConnect4Solver extends Connect4Solver {
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

  async analyzeAsync(positionStr: string, opts?: { threads?: number }): Promise<PositionAnalysis> {
    let Connect4SolverNative: NativeSolverType;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const rn = require("react-native") as { NativeModules: { Connect4Solver?: NativeSolverType } };
      if (!rn.NativeModules.Connect4Solver) throw new Error();
      Connect4SolverNative = rn.NativeModules.Connect4Solver;
    } catch {
      throw new Error("NativeModules.Connect4Solver is completely missing from the bridge block. Ensure the native libraries were properly bundled.");
    }

    // Call the Objective-C++ / JNI Layer passing the raw arguments strongly
    const nativeResArr = await Connect4SolverNative.analyze(
      positionStr,
      opts?.threads ?? 1,
      this.width,
      this.height,
      false // weak=false
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
            moveOptions.push({ outcome: Outcome.Draw, winner: null, movesToEnd: null, score: 0 });
          } else if (n > 0) {
            moveOptions.push({ outcome: Outcome.Win, winner: owner, movesToEnd: halfMovesRemaining - n + 1, score: n });
          } else {
            moveOptions.push({ outcome: Outcome.Loss, winner: opp, movesToEnd: halfMovesRemaining + n + 1, score: n });
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
              bestEval.movesToEnd !== null &&
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
            bestEval.movesToEnd !== null &&
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
    };
  }
}
