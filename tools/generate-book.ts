import { NodeConnect4Solver } from "../src/index";
import { getNativeModule } from "../src/index";
import { OpeningBook } from "../src/index";
import * as path from "path";
import * as fs from "fs";

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
    bootstrap = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--width") width = parseInt(args[++i]);
    if (args[i] === "--height") height = parseInt(args[++i]);
    if (args[i] === "--depth") depth = parseInt(args[++i]);
    if (args[i] === "--cacheMB") cacheSizeMb = parseInt(args[++i]);
    if (args[i] === "--threads") threads = parseInt(args[++i]);
    if (args[i] === "--ef") useEf = true;
    if (args[i] === "--bootstrap") bootstrap = args[++i];
  }

  console.log("=========================================================");
  console.log(
    ` ${width}x${height} ${threads}-Core Native Iterative Alpha-Beta Orchestrator`,
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

  const solver = new NodeConnect4Solver({ width, height, cacheSizeMb });
  await solver.init();

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
  const outputFile = path.join(
    outputDir,
    `${width}x${height}_${useEf ? "elias" : "dense"}${depth}${fileExt}`,
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
    process.exit(0);
  };

  process.on("SIGINT", saveAndExit);
  process.on("SIGTERM", saveAndExit);

  process.env.UV_THREADPOOL_SIZE = threads.toString();

  const cachePtr = native._createCache(
    width,
    height,
    cacheSizeMb * 1024 * 1024,
    false,
  );
  const solvers = Array.from({ length: threads }, () =>
    native._createSolver(width, height, cachePtr, false),
  );

  console.log(
    `[+] Created ${threads} independent solvers sharing a ${cacheSizeMb}MB cache.`,
  );
  console.log(`[+] Crunching Alpha-Beta evaluations using worker queue...`);

  let totalNodes = 0n;
  const start = Date.now();
  const queue = [...positions];

  const worker = async (solverPtr: any, id: number) => {
    while (true) {
      const pos = queue.pop();
      if (pos === undefined) break;

      const bookPtr = bootstrapBook ? (bootstrapBook as any)._bookPtr : null;
      const resArr = await native._analyzeExact(
        width,
        height,
        solverPtr,
        pos,
        false, // weak
        1, // 1 thread per solver (External Parallelism)
        bookPtr,
      );

      const score = getRawScore(resArr, width, height);
      const nodes = native._getNodeCount(width, height, solverPtr, false);

      // Node count is reset per analysis in the C++ side now, so we sum it up
      totalNodes += BigInt(nodes);

      // Accumulate into the builder using the 1-indexed uint8_t byte format
      builder.addPosition(pos, score - minScore + 1);

      processed++;

      // Log progress occasionally or every X positions to avoid console spam
      if (processed % threads === 0 || processed === positions.length) {
        const elapsed = (Date.now() - start) / 1000;
        const pct = ((processed / positions.length) * 100).toFixed(1);
        const nps = (Number(totalNodes) / elapsed / 1000000).toFixed(1);
        process.stdout.write(
          `\r[${processed}/${positions.length}] (${pct}%) | ${nps} MN/s | Total Nodes: ${totalNodes.toLocaleString()} | Current: ${pos}      `,
        );
      }
    }
  };

  // Start all workers
  await Promise.all(solvers.map((s, i) => worker(s, i)));
  console.log(""); // Final newline

  const elapsed = (Date.now() - start) / 1000;
  console.log(`\n[+] Finished evaluation in ${elapsed.toFixed(1)}s.`);

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
  for (const s of solvers) {
    native._destroySolver(width, height, s, false);
  }
  native._destroyCache(cachePtr);
  process.exit(0);
}

run().catch(console.error);
