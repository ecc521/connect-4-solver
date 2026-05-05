/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/prefer-nullish-coalescing */

import { PositionAnalysis, AnalyzeOptions, SolverModule } from "./core.js";
import { AbstractSyncSolver } from "./abstract-solver.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import createModule from "../build/analyze.js";

const wasmUrl = new URL("../build/analyze.wasm", import.meta.url);

let NoSABModule: SolverModule | null = null;
let _noSABInitPromise: Promise<void> | null = null;

export function getNoSABModuleInitPromise(): Promise<void> {
  if (!_noSABInitPromise) {
    _noSABInitPromise = (createModule as any)({
      locateFile: (path: string) => path.endsWith('.wasm') ? wasmUrl.href : path
    }).then((mod: SolverModule) => {
      NoSABModule = mod;
    });
  }
  return _noSABInitPromise as Promise<void>;
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

  analyze(positionStr: string, opts?: AnalyzeOptions): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    const mod = getNoSABModule();
    // Force 1 thread since it's NoSAB
    const finalOpts = { ...opts, threads: 1 };
    const resArr = this.executeWasmAnalyze(mod, positionStr, finalOpts);
    return Promise.resolve(this.parseResArr(resArr, positionStr));
  }

  async loadBook(_data: Uint8Array): Promise<void> {
    if (!this.initialized) throw new Error("Call init() first.");
    const mod = getNoSABModule();
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

  solve(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Promise<PositionAnalysis> {
    if (!this.initialized) throw new Error("Call init() first.");
    const mod = getNoSABModule();
    // Force 1 thread since it's NoSAB
    const finalOpts = { ...opts, threads: 1 };
    const resArr = this.executeWasmSolve(mod, positionStr, finalOpts);
    return Promise.resolve(this.parseSolveResArr(resArr, positionStr));
  }

  stop(): void {
    // NOTE: this is effectively a no-op while analyze()/solve() is running.
    // The worker's JS event loop is blocked by the synchronous WASM call, so the
    // "stop" message sent by AbstractAsyncWebWorkerSolver.stop() sits in the queue
    // and cannot be dispatched until the WASM function returns.
    //
    // Use timeoutMs instead — it is set before the search starts and is polled
    // by the C++ negamax loop internally, requiring no JS interop.
    if (!this.initialized) return;
    const mod = getNoSABModule();
    mod._stopSolver(this.width, this.height, this._solverPtr, this.isHeuristic);
  }

  getNodeCount(): Promise<number> {
    if (!this.initialized) return Promise.resolve(0);
    const mod = getNoSABModule();
    return Promise.resolve(mod._getNodeCount(
      this.width,
      this.height,
      this._solverPtr,
      this.isHeuristic,
    ));
  }
}
