import { NodeConnect4Solver } from "../src/index";
import { getNativeModule } from "../src/index";
import { OpeningBook } from "../src/index";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

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
    weak = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--width") width = parseInt(args[++i]);
    if (args[i] === "--height") height = parseInt(args[++i]);
    if (args[i] === "--depth") depth = parseInt(args[++i]);
    if (args[i] === "--cacheMB") cacheSizeMb = parseInt(args[++i]);
    if (args[i] === "--threads") threads = parseInt(args[++i]);
    if (args[i] === "--ef") useEf = true;
    if (args[i] === "--bootstrap") bootstrap = args[++i];
    if (args[i] === "--weak") weak = true;
  }

  console.log("=========================================================");
  console.log(
    ` ${width}x${height} ${threads}-Core Native Iterative Alpha-Beta Orchestrator${weak ? " (WEAK SOLVER)" : ""}`,
  );
  console.log("=========================================================");

  const native = getNativeModule();
  if (!native) {
    console.error(
      "Native module 'connect4.node' is required for generating books natively.",
    );
    process.exit(1);
  }

  const minScore = -Math.floor((width * height) / 2) + 3;

  let bootstrapBook: OpeningBook | null = null;
  if (bootstrap) {
    console.log(`[!] Loading bootstrap book from ${bootstrap}...`);
    const bookData = fs.readFileSync(bootstrap);
    bootstrapBook = await OpeningBook.fromBuffer(bookData);
    console.log(
      `[+] Bootstrap book loaded (${bootstrapBook.width}x${bootstrapBook.height}).`,
    );
  }

  console.log(`[!] Generating raw permutations up to depth ${depth}...`);
  const positions: string[] = native._generatePositions(width, height, depth);
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
  const typeStr = weak ? "weak" : "dense";
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
  process.on("SIGTERM", saveAndExit);

  // process.env.UV_THREADPOOL_SIZE = threads.toString(); // No longer needed!

  const solver = new NodeConnect4Solver({
    width,
    height,
    cacheSizeMb,
    heuristic: false,
  });
  await solver.init();

  console.log(`[+] Created native solver sharing a ${cacheSizeMb}MB cache.`);
  console.log(
    `[+] Crunching ${weak ? "WEAK " : ""}Alpha-Beta evaluations using sequential orchestrator...`,
  );

  let processed = 0;
  const start = Date.now();
  // Reverse to evaluate deepest positions first for better cache utilization
  positions.reverse();

  for (const pos of positions) {
    const analysis = await solver.analyze(pos, {
      threads,
      weak,
      book: bootstrapBook
        ? { ptr: (bootstrapBook as any)._bookPtr }
        : undefined,
    } as any);

    if (analysis.evaluation) {
      builder.addPosition(pos, analysis.evaluation.score - minScore + 1);
    }

    processed++;

    // Log progress occasionally
    if (processed % 10 === 0 || processed === positions.length) {
      const currentTotalNodes = BigInt(solver.getNodeCount());
      const elapsed = (Date.now() - start) / 1000;
      const pct = ((processed / positions.length) * 100).toFixed(1);
      const nps = (Number(currentTotalNodes) / elapsed / 1000000).toFixed(1);
      process.stdout.write(
        `\r[${processed}/${positions.length}] (${pct}%) | ${nps} MN/s | Total Nodes: ${currentTotalNodes.toLocaleString()} | Current: ${pos}      `,
      );
    }
  }

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
  solver.release();
  process.exit(0);
}

run().catch(console.error);
