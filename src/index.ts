/** @deprecated Use solver.width instead */
export const BOARD_WIDTH = 7;

export * from "./core";
import {
  Player,
  Outcome,
  Evaluation,
  PositionAnalysis,
  SolverModule,
} from "./core";

const STATUS_WIN = 1;
const STATUS_INVALID = 2;
const UNPLAYABLE_COLUMN_SCORE = -1000;
const INT32_SIZE = 4;

/* eslint-disable @typescript-eslint/no-require-imports */
const createModule =
  require("../build/analyze.js") as unknown as () => Promise<SolverModule>;
/* eslint-enable @typescript-eslint/no-require-imports */

let Module: SolverModule | null = null;
const _moduleInitPromise = createModule().then((mod: SolverModule) => {
  Module = mod;
});

export class Connect4Solver {
  protected initialized = false;
  private bookLoaded = false;
  public width: number;
  public height: number;

  constructor(width = 7, height = 6) {
    const validSizes = ["6x5", "6x6", "7x6", "7x7", "8x6", "9x7"];
    if (!validSizes.includes(`${width}x${height}`)) {
      throw new Error(
        `Board size ${width}x${height} is not supported by the generated WASM bundle. Supported sizes are 6x5, 6x6, 7x6, 7x7, 8x6, 9x7.`,
      );
    }
    this.width = width;
    this.height = height;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await _moduleInitPromise;
    this.initialized = true;
  }

  protected get mod(): SolverModule {
    if (!this.initialized) {
      throw new Error("Solver not initialized. Call init() first.");
    }
    return Module as unknown as SolverModule;
  }

  async loadBook(data: Uint8Array): Promise<void> {
    if (!this.initialized) await this.init();
    const mod = this.mod;

    const bookFilePath = `book_${this.width}x${this.height}.book`;
    mod.FS.writeFile(bookFilePath, data);

    const allocatedMemory = mod.stringToNewUTF8(bookFilePath);

    if (this.width === 6 && this.height === 5)
      mod._loadBook6x5(allocatedMemory);
    else if (this.width === 6 && this.height === 6)
      mod._loadBook6x6(allocatedMemory);
    else if (this.width === 7 && this.height === 6)
      mod._loadBook7x6(allocatedMemory);
    else if (this.width === 7 && this.height === 7)
      mod._loadBook7x7(allocatedMemory);
    else if (this.width === 8 && this.height === 6)
      mod._loadBook8x6(allocatedMemory);
    else if (this.width === 9 && this.height === 7)
      mod._loadBook9x7(allocatedMemory);

    mod._free(allocatedMemory);
    this.bookLoaded = true;
  }

  private allocateString(str: string): number {
    return this.mod.stringToNewUTF8(str);
  }

  private rawAnalyze(positionStr: string, threads = 1): Int32Array {
    const mod = this.mod;
    const allocatedMemory = this.allocateString(positionStr);

    let outputPointer = 0;
    if (this.width === 6 && this.height === 5)
      outputPointer = mod._analyzePosition6x5(allocatedMemory, threads);
    else if (this.width === 6 && this.height === 6)
      outputPointer = mod._analyzePosition6x6(allocatedMemory, threads);
    else if (this.width === 7 && this.height === 6)
      outputPointer = mod._analyzePosition7x6(allocatedMemory, threads);
    else if (this.width === 7 && this.height === 7)
      outputPointer = mod._analyzePosition7x7(allocatedMemory, threads);
    else if (this.width === 8 && this.height === 6)
      outputPointer = mod._analyzePosition8x6(allocatedMemory, threads);
    else if (this.width === 9 && this.height === 7)
      outputPointer = mod._analyzePosition9x7(allocatedMemory, threads);

    const dataLength = 2 + this.width;
    const finalData = new Int32Array(dataLength);
    for (let i = 0; i < dataLength; i++) {
      finalData[i] = mod.getValue(outputPointer + i * INT32_SIZE, "i32");
    }

    mod._free(allocatedMemory);
    mod._free(outputPointer);

    return finalData;
  }

  private getPlayerAt(nbMoves: number): Player {
    return nbMoves % 2 === 0 ? Player.P1 : Player.P2;
  }

  private createEvaluation(score: number, nbMoves: number): Evaluation {
    const isPlayer1Turn = nbMoves % 2 === 0;
    const currentPlayer = isPlayer1Turn ? Player.P1 : Player.P2;
    const opponent = isPlayer1Turn ? Player.P2 : Player.P1;

    const movesRemaining = this.width * this.height - nbMoves;
    const halfMovesRemaining = Math.ceil(movesRemaining / 2);

    if (score === 0) {
      return {
        outcome: Outcome.Draw,
        winner: null,
        movesToEnd: null,
        score: 0,
      };
    } else if (score > 0) {
      return {
        outcome: Outcome.Win,
        winner: currentPlayer,
        movesToEnd: halfMovesRemaining - score + 1,
        score: score,
      };
    } else {
      return {
        outcome: Outcome.Loss,
        winner: opponent,
        movesToEnd: halfMovesRemaining + score + 1,
        score: score,
      };
    }
  }

  analyze(positionStr: string, opts?: { threads?: number }): PositionAnalysis {
    const resArr = this.rawAnalyze(positionStr, opts?.threads ?? 1);

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
      originalPosition,
      currentPlayer,
      evaluation,
      moveOptions,
    };
  }

  async analyzeAsync(
    positionStr: string,
    opts?: { threads?: number },
  ): Promise<PositionAnalysis> {
    return new Promise((resolve) => {
      // In the future this could be completely detached to an explicit WebWorker pool
      // For now, securely defers evaluation slightly to avoid blocking identical event loop ticks
      setTimeout(() => {
        resolve(this.analyze(positionStr, opts));
      }, 0);
    });
  }
}
