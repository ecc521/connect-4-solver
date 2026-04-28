import { BaseConnect4Solver, PositionAnalysis } from "./core";

export class AsyncConnect4Solver extends BaseConnect4Solver {
  private worker: Worker;
  private messageId = 0;
  private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private initPromise: Promise<void>;

  constructor(
    worker: Worker,
    solverType: string = "Connect4Solver",
    widthOrOpts?: number | { width?: number; height?: number; useSharedCache?: boolean },
    heightOpt?: number
  ) {
    super(widthOrOpts as any, heightOpt);
    this.worker = worker;
    this.worker.onmessage = (e: MessageEvent) => {
      const { id, success, result, error } = e.data;
      const p = this.pendingRequests.get(id);
      if (p) {
        this.pendingRequests.delete(id);
        if (success) p.resolve(result);
        else p.reject(new Error(error));
      }
    };

    let useSharedCache = false;
    if (typeof widthOrOpts === "object" && widthOrOpts.useSharedCache) {
      useSharedCache = true;
    }

    // We send an init message but we don't wait for it here.
    // The user must explicitly call `await init()`.
    this.initPromise = this.sendMessage("init", {
      solverType,
      width: this.width,
      height: this.height,
      useSharedCache,
    });
  }

  private sendMessage(type: string, payload: any = {}): Promise<any> {
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

  analyze(positionStr: string, opts?: any): PositionAnalysis {
    throw new Error(
      "Synchronous analyze() is not available on AsyncConnect4Solver. Use analyzeAsync() instead."
    );
  }

  async analyzeAsync(positionStr: string, opts?: any): Promise<PositionAnalysis> {
    return this.sendMessage("analyze", { position: positionStr, opts });
  }

  unload(): void {
    this.sendMessage("unload").catch(() => {});
  }
}

export class AsyncThreadedConnect4Solver extends AsyncConnect4Solver {
  constructor(
    worker: Worker,
    widthOrOpts?: number | { width?: number; height?: number; useSharedCache?: boolean },
    heightOpt?: number
  ) {
    super(worker, "ThreadedConnect4Solver", widthOrOpts, heightOpt);
  }
}

export class AsyncHeuristicConnect4Solver extends AsyncConnect4Solver {
  constructor(
    worker: Worker,
    widthOrOpts?: number | { width?: number; height?: number; useSharedCache?: boolean },
    heightOpt?: number
  ) {
    super(worker, "HeuristicConnect4Solver", widthOrOpts, heightOpt);
  }
}

export class AsyncThreadedHeuristicConnect4Solver extends AsyncConnect4Solver {
  constructor(
    worker: Worker,
    widthOrOpts?: number | { width?: number; height?: number; useSharedCache?: boolean },
    heightOpt?: number
  ) {
    super(worker, "ThreadedHeuristicConnect4Solver", widthOrOpts, heightOpt);
  }
}
