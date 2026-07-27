/**
 * build_strategy_book.cpp
 *
 * Builds an opening book covering the complete strategy tree for the winning
 * player, up to a configurable depth.  Works for any board size.
 *
 * Algorithm: weak alpha-beta solve from the root (window [-1, 0]).
 *   - At losing-player nodes: tries ALL moves (no alpha cutoff is possible
 *     when every move is a loss, so the strategy tree is fully enumerated).
 *   - At winning-player nodes: stops at the first winning reply (beta cutoff),
 *     so only the optimal branch is stored.
 *   The positions visited by this solve are exactly the strategy tree.
 *
 * Oracle book: any existing book (e.g. book88) is loaded as an oracle.
 *   Oracle hits are collected immediately and the search does not recurse into
 *   them, so the oracle prunes most branches for well-covered depths.
 *
 * Output: Elias-Fano .book file (v2 format), containing every position at
 *   depth <= max_depth visited during the solve, with bounded WIN/LOSS values.
 *
 * Compile (example for 8x8):
 *   g++ -std=c++17 -O3 -DNDEBUG -march=native \
 *       -DBOARD_WIDTH_MACRO=8 -DBOARD_HEIGHT_MACRO=8 \
 *       -I../native -o build_strategy_book build_strategy_book.cpp
 *
 * Usage:
 *   ./build_strategy_book [options]
 *
 * Options:
 *   --depth N        Max ply depth to collect (default 16)
 *   --oracle PATH    Existing book to use as oracle shortcut
 *   --out PATH       Output book path (default auto-named)
 *   --threads N      Thread count (default 1; reserved for future use)
 *   --cache MB       TT cache in MB (unused in current single-thread build,
 *                    accepted for forward compat)
 */

#include <iostream>
#include <fstream>
#include <chrono>
#include <atomic>
#include <csignal>
#include <thread>
#include <string>
#include <unordered_map>
#include <algorithm>
#include <cmath>
#include <sstream>
#include <iomanip>

#include "Position.hpp"
#include "OpeningBook.hpp"
#include "MoveSorter.hpp"
#include "Solver.hpp"

using namespace GameSolver::Connect4;

static constexpr int W = BOARD_WIDTH_MACRO;
static constexpr int H = BOARD_HEIGHT_MACRO;
static constexpr int ABS_MIN = (W * H + 1) / 2;

using Pos      = GenericPosition<W, H>;
using pos_t    = typename Pos::position_t;
using Book     = OpeningBookBase<W, H>;
using MSorter  = GenericMoveSorter<W, H>;

// ── Value encoding (same as OpeningBook.hpp bounded format) ──────────────────
//   stored_byte = score + ABS_MIN + 1   (0 = not-in-book sentinel)
//   uint16_t:  byte0 = lower_enc, byte1 = upper_enc (0 = exact)
static constexpr uint8_t WIN_LO_ENC  = (uint8_t)(ABS_MIN + 2);        //  min win
static constexpr uint8_t WIN_HI_ENC  = (uint8_t)(2 * ABS_MIN + 1);    //  max win
static constexpr uint8_t LOSS_LO_ENC = (uint8_t)(1);                  //  max loss
static constexpr uint8_t LOSS_HI_ENC = (uint8_t)(ABS_MIN);            //  min loss
static uint16_t encode_exact(int score) {
    uint8_t s = (uint8_t)(score + ABS_MIN + 1);
    return (uint16_t)s;   // hi byte = 0 → exact
}


static constexpr uint16_t VAL_WIN  = (uint16_t)WIN_LO_ENC  | ((uint16_t)WIN_HI_ENC  << 8);
static constexpr uint16_t VAL_LOSS = (uint16_t)LOSS_LO_ENC | ((uint16_t)LOSS_HI_ENC << 8);

using FallbackSolver = SolverImpl<W, H>;

// ── Global search state ───────────────────────────────────────────────────────

struct SearchState {
    std::unordered_map<pos_t, uint16_t> entries;   // key3 → encoded value
    std::atomic<uint64_t>               nodes{0};
    std::atomic<uint64_t>               oracle_hits{0};
    std::atomic<uint64_t>               solver_calls{0};
    std::atomic<bool>                   abort{false};
    int                                 max_depth = 16;
    const Book*                         oracle    = nullptr;
    FallbackSolver*                     solver    = nullptr;  // fallback for scoring
};

static SearchState* g_state   = nullptr;
static std::string  g_out_path;

// ── Core search ───────────────────────────────────────────────────────────────

/**
 * Weak-solve negamax: window is always (-1, 0).
 *   Returns  0  if current player can force a draw or win.
 *   Returns -1  if current player is in a forced loss.
 *
 * All positions at depth <= max_depth are recorded in state.entries.
 */
static int search(SearchState& st, Pos P, int alpha, int beta) {
    if (st.abort) return 0;

    ++st.nodes;
    const int depth = P.nbMoves();

    // ── Oracle probe ────────────────────────────────────────────────────────
    // BookLookup::lower/upper are RAW encoded bytes (score + ABS_MIN + 1).
    // Must decode before comparing: decoded = raw - ABS_MIN - 1.
    if (st.oracle) {
        auto lu = st.oracle->query(P);
        if (lu.found()) {
            ++st.oracle_hits;
            if (depth <= st.max_depth) {
                pos_t key = P.key3();
                if (st.entries.find(key) == st.entries.end()) {
                    // lu.lower/upper are already encoded bytes — store directly.
                    uint8_t lo_enc = (uint8_t)(lu.lower);
                    uint8_t hi_enc = lu.isExact() ? 0 : (uint8_t)(lu.upper);
                    st.entries[key] = (uint16_t)lo_enc | ((uint16_t)hi_enc << 8);
                }
            }
            // Decode to determine weak-solve result.
            // Upper bound gives the best possible score — if even that is
            // negative, this is definitely a loss.
            int raw_hi = lu.isExact() ? lu.lower : lu.upper;
            int decoded_hi = raw_hi - ABS_MIN - 1;
            return decoded_hi < 0 ? -1 : 0;
        }
    }

    // ── Depth limit ──────────────────────────────────────────────────────────
    // Stop recursion once we are at or beyond max_depth.  If the oracle
    // covers this depth, its miss above already returned.  For positions
    // beyond oracle coverage the fallback solver is used when available;
    // otherwise we return 0 (conservative: assume not-loss so we don't
    // incorrectly prune branches of the strategy tree).
    if (depth >= st.max_depth) {
        if (st.solver) {
            ++st.solver_calls;
            int score = st.solver->solve(P, /*weak=*/true, /*threads=*/1, st.oracle).score;
            return score < 0 ? -1 : 0;
        }
        return 0;  // conservative fallback: don't recurse, don't prune
    }

    // ── Transposition / already-collected check ──────────────────────────────
    if (depth <= st.max_depth) {
        auto it = st.entries.find(P.key3());
        if (it != st.entries.end()) {
            uint8_t lo_enc = (uint8_t)(it->second & 0xFF);
            int lo_score   = (int)lo_enc - ABS_MIN - 1;
            return lo_score < 0 ? -1 : 0;
        }
    }

    // ── Terminal: current player can win immediately ─────────────────────────
    if (P.canWinNext()) {
        int score = (W * H + 1 - depth) / 2;
        if (depth <= st.max_depth)
            st.entries[P.key3()] = encode_exact(score);
        return 0;  // >0, so weak result = 0 (not a loss)
    }

    // ── Possible non-losing moves ────────────────────────────────────────────
    pos_t possible = P.possibleNonLosingMoves();
    if (possible == 0) {
        // Every move immediately loses
        int score = -((W * H - depth) / 2);
        if (depth <= st.max_depth)
            st.entries[P.key3()] = encode_exact(score);
        return -1;
    }

    // ── Draw ────────────────────────────────────────────────────────────────
    if (depth >= W * H - 2) {
        if (depth <= st.max_depth)
            st.entries[P.key3()] = encode_exact(0);
        return 0;
    }

    // ── Move-ordered recursion ───────────────────────────────────────────────
    MSorter sorter;
    for (int col = 0; col < W; col++) {
        pos_t move = possible & P.column_mask(col);
        if (move) sorter.add(move, P.moveScore(move));
    }

    while (pos_t move = sorter.getNext()) {
        if (st.abort) return 0;
        Pos child(P);
        child.play(move);
        int score = -search(st, child, -beta, -alpha);
        if (score > alpha) {
            alpha = score;
            if (alpha >= beta) break;   // beta cutoff (winning move found)
        }
    }

    // Record this position (at max_depth we still collected children above)
    if (depth <= st.max_depth) {
        pos_t key = P.key3();
        if (st.entries.find(key) == st.entries.end()) {
            // Use bounded encoding since we only did a weak solve
            st.entries[key] = (alpha >= 0) ? VAL_WIN : VAL_LOSS;
        }
    }

    return alpha;
}

// ── SIGINT handler ────────────────────────────────────────────────────────────

static void handle_sigint(int) {
    if (!g_state) { std::exit(1); }
    g_state->abort.store(true);
    // Main thread will detect abort and save.
}

// ── Progress monitor ──────────────────────────────────────────────────────────

static void run_monitor(const SearchState& st, std::atomic<bool>& done) {
    using clock = std::chrono::steady_clock;
    auto t0 = clock::now();
    while (!done.load(std::memory_order_relaxed)) {
        std::this_thread::sleep_for(std::chrono::seconds(5));
        if (done.load(std::memory_order_relaxed)) break;

        auto elapsed = std::chrono::duration<double>(clock::now() - t0).count();
        uint64_t n   = st.nodes.load(std::memory_order_relaxed);
        uint64_t oh  = st.oracle_hits.load(std::memory_order_relaxed);
        size_t   col = st.entries.size();   // single-threaded: no race
        double   nps = elapsed > 0 ? n / elapsed / 1e6 : 0;

        uint64_t sc  = st.solver_calls.load(std::memory_order_relaxed);
        std::cerr << std::fixed << std::setprecision(1)
                  << "[" << std::setw(7) << (int)elapsed << "s] "
                  << "collected=" << col
                  << "  nodes=" << n
                  << "  oracle=" << oh
                  << "  solver=" << sc
                  << "  Mnps=" << nps
                  << "\n";
    }
}

// ── Save book ─────────────────────────────────────────────────────────────────

static void save_book(const SearchState& st, const std::string& path, int max_depth) {
    using EntryList = typename Book::EntryList;
    EntryList items;
    items.reserve(st.entries.size());
    for (auto& [k, v] : st.entries)
        items.push_back({k, v});

    std::cerr << "[+] Saving " << items.size() << " entries to " << path << " ...\n";
    Book::save_elias_fano(path, max_depth, std::move(items), BookKind::Bounded);
    std::cerr << "[+] Done.\n";
}

// ── main ─────────────────────────────────────────────────────────────────────

int main(int argc, char** argv) {
    int         max_depth  = 16;
    int         threads    = 1;  // reserved — always runs single-threaded
    int         cache_mb   = 0;  // 0 = use default (256 MB)
    std::string oracle_path;
    std::string out_path;

    for (int i = 1; i < argc; i++) {
        std::string a = argv[i];
        if (a == "--depth"   && i+1 < argc) { max_depth  = std::stoi(argv[++i]); }
        else if (a == "--oracle"  && i+1 < argc) { oracle_path = argv[++i]; }
        else if (a == "--out"     && i+1 < argc) { out_path    = argv[++i]; }
        else if (a == "--threads" && i+1 < argc) { threads     = std::stoi(argv[++i]); }
        else if (a == "--cache"   && i+1 < argc) { cache_mb = std::stoi(argv[++i]); }
        else {
            std::cerr << "Unknown argument: " << a << "\n";
            std::cerr << "Usage: build_strategy_book [--depth N] [--oracle PATH] [--out PATH] [--threads N] [--cache MB]\n";
            return 1;
        }
    }

    if (threads > 1)
        std::cerr << "[!] Warning: --threads > 1 is not yet implemented; running single-threaded.\n";

    if (out_path.empty()) {
        std::ostringstream oss;
        oss << "../data/" << W << "x" << H << "_strategy" << max_depth << ".book";
        out_path = oss.str();
    }
    g_out_path = out_path;

    // ── Header ──────────────────────────────────────────────────────────────
    std::cerr << "=================================================================\n";
    std::cerr << "  build_strategy_book  " << W << "x" << H
              << "  depth=" << max_depth << "\n";
    std::cerr << "  output: " << out_path << "\n";

    // ── Oracle ──────────────────────────────────────────────────────────────
    std::unique_ptr<Book> oracle;
    if (!oracle_path.empty()) {
        std::cerr << "[+] Loading oracle: " << oracle_path << " ...\n";
        oracle = Book::load(oracle_path, W, H);
        if (!oracle)
            std::cerr << "[-] Warning: could not load oracle — continuing without.\n";
        else
            std::cerr << "[+] Oracle loaded.\n";
    }

    // ── Fallback solver (TT-backed, used when oracle misses at max_depth) ────
    size_t solver_cache = (size_t)cache_mb * 1024 * 1024;
    if (solver_cache == 0) solver_cache = 256ULL * 1024 * 1024;  // default 256 MB
    std::cerr << "[+] Initialising fallback solver (cache=" << (solver_cache / 1024 / 1024) << " MB)...\n";
    FallbackSolver fallback_solver(solver_cache, W, H);

    // ── Search state ─────────────────────────────────────────────────────────
    SearchState st;
    st.max_depth = max_depth;
    st.oracle    = oracle.get();
    st.solver    = &fallback_solver;
    st.entries.reserve(1 << 20);   // pre-allocate ~1M buckets
    g_state = &st;

    signal(SIGINT, handle_sigint);

    std::cerr << "[+] Starting search from root (single-threaded weak solve)...\n";
    std::cerr << "=================================================================\n";

    // ── Monitor thread ───────────────────────────────────────────────────────
    std::atomic<bool> monitor_done{false};
    std::thread monitor_thread(run_monitor, std::ref(st), std::ref(monitor_done));

    // ── Solve ────────────────────────────────────────────────────────────────
    using clock = std::chrono::steady_clock;
    auto t0 = clock::now();

    Pos root;
    search(st, root, -1, 0);

    double elapsed = std::chrono::duration<double>(clock::now() - t0).count();

    monitor_done.store(true);
    monitor_thread.join();

    // ── Summary ──────────────────────────────────────────────────────────────
    std::cerr << "\n=================================================================\n";
    if (st.abort)
        std::cerr << "[!] Interrupted after " << (int)elapsed << "s\n";
    else
        std::cerr << "[+] Search complete in " << std::fixed << std::setprecision(1) << elapsed << "s\n";

    std::cerr << "  Collected   : " << st.entries.size() << " positions\n";
    std::cerr << "  Nodes       : " << st.nodes.load() << "\n";
    std::cerr << "  Oracle hits : " << st.oracle_hits.load() << "\n";
    std::cerr << "  Solver calls: " << st.solver_calls.load() << "\n";
    std::cerr << "  Nodes/s     : " << std::fixed << std::setprecision(0)
              << (elapsed > 0 ? st.nodes.load() / elapsed : 0) << "\n";

    // ── Save ─────────────────────────────────────────────────────────────────
    save_book(st, out_path, max_depth);

    return 0;
}
