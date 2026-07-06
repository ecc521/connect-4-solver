/**
 * test_book_depth_boundary.cpp
 *
 * Regression test for solve_single()'s root-level book-hit handling.
 *
 * Background: solve_single() used to return {score, -1, ...} immediately when
 * the root position's book lookup fully resolved the score (exact match, or
 * bounds collapsing the search window). It now falls through (`goto find_move`)
 * to compute a real best move via PHASE 1 (book-only child scan) / PHASE 2
 * (TT/full re-search fallback).
 *
 * PHASE 1 can only succeed when a child position (P.nbMoves() + 1) is still
 * within book_depth. When P sits exactly at book_depth, every child is one ply
 * past the book's coverage and PHASE 1 always misses by construction — the
 * fix in Solver.cpp restricts PHASE 1 to `P.nbMoves() < book_depth` so that
 * case skips straight to PHASE 2 instead of wasting failed lookups.
 *
 * This test doesn't measure speed — it confirms PHASE 2's fallback still
 * produces a *correct* score and move at exactly that boundary ply, for a book
 * that resolves the position via each of the three root-level book outcomes:
 * exact match, and bounds collapsing the window.
 *
 * Compile from tools/:
 *   g++ -std=c++17 -O2 -I../native -o test_book_depth_boundary test_book_depth_boundary.cpp
 * Run:
 *   ./test_book_depth_boundary
 */

#include <cassert>
#include <cstdio>
#include <iostream>
#include <string>

#include "Position.hpp"
#include "Solver.hpp"
#include "OpeningBook.hpp"

using namespace GameSolver::Connect4;

static constexpr int W = 7;
static constexpr int H = 6;
static constexpr int ABS_MIN = (W * H + 1) / 2;   // 21

using Pos  = GenericPosition<W, H>;
using SI   = SolverImpl<W, H>;
using Book = MutableBook<W, H>;

static int g_pass = 0, g_fail = 0;
static std::string g_section;

static void section(const std::string& name) {
    g_section = name;
    std::cout << "\n[" << name << "]\n";
}

static bool check(bool cond, const std::string& msg) {
    if (cond) {
        ++g_pass;
        std::cout << "  PASS  " << msg << "\n";
    } else {
        ++g_fail;
        std::cout << "  FAIL  " << msg << "   <-- " << g_section << "\n";
    }
    return cond;
}

static uint8_t enc(int score) { return (uint8_t)(score + ABS_MIN + 1); }

static Pos parse_pos(const std::string& s) {
    Pos p;
    for (char c : s) p.playCol((int)(c - '1'));
    return p;
}

// Confirms that after playing `move` from P, the resulting position's true
// score (from a full, book-free solve) is consistent with `score` being P's
// true score — i.e. move is actually an optimal reply, not just legal.
static bool move_is_consistent(const Pos& P, int move, int score) {
    Pos child(P);
    child.playCol(move);
    SI verifier(64ULL << 20);
    auto r = verifier.solve(child, /*weak=*/false, 1);
    return -r.score == score;
}

// Build a book that resolves P's score at the root via the requested outcome,
// then confirm solve() returns the correct score and a truly-optimal move.
static void test_boundary_case(const std::string& label, const std::string& move_seq, bool exact_entry) {
    section(label);

    Pos P = parse_pos(move_seq);
    const int depth = (int)P.nbMoves();

    // canWinNext() short-circuits solve_single() before any book logic runs,
    // and its chosen move ends the game — playing it makes move_is_consistent()'s
    // verifier solve() invalid (it isn't designed for an already-won position).
    // Test positions must actually exercise the book/find_move path.
    if (!check(!P.canWinNext(), label + ": test position is not a canWinNext() position")) return;

    // Ground truth via a book-free solve.
    SI ground_truth(64ULL << 20);
    auto gt = ground_truth.solve(P, /*weak=*/false, 1);

    // Book covers exactly up to this position's depth — P sits exactly at
    // book_depth, so every child is one ply past the book's coverage.
    Book book(depth);
    if (exact_entry) {
        book.store(P, enc(gt.score), 0);                 // lu.lower == lu.upper
    } else {
        // Bounds that collapse the search window without being a literal
        // exact entry (min >= max branch in solve_single()).
        int lo = gt.score, hi = gt.score;
        book.store(P, enc(lo), enc(hi));
    }

    SI solver(64ULL << 20);
    auto res = solver.solve(P, /*weak=*/false, 1, &book);

    check(res.score == gt.score, label + ": score matches ground truth");
    check(res.bestMove != -1, label + ": a real move is returned (not -1)");
    if (res.bestMove != -1) {
        check(move_is_consistent(P, res.bestMove, res.score),
              label + ": returned move is actually optimal");
    }
}

int main() {
    std::cout << "=== test_book_depth_boundary ===\n";

    test_boundary_case("exact match at book_depth",          "246246",    /*exact_entry=*/true);
    test_boundary_case("bounds-collapse at book_depth",      "246246",    /*exact_entry=*/false);
    test_boundary_case("exact match at book_depth (deeper)",  "24624615", /*exact_entry=*/true);
    test_boundary_case("bounds-collapse at book_depth (deeper)", "24624615", /*exact_entry=*/false);

    std::cout << "\n========================================\n";
    std::cout << "  Passed: " << g_pass << "\n";
    std::cout << "  Failed: " << g_fail << "\n";
    std::cout << "========================================\n";

    return g_fail > 0 ? 1 : 0;
}
