import { SolverModule } from "./core";
import { getNativeModule } from "./node";
import { getNoSABModule, getNoSABModuleInitPromise } from "./sync";

export class OpeningBook {
  protected _ptr = 0;
  protected mod: SolverModule | null = null;
  public readonly width: number;
  public readonly height: number;
  private _format: "dense" | "elias-fano" | "unknown" = "unknown";

  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  get format(): "dense" | "elias-fano" | "unknown" {
    if (this._format === "unknown" && this._ptr !== 0) {
      const native = getNativeModule();
      if (native) {
        this._format = native._getBookFormat(
          this.width,
          this.height,
          this._ptr,
        ) as "dense" | "elias-fano";
      } else if (this.mod) {
        const fmtStrPtr = this.mod._getBookFormat(
          this.width,
          this.height,
          this._ptr,
        );
        this._format = this.mod.UTF8ToString(fmtStrPtr) as
          | "dense"
          | "elias-fano";
        this.mod._free(fmtStrPtr);
      }
    }
    return this._format;
  }

  static async fromFile(
    path: string,
    w: number,
    h: number,
  ): Promise<OpeningBook> {
    const book = new OpeningBook(w, h);
    await book.loadFromFile(path);
    return book;
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
    await book.loadFromBuffer(data);
    return book;
  }

  async loadFromFile(path: string): Promise<void> {
    if (this._ptr !== 0) return;
    const native = getNativeModule();
    if (native) {
      this._ptr = native._createBook(this.width, this.height, path) as number;
      if (!this._ptr)
        throw new Error("Failed to load opening book from file natively.");
      return;
    }
    // Read via fs requires fs import, we need to import fs dynamically or just let it fail if in browser.
    let fs;
    try {
      fs = await import("fs");
    } catch {
      throw new Error("loadFromFile requires Node.js fs module.");
    }
    const data = fs.readFileSync(path);
    await this.loadFromBuffer(data);
  }

  async loadFromBuffer(data: Uint8Array): Promise<void> {
    if (this._ptr !== 0) return;
    const native = getNativeModule();
    if (native) {
      this._ptr = native._createBookFromBuffer(
        this.width,
        this.height,
        data,
      ) as number;
      if (!this._ptr)
        throw new Error("Failed to load opening book from buffer natively.");
      return;
    }

    await getNoSABModuleInitPromise();
    this.mod = getNoSABModule();
    if (!this.mod) throw new Error("WASM module not initialized.");
    const ptr = this.mod._malloc(data.length);
    this.mod.HEAPU8.set(data, ptr);
    this._ptr = this.mod._createBookFromBuffer(
      this.width,
      this.height,
      ptr,
      data.length,
    );
    this.mod._free(ptr);
  }

  convertToDense(): void {
    if (this.format === "dense") return;
    const native = getNativeModule();
    if (native) {
      const newPtr = native._convertBookToDense(
        this.width,
        this.height,
        this._ptr,
      ) as number;
      native._destroyBook(this.width, this.height, this._ptr);
      this._ptr = newPtr;
      this._format = "dense";
    } else if (this.mod) {
      const newPtr = this.mod._convertBookToDense(
        this.width,
        this.height,
        this._ptr,
      );
      this.mod._destroyBook(this.width, this.height, this._ptr);
      this._ptr = newPtr;
      this._format = "dense";
    }
  }

  convertToEliasFano(): void {
    if (this.format === "elias-fano") return;
    const native = getNativeModule();
    if (native) {
      const newPtr = native._convertBookToEF(
        this.width,
        this.height,
        this._ptr,
      ) as number;
      native._destroyBook(this.width, this.height, this._ptr);
      this._ptr = newPtr;
      this._format = "elias-fano";
    } else if (this.mod) {
      const newPtr = this.mod._convertBookToEF(
        this.width,
        this.height,
        this._ptr,
      );
      this.mod._destroyBook(this.width, this.height, this._ptr);
      this._ptr = newPtr;
      this._format = "elias-fano";
    }
  }

  getScore(position: string): number | undefined {
    const native = getNativeModule();
    if (native) {
      return native._getBookScore(this.width, this.height, this._ptr, position);
    } else if (this.mod) {
      const posPtr = this.mod.stringToNewUTF8(position);
      try {
        const score = this.mod._getBookScore(
          this.width,
          this.height,
          this._ptr,
          posPtr,
        );
        if (score <= -32000 || score >= 32000) return undefined;
        return score;
      } finally {
        this.mod._free(posPtr);
      }
    }
    return undefined;
  }

  async saveToFile(path: string): Promise<void> {
    const native = getNativeModule();
    if (native) {
      native._saveBookToFile(
        this.width,
        this.height,
        this._ptr,
        path,
        this.format,
      );
    } else {
      const buf = this.toBuffer();
      let fs;
      try {
        fs = await import("fs");
      } catch {
        throw new Error("saveToFile requires Node.js fs module.");
      }
      fs.writeFileSync(path, buf);
    }
  }

  toBuffer(): Uint8Array {
    const native = getNativeModule();
    if (native) {
      return native._getBookBuffer(
        this.width,
        this.height,
        this._ptr,
        this.format,
      );
    } else if (this.mod) {
      throw new Error("toBuffer is not supported via WASM yet.");
    }
    return new Uint8Array();
  }

  async load(data: Uint8Array): Promise<void> {
    return this.loadFromBuffer(data);
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
      this._format = "unknown";
    }
  }

  destroy(): void {
    this.release();
  }

  unload(): void {
    this.release();
  }
}
