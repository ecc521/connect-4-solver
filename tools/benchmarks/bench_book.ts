import {
  OpeningBook,
  NodeConnect4Solver,
  getNativeModule,
} from "../../src/index";
import { performance } from "perf_hooks";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

async function runBookBenchmark() {
  console.log(`Starting Book Latency Benchmark`);
  console.log(`===============================`);

  const efBookPath = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "7x6_dense14.efbook",
  );

  if (!fs.existsSync(efBookPath)) {
    console.error(`Skipping benchmark: Book file not found at ${efBookPath}`);
    return;
  }

  const native = getNativeModule();
  if (!native) {
    console.error(`Native module not found! Required for BookBuilder.`);
    return;
  }

  const loadBook = async (name: string, filePath: string) => {
    const startLoad = performance.now();
    const data = new Uint8Array(fs.readFileSync(filePath));
    const book = new OpeningBook(7, 6);
    await book.load(data);
    const loadTime = performance.now() - startLoad;
    console.log(
      `[${name}] Loaded ${filePath} in ${loadTime.toFixed(2)}ms (${(data.length / 1024 / 1024).toFixed(2)} MB)`,
    );
    return book;
  };

  const efBook = await loadBook("EFBook", efBookPath);

  console.log(`\nCloning EFBook to DenseBook format (in memory)...`);
  const startClone = performance.now();
  const builder = new native.BookBuilder(7, 6, 14);
  builder.loadFromBook(efBook.ptr);

  const denseBuffer = builder.getDenseBuffer();
  const cloneTime = performance.now() - startClone;
  console.log(`Dense clone created in memory in ${cloneTime.toFixed(2)}ms\n`);

  const startLoadDense = performance.now();
  const denseBook = new OpeningBook(7, 6);
  await denseBook.load(denseBuffer);
  const loadDenseTime = performance.now() - startLoadDense;
  console.log(
    `[DenseBook] Loaded from memory buffer in ${loadDenseTime.toFixed(2)}ms (${(denseBuffer.length / 1024 / 1024).toFixed(2)} MB)\n`,
  );

  const solver = new NodeConnect4Solver({ width: 7, height: 6 });
  await solver.init();

  // Generate some random valid queries for an early game
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

  const benchBook = async (name: string, book: OpeningBook) => {
    const startQuery = performance.now();
    let hits = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      for (const q of queries) {
        const res = await solver.analyze(q, { book, maxDepth: 1, threads: 1 });
        if (res.evaluation?.score !== undefined && res.nodes === 0) hits++;
      }
    }

    const queryTime = performance.now() - startQuery;
    const qps = (totalQueries / (queryTime / 1000)).toFixed(0);

    console.log(`--- ${name} ---`);
    console.log(`Total Queries: ${totalQueries}`);
    console.log(`Query Time: ${queryTime.toFixed(2)}ms`);
    console.log(`Queries Per Second: ${qps} QPS\n`);
  };

  await benchBook("Elias-Fano Book", efBook);
  await benchBook("Dense Book", denseBook);

  efBook.release();
  denseBook.release();
}

runBookBenchmark().catch(console.error);
