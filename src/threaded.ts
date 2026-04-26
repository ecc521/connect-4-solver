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
  async init(): Promise<void> {
    await initThreadedModule();
    this.initialized = true;
  }

  get mod(): SolverModule {
    if (!ThreadedModule) {
      throw new Error("ThreadedModule not initialized. Call init() first.");
    }
    return ThreadedModule as unknown as SolverModule;
  }
}
