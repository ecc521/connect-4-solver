const BOARD_WIDTH = 7;

export interface PositionAnalysis {
  position: string;
  originalPosition: string;
  evaluation: string;
  moveOptions: (string | null)[]; // Index maps to column 0-6
}

const STATUS_VALID = 0;
const STATUS_WIN = 1;
const STATUS_INVALID = 2;
const UNPLAYABLE_COLUMN_SCORE = -1000;
const RESULT_ARRAY_SIZE = 9;
const INT32_SIZE = 4;

export interface SolverModule {
  allocateUTF8(str: string): number;
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

    const allocatedMemory = mod.allocateUTF8(bookFilePath);
    mod._loadBook(allocatedMemory);

    mod._free(allocatedMemory);

    this.bookLoaded = true;
  }

  private allocateString(str: string): number {
    return this.mod.allocateUTF8(str);
  }

  private rawAnalyze(positionStr: string): Int32Array {
    const mod = this.mod as any;
    const allocatedMemory = this.allocateString(positionStr);
    const outputPointer = mod._analyzePosition(allocatedMemory);
    
    // Read the 9 returned Int32 values using getValue
    const finalData = new Int32Array(RESULT_ARRAY_SIZE);
    for (let i = 0; i < RESULT_ARRAY_SIZE; i++) {
        finalData[i] = mod.getValue(outputPointer + (i * INT32_SIZE), "i32");
    }

    mod._free(allocatedMemory);
    mod._free(outputPointer); // analyze.cpp returns a malloc'd array
    
    return finalData;
  }

  analyze(positionStr: string): PositionAnalysis {
    const resArr = this.rawAnalyze(positionStr);
    
    const originalPosition = positionStr;
    let currentPosition = positionStr;
    let evaluation = "D";
    let moveOptions: (string | null)[] = [];

    const status = resArr[0] as number;
    const nbMoves = resArr[1] as number;

    if (status === STATUS_INVALID) {
      currentPosition = positionStr.slice(0, nbMoves);
      evaluation = "Invalid";
    } else if (status === STATUS_WIN) {
      currentPosition = positionStr.slice(0, nbMoves + 1);
      const winner = currentPosition.length % 2 === 1 ? "Y" : "R";
      evaluation = winner;
    } else {
      const isYellowNext = positionStr.length % 2 === 0;
      const movesRemaining = 42 - positionStr.length;
      const halfMovesRemaining = Math.ceil(movesRemaining / 2);

      const moveEvaluations = [];
      for (let i = 0; i < BOARD_WIDTH; i++) {
        const n = resArr[2 + i] as number;
        let evalStr: string | null = null;
        if (n === UNPLAYABLE_COLUMN_SCORE) evalStr = null;
        else if (n === 0) evalStr = "D";
        else if (n > 0) evalStr = (isYellowNext ? "Y" : "R") + "+" + (halfMovesRemaining - n + 1);
        else if (n < 0) evalStr = (isYellowNext ? "R" : "Y") + "-" + (halfMovesRemaining + n + 1);

        moveEvaluations.push(evalStr);
        moveOptions.push(evalStr);
      }

      let bestScore = -Infinity;
      let bestEvalStr = "D";

      const score = (ev: string | null): number => {
        if (ev === null) return -2000;
        if (ev === "D") return 0;
        const winner = ev.split(/[+-]/)[0]; // "Y" or "R"
        const sign = ev.includes('+') ? '+' : '-';
        const moves = parseInt(ev.split(/[+-]/)[1]!, 10);
        const value = 100 - moves; // Faster wins are better
        
        const amIYellow = isYellowNext;
        const iWin = (amIYellow && winner === "Y") || (!amIYellow && winner === "R");
        
        return iWin ? value : -value;
      };

      for (const ev of moveEvaluations) {
        if (ev === null) continue;
        const s = score(ev);
        if (s > bestScore) {
          bestScore = s;
          bestEvalStr = ev;
        }
      }
      evaluation = bestEvalStr;
    }

    return {
      position: currentPosition,
      originalPosition,
      evaluation,
      moveOptions
    };
  }
}
