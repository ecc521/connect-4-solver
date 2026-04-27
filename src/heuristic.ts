import { Connect4Solver } from "./index";
import { ThreadedConnect4Solver } from "./threaded";
import {
  Player,
  Outcome,
  Evaluation,
  PositionAnalysis,
  SolverModule,
} from "./core";

interface HeuristicSolverModule extends SolverModule {
  _analyzeHeuristicPosition6x5(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
  _analyzeHeuristicPosition6x6(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
  _analyzeHeuristicPosition7x6(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
  _analyzeHeuristicPosition7x7(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
  _analyzeHeuristicPosition8x6(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
  _analyzeHeuristicPosition9x7(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
  _analyzeHeuristicPosition8x8(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
  _analyzeHeuristicPosition10x7(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
  _analyzeHeuristicPosition9x6(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
  _analyzeHeuristicPosition11x4(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
  _analyzeHeuristicPosition9x9(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
  _analyzeHeuristicPosition10x10(pointer: number, max_depth: number, threads: number, timeout_ms: number): number;
}

const STATUS_WIN = 1;
const STATUS_INVALID = 2;
const UNPLAYABLE_COLUMN_SCORE = -1000000;
const INT32_SIZE = 4;

export class HeuristicConnect4Solver extends Connect4Solver {
  protected createEvaluation(score: number, nbMoves: number): Evaluation {
    const isPlayer1Turn = nbMoves % 2 === 0;
    const currentPlayer = isPlayer1Turn ? Player.P1 : Player.P2;
    const opponent = isPlayer1Turn ? Player.P2 : Player.P1;

    const movesRemaining = this.width * this.height - nbMoves;
    const halfMovesRemaining = Math.ceil(movesRemaining / 2);

    if (score > 10000) {
      const realScore = Math.floor(score / 1000);
      return {
        outcome: Outcome.Win,
        winner: currentPlayer,
        movesToEnd: halfMovesRemaining - realScore + 1,
        score: realScore,
      };
    } else if (score < -10000) {
      const realScore = Math.ceil(score / 1000);
      return {
        outcome: Outcome.Loss,
        winner: opponent,
        movesToEnd: halfMovesRemaining + realScore + 1,
        score: realScore,
      };
    } else {
      // Heuristic evaluations act as Draw variants with directional scores.
      // Score represents positional advantage (-10.0 to +10.0 typically)
      return {
        outcome: Outcome.Draw,
        winner: score > 0 ? currentPlayer : score < 0 ? opponent : null,
        movesToEnd: null,
        score: score / 100.0, 
      };
    }
  }

  protected rawAnalyzeHeuristic(
    positionStr: string,
    maxDepth: number,
    threads = 1,
    timeoutMs = 0,
  ): Int32Array {
    const mod = this.mod as unknown as HeuristicSolverModule;
    const allocatedMemory = this.allocateString(positionStr);

    let outputPointer = 0;
    if (this.width === 6 && this.height === 5)
      outputPointer = mod._analyzeHeuristicPosition6x5(allocatedMemory, maxDepth, threads, timeoutMs);
    else if (this.width === 6 && this.height === 6)
      outputPointer = mod._analyzeHeuristicPosition6x6(allocatedMemory, maxDepth, threads, timeoutMs);
    else if (this.width === 7 && this.height === 6)
      outputPointer = mod._analyzeHeuristicPosition7x6(allocatedMemory, maxDepth, threads, timeoutMs);
    else if (this.width === 7 && this.height === 7)
      outputPointer = mod._analyzeHeuristicPosition7x7(allocatedMemory, maxDepth, threads, timeoutMs);
    else if (this.width === 8 && this.height === 6)
      outputPointer = mod._analyzeHeuristicPosition8x6(allocatedMemory, maxDepth, threads, timeoutMs);
    else if (this.width === 9 && this.height === 7)
      outputPointer = mod._analyzeHeuristicPosition9x7(allocatedMemory, maxDepth, threads, timeoutMs);
    else if (this.width === 8 && this.height === 8)
      outputPointer = mod._analyzeHeuristicPosition8x8(allocatedMemory, maxDepth, threads, timeoutMs);
    else if (this.width === 10 && this.height === 7)
      outputPointer = mod._analyzeHeuristicPosition10x7(allocatedMemory, maxDepth, threads, timeoutMs);
    else if (this.width === 9 && this.height === 9)
      outputPointer = mod._analyzeHeuristicPosition9x9(allocatedMemory, maxDepth, threads, timeoutMs);
    else if (this.width === 9 && this.height === 6)
      outputPointer = mod._analyzeHeuristicPosition9x6(allocatedMemory, maxDepth, threads, timeoutMs);
    else if (this.width === 11 && this.height === 4)
      outputPointer = mod._analyzeHeuristicPosition11x4(allocatedMemory, maxDepth, threads, timeoutMs);
    else if (this.width === 10 && this.height === 10)
      outputPointer = mod._analyzeHeuristicPosition10x10(allocatedMemory, maxDepth, threads, timeoutMs);

    const dataLength = 3 + this.width;
    const finalData = new Int32Array(dataLength);
    for (let i = 0; i < dataLength; i++) {
      finalData[i] = mod.getValue(outputPointer + i * INT32_SIZE, "i32");
    }

    mod._free(allocatedMemory);
    mod._free(outputPointer);

    return finalData;
  }

  analyze(
    positionStr: string,
    opts?: { threads?: number; maxDepth?: number; timeoutMs?: number },
  ): PositionAnalysis {
    const depth = opts?.maxDepth ?? 20;
    const threads = opts?.threads ?? 1;
    const timeoutMs = opts?.timeoutMs ?? 25;
    const resArr = this.rawAnalyzeHeuristic(positionStr, depth, threads, timeoutMs);

    const originalPosition = positionStr;
    const status = resArr[0];
    const nbMoves = resArr[1];

    let currentPosition = positionStr;
    const currentPlayer = this.getPlayerAt(nbMoves);
    let evaluation: Evaluation | null = null;
    const moveOptions: (Evaluation | null)[] = [];

    if (status === STATUS_INVALID) {
      currentPosition = positionStr.slice(0, nbMoves);
    } else if (status === STATUS_WIN) {
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
        const n = resArr[2 + i];
        if (n === UNPLAYABLE_COLUMN_SCORE) {
          moveOptions.push(null);
        } else {
          moveOptions.push(this.createEvaluation(n, nbMoves));
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
          } else if (bestEval.outcome === Outcome.Draw) {
            // Maximize heuristic fractional score
            if (ev.score > bestEval.score) bestEval = ev;
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

    const depthReached = resArr[2 + this.width];

    return {
      position: currentPosition,
      originalPosition,
      currentPlayer,
      evaluation,
      moveOptions,
      depthReached,
    };
  }

  async analyzeAsync(
    positionStr: string,
    opts?: { threads?: number; maxDepth?: number; timeoutMs?: number },
  ): Promise<PositionAnalysis> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.analyze(positionStr, opts)), 0);
    });
  }
}

export class ThreadedHeuristicConnect4Solver extends ThreadedConnect4Solver {
  protected createEvaluation(score: number, nbMoves: number): Evaluation {
    return HeuristicConnect4Solver.prototype["createEvaluation"].call(this, score, nbMoves);
  }

  protected rawAnalyzeHeuristic(positionStr: string, maxDepth: number, threads = 1, timeoutMs = 0): Int32Array {
    return HeuristicConnect4Solver.prototype["rawAnalyzeHeuristic"].call(this, positionStr, maxDepth, threads, timeoutMs);
  }

  analyze(positionStr: string, opts?: { threads?: number; maxDepth?: number; timeoutMs?: number }): PositionAnalysis {
    return HeuristicConnect4Solver.prototype.analyze.call(this, positionStr, opts);
  }

  async analyzeAsync(positionStr: string, opts?: { threads?: number; maxDepth?: number; timeoutMs?: number }): Promise<PositionAnalysis> {
    return HeuristicConnect4Solver.prototype.analyzeAsync.call(this, positionStr, opts);
  }
}
