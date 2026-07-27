/**
 * Count positions in the 8×8 P2-wins strategy tree up to depth 16.
 *
 * Strategy tree definition:
 *   - P1 (loser) may play ANY legal move  → expand all children
 *   - P2 (winner) plays ONE optimal move  → follow book's best reply
 *
 * Usage: npx tsx tools/count_strategy_tree.ts [book_path]
 * Default book: data/8x8_dense_bounded.book
 */
import * as fs from "fs";

const { getNativeModule } = await import("../src/node.js");
const native = getNativeModule();
if (!native) {
  console.error("Native module required. Run: npm run build:native");
  process.exit(1);
}

const { OpeningBook } = await import("../src/index.js");

const W = 8, H = 8, CONNECT = 4, MAX_DEPTH = 16;

// ── Load book ────────────────────────────────────────────────────────────────
const bookPath = process.argv[2] ?? "data/8x8_dense_bounded.book";
const bookRaw = fs.readFileSync(bookPath);
const book = new OpeningBook(W, H);
await book.loadFromBuffer(bookRaw);
const ptr = book.ptr;

function bookLookup(moveStr: string): [number, number] | null {
  const lu = native._getBookLookup(W, H, ptr, moveStr);
  return lu === undefined ? null : [lu[0], lu[1]];
}

// ── Board ────────────────────────────────────────────────────────────────────
interface Board {
  heights: Uint8Array;   // heights[col] = # pieces in that column
  cells:   Uint8Array;   // cells[row * W + col] → 0=empty 1=P1 2=P2
  depth:   number;
  moveStr: string;
}

function rootBoard(): Board {
  return { heights: new Uint8Array(W), cells: new Uint8Array(W * H), depth: 0, moveStr: "" };
}

function playMove(b: Board, col: number): [Board, boolean] {
  const row    = b.heights[col];
  const player = (b.depth & 1) === 0 ? 1 : 2;
  const child: Board = {
    heights: new Uint8Array(b.heights),
    cells:   new Uint8Array(b.cells),
    depth:   b.depth + 1,
    moveStr: b.moveStr + (col + 1),
  };
  child.cells[row * W + col] = player;
  child.heights[col]++;
  return [child, checkWin(child.cells, row, col, player)];
}

function checkWin(cells: Uint8Array, row: number, col: number, player: number): boolean {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;
  for (const [dr, dc] of dirs) {
    let n = 1;
    for (const s of [1, -1] as const) {
      for (let d = 1; d < CONNECT; d++) {
        const r = row + s * dr * d, c = col + s * dc * d;
        if (r < 0 || r >= H || c < 0 || c >= W || cells[r * W + c] !== player) break;
        n++;
      }
    }
    if (n >= CONNECT) return true;
  }
  return false;
}

// Canonical board key (handles transpositions): pack 2 bits per cell → 16 bytes
function boardKey(cells: Uint8Array): string {
  const buf = new Uint8Array(16);
  for (let i = 0; i < 64; i++) buf[i >> 2] |= cells[i] << ((i & 3) << 1);
  return String.fromCharCode(...buf);
}

// ── P2 move selection ────────────────────────────────────────────────────────
// Prefer immediate wins; otherwise pick the first child the book says is a loss for P1.
function bestP2Col(board: Board): number | null {
  for (let col = 0; col < W; col++) {
    if (board.heights[col] >= H) continue;
    const [child, won] = playMove(board, col);
    if (won) return col;
    const lu = bookLookup(child.moveStr);
    if (lu && lu[0] < 0) return col;   // child is a loss for P1 (player to move)
  }
  return null;
}

// ── DFS ──────────────────────────────────────────────────────────────────────
const visited = new Map<string, number>(); // key → depth first seen
const inBookByDepth  = new Int32Array(MAX_DEPTH + 1);
const missByDepth    = new Int32Array(MAX_DEPTH + 1);
let deadEnds = 0;   // P2 positions where book had no winning reply
let terminals = 0;  // game-over positions reached before depth 16

function dfs(board: Board): void {
  const key = boardKey(board.cells);
  if (visited.has(key)) return;
  visited.set(key, board.depth);

  const inBook = bookLookup(board.moveStr) !== null;
  (inBook ? inBookByDepth : missByDepth)[board.depth]++;

  if (board.depth >= MAX_DEPTH) return;

  const isP1 = (board.depth & 1) === 0;

  if (isP1) {
    // Expand every legal P1 move
    for (let col = 0; col < W; col++) {
      if (board.heights[col] >= H) continue;
      const [child, won] = playMove(board, col);
      if (won) { terminals++; continue; }  // P1 won — shouldn't happen if P2 plays perfectly, but count it
      dfs(child);
    }
  } else {
    // Follow P2's one optimal reply
    const col = bestP2Col(board);
    if (col === null) { deadEnds++; return; }
    const [child, won] = playMove(board, col);
    if (won) { terminals++; return; }   // P2 won, branch done
    dfs(child);
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────
console.log(`Counting strategy tree (8×8, depth ≤ ${MAX_DEPTH})...`);
console.log(`Book: ${bookPath}\n`);

const t0 = Date.now();
dfs(rootBoard());
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

book.release();

// ── Report ───────────────────────────────────────────────────────────────────
console.log("Depth | Turn |  In Book |   Missing |     Total | Coverage");
console.log("------|------|----------|-----------|-----------|--------");
let totalIn = 0, totalMiss = 0;
for (let d = 0; d <= MAX_DEPTH; d++) {
  const inn  = inBookByDepth[d];
  const miss = missByDepth[d];
  const tot  = inn + miss;
  if (tot === 0) continue;
  totalIn += inn; totalMiss += miss;
  const pct  = (100 * inn / tot).toFixed(1);
  const turn = (d & 1) === 0 ? "P1  " : "  P2";
  console.log(
    `    ${String(d).padStart(2)} | ${turn} | ${String(inn).padStart(8)} | ` +
    `${String(miss).padStart(9)} | ${String(tot).padStart(9)} | ${pct}%`
  );
}
const grandTotal = totalIn + totalMiss;
console.log(`\n  Total unique positions : ${grandTotal.toLocaleString()}`);
console.log(`  In book                : ${totalIn.toLocaleString()}  (${(100*totalIn/grandTotal).toFixed(1)}%)`);
console.log(`  Missing from book      : ${totalMiss.toLocaleString()}  (${(100*totalMiss/grandTotal).toFixed(1)}%)`);
if (deadEnds) console.log(`  Dead ends (P2 pos with no book reply) : ${deadEnds.toLocaleString()}`);
if (terminals) console.log(`  Early terminals (won before depth 16) : ${terminals.toLocaleString()}`);
console.log(`  Elapsed: ${elapsed}s`);
