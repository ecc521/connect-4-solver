import { PositionAnalysis, AnalyzeOptions, SolverModule } from "./core";
import { AbstractSyncSolver } from "./abstract-solver";

let NoSABModule: SolverModule | null = null;
let _noSABInitPromise: Promise<void> | null = null;

export function getNoSABModuleInitPromise(): Promise<void> {
  if (!_noSABInitPromise) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const createModule =
      require("../build/analyze.js") as unknown as () => Promise<SolverModule>;
    /* eslint-enable @typescript-eslint/no-require-imports */
    _noSABInitPromise = createModule().then((mod: SolverModule) => {
      NoSABModule = mod;
    });
  }
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

  analyze(positionStr: string, opts?: AnalyzeOptions): PositionAnalysis {
    if (!this.initialized) throw new Error("Call init() first.");
    const mod = getNoSABModule();
    // Force 1 thread since it's NoSAB
    const finalOpts = { ...opts, threads: 1 };
    const resArr = this.executeWasmAnalyze(mod, positionStr, finalOpts);
    return this.parseResArr(resArr, positionStr);
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
    if (!this.initialized) return;
    const mod = getNoSABModule();
    mod._stopSolver(this.width, this.height, this._solverPtr, this.isHeuristic);
  }

  getNodeCount(): number {
    if (!this.initialized) return 0;
    const mod = getNoSABModule();
    return mod._getNodeCount(
      this.width,
      this.height,
      this._solverPtr,
      this.isHeuristic,
    );
  }
}
