import {
  PositionAnalysis,
  Connect4SolverOptions,
  AnalyzeOptions,
  BaseConnect4Solver,
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
      }>,
    ): void => {
      const { id, success, result, error } = e.data;
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
    this.loadedBookData = data;
    await this.runTask(() => this.sendMessage("loadBook", { data }));
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
   * Forcibly terminates the worker thread and re-creates it.
   * This is the only way to stop a blocking WASM search in a Web Worker.
   *
   * Pending analyze/solve requests will resolve with { aborted: true }.
   */
  stop(): void {
    // 1. Check if there is actually a search to stop
    let activeSearchRequest = null;
    for (const req of this.pendingRequests.values()) {
      if (req.type === "analyze" || req.type === "solve") {
        activeSearchRequest = req;
        break;
      }
    }

    if (!activeSearchRequest) {
      // Soft Stop: If no search is running, just send a stop message.
      // This avoids the expensive 200ms worker reboot overhead.
      this.sendMessage("stop").catch(() => {
        /* ignore */
      });
      return;
    }

    // Hard Stop: Terminate the blocked worker
    this.worker.terminate();

    // Resolve pending analyze/solve requests with an aborted result object
    for (const req of this.pendingRequests.values()) {
      if (req.type === "analyze" || req.type === "solve") {
        const nbMoves = req.position ? req.position.length : 0;
        const currentPlayer = nbMoves % 2 === 0 ? Player.P1 : Player.P2;

        const abortedResult: PositionAnalysis = {
          position: req.position ?? "",
          originalPosition: req.position ?? "",
          currentPlayer,
          evaluation: null,
          moveOptions: [],
          isHeuristic: this.initPayload.heuristic,
          aborted: true,
        };
        req.resolve(abortedResult);
      } else {
        req.reject(new Error("Worker terminated due to stop() signal."));
      }
    }
    this.pendingRequests.clear();

    // Restart the worker
    this.worker = this.workerProvider();
    this.setupWorkerListener();

    // Re-initialize
    const newInitPromise = this.sendMessage(
      this.initType,
      this.initPayload,
    ) as Promise<void>;

    // If book was loaded, re-load it
    if (this.loadedBookData) {
      const bookData = this.loadedBookData;
      this.initPromise = newInitPromise
        .then(() => this.sendMessage("loadBook", { data: bookData }))
        .then(() => {
          /* void */
        });
    } else {
      this.initPromise = newInitPromise;
    }
    this.initialized = false;
  }

  release(): void {
    this.sendMessage("unload").catch(() => {
      /* ignore */
    });
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
