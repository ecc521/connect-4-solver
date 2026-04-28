import { Connect4Solver } from "../src/index";
import { getNativeModule } from "../src/index";
import * as path from "path";
import * as fs from "fs";

function getRawScore(resArr: Int32Array | number[], width: number, height: number): number {
    const status = resArr[0];
    const nbMoves = resArr[1];
    if (status === 1) { // STATUS_WIN
        return Math.floor((width * height + 1 - nbMoves) / 2);
    }
    let bestScore = -10000;
    for (let i = 0; i < width; i++) {
        const n = resArr[2 + i];
        if (n !== -1000) { // UNPLAYABLE_COLUMN_SCORE is -1000
            if (n > bestScore) {
                bestScore = n;
            }
        }
    }
    return bestScore;
}

async function run() {
    const args = process.argv.slice(2);
    let width = 7, height = 6, depth = 10, cacheSizeMb = 128, threads = 12;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--width') width = parseInt(args[++i]);
        if (args[i] === '--height') height = parseInt(args[++i]);
        if (args[i] === '--depth') depth = parseInt(args[++i]);
        if (args[i] === '--cacheMB') cacheSizeMb = parseInt(args[++i]);
        if (args[i] === '--threads') threads = parseInt(args[++i]);
    }

    console.log("=========================================================");
    console.log(` ${width}x${height} ${threads}-Core Native Iterative Alpha-Beta Orchestrator`);
    console.log("=========================================================");

    const native = getNativeModule();
    if (!native) {
        console.error("Native module 'connect4.node' is required for generating books natively.");
        process.exit(1);
    }

    const minScore = -Math.floor((width * height) / 2) + 3;

    const solver = new Connect4Solver({ width, height, cacheSizeMb });
    await solver.init();

    console.log(`[!] Generating raw permutations up to depth ${depth}...`);
    const positions: string[] = native._generatePositions(width, height, depth);
    console.log(`[+] Generated ${positions.length.toLocaleString()} unique evaluation points.`);

    const builder = new native.BookBuilder(width, height, depth);

    console.log(`[+] Crunching Alpha-Beta evaluations...`);
    
    let processed = 0;
    const start = Date.now();
    for (const pos of positions) {
        // We can just use native._analyzeExact directly to get the raw Int32Array and parse it
        const resArr = await native._analyzeExact(width, height, (solver as any)._solverPtr, pos, threads, null);
        const score = getRawScore(resArr, width, height);

        processed++;
        const elapsed = (Date.now() - start) / 1000;
        const rate = Math.floor(processed / elapsed);
        console.log(`[${processed}/${positions.length}] Evaluated ${pos} -> Score: ${score} (${rate} pos/sec)`);
    }

    const elapsed = (Date.now() - start) / 1000;
    console.log(`\n[+] Finished evaluation in ${elapsed.toFixed(1)}s.`);

    console.log(`[+] Packing transitive sequence cache into dense .book natively...`);
    
    const outputDir = path.join(__dirname, "../data");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputFile = path.join(outputDir, `${width}x${height}_dense${depth}.book`);
    
    builder.saveDense(outputFile);
    
    console.log(`[+] Book successfully saved to ${outputFile}`);
    process.exit(0);
}

run().catch(console.error);
