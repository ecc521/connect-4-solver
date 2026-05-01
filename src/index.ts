/** @deprecated Use solver.width instead */
export const BOARD_WIDTH = 7;

export * from "./core";
export * from "./book";

import { Connect4SolverOptions, BaseConnect4Solver } from "./core";

/**
 * Creates and returns the most optimal solver for the current environment.
 * 
 * 1. Node.js -> Native C++ Addon
 * 2. Browser with crossOriginIsolated -> Threaded WASM
 * 3. Browser without SAB -> Single-threaded WASM
 */
export async function createSolver(opts?: Connect4SolverOptions): Promise<BaseConnect4Solver> {
  // 1. Check for Node.js Native
  if (typeof process !== "undefined" && process?.versions?.node) {
    const { NodeConnect4Solver } = await import("./node");
    return new NodeConnect4Solver(opts);
  }
  
  // 2. Check for Browser Threading (COOP/COEP)
  // SharedArrayBuffer might be available or crossOriginIsolated might be true.
  if (
    typeof self !== "undefined" &&
    (((self as unknown) as { crossOriginIsolated?: boolean }).crossOriginIsolated || typeof SharedArrayBuffer !== "undefined")
  ) {
    const { SyncWasmConnect4Solver } = await import("./threaded");
    return new SyncWasmConnect4Solver(opts);
  }

  // 3. Fallback to Single-Threaded WASM
  const { SyncWasmNoSABConnect4Solver } = await import("./sync");
  return new SyncWasmNoSABConnect4Solver(opts);
}
