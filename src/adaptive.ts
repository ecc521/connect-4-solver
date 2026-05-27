/**
 * adaptive.ts
 *
 * AdaptiveSolver — a high-level, long-lived solver that manages board-size
 * switching, cache teardown/reinit, embedded book loading, and engine routing.
 *
 * Intended as the primary API for consumer applications. Lower-level solvers
 * (NodeConnect4Solver, SyncWasmConnect4Solver, etc.) remain available for
 * advanced use cases.
 *
 * Usage:
 *   const solver = new AdaptiveSolver({ cacheSizeMb: 256 });
 *   await solver.setBoard(7, 6);
 *   console.log(solver.capability); // 'exact'
 *   console.log(solver.hasBook);    // true  (embedded book auto-loaded)
 *
 *   const result = await solver.analyze('443322');
 *   await solver.setBoard(8, 8);   // cleanly tears down 7x6, inits 8x8
 *   await solver.destroy();
 */

import {
  BaseConnect4Solver,
  PositionAnalysis,
  AnalyzeOptions,
  Connect4SolverOptions,
} from "./core.js";
import {
  getSolverCapability,
  SolverCapability,
  EMBEDDED_BOOK_SIZES,
} from "./capabilities.js";

export type { SolverCapability };
export { getSolverCapability };

// ─── Embedded book registry ───────────────────────────────────────────────────

// EMBEDDED_BOOK_SIZES is imported from capabilities.ts — single source of truth.
// Used to pre-determine solver type before init(), avoiding the
// "create as heuristic → detect book → recreate as exact" anti-pattern.
function hasEmbeddedBook(
  width: number,
  height: number,
  align = 4,
  wrap = false,
): boolean {
  if (align !== 4 || wrap !== false) return false;
  return EMBEDDED_BOOK_SIZES.has(`${width}x${height}`);
}

// ─── Options ─────────────────────────────────────────────────────────────────

export interface AdaptiveSolverOptions {
  /**
   * Total transposition table budget for the active solver.
   * Default: 128 MB.
   */
  cacheSizeMb?: number;

  /**
   * Default timeout in milliseconds applied to searches.
   * If not specified, defaults to 5000 ms for all solver types.
   * For heuristic searches (capability='nnue'|'tactical'), running without a timeout
   * (explicitly setting to 0) is allowed but will trigger a console warning.
   */
  defaultTimeoutMs?: number;

  /**
   * Optional async callback invoked during setBoard() to supply a custom
   * opening book. Return null/undefined to skip (embedded book stays active).
   * A non-null return REPLACES the embedded book with the custom one.
   */
  bookLoader?: (
    width: number,
    height: number,
    align?: number,
    wrap?: boolean,
  ) => Promise<Uint8Array | null | undefined>;

  /**
   * Optional worker provider function for running WASM solvers in Web Workers on the web.
   * If provided, the solver will run asynchronously on a background thread instead of
   * blocking the browser's main thread.
   */
  workerProvider?: () => Worker;
}

// ─── AdaptiveSolver ──────────────────────────────────────────────────────────

export class AdaptiveSolver {
  // ── Internal state ─────────────────────────────────────────────────────────

  private _solver: BaseConnect4Solver | null = null;
  private _opts: AdaptiveSolverOptions;

  private _width = 0;
  private _height = 0;
  private _align = 4;
  private _wrap = false;
  private _capability: SolverCapability = "tactical";
  private _hasBook = false;
  private _isReady = false;
  private _isSwitching = false;

  // ── Public accessors ───────────────────────────────────────────────────────

  get width(): number {
    return this._width;
  }
  get height(): number {
    return this._height;
  }
  get align(): number {
    return this._align;
  }
  get wrap(): boolean {
    return this._wrap;
  }

  /**
   * Analysis quality for the current board size.
   *
   * - `'exact'`    Perfect minimax. Applies to small boards (w<7 && h<7) and
   *                boards with an embedded or user-supplied opening book.
   * - `'nnue'`     High-quality heuristic with trained NNUE evaluation.
   * - `'tactical'` Tactical-only heuristic (no NNUE). Detect wins/losses within
   *                search depth only. Analysis is not recommended; pass a
   *                timeoutMs to analyze() or it will throw.
   */
  get capability(): SolverCapability {
    return this._capability;
  }

  /** True if an opening book is active (embedded or custom). */
  get hasBook(): boolean {
    return this._hasBook;
  }

  /** True once setBoard() has completed successfully. */
  get isReady(): boolean {
    return this._isReady;
  }

  /** The cache size actually allocated (in MB). */
  get allocatedCacheSizeMb(): number {
    return this._solver
      ? this._solver.allocatedCacheSizeMb
      : (this._opts.cacheSizeMb ?? 128);
  }

  // ── Constructor ────────────────────────────────────────────────────────────

  constructor(opts?: AdaptiveSolverOptions) {
    this._opts = opts ?? {};
  }

  // ── Board switching ────────────────────────────────────────────────────────

  /**
   * Switch to a new board size. Handles teardown and reinit automatically:
   *
   * 1. Stops any in-flight search (awaits settlement).
   * 2. Releases old solver + cache.
   * 3. Determines solver type upfront from board size + embedded book table.
   * 4. Inits new solver.
   * 5. Loads embedded book if available (zero network cost).
   * 6. Calls bookLoader (if provided); non-null result replaces embedded book.
   */
  async setBoard(
    width: number,
    height: number,
    align = 4,
    wrap = false,
  ): Promise<void> {
    this._isSwitching = true;
    this._isReady = false;

    // 1. Stop and release old solver
    if (this._solver) {
      await this._solver.stop();
      this._solver.release();
      this._solver = null;
    }

    this._width = width;
    this._height = height;
    this._align = align;
    this._wrap = wrap;
    this._hasBook = false;

    // 2. Determine solver type upfront — no solver recreation needed.
    //    Small boards and embedded-book boards always get an exact solver.
    //    Everything else gets a heuristic solver.
    const willHaveEmbeddedBook = hasEmbeddedBook(width, height, align, wrap);
    const useHeuristic = !(width < 7 && height < 7) && !willHaveEmbeddedBook;

    // 3. Create and init solver
    const solverOpts: Connect4SolverOptions = {
      width,
      height,
      align,
      wrap,
      cacheSizeMb: this._opts.cacheSizeMb ?? 128,
      heuristic: useHeuristic,
    };
    this._solver = await this._createSolver(solverOpts);
    await this._solver.init();

    // 4. Embedded books are loaded transparently in C++.
    //    Set hasBook from compile-time knowledge — no runtime call needed.
    if (willHaveEmbeddedBook) {
      this._hasBook = true;
    }

    // 5. Call user's bookLoader — overrides embedded book if non-null
    if (this._opts.bookLoader) {
      try {
        const custom = await this._opts.bookLoader(width, height, align, wrap);
        if (custom && custom.byteLength > 0) {
          await this._solver.loadBook(custom);
          this._hasBook = true;
        }
      } catch (err) {
        console.warn(
          `AdaptiveSolver: bookLoader failed for ${width}x${height}:`,
          err,
        );
      }
    }

    // 6. Finalize capability (book state is now settled)
    this._capability = getSolverCapability(
      width,
      height,
      this._hasBook,
      align,
      wrap,
    );

    this._isReady = true;
    this._isSwitching = false;
  }

  // ── Analysis ───────────────────────────────────────────────────────────────

  /**
   * Analyze all moves at the given position.
   *
   * For heuristic searches (capability='nnue'|'tactical'), running without a timeout
   * is allowed but will trigger a console warning, as deep searches on large boards
   * can take a long time or block indefinitely.
   */
  async analyze(
    position: string,
    opts?: AnalyzeOptions,
  ): Promise<PositionAnalysis> {
    this._assertReady();
    if (!this._solver)
      throw new Error(
        "AdaptiveSolver: solver unexpectedly null after assertReady.",
      );
    return this._solver.analyze(position, this._withDefaults(opts));
  }

  /**
   * Find the best single move at the given position. Same routing as analyze().
   */
  async solve(
    position: string,
    opts?: AnalyzeOptions,
  ): Promise<PositionAnalysis> {
    this._assertReady();
    if (!this._solver)
      throw new Error(
        "AdaptiveSolver: solver unexpectedly null after assertReady.",
      );
    return this._solver.solve(position, this._withDefaults(opts));
  }

  /**
   * Replace the active book with a custom one.
   * Must not be called while a search is running — call stop() first.
   */
  async loadBook(data: Uint8Array): Promise<void> {
    if (!this._solver) throw new Error("Call setBoard() before loadBook().");
    await this._solver.loadBook(data);
    this._hasBook = true;
    this._capability = getSolverCapability(
      this._width,
      this._height,
      true,
      this._align,
      this._wrap,
    );
  }

  /**
   * Abort any in-flight search. Returns a Promise that resolves once settled.
   */
  stop(): Promise<void> {
    if (!this._solver) return Promise.resolve();
    return this._solver.stop();
  }

  /**
   * Release all resources. The instance is unusable after this call.
   */
  async destroy(): Promise<void> {
    if (this._solver) {
      await this._solver.stop();
      this._solver.release();
      this._solver = null;
    }
    this._isReady = false;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _assertReady(): void {
    if (!this._isReady || !this._solver) {
      if (this._isSwitching) {
        throw new Error(
          "AdaptiveSolver: board switch in progress. Await setBoard() before analyzing.",
        );
      }
      throw new Error("AdaptiveSolver: call setBoard() first.");
    }
  }

  private _withDefaults(opts?: AnalyzeOptions): AnalyzeOptions {
    const timeout = opts?.timeoutMs ?? this._opts.defaultTimeoutMs ?? 5000;

    if (this._capability !== "exact" && timeout === 0) {
      console.warn(
        `AdaptiveSolver: Running a heuristic search (${this._capability}) without a timeout limit ` +
          `can cause the engine to search indefinitely on complex positions. It is highly recommended to specify a timeout.`,
      );
    }

    return {
      ...opts,
      timeoutMs: timeout,
    };
  }

  /**
   * Creates the appropriate concrete solver for the current JS environment.
   * Mirrors the env-detection logic in createSolver() (index.ts) so consumers
   * don't need to think about which class to instantiate.
   */
  private async _createSolver(
    opts: Connect4SolverOptions,
  ): Promise<BaseConnect4Solver> {
    const isReactNative =
      typeof navigator !== "undefined" && navigator.product === "ReactNative";

    if (isReactNative) {
      const { ReactNativeConnect4Solver } = await import("./native.js");
      return new ReactNativeConnect4Solver(opts);
    }

    if (typeof process !== "undefined" && process?.versions?.node) {
      const { NodeConnect4Solver } = await import("./node.js");
      return new NodeConnect4Solver(opts);
    }

    const supportsSAB =
      typeof self !== "undefined" &&
      ((self as unknown as { crossOriginIsolated?: boolean })
        .crossOriginIsolated ??
        typeof SharedArrayBuffer !== "undefined");

    if (this._opts.workerProvider) {
      if (supportsSAB) {
        const { WebWorkerWasmConnect4Solver } = await import("./async.js");
        return new WebWorkerWasmConnect4Solver(this._opts.workerProvider, opts);
      } else {
        const { WebWorkerWasmNoSABConnect4Solver } = await import("./async.js");
        return new WebWorkerWasmNoSABConnect4Solver(
          this._opts.workerProvider,
          opts,
        );
      }
    }

    if (supportsSAB) {
      const { SyncWasmConnect4Solver } = await import("./threaded.js");
      return new SyncWasmConnect4Solver(opts);
    }

    const { SyncWasmNoSABConnect4Solver } = await import("./sync.js");
    return new SyncWasmNoSABConnect4Solver(opts);
  }
}
