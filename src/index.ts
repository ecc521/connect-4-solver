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

let NoSABModule: SolverModule | null = null;
let _noSABInitPromise: Promise<void> | null = null;

let ThreadedModule: SolverModule | null = null;
let _threadedInitPromise: Promise<void> | null = null;

let NativeModule: any = null;
let nativeModuleAttempted = false;

export function getNativeModule() {
  if (!nativeModuleAttempted) {
    nativeModuleAttempted = true;
    try {
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const req = typeof module !== 'undefined' && module.require ? module.require : require;
        const path = req("path");
        const nodePath = path.join(__dirname, "..", "build", "Release", "connect4.node");
        NativeModule = req(nodePath);
      }
    } catch (e) {
      // Fail silently
    }
  }
  return NativeModule;
}

export function getNoSABModuleInitPromise() {
  if (!_noSABInitPromise) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const createModule = require("../build/analyze.js") as unknown as () => Promise<SolverModule>;
    /* eslint-enable @typescript-eslint/no-require-imports */
    _noSABInitPromise = createModule().then((mod: SolverModule) => {
      NoSABModule = mod;
    });
  }
  return _noSABInitPromise;
}

export function getThreadedModuleInitPromise() {
  if (!_threadedInitPromise) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const createModule = require("../build/analyze_threaded.js") as unknown as () => Promise<SolverModule>;
    /* eslint-enable @typescript-eslint/no-require-imports */
    _threadedInitPromise = createModule().then((mod: SolverModule) => {
      ThreadedModule = mod;
    });
  }
  return _threadedInitPromise;
}

export function getNoSABModule(): SolverModule {
  if (!NoSABModule) throw new Error("Module not initialized. Call getNoSABModuleInitPromise() first.");
  return NoSABModule;
}

export function getThreadedModule(): SolverModule {
  if (!ThreadedModule) throw new Error("Module not initialized. Call getThreadedModuleInitPromise() first.");
  return ThreadedModule;
}

export interface Connect4SolverOptions {
  width?: number;
  height?: number;
  cacheSizeMb?: number;
  heuristic?: boolean;
}

export abstract class AbstractSyncSolver extends BaseConnect4Solver {
  protected isHeuristic: boolean;
  protected cacheSizeMb: number;

  protected _solverPtr: any = 0;
  protected _cachePtr: any = 0;

  constructor(opts?: Connect4SolverOptions | number, heightOpt?: number) {
    super(opts as any, heightOpt);
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
        return { outcome: Outcome.Win, winner: currentPlayer, movesToEnd: halfMovesRemaining - realScore + 1, score: realScore };
      } else if (score < -10000) {
        const realScore = Math.ceil(score / 1000);
        return { outcome: Outcome.Loss, winner: opponent, movesToEnd: halfMovesRemaining + realScore + 1, score: realScore };
      } else {
        return { outcome: Outcome.Draw, winner: score > 0 ? currentPlayer : score < 0 ? opponent : null, movesToEnd: null, score: score / 100.0 };
      }
    }

    if (score === 0) {
      return { outcome: Outcome.Draw, winner: null, movesToEnd: null, score: 0 };
    } else if (score > 0) {
      return { outcome: Outcome.Win, winner: currentPlayer, movesToEnd: halfMovesRemaining - score + 1, score: score };
    } else {
      return { outcome: Outcome.Loss, winner: opponent, movesToEnd: halfMovesRemaining + score + 1, score: score };
    }
  }

  protected parseResArr(resArr: Int32Array | number[], positionStr: string): PositionAnalysis {
    const originalPosition = positionStr;
    const status = resArr[0];
    const nbMoves = resArr[1];
    let currentPosition = positionStr;
    const currentPlayer = this.getPlayerAt(nbMoves);
    let evaluation: Evaluation | null = null;
    const moveOptions: (Evaluation | null)[] = [];

    const unplayableScore = this.isHeuristic ? -1000000 : UNPLAYABLE_COLUMN_SCORE;

    if (status === STATUS_INVALID) {
      currentPosition = positionStr.slice(0, nbMoves);
    } else if (status === STATUS_WIN) {
      currentPosition = positionStr.slice(0, nbMoves + 1);
      const winner = nbMoves % 2 === 0 ? Player.P1 : Player.P2;
      evaluation = { outcome: Outcome.Win, winner: winner, movesToEnd: 0, score: Math.floor((this.width * this.height + 1 - nbMoves) / 2) };
    } else {
      for (let i = 0; i < this.width; i++) {
        const n = resArr[2 + i];
        if (n === unplayableScore) moveOptions.push(null);
        else moveOptions.push(this.createEvaluation(n, nbMoves));
      }

      let bestEval: Evaluation | null = null;
      for (const ev of moveOptions) {
        if (!ev) continue;
        if (!bestEval) { bestEval = ev; continue; }
        if (ev.outcome === Outcome.Win) {
          if (bestEval.outcome !== Outcome.Win || (ev.movesToEnd !== null && bestEval.movesToEnd !== null && ev.movesToEnd < bestEval.movesToEnd)) bestEval = ev;
        } else if (ev.outcome === Outcome.Draw) {
          if (bestEval.outcome === Outcome.Loss) bestEval = ev;
          else if (this.isHeuristic && bestEval.outcome === Outcome.Draw && ev.score > bestEval.score) bestEval = ev;
        } else if (ev.outcome === Outcome.Loss) {
          if (bestEval.outcome === Outcome.Loss && ev.movesToEnd !== null && bestEval.movesToEnd !== null && ev.movesToEnd > bestEval.movesToEnd) bestEval = ev;
        }
      }
      evaluation = bestEval;
    }

    const depthReached = this.isHeuristic ? resArr[2 + this.width] : undefined;
    return { position: currentPosition, originalPosition, currentPlayer, evaluation, moveOptions, depthReached };
  }

  // Not strictly used by child classes unless they are WASM based
  protected executeWasmAnalyze(mod: SolverModule, positionStr: string, opts?: { threads?: number, maxDepth?: number, timeoutMs?: number, book?: any }): Int32Array {
    const threads = opts?.threads ?? 1;
    const maxDepth = opts?.maxDepth ?? 20;
    const timeoutMs = opts?.timeoutMs ?? 25;
    const bookPtr = opts?.book ? opts.book.ptr : 0;

    const allocatedMemory = mod.stringToNewUTF8(positionStr);
    let outputPointer = 0;
    if (this.isHeuristic) outputPointer = mod._analyzeHeuristic(this.width, this.height, this._solverPtr, allocatedMemory, threads, maxDepth, timeoutMs);
    else outputPointer = mod._analyzeExact(this.width, this.height, this._solverPtr, allocatedMemory, threads, bookPtr);

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
  abstract analyze(positionStr: string, opts?: any): PositionAnalysis | Promise<PositionAnalysis>;
  abstract release(): void;
  unload(): void {
    this.release();
  }
  async analyzeAsync(positionStr: string, opts?: any): Promise<PositionAnalysis> {
    return this.analyze(positionStr, opts);
  }
}

export class NodeConnect4Solver extends AbstractSyncSolver {
  private _analysisQueue: Promise<void> = Promise.resolve();

  async init(): Promise<void> {
    if (this.initialized) return;
    const native = getNativeModule();
    if (!native) {
      throw new Error("NodeConnect4Solver can only be executed in a Node.js environment where 'connect4.node' successfully compiled.");
    }
    this._cachePtr = native._createCache(this.width, this.height, this.cacheSizeMb * 1024 * 1024, this.isHeuristic);
    this._solverPtr = native._createSolver(this.width, this.height, this._cachePtr, this.isHeuristic);
    this.initialized = true;
  }

  async analyze(positionStr: string, opts?: { threads?: number, maxDepth?: number, timeoutMs?: number, book?: any }): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    
    return new Promise<PositionAnalysis>((resolve, reject) => {
      this._analysisQueue = this._analysisQueue.catch(() => {}).then(async () => {
        try {
          const native = getNativeModule();
          const threads = opts?.threads ?? 1;
          const maxDepth = opts?.maxDepth ?? 20;
          const timeoutMs = opts?.timeoutMs ?? 25;
          const bookPtr = opts?.book ? opts.book.ptr : 0;

          let resArr: number[];
          if (this.isHeuristic) resArr = await native._analyzeHeuristic(this.width, this.height, this._solverPtr, positionStr, threads, maxDepth, timeoutMs);
          else resArr = await native._analyzeExact(this.width, this.height, this._solverPtr, positionStr, threads, bookPtr === 0 ? null : bookPtr);

          resolve(this.parseResArr(resArr, positionStr));
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  release(): void {
    if (!this.initialized) return;
    const native = getNativeModule();
    if (this._solverPtr !== 0) native._destroySolver(this.width, this.height, this._solverPtr, this.isHeuristic);
    if (this._cachePtr !== 0) native._destroyCache(this._cachePtr);
    this._solverPtr = 0;
    this._cachePtr = 0;
    this.initialized = false;
  }
}

export class SyncWasmConnect4Solver extends AbstractSyncSolver {
  async init(): Promise<void> {
    if (this.initialized) return;
    await getThreadedModuleInitPromise();
    const mod = getThreadedModule();
    this._cachePtr = mod._createCache(this.width, this.height, this.cacheSizeMb * 1024 * 1024, this.isHeuristic);
    this._solverPtr = mod._createSolver(this.width, this.height, this._cachePtr, this.isHeuristic);
    this.initialized = true;
  }

  analyze(positionStr: string, opts?: { threads?: number, maxDepth?: number, timeoutMs?: number, book?: any }): PositionAnalysis {
    if (!this.initialized) throw new Error("Call init() first.");
    const mod = getThreadedModule();
    const resArr = this.executeWasmAnalyze(mod, positionStr, opts);
    return this.parseResArr(resArr, positionStr);
  }

  release(): void {
    if (!this.initialized) return;
    const mod = getThreadedModule();
    if (this._solverPtr !== 0) mod._destroySolver(this.width, this.height, this._solverPtr, this.isHeuristic);
    if (this._cachePtr !== 0) mod._destroyCache(this._cachePtr);
    this._solverPtr = 0;
    this._cachePtr = 0;
    this.initialized = false;
  }
}

export class SyncWasmNoSABConnect4Solver extends AbstractSyncSolver {
  async init(): Promise<void> {
    if (this.initialized) return;
    await getNoSABModuleInitPromise();
    const mod = getNoSABModule();
    this._cachePtr = mod._createCache(this.width, this.height, this.cacheSizeMb * 1024 * 1024, this.isHeuristic);
    this._solverPtr = mod._createSolver(this.width, this.height, this._cachePtr, this.isHeuristic);
    this.initialized = true;
  }

  analyze(positionStr: string, opts?: { maxDepth?: number, timeoutMs?: number, book?: any }): PositionAnalysis {
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
    if (this._solverPtr !== 0) mod._destroySolver(this.width, this.height, this._solverPtr, this.isHeuristic);
    if (this._cachePtr !== 0) mod._destroyCache(this._cachePtr);
    this._solverPtr = 0;
    this._cachePtr = 0;
    this.initialized = false;
  }
}

export * from "./book";
