import {
  PositionAnalysis,
  Connect4SolverOptions,
  AnalyzeOptions,
  BaseConnect4Solver,
} from "./core.js";

export abstract class AbstractAsyncWebWorkerSolver extends BaseConnect4Solver {
  private worker: Worker;
  private messageId = 0;
  private pendingRequests = new Map<
    number,
    { resolve: (val: unknown) => void; reject: (err: unknown) => void }
  >();
  private initPromise: Promise<void>;

  constructor(
    worker: Worker,
    initType: string,
    opts?: Connect4SolverOptions | number,
    heightOpt?: number,
  ) {
    super(opts, heightOpt);
    this.worker = worker;
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

    let cacheSizeMb = 128;
    let heuristic = false;

    if (opts && typeof opts === "object") {
      if (opts.cacheSizeMb !== undefined) cacheSizeMb = opts.cacheSizeMb;
      if (opts.heuristic !== undefined) heuristic = opts.heuristic;
    }

    this.initPromise = this.sendMessage(initType, {
      width: this.width,
      height: this.height,
      cacheSizeMb,
      heuristic,
    }) as Promise<void>;
  }

  private sendMessage(type: string, payload: object = {}): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, payload });
    });
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.initPromise;
    this.initialized = true;
  }

  async loadBook(data: Uint8Array): Promise<void> {
    await this.sendMessage("loadBook", { data });
  }

  async analyze(
    positionStr: string,
    opts?: AnalyzeOptions,
  ): Promise<PositionAnalysis> {
    return this.sendMessage("analyze", {
      position: positionStr,
      opts,
    }) as Promise<PositionAnalysis>;
  }

  async solve(
    positionStr: string,
    opts?: AnalyzeOptions & { weak?: boolean },
  ): Promise<PositionAnalysis> {
    return this.sendMessage("solve", {
      position: positionStr,
      opts,
    }) as Promise<PositionAnalysis>;
  }

  /**
   * NOTE: This is ineffective in WASM as the worker thread is blocked.
   * Use timeoutMs to guarantee a max search time.
   */
  stop(): void {
    this.sendMessage("stop").catch(() => {
      /* ignore */
    });
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
    worker: Worker,
    opts?: Connect4SolverOptions | number,
    heightOpt?: number,
  ) {
    super(worker, "init-threaded", opts, heightOpt);
  }
}

export class WebWorkerWasmNoSABConnect4Solver extends AbstractAsyncWebWorkerSolver {
  constructor(
    worker: Worker,
    opts?: Connect4SolverOptions | number,
    heightOpt?: number,
  ) {
    super(worker, "init-nosab", opts, heightOpt);
  }
}
