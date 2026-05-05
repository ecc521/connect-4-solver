/* eslint-disable */
import { OpeningBook } from "./index.js";
import { getNativeModule } from "./node.js";

describe("Opening Book Key Resizing", () => {
  const native = getNativeModule() as any;

  if (!native) {
    test.skip("Native module not found, skipping resizing tests", () => {
      expect(true).toBe(true);
    });
    return;
  }

  test("should expand key width in DenseBook to prevent collisions", () => {
    // 1. Create a book with a small key (fits in default 4 bytes for 7x6 depth 10)
    const b1 = new native.BookBuilder(7, 6, 10);
    b1.add(BigInt(1), 0);
    const buf1 = b1.getDenseBuffer();

    // Header (6) + Key (4) + Value (1) = 11 bytes
    expect(buf1.length).toBe(11);

    // 2. Create a book with a large key (needs 5 bytes)
    const b2 = new native.BookBuilder(7, 6, 10);
    b2.add(BigInt("0x1234567890"), 0); // 0x1234567890 > 0xFFFFFFFF
    const buf2 = b2.getDenseBuffer();

    // Header (6) + Key (5) + Value (1) = 12 bytes
    expect(buf2.length).toBeGreaterThan(buf1.length);
    expect(buf2.length).toBe(12);

    // 3. Verify even larger keys (8 bytes)
    const b3 = new native.BookBuilder(7, 6, 10);
    b3.add(BigInt("0x1234567890ABCDEF"), 0);
    const buf3 = b3.getDenseBuffer();

    // Header (6) + Key (8) + Value (1) = 15 bytes
    expect(buf3.length).toBe(15);
  });

  test("should handle multiple entries with varying key sizes", () => {
    const builder = new native.BookBuilder(7, 6, 10);
    builder.add(BigInt(1), 1);
    builder.add(BigInt("0xFFFFFFFFFF"), 2); // 5 bytes

    const buf = builder.getDenseBuffer();
    // Two entries, largest is 5 bytes.
    // Header (6) + 2 * (Key (5) + Value (1)) = 6 + 12 = 18 bytes
    expect(buf.length).toBe(18);
  });

  test("should clone and query books correctly", async () => {
    const b1 = new native.BookBuilder(7, 6, 10);
    b1.addPosition("4", 10);
    b1.addPosition("44", 11);

    // Save to a buffer to create a loadable book
    const buf = b1.getDenseBuffer();
    const book1 = new OpeningBook(7, 6) as any;

    // In-memory loading test
    await book1.load(buf);

    expect(book1.getScore("4")).toBe(10);
    expect(book1.getScore("44")).toBe(11);
    expect(book1.getScore("1")).toBeUndefined();

    // Cloning test: Use loadFromBook
    const b2 = new native.BookBuilder(7, 6, 10);
    b2.loadFromBook(book1.ptr);

    const buf2 = b2.getDenseBuffer();
    expect(buf2.length).toBe(buf.length);
    expect(buf2).toEqual(buf);

    book1.release();
  });
});
