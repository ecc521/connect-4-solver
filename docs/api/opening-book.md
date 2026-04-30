# OpeningBook

The `OpeningBook` class is a high-performance database object containing pre-calculated, mathematically proven, exact solutions for early-game Connect 4 positions.

## Initialization

Unlike solvers, OpeningBooks cannot be instantiated blindly; they must be generated, loaded from disk, or loaded from an existing `Uint8Array` buffer.

```typescript
import { OpeningBook } from "connect-4-solver";

// Load from a file path (Node.js/Native only)
const book = await OpeningBook.fromFile("path/to/7x6.book", 7, 6);

// Load from a Uint8Array buffer (WASM/Browser/Node.js)
const bufferBook = await OpeningBook.fromBuffer(myBuffer);
```

## API Reference

### `getScore(position: string): number | undefined`

Allows querying the Opening Book directly, bypassing the solver entirely.

- **Parameters:**
  - `position` (`string`): The 1-indexed string representation of the Connect 4 moves played so far (e.g. `"444"`).
- **Returns:**
  - `number`: The raw evaluation score if the position exists in the book (positive = current player winning).
  - `undefined`: If the position is not in the Opening Book.

### `convertToDense(): void`

Converts the loaded book into the "Dense" format in-memory.

Dense books trade file size for speed. This takes significantly more RAM but allows for blisteringly fast query lookups.
If the book is already in the Dense format, this does nothing.

### `convertToEliasFano(): void`

Converts the loaded book into the "Elias-Fano" format in-memory.

Elias-Fano books provide unparalleled compression, using ~4x less RAM than their Dense counterparts, at the cost of slightly slower query latency.
If the book is already in the Elias-Fano format, this does nothing.

### `saveToFile(path: string): Promise<void>`

Saves the current OpeningBook instance to a local file.

- **Parameters:**
  - `path` (`string`): The destination file path.

### `toBuffer(): Uint8Array`

Serializes the entire Opening Book into a `Uint8Array`.

This is incredibly useful for sending a large Opening Book from a Node.js backend to a Web Worker, or manually caching the serialized book in indexedDB.

### `unload(): void`

Explicitly unloads the book from memory.

**Important:** Because the book resides in WASM or Native C++ memory, JavaScript's Garbage Collector cannot clean it up automatically. You _must_ call `unload()` when you are done using the book to prevent memory leaks.
