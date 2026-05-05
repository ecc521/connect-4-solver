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

  analyze(
    positionStr: string,
    opts?: AnalyzeOptions,
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    return this.runTask(() => {
      const mod = getThreadedModule();
      const resArr = this.executeWasmAnalyze(mod, positionStr, opts);
      return this.parseResArr(resArr, positionStr, opts?.heuristic);
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
      return this.parseSolveResArr(resArr, positionStr, opts?.heuristic);
    });
  }

  stop(): void {
    // NOTE: this is effectively a no-op while analyze()/solve() is running.
    // The worker's JS event loop is blocked by the synchronous WASM call, so the
    // "stop" message sent by AbstractAsyncWebWorkerSolver.stop() sits in the queue
    // and cannot be dispatched until the WASM function returns.
    //
    // Emscripten pthreads share memory, but _stopSolver still cannot be called from
    // the blocked JS thread while the search is in flight.
    //
    // Use timeoutMs instead — it is set before the search starts and is polled
    // by the C++ negamax loop internally, requiring no JS interop.
    if (!this.initialized) return;
    const mod = getThreadedModule();
    mod._stopSolver(this.width, this.height, this._solverPtr, this.isHeuristic);
  }

  async loadBook(_data: Uint8Array): Promise<void> {
    if (!this.initialized) throw new Error("Call init() first.");
    return this.runTask(() => {
      const mod = this.isHeuristic ? getThreadedModule() : getThreadedModule();
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
    });
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

  getNodeCount(): Promise<number> {
    if (!this.initialized) return Promise.resolve(0);
    const mod = getThreadedModule();
    return Promise.resolve(
      mod._getNodeCount(
        this.width,
        this.height,
        this._solverPtr,
        this.isHeuristic,
      ),
    );
  }
}
