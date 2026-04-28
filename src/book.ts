import { SolverModule } from "./core";
import { getModuleInitPromise, getModule } from "./index";

export class OpeningBook {
  protected _ptr: any = 0;
  protected mod: SolverModule | null = null;
  public readonly width: number;
  public readonly height: number;

  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  async load(data: Uint8Array): Promise<void> {
    if (this._ptr !== 0) return;
    
    const { getNativeModule } = require("./index");
    const native = getNativeModule();
    if (native) {
      const fs = require("fs");
      const path = require("path");
      const os = require("os");
      const bookFilePath = path.join(os.tmpdir(), `book_${this.width}x${this.height}_${Date.now()}.book`);
      fs.writeFileSync(bookFilePath, data);
      this._ptr = native._createBook(this.width, this.height, bookFilePath);
      return;
    }

    await getModuleInitPromise();
    this.mod = getModule();
    
    const bookFilePath = `book_${this.width}x${this.height}.book`;
    this.mod.FS.writeFile(bookFilePath, data);

    const allocatedMemory = this.mod.stringToNewUTF8(bookFilePath);
    this._ptr = this.mod._createBook(this.width, this.height, allocatedMemory);
    this.mod._free(allocatedMemory);
  }

  get ptr(): any {
    return this._ptr;
  }

  release(): void {
    if (this._ptr !== 0) {
      const { getNativeModule } = require("./index");
      const native = getNativeModule();
      if (native) {
        native._destroyBook(this.width, this.height, this._ptr);
      } else if (this.mod) {
        this.mod._destroyBook(this.width, this.height, this._ptr);
      }
      this._ptr = 0;
    }
  }

  destroy(): void {
    this.release();
  }
}
