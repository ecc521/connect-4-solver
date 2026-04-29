/** @deprecated Use solver.width instead */
export const BOARD_WIDTH = 7;

export * from "./core";

import {
  BaseConnect4Solver,
  Player,
  Outcome,
  Evaluation,
  PositionAnalysis,
  calculateWDL,
  AnalyzeOptions,
  Connect4SolverOptions,
} from "./core";
import { SolverModule } from "./core";

const STATUS_WIN = 1;
const STATUS_INVALID = 2;
const UNPLAYABLE_COLUMN_SCORE = -1000;
const INT32_SIZE = 4;

let NoSABModule: SolverModule | null = null;
let _noSABInitPromise: Promise<void> | null = null;

let ThreadedModule: SolverModule | null = null;
let _threadedInitPromise: Promise<void> | null = null;

interface NativeModuleType {
  _createSolver(
    w: number,
    h: number,
    cache: unknown,
    heuristic: boolean,
  ): unknown;
  _destroySolver(
    w: number,
    h: number,
    solver: unknown,
    heuristic: boolean,
  ): void;
  _createCache(w: number, h: number, size: number, heuristic: boolean): unknown;
  _destroyCache(cache: unknown): void;
  _analyzeExact(
    w: number,
    h: number,
    solver: unknown,
    pos: string,
    threads: number,
    book: unknown,
  ): Promise<Int32Array>;
  _analyzeHeuristic(
    w: number,
    h: number,
    solver: unknown,
    pos: string,
    threads: number,
    depth: number,
    timeout: number,
  ): Promise<Int32Array>;
  _createBook(w: number, h: number, path: string): unknown;
  _destroyBook(w: number, h: number, book: unknown): void;
  _getNodeCount(
    w: number,
    h: number,
    solver: unknown,
    heuristic: boolean,
  ): number;
  _generatePositions(w: number, h: number, depth: number): string[];
}

let NativeModule: NativeModuleType | null = null;
let nativeModuleAttempted = false;

export function getNativeModule(): NativeModuleType | null {
  if (!nativeModuleAttempted) {
    nativeModuleAttempted = true;
    try {
      if (typeof process !== "undefined" && process?.versions?.node) {
        const req = (typeof module !== "undefined" && module.require
          ? module.require.bind(module)
          : require) as (id: string) => unknown;
        const path = req("path") as { join: (...args: string[]) => string };
        const nodePath = path.join(
          __dirname,
          "..",
          "build",
          "Release",
          "connect4.node",
        );
        NativeModule = req(nodePath) as NativeModuleType;
      }
    } catch {
      // Fail silently
    }
  }
  return NativeModule;
}

export function getNoSABModuleInitPromise(): Promise<void> {
  if (!_noSABInitPromise) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const createModule =
      require("../build/analyze.js") as unknown as () => Promise<SolverModule>;
    /* eslint-enable @typescript-eslint/no-require-imports */
    _noSABInitPromise = createModule().then((mod: SolverModule) => {
      NoSABModule = mod;
    });
  }
  return _noSABInitPromise;
}

export function getThreadedModuleInitPromise(): Promise<void> {
  if (!_threadedInitPromise) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const createModule =
      require("../build/analyze_threaded.js") as unknown as () => Promise<SolverModule>;
    /* eslint-enable @typescript-eslint/no-require-imports */
    _threadedInitPromise = createModule().then((mod: SolverModule) => {
      ThreadedModule = mod;
    });
  }
  return _threadedInitPromise;
}

export function getNoSABModule(): SolverModule {
  if (!NoSABModule)
    throw new Error(
      "Module not initialized. Call getNoSABModuleInitPromise() first.",
    );
  return NoSABModule;
}

export function getThreadedModule(): SolverModule {
  if (!ThreadedModule)
    throw new Error(
      "Module not initialized. Call getThreadedModuleInitPromise() first.",
    );
  return ThreadedModule;
}

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
      if (score > 10000) {
        const realScore = Math.floor(score / 1000);
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
      } else if (score < -10000) {
        const realScore = Math.ceil(score / 1000);
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
      const score = Math.floor((this.width * this.height + 1 - nbMoves) / 2);
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
    return {
      position: currentPosition,
      originalPosition,
      currentPlayer,
      evaluation,
      moveOptions,
      depthReached,
      isHeuristic: this.isHeuristic,
    };
  }

  protected executeWasmAnalyze(
    mod: SolverModule,
    positionStr: string,
    opts?: {
      threads?: number;
      maxDepth?: number;
      timeoutMs?: number;
      book?: { ptr: number };
    },
  ): Int32Array {
    const { threads, maxDepth, timeoutMs, bookPtr } = this.sanitizeOpts(opts);

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
        threads,
        bookPtr,
      );

    const dataLength = (this.isHeuristic ? 3 : 2) + this.width;
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
}

export class NodeConnect4Solver extends AbstractSyncSolver {
  private _analysisQueue: Promise<void> = Promise.resolve();

  async init(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    const native = getNativeModule();
    if (!native) {
      throw new Error(
        "NodeConnect4Solver can only be executed in a Node.js environment where 'connect4.node' successfully compiled.",
      );
    }
    this._cachePtr = native._createCache(
      this.width,
      this.height,
      this.cacheSizeMb * 1024 * 1024,
      this.isHeuristic,
    );
    this._solverPtr = native._createSolver(
      this.width,
      this.height,
      this._cachePtr,
      this.isHeuristic,
    );
    this.initialized = true;
    return Promise.resolve();
  }

  async analyze(
    positionStr: string,
    opts?: {
      threads?: number;
      maxDepth?: number;
      timeoutMs?: number;
      book?: { ptr: number };
    },
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");

    return new Promise<PositionAnalysis>((resolve, reject) => {
      this._analysisQueue = this._analysisQueue
        .catch(() => {
          /* ignore */
        })
        .then(async () => {
          try {
            const native = getNativeModule();
            if (!native) throw new Error("Native module not loaded");
            const { threads, maxDepth, timeoutMs, bookPtr } =
              this.sanitizeOpts(opts);

            let resArr: Int32Array | number[];
            if (this.isHeuristic)
              resArr = await native._analyzeHeuristic(
                this.width,
                this.height,
                this._solverPtr,
                positionStr,
                threads,
                maxDepth,
                timeoutMs,
              );
            else
              resArr = await native._analyzeExact(
                this.width,
                this.height,
                this._solverPtr,
                positionStr,
                threads,
                bookPtr === 0 ? null : bookPtr,
              );

            resolve(this.parseResArr(resArr, positionStr));
          } catch (err: unknown) {
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        });
    });
  }

  getNodeCount(): number {
    if (!this.initialized) return 0;
    const native = getNativeModule();
    if (!native) return 0;
    return native._getNodeCount(
      this.width,
      this.height,
      this._solverPtr,
      this.isHeuristic,
    );
  }

  release(): void {
    if (!this.initialized) return;
    const native = getNativeModule();
    if (!native) return;
    if (this._solverPtr !== 0)
      native._destroySolver(
        this.width,
        this.height,
        this._solverPtr,
        this.isHeuristic,
      );
    if (this._cachePtr !== 0) native._destroyCache(this._cachePtr);
    this._solverPtr = 0;
    this._cachePtr = 0;
    this.initialized = false;
  }
}

export class SyncWasmConnect4Solver extends AbstractSyncSolver {
  async init(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    await getThreadedModuleInitPromise();
    const mod = getThreadedModule();
    if (!mod) throw new Error("Threaded module not initialized");
    this._cachePtr = mod._createCache(
      this.width,
      this.height,
      this.cacheSizeMb * 1024 * 1024,
      this.isHeuristic,
    );
    this._solverPtr = mod._createSolver(
      this.width,
      this.height,
      this._cachePtr,
      this.isHeuristic,
    );
    this.initialized = true;
    return Promise.resolve();
  }

  analyze(positionStr: string, opts?: AnalyzeOptions): PositionAnalysis {
    if (!this.initialized) throw new Error("Call init() first.");
    const mod = getThreadedModule();
    const resArr = this.executeWasmAnalyze(mod, positionStr, opts);
    return this.parseResArr(resArr, positionStr);
  }

  release(): void {
    if (!this.initialized) return;
    const mod = getThreadedModule();
    if (this._solverPtr !== 0)
      mod._destroySolver(
        this.width,
        this.height,
        this._solverPtr,
        this.isHeuristic,
      );
    if (this._cachePtr !== 0) mod._destroyCache(this._cachePtr);
    this._solverPtr = 0;
    this._cachePtr = 0;
    this.initialized = false;
  }

  getNodeCount(): number {
    if (!this.initialized) return 0;
    const mod = getThreadedModule();
    return mod._getNodeCount(
      this.width,
      this.height,
      this._solverPtr,
      this.isHeuristic,
    );
  }
}

export class SyncWasmNoSABConnect4Solver extends AbstractSyncSolver {
  async init(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    await getNoSABModuleInitPromise();
    const mod = getNoSABModule();
    if (!mod) throw new Error("No-SAB module not initialized");
    this._cachePtr = mod._createCache(
      this.width,
      this.height,
      this.cacheSizeMb * 1024 * 1024,
      this.isHeuristic,
    );
    this._solverPtr = mod._createSolver(
      this.width,
      this.height,
      this._cachePtr,
      this.isHeuristic,
    );
    this.initialized = true;
    return Promise.resolve();
  }

  analyze(positionStr: string, opts?: AnalyzeOptions): PositionAnalysis {
    if (!this.initialized) throw new Error("Call init() first.");
    const mod = getNoSABModule();
    // Force 1 thread since it's NoSAB
    const finalOpts = { ...opts, threads: 1 };
    const resArr = this.executeWasmAnalyze(mod, positionStr, finalOpts);
    return this.parseResArr(resArr, positionStr);
  }

  release(): void {
    if (!this.initialized) return;
    const mod = getNoSABModule();
    if (this._solverPtr !== 0)
      mod._destroySolver(
        this.width,
        this.height,
        this._solverPtr,
        this.isHeuristic,
      );
    if (this._cachePtr !== 0) mod._destroyCache(this._cachePtr);
    this._solverPtr = 0;
    this._cachePtr = 0;
    this.initialized = false;
  }

  getNodeCount(): number {
    if (!this.initialized) return 0;
    const mod = getNoSABModule();
    return mod._getNodeCount(
      this.width,
      this.height,
      this._solverPtr,
      this.isHeuristic,
    );
  }
}

export * from "./book";
