import { OpeningBook } from "../src/index.js";
import { getNativeModule } from "../src/node.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("BookBuilder Parity", () => {
  const testBook = path.join(__dirname, "test.efbook");

  afterEach(() => {
    if (fs.existsSync(testBook)) fs.unlinkSync(testBook);
  });

  test("should return the same score that was added (Human Score Identity)", async () => {
    const native = getNativeModule();
    if (!native) return; // Skip if not on Node.js

    const width = 7;
    const height = 7;
    const depth = 10;
    
    // 1. Create a book via BookBuilder
    const builder = new native.BookBuilder(width, height, depth);
    
    // We add a position with a human score of 0 (Draw)
    const humanScore = 0;
    builder.addPosition("4", humanScore);
    
    // 2. Save it
    builder.saveEliasFano(testBook);
    
    // 3. Load it via OpeningBook
    const book = await OpeningBook.fromFile(testBook, width, height);
    
    // 4. Check if we get back the same score
    const result = book.getScore("4");
    
    // If our implementation is correct, result should be 0.
    expect(result).toBe(humanScore);
    
    book.release();
  });

  test("should demonstrate failing parity when using manual encoding (current tool logic)", async () => {
    const native = getNativeModule();
    if (!native) return;

    const width = 7;
    const height = 7;
    const depth = 10;
    const minScore = -Math.floor((width * height) / 2) + 3; // -21
    
    const builder = new native.BookBuilder(width, height, depth);
    
    // Mimic the current bug in generate-book.ts:
    // It manually encodes the score before passing it to the builder.
    const humanScore = 0;
    const encodedScore = humanScore - minScore + 1; // 22
    
    builder.addPosition("4", encodedScore);
    builder.saveEliasFano(testBook);
    
    const book = await OpeningBook.fromFile(testBook, width, height);
    const result = book.getScore("4");
    
    // This will FAIL to match our original humanScore (0) 
    // because it was double-encoded and only single-decoded.
    // It will return 22 instead.
    expect(result).toBe(22);
    
    book.release();
  });
});
