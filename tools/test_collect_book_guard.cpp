/**
 * test_collect_book_guard.cpp
 *
 * MutableBook::query()/dump() are unlocked reads; store()/narrow() write under
 * a lock. Using the same MutableBook instance as both the query oracle
 * (loadBook() / the solve()-and-analyze() book param) and the collect_book
 * target (setCollectBook()) races those unlocked reads against locked writes
 * once threads > 1 spawns concurrent negamax calls. There's no legitimate use
 * case for that combination (the documented way to extend an existing book is
 * to seed a *new* MutableBook from it via the copy constructor), so solve()
 * and analyze() reject it outright rather than paying for a reader/writer lock
 * that would only ever protect a misuse.
 *
 * Compile from tools/:
 *   g++ -std=c++17 -O2 -DUSE_PTHREADS -I../native -pthread -o test_collect_book_guard test_collect_book_guard.cpp
 * Run:
 *   ./test_collect_book_guard
 */

#include <cassert>
#include <cstdio>
#include <functional>
#include <iostream>
#include <stdexcept>
#include <string>

#include "Position.hpp"
#include "Solver.hpp"
#include "OpeningBook.hpp"

using namespace GameSolver::Connect4;

static constexpr int W = 7;
static constexpr int H = 6;

using Pos  = GenericPosition<W, H>;
using SI   = SolverImpl<W, H>;
using Book = MutableBook<W, H>;

static int g_pass = 0, g_fail = 0;
static std::string g_section;

static void section(const std::string& name) {
    g_section = name;
    std::cout << "\n[" << name << "]\n";
}

static void check(bool cond, const std::string& msg) {
    if (cond) {
        ++g_pass;
        std::cout << "  PASS  " << msg << "\n";
    } else {
        ++g_fail;
        std::cout << "  FAIL  " << msg << "   <-- " << g_section << "\n";
    }
}

static bool throws_runtime_error(const std::function<void()>& fn) {
    try {
        fn();
    } catch (const std::runtime_error&) {
        return true;
    }
    return false;
}

int main() {
    std::cout << "=== test_collect_book_guard ===\n";
    Pos root;

    section("solve(): same instance as book + collect_book, threads > 1");
    {
        Book mbook(8);
        SI solver(64ULL << 20);
        solver.setCollectBook(&mbook);
        check(throws_runtime_error([&]{ solver.solve(root, false, 4, &mbook); }),
              "solve() rejects self-referential book+collect_book at threads=4");
    }

    section("solve(): same instance, threads == 1 is allowed");
    {
        Book mbook(8);
        SI solver(64ULL << 20);
        solver.setCollectBook(&mbook);
        check(!throws_runtime_error([&]{ solver.solve(root, false, 1, &mbook); }),
              "solve() allows self-referential book+collect_book at threads=1");
    }

    section("solve(): distinct book + collect_book objects, threads > 1 is allowed");
    {
        Book oracle(8);
        Book collector(8);
        SI solver(64ULL << 20);
        solver.setCollectBook(&collector);
        check(!throws_runtime_error([&]{ solver.solve(root, false, 4, &oracle); }),
              "solve() allows distinct book/collect_book objects at threads=4");
    }

    section("solve(): loadBook() (persistent oracle) + collect_book, threads > 1");
    {
        Book mbook(8);
        SI solver(64ULL << 20);
        solver.loadBook(&mbook);
        solver.setCollectBook(&mbook);
        check(throws_runtime_error([&]{ solver.solve(root, false, 4); }),
              "solve() rejects self-referential loadBook()+collect_book at threads=4");
    }

    section("analyze(): same instance as book + collect_book, threads > 1");
    {
        Book mbook(8);
        SI solver(64ULL << 20);
        solver.setCollectBook(&mbook);
        check(throws_runtime_error([&]{ solver.analyze(root, false, 4, &mbook); }),
              "analyze() rejects self-referential book+collect_book at threads=4");
    }

    std::cout << "\n========================================\n";
    std::cout << "  Passed: " << g_pass << "\n";
    std::cout << "  Failed: " << g_fail << "\n";
    std::cout << "========================================\n";

    return g_fail > 0 ? 1 : 0;
}
