import { Connect4Solver, SolverModule } from "./index";

let ThreadedModule: SolverModule | null = null;
let _threadedModuleInitPromise: Promise<void> | null = null;
function initThreadedModule(): Promise<void> {
  if (!_threadedModuleInitPromise) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const createThreadedModule =
      require("../build/analyze_threaded.js") as unknown as () => Promise<SolverModule>;
    /* eslint-enable @typescript-eslint/no-require-imports */
    _threadedModuleInitPromise = createThreadedModule().then(
      (mod: SolverModule) => {
        ThreadedModule = mod;
      },
    );
  }
  return _threadedModuleInitPromise;
}

export class ThreadedConnect4Solver extends Connect4Solver {
  /**
   * Bootstraps the Multi-Threaded WASM module explicitly compiled with WebWorker support.
   * This overrides the standard init() to ensure the base solver utilizes
   * the thread-safe shared WASM memory buffer, rather than the sequential memory pool.
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    await initThreadedModule();
    this.initialized = true;
    const ptr = (this as any)._instancePtr;
    if (ptr === 0) {
      const cachePtr = (this as any)._cache ? (this as any)._cache.ptr : ((this as any)._localCachePtr = this.mod._createCache(this.width, this.height, 1024 * 1024 * 64, false));
      (this as any)._instancePtr = this.mod._createSolver(this.width, this.height, cachePtr, false);
    }
  }

  get mod(): SolverModule {
    if (!ThreadedModule) {
      throw new Error("ThreadedModule not initialized. Call init() first.");
    }
    return ThreadedModule as unknown as SolverModule;
  }
  analyze(positionStr: string, opts?: { threads?: number }): import("./index").PositionAnalysis {
    return super.analyze(positionStr, opts);
  }

  async analyzeAsync(positionStr: string, opts?: { threads?: number }): Promise<import("./index").PositionAnalysis> {
    return super.analyzeAsync(positionStr, opts);
  }
}

import { SolverCache } from "./cache";

export class ThreadedSolverCache extends SolverCache {
  async init(): Promise<void> {
    if (this._ptr !== 0) return;
    await initThreadedModule();
    this.mod = ThreadedModule as unknown as SolverModule;
    this._ptr = this.mod._createCache(this.width, this.height, this.sizeBytes, this.is_heuristic);
  }
}

export class ThreadedHeuristicSolverCache extends ThreadedSolverCache {
  constructor(w: number, h: number, sizeBytes: number = 1024 * 1024 * 64) {
    super(w, h, sizeBytes, true);
  }
}
