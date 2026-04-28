/** @deprecated Use solver.width instead */
export const BOARD_WIDTH = 7;

export * from "./core";

import {
  Player,
  Outcome,
  Evaluation,
  PositionAnalysis,
  SolverModule,
  BaseConnect4Solver,
} from "./core";

const STATUS_WIN = 1;
const STATUS_INVALID = 2;
const UNPLAYABLE_COLUMN_SCORE = -1000;
const INT32_SIZE = 4;

let Module: SolverModule | null = null;
let _moduleInitPromise: Promise<void> | null = null;

export function getModuleInitPromise() {
  if (!_moduleInitPromise) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const createModule = require("../build/analyze.js") as unknown as () => Promise<SolverModule>;
    /* eslint-enable @typescript-eslint/no-require-imports */
    _moduleInitPromise = createModule().then((mod: SolverModule) => {
      Module = mod;
    });
  }
  return _moduleInitPromise;
}

export function getModule(): SolverModule {
  if (!Module) {
    throw new Error("Module not initialized. Call getModuleInitPromise() first.");
  }
  return Module;
}

export class Connect4Solver extends BaseConnect4Solver {
  private bookLoaded = false;
  protected _instancePtr: number = 0;
  protected _localCachePtr: number = 0;
  protected _cache: import("./cache").SolverCache | null = null;

  constructor(
    widthOrOpts?: number | { width?: number; height?: number; cache?: import("./cache").SolverCache },
    heightOpt?: number
  ) {
    super(widthOrOpts as any, heightOpt);
    
    let cache: import("./cache").SolverCache | undefined;
    if (typeof widthOrOpts === 'object') {
      cache = widthOrOpts.cache;
    }

    if (cache) {
      this._cache = cache;
    }
  }

  protected get isHeuristic(): boolean {
    return false;
  }

  /**
   * Bootstraps the WASM Module and allocates the Transposition Table.
   * Uses getModuleInitPromise() to ensure that even if multiple solver
   * instances are created simultaneously, the WASM bridge only loads once
   * preventing race conditions.
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    await getModuleInitPromise();
    this.initialized = true;
    if (this._instancePtr === 0) {
      if (this._cache && this._cache.ptr === 0) {
        throw new Error("Provided cache is not initialized. Call cache.init() first.");
      }
      const cachePtr = this._cache ? this._cache.ptr : (this._localCachePtr = this.mod._createCache(this.width, this.height, 1024 * 1024 * 64, false));
      this._instancePtr = this.mod._createSolver(this.width, this.height, cachePtr, false);
    }
  }

  protected get mod(): SolverModule {
    if (!this.initialized) {
      throw new Error("Solver not initialized. Call init() first.");
    }
    return Module as unknown as SolverModule;
  }



  protected allocateString(str: string): number {
    return this.mod.stringToNewUTF8(str);
  }

  protected rawAnalyze(positionStr: string, threads = 1, bookPtr = 0): Int32Array {
    const mod = this.mod;
    const allocatedMemory = this.allocateString(positionStr);

    let outputPointer = mod._analyzeExact(this.width, this.height, this._instancePtr, allocatedMemory, threads, bookPtr);

    const dataLength = 2 + this.width;
    const finalData = new Int32Array(dataLength);
    for (let i = 0; i < dataLength; i++) {
      finalData[i] = mod.getValue(outputPointer + i * INT32_SIZE, "i32");
    }

    mod._free(allocatedMemory);
    mod._free(outputPointer);

    return finalData;
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

  analyze(positionStr: string, opts?: { threads?: number, book?: import("./book").OpeningBook }): PositionAnalysis {
    const resArr = this.rawAnalyze(positionStr, opts?.threads ?? 1, opts?.book ? opts.book.ptr : 0);

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

  /**
   * Destroys the explicitly allocated WASM pointer instances (including the implicit cache, if applicable).
   * 
   * **Note:** This does NOT destroy a shared cache if one was explicitly passed to the constructor.
   * You must manually call `sharedCache.destroy()` on your shared cache instance when your app terminates.
   * 
   * IMPORTANT: WebAssembly does not support automated Garbage Collection
   * for native pointers. You must call this function when the solver is 
   * no longer needed to prevent memory leaks in your web/Node application.
   */
  unload(): void {
    if (!this.initialized) return;
    const mod = this.mod;
    if (this._instancePtr !== 0) {
      mod._destroySolver(this.width, this.height, this._instancePtr, this.isHeuristic);
      this._instancePtr = 0;
    }
    if (this._localCachePtr !== 0) {
      mod._destroyCache(this._localCachePtr);
      this._localCachePtr = 0;
    }
  }
}

export * from "./cache";
export * from "./threaded";
export * from "./heuristic";
export * from "./book";
