/**
 * Convert a dense .book to Elias-Fano format using the OpeningBook API.
 * Usage: npx tsx tools/to_ef.ts <input.book> [output.book]
 */
import * as fs from "fs";
import * as path from "path";

const { getNativeModule } = await import("../src/node.js");
if (!getNativeModule()) {
  console.error("Native module not found. Run: npm run build:native");
  process.exit(1);
}

const { OpeningBook } = await import("../src/index.js");

const srcArg = process.argv[2];
if (!srcArg) {
  console.error("Usage: npx tsx tools/to_ef.ts <input.book> [output.book]");
  process.exit(1);
}

const src = path.resolve(srcArg);
const dst = process.argv[3]
  ? path.resolve(process.argv[3])
  : src.replace(/\.book$/, "_ef.book");

const raw = fs.readFileSync(src);
const srcMB = (raw.length / 1024 / 1024).toFixed(2);

// v2 header: bytes 0-1 are magic (0xC4 0x42), bytes 3-4 are W/H
// v1 header: bytes 0-1 are W/H directly
const isV2 = raw[0] === 0xc4 && raw[1] === 0x42;
const W = isV2 ? raw[3] : raw[0];
const H = isV2 ? raw[4] : raw[1];

console.log(`Loading ${path.basename(src)} (${srcMB} MB)  [${W}×${H}]...`);

const book = new OpeningBook(W, H);
await book.loadFromBuffer(raw);
console.log(`  format: ${book.format}`);

book.convertToEliasFano();
await book.saveToFile(dst);
book.release();

const dstSize = fs.statSync(dst).size;
const dstMB = (dstSize / 1024 / 1024).toFixed(2);
const ratio = (raw.length / dstSize).toFixed(2);
console.log(`Saved → ${path.basename(dst)} (${dstMB} MB)  [${ratio}x smaller]`);
