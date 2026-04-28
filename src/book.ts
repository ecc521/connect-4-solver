import { SolverModule } from "./core";
import { getModuleInitPromise, getModule } from "./index";

export class OpeningBook {
  protected _ptr: number = 0;
  protected mod: SolverModule | null = null;
  public readonly width: number;
  public readonly height: number;

  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  async load(data: Uint8Array): Promise<void> {
    if (this._ptr !== 0) return;
    await getModuleInitPromise();
    this.mod = getModule();
    
    const bookFilePath = `book_${this.width}x${this.height}.book`;
    this.mod.FS.writeFile(bookFilePath, data);

    const allocatedMemory = this.mod.stringToNewUTF8(bookFilePath);
    this._ptr = this.mod._createBook(this.width, this.height, allocatedMemory);
    this.mod._free(allocatedMemory);
  }

  get ptr(): number {
    return this._ptr;
  }

  release(): void {
    if (this._ptr !== 0 && this.mod) {
      this.mod._destroyBook(this._ptr);
      this._ptr = 0;
    }
  }

  destroy(): void {
    this.release();
  }
}
