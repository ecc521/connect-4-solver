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
  // CASE 2: 8x8 Board (Exact Solver, no embedded book)
  // =========================================================================
  console.log("--- CASE 2: Switching to 8x8 Board ---");
  await solver.setBoard(8, 8);

  console.log(`Board Size: ${solver.width}x${solver.height}`);
  console.log(`Has Book:   ${solver.hasBook}`); // Expected: false (no embedded book)

  console.log(
    "\nAnalyzing position '12345678' (exact, bounded by a timeout)...",
  );
  // Without a book, large boards can search for a long time. Pass a timeoutMs
  // to bound the search; the result is flagged `aborted: true` if it runs out.
  const res = await solver.analyze("12345678", { timeoutMs: 500 });

  if (res.evaluation) {
    console.log(`Score:            ${res.evaluation.score}`);
    console.log(`Outcome:          ${res.evaluation.outcome}`);
    console.log(`Best Move Column: ${res.bestMove}`);
  }
  console.log(`Aborted:          ${res.aborted ?? false}`);
  console.log("");

  // =========================================================================
  // CASE 3: 6x8 Board (Exact Solver, no embedded book)
  // =========================================================================
  console.log("--- CASE 3: Switching to 6x8 Board ---");
  await solver.setBoard(6, 8);

  console.log(`Board Size: ${solver.width}x${solver.height}`);
  console.log(`Has Book:   ${solver.hasBook}`); // Expected: false

  console.log(
    "\nSolving '123' with timeoutMs: 0 (explicitly infinite - triggers warning)...",
  );
  const warnRes = await solver.solve("123", { timeoutMs: 0 });
  if (warnRes.evaluation) {
    console.log(`Best Move Column (with timeoutMs: 0): ${warnRes.bestMove}`);
  }

  console.log("\nSolving '123' with an explicit timeoutMs...");
  const boundedRes = await solver.solve("123", { timeoutMs: 500 });

  if (boundedRes.evaluation) {
    console.log(`Best Move Column:   ${boundedRes.bestMove}`);
    console.log(`Outcome:            ${boundedRes.evaluation.outcome}`);
  }
  console.log("");

  // 4. Destroy solver to release resources
  await solver.destroy();
  console.log("=== Solver resources released successfully ===");
}

main().catch(console.error);
