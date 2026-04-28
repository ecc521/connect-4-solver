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
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        console.error(e);
        console.warn("Connect 4 Solver: Native addon 'connect4.node' not found. Falling back to WASM build.");
      }
    }
  }
  return NativeModule;
}

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

export interface Connect4SolverOptions {
  width?: number;
  height?: number;
  cacheSizeMb?: number;
  heuristic?: boolean;
}

export function getModule(): SolverModule {
  if (!Module) {
    throw new Error("Module not initialized. Call getModuleInitPromise() first.");
  }
  return Module;
}

export class Connect4Solver {
  public width: number;
  public height: number;
  protected isHeuristic: boolean;
  protected cacheSizeMb: number;
  protected initialized = false;

  protected _solverPtr: any = 0;
  protected _cachePtr: any = 0;
  private bookLoaded = false;

  constructor(opts?: Connect4SolverOptions | number, heightOpt?: number) {
    let width = 7;
    let height = 6;
    let cacheSizeMb = 128;
    let heuristic = false;

    if (typeof opts === "number") {
      width = opts;
      if (heightOpt !== undefined) height = heightOpt;
    } else if (opts && typeof opts === "object") {
      if (opts.width !== undefined) width = opts.width;
      if (opts.height !== undefined) height = opts.height;
      if (opts.cacheSizeMb !== undefined) cacheSizeMb = opts.cacheSizeMb;
      if (opts.heuristic !== undefined) heuristic = opts.heuristic;
    }

    const validSizes = ["6x5", "6x6", "7x6", "7x7", "8x6", "9x7", "8x8", "9x6", "11x4"];
    if (!validSizes.includes(`${width}x${height}`)) {
      throw new Error(`Board size ${width}x${height} is not supported.`);
    }

    this.width = width;
    this.height = height;
    this.cacheSizeMb = cacheSizeMb;
    this.isHeuristic = heuristic;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    // React Native Bridge
    const rnModule = typeof global !== 'undefined' && (global as any).nativeConnect4Solver;
    if (rnModule) {
      this._cachePtr = rnModule.createCache(this.width, this.height, this.cacheSizeMb * 1024 * 1024, this.isHeuristic);
      this._solverPtr = rnModule.createSolver(this.width, this.height, this._cachePtr, this.isHeuristic);
      this.initialized = true;
      return;
    }

    // Node.js N-API Native
    const native = getNativeModule();
    if (native) {
      this._cachePtr = native._createCache(this.width, this.height, this.cacheSizeMb * 1024 * 1024, this.isHeuristic);
      this._solverPtr = native._createSolver(this.width, this.height, this._cachePtr, this.isHeuristic);
      this.initialized = true;
      return;
    }

    // WASM Fallback
    await getModuleInitPromise();
    const mod = getModule();
    this._cachePtr = mod._createCache(this.width, this.height, this.cacheSizeMb * 1024 * 1024, this.isHeuristic);
    this._solverPtr = mod._createSolver(this.width, this.height, this._cachePtr, this.isHeuristic);
    this.initialized = true;
  }

  protected allocateString(str: string): number {
    return getModule().stringToNewUTF8(str);
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

  async analyze(positionStr: string, opts?: { threads?: number, maxDepth?: number, timeoutMs?: number, book?: any }): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    const threads = opts?.threads ?? 1;
    const maxDepth = opts?.maxDepth ?? 20;
    const timeoutMs = opts?.timeoutMs ?? 25;
    const bookPtr = opts?.book ? opts.book.ptr : 0;

    let resArr: Int32Array | number[];

    const rnModule = typeof global !== 'undefined' && (global as any).nativeConnect4Solver;
    if (rnModule) {
      if (this.isHeuristic) resArr = await rnModule.analyzeHeuristic(this._solverPtr, positionStr, maxDepth, threads, timeoutMs, this.width, this.height);
      else resArr = await rnModule.analyze(this._solverPtr, positionStr, threads, this.width, this.height, false);
    } else {
      const native = getNativeModule();
      if (native) {
        if (this.isHeuristic) resArr = await native._analyzeHeuristic(this.width, this.height, this._solverPtr, positionStr, threads, maxDepth, timeoutMs);
        else resArr = await native._analyzeExact(this.width, this.height, this._solverPtr, positionStr, threads, bookPtr === 0 ? null : bookPtr);
      } else {
        // WASM Fallback Sync
        const mod = getModule();
        const allocatedMemory = this.allocateString(positionStr);
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
        resArr = finalData;
      }
    }

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

  release(): void {
    if (!this.initialized) return;
    
    const rnModule = typeof global !== 'undefined' && (global as any).nativeConnect4Solver;
    if (rnModule) {
      if (this._solverPtr !== 0) rnModule.destroySolver(this._solverPtr, this.width, this.height, this.isHeuristic);
      if (this._cachePtr !== 0) rnModule.destroyCache(this._cachePtr);
    } else {
      const native = getNativeModule();
      if (native) {
        if (this._solverPtr !== 0) native._destroySolver(this.width, this.height, this._solverPtr, this.isHeuristic);
        if (this._cachePtr !== 0) native._destroyCache(this._cachePtr);
      } else {
        const mod = getModule();
        if (this._solverPtr !== 0) mod._destroySolver(this.width, this.height, this._solverPtr, this.isHeuristic);
        if (this._cachePtr !== 0) mod._destroyCache(this._cachePtr);
      }
    }
    
    this._solverPtr = 0;
    this._cachePtr = 0;
    this.initialized = false;
  }
}

export * from "./book";
