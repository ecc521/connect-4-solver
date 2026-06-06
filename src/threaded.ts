import { PositionAnalysis, AnalyzeOptions, SolverModule } from "./core.js";
import { AbstractSyncSolver } from "./abstract-solver.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import createModule from "../build/analyze_threaded.js";

type CreateModule = (options: {
  locateFile: (path: string) => string;
}) => Promise<SolverModule>;

const wasmUrl = new URL("../build/analyze_threaded.wasm", import.meta.url);
const workerUrl = new URL(
  "../build/analyze_threaded.worker.js",
  import.meta.url,
);

let ThreadedModule: SolverModule | null = null;
let _threadedInitPromise: Promise<void> | null = null;

export function getThreadedModuleInitPromise(): Promise<void> {
  _threadedInitPromise ??= (createModule as unknown as CreateModule)({
    locateFile: (path: string) => {
      if (path.endsWith(".wasm")) return wasmUrl.href;
      if (path.endsWith(".worker.js")) return workerUrl.href;
      return path;
    },
  }).then((mod: SolverModule) => {
    ThreadedModule = mod;
  });
  return _threadedInitPromise;
}

export function getThreadedModule(): SolverModule {
  if (!ThreadedModule)
    throw new Error(
      "Module not initialized. Call getThreadedModuleInitPromise() first.",
    );
  return ThreadedModule;
}

export class SyncWasmConnect4Solver extends AbstractSyncSolver {
  async init(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    await getThreadedModuleInitPromise();
    const mod = getThreadedModule();
    if (!mod) throw new Error("Threaded module not initialized");

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
      const mod = getThreadedModule();
      const resArr = this.executeWasmAnalyze(mod, positionStr, opts);
      return this.parseResArr(resArr, positionStr);
    });
  }

  solve(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    return this.runTask(() => {
      const mod = getThreadedModule();
      const resArr = this.executeWasmSolve(mod, positionStr, opts);
      return this.parseSolveResArr(resArr, positionStr);
    });
  }

  protected _sendAbortSignal(): void {
    // NOTE: effectively a no-op while analyze()/solve() is running because
    // pthreads share memory but the JS thread is blocked. Use timeoutMs instead.
    if (!this.initialized) return;
    const mod = getThreadedModule();
    mod._stopSolver(
      this.width,
      this.height,
      this._solverPtr,
      this.isHeuristic,
      this.align,
      this.wrap,
    );
  }

  loadBook(_data: Uint8Array): Promise<void> {
    if (!this.initialized) throw new Error("Call init() first.");
    if (this._isBusy || this._queue.length > 0) {
      throw new Error(
        "Cannot load a book while a search is active or queued. Call stop() and await it first.",
      );
    }
    const mod = getThreadedModule();
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
    const mod = getThreadedModule();
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

  getNodeCount(): Promise<number> {
    if (!this.initialized) return Promise.resolve(0);
    const mod = getThreadedModule();
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
