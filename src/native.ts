/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  BaseConnect4Solver,
  Player,
  Outcome,
  Evaluation,
  AnalyzeOptions,
  PositionAnalysis,
  calculateWDL,
  Connect4SolverOptions,
} from "./core.js";

interface NativeSolverType {
  createCache(w: number, h: number, sizeBytes: number, heuristic: boolean): string;
  destroyCache(cachePtr: string): void;
  createSolver(w: number, h: number, cachePtr: string, heuristic: boolean): string;
  destroySolver(solverPtr: string, w: number, h: number, heuristic: boolean): void;
  createBookFromBuffer(w: number, h: number, base64: string): string;
  destroyBook(w: number, h: number, bookPtr: string): void;
  analyze(solverPtr: string, pos: string, threads: number, w: number, h: number, weak: boolean, bookPtr: string): Promise<number[]>;
  analyzeHeuristic(solverPtr: string, pos: string, maxDepth: number, threads: number, timeoutMs: number, w: number, h: number, bookPtr: string): Promise<number[]>;
  solve(solverPtr: string, pos: string, threads: number, w: number, h: number, weak: boolean, bookPtr: string): Promise<number[]>;
  solveHeuristic(solverPtr: string, pos: string, maxDepth: number, threads: number, timeoutMs: number, w: number, h: number, bookPtr: string): Promise<number[]>;
}

function encodeBase64(data: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < data.length; i += 3) {
    const b1 = data[i];
    const b2 = i + 1 < data.length ? data[i + 1] : 0;
    const b3 = i + 2 < data.length ? data[i + 2] : 0;
    const triplet = (b1 << 16) | (b2 << 8) | b3;
    result += chars[(triplet >> 18) & 0x3f];
    result += chars[(triplet >> 12) & 0x3f];
    result += i + 1 < data.length ? chars[(triplet >> 6) & 0x3f] : "=";
    result += i + 2 < data.length ? chars[triplet & 0x3f] : "=";
  }
  return result;
}

export class ReactNativeConnect4Solver extends BaseConnect4Solver {
  private _isHeuristic: boolean;
  private _cacheSizeMb: number;
  private _cachePtrStr = "0";
  private _solverPtrStr = "0";
  private _nativeModule: NativeSolverType;

  constructor(widthOrOpts?: number | Connect4SolverOptions, heightOpt?: number) {
    super(widthOrOpts, heightOpt);
    this._isHeuristic = false;
    this._cacheSizeMb = 32;

    if (widthOrOpts && typeof widthOrOpts === "object") {
      if (widthOrOpts.heuristic !== undefined) this._isHeuristic = widthOrOpts.heuristic;
      if (widthOrOpts.cacheSizeMb !== undefined) this._cacheSizeMb = widthOrOpts.cacheSizeMb;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const rn = require("react-native") as {
        NativeModules: { Connect4Solver?: NativeSolverType };
      };
      if (!rn.NativeModules.Connect4Solver) throw new Error();
      this._nativeModule = rn.NativeModules.Connect4Solver;
    } catch {
      throw new Error(
        "NativeModules.Connect4Solver is completely missing from the bridge block. Ensure the native libraries were properly bundled.",
      );
    }
  }

  init(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    this._cachePtrStr = this._nativeModule.createCache(this.width, this.height, this._cacheSizeMb * 1024 * 1024, this._isHeuristic);
    this._solverPtrStr = this._nativeModule.createSolver(this.width, this.height, this._cachePtrStr, this._isHeuristic);
    this.initialized = true;
    return Promise.resolve();
  }

  loadBook(data: Uint8Array): Promise<void> {
    if (!this.initialized) throw new Error("Call init() first.");
    if (this._bookPtr && this._bookPtr !== "0") {
      this._nativeModule.destroyBook(this.width, this.height, this._bookPtr as string);
    }
    const b64 = encodeBase64(data);
    this._bookPtr = this._nativeModule.createBookFromBuffer(this.width, this.height, b64);
    return Promise.resolve();
  }

  async analyze(
    positionStr: string,
    opts?: AnalyzeOptions,
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    const { threads, maxDepth, timeoutMs, bookPtr, weak } = this.sanitizeOpts(opts);

    let nativeResArr: number[];
    if (this._isHeuristic) {
      nativeResArr = await this._nativeModule.analyzeHeuristic(this._solverPtrStr, positionStr, maxDepth, threads, timeoutMs, this.width, this.height, bookPtr as string);
    } else {
      nativeResArr = await this._nativeModule.analyze(this._solverPtrStr, positionStr, threads, this.width, this.height, weak, bookPtr as string);
    }

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
        eval: {
          value: Number.POSITIVE_INFINITY,
          wdl: calculateWDL(Number.POSITIVE_INFINITY, true, Outcome.Win),
        },
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

          if (this._isHeuristic) {
            moveOptions.push({
              eval: { value: n, wdl: calculateWDL(n, false) },
              score: n,
            });
          } else {
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
                eval: {
                  value: Number.POSITIVE_INFINITY,
                  wdl: calculateWDL(Number.POSITIVE_INFINITY, true, Outcome.Win),
                },
                outcome: Outcome.Win,
                winner: owner,
                movesToEnd: halfMovesRemaining - n + 1,
                score: n,
              });
            } else {
              moveOptions.push({
                eval: {
                  value: Number.NEGATIVE_INFINITY,
                  wdl: calculateWDL(Number.NEGATIVE_INFINITY, true, Outcome.Loss),
                },
                outcome: Outcome.Loss,
                winner: opp,
                movesToEnd: halfMovesRemaining + n + 1,
                score: n,
              });
            }
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

        if (this._isHeuristic) {
          if (ev.score > bestEval.score) bestEval = ev;
        } else {
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
      }
      evaluation = bestEval;
    }

    return {
      position: currentPosition,
      originalPosition: positionStr,
      currentPlayer,
      evaluation,
      moveOptions,
      isHeuristic: this._isHeuristic,
    };
  }

  async analyzeAsync(
    positionStr: string,
    opts?: AnalyzeOptions,
  ): Promise<PositionAnalysis> {
    return this.analyze(positionStr, opts);
  }

  async solve(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    const { threads, maxDepth, timeoutMs, bookPtr, weak } = this.sanitizeOpts(opts);

    let nativeResArr: number[];
    if (this._isHeuristic) {
      nativeResArr = await this._nativeModule.solveHeuristic(this._solverPtrStr, positionStr, maxDepth, threads, timeoutMs, this.width, this.height, bookPtr as string);
    } else {
      nativeResArr = await this._nativeModule.solve(this._solverPtrStr, positionStr, threads, this.width, this.height, weak, bookPtr as string);
    }

    const status = nativeResArr[0];
    const nbMoves = nativeResArr[1];

    let currentPosition = positionStr;
    const currentPlayer = nbMoves % 2 === 0 ? Player.P1 : Player.P2;

    if (status === 2) {
      currentPosition = positionStr.slice(0, nbMoves);
    } else if (status === 1) {
      currentPosition = positionStr.slice(0, nbMoves + 1);
      const winningMoveIndex = nbMoves;
      const winner = winningMoveIndex % 2 === 0 ? Player.P1 : Player.P2;
      return {
        position: currentPosition,
        originalPosition: positionStr,
        currentPlayer,
        evaluation: {
          eval: {
            value: Number.POSITIVE_INFINITY,
            wdl: calculateWDL(Number.POSITIVE_INFINITY, true, Outcome.Win),
          },
          outcome: Outcome.Win,
          winner: winner,
          movesToEnd: 0,
          score: Math.floor((this.width * this.height + 1 - nbMoves) / 2),
        },
        moveOptions: [],
        isHeuristic: this._isHeuristic,
      };
    }

    const score = nativeResArr[2];
    const bestMove = nativeResArr[3] === -1 ? undefined : nativeResArr[3];
    const depth = nativeResArr[4];
    
    // Construct 64-bit integer from two 32-bit halves (low, high)
    const nodes = (nativeResArr[5] >>> 0) + ((nativeResArr[6] >>> 0) * 4294967296);
    
    const aborted = nativeResArr[7] === 1;

    let evaluation: Evaluation;

    if (this._isHeuristic) {
      evaluation = {
        eval: { value: score, wdl: calculateWDL(score, false) },
        score,
        bestMove,
        nodes,
      };
    } else {
      const isPlayer1Turn = nbMoves % 2 === 0;
      const owner = isPlayer1Turn ? Player.P1 : Player.P2;
      const opp = isPlayer1Turn ? Player.P2 : Player.P1;
      const movesRemaining = this.width * this.height - nbMoves;
      const halfMovesRemaining = Math.ceil(movesRemaining / 2);

      if (score === 0) {
        evaluation = {
          eval: { value: 0, wdl: calculateWDL(0, true, Outcome.Draw) },
          outcome: Outcome.Draw,
          winner: null,
          movesToEnd: null,
          score: 0,
          bestMove,
          nodes,
        };
      } else if (score > 0) {
        evaluation = {
          eval: {
            value: Number.POSITIVE_INFINITY,
            wdl: calculateWDL(Number.POSITIVE_INFINITY, true, Outcome.Win),
          },
          outcome: Outcome.Win,
          winner: owner,
          movesToEnd: halfMovesRemaining - score + 1,
          score,
          bestMove,
          nodes,
        };
      } else {
        evaluation = {
          eval: {
            value: Number.NEGATIVE_INFINITY,
            wdl: calculateWDL(Number.NEGATIVE_INFINITY, true, Outcome.Loss),
          },
          outcome: Outcome.Loss,
          winner: opp,
          movesToEnd: halfMovesRemaining + score + 1,
          score,
          bestMove,
          nodes,
        };
      }
    }

    return {
      position: currentPosition,
      originalPosition: positionStr,
      currentPlayer,
      evaluation,
      moveOptions: [], // solve doesn't return full move options
      depthReached: depth,
      nodes,
      bestMove,
      aborted,
      isHeuristic: this._isHeuristic,
    };
  }

  async solveAsync(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Promise<PositionAnalysis> {
    return this.solve(positionStr, opts);
  }

  stop(): void {
    console.warn("stop() is natively a no-op via JNI bindings right now. The solver will timeout on its own.");
  }

  getNodeCount(): number {
    return 0; // Not bound efficiently across bridge yet
  }

  release(): void {
    this.unload();
  }

  unload(): void {
    if (!this.initialized) return;
    if (this._solverPtrStr !== "0") {
      this._nativeModule.destroySolver(this._solverPtrStr, this.width, this.height, this._isHeuristic);
      this._solverPtrStr = "0";
    }
    if (this._cachePtrStr !== "0") {
      this._nativeModule.destroyCache(this._cachePtrStr);
      this._cachePtrStr = "0";
    }
    if (this._bookPtr && this._bookPtr !== "0") {
      this._nativeModule.destroyBook(this.width, this.height, this._bookPtr as string);
      this._bookPtr = "0";
    }
    this.initialized = false;
  }
}
