import {
  PositionAnalysis,
  Connect4SolverOptions,
  AnalyzeOptions,
  BaseConnect4Solver,
  SolverAbortedError,
  Player,
} from "./core.js";


export abstract class AbstractAsyncWebWorkerSolver extends BaseConnect4Solver {
  private worker: Worker;
  private workerProvider: () => Worker;
  private initType: string;
  private initPayload: {
    width: number;
    height: number;
    cacheSizeMb: number;
    heuristic: boolean;
  };
  private loadedBookData: Uint8Array | null = null;
  private messageId = 0;
  private pendingRequests = new Map<
    number,
    {
      type: string;
      position?: string;
      resolve: (val: unknown) => void;
      reject: (err: unknown) => void;
    }
  >();
  private initPromise: Promise<void>;

  constructor(
    workerProvider: () => Worker,
    initType: string,
    opts?: Connect4SolverOptions | number,
    heightOpt?: number,
  ) {
    super(opts, heightOpt);
    this.workerProvider = workerProvider;
    this.initType = initType;
    this.worker = workerProvider();

    this.setupWorkerListener();

    let cacheSizeMb = 128;
    let heuristic = false;

    if (opts && typeof opts === "object") {
      if (opts.cacheSizeMb !== undefined) cacheSizeMb = opts.cacheSizeMb;
      if (opts.heuristic !== undefined) heuristic = opts.heuristic;
    }

    this.allocatedCacheSizeMb = cacheSizeMb; // updated after init resolves
    this.initPayload = {
      width: this.width,
      height: this.height,
      cacheSizeMb,
      heuristic,
    };

    this.initPromise = this.sendMessage(
      initType,
      this.initPayload,
    ) as Promise<void>;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.initPromise;
    this.initialized = true;
  }

  private setupWorkerListener(): void {
    this.worker.onmessage = (
      e: MessageEvent<{
        id: number;
        success: boolean;
        result: unknown;
        error: string;
        allocatedCacheSizeMb?: number;
      }>,
    ): void => {
      const { id, success, result, error, allocatedCacheSizeMb } = e.data;
      if (allocatedCacheSizeMb !== undefined) {
        this.allocatedCacheSizeMb = allocatedCacheSizeMb;
      }
      const p = this.pendingRequests.get(id);
      if (p) {
        this.pendingRequests.delete(id);
        if (success) p.resolve(result);
        else p.reject(new Error(error));
      }
    };
  }

  private sendMessage(type: string, payload: object = {}): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const position =
        "position" in payload
          ? (payload as { position?: string }).position
          : undefined;
      this.pendingRequests.set(id, { type, position, resolve, reject });
      this.worker.postMessage({ id, type, payload });
    });
  }

  async loadBook(data: Uint8Array): Promise<void> {
    if (this._isBusy || this._queue.length > 0) {
      throw new Error(
        "Cannot load a book while a search is active or queued. Call stop() and await it first.",
      );
    }
    this.loadedBookData = data;
    await this.sendMessage("loadBook", { data });
  }

  async analyze(
    positionStr: string,
    opts?: AnalyzeOptions,
  ): Promise<PositionAnalysis> {
    await this.init();
    return this.runTask(
      () =>
        this.sendMessage("analyze", {
          position: positionStr,
          opts,
        }) as Promise<PositionAnalysis>,
    );
  }

  async solve(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Promise<PositionAnalysis> {
    await this.init();
    return this.runTask(
      () =>
        this.sendMessage("solve", {
          position: positionStr,
          opts,
        }) as Promise<PositionAnalysis>,
    );
  }

  /**
   * Sends the abort signal to the WASM worker.
   * For WASM, the worker thread is blocked during search, so we must terminate
   * and restart it. Pending worker-level promises (inside sendMessage) are
   * resolved with an aborted result so the outer runTask() task returns cleanly,
   * which in turn settles _taskSettledPromise (letting stop() resolve).
   */
  protected _sendAbortSignal(): void {
    // Soft stop: if nothing is actually searching, just send a stop message
    let hasActiveSearch = false;
    for (const req of this.pendingRequests.values()) {
      if (req.type === "analyze" || req.type === "solve") {
        hasActiveSearch = true;
        break;
      }
    }

    if (!hasActiveSearch) {
      this.sendMessage("stop").catch(() => { /* ignore */ });
      return;
    }

    // Hard stop: terminate the blocked worker
    this.worker.terminate();

    // Resolve the pending worker-level search request with an aborted result.
    // This causes the sendMessage() Promise (inside runTask's task) to resolve,
    // which lets _executeTask() finish and settle _taskSettledPromise.
    for (const req of this.pendingRequests.values()) {
      if (req.type === "analyze" || req.type === "solve") {
        const nbMoves = req.position ? req.position.length : 0;
        const currentPlayer = nbMoves % 2 === 0 ? Player.P1 : Player.P2;
        req.resolve({
          position: req.position ?? "",
          originalPosition: req.position ?? "",
          currentPlayer,
          evaluation: null,
          moveOptions: [],
          isHeuristic: this.initPayload.heuristic,
          aborted: true,
        } satisfies PositionAnalysis);
      } else {
        req.reject(new SolverAbortedError());
      }
    }
    this.pendingRequests.clear();

    // Restart the worker and re-initialize
    this.worker = this.workerProvider();
    this.setupWorkerListener();

    const newInitPromise = this.sendMessage(
      this.initType,
      this.initPayload,
    ) as Promise<void>;

    // Re-load book if one was previously loaded
    if (this.loadedBookData) {
      const bookData = this.loadedBookData;
      this.initPromise = newInitPromise
        .then(() => this.sendMessage("loadBook", { data: bookData }))
        .then(() => { /* void */ });
    } else {
      this.initPromise = newInitPromise;
    }
    this.initialized = false;
  }

  release(): void {
    this.sendMessage("unload").catch(() => {
      /* ignore */
    });
    this.worker.terminate();
    this.initialized = false;
  }

  async getNodeCount(): Promise<number> {
    return this.sendMessage("getNodeCount") as Promise<number>;
  }
}

export class WebWorkerWasmConnect4Solver extends AbstractAsyncWebWorkerSolver {
  constructor(
    workerProvider: () => Worker,
    opts?: Connect4SolverOptions | number,
    heightOpt?: number,
  ) {
    super(workerProvider, "init-threaded", opts, heightOpt);
  }
}

export class WebWorkerWasmNoSABConnect4Solver extends AbstractAsyncWebWorkerSolver {
  constructor(
    workerProvider: () => Worker,
    opts?: Connect4SolverOptions | number,
    heightOpt?: number,
  ) {
    super(workerProvider, "init-nosab", opts, heightOpt);
  }
}
