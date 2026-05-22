/**
 * capabilities.ts
 *
 * Defines the SolverCapability type and the getSolverCapability() utility,
 * which describe what level of analysis the engine can provide for a given
 * board size and book state.
 *
 * Used internally by AdaptiveSolver and can be checked by consumer UIs to
 * decide whether to show/hide analysis features.
 */

import { EMBEDDED_BOOK_SIZES } from "./embedded-book-sizes.js";
export { EMBEDDED_BOOK_SIZES };


/**
 * Describes the quality of analysis the engine can provide for a board.
 *
 * - `'exact'`    – Full exact minimax. Guaranteed optimal results. Applies when
 *                  the board is small (w < 7 && h < 7) or an opening book is
 *                  loaded (book handles the opening, exact handles endgame).
 *
 * - `'nnue'`     – Heuristic search with a trained NNUE evaluation network.
 *                  Results are high-quality but not provably optimal for
 *                  mid-game positions. Terminal positions are found exactly
 *                  via iterative deepening.
 *
 * - `'tactical'` – Heuristic search with no trained NNUE for this board size.
 *                  The engine can detect forced wins/losses within search depth
 *                  but cannot evaluate positional strength. Essentially useless
 *                  for analysis; only viable for AI opponent play.
 *                  A `timeoutMs` is REQUIRED when using this capability to
 *                  prevent infinite hangs.
 */
export type SolverCapability = "exact" | "nnue" | "tactical";

/**
 * Board sizes for which trained, quality NNUE weight files exist.
 * Add new entries as additional models are trained and embedded.
 */
const NNUE_BOARDS: ReadonlySet<string> = new Set([
  "8x8", // 8x8 weights in training
]);

// EMBEDDED_BOOK_SIZES is re-exported from the auto-generated embedded-book-sizes.ts.
// It is declared there and kept in sync by tools/gen_embedded_books.py.

/**
 * Returns the analysis capability for a given board size.
 *
 * @param width   Board width in columns
 * @param height  Board height in rows
 * @param hasBook Whether an opening book is currently loaded
 */
export function getSolverCapability(
  width: number,
  height: number,
  hasBook: boolean,
): SolverCapability {
  // A loaded book makes any board tractable for exact
  if (hasBook) return "exact";

  // Small boards: exact is always fast enough (≤6x6, low branching factor)
  if (width < 7 && height < 7) return "exact";

  // Boards with an embedded opening book compiled into the binary
  if (EMBEDDED_BOOK_SIZES.has(`${width}x${height}`)) return "exact";

  // Trained NNUE weights exist for this board size
  if (NNUE_BOARDS.has(`${width}x${height}`)) return "nnue";

  // Everything else: tactical only
  return "tactical";
}
