/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/prefer-nullish-coalescing */

import { PositionAnalysis, AnalyzeOptions, SolverModule } from "./core.js";
import { AbstractSyncSolver } from "./abstract-solver.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import createModule from "../build/analyze_threaded.js";

const wasmUrl = new URL("../build/analyze_threaded.wasm", import.meta.url);
const workerUrl = new URL("../build/analyze_threaded.worker.js", import.meta.url);

let ThreadedModule: SolverModule | null = null;
let _threadedInitPromise: Promise<void> | null = null;

export function getThreadedModuleInitPromise(): Promise<void> {
  if (!_threadedInitPromise) {
    _threadedInitPromise = (createModule as any)({
      locateFile: (path: string) => {
        if (path.endsWith('.wasm')) return wasmUrl.href;
        if (path.endsWith('.worker.js')) return workerUrl.href;
        return path;
      }
    }).then((mod: SolverModule) => {
      ThreadedModule = mod;
    });
  }
  return _threadedInitPromise as Promise<void>;
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

  analyze(positionStr: string, opts?: AnalyzeOptions): PositionAnalysis {
    if (!this.initialized) throw new Error("Call init() first.");
    const mod = getThreadedModule();
    const resArr = this.executeWasmAnalyze(mod, positionStr, opts);
    return this.parseResArr(resArr, positionStr);
  }

  solve(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): PositionAnalysis {
    if (!this.initialized) throw new Error("Call init() first.");
    const mod = getThreadedModule();
    const resArr = this.executeWasmSolve(mod, positionStr, opts);
    return this.parseSolveResArr(resArr, positionStr);
  }

  stop(): void {
    if (!this.initialized) return;
    const mod = getThreadedModule();
    mod._stopSolver(this.width, this.height, this._solverPtr, this.isHeuristic);
  }

  async loadBook(_data: Uint8Array): Promise<void> {
    if (!this.initialized) throw new Error("Call init() first.");
    const mod = this.isHeuristic ? getThreadedModule() : getThreadedModule();
    if (this._bookPtr) {
      mod._destroyBook(this.width, this.height, this._bookPtr);
    }
    const ptr = mod._malloc(_data.length);
    const heapU8 = mod.HEAPU8 || new Uint8Array(mod.wasmMemory.buffer);
    heapU8.set(_data, ptr);
    this._bookPtr = mod._createBookFromBuffer(
      this.width,
      this.height,
      ptr,
      _data.length,
    );
    mod._free(ptr);
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
