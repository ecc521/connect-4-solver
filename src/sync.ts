import { PositionAnalysis, AnalyzeOptions, SolverModule } from "./core.js";
import { AbstractSyncSolver } from "./abstract-solver.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import createModule from "../build/analyze.js";

type CreateModule = (options?: {
  locateFile?: (path: string) => string;
}) => Promise<SolverModule>;

let NoSABModule: SolverModule | null = null;
let _noSABInitPromise: Promise<void> | null = null;

export function getNoSABModuleInitPromise(): Promise<void> {
  _noSABInitPromise ??= (createModule as unknown as CreateModule)().then(
    (mod: SolverModule) => {
      NoSABModule = mod;
    },
  );
  return _noSABInitPromise;
}

export function getNoSABModule(): SolverModule {
  if (!NoSABModule)
    throw new Error(
      "Module not initialized. Call getNoSABModuleInitPromise() first.",
    );
  return NoSABModule;
}

export class SyncWasmNoSABConnect4Solver extends AbstractSyncSolver {
  async init(): Promise<void> {
    if (this.initialized) return;
    await getNoSABModuleInitPromise();
    const mod = getNoSABModule();

    // OOM retry: _createCache returns 0 if allocation fails. Halve the request until it succeeds.
    let sizeMb = this.cacheSizeMb;
    let ptr = 0;
    while (sizeMb >= 8) {
      ptr = mod._createCache(
        this.width,
        this.height,
        sizeMb * 1024 * 1024,
        this.isHeuristic,
        this.align,
        this.wrap,
      );
      if (ptr !== 0) break;
      sizeMb = Math.floor(sizeMb / 2);
    }
    if (ptr === 0)
      throw new Error(`Failed to allocate WASM cache (tried down to 8 MB)`);
    this._cachePtr = ptr;
    this.allocatedCacheSizeMb = sizeMb;

    this._solverPtr = mod._createSolver(
      this.width,
      this.height,
      this._cachePtr,
      this.isHeuristic,
      this.align,
      this.wrap,
    );
    if (this._solverPtr === 0) {
      throw new Error(
        `Failed to create ${this.isHeuristic ? "heuristic" : "exact"} solver for ` +
          `${this.width}x${this.height}. This board size may not be supported by the current WASM build.`,
      );
    }
    this.initialized = true;
    return Promise.resolve();
  }

  analyze(
    positionStr: string,
    opts?: AnalyzeOptions,
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    return this.runTask(() => {
      const mod = getNoSABModule();
      const resArr = this.executeWasmAnalyze(mod, positionStr, opts);
      return this.parseResArr(resArr, positionStr, opts?.heuristic);
    });
  }

  loadBook(_data: Uint8Array): Promise<void> {
    if (!this.initialized) throw new Error("Call init() first.");
    if (this._isBusy || this._queue.length > 0) {
      throw new Error(
        "Cannot load a book while a search is active or queued. Call stop() and await it first.",
      );
    }
    const mod = getNoSABModule();
    if (this._bookPtr) {
      mod._destroyBook(this.width, this.height, this._bookPtr as number);
    }
    const ptr = mod._malloc(_data.length);
    const heapU8 = mod.HEAPU8 ?? new Uint8Array(mod.wasmMemory.buffer);
    heapU8.set(_data, ptr);
    this._bookPtr = mod._createBookFromBuffer(
      this.width,
      this.height,
      ptr,
      _data.length,
    );
    mod._free(ptr);
    if (!this._bookPtr) {
      throw new Error(
        `Failed to load opening book for ${this.width}x${this.height}. ` +
          `The book data may be invalid or the wrong format for this board size.`,
      );
    }
    return Promise.resolve();
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
        this.align,
        this.wrap,
      );
    if (this._cachePtr !== 0) mod._destroyCache(this._cachePtr);
    if (this._bookPtr) {
      mod._destroyBook(this.width, this.height, this._bookPtr as number);
      this._bookPtr = 0;
    }
    this._solverPtr = 0;
    this._cachePtr = 0;
    this.initialized = false;
  }

  solve(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    return this.runTask(() => {
      const mod = getNoSABModule();
      const resArr = this.executeWasmSolve(mod, positionStr, opts);
      return this.parseSolveResArr(resArr, positionStr, opts?.heuristic);
    });
  }

  protected _sendAbortSignal(): void {
    // NOTE: effectively a no-op while analyze()/solve() is running because the
    // JS event loop is blocked by the synchronous WASM call. The stop signal
    // sits in the queue until WASM returns. Use timeoutMs instead for WASM.
    if (!this.initialized) return;
    const mod = getNoSABModule();
    mod._stopSolver(
      this.width,
      this.height,
      this._solverPtr,
      this.isHeuristic,
      this.align,
      this.wrap,
    );
  }

  getNodeCount(): Promise<number> {
    if (!this.initialized) return Promise.resolve(0);
    const mod = getNoSABModule();
    return Promise.resolve(
      mod._getNodeCount(
        this.width,
        this.height,
        this._solverPtr,
        this.isHeuristic,
        this.align,
        this.wrap,
      ),
    );
  }
}
