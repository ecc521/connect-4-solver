/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */

import { Connect4SolverOptions, AnalyzeOptions } from "./core.js";
import { AbstractSyncSolver } from "./abstract-solver.js";
import { SyncWasmConnect4Solver } from "./threaded.js";
import { SyncWasmNoSABConnect4Solver } from "./sync.js";

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
    data?: Uint8Array;
  };
}

export function setupWorkerHandler(): void {
  let solver: AbstractSyncSolver | null = null;
  const existingHandler = self.onmessage;

  self.onmessage = async (e: MessageEvent<any>): Promise<void> => {
    const { id, type, payload } = e.data;
    
    // Pass to Emscripten pthread handler if it's not our message type
    if (!type || !["init-threaded", "loadBook", "analyze", "solve", "stop", "unload", "getNodeCount"].includes(type)) {
      if (existingHandler) {
        return existingHandler.call(self, e);
      }
      return;
    }

    try {
      if (type === "init-threaded") {
        const { width, height, cacheSizeMb, heuristic } = payload;
        const opts: Connect4SolverOptions = { width, height, cacheSizeMb, heuristic };
        solver = new SyncWasmConnect4Solver(opts);
        await solver.init();
        self.postMessage({ id, success: true });
      } else if (type === "loadBook") {
        if (!solver) throw new Error("Solver not initialized");
        if (payload.data) await solver.loadBook(payload.data);
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
      } else if (type === "getNodeCount") {
        const count = solver ? await solver.getNodeCount() : 0;
        self.postMessage({ id, success: true, result: count });
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
        if (payload.data) {
          await solver.loadBook(payload.data);
        }
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
      } else if (type === "getNodeCount") {
        const count = solver ? await solver.getNodeCount() : 0;
        self.postMessage({ id, success: true, result: count });
      }
    } catch (err: unknown) {
      const error = err as Error;
      self.postMessage({ id, success: false, error: error.message });
    }
  };
}
