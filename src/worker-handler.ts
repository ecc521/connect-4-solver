import { SyncWasmConnect4Solver, SyncWasmNoSABConnect4Solver, Connect4SolverOptions, AbstractSyncSolver } from "./index";

export function setupWorkerHandler() {
  let solver: AbstractSyncSolver | null = null;

  self.onmessage = async (e: MessageEvent) => {
    const { id, type, payload } = e.data;
    try {
      if (type === "init-threaded") {
        const { width, height, cacheSizeMb, heuristic } = payload;
        const opts: Connect4SolverOptions = { width, height, cacheSizeMb, heuristic };
        solver = new SyncWasmConnect4Solver(opts);
        await solver.init();
        self.postMessage({ id, success: true });
      } else if (type === "loadBook") {
        if (!solver) throw new Error("Solver not initialized");
        // solver.loadBook doesn't exist natively on Connect4Solver yet, but leaving payload logic
        self.postMessage({ id, success: true });
      } else if (type === "analyze") {
        if (!solver) throw new Error("Solver not initialized");
        const result = await solver.analyze(payload.position, payload.opts);
        self.postMessage({ id, success: true, result });
      } else if (type === "unload") {
        if (solver) solver.release();
        self.postMessage({ id, success: true });
      }
      }
    } catch (err: any) {
      self.postMessage({ id, success: false, error: err.message });
    }
  };
}

export function setupNoSABWorkerHandler() {
  let solver: AbstractSyncSolver | null = null;

  self.onmessage = async (e: MessageEvent) => {
    const { id, type, payload } = e.data;
    try {
      if (type === "init-nosab") {
        const { width, height, cacheSizeMb, heuristic } = payload;
        const opts: Connect4SolverOptions = { width, height, cacheSizeMb, heuristic };
        solver = new SyncWasmNoSABConnect4Solver(opts);
        await solver.init();
        self.postMessage({ id, success: true });
      } else if (type === "loadBook") {
        if (!solver) throw new Error("Solver not initialized");
        self.postMessage({ id, success: true });
      } else if (type === "analyze") {
        if (!solver) throw new Error("Solver not initialized");
        const result = await solver.analyze(payload.position, payload.opts);
        self.postMessage({ id, success: true, result });
      } else if (type === "unload") {
        if (solver) solver.release();
        self.postMessage({ id, success: true });
      }
    } catch (err: any) {
      self.postMessage({ id, success: false, error: err.message });
    }
  };
}
