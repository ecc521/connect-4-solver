import { PositionAnalysis, AnalyzeOptions, BookResult } from "./core.js";
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
    align: number,
    wrap: boolean,
  ): unknown;
  _destroySolver(
    w: number,
    h: number,
    solver: unknown,
    heuristic: boolean,
    align: number,
    wrap: boolean,
  ): void;
  _createCache(
    w: number,
    h: number,
    size: number,
    heuristic: boolean,
    align: number,
    wrap: boolean,
  ): unknown;
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
    align: number,
    wrap: boolean,
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
    align: number,
    wrap: boolean,
  ): Promise<Int32Array>;
  _stopSolver(
    w: number,
    h: number,
    solver: unknown,
    isHeuristic: boolean,
    align: number,
    wrap: boolean,
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
    align: number,
    wrap: boolean,
  ): number;
  _isFastPath(w: number, h: number, align?: number, wrap?: boolean): boolean;
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

/**
 * Returns true if the native addon has a compiled, specialized solver for this
 * board geometry (the fast path). Returns false if a solve would fall back to the
 * generic runtime-width solver (~50% slower), or if the native addon isn't loaded.
 *
 * Intended for tooling (e.g. the book generator) to warn before doing heavy work on
 * the generic path. Node-only.
 */
export function isFastPath(
  width: number,
  height: number,
  align = 4,
  wrap = false,
): boolean {
  const native = getNativeModule();
  return native ? native._isFastPath(width, height, align, wrap) : false;
}

export class NativeCache {
  public ptr: unknown;
  public allocatedCacheSizeMb: number;

  constructor(
    public width: number,
    public height: number,
    public cacheSizeMb: number,
    public align = 4,
    public wrap = false,
  ) {
    const native = getNativeModule();
    if (!native) throw new Error("Native module not loaded");

    let sizeMb = cacheSizeMb;
    let ptr: unknown;
    while (true) {
      ptr = native._createCache(
        width,
        height,
        sizeMb * 1024 * 1024,
        false, // legacy is_heuristic slot (removed in v5)
        align,
        wrap,
      );
      if (ptr) break;
      if (sizeMb <= 4) break;
      sizeMb = Math.max(4, Math.floor(sizeMb / 2));
    }
    if (!ptr) throw new Error(`Failed to allocate native cache`);
    this.ptr = ptr;
    this.allocatedCacheSizeMb = sizeMb;
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
  private _sharedCache?: NativeCache;

  public get _native(): NativeModuleType | null {
    return getNativeModule();
  }

  constructor(opts?: NodeConnect4SolverOptions | number, heightOpt?: number) {
    super(opts, heightOpt);
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
      this.allocatedCacheSizeMb = this.cacheSizeMb; // Assume it matches if shared
    } else {
      let sizeMb = this.cacheSizeMb;
      let ptr: unknown;
      while (true) {
        ptr = native._createCache(
          this.width,
          this.height,
          sizeMb * 1024 * 1024,
          false, // legacy is_heuristic slot (removed in v5)
          this.align,
          this.wrap,
        );
        if (ptr) break;
        if (sizeMb <= 4) break;
        sizeMb = Math.max(4, Math.floor(sizeMb / 2));
      }
      if (!ptr) throw new Error(`Failed to allocate Node.js native cache`);
      this._cachePtr = ptr as number;
      this.allocatedCacheSizeMb = sizeMb;
    }

    this._solverPtr = native._createSolver(
      this.width,
      this.height,
      this._cachePtr,
      false, // legacy is_heuristic slot (removed in v5)
      this.align,
      this.wrap,
    ) as number;
    if (!this._solverPtr) {
      throw new Error(
        `Failed to create exact solver for ` +
          `${this.width}x${this.height}. This board size may not be supported by the current native addon build.`,
      );
    }
    this.initialized = true;
    return Promise.resolve();
  }

  loadBook(_data: Uint8Array): Promise<void> {
    if (!this.initialized) throw new Error("Call init() first.");
    if (this._isBusy || this._queue.length > 0) {
      throw new Error(
        "Cannot load a book while a search is active or queued. Call stop() and await it first.",
      );
    }
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
      if (!this._bookPtr) {
        throw new Error(
          `Failed to load opening book for ${this.width}x${this.height}. ` +
            `The book data may be invalid or the wrong format for this board size.`,
        );
      }
    }
    return Promise.resolve();
  }

  queryBook(positionStr: string): Promise<BookResult | null> {
    const native = getNativeModule();
    if (!native) return Promise.resolve(null);
    // Pass _bookPtr (0 if none) — the native side falls back to the embedded book
    // for this size, so this works for embedded-book sizes that never call loadBook.
    // null (not 0) when no explicit book — the native UnwrapPointer maps null →
    // nullptr and then falls back to the embedded book for this size.
    const score = native._getBookScore(
      this.width,
      this.height,
      this._bookPtr || null,
      positionStr,
    );
    return Promise.resolve(score === undefined ? null : { exact: score });
  }

  async analyze(
    positionStr: string,
    opts?: AnalyzeOptions,
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");

    return this.runTask(async () => {
      const native = getNativeModule();
      if (!native) throw new Error("Native module not loaded");
      const { threads, timeoutMs, bookPtr, weak } = this.sanitizeOpts(opts);

      const resArr = await native._analyzeExact(
        this.width,
        this.height,
        this._solverPtr,
        positionStr,
        weak,
        threads,
        bookPtr === 0 ? null : bookPtr,
        timeoutMs,
        this.align,
        this.wrap,
      );
      return this.parseResArr(resArr, positionStr);
    });
  }

  async solve(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");

    return this.runTask(async () => {
      const native = getNativeModule();
      if (!native) throw new Error("Native module not loaded");
      const { threads, timeoutMs, bookPtr } = this.sanitizeOpts(opts);
      const weak = opts?.weak ?? false;

      const resArr = await native._solveExact(
        this.width,
        this.height,
        this._solverPtr,
        positionStr,
        weak,
        threads,
        bookPtr === 0 ? null : bookPtr,
        timeoutMs,
        this.align,
        this.wrap,
      );
      return this.parseSolveResArr(resArr, positionStr);
    });
  }

  protected _sendAbortSignal(): void {
    if (!this.initialized) return;
    const native = getNativeModule();
    if (native) {
      native._stopSolver(
        this.width,
        this.height,
        this._solverPtr,
        false, // legacy is_heuristic slot (removed in v5)
        this.align,
        this.wrap,
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
        false, // legacy is_heuristic slot (removed in v5)
        this.align,
        this.wrap,
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
      return Promise.resolve(
        Number(
          native._getNodeCount(
            this.width,
            this.height,
            this._solverPtr,
            false, // legacy is_heuristic slot (removed in v5)
            this.align,
            this.wrap,
          ),
        ),
      );
    }
    return Promise.resolve(0);
  }
}
