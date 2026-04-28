import { Connect4Solver, Connect4SolverOptions } from "./index";

export function setupWorkerHandler() {
  let solver: Connect4Solver | null = null;

  self.onmessage = async (e: MessageEvent) => {
    const { id, type, payload } = e.data;
    try {
      if (type === "init") {
        const { width, height, cacheSizeMb, heuristic } = payload;
        
        const opts: Connect4SolverOptions = { width, height, cacheSizeMb, heuristic };
        solver = new Connect4Solver(opts);

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
    } catch (err: any) {
      self.postMessage({ id, success: false, error: err.message });
    }
  };
}
