import { PositionAnalysis, Connect4SolverOptions } from "./index";

export class AsyncConnect4Solver {
  private worker: Worker;
  private messageId = 0;
  private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private initPromise: Promise<void>;
  private initialized = false;

  constructor(
    worker: Worker,
    opts?: Connect4SolverOptions | number,
    heightOpt?: number
  ) {
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

    this.initPromise = this.sendMessage("init", {
      width,
      height,
      cacheSizeMb,
      heuristic,
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

  async analyze(positionStr: string, opts?: { threads?: number, maxDepth?: number, timeoutMs?: number, book?: any }): Promise<PositionAnalysis> {
    return this.sendMessage("analyze", { position: positionStr, opts });
  }

  release(): void {
    this.sendMessage("unload").catch(() => {});
  }
}
