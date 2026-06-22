# Project Scopehammer — Connect-4 Solver v5 Plan

**Status:** Draft for review · **Date:** 2026-06-21 · **Owner:** Tucker

A deliberately breaking release (v5). Goal: **shrink the project to a set of things we
can do exceptionally well — exact solving + proof/solution books — and delete
everything that adds maintenance surface without pulling its weight** (NNUE, training,
the heuristic solver, the generic runtime-width fallback).

This doc is the master plan. It is organized so the irreversible/blocking items
(working-tree reconciliation) come first, then the deletions, then the
re-architecture, then the new capabilities.

---

## 0. TL;DR — Decisions requested from you

These are the forks where I want a yes/no before executing. Details in the sections cited.

| # | Decision | My recommendation | §  |
|---|----------|-------------------|----|
| D1 | Reconcile working trees before touching anything | **Commit local TT work + upstream the monorepo's submodule changes first** | §1 |
| D2 | Remove NNUE + training + heuristic solver | Yes — clean cut, ~5k LOC | §2 |
| D3 | Drop the generic `WIDTH==-1` runtime path; require every supported size be compiled | **Yes** — the 50% hit is real and it's the only thing forcing 128-bit + dynamic loops | §3 |
| D4 | The explicit compiled-size set for the default bundle | See proposed list in §3.3 — confirm/edit | §3 |
| D5 | Book format: extend header for weak/strong flag + explicit "partial" semantics | Yes, small forward-compatible bump | §4 |
| D6 | Keep Connect-5 / wraparound variants | Yes — they're already nearly free; one cleanup item | §5 |
| D7 | Larger boards (>8 wide / no book) — drop from default bundle | **Yes**, make them opt-in compile flags | §3.4 |
| D8 | Tromp 8×8 import | Pursue, but format/source needs confirmation first | §6 |

---

## 1. Working-tree reconciliation (BLOCKING — do this first)

### ✅ Status (2026-06-21) — DONE except the push-dependent submodule bump
- Approved **Expo/JSI** migration imported onto `main` via 3-way merge:
  `f8273d7` (JSI on common base `5909195`) → `9d00863` (merge into `main`).
  Only 2 files needed hand-resolution (`expo-module.config.json` took the new Expo
  `apple`/`platforms` form; `src/native.ts` took JSI's object-arg bridge **and** kept
  `main`'s `this.isHeuristic` fix). TS typecheck passes. Includes the TT-width fix
  (`7` → `WIDTH==-1?7:WIDTH`).
- **Controversial** local TT working tree parked on branch `wip/controversial-tt`
  (`b8769fc`) — analyzed, **recommend DISCARD core + salvage 4 safe bits** (see verdict
  below). Not merged.
- ⏳ **Remaining:** push `main` to the remote and bump the monorepo submodule pointer +
  reset its working tree (deferred — requires an outward push; awaiting go-ahead).

### Controversial-tree verdict (`wip/controversial-tt` vs base `d654d82`)
The substantive content is a solver **"verify mode"** + `extractProofTree` book builder —
conceptually aimed at proving books (relevant to §4/§6) but **flawed as implemented**:
- It **re-asserts the book instead of verifying it** — the prover fast-path returns the
  book's claimed score after exploring a single child (`Solver.cpp:241-275`), and the
  null-window collapse returns `stored` as if exact (`Solver.cpp:236`). A corrupt entry
  passes.
- It runs on the **shared TT under Lazy SMP**, poisoning later real solves with
  book-derived (unproven) bounds (reset clears the flag, not the table).
- `extractProofTree` has concrete bugs: dedups on `key()` but stores on `key3()`
  (mirror dupes), validates TT entries by **sign only** (wrong magnitudes), hardcodes
  `align=4`, and truncates 128-bit keys into a `uint64_t` visited-set → silently drops
  proof nodes on exactly the 8×13/128-bit boards it targets. The edited expected score in
  `positions_8x13.txt` (`31008→31006`) looks like output was fit to buggy results.

**Salvage (small, safe, rebase on `main`):** the `13×13` guard + `DynamicCache`
`[14][14]` growth + boundary test; the `CreateBookFromBuffer` dynamic-dispatch bugfix
(`node_binding.cpp`); the `OpeningBook.hpp` error-message tweak; the `bench.ts`
`--weak`/`--cache` tooling. **Discard** verify-mode + `extractProofTree`.

**For §4/§6:** a real proof-book *verifier* is still wanted — but redesigned: single
thread + dedicated/cleared TT, use the book only for **move ordering** (never as a
returnable value, search the prover side too), and a 128-bit-safe `key3()`-keyed extractor.

---

There was real, uncommitted, **divergent** work in two places (history below for the record).

### 1a. This repo (standalone `connect-4-solver`, branch `main` @ `d654d82`)
Unstaged changes to TT / heuristic / position work:
```
 M __tests__/boundary.test.ts
 M native/HeuristicSolver.hpp
 M native/OpeningBook.hpp
 M native/Position.hpp
 M native/Solver.cpp   M native/Solver.hpp   M native/node_binding.cpp
 M src/abstract-solver.ts  M src/core.ts  M src/node.ts
 M test-data/positions_8x13.txt  M tools/bench.ts
?? scratch/
```
These are mid-flight perf changes (the recent history is all `perf(tt)`/`refactor`).
**Action:** decide whether to commit or stash. Since v5 will delete
`HeuristicSolver.hpp` and large parts of `node_binding.cpp` outright, much of this diff
is about to be thrown away — but the `Position.hpp` / `OpeningBook.hpp` / TT changes are
keepers. Recommend: commit the keepers, discard the heuristic-only edits.

### 1b. The monorepo submodule has DIVERGED and is BEHIND
`tucker-games-monorepo/packages/game-engines/connect-4-solver-submodule`:

- **Pinned commit is `5909195`** — that's **7 commits behind** this repo's `main`
  (`d654d82`). The monorepo has *not* seen the recent `perf(tt)` series.
- **12 files are modified in the submodule's working tree** (uncommitted), and they are
  **not** present in this repo. Confirmed by direct file comparison — all 12 differ:
  ```
   M android/CMakeLists.txt, android/build.gradle, Connect4SolverModule.kt
   M ios/Connect4SolverModule.swift, ios/Connect4SolverWrapper.mm
   M connect-4-solver.podspec, expo-module.config.json, package.json
   M src/native.ts, src/threaded.ts
   M native/Solver.cpp, native/Solver.hpp
  ```
- The most important divergence is a **real engine change** in the submodule that this
  repo does NOT have: the transposition table's width template argument was
  parameterized:
  ```diff
  - TranspositionTable<SlotType, uint8_t, VALUE_BITS, 7, 0, MOVE_BITS, position_t>
  + TranspositionTable<SlotType, uint8_t, VALUE_BITS, WIDTH == -1 ? 7 : WIDTH, 0, MOVE_BITS, position_t>
  ```
  (Solver.hpp:86,136,140 and Solver.cpp:807,810 in the submodule.) This repo still
  hardcodes `7`. This is a correctness/perf change for non-7-wide boards that would be
  **silently lost** if we just blow the submodule away.

  > Note: this hardcoded `7` is also a key bit of the TT-sizing story in §3 — it means
  > today's TT slot layout is tuned for width 7 regardless of the real board.

- The rest are the **Expo/JSI mobile integration** (android/ios/podspec/expo config +
  `native.ts`/`threaded.ts` plumbing) that lives only in the monorepo working tree.

**Conclusion:** we are **not** "fully up to date." The two trees have drifted in *both*
directions — this repo is ahead on TT perf, the submodule is ahead on mobile integration
+ the TT-width fix. Before Scopehammer:

1. Decide source of truth (recommend: this standalone repo).
2. Upstream the submodule's 12 working-tree changes into this repo as proper commits
   (at minimum the TT-width parameterization + the Expo integration).
3. Land the keepers from §1a.
4. Bump the submodule pointer in the monorepo to the new `main`.

I have the full diffs captured and can prepare these commits on request.

---

## 2. Remove NNUE + training pipeline + heuristic solver

Clean cut. The heuristic/NNUE code is well-isolated from the exact engine — the only
shared piece is `MoveSorter.hpp`, which the exact search needs and which contains **no**
NNUE logic. So this is mostly deletion, not surgery.

### 🚧 Status (2026-06-21) — native+core DONE on branch `v5` (`49073e3`)
**Done & validated:** deleted all NNUE/HeuristicSolver/training files; stripped heuristic
from `bindings_core.hpp`, `dispatch_table.hpp`, `node_binding.cpp`, `analyze.cpp`,
`build.sh`; `isHeuristic` forced false and AdaptiveSolver no longer auto-selects
heuristic. **Native addon builds & links cleanly, `tsc` passes, exact test suites pass
(embedded-book/variants/abort 16/16).** (WASM + mobile not buildable in this env.)

**Remaining to finish §2 (next session):**
1. **TS API cleanup (overlaps §3.5):** remove the now-ignored `heuristic` option,
   `maxDepth`, `isHeuristic`/`depthReached` fields, the dead `if (this.isHeuristic)`
   branches and `_analyzeHeuristic`/`_solveHeuristic` interface decls in
   `core.ts`/`abstract-solver.ts`/`node.ts`/`native.ts`/`async.ts`; drop `"nnue"` from
   `capabilities.ts` + `SCORE_NNUE_MAX` (`constants.ts`). Also retire the legacy
   `is_heuristic` native arg slots once both sides are updated together.
2. **Mobile bridges (not compiled here):** remove `Size::HeuristicSolver` usage +
   heuristic JNI/Obj-C funcs and the Kotlin/Swift `AnalyzeHeuristicArgs`/AsyncFunctions
   in `android/cpp/react-native-connect-4-solver.cpp`, `ios/Connect4SolverWrapper.mm`,
   `Connect4SolverModule.{kt,swift}`.
3. **Tools:** `tools/Makefile` (drop `generate_nnue_data`), `tools/generate_node_bindings.py`
   (stop emitting heuristic), `tools/bench.ts` + `tools/benchmarks/bench_native.cpp` NNUE refs.
4. **Dead C++:** `Position.hpp::heuristic_evaluate` (no callers) and `Constants.hpp`
   `SCORE_NNUE_MAX` (no callers).
5. **Tests:** prune/rewrite heuristic-dependent cases. ⚠️ `__tests__/boundary.test.ts`
   8×8 cases now force **exact** 8×8 (intractable) → **full `npm test` hangs** until these
   are given a book/timeout or removed. `benchmark.test.ts` + heuristic cases in
   `cache/book/adaptive/index` tests also need pruning.
6. **Docs/README:** drop NNUE/heuristic sections + "Heuristic Mode" quick-start.

### 2.1 Delete entirely
**Native:** `native/NNUE.hpp`, `NNUEAccumulator.hpp`, `NNUEAccumulatorOneLayer.hpp`,
`nnue_weights_7x6.hpp` (87 KB), `nnue_weights_8x8.hpp` (158 KB), `HeuristicSolver.hpp`,
`HeuristicSolver.cpp`.

**Training (Python/C++):** `tools/train_nnue.py`, `export_weights.py`,
`export_weights_8x8.py`, `generate_nnue_data.cpp`, `generate_nnue_midgame.cpp`,
`gen_training_data_8x8.cpp`, `gen_dataset_parallel.py`, `evaluate_accuracy.py`.

**TS / docs / tests:** `src/heuristic.test.ts`, `docs/heuristic-solver.md`.

### 2.2 Edit to remove references (keep the file)
- **`native/bindings_core.hpp`** — drop `#include "HeuristicSolver.hpp"`, all
  `using HeuristicSolver = …` aliases, and the heuristic column of the
  `AllSupportedSizes` tuple. `MoveSorter.hpp` stays.
- **`native/dispatch_table.hpp`** — delete `DISPATCH_HEURISTIC*` /
  `DISPATCH_CREATE_HEURISTIC*` macros and the heuristic fallback branch.
- **`native/node_binding.cpp`** — delete `SolveHeuristicWorker`/`AnalyzeHeuristicWorker`,
  `runSolveHeuristicRaw`/`runHeuristicAnalysisRaw`, the `_solveHeuristic`/`_analyzeHeuristic`
  NAPI exports, and the `is_heuristic` branches in cache/solver create/stop/nodecount.
- **`native/analyze.cpp`** (WASM) — delete the matching heuristic entry points and
  `if (is_heuristic)` branches.
- **TS:** `core.ts`, `abstract-solver.ts`, `capabilities.ts`, `adaptive.ts`,
  `native.ts`, `node.ts`, `constants.ts` (drop `SCORE_NNUE_MAX`; keep
  `SCORE_FORCED_WIN_BASE` only if still used by exact result encoding — verify),
  `async.ts`/`sync.ts`/`threaded.ts`/`worker-handler.ts` (minor).
  → Full member-level list is in §3.5 (API) since these overlap.
- **Tests:** prune heuristic cases in `__tests__/{benchmark,cache,boundary,book}.test.ts`
  and `src/adaptive.test.ts`.
- **Docs/README:** drop NNUE/heuristic sections and the "Heuristic Mode" quick-start.

### 2.3 Platform bindings
iOS/Android wrappers are generic solver bridges — no heuristic-specific endpoints found
on the platform side; the TS layer (`native.ts`) is where the heuristic methods live.
(Reconcile against the monorepo's mobile changes from §1b — those touch the same files.)

### 2.4 Net effect
~3k LOC C++ + ~1k LOC TS + ~1.5k LOC Python removed, plus ~245 KB of embedded weight
headers. Binary shrinks (see §3.4).

---

## 3. Template / instantiation scheme — drop the generic path

### 3.1 What exists today (the "hybrid")
Board geometry is a **compile-time** template: `Solver<WIDTH, HEIGHT, ALIGN, WRAP>`.
`WIDTH == -1` is a **sentinel for a single generic, runtime-width instantiation**
(`C4_Dynamic`). Dispatch (`dispatch_table.hpp`) matches a requested `(w,h,align,wrap)`
against the compiled tuple; if there's no match but it's standard C4 and fits 127 bits,
it **falls back to the `WIDTH==-1` generic solver**.

Explicitly compiled today (`bindings_core.hpp`):
- Standard C4: **6×8, 7×6, 7×7, 8×6** (the `SUPPORTED_SIZES_X_MACRO`)
- Variants: **C5 8×8, C4-wrap 7×6, C5-wrap 8×8**
- **+1 generic** `WIDTH==-1` fallback.

### 3.2 Why the generic path is ~50% slower (confirmed)
The `WIDTH==-1` instantiation pays for runtime geometry on every hot-path op:
1. **Always 128-bit** position words (`unsigned __int128`), even for boards that fit in
   64 bits — 128-bit shifts/masks are multi-instruction sequences, not native ops.
2. **Runtime loop bounds** (`for j < P.width()`) → no unrolling/vectorization.
3. **Heap `std::vector`** for per-board tables (Tromp weights, column order, history)
   instead of stack `std::array`.
4. **Conservative TT bit-packing** (`VALUE_BITS=8`, `MOVE_BITS=4`) → more collisions.
   (Also see the width-`7` TT hardcode flagged in §1b — the TT layout is currently tied
   to width 7 regardless of the actual board, which the monorepo's diff partially fixes.)

This is inherent to "one binary, any size." The only way to remove it is to compile each
size you intend to support.

### 3.3 Plan: compile every supported size, delete `WIDTH==-1`
- Remove the `C4_Dynamic` tuple entry and the generic fallback in `dispatch_impl` /
  `dispatch_void_impl`. An unsupported size becomes a clean `throw` ("size not compiled
  into this build") instead of a silent 2× slowdown.
- Promote every size we care about into `SUPPORTED_SIZES_X_MACRO`.
- Each specialized size picks the **smallest** position word (`uint64_t` when
  `W*(H+1) ≤ 64`, else `__int128`) and tight `VALUE_BITS`/`MOVE_BITS` — this is where the
  perf comes from.

**Proposed default-bundle size set (D4 — confirm/edit):**
- All exactly-solvable small boards: every `W×H` with `W,H ∈ [4..7]` that's tractable
  (these are cheap to compile and round out the "just works" story).
- The book-backed targets you named: **7×6, 7×8, 7×9, 8×7, 8×8**.
- Variants: **C5 8×8, C4-wrap 7×6, C5-wrap 8×8** (unchanged).

Everything else → not in default bundle (§3.4).

### 3.4 Binary size
Counter-intuitively, v5 likely **shrinks** the binary even though we compile *more* exact
sizes, because we delete: 245 KB of NNUE weights, every per-size `HeuristicSolver`
instantiation, and the 128-bit-everywhere generic solver. Each added exact size is on the
order of tens-to-low-hundreds of KB of code (and dedups well at link time). Your "4 MB
pre-compression is fine" budget is comfortable. **Action:** measure `.wasm` + `.node`
before/after as we go; don't guess.

> Caveat on the "72 sizes" you may have heard: the ~72 `(w,h)` entries in
> `node_binding.cpp`'s `DestroyBook` are **book-pointer slots**, not full solver
> instantiations. The actual compiled *solvers* are just the tuple in `bindings_core.hpp`.
> So the instantiation bloat is smaller than it looks; the weight headers + heuristic
> instantiations are the real fat.

### 3.5 API simplification (the v5 public surface)
With heuristic gone and sizes explicit, the API collapses nicely. Breaking changes:

**`Connect4SolverOptions`** — remove `heuristic`. Keep `width`, `height`, `cacheSizeMb`,
`align`, `wrap`.

**`AnalyzeOptions`** — remove `maxDepth` (heuristic-only). Keep `threads`, `timeoutMs`
(still useful as a hard stop), `book`, `weak`.

**`PositionAnalysis`** — remove `isHeuristic` and `depthReached`. Everything is exact now.

**`Evaluation`** — drop the "score/100 for heuristic" normalization; values are exact
outcome/score only.

**`BaseConnect4Solver`** — remove `isHeuristic`. The `createEvaluation` /
`executeWasmAnalyze` / `executeWasmSolve` / `parseResArr` functions in
`abstract-solver.ts` lose their dual code paths and become exact-only (~100 LOC simpler).

**`SolverCapability` / `getSolverCapability()` / `capabilities.ts`** — today returns
`"exact" | "nnue" | "tactical"`. Post-removal, `"nnue"` is gone and `"tactical"`
(heuristic-without-a-net) is meaningless. **Recommended v5 model:** capability is binary —
a board is either **solvable** (small enough for exact, or has a book) or **unsupported**
(throws / returns "not solvable in this build"). This directly encodes the new scope: we
only answer questions we can answer *exactly*. Removes `NNUE_BOARDS` and most of the
branching.

**`AdaptiveSolver`** — the heuristic-vs-exact auto-selection (`setBoard` →
`useHeuristic = …`) disappears; it just picks the right exact solver + book. Drop the
`defaultTimeoutMs`-is-required-for-heuristic warnings.

**Entry points** — keep all subpath exports (`./node`, `./sync`, `./threaded`, `./async`,
`./native`, `./worker-handler`, `./core`); they're runtime targets, not heuristic
artifacts. Drop the deprecated `BOARD_WIDTH` const. Possible further simplification:
fold `sync` + `threaded` selection behind one detection point (optional, low priority).

---

## 4. Proof / solution books — weak & strong, partial (the new headline feature)

**Good news: we're ~85% there.** The book layer was built around dense complete books,
but the on-disk format and lookup semantics already tolerate partial coverage.

### 4.1 Current format (native/OpeningBook.hpp)
6-byte header: `width, height, depth, key_bytes, value_bytes(==1), log_size`
(`0x00`=dense, `0xFF`=Elias-Fano). Then sorted keys, then 1-byte values.
- **Dense** `.book`: sorted `key_bytes`-wide little-endian keys + parallel value array;
  binary search; key width auto-sized to the largest key.
- **Elias-Fano** `.efbook`: compressed monotone key set (64-bit key ceiling) + values.
- Value byte = `score - min_score() + 1`. Since `min/max_score = ±(W·H+1)/2`, an 8×8
  strong score spans ±32 (~65 states) — **1 byte is plenty** for every size we'd bundle
  (1 byte covers ~254 cells of range). No multi-byte values needed.

### 4.2 Partial books already work
`num_entries = (file_size − header) / (key_bytes + value_bytes)` — the file only holds
what was written; **there is no completeness requirement**. A lookup miss returns the
"not found" sentinel and the solver just searches normally. So a proof table that only
stores *some* positions/moves is already a first-class citizen at read time. We already
ship partial-depth proof books (`data/7x6_proof{1,6,8,16,42}.efbook`).

### 4.3 Weak vs strong already exist in the engine
The solver has a `weak` mode (`dispatch_solve_weak`, `Solver.hpp`/`Solver.cpp`) that
resolves only Win/Draw/Loss; `generate-book.ts --weak` builds weak books. Strong = exact
distance-to-result. **The gap:** nothing in the *file* records whether its values are weak
(±1/0) or strong (full score) — only the caller "knows." Mixing them silently mis-ranks
moves (docs/solution-books.md already warns about this).

### 4.4 Format changes for v5 (D5)
Small, forward-compatible:
1. **Add a `flags` byte to the header** (weak/strong; reserve bits for future). Bump a
   format-version marker so old readers fail loudly rather than misread.
2. **Define "partial" explicitly.** Decide the contract for a miss: "unknown, go search"
   (current) is right for proof tables. Optionally reserve one value code for "known
   draw" so a stored 0 is distinguishable from absent (matters if we ever want to assert
   completeness over a region).
3. **`BookBuilder.setWeak(bool)`** + a `bookKind()` getter on load; surface it in
   `OpeningBook` (TS) so callers can't cross weak/strong by accident.
4. Keep Elias-Fano for ≤64-bit keys (7×6, 7×8, 8×7…); fall back to dense for any book
   whose keys overflow 64 bits.

This is the right place to spend design effort — it's the v5 differentiator.

---

## 5. Connect-5 & wraparound — keep, make maintenance ~free

These are **already cheap.** `ALIGN` and `WRAP` are compile-time template params, and the
variant-specific logic is isolated to essentially one function:
`compute_winning_position_impl()` in `Position.hpp` (plus trivial `wrap_left/right`
helpers and the symmetry-key rotation for wrapped boards). When `WRAP==false`/`ALIGN==4`
the branches compile away — **zero runtime cost on the standard path.** Move generation,
search, and the TT are variant-agnostic. There is **no combinatorial blow-up**: each
variant is added as a single explicit tuple entry, not a cross-product with sizes.

To hit "negligible to maintain":
1. **Don't let variants ride the book/Adaptive code without a guard.** Books are keyed by
   `(W,H)` only — loading a standard book for a wrap/c5 board would corrupt results. Add
   `(align, wrap)` to book identity / capability checks (small change in `capabilities.ts`
   + book metadata from §4.4).
2. Keep the two variant test fixtures (`positions_8x8_c5.txt`, `positions_7x6_wrap.txt`)
   and the `variants.test.ts` suite green through the refactor — they're the cheap
   insurance that the `if constexpr` branches stay correct.
3. Document the contract: "variants are exact-only, no books unless explicitly generated."

No structural work needed — just the guard + keeping tests in CI.

> **Mobile gap (found during JSI review, pre-existing — not a JSI regression):** the
> React Native bridge has **never** supported weak solving. The native JNI/Obj-C
> `nativeAnalyze`/`nativeSolve` signatures have no `weak` parameter, and the old TS
> `weak` arg was silently dropped before the native call (the new Expo `Record` args just
> omit it). So if v5 wants weak / proof-book solving **on mobile** (relevant to §4/§6),
> the native function signatures (Kotlin `nativeSolve`, Obj-C `Connect4SolverWrapper`
> `solve:`, and the `AnalyzeArgs` Records) must be extended to pass `weak` through to the
> already-`weak`-capable C++ `solve()`. WASM/Node already plumb `weak`.

---

## 6. Tromp 8×8 import (D8)

Feasibility: **plausible, but the source artifact and its encoding must be confirmed
before committing.** John Tromp's 8×8 result is a draw; what we need is a downloadable
*database/solution* (positions → result), not just the headline.

The conversion crux is **position-key mapping**, not the container:
1. Obtain the artifact; document its exact byte layout and value semantics
   (weak outcome vs strong score; first-player perspective; move encoding).
2. Map Tromp's position encoding → our `Position::key3()` bitboard layout (column-major,
   `H+1` bits/column, little-endian). This is the part that can silently go wrong — needs
   a verified round-trip test against our own 8×8 solver on a sample of positions.
3. Emit via `BookBuilder` → dense `.book` (8×8 keys may exceed 64 bits ⇒ prefer dense
   over Elias-Fano), tagged weak/strong per §4.4.
4. Verify with `verify_book` + spot-check against direct solves.

**Recommendation:** treat as a follow-on milestone after the book-format work (§4) lands,
since it depends on the weak/strong flag. I'll confirm the Tromp source/format before we
schedule it — don't want to build a converter against an assumed layout.

---

## 7. Suggested sequencing

1. **§1 Reconcile working trees** (blocking; commit keepers, upstream submodule changes,
   bump pointer).
2. **§2 Delete NNUE/training/heuristic** (big, mostly mechanical; lands the LOC win).
3. **§3 Drop `WIDTH==-1`, set explicit size list, simplify API** (the perf + surface win).
   Bump to `v5.0.0`, rewrite README around exact-only + books.
4. **§4 Book format v2** (weak/strong flag, partial semantics, builder/TS surfacing).
5. **§5 Variant guards** (small; fold in with §3/§4).
6. **§6 Tromp 8×8** (after §4, pending source confirmation).

Each of 2–6 is independently shippable and testable. Recommend a `v5` branch.

---

## 8. Open questions for you
- **D1:** OK to commit the local TT keepers and upstream the monorepo submodule's 12
  changes (incl. the TT-width fix) into `main` before we start? Which repo is source of
  truth?
- **D4:** Confirm the default-bundle size list in §3.3. Anything to add/drop?
- **D5:** Sign off on the header bump (weak/strong flag + version). Do you want the
  "known draw vs absent" distinction, or is miss=search sufficient?
- **D7:** Confirm large boards become opt-in compile flags (not in default npm bundle).
- **D8:** Where is the Tromp 8×8 artifact, and do you know its format? (Determines effort.)
