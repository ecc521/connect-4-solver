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
 * - `'exact'` – Full exact minimax. Guaranteed optimal results. As of v5 the
 *               heuristic/NNUE engine has been removed, so the solver is always
 *               exact. Larger boards without an opening book are simply slower
 *               (use a `timeoutMs` to bound the search); there is no approximate
 *               fallback anymore.
 */
export type SolverCapability = "exact";

// EMBEDDED_BOOK_SIZES is re-exported from the auto-generated embedded-book-sizes.ts.
// It is declared there and kept in sync by tools/gen_embedded_books.py.

/**
 * Returns the analysis capability for a given board size.
 *
 * As of v5 the engine is exact-only, so this always returns "exact". The
 * parameters are retained for API compatibility and potential future use.
 *
 * @param width   Board width in columns
 * @param height  Board height in rows
 * @param hasBook Whether an opening book is currently loaded
 */
export function getSolverCapability(
  _width: number,
  _height: number,
  _hasBook: boolean,
  _align = 4,
  _wrap = false,
): SolverCapability {
  return "exact";
}
