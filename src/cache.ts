import { SolverModule } from "./core";
import { getModuleInitPromise, getModule } from "./index";

export class SolverCache {
  protected _ptr: number = 0;
  protected mod: SolverModule | null = null;
  public readonly width: number;
  public readonly height: number;
  public readonly is_heuristic: boolean;
  public readonly sizeBytes: number;

  constructor(
    w: number,
    h: number,
    sizeBytes: number = 1024 * 1024 * 128,
    is_heuristic: boolean = false
  ) {
    this.width = w;
    this.height = h;
    this.sizeBytes = sizeBytes;
    this.is_heuristic = is_heuristic;
  }

  async init(): Promise<void> {
    if (this._ptr !== 0) return;
    await getModuleInitPromise();
    this.mod = getModule();
    this._ptr = this.mod._createCache(this.width, this.height, this.sizeBytes, this.is_heuristic);
  }


  get ptr(): number {
    return this._ptr;
  }

  release(): void {
    if (this._ptr !== 0 && this.mod) {
      this.mod._destroyCache(this._ptr);
      this._ptr = 0;
    }
  }
  
  destroy(): void {
    this.release();
  }
}

export class HeuristicSolverCache extends SolverCache {
  constructor(w: number, h: number, sizeBytes: number = 1024 * 1024 * 128) {
    super(w, h, sizeBytes, true);
  }
}
