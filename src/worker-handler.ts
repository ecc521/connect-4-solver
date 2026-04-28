import {
  Connect4Solver,
  ThreadedConnect4Solver,
  HeuristicConnect4Solver,
  ThreadedHeuristicConnect4Solver,
  SolverCache,
  ThreadedSolverCache,
} from "./index";

export function setupWorkerHandler() {
  let solver: Connect4Solver | ThreadedConnect4Solver | HeuristicConnect4Solver | ThreadedHeuristicConnect4Solver | null = null;
  let cache: SolverCache | ThreadedSolverCache | null = null;

  self.onmessage = async (e: MessageEvent) => {
    const { id, type, payload } = e.data;
    try {
      if (type === "init") {
        const { solverType, width, height, useSharedCache } = payload;
        
        if (useSharedCache) {
          if (solverType.includes("Threaded")) {
            cache = new ThreadedSolverCache(width, height);
          } else {
            cache = new SolverCache(width, height);
          }
        }

        const opts = { width, height, cache: cache || undefined };

        if (solverType === "Connect4Solver") solver = new Connect4Solver(opts);
        else if (solverType === "ThreadedConnect4Solver") solver = new ThreadedConnect4Solver(opts);
        else if (solverType === "HeuristicConnect4Solver") solver = new HeuristicConnect4Solver(opts as any); // heuristic opts typing varies slightly
        else if (solverType === "ThreadedHeuristicConnect4Solver") solver = new ThreadedHeuristicConnect4Solver(opts as any);
        else throw new Error("Unknown solver type");

        await solver.init();
        self.postMessage({ id, success: true });
      } else if (type === "loadBook") {
        if (!solver) throw new Error("Solver not initialized");
        await solver.loadBook(payload.data);
        self.postMessage({ id, success: true });
      } else if (type === "analyze") {
        if (!solver) throw new Error("Solver not initialized");
        const result = await solver.analyzeAsync(payload.position, payload.opts);
        self.postMessage({ id, success: true, result });
      } else if (type === "unload") {
        if (solver) solver.unload();
        if (cache) cache.destroy();
        self.postMessage({ id, success: true });
      }
    } catch (err: any) {
      self.postMessage({ id, success: false, error: err.message });
    }
  };
}
