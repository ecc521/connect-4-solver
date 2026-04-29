import { SolverModule } from "./core";
import {
  getNoSABModuleInitPromise,
  getNoSABModule,
  getNativeModule,
} from "./index";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export class OpeningBook {
  protected _ptr = 0;
  protected mod: SolverModule | null = null;
  public readonly width: number;
  public readonly height: number;

  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  static async fromBuffer(data: Uint8Array): Promise<OpeningBook> {
    if (data.length < 6) {
      throw new Error(
        "Invalid Connect 4 opening book: file is too small to contain a header.",
      );
    }
    const width = data[0];
    const height = data[1];
    const book = new OpeningBook(width, height);
    await book.load(data);
    return book;
  }

  async load(data: Uint8Array): Promise<void> {
    if (this._ptr !== 0) return;

    const native = getNativeModule();
    if (native) {
      const bookFilePath = path.join(
        os.tmpdir(),
        `book_${this.width}x${this.height}_${Date.now()}.book`,
      );
      fs.writeFileSync(bookFilePath, data);
      this._ptr = native._createBook(
        this.width,
        this.height,
        bookFilePath,
      ) as number;
      return;
    }

    await getNoSABModuleInitPromise();
    this.mod = getNoSABModule();

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
    if (this._ptr !== 0) {
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

  unload(): void {
    this.release();
  }
}
