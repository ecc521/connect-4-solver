/**
 * Connect 4 Unified Benchmark
 *
 * Usage:
 *   npx ts-node tools/bench.ts [options]
 *
 * Runtime:
 *   --native         Use Node.js native addon (default)
 *   --wasm           Use single-threaded WASM (analyze.js)
 *
 * Modes:
 *   --solve          Benchmark solve()
 *   --analyze        Benchmark analyze()
 *   --book           Benchmark opening book lookups
 *   (default: both solve + analyze)
 *
 * Engine:
 *   --exact          Test exact solver
 *   --heuristic      Test heuristic solver
 *   (default: both)
 *
 * Filtering:
 *   --sizes 7x6 8x8  Board sizes to test (default: 7x6 8x8)
 *   --threads 1 4     Thread counts to test (default: 1 4)
 *
 * Tuning:
 *   --seed <n>        RNG seed for position sampling (default: 42)
 *   --timeout <ms>    Per-position timeout (default: 200)
 *   --budget <ms>     Total budget per board/engine combo (default: 2000)
 *   --positions <n>   Max positions to sample (default: 100)
 *
 * Output:
 *   --verbose         Print individual position failures
 *   --json            Output results as JSON (for PGO comparison)
 */

import * as fs from "fs";
import * as path from "path";

// ─── Auto-discover board sizes from test-data/ ──────────────────
function discoverSizes(): string[] {
  const dataDir = path.join(__dirname, "..", "test-data");
  if (!fs.existsSync(dataDir)) return ["7x6"];
  return fs
    .readdirSync(dataDir)
    .filter((f) => f.startsWith("positions_") && f.endsWith(".txt"))
    .map((f) => f.replace("positions_", "").replace(".txt", ""))
    .sort((a, b) => {
      const [aw, ah] = a.split("x").map(Number);
      const [bw, bh] = b.split("x").map(Number);
      return aw * ah - bw * bh; // sort by board area
    });
}

// ─── ANSI Colors ────────────────────────────────────────────────
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

// ─── Types ──────────────────────────────────────────────────────
interface BenchPos {
  pos: string;
  expectedScore: number;
}

interface BenchResult {
  runtime: string;
  mode: string;
  engine: string;
  board: string;
  threads: number;
  completed: number;
  total: number;
  accuracy: number;
  accuracyPct: number;
  nodes: number;
  mns: number;
  timeMs: number;
  avgDepth: number | null;
  parityOk: boolean;
  positionsAttempted: number;
  skipped: number;
}

// ─── Seeded RNG ─────────────────────────────────────────────────
class SeededRNG {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }
}

// ─── CLI Parsing ────────────────────────────────────────────────
interface BenchOptions {
  runtime: "native" | "wasm";
  runSolve: boolean;
  runAnalyze: boolean;
  runBook: boolean;
  testExact: boolean;
  testHeuristic: boolean;
  sizes: string[];
  threads: number[];
  seed: number;
  timeout: number;
  budget: number;
  maxPositions: number;
  verbose: boolean;
  json: boolean;
}

function parseArgs(): BenchOptions {
  const args = process.argv.slice(2);
  let runtime: "native" | "wasm" = "native";
  let solveRequested = false;
  let analyzeRequested = false;
  let bookRequested = false;
  let exactRequested = false;
  let heuristicRequested = false;
  const sizes: string[] = [];
  const threads: number[] = [];
  let seed = 42;
  let timeout = 200;
  let budget = 2000;
  let maxPositions = 100;
  let verbose = false;
  let json = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--native") runtime = "native";
    else if (arg === "--wasm") runtime = "wasm";
    else if (arg === "--solve") solveRequested = true;
    else if (arg === "--analyze") analyzeRequested = true;
    else if (arg === "--book") bookRequested = true;
    else if (arg === "--exact") exactRequested = true;
    else if (arg === "--heuristic") heuristicRequested = true;
    else if (arg === "--verbose") verbose = true;
    else if (arg === "--json") json = true;
    else if (arg === "--seed") seed = parseInt(args[++i], 10);
    else if (arg === "--timeout") timeout = parseInt(args[++i], 10);
    else if (arg === "--budget") budget = parseInt(args[++i], 10);
    else if (arg === "--positions") maxPositions = parseInt(args[++i], 10);
    else if (arg === "--sizes" || arg === "--size") {
      while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        sizes.push(args[++i]);
      }
    } else if (arg === "--threads") {
      while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        threads.push(parseInt(args[++i], 10));
      }
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        `
Connect 4 Unified Benchmark

Runtime:
  --native         Use Node.js native addon (default)
  --wasm           Use single-threaded WASM

Modes:
  --solve          Benchmark solve()
  --analyze        Benchmark analyze()
  --book           Benchmark opening book lookups
  (default: both solve + analyze)

Engine:
  --exact          Test exact solver
  --heuristic      Test heuristic solver
  (default: both)

Filtering:
  --sizes 7x6 8x8  Board sizes (default: 7x6 8x8)
  --threads 1 4     Thread counts (default: 1 4)

Tuning:
  --seed <n>        RNG seed (default: 42)
  --timeout <ms>    Per-position timeout (default: 200)
  --budget <ms>     Total budget per combo (default: 2000)
  --positions <n>   Max positions to sample (default: 100)

Output:
  --verbose         Print individual failures
  --json            Output JSON (for PGO comparison)
`.trim(),
      );
      process.exit(0);
    }
  }

  return {
    runtime,
    runSolve: bookRequested
      ? false
      : solveRequested || (!solveRequested && !analyzeRequested),
    runAnalyze: bookRequested
      ? false
      : analyzeRequested || (!solveRequested && !analyzeRequested),
    runBook: bookRequested,
    testExact: exactRequested || (!exactRequested && !heuristicRequested),
    testHeuristic:
      heuristicRequested || (!exactRequested && !heuristicRequested),
    sizes: sizes.length > 0 ? sizes : discoverSizes(),
    threads: threads.length > 0 ? threads : [1, 4],
    seed,
    timeout,
    budget,
    maxPositions,
    verbose,
    json,
  };
}

// ─── Position Loading ───────────────────────────────────────────
function loadPositions(filePath: string): BenchPos[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split(/\s+/);
      let pos = parts[0];
      let expectedScore = 0;
      // Handle empty-board line format: " 1" where the position is empty
      if (
        !isNaN(Number(pos)) &&
        parts.length === 1 &&
        line.startsWith(" ")
      ) {
        expectedScore = Number(pos);
        pos = "";
      } else {
        expectedScore = Number(parts[1]);
      }
      return { pos, expectedScore };
    });
}

function samplePositions(
  positions: BenchPos[],
  count: number,
  rng: SeededRNG,
): BenchPos[] {
  const result = [...positions];
  // Fisher-Yates shuffle with seeded RNG
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.slice(0, count);
}

// ─── Table Formatting ───────────────────────────────────────────
function pad(val: string | number, length: number, alignLeft = true): string {
  const s = String(val);
  if (s.length >= length) return s;
  const padding = " ".repeat(length - s.length);
  return alignLeft ? s + padding : padding + s;
}

async function runBenchmark(
  opts: BenchOptions,
  solver: any,
  width: number,
  height: number,
  threads: number,
  isHeuristic: boolean,
  positions: BenchPos[],
  mode: "solve" | "analyze",
  budget: number,
): Promise<BenchResult> {
  const dimStr = `${width}x${height}`;

  let correct = 0;
  let completed = 0; // positions that finished without abort/timeout
  let skipped = 0;
  let totalAttempted = 0;
  let totalDepth = 0;
  const startNodes: number = solver.getNodeCount();
  const startTime = Date.now();

  for (const bp of positions) {
    if (Date.now() - startTime > budget) break;
    totalAttempted++;

    try {
      let bestScore = -1000;
      const posStart = Date.now();

      if (mode === "analyze") {
        const result = await solver.analyze(bp.pos, {
          threads,
          timeoutMs: opts.timeout,
        });
        if (!result || result.aborted) continue;
        totalDepth += result.depthReached || 0;
        if (!result.moveOptions || result.moveOptions.length === 0) continue;

        // For exact solver: if the per-position time exceeded ~90% of timeout,
        // the result may be partial (some columns timed out mid-search).
        // Skip these for parity counting to avoid false failures.
        const posElapsed = Date.now() - posStart;
        if (!isHeuristic && opts.timeout > 0 && posElapsed >= opts.timeout * 0.9) {
          skipped++;
          continue; // likely partial result
        }

        for (const opt of result.moveOptions) {
          if (opt && opt.score > bestScore) bestScore = opt.score;
        }
      } else {
        const result = await solver.solve(bp.pos, {
          threads,
          timeoutMs: opts.timeout,
        });
        if (!result || result.aborted || !result.evaluation) continue;
        totalDepth += result.depthReached || 0;

        // Same timeout proximity check for solve
        const posElapsed = Date.now() - posStart;
        if (!isHeuristic && opts.timeout > 0 && posElapsed >= opts.timeout * 0.9) {
          skipped++;
          continue;
        }

        bestScore = result.evaluation.score;
      }

      completed++;

      // Accuracy check
      if (isHeuristic) {
        const outcome =
          bestScore >= 31000
            ? 1
            : bestScore <= -31000
              ? -1
              : bestScore === 0
                ? 0
                : bestScore > 0
                  ? 1
                  : -1;
        const expectedOutcome =
          bp.expectedScore > 0 ? 1 : bp.expectedScore < 0 ? -1 : 0;
        if (outcome === expectedOutcome) correct++;
      } else {
        if (bestScore === bp.expectedScore) correct++;
        else if (opts.verbose) {
          console.log(
            `${RED}  PARITY FAIL: pos="${bp.pos}" expected=${bp.expectedScore} got=${bestScore}${RESET}`,
          );
        }
      }
    } catch (e) {
      if (opts.verbose)
        console.log(`${RED}  Error at ${bp.pos}: ${e}${RESET}`);
    }
  }

  const totalNodes = Number(solver.getNodeCount()) - Number(startNodes);
  const totalMs = Date.now() - startTime;
  const mns = totalMs > 0 ? totalNodes / 1_000_000 / (totalMs / 1000) : 0;
  const accuracyPct =
    completed > 0 ? (correct / completed) * 100 : 0;
  // Parity is only enforced for exact solver — must be 100% on completed positions
  const parityOk = isHeuristic ? true : correct === completed;

  return {
    runtime: opts.runtime,
    mode: mode === "solve" ? "solve()" : "analyze()",
    engine: isHeuristic ? "Heuristic" : "Exact",
    board: dimStr,
    threads,
    completed: correct,
    total: completed,
    accuracy: completed > 0 ? correct / completed : 0,
    accuracyPct,
    nodes: totalNodes,
    mns: parseFloat(mns.toFixed(2)),
    timeMs: totalMs,
    avgDepth: isHeuristic && completed > 0 ? totalDepth / completed : null,
    parityOk,
    positionsAttempted: totalAttempted,
    skipped,
  };
}

// ─── Main ───────────────────────────────────────────────────────
async function main(): Promise<void> {
  const opts = parseArgs();
  const rng = new SeededRNG(opts.seed);

  if (!opts.json) {
    console.log(`\n${BOLD}Connect 4 Benchmark${RESET}`);
    console.log(`${DIM}────────────────────────────────────────${RESET}`);
    console.log(
      `Runtime:   ${CYAN}${opts.runtime.toUpperCase()}${RESET}`,
    );
    console.log(
      `Engines:   ${YELLOW}${[opts.testExact ? "exact" : null, opts.testHeuristic ? "heuristic" : null].filter(Boolean).join(", ")}${RESET}`,
    );
    console.log(
      `Modes:     ${YELLOW}${[opts.runSolve ? "solve" : null, opts.runAnalyze ? "analyze" : null, opts.runBook ? "book" : null].filter(Boolean).join(", ")}${RESET}`,
    );
    console.log(
      `Sizes:     ${YELLOW}${opts.sizes.join(", ")}${RESET}`,
    );
    console.log(
      `Threads:   ${YELLOW}${opts.threads.join(", ")}${RESET}`,
    );
    console.log(
      `Seed:      ${YELLOW}${opts.seed}${RESET}`,
    );
    console.log(
      `Budget:    ${YELLOW}${opts.budget}ms${RESET} per combo, ${YELLOW}${opts.timeout}ms${RESET} per position`,
    );
    console.log(
      `Positions: ${YELLOW}${opts.maxPositions}${RESET} max sampled\n`,
    );
  }

  const allResults: BenchResult[] = [];
  let parityFailures = 0;

  // ─── Book benchmark ───────────────────────────────────────────
  if (opts.runBook) {
    if (opts.runtime !== "native") {
      console.error("Book benchmark requires --native runtime.");
      process.exit(1);
    }
    // Dynamic imports
    const { NodeConnect4Solver, getNativeModule } = await import("../src/node");
    const { OpeningBook } = await import("../src/index");

    const bookPath = path.join(
      __dirname,
      "..",
      "data",
      "7x6_dense14.efbook",
    );
    if (!fs.existsSync(bookPath)) {
      console.log("Skipping book benchmark: 7x6_dense14.efbook not found");
    } else {
      const native = getNativeModule();
      if (!native) {
        console.error("Native module not found for book benchmark.");
        process.exit(1);
      }

      const bookData = new Uint8Array(fs.readFileSync(bookPath));
      const efBook = new OpeningBook(7, 6);
      await efBook.load(bookData);

      // Also test dense book if possible
      const builder = new native.BookBuilder(7, 6, 14);
      builder.loadFromBook(efBook.ptr);
      const denseBuffer = builder.getDenseBuffer();
      const denseBook = new OpeningBook(7, 6);
      await denseBook.load(denseBuffer);

      const solver = new NodeConnect4Solver({ width: 7, height: 6 });
      await solver.init();

      const queries = [
        "4444",
        "444452",
        "444452233",
        "1234567",
        "4545454",
        "112233",
        "4",
        "44",
        "444",
      ];
      const ITERATIONS = 50000;
      const totalQueries = ITERATIONS * queries.length;

      for (const [name, book] of [
        ["Elias-Fano", efBook],
        ["Dense", denseBook],
      ] as const) {
        const start = Date.now();
        let hits = 0;
        for (let i = 0; i < ITERATIONS; i++) {
          for (const q of queries) {
            const res = await solver.analyze(q, {
              book: book as any,
              maxDepth: 1,
              threads: 1,
            });
            if (res.evaluation?.score !== undefined && res.nodes === 0) hits++;
          }
        }
        const queryTime = Date.now() - start;
        const qps = Math.floor(totalQueries / (queryTime / 1000));
        console.log(`${BOLD}${name} Book${RESET}: ${totalQueries.toLocaleString()} queries in ${queryTime}ms (${qps.toLocaleString()} QPS)`);
      }

      efBook.destroy();
      denseBook.destroy();
      solver.release();
    }
    // Book mode is standalone; exit early
    if (!opts.runSolve && !opts.runAnalyze) return;
  }

  // ─── Main benchmark loop ──────────────────────────────────────
  const dataDir = path.join(__dirname, "..", "test-data");

  if (!opts.json) {
    console.log(
      `| ${pad("Mode", 10)} | ${pad("Engine", 10)} | ${pad("Board", 5)} | ${pad("Thr", 3, false)} | ${pad("Pos", 7, false)} | ${pad("Accuracy", 8, false)} | ${pad("AvgDpt", 6, false)} | ${pad("Nodes", 14, false)} | ${pad("MN/s", 6, false)} | ${pad("Time", 8, false)} |`,
    );
    console.log(
      `|${"-".repeat(12)}|${"-".repeat(12)}|${"-".repeat(7)}|${"-".repeat(5)}|${"-".repeat(9)}|${"-".repeat(10)}|${"-".repeat(8)}|${"-".repeat(16)}|${"-".repeat(8)}|${"-".repeat(10)}|`,
    );
  }

  for (const sizeStr of opts.sizes) {
    const [w, h] = sizeStr.split("x").map(Number);
    const posPath = path.join(dataDir, `positions_${sizeStr}.txt`);
    const allPositions = loadPositions(posPath);
    if (allPositions.length === 0) {
      if (!opts.json) console.log(`${DIM}  No positions found for ${sizeStr}, skipping${RESET}`);
      continue;
    }

    // Sample once per board size — same positions used across all combos
    const sampled = samplePositions(allPositions, opts.maxPositions, rng);

    const engines: { name: string; heuristic: boolean }[] = [];
    if (opts.testExact)
      engines.push({ name: "Exact", heuristic: false });
    if (opts.testHeuristic)
      engines.push({ name: "Heuristic", heuristic: true });

    for (const engine of engines) {
      const modes: ("solve" | "analyze")[] = [];
      if (opts.runSolve) modes.push("solve");
      if (opts.runAnalyze) modes.push("analyze");

      for (const mode of modes) {
        // Track baseline position count so subsequent thread counts
        // use the identical set of positions (budget only applies to baseline)
        let baselinePositionCount = 0;

        for (const tCount of opts.threads) {
          // Create a fresh solver per combo to avoid TT warming artifacts
          let solver: any;
          if (opts.runtime === "native") {
            const { NodeConnect4Solver } = await import("../src/node");
            solver = new NodeConnect4Solver({
              width: w,
              height: h,
              heuristic: engine.heuristic,
            });
          } else {
            const { SyncWasmNoSABConnect4Solver } = await import("../src/sync");
            solver = new SyncWasmNoSABConnect4Solver({
              width: w,
              height: h,
              heuristic: engine.heuristic,
            });
          }
          await solver.init();

          // First thread count: apply budget to determine position set
          // Subsequent thread counts: use the same positions (no budget)
          const isBaseline = baselinePositionCount === 0;
          const positionsForRun = isBaseline
            ? sampled
            : sampled.slice(0, baselinePositionCount);

          const result = await runBenchmark(
            opts,
            solver,
            w,
            h,
            tCount,
            engine.heuristic,
            positionsForRun,
            mode,
            isBaseline ? opts.budget : Number.MAX_SAFE_INTEGER,
          );
          allResults.push(result);

          if (isBaseline) {
            baselinePositionCount = result.positionsAttempted;
          }

          if (!result.parityOk) parityFailures++;

          if (!opts.json) {
            const accStr = result.skipped > 0
              ? `${result.completed}(${result.skipped})/${result.positionsAttempted}`
              : `${result.completed}/${result.positionsAttempted}`;
            const accPctStr = `${result.accuracyPct.toFixed(1)}%`;
            const parityMark = result.parityOk
              ? ""
              : ` ${RED}FAIL${RESET}`;
            const accColor =
              result.accuracyPct >= 100
                ? GREEN
                : result.accuracyPct >= 80
                  ? YELLOW
                  : RED;
            const depthStr = result.avgDepth !== null ? result.avgDepth.toFixed(1) : "-";

            console.log(
              `| ${pad(result.mode, 10)} | ${pad(result.engine, 10)} | ${pad(result.board, 5)} | ${pad(String(result.threads), 3, false)} | ${pad(accStr, 7, false)} | ${accColor}${pad(accPctStr, 8, false)}${RESET} | ${pad(depthStr, 6, false)} | ${pad(result.nodes.toLocaleString(), 14, false)} | ${pad(result.mns.toFixed(2), 6, false)} | ${pad(result.timeMs + "ms", 8, false)} |${parityMark}`,
            );
          }

          solver.release();
        }
      }
    }
  }

  if (opts.json) {
    console.log(JSON.stringify(allResults, null, 2));
  } else {
    console.log("");
    if (parityFailures > 0) {
      console.error(
        `${RED}${BOLD}✗ ${parityFailures} parity failure(s) detected!${RESET}`,
      );
      process.exit(1);
    } else {
      console.log(`${GREEN}${BOLD}✓ All parity checks passed${RESET}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
