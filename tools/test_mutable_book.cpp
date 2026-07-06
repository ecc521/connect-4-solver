/**
 * test_mutable_book.cpp
 *
 * Unit tests for MutableBook<W,H> — the in-memory mutable opening book.
 *
 * Tests are grouped into sections:
 *   1. store()       — unconditional overwrite
 *   2. narrow()      — bound tightening
 *   3. query()       — depth guard and hit/miss
 *   4. dump()        — entry enumeration
 *   5. Roundtrip     — save_dense / save_elias_fano + reload
 *   6. Accessors     — kind(), getDepth(), size()
 *
 * Compile from tools/:
 *   g++ -std=c++17 -O2 -I../native -o test_mutable_book test_mutable_book.cpp
 * Run:
 *   ./test_mutable_book
 */

#include <cassert>
#include <cstdio>
#include <cstring>
#include <iostream>
#include <string>
#include <algorithm>

#include "Position.hpp"
#include "OpeningBook.hpp"

using namespace GameSolver::Connect4;

static constexpr int W = 7;
static constexpr int H = 6;
// min_score = -(W*H+1)/2 = -21  →  encoded_byte = score + 21 + 1 = score + 22
// Loss floor:  encoded = 1   (score = -21)
// Draw:        encoded = 22  (score = 0)
// Win ceiling: encoded = 43  (score = 21)
static constexpr int ABS_MIN = (W * H + 1) / 2;   // 21

using Pos  = GenericPosition<W, H>;
using Book = MutableBook<W, H>;
using Base = OpeningBookBase<W, H>;

// ── Micro test runner ────────────────────────────────────────────────────────

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
        std::cout << "  FAIL  " << msg << "   <── " << g_section << "\n";
    }
}

// ── Encoding helpers ─────────────────────────────────────────────────────────

static uint8_t enc(int score) { return (uint8_t)(score + ABS_MIN + 1); }

// Make a position by playing a sequence of columns (0-indexed).
static Pos make_pos(std::initializer_list<int> cols) {
    Pos p;
    for (int col : cols) p.playCol(col);
    return p;
}

// ── Tests ────────────────────────────────────────────────────────────────────

static void test_store() {
    section("store()");

    Book bk(4);  // max_depth = 4

    Pos root;
    Pos p1 = make_pos({3});        // depth 1
    Pos p2 = make_pos({3, 3});     // depth 2
    Pos p4 = make_pos({3,3,3,3});  // depth 4 (boundary)
    Pos p5 = make_pos({3,3,3,3,3});// depth 5 (beyond max)

    // 1. Query on empty book returns miss
    check(!bk.query(root).found(), "empty book: query returns miss");

    // 2. store() then query — exact (hi=0 convention)
    bk.store(root, enc(5), 0);
    {
        auto lu = bk.query(root);
        check(lu.found(),   "store exact: found()");
        check(lu.isExact(), "store exact: isExact()");
        check(lu.lower == enc(5), "store exact: correct lower");
        check(lu.upper == enc(5), "store exact: correct upper (==lower)");
    }

    // 3. store() bounded (hi != lo)
    bk.store(p1, enc(-1), enc(3));
    {
        auto lu = bk.query(p1);
        check(lu.found(),    "store bounded: found()");
        check(!lu.isExact(), "store bounded: not isExact()");
        check(lu.lower == enc(-1), "store bounded: correct lower");
        check(lu.upper == enc(3),  "store bounded: correct upper");
    }

    // 4. store() overwrites — different value on second store
    bk.store(p2, enc(1), 0);
    bk.store(p2, enc(-3), enc(2));  // overwrite with bounded
    {
        auto lu = bk.query(p2);
        check(lu.found(),    "store overwrite: found()");
        check(!lu.isExact(), "store overwrite: now bounded");
        check(lu.lower == enc(-3), "store overwrite: new lower");
        check(lu.upper == enc(2),  "store overwrite: new upper");
    }

    // 5. store at max_depth boundary is accepted
    bk.store(p4, enc(2), 0);
    check(bk.query(p4).found(), "store at max_depth: accepted");

    // 6. store beyond max_depth is silently ignored
    bk.store(p5, enc(2), 0);
    check(!bk.query(p5).found(), "store beyond max_depth: ignored");
}

static void test_narrow() {
    section("narrow()");

    Book bk(6);

    Pos p = make_pos({0});       // depth 1
    Pos p6 = make_pos({0,1,2,3,4,5,0}); // depth 7 — past max_depth

    // 1. First narrow on unseen key behaves like store
    bk.narrow(p, enc(-1), enc(3));
    {
        auto lu = bk.query(p);
        check(lu.found(),    "narrow first-write: found()");
        check(lu.lower == enc(-1), "narrow first-write: lo correct");
        check(lu.upper == enc(3),  "narrow first-write: hi correct");
    }

    // 2. Tighten lower bound only (raise floor)
    bk.narrow(p, enc(1), enc(3));
    {
        auto lu = bk.query(p);
        check(lu.lower == enc(1), "narrow raise lo: floor raised");
        check(lu.upper == enc(3), "narrow raise lo: ceiling unchanged");
    }

    // 3. Tighten upper bound only (lower ceiling)
    bk.narrow(p, enc(-5), enc(2));
    {
        auto lu = bk.query(p);
        check(lu.lower == enc(1), "narrow lower hi: floor unchanged");
        check(lu.upper == enc(2), "narrow lower hi: ceiling lowered");
    }

    // 4. No-op: incoming lo < stored lo (would widen floor — rejected)
    bk.narrow(p, enc(-10), enc(5));  // lo=-10 < current lo=1
    {
        auto lu = bk.query(p);
        check(lu.lower == enc(1), "narrow no-op lo: floor not widened");
        check(lu.upper == enc(2), "narrow no-op hi: ceiling not widened");
    }

    // 5. Converge to exact: narrow until lo == hi
    //    Current: lo=enc(1), hi=enc(2). Narrow with lo=enc(2), hi=enc(2).
    bk.narrow(p, enc(2), enc(2));
    {
        auto lu = bk.query(p);
        check(lu.found(),   "narrow to exact: found()");
        check(lu.isExact(), "narrow to exact: isExact()");
        check(lu.lower == enc(2), "narrow to exact: correct value");
    }

    // 6. After converging to exact, further narrow with exact same value is no-op
    bk.narrow(p, enc(2), enc(2));
    {
        auto lu = bk.query(p);
        check(lu.isExact(),       "narrow exact no-op: still exact");
        check(lu.lower == enc(2), "narrow exact no-op: value unchanged");
    }

    // 7. Test: narrow with exact (hi=0 convention)
    Pos p2 = make_pos({1});
    bk.narrow(p2, enc(0), 0);   // exact score 0 via hi=0 convention
    {
        auto lu = bk.query(p2);
        check(lu.isExact(),       "narrow exact hi=0: isExact()");
        check(lu.lower == enc(0), "narrow exact hi=0: correct value");
    }

    // 8. Narrow beyond max_depth: silently ignored
    bk.narrow(p6, enc(1), enc(3));
    check(!bk.query(p6).found(), "narrow beyond max_depth: ignored");
}

static void test_query_depth_guard() {
    section("query() depth guard");

    Book bk(2);

    // Store at depth 2 (exactly at limit)
    Pos p2 = make_pos({0, 1});
    bk.store(p2, enc(1), 0);
    check(bk.query(p2).found(), "query at max_depth: hit");

    // A position with 3 moves is beyond the book's depth
    Pos p3 = make_pos({0, 1, 2});
    check(!bk.query(p3).found(), "query beyond max_depth: miss");

    // Root is at depth 0, always in range
    Pos root;
    bk.store(root, enc(-1), enc(1));
    check(bk.query(root).found(), "query depth 0: hit");
}

static void test_dump() {
    section("dump()");

    // 1. Empty book dumps empty list
    {
        Book bk(4);
        auto entries = bk.dump();
        check(entries.empty(), "dump empty book");
    }

    // 2. Multiple entries all appear in dump
    {
        Book bk(8);
        std::vector<Pos> positions = {
            make_pos({0}),
            make_pos({1}),
            make_pos({2}),
            make_pos({0, 1}),
            make_pos({0, 1, 2}),
        };
        for (size_t i = 0; i < positions.size(); ++i)
            bk.store(positions[i], enc((int)i - 2), 0);

        auto entries = bk.dump();
        check(entries.size() == positions.size(), "dump: all entries present");

        // Every stored key appears in the dump
        for (auto& pos : positions) {
            auto key = pos.key3();
            bool found = std::any_of(entries.begin(), entries.end(),
                [&](const auto& e) { return e.first == key; });
            check(found, "dump: key for " + std::to_string(pos.nbMoves()) +
                         "-move position present");
        }
    }
}

static void test_roundtrip(const std::string& tmp_path, bool use_ef) {
    std::string label = use_ef ? "EF" : "dense";
    section("roundtrip/" + label);

    Book bk(6);

    // Populate with a mix of exact and bounded entries
    std::vector<std::pair<Pos, std::pair<uint8_t,uint8_t>>> data = {
        { make_pos({}),         { enc(0),  0        } },   // exact draw
        { make_pos({3}),        { enc(-1), enc(3)   } },   // bounded
        { make_pos({3,3}),      { enc(5),  0        } },   // exact win
        { make_pos({0,1,2}),    { enc(-5), enc(-1)  } },   // bounded loss
        { make_pos({1,2,3,4}),  { enc(0),  enc(2)   } },   // bounded ±
        { make_pos({2,3,4,5,6}),{ enc(3),  0        } },   // exact win
    };

    for (auto& [pos, bounds] : data)
        bk.store(pos, bounds.first, bounds.second);

    // Save
    if (use_ef) bk.save_elias_fano(tmp_path);
    else        bk.save_dense(tmp_path);

    // Reload
    auto loaded = Base::load(tmp_path, W, H);
    check(loaded != nullptr, label + " reload: book loaded");
    check(loaded->kind() == BookKind::Bounded, label + " reload: kind=Bounded");
    check(loaded->getDepth() == 6, label + " reload: depth=6");

    // Every entry survives the roundtrip with same lo/hi
    bool all_match = true;
    for (auto& [pos, bounds] : data) {
        auto lu_orig   = bk.query(pos);
        auto lu_loaded = loaded->query(pos);
        if (!lu_loaded.found()) { all_match = false; break; }
        if (lu_loaded.lower != lu_orig.lower || lu_loaded.upper != lu_orig.upper) {
            all_match = false; break;
        }
    }
    check(all_match, label + " roundtrip: all entries match");

    // A position not in the book should still miss
    Pos absent = make_pos({6,5,4,3,2,1,0});
    check(!loaded->query(absent).found(), label + " roundtrip: absent key misses");
}

static void test_roundtrip_non_default_align_wrap() {
    section("roundtrip/non-default align+wrap");

    // Simulate collecting from a wrap-board / non-default-align solver config
    // (e.g. C4W_7x6 wrap=true, C5_8x8 align=5 in bindings_core.hpp).
    Book bk(4);
    Pos p = make_pos({0, 1});
    bk.store(p, enc(3), 0);

    const std::string path = "/tmp/test_mutable_book_wrap.book";
    bk.save_elias_fano(path, /*align=*/5, /*wrap=*/true);

    // Loading with the SAME align/wrap the book was built for must succeed.
    auto loaded = Base::load(path, W, H, /*align=*/5, /*wrap=*/true);
    check(loaded != nullptr, "non-default align/wrap: reload succeeds with matching config");
    if (loaded) {
        check(loaded->query(p).lower == enc(3), "non-default align/wrap: entry value correct");
    }

    // Loading with the WRONG align/wrap (e.g. the plain-default solver config)
    // must be rejected rather than silently loading corrupt/mismatched data.
    bool threw = false;
    try {
        Base::load(path, W, H, /*align=*/4, /*wrap=*/false);
    } catch (const std::exception&) {
        threw = true;
    }
    check(threw, "non-default align/wrap: mismatched load is rejected");
}

static void test_accessors() {
    section("accessors");

    Book bk(12);
    check(bk.kind() == BookKind::Bounded, "kind() == Bounded");
    check(bk.getDepth() == 12, "getDepth() == 12");
    check(bk.size() == 0, "size() == 0 initially");

    Pos p = make_pos({0});
    bk.store(p, enc(1), 0);
    check(bk.size() == 1, "size() == 1 after one store");

    bk.store(p, enc(2), 0);  // overwrite same key
    check(bk.size() == 1, "size() == 1 after overwrite (no duplicate)");

    Pos p2 = make_pos({1});
    bk.store(p2, enc(-1), enc(1));
    check(bk.size() == 2, "size() == 2 after second key");
}

static void test_copy_constructor() {
    section("copy constructor");

    // Build a source book with three entries
    Book src(10);
    Pos p0 = make_pos({0});
    Pos p1 = make_pos({1});
    Pos p2 = make_pos({2});
    src.store(p0, enc(-5), 0);          // exact
    src.store(p1, enc(-3), enc(1));     // bounded
    src.store(p2, enc(2),  0);          // exact

    // Copy-construct
    Book dst(src);
    check(dst.getDepth() == 10,                  "copy: depth matches");
    check(dst.size() == 3,                       "copy: all entries present");
    check(dst.query(p0).isExact(),               "copy: exact entry survives");
    check(dst.query(p0).lower == enc(-5),        "copy: exact value correct");
    check(dst.query(p1).lower == enc(-3),        "copy: bounded lo correct");
    check(dst.query(p1).upper == enc(1),         "copy: bounded hi correct");
    check(dst.query(p2).lower == enc(2),         "copy: second exact correct");

    // Copy from loaded immutable book via save+reload
    src.save_elias_fano("/tmp/test_copy_src.book");
    auto loaded = Base::load("/tmp/test_copy_src.book", W, H);
    Book from_file(*loaded);
    check(from_file.size() == 3,                 "copy from EFBook: all entries present");
    check(from_file.query(p0).isExact(),         "copy from EFBook: exact survives");
    check(from_file.query(p1).lower == enc(-3),  "copy from EFBook: bounded lo correct");
}

static void test_merge() {
    section("merge()");

    Pos p0 = make_pos({0});
    Pos p1 = make_pos({1});
    Pos p2 = make_pos({2});
    Pos p3 = make_pos({3});

    // Base book: two entries
    Book base(8);
    base.store(p0, enc(-5), enc(2));   // wide bounds
    base.store(p1, enc(0),  0);        // exact draw

    // Other book: overlapping + new entries
    Book other(10);
    other.store(p0, enc(-2), enc(1));  // tighter than base for p0
    other.store(p2, enc(3),  0);       // new entry
    other.store(p3, enc(-1), enc(1));  // new entry

    base.merge(other);

    // depth extends to max of both
    check(base.getDepth() == 10, "merge: depth extends to max");
    // p0: bounds should tighten — lo raises from -5→-2, hi lowers from 2→1
    check(base.query(p0).lower == enc(-2), "merge: lo tightened on overlap");
    check(base.query(p0).upper == enc(1),  "merge: hi tightened on overlap");
    // p1: not in other, unchanged
    check(base.query(p1).isExact(),        "merge: non-overlapping entry unchanged");
    check(base.query(p1).lower == enc(0),  "merge: non-overlapping value unchanged");
    // p2, p3: new entries added
    check(base.query(p2).found(),          "merge: new entry from other added");
    check(base.query(p2).lower == enc(3),  "merge: new entry value correct");
    check(base.query(p3).found(),          "merge: second new entry added");
    check(base.size() == 4,                "merge: total size correct");

    // Merging into empty book behaves like copy
    Book empty(5);
    Book src(5);
    src.store(p0, enc(1), 0);
    src.store(p1, enc(-1), enc(1));
    empty.merge(src);
    check(empty.size() == 2,               "merge into empty: all entries present");
    check(empty.query(p0).isExact(),       "merge into empty: exact entry correct");

    // Merging from a loaded immutable book
    src.save_elias_fano("/tmp/test_merge_src.book");
    auto loaded = Base::load("/tmp/test_merge_src.book", W, H);
    Book dst(6);
    dst.merge(*loaded);
    check(dst.size() == 2,                 "merge from EFBook: entries added");
    check(dst.query(p0).lower == enc(1),   "merge from EFBook: value correct");
}

// ── Main ─────────────────────────────────────────────────────────────────────

int main() {
    std::cout << "=== test_mutable_book ===\n";

    test_store();
    test_narrow();
    test_query_depth_guard();
    test_dump();
    test_roundtrip("/tmp/test_mutable_book_dense.book", false);
    test_roundtrip("/tmp/test_mutable_book_ef.book",    true);
    test_roundtrip_non_default_align_wrap();
    test_accessors();
    test_copy_constructor();
    test_merge();

    std::cout << "\n========================================\n";
    std::cout << "  Passed: " << g_pass << "\n";
    std::cout << "  Failed: " << g_fail << "\n";
    std::cout << "========================================\n";

    return g_fail > 0 ? 1 : 0;
}
