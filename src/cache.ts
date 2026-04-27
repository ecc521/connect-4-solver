import { SolverModule } from "./core";

export class SolverCache {
  private _ptr: number = 0;
  private mod: SolverModule;

  constructor(mod: SolverModule, sizeBytes: number = 1024 * 1024 * 128) {
    this.mod = mod;
    this._ptr = this.mod._createCache7x6(sizeBytes);
  }

  get ptr(): number {
    return this._ptr;
  }

  release(): void {
    if (this._ptr !== 0) {
      this.mod._destroyCache7x6(this._ptr);
      this._ptr = 0;
    }
  }
}
