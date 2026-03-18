export const BOARD_WIDTH = 7;

export enum Player {
  P1 = "P1", // Moves first
  P2 = "P2", // Moves second
}

export enum Outcome {
  Win = "Win",
  Loss = "Loss",
  Draw = "Draw",
}

export interface Evaluation {
  outcome: Outcome;
  winner: Player | null; // null when Draw
  movesToEnd: number | null; // null when Draw
  score: number; // raw score
}

export interface PositionAnalysis {
  position: string;
  originalPosition: string;
  currentPlayer: Player;
  evaluation: Evaluation | null;
  moveOptions: (Evaluation | null)[]; // Index maps to column 0-6
}

const STATUS_VALID = 0;
const STATUS_WIN = 1;
const STATUS_INVALID = 2;
const UNPLAYABLE_COLUMN_SCORE = -1000;
const RESULT_ARRAY_SIZE = 9;
const INT32_SIZE = 4;

export interface SolverModule {
  stringToNewUTF8(str: string): number;
  _analyzePosition(pointer: number): number;
  _loadBook(pointer: number): void;
  UTF8ToString(pointer: number): string;
  _free(pointer: number): void;
  onRuntimeInitialized?: () => void;
  FS: {
    writeFile(path: string, data: Uint8Array): void;
  };
  getValue(ptr: number, type: string): number;
}

const Module = require("../build/analyze.js");

let concludeInitialize: (() => void) | null = null;
let _moduleInitPromise = new Promise<void>((resolve) => {
  concludeInitialize = resolve;
});

(Module as any).onRuntimeInitialized = function () {
  if (concludeInitialize) concludeInitialize();
};

export class Connect4Solver {
  private initialized = false;
  private bookLoaded = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    // Fallback just in case it's already initialized
    if ((Module as any).calledRun || (Module as any)._analyzePosition) {
      this.initialized = true;
      return;
    }

    await _moduleInitPromise;
    this.initialized = true;
  }

  private get mod(): SolverModule {
    if (!this.initialized) {
      throw new Error("Solver not initialized. Call init() first.");
    }
    return Module as unknown as SolverModule;
  }

  async loadBook(data: Uint8Array): Promise<void> {
    if (!this.initialized) await this.init();
    const mod = this.mod;

    const bookFilePath = "book.book";
    mod.FS.writeFile(bookFilePath, data);

    const allocatedMemory = mod.stringToNewUTF8(bookFilePath);
    mod._loadBook(allocatedMemory);

    mod._free(allocatedMemory);

    this.bookLoaded = true;
  }

  private allocateString(str: string): number {
    return this.mod.stringToNewUTF8(str);
  }

  private rawAnalyze(positionStr: string): Int32Array {
    const mod = this.mod as any;
    const allocatedMemory = this.allocateString(positionStr);
    const outputPointer = mod._analyzePosition(allocatedMemory);

    // Read the 9 returned Int32 values using getValue
    const finalData = new Int32Array(RESULT_ARRAY_SIZE);
    for (let i = 0; i < RESULT_ARRAY_SIZE; i++) {
      finalData[i] = mod.getValue(outputPointer + i * INT32_SIZE, "i32");
    }

    mod._free(allocatedMemory);
    mod._free(outputPointer); // analyze.cpp returns a malloc'd array

    return finalData;
  }

  private getPlayerAt(nbMoves: number): Player {
    return nbMoves % 2 === 0 ? Player.P1 : Player.P2;
  }

  private createEvaluation(score: number, nbMoves: number): Evaluation {
    const isPlayer1Turn = nbMoves % 2 === 0;
    const currentPlayer = isPlayer1Turn ? Player.P1 : Player.P2;
    const opponent = isPlayer1Turn ? Player.P2 : Player.P1;

    const movesRemaining = 42 - nbMoves;
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

  analyze(positionStr: string): PositionAnalysis {
    const resArr = this.rawAnalyze(positionStr);

    const originalPosition = positionStr;
    const status = resArr[0] as number;
    const nbMoves = resArr[1] as number;

    let currentPosition = positionStr;
    const currentPlayer = this.getPlayerAt(nbMoves);
    let evaluation: Evaluation | null = null;
    let moveOptions: (Evaluation | null)[] = [];

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
        score: 22, // Logical max score for a direct win is actually 21-22 depending on how we count
      };
    } else {
      // Valid mid-game position
      evaluation = null; // We'll compute it from moveOptions

      for (let i = 0; i < BOARD_WIDTH; i++) {
        const n = resArr[2 + i] as number;
        if (n === UNPLAYABLE_COLUMN_SCORE) {
          moveOptions.push(null);
        } else {
          moveOptions.push(this.createEvaluation(n, nbMoves));
        }
      }

      // Best evaluation for the current player
      let bestEval: Evaluation | null = null;

      for (const ev of moveOptions) {
        if (!ev) continue;
        if (!bestEval) {
          bestEval = ev;
          continue;
        }

        // Win is better than Draw is better than Loss
        if (ev.outcome === Outcome.Win) {
          if (
            bestEval.outcome !== Outcome.Win ||
            ev.movesToEnd! < bestEval.movesToEnd!
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
            ev.movesToEnd! > bestEval.movesToEnd!
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
}
