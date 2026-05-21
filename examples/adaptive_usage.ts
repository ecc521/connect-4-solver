import { AdaptiveSolver } from "../src/index.js";

async function main(): Promise<void> {
  console.log("=== CONNECT 4 SOLVER: ADAPTIVE SOLVER EXAMPLE ===\n");

  // 1. Instantiate the AdaptiveSolver
  const solver = new AdaptiveSolver({
    cacheSizeMb: 128,
  });

  // =========================================================================
  // CASE 1: Standard 7x6 Board (Exact Solver + Embedded Book)
  // =========================================================================
  console.log("--- CASE 1: Switching to 7x6 Board ---");
  await solver.setBoard(7, 6);

  console.log(`Board Size: ${solver.width}x${solver.height}`);
  console.log(`Capability: ${solver.capability}`); // Expected: 'exact'
  console.log(`Has Book:   ${solver.hasBook}`); // Expected: true (auto-loaded embedded book)

  console.log("\nSolving position '443322' (Exact)...");
  const exactRes = await solver.solve("443322");

  if (exactRes.evaluation) {
    console.log(`Evaluation Outcome: ${exactRes.evaluation.outcome}`);
    console.log(`Winner:             ${exactRes.evaluation.winner}`);
    console.log(`Best Move Column:   ${exactRes.bestMove}`);
    console.log(`Nodes Searched:     ${exactRes.nodes}`);
  }
  console.log("");

  // =========================================================================
  // CASE 2: 8x8 Board (NNUE Heuristic Solver)
  // =========================================================================
  console.log("--- CASE 2: Switching to 8x8 Board ---");
  await solver.setBoard(8, 8);

  console.log(`Board Size: ${solver.width}x${solver.height}`);
  console.log(`Capability: ${solver.capability}`); // Expected: 'nnue' (has trained NNUE model)
  console.log(`Has Book:   ${solver.hasBook}`); // Expected: false (no embedded book)

  console.log(
    "\nAnalyzing position '12345678' (NNUE with shallow depth limit)...",
  );
  const nnueRes = await solver.analyze("12345678", { maxDepth: 4 });

  if (nnueRes.evaluation) {
    console.log(`Score (Centipawns): ${nnueRes.evaluation.score}`);
    console.log(`Best Move Column:   ${nnueRes.bestMove}`);
    console.log(`Search Depth:       ${nnueRes.depthReached}`);
  }
  console.log("");

  // =========================================================================
  // CASE 3: 6x8 Board (Tactical Heuristic Solver - Guard Clause)
  // =========================================================================
  console.log("--- CASE 3: Switching to 6x8 Board ---");
  await solver.setBoard(6, 8);

  console.log(`Board Size: ${solver.width}x${solver.height}`);
  console.log(`Capability: ${solver.capability}`); // Expected: 'tactical' (win/loss search only)
  console.log(`Has Book:   ${solver.hasBook}`); // Expected: false

  console.log(
    "\nSolving '123' with timeoutMs: 0 (explicitly infinite - triggers warning)...",
  );
  const warnRes = await solver.solve("123", { timeoutMs: 0, maxDepth: 4 });
  if (warnRes.evaluation) {
    console.log(`Best Move Column (with timeoutMs: 0): ${warnRes.bestMove}`);
  }

  console.log("\nSolving '123' with explicit timeoutMs and maxDepth...");
  const tacticalRes = await solver.solve("123", {
    timeoutMs: 500,
    maxDepth: 4,
  });

  if (tacticalRes.evaluation) {
    console.log(`Best Move Column:   ${tacticalRes.bestMove}`);
    console.log(`Search Depth:       ${tacticalRes.depthReached}`);
  }
  console.log("");

  // 4. Destroy solver to release resources
  await solver.destroy();
  console.log("=== Solver resources released successfully ===");
}

main().catch(console.error);
