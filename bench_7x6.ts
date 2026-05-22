import { NodeConnect4Solver } from "./src/index.js";
import fs from "fs";

async function run() {
  const solver = new NodeConnect4Solver(7, 6);
  await solver.init();

  const lines = fs.readFileSync("test-data/7x6.txt", "utf8").split("\n").filter(l => l.trim());
  const toTest = lines.slice(0, 10);
  
  const start = performance.now();
  let nodes = 0;

  for (const line of toTest) {
    const [pos] = line.split(" ");
    const res = await solver.analyze(pos);
    nodes += res.nodes || 0;
  }
  
  const timeMs = performance.now() - start;
  console.log(`Nodes: ${nodes}, Time: ${timeMs.toFixed(2)}ms, NPS: ${(nodes / (timeMs / 1000)).toFixed(0)}`);
  
  solver.release();
}
run();
