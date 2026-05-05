import {
  BaseConnect4Solver,
  Player,
  Outcome,
  Evaluation,
  PositionAnalysis,
  calculateWDL,
  AnalyzeOptions,
  Connect4SolverOptions,
  SolverModule,
} from "./core";

export const STATUS_WIN = 1;
export const STATUS_INVALID = 2;
export const UNPLAYABLE_COLUMN_SCORE = -1000;
export const INT32_SIZE = 4;

export abstract class AbstractSyncSolver extends BaseConnect4Solver {
  protected isHeuristic: boolean;
  protected cacheSizeMb: number;

  protected _solverPtr = 0;
  protected _cachePtr = 0;

  constructor(opts?: Connect4SolverOptions | number, heightOpt?: number) {
    super(opts as Connect4SolverOptions, heightOpt);
    let cacheSizeMb = 128;
    let heuristic = false;

    if (opts && typeof opts === "object") {
      if (opts.cacheSizeMb !== undefined) cacheSizeMb = opts.cacheSizeMb;
      if (opts.heuristic !== undefined) heuristic = opts.heuristic;
    }

    this.cacheSizeMb = cacheSizeMb;
    this.isHeuristic = heuristic;
  }

  solve(
    _positionStr: string,
    _opts?: AnalyzeOptions & { weak?: boolean },
  ): PositionAnalysis | Promise<PositionAnalysis> {
    throw new Error("solve() is not implemented for this solver.");
  }

  protected getPlayerAt(nbMoves: number): Player {
    return nbMoves % 2 === 0 ? Player.P1 : Player.P2;
  }

  protected createEvaluation(score: number, nbMoves: number): Evaluation {
    const isPlayer1Turn = nbMoves % 2 === 0;
    const currentPlayer = isPlayer1Turn ? Player.P1 : Player.P2;
    const opponent = isPlayer1Turn ? Player.P2 : Player.P1;
    const movesRemaining = this.width * this.height - nbMoves;
    const halfMovesRemaining = Math.ceil(movesRemaining / 2);

    if (this.isHeuristic) {
      if (score >= 31000) {
        const realScore = score - 31000;
        return {
          eval: {
            value: Number.POSITIVE_INFINITY,
            wdl: calculateWDL(Number.POSITIVE_INFINITY, true, Outcome.Win),
          },
          outcome: Outcome.Win,
          winner: currentPlayer,
          movesToEnd: halfMovesRemaining - realScore + 1,
          score,
        };
      } else if (score <= -31000) {
        const realScore = score + 31000;
        return {
          eval: {
            value: Number.NEGATIVE_INFINITY,
            wdl: calculateWDL(Number.NEGATIVE_INFINITY, true, Outcome.Loss),
          },
          outcome: Outcome.Loss,
          winner: opponent,
          movesToEnd: halfMovesRemaining + realScore + 1,
          score,
        };
      } else {
        const val = score / 100.0;
        return { eval: { value: val, wdl: calculateWDL(val, false) }, score };
      }
    }

    if (score === 0) {
      return {
        eval: { value: 0, wdl: calculateWDL(0, true, Outcome.Draw) },
        outcome: Outcome.Draw,
        winner: null,
        movesToEnd: null,
        score,
      };
    } else if (score > 0) {
      return {
        eval: {
          value: Number.POSITIVE_INFINITY,
          wdl: calculateWDL(Number.POSITIVE_INFINITY, true, Outcome.Win),
        },
        outcome: Outcome.Win,
        winner: currentPlayer,
        movesToEnd: halfMovesRemaining - score + 1,
        score,
      };
    } else {
      return {
        eval: {
          value: Number.NEGATIVE_INFINITY,
          wdl: calculateWDL(Number.NEGATIVE_INFINITY, true, Outcome.Loss),
        },
        outcome: Outcome.Loss,
        winner: opponent,
        movesToEnd: halfMovesRemaining + score + 1,
        score,
      };
    }
  }

  protected parseResArr(
    resArr: Int32Array | number[],
    positionStr: string,
  ): PositionAnalysis {
    const originalPosition = positionStr;
    const status = resArr[0];
    const nbMoves = resArr[1];
    let currentPosition = positionStr;
    const currentPlayer = this.getPlayerAt(nbMoves);
    let evaluation: Evaluation | null = null;
    const moveOptions: (Evaluation | null)[] = [];

    const unplayableScore = this.isHeuristic
      ? -1000000
      : UNPLAYABLE_COLUMN_SCORE;

    if (status === STATUS_INVALID) {
      currentPosition = positionStr.slice(0, nbMoves);
    } else if (status === STATUS_WIN) {
      currentPosition = positionStr.slice(0, nbMoves + 1);
      const winner = nbMoves % 2 === 0 ? Player.P1 : Player.P2;
      const movesToEnd = 0;
      const score = Math.floor((this.width * this.height - nbMoves) / 2);
      evaluation = {
        eval: {
          value: Number.POSITIVE_INFINITY,
          wdl: calculateWDL(Number.POSITIVE_INFINITY, true, Outcome.Win),
        },
        outcome: Outcome.Win,
        winner: winner,
        movesToEnd: movesToEnd,
        score: score,
      };
    } else {
      for (let i = 0; i < this.width; i++) {
        const n = resArr[2 + i];
        if (n === unplayableScore) moveOptions.push(null);
        else moveOptions.push(this.createEvaluation(n, nbMoves));
      }

      let bestEval: Evaluation | null = null;
      for (const ev of moveOptions) {
        if (!ev) continue;
        if (!bestEval || ev.score > bestEval.score) bestEval = ev;
      }
      evaluation = bestEval;
    }

    const depthReached = this.isHeuristic ? resArr[2 + this.width] : undefined;
    const aborted = this.isHeuristic ? undefined : resArr[2 + this.width] === 1;

    if (aborted) {
      evaluation = null;
      moveOptions.length = 0;
    }

    return {
      position: currentPosition,
      originalPosition,
      currentPlayer,
      evaluation,
      moveOptions,
      depthReached,
      isHeuristic: this.isHeuristic,
      aborted,
    };
  }

  protected parseSolveResArr(
    resArr: Int32Array | number[],
    positionStr: string,
  ): PositionAnalysis {
    const originalPosition = positionStr;
    const status = resArr[0];
    const nbMoves = resArr[1];
    let currentPosition = positionStr;
    const currentPlayer = this.getPlayerAt(nbMoves);
    let evaluation: Evaluation | null = null;
    const bestMove = resArr[3] === -1 ? undefined : resArr[3];
    const depthReached = resArr[4];
    const nodes_low = resArr[5];
    const nodes_high = resArr[6];
    const nodes = (nodes_high >>> 0) * 4294967296 + (nodes_low >>> 0);
    const aborted = resArr[7] === 1;

    if (status === STATUS_INVALID) {
      currentPosition = positionStr.slice(0, nbMoves);
    } else if (status === STATUS_WIN) {
      currentPosition = positionStr.slice(0, nbMoves + 1);
      const winner = nbMoves % 2 === 0 ? Player.P1 : Player.P2;
      const score = Math.floor((this.width * this.height - nbMoves) / 2);

      evaluation = {
        eval: {
          value:
            winner === Player.P1
              ? Number.POSITIVE_INFINITY
              : Number.NEGATIVE_INFINITY,
          wdl: calculateWDL(
            winner === Player.P1
              ? Number.POSITIVE_INFINITY
              : Number.NEGATIVE_INFINITY,
            true,
            winner === Player.P1 ? Outcome.Win : Outcome.Loss,
          ),
        },
        outcome: winner === currentPlayer ? Outcome.Win : Outcome.Loss,
        winner: winner,
        movesToEnd: positionStr.length - (nbMoves + 1),
        score: winner === currentPlayer ? score : -score,
      };
    } else {
      const score = resArr[2];
      evaluation = this.createEvaluation(score, nbMoves);
    }

    if (evaluation) {
      evaluation.bestMove = bestMove;
      evaluation.nodes = nodes;
    }

    if (aborted) {
      evaluation = null;
    }

    return {
      position: currentPosition,
      originalPosition,
      currentPlayer,
      evaluation,
      moveOptions: [],
      depthReached,
      isHeuristic: this.isHeuristic,
      bestMove,
      nodes,
      aborted,
    };
  }

  protected executeWasmSolve(
    mod: SolverModule,
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Int32Array {
    const { threads, maxDepth, timeoutMs, bookPtr } = this.sanitizeOpts(opts);
    const weak = opts?.weak ?? false;

    const allocatedMemory = mod.stringToNewUTF8(positionStr);
    let outputPointer: number;
    if (this.isHeuristic)
      // Heuristic solve() does not benefit from LazySMP threading
      outputPointer = mod._solveHeuristic(
        this.width,
        this.height,
        this._solverPtr,
        allocatedMemory,
        maxDepth,
        threads,
        timeoutMs,
        bookPtr,
      );
    else
      outputPointer = mod._solveExact(
        this.width,
        this.height,
        this._solverPtr,
        allocatedMemory,
        (weak ? 1 : 0) as unknown as boolean,
        threads,
        bookPtr,
        timeoutMs,
      );

    const dataLength = 8;
    const finalData = new Int32Array(dataLength);
    for (let i = 0; i < dataLength; i++) {
      finalData[i] = mod.getValue(outputPointer + i * INT32_SIZE, "i32");
    }
    mod._free(allocatedMemory);
    mod._free(outputPointer);
    return finalData;
  }

  protected executeWasmAnalyze(
    mod: SolverModule,
    positionStr: string,
    opts?: AnalyzeOptions,
  ): Int32Array {
    const { threads, maxDepth, timeoutMs, bookPtr, weak } =
      this.sanitizeOpts(opts);

    const allocatedMemory = mod.stringToNewUTF8(positionStr);
    let outputPointer: number;
    if (this.isHeuristic)
      outputPointer = mod._analyzeHeuristic(
        this.width,
        this.height,
        this._solverPtr,
        allocatedMemory,
        threads,
        maxDepth,
        timeoutMs,
      );
    else
      outputPointer = mod._analyzeExact(
        this.width,
        this.height,
        this._solverPtr,
        allocatedMemory,
        (weak ? 1 : 0) as unknown as boolean,
        threads,
        bookPtr,
        timeoutMs,
      );

    const dataLength = 3 + this.width;
    const finalData = new Int32Array(dataLength);
    for (let i = 0; i < dataLength; i++) {
      finalData[i] = mod.getValue(outputPointer + i * INT32_SIZE, "i32");
    }
    mod._free(allocatedMemory);
    mod._free(outputPointer);
    return finalData;
  }

  abstract init(): Promise<void>;
  abstract analyze(
    positionStr: string,
    opts?: AnalyzeOptions,
  ): PositionAnalysis | Promise<PositionAnalysis>;
  abstract getNodeCount(): number;
  abstract stop(): void;
  abstract release(): void;
  unload(): void {
    this.release();
  }
  async analyzeAsync(
    positionStr: string,
    opts?: AnalyzeOptions,
  ): Promise<PositionAnalysis> {
    return this.analyze(positionStr, opts);
  }
  async solveAsync(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Promise<PositionAnalysis> {
    return this.solve(positionStr, opts);
  }
}
