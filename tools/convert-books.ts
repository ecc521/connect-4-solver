/**
 * One-time converter: book format v1 → v2
 *
 * Reads all .book / .efbook files in data/ (old 6-byte header),
 * re-encodes them with the new 18-byte v2 header, and writes them
 * back in-place (or to a --out-dir if specified).
 *
 * After conversion, re-run gen_embedded_books.py to regenerate embedded_books.hpp.
 *
 * Usage:
 *   npx tsx tools/convert-books.ts [--out-dir <dir>] [--dry-run]
 */

import * as fs from "fs";
import * as path from "path";

const BOOK_MAGIC_0 = 0xc4;
const BOOK_MAGIC_1 = 0x42;
const BOOK_VERSION = 0x02;

const FLAG_STORAGE_DENSE = 0x00;
const FLAG_STORAGE_EF    = 0x01;
const FLAG_KIND_EXACT    = 0x00;

function readUint64LE(buf: Buffer, offset: number): bigint {
  return buf.readBigUInt64LE(offset);
}

function writeUint64LE(value: bigint): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(value);
  return b;
}

function convertV1ToV2(srcPath: string): Buffer {
  const src = fs.readFileSync(srcPath);
  if (src.length < 6) throw new Error(`File too short: ${srcPath}`);

  // Detect already-converted files
  if (src[0] === BOOK_MAGIC_0 && src[1] === BOOK_MAGIC_1) {
    if (src[2] === BOOK_VERSION) {
      console.log(`  already v2, skipping`);
      return src;
    }
    throw new Error(`Unknown magic version ${src[2]}`);
  }

  // Parse old 6-byte header
  const width      = src[0];
  const height     = src[1];
  const depth      = src[2];
  const keyBytes   = src[3]; // 0 = EF, N = dense key width
  const valueBytes = src[4]; // always 1 in v1
  const logSize    = src[5]; // 0xFF = EF, 0x00 = dense

  if (valueBytes !== 1) throw new Error(`Unexpected value_bytes=${valueBytes} in v1 book`);

  const isEF = logSize === 0xff;
  const align = 4;  // all v1 books are standard C4 (align=4, wrap=false)
  const wrap  = false;

  // Build new 18-byte header
  function makeV2Header(storage: number, numEntries: bigint, finalKeyBytes: number): Buffer {
    const hdr = Buffer.alloc(18);
    hdr[0]  = BOOK_MAGIC_0;
    hdr[1]  = BOOK_MAGIC_1;
    hdr[2]  = BOOK_VERSION;
    hdr[3]  = width;
    hdr[4]  = height;
    hdr[5]  = depth;
    hdr[6]  = storage | FLAG_KIND_EXACT | (wrap ? 0x10 : 0);
    hdr[7]  = align;
    hdr[8]  = finalKeyBytes;
    hdr[9]  = 1; // value_bytes = 1 (Exact)
    writeUint64LE(numEntries).copy(hdr, 10);
    return hdr;
  }

  const body = src.slice(6); // everything after the old header

  if (isEF) {
    // Old EF sub-header: num_entries(8) + U(8) + L(1) = 17 bytes
    if (body.length < 17) throw new Error("EF body too short");
    const numEntries = readUint64LE(body, 0);
    // U and L are at offsets 8 and 16; the rest is upper_bits, lower_bits, values
    const efSubHeader = body.slice(8); // drop num_entries (moves to main header)

    const newHeader = makeV2Header(FLAG_STORAGE_EF, numEntries, 0);
    return Buffer.concat([newHeader, efSubHeader]);
  } else {
    // Dense: num_entries derived from file size
    const entrySize = keyBytes + 1;
    const numEntries = BigInt(Math.floor((src.length - 6) / entrySize));
    const newHeader = makeV2Header(FLAG_STORAGE_DENSE, numEntries, keyBytes);
    // Body is unchanged: keys then values
    return Buffer.concat([newHeader, body]);
  }
}

function main() {
  const args = process.argv.slice(2);
  const outDirIdx = args.indexOf("--out-dir");
  const outDir = outDirIdx >= 0 ? args[outDirIdx + 1] : null;
  const dryRun = args.includes("--dry-run");

  const dataDir = path.join(path.dirname(path.dirname(process.argv[1])), "data");
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith(".book") || f.endsWith(".efbook"));

  if (files.length === 0) {
    console.log("No .book / .efbook files found in data/");
    return;
  }

  let converted = 0, skipped = 0, failed = 0;

  for (const file of files) {
    const srcPath = path.join(dataDir, file);
    // Output always as .book (v2 format is self-describing; extension is purely cosmetic)
    const baseName = file.replace(/\.(e?f?book)$/, ".book");
    const destPath = outDir ? path.join(outDir, baseName) : srcPath.replace(/\.(e?f?book)$/, ".book");

    process.stdout.write(`  ${file} → ${path.basename(destPath)} ... `);
    try {
      const result = convertV1ToV2(srcPath);
      if (!dryRun) {
        fs.writeFileSync(destPath, result);
        // Remove old file if name changed
        if (destPath !== srcPath) fs.unlinkSync(srcPath);
      }
      converted++;
    } catch (e: any) {
      console.log(`FAILED: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${converted} converted, ${skipped} skipped, ${failed} failed`);
  if (!dryRun) {
    console.log("\nNext step: regenerate embedded books:");
    console.log("  python3 tools/gen_embedded_books.py");
  }
}

main();
