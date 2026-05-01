import { Connect4SolverOptions, AnalyzeOptions } from "./core";
import { AbstractSyncSolver } from "./abstract-solver";
import { SyncWasmConnect4Solver } from "./threaded";
import { SyncWasmNoSABConnect4Solver } from "./sync";

interface WorkerMessage {
  id: number;
  type: string;
  payload: {
    width: number;
    height: number;
    cacheSizeMb: number;
    heuristic: boolean;
    position: string;
    opts: AnalyzeOptions;
  };
}

export function setupWorkerHandler(): void {
  let solver: AbstractSyncSolver | null = null;

  self.onmessage = async (e: MessageEvent<WorkerMessage>): Promise<void> => {
    const { id, type, payload } = e.data;
    try {
      if (type === "init-threaded") {
        const { width, height, cacheSizeMb, heuristic } = payload;
        const opts: Connect4SolverOptions = {
          width,
          height,
          cacheSizeMb,
          heuristic,
        };
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
      } else if (type === "solve") {
        if (!solver) throw new Error("Solver not initialized");
        const result = await solver.solve(payload.position, payload.opts);
        self.postMessage({ id, success: true, result });
      } else if (type === "stop") {
        if (solver) solver.stop();
        self.postMessage({ id, success: true });
      } else if (type === "unload") {
        if (solver) solver.release();
        self.postMessage({ id, success: true });
      }
    } catch (err: unknown) {
      const error = err as Error;
      self.postMessage({ id, success: false, error: error.message });
    }
  };
}

export function setupNoSABWorkerHandler(): void {
  let solver: AbstractSyncSolver | null = null;

  self.onmessage = async (e: MessageEvent<WorkerMessage>): Promise<void> => {
    const { id, type, payload } = e.data;
    try {
      if (type === "init-nosab") {
        const { width, height, cacheSizeMb, heuristic } = payload;
        const opts: Connect4SolverOptions = {
          width,
          height,
          cacheSizeMb,
          heuristic,
        };
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
      } else if (type === "solve") {
        if (!solver) throw new Error("Solver not initialized");
        const result = await solver.solve(payload.position, payload.opts);
        self.postMessage({ id, success: true, result });
      } else if (type === "stop") {
        if (solver) solver.stop();
        self.postMessage({ id, success: true });
      } else if (type === "unload") {
        if (solver) solver.release();
        self.postMessage({ id, success: true });
      }
    } catch (err: unknown) {
      const error = err as Error;
      self.postMessage({ id, success: false, error: error.message });
    }
  };
}
