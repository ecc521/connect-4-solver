/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { PositionAnalysis, AnalyzeOptions } from "./core.js";
import { AbstractSyncSolver } from "./abstract-solver.js";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface NativeModuleType {
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
    weak: boolean,
    threads: number,
    book: unknown,
    timeout: number,
  ): Promise<Int32Array>;
  _analyzeHeuristic(
    w: number,
    h: number,
    solver: unknown,
    pos: string,
    threads: number,
    depth: number,
    timeout: number,
    book: unknown,
  ): Promise<Int32Array>;
  _solveExact(
    w: number,
    h: number,
    solver: unknown,
    pos: string,
    weak: boolean,
    threads: number,
    book: unknown,
    timeout: number,
  ): Promise<Int32Array>;
  _solveHeuristic(
    w: number,
    h: number,
    solver: unknown,
    pos: string,
    threads: number,
    depth: number,
    timeout: number,
    book: unknown,
  ): Promise<Int32Array>;
  _stopSolver(
    w: number,
    h: number,
    solver: unknown,
    isHeuristic: boolean,
  ): void;
  _createBook(w: number, h: number, path: string): unknown;
  _createBookFromBuffer(w: number, h: number, data: Uint8Array): unknown;
  _convertBookToDense(w: number, h: number, book: unknown): unknown;
  _convertBookToEF(w: number, h: number, book: unknown): unknown;
  _saveBookToFile(
    w: number,
    h: number,
    book: unknown,
    path: string,
    format: string,
  ): void;
  _getBookFormat(w: number, h: number, book: unknown): string;
  _getBookScore(
    w: number,
    h: number,
    book: unknown,
    pos: string,
  ): number | undefined;
  _getBookBuffer(
    w: number,
    h: number,
    book: unknown,
    format: string,
  ): Uint8Array;
  _destroyBook(w: number, h: number, book: unknown): void;
  _getNodeCount(
    w: number,
    h: number,
    solver: unknown,
    heuristic: boolean,
  ): number;
  _generatePositions(
    w: number,
    h: number,
    depth: number,
    filterForced?: boolean,
  ): string[];
  BookBuilder: new (
    w: number,
    h: number,
    depth: number,
  ) => {
    add(key: bigint, score: number): void;
    addPosition(pos: string, score: number): void;
    loadFromBook(bookPtr: number): void;
    saveDense(path: string): void;
    getDenseBuffer(): Uint8Array;
    saveEliasFano(path: string): void;
    size(): number;
  };
}

let NativeModule: NativeModuleType | null = null;
let nativeModuleAttempted = false;

export function getNativeModule(): NativeModuleType | null {
  if (!nativeModuleAttempted) {
    nativeModuleAttempted = true;
    try {
      if (typeof process !== "undefined" && process?.versions?.node) {
        const path = require("path") as { join: (...args: string[]) => string };
        const nodePath = path.join(
          __dirname,
          "..",
          "build",
          "Release",
          "connect4.node",
        );
        NativeModule = require(nodePath) as NativeModuleType;
      }
    } catch {
      // Fail silently
    }
  }
  return NativeModule;
}

export class NativeCache {
  public ptr: unknown;
  constructor(
    public width: number,
    public height: number,
    public cacheSizeMb: number,
    public isHeuristic: boolean,
  ) {
    const native = getNativeModule();
    if (!native) throw new Error("Native module not loaded");
    this.ptr = native._createCache(
      width,
      height,
      cacheSizeMb * 1024 * 1024,
      isHeuristic,
    );
  }
  destroy(): void {
    const native = getNativeModule();
    if (native && this.ptr) native._destroyCache(this.ptr);
    this.ptr = null;
  }
}

import { Connect4SolverOptions } from "./core.js";
export interface NodeConnect4SolverOptions extends Connect4SolverOptions {
  sharedCache?: NativeCache;
}

export class NodeConnect4Solver extends AbstractSyncSolver {
  private _analysisQueue: Promise<void> = Promise.resolve();
  private _sharedCache?: NativeCache;

  constructor(opts?: NodeConnect4SolverOptions | number, heightOpt?: number) {
    super(opts as NodeConnect4SolverOptions, heightOpt);
    if (
      opts &&
      typeof opts === "object" &&
      "sharedCache" in opts &&
      opts.sharedCache
    ) {
      this._sharedCache = opts.sharedCache;
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    const native = getNativeModule();
    if (!native) {
      throw new Error(
        "NodeConnect4Solver can only be executed in a Node.js environment where 'connect4.node' successfully compiled.",
      );
    }

    if (this._sharedCache) {
      this._cachePtr = this._sharedCache.ptr as number;
    } else {
      this._cachePtr = native._createCache(
        this.width,
        this.height,
        this.cacheSizeMb * 1024 * 1024,
        this.isHeuristic,
      ) as number;
    }

    this._solverPtr = native._createSolver(
      this.width,
      this.height,
      this._cachePtr,
      this.isHeuristic,
    ) as number;
    this.initialized = true;
    return Promise.resolve();
  }

  async loadBook(_data: Uint8Array): Promise<void> {
    if (!this.initialized) throw new Error("Call init() first.");
    const native = getNativeModule();
    if (native) {
      if (this._bookPtr) {
        native._destroyBook(this.width, this.height, this._bookPtr);
      }
      this._bookPtr = native._createBookFromBuffer(
        this.width,
        this.height,
        _data,
      ) as number;
    }
    return Promise.resolve();
  }

  async analyze(
    positionStr: string,
    opts?: AnalyzeOptions,
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
            const { threads, maxDepth, timeoutMs, bookPtr, weak } =
              this.sanitizeOpts(opts);

            let resArr: Int32Array | number[];
            if (this.isHeuristic) {
              resArr = await native._analyzeHeuristic(
                this.width,
                this.height,
                this._solverPtr,
                positionStr,
                threads,
                maxDepth,
                timeoutMs,
                bookPtr === 0 ? null : bookPtr,
              );
            } else {
              resArr = await native._analyzeExact(
                this.width,
                this.height,
                this._solverPtr,
                positionStr,
                weak,
                threads,
                bookPtr === 0 ? null : bookPtr,
                timeoutMs,
              );
            }
            resolve(this.parseResArr(resArr, positionStr));
          } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        });
    });
  }

  async solve(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
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
            const weak = opts?.weak ?? false;

            let resArr: Int32Array | number[];
            if (this.isHeuristic) {
              // Heuristic solve() does not benefit from LazySMP threading:
              // deterministic NNUE evaluation = no search diversity between threads.
              // analyze_heuristic() root-splitting still benefits from threads.
              resArr = await native._solveHeuristic(
                this.width,
                this.height,
                this._solverPtr,
                positionStr,
                threads,
                maxDepth,
                timeoutMs,
                bookPtr === 0 ? null : bookPtr,
              );
            } else {
              resArr = await native._solveExact(
                this.width,
                this.height,
                this._solverPtr,
                positionStr,
                weak,
                threads,
                bookPtr === 0 ? null : bookPtr,
                timeoutMs,
              );
            }
            resolve(this.parseSolveResArr(resArr, positionStr));
          } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        });
    });
  }

  stop(): void {
    if (!this.initialized) return;
    const native = getNativeModule();
    if (native) {
      native._stopSolver(
        this.width,
        this.height,
        this._solverPtr,
        this.isHeuristic,
      );
    }
  }

  release(): void {
    if (!this.initialized) return;
    const native = getNativeModule();
    if (native) {
      native._destroySolver(
        this.width,
        this.height,
        this._solverPtr,
        this.isHeuristic,
      );
      if (!this._sharedCache) {
        native._destroyCache(this._cachePtr);
      }
      if (this._bookPtr) {
        native._destroyBook(this.width, this.height, this._bookPtr);
        this._bookPtr = 0;
      }
    }
    this.initialized = false;
  }

  getNodeCount(): Promise<number> {
    if (!this.initialized) return Promise.resolve(0);
    const native = getNativeModule();
    if (native) {
      return Promise.resolve(Number(
        native._getNodeCount(
          this.width,
          this.height,
          this._solverPtr,
          this.isHeuristic,
        ),
      ));
    }
    return Promise.resolve(0);
  }
}
