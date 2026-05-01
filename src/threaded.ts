import { PositionAnalysis, AnalyzeOptions, SolverModule } from "./core";
import { AbstractSyncSolver } from "./abstract-solver";

let ThreadedModule: SolverModule | null = null;
let _threadedInitPromise: Promise<void> | null = null;

export function getThreadedModuleInitPromise(): Promise<void> {
  if (!_threadedInitPromise) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const createModule =
      require("../build/analyze_threaded.js") as unknown as () => Promise<SolverModule>;
    /* eslint-enable @typescript-eslint/no-require-imports */
    _threadedInitPromise = createModule().then((mod: SolverModule) => {
      ThreadedModule = mod;
    });
  }
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
