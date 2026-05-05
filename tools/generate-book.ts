import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { fileURLToPath } from "url";

// Set UV_THREADPOOL_SIZE as early as possible from CLI args
const tIdx = process.argv.indexOf("--threads");
const requestedThreads =
  tIdx !== -1 && tIdx < process.argv.length - 1
    ? process.argv[tIdx + 1]
    : os.cpus().length.toString();

if (
  parseInt(process.env.UV_THREADPOOL_SIZE || "0") < parseInt(requestedThreads)
) {
  process.env.UV_THREADPOOL_SIZE = requestedThreads;
  // Re-spawn itself with the new environment
  const { spawnSync } = await import("child_process");
  const result = spawnSync(
    process.argv[0],
    [...process.execArgv, ...process.argv.slice(1)],
    {
      env: process.env,
      stdio: "inherit",
    },
  );
  process.exit(result.status ?? 0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Automatically drop CPU priority to lowest (nice 19)
try {
  os.setPriority(os.constants.priority.PRIORITY_LOW);
} catch (e) {
  // Ignore if unsupported by OS
}

function getRawScore(
  resArr: Int32Array | number[],
  width: number,
  height: number,
): number {
  const status = resArr[0];
  const nbMoves = resArr[1];
  if (status === 1) {
    // STATUS_WIN
    return Math.floor((width * height + 1 - nbMoves) / 2);
  }
  let bestScore = -10000;
  for (let i = 0; i < width; i++) {
    const n = resArr[2 + i];
    if (n !== -1000) {
      // UNPLAYABLE_COLUMN_SCORE is -1000
      if (n > bestScore) {
        bestScore = n;
      }
    }
  }
  return bestScore;
}

async function run() {
  const args = process.argv.slice(2);
  let width = 7,
    height = 6,
    depth = 10,
    cacheSizeMb = 128,
    threads = 12,
    useEf = false,
    bootstrap = "",
    weak = false,
    filterForced = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--width") width = parseInt(args[++i]);
    if (args[i] === "--height") height = parseInt(args[++i]);
    if (args[i] === "--depth") depth = parseInt(args[++i]);
    if (args[i] === "--cacheMB") cacheSizeMb = parseInt(args[++i]);
    if (args[i] === "--threads") threads = parseInt(args[++i]);
    if (args[i] === "--ef") useEf = true;
    if (args[i] === "--bootstrap") bootstrap = args[++i];
    if (args[i] === "--weak") weak = true;
    if (args[i] === "--filter-forced") filterForced = true;
  }

  console.log("=========================================================");
  console.log(
    ` ${width}x${height} ${threads}-Core Native Iterative Alpha-Beta Orchestrator${weak ? " (WEAK SOLVER)" : ""}`,
  );
  console.log("=========================================================");

  const { NodeConnect4Solver, NativeCache, getNativeModule } =
    await import("../src/node.js");
  const { OpeningBook } = await import("../src/index.js");

  const native = getNativeModule();
  if (!native) {
    console.error(
      "Native module 'connect4.node' is required for generating books natively.",
    );
    process.exit(1);
  }

  let bootstrapBook: OpeningBook | null = null;
  if (bootstrap) {
    console.log(`[!] Loading bootstrap book from ${bootstrap}...`);
    const bookData = fs.readFileSync(bootstrap);
    bootstrapBook = await OpeningBook.fromBuffer(bookData);
    if (bootstrapBook.width !== width || bootstrapBook.height !== height) {
      throw new Error(
        `Bootstrap book dimensions (${bootstrapBook.width}x${bootstrapBook.height}) do not match target dimensions (${width}x${height}).`,
      );
    }
    console.log(
      `[+] Bootstrap book loaded (${bootstrapBook.width}x${bootstrapBook.height}).`,
    );
  }

  console.log(
    `[!] Generating raw permutations up to depth ${depth}${filterForced ? " (filtering forced moves)" : ""}...`,
  );
  const positions: string[] = native._generatePositions(
    width,
    height,
    depth,
    filterForced,
  );
  console.log(
    `[+] Generated ${positions.length.toLocaleString()} unique evaluation points.`,
  );

  const builder = new native.BookBuilder(width, height, depth);
  let processed = 0;

  const outputDir = path.join(__dirname, "../data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const fileExt = useEf ? ".efbook" : ".book";
  const typeStr = weak ? "dense_weak" : "dense";
  const outputFile = path.join(
    outputDir,
    `${width}x${height}_${typeStr}${depth}${fileExt}`,
  );

  const saveAndExit = () => {
    console.log(
      `\n[!] Caught exit signal. Saving ${processed} accumulated positions to ${useEf ? "Elias-Fano" : "Dense"} book natively to preserve progress...`,
    );
    try {
      if (useEf) {
        builder.saveEliasFano(outputFile);
      } else {
        builder.saveDense(outputFile);
      }
      console.log(`[+] Partial book successfully saved to ${outputFile}`);
    } catch (e) {
      console.error(`[-] Failed to save book:`, e);
    }
    process.kill(process.pid, "SIGKILL");
  };

  process.on("SIGINT", saveAndExit);

  const sharedCache = new NativeCache(width, height, cacheSizeMb, false);
  const solvers: NodeConnect4Solver[] = [];
  for (let i = 0; i < threads; i++) {
    const s = new NodeConnect4Solver({
      width,
      height,
      sharedCache,
      heuristic: false,
    });
    await s.init();
    solvers.push(s);
  }

  console.log(
    `[+] Created ${threads} native solvers sharing a ${sharedCache.allocatedCacheSizeMb}MB cache${sharedCache.allocatedCacheSizeMb !== cacheSizeMb ? ` (Requested: ${cacheSizeMb}MB)` : ""}.`,
  );
  console.log(
    `[+] Crunching ${weak ? "WEAK " : ""}Alpha-Beta evaluations using ${threads} concurrent workers...`,
  );

  const start = Date.now();
  const totalPositions = positions.length;
  // Reverse to evaluate deepest positions first for better cache utilization
  positions.reverse();

  const bookPtr = bootstrapBook ? bootstrapBook.ptr : undefined;

  const worker = async (workerId: number) => {
    const solver = solvers[workerId];
    while (true) {
      const pos = positions.pop();
      if (pos === undefined) break;

      let analysis;
      try {
        analysis = await solver.analyze(pos, {
          threads: 1,
          weak,
          book: bookPtr ? { ptr: bookPtr } : undefined,
        } as any);
      } catch (e) {
        console.error(`Worker ${workerId} failed:`, e);
        throw e;
      }

      if (analysis.evaluation) {
        builder.addPosition(pos, analysis.evaluation.score);
      }

      processed++;

      // Aggregate nodes from ALL solvers for true total performance
      const counts = await Promise.all(solvers.map((s) => s.getNodeCount()));
      const currentTotalNodes = counts.reduce((acc, c) => acc + BigInt(c), 0n);
      const elapsed = (Date.now() - start) / 1000;
      const nps = (Number(currentTotalNodes) / elapsed / 1000000).toFixed(1);
      const pct = ((processed / totalPositions) * 100).toFixed(1);

      process.stdout.write(
        `\r[${processed}/${totalPositions}] (${pct}%) | ${nps} MN/s | Total Nodes: ${currentTotalNodes.toLocaleString()} | Current: ${pos}      `,
      );
    }
  };

  // Launch concurrent workers
  await Promise.all(Array.from({ length: threads }, (_, i) => worker(i)));

  console.log(""); // Final newline
  const elapsedTotal = (Date.now() - start) / 1000;
  console.log(`\n[+] Finished evaluation in ${elapsedTotal.toFixed(1)}s.`);

  console.log(
    `[+] Packing transitive sequence cache into ${useEf ? "Elias-Fano" : "Dense"} book natively...`,
  );
  if (useEf) {
    builder.saveEliasFano(outputFile);
  } else {
    builder.saveDense(outputFile);
  }
  console.log(`[+] Book successfully saved to ${outputFile}`);
  if (bootstrapBook) bootstrapBook.unload();
  solvers.forEach((s) => s.release());
  sharedCache.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
