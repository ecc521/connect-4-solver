#!/usr/bin/env npx ts-node
/**
 * Compare two bench.ts JSON outputs and produce a clean delta table.
 *
 * Usage:
 *   npx ts-node tools/compare-bench.ts baseline.json pgo.json
 */
import * as fs from "fs";

interface BenchResult {
  mode: string;
  engine: string;
  board: string;
  threads: number;
  mns: number;
  completed: number;
  total: number;
  accuracyPct: number;
}

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function pad(val: string | number, len: number, left = true): string {
  const s = String(val);
  if (s.length >= len) return s;
  const p = " ".repeat(len - s.length);
  return left ? s + p : p + s;
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: npx ts-node tools/compare-bench.ts <baseline.json> <pgo.json>",
    );
    process.exit(1);
  }

  const baseline: BenchResult[] = JSON.parse(fs.readFileSync(args[0], "utf-8"));
  const pgo: BenchResult[] = JSON.parse(fs.readFileSync(args[1], "utf-8"));

  // Build lookup for PGO results
  const key = (r: BenchResult): string =>
    `${r.mode}|${r.engine}|${r.board}|${r.threads}`;
  const pgoMap = new Map<string, BenchResult>();
  for (const r of pgo) pgoMap.set(key(r), r);

  console.log(`\n${BOLD}PGO Performance Comparison${RESET}`);
  console.log(
    `${DIM}────────────────────────────────────────────────────────────────${RESET}\n`,
  );

  console.log(
    `| ${pad("Mode", 10)} | ${pad("Engine", 10)} | ${pad("Board", 5)} | ${pad("Thr", 3, false)} | ${pad("Base MN/s", 10, false)} | ${pad("PGO MN/s", 10, false)} | ${pad("Delta", 8, false)} |`,
  );
  console.log(
    `|${"-".repeat(12)}|${"-".repeat(12)}|${"-".repeat(7)}|${"-".repeat(5)}|${"-".repeat(12)}|${"-".repeat(12)}|${"-".repeat(10)}|`,
  );

  let totalBaseline = 0;
  let totalPgo = 0;
  let compared = 0;

  for (const b of baseline) {
    const p = pgoMap.get(key(b));
    if (!p) continue;

    // Skip entries where either side is too low to be meaningful
    // (positions that randomly hit/miss the timeout boundary)
    if (b.mns < 0.5 || p.mns < 0.5) continue;

    const delta = b.mns > 0 ? ((p.mns - b.mns) / b.mns) * 100 : 0;
    const deltaStr = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
    const color = delta > 1 ? GREEN : delta < -1 ? RED : YELLOW;

    console.log(
      `| ${pad(b.mode, 10)} | ${pad(b.engine, 10)} | ${pad(b.board, 5)} | ${pad(String(b.threads), 3, false)} | ${pad(b.mns.toFixed(2), 10, false)} | ${pad(p.mns.toFixed(2), 10, false)} | ${color}${pad(deltaStr, 8, false)}${RESET} |`,
    );

    totalBaseline += b.mns;
    totalPgo += p.mns;
    compared++;
  }

  if (compared > 0) {
    const overallDelta = ((totalPgo - totalBaseline) / totalBaseline) * 100;
    const overallColor = overallDelta > 0 ? GREEN : RED;
    console.log(
      `|${"-".repeat(12)}|${"-".repeat(12)}|${"-".repeat(7)}|${"-".repeat(5)}|${"-".repeat(12)}|${"-".repeat(12)}|${"-".repeat(10)}|`,
    );
    console.log(
      `| ${pad("TOTAL", 10)} | ${pad("", 10)} | ${pad("", 5)} | ${pad("", 3)} | ${pad(totalBaseline.toFixed(2), 10, false)} | ${pad(totalPgo.toFixed(2), 10, false)} | ${overallColor}${BOLD}${pad(`${overallDelta >= 0 ? "+" : ""}${overallDelta.toFixed(1)}%`, 8, false)}${RESET} |`,
    );
  }

  console.log("");
}

main();
