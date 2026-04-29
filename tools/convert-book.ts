import * as fs from "fs";
import * as path from "path";
import { getNativeModule } from "../src/index";

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log(
      "Usage: npx ts-node tools/convert-book.ts <width> <height> <input_file> [--ef]",
    );
    return;
  }

  const width = parseInt(args[0]);
  const height = parseInt(args[1]);
  const inputFile = args[2];
  const useEf = args.includes("--ef");

  const native = getNativeModule() as any;
  if (!native) {
    console.error("Native module required.");
    return;
  }

  console.log(`[!] Loading ${inputFile} (${width}x${height})...`);
  const bookPtr = native._createBook(width, height, path.resolve(inputFile));
  if (!bookPtr) {
    console.error("Failed to load book.");
    return;
  }

  // We need the depth from the book header
  const data = fs.readFileSync(inputFile);
  const depth = data[2];
  console.log(`[+] Book loaded. Detected depth: ${depth}`);

  const builder = new native.BookBuilder(width, height, depth);
  console.log(`[!] Dumping entries into builder...`);
  builder.loadFromBook(bookPtr);
  console.log(`[+] Builder populated with ${builder.size()} entries.`);

  const outputDir = path.dirname(inputFile);
  const fileExt = useEf ? ".efbook" : ".book";
  const outputFile = path.join(
    outputDir,
    `${width}x${height}_dense${depth}${fileExt}`,
  );

  console.log(`[!] Saving to ${outputFile}...`);
  if (useEf) {
    builder.saveEliasFano(outputFile);
  } else {
    builder.saveDense(outputFile);
  }

  console.log(`[+] Conversion complete: ${outputFile}`);
  native._destroyBook(width, height, bookPtr);
}

main().catch(console.error);
