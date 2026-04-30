import { PositionAnalysis, Connect4SolverOptions } from "./index";

export abstract class AbstractAsyncWebWorkerSolver {
  private worker: Worker;
  private messageId = 0;
  private pendingRequests = new Map<
    number,
    { resolve: (val: unknown) => void; reject: (err: unknown) => void }
  >();
  private initPromise: Promise<void>;
  private initialized = false;

  constructor(
    worker: Worker,
    initType: string,
    opts?: Connect4SolverOptions | number,
    heightOpt?: number,
  ) {
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

    let width = 7;
    let height = 6;
    let cacheSizeMb = 128;
    let heuristic = false;

    if (typeof opts === "number") {
      width = opts;
      if (heightOpt !== undefined) height = heightOpt;
    } else if (opts && typeof opts === "object") {
      if (opts.width !== undefined) width = opts.width;
      if (opts.height !== undefined) height = opts.height;
      if (opts.cacheSizeMb !== undefined) cacheSizeMb = opts.cacheSizeMb;
      if (opts.heuristic !== undefined) heuristic = opts.heuristic;
    }

    this.initPromise = this.sendMessage(initType, {
      width,
      height,
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
    opts?: {
      threads?: number;
      maxDepth?: number;
      timeoutMs?: number;
      book?: unknown;
    },
  ): Promise<PositionAnalysis> {
    return this.sendMessage("analyze", {
      position: positionStr,
      opts,
    }) as Promise<PositionAnalysis>;
  }

  async solve(
    positionStr: string,
    opts?: {
      weak?: boolean;
      maxDepth?: number;
      timeoutMs?: number;
      book?: unknown;
    },
  ): Promise<PositionAnalysis> {
    return this.sendMessage("solve", {
      position: positionStr,
      opts,
    }) as Promise<PositionAnalysis>;
  }

  release(): void {
    this.sendMessage("unload").catch(() => {
      /* ignore */
    });
  }

  unload(): void {
    this.release();
  }

  getNodeCount(): number {
    return 0; // Async worker doesn't support synchronous node count
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
