/**
 * One-time fix: patch the value bytes in EF opening books that were generated
 * with SCORE_FORCED_WIN_BASE-transformed scores instead of raw scores.
 *
 * Root cause: generate-book.ts passed analysis.evaluation.score (which includes
 * a ±31000 offset) to builder.addPosition(). AddPosition encodes as:
 *   stored = (uint8_t)(score + 22)
 * but it expected the raw solver score (in [-21, 21] for 7x6).
 *
 * The SCORE_FORCED_WIN_BASE transformation wraps around modulo 256, producing:
 *   wins  (raw 1..21):    stored in [47, 67]   (should be [23, 43])
 *   draw  (raw 0):        stored = 22           (correct — unchanged)
 *   losses (raw -21..-1): stored in [233, 253]  (should be [1, 21])
 *
 * Fix: for each value byte in the EF book's values section:
 *   [47, 67] → v - 24   (undo SCORE_FORCED_WIN_BASE wrap for wins)
 *   22       → 22        (draw, already correct)
 *   [233,253]→ v - 232  (undo SCORE_FORCED_WIN_BASE wrap for losses)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOK_MAGIC_0 = 0xc4;
const BOOK_MAGIC_1 = 0x42;
const BOOK_VERSION = 0x02;
const FLAG_STORAGE_MASK = 0x03;
const FLAG_STORAGE_EF = 0x01;

function readUint64LE(buf: Buffer, offset: number): bigint {
  return buf.readBigUInt64LE(offset);
}

// Returns [encodeOffset, maxRaw, baseWin, baseLoss] for a given board.
// encodeOffset = (W*H+1)/2 + 1, matching C++ integer division.
// baseWin = (31000 + encodeOffset) % 256
// baseLoss = (256 - (31000 - encodeOffset) % 256) % 256 (unsigned mod)
function boardParams(w: number, h: number): { encodeOffset: number; maxRaw: number; baseWin: number; baseLoss: number } {
  const encodeOffset = Math.trunc((w * h + 1) / 2) + 1;
  const maxRaw = Math.trunc((w * h + 1) / 2);
  const baseWin = (31000 + encodeOffset) % 256;
  const baseLoss = (((-31000 + encodeOffset) % 256) + 256) % 256;
  return { encodeOffset, maxRaw, baseWin, baseLoss };
}

// The correction offsets for wins and losses happen to be universal across all
// board sizes because they depend only on 31000 mod 256 = 24:
//   win correction  = baseWin  - encodeOffset = 31000 mod 256      = 24
//   loss correction = baseLoss - encodeOffset = (-31000) mod 256   = 232
// Verification: 31000 mod 256 = 24; (256 - 24) = 232. ✓
//
// Detection ranges are board-specific:
//   wins   ∈ [baseWin+1, baseWin+maxRaw]
//   draw   = encodeOffset   (wrong == correct, no change)
//   losses ∈ [baseLoss-maxRaw+1, baseLoss] (or equivalently [baseLoss+(-maxRaw), baseLoss-1] inclusive)

function makePatcher(w: number, h: number): (v: number) => number {
  const { encodeOffset, maxRaw, baseWin, baseLoss } = boardParams(w, h);
  const winLo = baseWin + 1;
  const winHi = baseWin + maxRaw;
  const lossLo = baseLoss - maxRaw + 1;
  const lossHi = baseLoss - 1;  // raw=-1 → stored=baseLoss-1
  // Actually raw ranges from -maxRaw to -1:
  // stored = baseLoss + raw, so stored ∈ [baseLoss - maxRaw, baseLoss - 1]
  const lossLoReal = baseLoss - maxRaw;
  const lossHiReal = baseLoss - 1;
  return (v: number): number => {
    if (v >= winLo && v <= winHi) return v - 24;       // win
    if (v === encodeOffset) return v;                    // draw (already correct)
    if (v >= lossLoReal && v <= lossHiReal) return v - 232; // loss
    return v; // sentinel (0) or unexpected
  };
}

function patchBook(filePath: string, dryRun: boolean): void {
  const buf = fs.readFileSync(filePath);

  if (buf[0] !== BOOK_MAGIC_0 || buf[1] !== BOOK_MAGIC_1) {
    console.log(`  ${path.basename(filePath)}: not a v2 book, skipping`);
    return;
  }
  if (buf[2] !== BOOK_VERSION) {
    console.log(`  ${path.basename(filePath)}: unsupported version ${buf[2]}, skipping`);
    return;
  }

  const storage = buf[6] & FLAG_STORAGE_MASK;
  if (storage !== FLAG_STORAGE_EF) {
    console.log(`  ${path.basename(filePath)}: not EF format (storage=${storage}), skipping`);
    return;
  }

  const width = buf[3];
  const height = buf[4];

  const valBytes = buf[9];
  if (valBytes !== 1) {
    console.log(`  ${path.basename(filePath)}: val_bytes=${valBytes}, only 1-byte values supported`);
    return;
  }

  let numEntries = 0n;
  for (let i = 0; i < 8; i++) numEntries |= BigInt(buf[10 + i]) << BigInt(i * 8);
  const n = Number(numEntries);

  // EF sub-header at offset 18: U (8 bytes) + L (1 byte)
  const U = readUint64LE(buf, 18);
  const L = buf[26];

  const upperBitsSize = Number((numEntries + (U >> BigInt(L)) + 64n) / 64n);
  const lowerBitsSize = L > 0 ? Number((numEntries * BigInt(L) + 63n) / 64n) : 0;

  const valuesOffset = 18 + 9 + upperBitsSize * 8 + lowerBitsSize * 8;
  const valuesEnd = valuesOffset + n;

  if (valuesEnd > buf.length) {
    console.log(`  ${path.basename(filePath)}: computed values range [${valuesOffset}, ${valuesEnd}) exceeds file size ${buf.length}`);
    return;
  }

  const patchValue = makePatcher(width, height);
  const { encodeOffset, maxRaw, baseWin, baseLoss } = boardParams(width, height);

  // Count & patch
  let wins = 0, losses = 0, draws = 0, unchanged = 0;
  const patched = Buffer.from(buf);

  for (let i = valuesOffset; i < valuesEnd; i++) {
    const v = buf[i];
    const newV = patchValue(v);
    if (v >= baseWin + 1 && v <= baseWin + maxRaw) wins++;
    else if (v === encodeOffset) draws++;
    else if (v >= baseLoss - maxRaw && v <= baseLoss - 1) losses++;
    else if (v !== 0) unchanged++; // 0 = sentinel or unexpected
    patched[i] = newV;
  }

  console.log(`  ${path.basename(filePath)}: ${width}x${height}, ${n} entries, ${wins} wins, ${losses} losses, ${draws} draws, ${unchanged} other`);
  console.log(`    encodeOffset=${encodeOffset} maxRaw=${maxRaw} baseWin=${baseWin} baseLoss=${baseLoss}`);
  console.log(`    values at [${valuesOffset}, ${valuesEnd}), file=${buf.length} bytes`);

  if (!dryRun) {
    fs.writeFileSync(filePath, patched);
    console.log(`    ✓ patched`);
  } else {
    console.log(`    (dry-run, not written)`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const dataDir = path.join(__dirname, "..", "data");
  const embedded = ["6x6_dense3.book", "6x7_dense6.book", "7x6_dense7.book"];

  console.log(`Patching EF book values (dry-run=${dryRun})...`);

  for (const name of embedded) {
    const p = path.join(dataDir, name);
    if (!fs.existsSync(p)) {
      console.log(`  ${name}: not found, skipping`);
      continue;
    }
    patchBook(p, dryRun);
  }

  if (!dryRun) {
    console.log("\nDone. Next step: regenerate embedded_books.hpp:");
    console.log("  python3 tools/gen_embedded_books.py");
  }
}

main();
