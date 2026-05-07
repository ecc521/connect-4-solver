import {
  BaseConnect4Solver,
  Player,
  Outcome,
  Evaluation,
  PositionAnalysis,
  AnalyzeOptions,
  Connect4SolverOptions,
  SolverModule,
} from "./core.js";
import { SCORE_FORCED_WIN_BASE } from "./constants.js";

export const STATUS_WIN = 1;
export const STATUS_INVALID = 2;
export const UNPLAYABLE_COLUMN_SCORE = -1000;
export const INT32_SIZE = 4;

export abstract class AbstractSyncSolver extends BaseConnect4Solver {
  public isHeuristic: boolean;
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
    this.allocatedCacheSizeMb = cacheSizeMb; // updated in init() after actual allocation
    this.isHeuristic = heuristic;
  }

  protected getPlayerAt(nbMoves: number): Player {
    return nbMoves % 2 === 0 ? Player.P1 : Player.P2;
  }

  protected createEvaluation(
    score: number,
    nbMoves: number,
    depthReached: number,
    isHeuristicOverride?: boolean,
  ): Evaluation {
    const isPlayer1Turn = nbMoves % 2 === 0;
    const currentPlayer = isPlayer1Turn ? Player.P1 : Player.P2;
    const opponent = isPlayer1Turn ? Player.P2 : Player.P1;
    const movesRemaining = this.width * this.height - nbMoves;
    const halfMovesRemaining = Math.ceil(movesRemaining / 2);

    const isHeuristic = isHeuristicOverride ?? this.isHeuristic;

    if (isHeuristic) {
      if (score >= SCORE_FORCED_WIN_BASE) {
        const depth = score - SCORE_FORCED_WIN_BASE;
        return {
          eval: { value: Number.POSITIVE_INFINITY },
          outcome: Outcome.Win,
          winner: currentPlayer,
          movesToEnd: depth,
          score,
        };
      } else if (score <= -SCORE_FORCED_WIN_BASE) {
        const depth = Math.abs(score + SCORE_FORCED_WIN_BASE);
        return {
          eval: { value: Number.NEGATIVE_INFINITY },
          outcome: Outcome.Loss,
          winner: opponent,
          movesToEnd: depth,
          score,
        };
      } else if (depthReached < movesRemaining) {
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
        score: score >= SCORE_FORCED_WIN_BASE ? score : SCORE_FORCED_WIN_BASE + score,
      };
    } else {
      return {
        eval: { value: Number.NEGATIVE_INFINITY },
        outcome: Outcome.Loss,
        winner: opponent,
        movesToEnd: halfMovesRemaining + score + 1,
        score: score <= -SCORE_FORCED_WIN_BASE ? score : -SCORE_FORCED_WIN_BASE + score,
      };
    }
  }

  protected parseResArr(
    resArr: Int32Array | number[],
    positionStr: string,
    isHeuristicOverride?: boolean,
  ): PositionAnalysis {
    const originalPosition = positionStr;
    const status = resArr[0];
    const nbMoves = resArr[1];
    let currentPosition = positionStr;
    const currentPlayer = this.getPlayerAt(nbMoves);
    let evaluation: Evaluation | null = null;
    const moveOptions: (Evaluation | null)[] = [];

    const depthReached = resArr[2 + this.width];
    const isHeuristic = isHeuristicOverride ?? this.isHeuristic;

    // The heuristic engine uses -1000000 for unplayable columns.
    // However, some versions might return UNPLAYABLE_COLUMN_SCORE (-1000) as well.
    const isUnplayable = (n: number): boolean =>
      n === -1000000 || n === UNPLAYABLE_COLUMN_SCORE;

    if (status === STATUS_INVALID) {
      currentPosition = positionStr.slice(0, nbMoves);
    } else if (status === STATUS_WIN) {
      currentPosition = positionStr.slice(0, nbMoves + 1);
      const winner = nbMoves % 2 === 0 ? Player.P1 : Player.P2;
      const baseScore = Math.floor((this.width * this.height - nbMoves) / 2);
      evaluation = {
        eval: { value: Number.POSITIVE_INFINITY },
        outcome: Outcome.Win,
        winner,
        movesToEnd: 0,
        score: SCORE_FORCED_WIN_BASE + baseScore,
      };
    } else {
      for (let i = 0; i < this.width; i++) {
        const n = resArr[2 + i];
        if (isUnplayable(n)) moveOptions.push(null);
        else moveOptions.push(this.createEvaluation(n, nbMoves, depthReached, isHeuristic));
      }

      let bestEval: Evaluation | null = null;
      for (const ev of moveOptions) {
        if (!ev) continue;
        if (!bestEval || ev.score > bestEval.score) bestEval = ev;
      }
      evaluation = bestEval;
    }

    const aborted = resArr[3 + this.width] === 1;

    const nodes =
      (resArr[4 + this.width] >>> 0) +
      (resArr[5 + this.width] >>> 0) * 4294967296;

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

    if (aborted && !isHeuristic) {
      evaluation = null;
      moveOptions.length = 0;
    }

    return {
      position: currentPosition,
      originalPosition,
      currentPlayer,
      evaluation,
      moveOptions,
      bestMove,
      nodes,
      depthReached,
      isHeuristic: isHeuristic,
      aborted,
    };
  }

  protected parseSolveResArr(
    resArr: Int32Array | number[],
    positionStr: string,
    isHeuristicOverride?: boolean,
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
      const baseScore = Math.floor((this.width * this.height - nbMoves) / 2);
      const adjustedScore = SCORE_FORCED_WIN_BASE + baseScore;
      evaluation = {
        eval: {
          value:
            winner === Player.P1
              ? Number.POSITIVE_INFINITY
              : Number.NEGATIVE_INFINITY,
        },
        outcome: winner === currentPlayer ? Outcome.Win : Outcome.Loss,
        winner,
        movesToEnd: positionStr.length - (nbMoves + 1),
        score: winner === currentPlayer ? adjustedScore : -adjustedScore,
      };
    } else {
      const score = resArr[2];
      evaluation = this.createEvaluation(
        score,
        nbMoves,
        depthReached,
        isHeuristicOverride ?? this.isHeuristic,
      );
    }

    const isHeuristic = isHeuristicOverride ?? this.isHeuristic;

    if (aborted && !isHeuristic) {
      evaluation = null;
    }

    return {
      position: currentPosition,
      originalPosition,
      currentPlayer,
      evaluation,
      moveOptions: [],
      depthReached,
      isHeuristic: isHeuristicOverride ?? this.isHeuristic,
      bestMove,
      nodes,
      aborted,
    };
  }

  protected executeWasmSolve(
    mod: SolverModule,
    positionStr: string,
    opts?: AnalyzeOptions,
  ): Int32Array {
    const { threads, maxDepth, timeoutMs, bookPtr } = this.sanitizeOpts(opts);
    const weak = opts?.weak ?? false;

    const isHeuristic = opts?.heuristic ?? this.isHeuristic;

    const allocatedMemory = mod.stringToNewUTF8(positionStr);
    let outputPointer: number;
    if (isHeuristic)
      outputPointer = mod._solveHeuristic(
        this.width,
        this.height,
        this._solverPtr,
        allocatedMemory,
        maxDepth,
        threads,
        timeoutMs,
        bookPtr as number,
      );
    else
      outputPointer = mod._solveExact(
        this.width,
        this.height,
        this._solverPtr,
        allocatedMemory,
        weak,
        threads,
        bookPtr as number,
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

    const isHeuristic = opts?.heuristic ?? this.isHeuristic;

    const allocatedMemory = mod.stringToNewUTF8(positionStr);
    let outputPointer: number;
    if (isHeuristic)
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
        weak,
        threads,
        bookPtr as number,
        timeoutMs,
      );

    const dataLength = 6 + this.width;
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
  ): Promise<PositionAnalysis>;
  abstract solve(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Promise<PositionAnalysis>;
  abstract getNodeCount(): Promise<number>;
  abstract release(): void;
}
