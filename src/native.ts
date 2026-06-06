import {
  BaseConnect4Solver,
  Player,
  Outcome,
  Evaluation,
  AnalyzeOptions,
  PositionAnalysis,
  Connect4SolverOptions,
} from "./core.js";

/**
 * React Native JNI bridge interface.
 * Note: pointers are passed as opaque strings (React Native doesn't support raw numeric pointers).
 * Note: exact `analyze` and `solve` do not yet expose timeoutMs via JNI — this interface
 * reflects the intended final signature; the native module needs to be updated to match.
 */
interface NativeSolverType {
  createCache(
    w: number,
    h: number,
    sizeBytes: number,
    heuristic: boolean,
    align: number,
    wrap: boolean,
  ): string;
  destroyCache(cachePtr: string): void;
  createSolver(
    w: number,
    h: number,
    cachePtr: string,
    heuristic: boolean,
    align: number,
    wrap: boolean,
  ): string;
  destroySolver(
    solverPtr: string,
    w: number,
    h: number,
    heuristic: boolean,
    align: number,
    wrap: boolean,
  ): void;
  createBookFromBuffer(w: number, h: number, base64: string): string;
  destroyBook(w: number, h: number, bookPtr: string): void;
  stop(
    solverPtr: string,
    w: number,
    h: number,
    heuristic: boolean,
    align: number,
    wrap: boolean,
  ): void;
  // Exact analysis — returns [status, nbMoves, col0..colN-1, aborted]
  analyze(
    solverPtr: string,
    pos: string,
    threads: number,
    timeoutMs: number,
    w: number,
    h: number,
    weak: boolean,
    bookPtr: string,
    align: number,
    wrap: boolean,
  ): Promise<number[]>;
  // Heuristic analysis — returns [status, nbMoves, col0..colN-1, depthReached]
  analyzeHeuristic(
    solverPtr: string,
    pos: string,
    maxDepth: number,
    threads: number,
    timeoutMs: number,
    w: number,
    h: number,
    bookPtr: string,
    align: number,
    wrap: boolean,
  ): Promise<number[]>;
  // Exact solve — returns [status, nbMoves, score, bestMove, depthReached, nodes_low, nodes_high, aborted]
  solve(
    solverPtr: string,
    pos: string,
    threads: number,
    timeoutMs: number,
    w: number,
    h: number,
    weak: boolean,
    bookPtr: string,
    align: number,
    wrap: boolean,
  ): Promise<number[]>;
  // Heuristic solve
  solveHeuristic(
    solverPtr: string,
    pos: string,
    maxDepth: number,
    threads: number,
    timeoutMs: number,
    w: number,
    h: number,
    bookPtr: string,
    align: number,
    wrap: boolean,
  ): Promise<number[]>;
}

function encodeBase64(data: Uint8Array): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
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
  private _cacheSizeMb: number;
  private _cachePtrStr = "0";
  private _solverPtrStr = "0";
  private _nativeModule!: NativeSolverType;

  constructor(
    widthOrOpts?: number | Connect4SolverOptions,
    heightOpt?: number,
  ) {
    super(widthOrOpts, heightOpt);
    this._cacheSizeMb = 32;

    if (widthOrOpts && typeof widthOrOpts === "object") {
      if (widthOrOpts.cacheSizeMb !== undefined)
        this._cacheSizeMb = widthOrOpts.cacheSizeMb;
    }

    this.allocatedCacheSizeMb = this._cacheSizeMb;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
      const expoCore = require("expo-modules-core");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (expoCore?.requireNativeModule) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this._nativeModule = expoCore.requireNativeModule("Connect4Solver");
      }
    } catch {
      // Ignore constructor errors, we'll try again during async init
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    if (!this._nativeModule) {
      let retries = 5;
      while (retries > 0) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
          const expoCore = require("expo-modules-core");
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (expoCore?.requireNativeModule) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            this._nativeModule = expoCore.requireNativeModule("Connect4Solver");
            break;
          }
        } catch {
          // Ignore and wait
        }
        retries--;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    if (!this._nativeModule) {
      throw new Error(
        "Expo module Connect4Solver is missing. Ensure the native libraries were properly bundled and you have run prebuild.",
      );
    }

    // OOM retry: native.createCache returns "0" if allocation fails. Halve the request until it succeeds.
    let sizeMb = this._cacheSizeMb;
    let ptrStr: string;
    while (true) {
      ptrStr = this._nativeModule.createCache(
        this.width,
        this.height,
        sizeMb * 1024 * 1024,
        this.isHeuristic,
        this.align,
        this.wrap,
      );
      if (ptrStr !== "0") break;
      if (sizeMb <= 4) break;
      sizeMb = Math.max(4, Math.floor(sizeMb / 2));
    }
    if (ptrStr === "0") throw new Error(`Failed to allocate native cache`);
    this._cachePtrStr = ptrStr;
    this.allocatedCacheSizeMb = sizeMb;

    this._solverPtrStr = this._nativeModule.createSolver(
      this.width,
      this.height,
      this._cachePtrStr,
      this.isHeuristic,
      this.align,
      this.wrap,
    );
    this.initialized = true;
  }

  loadBook(data: Uint8Array): Promise<void> {
    if (!this.initialized) throw new Error("Call init() first.");
    if (this._isBusy || this._queue.length > 0) {
      throw new Error(
        "Cannot load a book while a search is active or queued. Call stop() and await it first.",
      );
    }
    // Book loading bypasses runTask() — it has its own guard above
    if (this._bookPtr && this._bookPtr !== "0") {
      this._nativeModule.destroyBook(
        this.width,
        this.height,
        this._bookPtr as string,
      );
    }
    const b64 = encodeBase64(data);
    this._bookPtr = this._nativeModule.createBookFromBuffer(
      this.width,
      this.height,
      b64,
    );
    return Promise.resolve();
  }

  private createEvaluation(
    score: number,
    nbMoves: number,
    isHeuristicOverride?: boolean,
  ): Evaluation {
    const isPlayer1Turn = nbMoves % 2 === 0;
    const currentPlayer = isPlayer1Turn ? Player.P1 : Player.P2;
    const opponent = isPlayer1Turn ? Player.P2 : Player.P1;
    const movesRemaining = this.width * this.height - nbMoves;
    const halfMovesRemaining = Math.ceil(movesRemaining / 2);

    const isHeuristic = isHeuristicOverride ?? this.isHeuristic;

    if (isHeuristic) {
      if (score >= 31000) {
        const realScore = score - 31000;
        return {
          eval: { value: Number.POSITIVE_INFINITY },
          outcome: Outcome.Win,
          winner: currentPlayer,
          movesToEnd: halfMovesRemaining - realScore + 1,
          score,
        };
      } else if (score <= -31000) {
        const realScore = score + 31000;
        return {
          eval: { value: Number.NEGATIVE_INFINITY },
          outcome: Outcome.Loss,
          winner: opponent,
          movesToEnd: halfMovesRemaining + realScore + 1,
          score,
        };
      } else {
        return { eval: { value: score / 100.0 }, score };
      }
    }

    if (score === 0) {
      return {
        eval: { value: 0 },
        outcome: Outcome.Draw,
        winner: null,
        movesToEnd: null,
        score,
      };
    } else if (score > 0) {
      return {
        eval: { value: Number.POSITIVE_INFINITY },
        outcome: Outcome.Win,
        winner: currentPlayer,
        movesToEnd: halfMovesRemaining - score + 1,
        score,
      };
    } else {
      return {
        eval: { value: Number.NEGATIVE_INFINITY },
        outcome: Outcome.Loss,
        winner: opponent,
        movesToEnd: halfMovesRemaining + score + 1,
        score,
      };
    }
  }

  async analyze(
    positionStr: string,
    opts?: AnalyzeOptions,
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    const { threads, maxDepth, timeoutMs, bookPtr, weak } =
      this.sanitizeOpts(opts);

    return this.runTask(async () => {
      let nativeResArr: number[];
      if (this.isHeuristic) {
        nativeResArr = await this._nativeModule.analyzeHeuristic(
          this._solverPtrStr,
          positionStr,
          maxDepth,
          threads,
          timeoutMs,
          this.width,
          this.height,
          bookPtr as string,
          this.align,
          this.wrap,
        );
      } else {
        nativeResArr = await this._nativeModule.analyze(
          this._solverPtrStr,
          positionStr,
          threads,
          timeoutMs,
          this.width,
          this.height,
          weak,
          bookPtr as string,
          this.align,
          this.wrap,
        );
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
        const winner = nbMoves % 2 === 0 ? Player.P1 : Player.P2;
        evaluation = {
          eval: { value: Number.POSITIVE_INFINITY },
          outcome: Outcome.Win,
          winner,
          movesToEnd: 0,
          score: Math.floor((this.width * this.height + 1 - nbMoves) / 2),
        };
      } else {
        for (let i = 0; i < this.width; i++) {
          const n = nativeResArr[2 + i];
          if (n === -1000) {
            moveOptions.push(null);
          } else {
            moveOptions.push(
              this.createEvaluation(n, nbMoves, this.isHeuristic),
            );
          }
        }

        let bestEval: Evaluation | null = null;
        for (const ev of moveOptions) {
          if (!ev) continue;
          if (!bestEval || ev.score > bestEval.score) bestEval = ev;
        }
        evaluation = bestEval;
      }

      const depthReached = nativeResArr[2 + this.width];
      const aborted = nativeResArr[3 + this.width] === 1;

      const nodes =
        (nativeResArr[4 + this.width] >>> 0) +
        (nativeResArr[5 + this.width] >>> 0) * 4294967296;

      let bestMove: number | undefined;
      if (evaluation && !aborted) {
        const bestScore = evaluation.score;
        for (let i = 0; i < this.width; i++) {
          if (moveOptions[i]?.score === bestScore) {
            bestMove = i;
            break;
          }
        }
      }

      if (aborted && !this.isHeuristic) {
        evaluation = null;
        moveOptions.length = 0;
      }

      return {
        position: currentPosition,
        originalPosition: positionStr,
        currentPlayer,
        evaluation,
        moveOptions,
        bestMove,
        nodes,
        depthReached,
        isHeuristic: this.isHeuristic,
        aborted,
      };
    });
  }

  async solve(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    const { threads, maxDepth, timeoutMs, bookPtr, weak } =
      this.sanitizeOpts(opts);

    return this.runTask(async () => {
      let nativeResArr: number[];
      if (this.isHeuristic) {
        nativeResArr = await this._nativeModule.solveHeuristic(
          this._solverPtrStr,
          positionStr,
          maxDepth,
          threads,
          timeoutMs,
          this.width,
          this.height,
          bookPtr as string,
          this.align,
          this.wrap,
        );
      } else {
        nativeResArr = await this._nativeModule.solve(
          this._solverPtrStr,
          positionStr,
          threads,
          timeoutMs,
          this.width,
          this.height,
          weak,
          bookPtr as string,
          this.align,
          this.wrap,
        );
      }

      const status = nativeResArr[0];
      const nbMoves = nativeResArr[1];

      let currentPosition = positionStr;
      const currentPlayer = nbMoves % 2 === 0 ? Player.P1 : Player.P2;

      if (status === 2) {
        currentPosition = positionStr.slice(0, nbMoves);
      } else if (status === 1) {
        currentPosition = positionStr.slice(0, nbMoves + 1);
        const winner = nbMoves % 2 === 0 ? Player.P1 : Player.P2;
        return {
          position: currentPosition,
          originalPosition: positionStr,
          currentPlayer,
          evaluation: {
            eval: { value: Number.POSITIVE_INFINITY },
            outcome: Outcome.Win,
            winner,
            movesToEnd: 0,
            score: Math.floor((this.width * this.height + 1 - nbMoves) / 2),
          },
          moveOptions: [],
          isHeuristic: this.isHeuristic,
        };
      }

      const score = nativeResArr[2];
      const bestMove = nativeResArr[3] === -1 ? undefined : nativeResArr[3];
      const depth = nativeResArr[4];
      const nodes =
        (nativeResArr[5] >>> 0) + (nativeResArr[6] >>> 0) * 4294967296;
      const aborted = nativeResArr[7] === 1;

      const evaluation =
        aborted && !this.isHeuristic
          ? null
          : this.createEvaluation(score, nbMoves);

      return {
        position: currentPosition,
        originalPosition: positionStr,
        currentPlayer,
        evaluation,
        moveOptions: [],
        depthReached: depth,
        nodes,
        bestMove,
        aborted,
        isHeuristic: this.isHeuristic,
      };
    });
  }

  /**
   * Sends the abort signal to the native engine via JNI.
   */
  protected _sendAbortSignal(): void {
    if (!this.initialized) return;
    if (this._solverPtrStr !== "0") {
      this._nativeModule.stop(
        this._solverPtrStr,
        this.width,
        this.height,
        this.isHeuristic,
        this.align,
        this.wrap,
      );
    }
  }

  getNodeCount(): Promise<number> {
    // TODO: bind _getNodeCount via JNI
    return Promise.resolve(0);
  }

  release(): void {
    if (!this.initialized) return;
    if (this._solverPtrStr !== "0") {
      this._nativeModule.destroySolver(
        this._solverPtrStr,
        this.width,
        this.height,
        this.isHeuristic,
        this.align,
        this.wrap,
      );
      this._solverPtrStr = "0";
    }
    if (this._cachePtrStr !== "0") {
      this._nativeModule.destroyCache(this._cachePtrStr);
      this._cachePtrStr = "0";
    }
    if (this._bookPtr && this._bookPtr !== "0") {
      this._nativeModule.destroyBook(
        this.width,
        this.height,
        this._bookPtr as string,
      );
      this._bookPtr = "0";
    }
    this.initialized = false;
  }
}
