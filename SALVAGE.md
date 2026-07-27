# Salvage plan — `wip/controversial-tt`

Investigation output (not yet applied). The verify-mode / `extractProofTree` core is
**discarded** (flawed — see [SCOPEHAMMER.md](SCOPEHAMMER.md) §1 verdict). These 4 bits are
safe and worth keeping. Source branch: `wip/controversial-tt` (`b8769fc`), genuine base
`d654d82`.

> **Ordering vs v5 §2 (NNUE/heuristic removal):** §2 rewrites `native/node_binding.cpp`
> and `tools/bench.ts`, so the line numbers below will shift. Apply items **C/D after §2
> lands** (by hand, small). Items **A/B** are independent and can go anytime. On any
> `Solver.hpp/.cpp` overlap, **keep `main`'s `WIDTH==-1?7:WIDTH`** — never the branch's
> stale `7`.

---

## A. 13×13 guard + `DynamicCache` growth — `native/Position.hpp` ✅ independent
- Constructor (`GenericPosition`, ~:459) throws `std::invalid_argument` when `w>13||h>13`.
- `DynamicCache` arrays grown `[13][13]→[14][14]`, init loops `<=12→<=13`. **Necessary** to
  address height/width = 13 without OOB.
- **Apply-with-fix:** the flat "13×13" limit is partly cosmetic — a 13×13 board is
  13×14 = 182 bits, which exceeds the 128-bit `position_t` (dispatch already rejects
  `w*(h+1) > 127`). Either tie the message/limit to the real 128-bit capacity, or keep the
  redundant guard and note it's a friendlier secondary check. Low priority either way.
- Pull verbatim: `git show wip/controversial-tt:native/Position.hpp` (the two hunks at
  ~:459 and ~:841).

## B. Boolean `load`-mismatch error message — `native/OpeningBook.hpp` ✅ independent
- `OpeningBookBase::load` (~:306): adds expected-vs-got dimensions to the throw message.
  Pure DX improvement, zero risk. One-line hunk.

## C. `CreateBookFromBuffer` dynamic-dispatch bugfix — `native/node_binding.cpp` ⚠️ after §2
- `CreateBookFromBuffer` (~:643): macro params `W,H` → `W_TPL,H_TPL`, and
  `load_from_memory(data, size, W, H)` → `load_from_memory(data, size, w, h)`. Passes the
  **runtime** dims so the `WIDTH==-1` (dynamic) instantiation loads correctly instead of
  using template sentinels. Genuine bug. Re-apply after §2 (book code survives §2).
- Also in this file: the **13×13 guards + try/catch** in `CreateCache` (~:35) and
  `CreateSolver` (~:66) that surface `Position.hpp`'s throw as a clean JS exception. Keep
  these (they pair with item A and with the boundary test, item E). Discard every other
  `node_binding.cpp` hunk (`runSolveRaw`/`SolveExact` verify param, `extractProofTree` at
  ~:881) — that's the flawed core.

## D. `bench.ts` `--weak` / `--cache` flags — `tools/bench.ts` ⚠️ light overlap with §2
- Adds `--weak` (weak-solve parity scoring) and `--cache` (cache-MB override) CLI flags
  (~10 hunks, self-contained). §2 will strip NNUE references from this file, so apply the
  flags in a way compatible with the post-§2 version. Low risk.

## E. Boundary test — `__tests__/boundary.test.ts` ✅ pairs with A/C
- Adds a case asserting `new NodeConnect4Solver({width:14,height:6}).init()` rejects with
  "Board dimensions too large…". Apply together with A+C so it passes.

---

## Suggested execution
1. Land **A + B + (C/E guards)** as one small "size-limit hardening" PR after §2.
2. Land **C (CreateBookFromBuffer fix)** as its own one-liner (or fold into #1).
3. Land **D** with the bench cleanup that §2 already touches.
4. Delete `wip/controversial-tt` once these are extracted.
