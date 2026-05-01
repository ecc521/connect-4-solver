import { PositionAnalysis, AnalyzeOptions } from "./core";
import { AbstractSyncSolver } from "./abstract-solver";

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
    book: unknown,
    timeout: number,
  ): Promise<Int32Array>;
  _solveHeuristic(
    w: number,
    h: number,
    solver: unknown,
    pos: string,
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
        const req = (
          typeof module !== "undefined" && module.require
            ? module.require.bind(module)
            : require
        ) as (id: string) => unknown;
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
    ) as number;
    this._solverPtr = native._createSolver(
      this.width,
      this.height,
      this._cachePtr,
      this.isHeuristic,
    ) as number;
    this.initialized = true;
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
            if (this.isHeuristic)
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
            else
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

            resolve(this.parseResArr(resArr, positionStr));
          } catch (err: unknown) {
            reject(err instanceof Error ? err : new Error(String(err)));
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
            const { maxDepth, timeoutMs, bookPtr } = this.sanitizeOpts(opts);
            const weak = opts?.weak ?? false;

            let resArr: Int32Array | number[];
            if (this.isHeuristic)
              resArr = await native._solveHeuristic(
                this.width,
                this.height,
                this._solverPtr,
                positionStr,
                maxDepth,
                timeoutMs,
                bookPtr === 0 ? null : bookPtr,
              );
            else
              resArr = await native._solveExact(
                this.width,
                this.height,
                this._solverPtr,
                positionStr,
                weak,
                bookPtr === 0 ? null : bookPtr,
                timeoutMs,
              );

            resolve(this.parseSolveResArr(resArr, positionStr));
          } catch (err: unknown) {
            reject(err instanceof Error ? err : new Error(String(err)));
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
