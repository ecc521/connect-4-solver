#include <algorithm>
#include <chrono>
#include <cmath>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <mutex>
#include <atomic>
#include <future>
#include <random>
#include <map>
#include <sys/resource.h>

#ifndef BOARD_WIDTH_MACRO
#define BOARD_WIDTH_MACRO 7
#endif

#ifndef BOARD_HEIGHT_MACRO
#define BOARD_HEIGHT_MACRO 6
#endif

#include "../../native/Solver.hpp"
#include "../../native/TranspositionTable.hpp"
#include "../../native/ThreadPool.hpp"



using namespace GameSolver::Connect4;

static int g_parity_failures = 0;

template <int W, int H>
class DummyBook : public OpeningBookBase<W, H> {
public:
  BookLookup query(const GenericPosition<W, H>&) const override { return {}; }
  BookKind kind() const override { return BookKind::Exact; }
  int getDepth() const override { return 42; }
  typename OpeningBookBase<W, H>::EntryList dump() const override { return {}; }
};

struct BenchPos {
  std::string pos;
  int expected_score;
};

std::vector<BenchPos> load_positions(const std::string &path) {
  std::ifstream file(path);
  std::vector<BenchPos> positions;
  std::string line;
  while (std::getline(file, line)) {
    if (line.empty() || line[0] == '\r')
      continue;
    std::stringstream ss(line);
    std::string pos;
    int score = 0;
    ss >> pos >> score;
    if (pos.empty())
      continue;
    bool pos_is_number =
        !pos.empty() && std::all_of(pos.begin(), pos.end(), ::isdigit);
    if (pos_is_number && score == 0) {
      size_t first_nonspace = line.find_first_not_of(" \t");
      if (first_nonspace > 0) {
        score = std::stoi(pos);
        pos = "";
      }
    }
    if (score >= 31000) score -= 31000;
    else if (score <= -31000) score += 31000;
    positions.push_back({pos, score});
  }
  return positions;
}

template <int W, int H> bool is_valid_position(const std::string &pos) {
  GenericPosition<W, H> p;
  return p.play(pos) == pos.size();
}

size_t get_cache_size() {
  size_t mem_size = 256ULL * 1024ULL * 1024ULL;
  if (const char *env_p = std::getenv("CACHE_MB")) {
    mem_size = std::stoull(env_p) * 1024ULL * 1024ULL;
  }
  return mem_size;
}

using Clock = std::chrono::high_resolution_clock;
using TimePoint = Clock::time_point;

inline double elapsed_ms(TimePoint start) {
  return std::chrono::duration<double, std::milli>(Clock::now() - start).count();
}

// --- Noise detection (no CPU pinning available on macOS) -------------------
// Compares actual CPU time consumed (getrusage) against the CPU time we'd
// expect if `threads` ran uncontended for `wall_ms`. A shortfall means some
// thread got preempted by something else on the box during the trial.
inline double rusage_ms(const struct timeval &tv) {
  return tv.tv_sec * 1000.0 + tv.tv_usec / 1000.0;
}

inline double cpu_delta_ms(const struct rusage &before, const struct rusage &after) {
  return (rusage_ms(after.ru_utime) - rusage_ms(before.ru_utime)) +
         (rusage_ms(after.ru_stime) - rusage_ms(before.ru_stime));
}

// Warns (once) if the system doesn't have enough idle headroom to run a clean
// `threads`-wide trial right now — e.g. another build/process already using
// several cores. Doesn't block; the per-trial getrusage check is the real
// safety net, but this turns a wall of skipped trials into an explained one.
inline void warn_if_loaded(int threads) {
  double loadavg[3];
  if (getloadavg(loadavg, 3) != 3) return;
  double logical_cores = (double)std::thread::hardware_concurrency();
  double headroom = logical_cores - loadavg[0];
  if (headroom < threads * 0.15) {
    std::cerr << "[warn] load avg(1m)=" << loadavg[0] << " on " << (int)logical_cores
              << " logical cores — little headroom for a clean " << threads
              << "-thread trial; expect elevated skip counts until other load clears.\n";
  }
}

// Runs `fn` (expected to perform exactly one solve()/analyze() call at the given
// thread count) up to `max_attempts` times, discarding any trial whose measured
// CPU time falls more than `max_deficit` short of threads*wall_ms. `prep` runs
// before each attempt (e.g. cache->reset() for a fresh TT) and is excluded from
// both the timing and the CPU-time noise check. Returns wall_ms of the first
// clean trial, or -1.0 if every attempt was noisy.
template <typename Prep, typename Fn>
double run_clean_trial(int threads, Prep &&prep, Fn &&fn, int max_attempts = 3, double max_deficit = 0.10) {
  for (int attempt = 0; attempt < max_attempts; attempt++) {
    prep();
    struct rusage ru_before{}, ru_after{};
    getrusage(RUSAGE_SELF, &ru_before);
    auto t0 = Clock::now();
    fn();
    double wall_ms = elapsed_ms(t0);
    getrusage(RUSAGE_SELF, &ru_after);
    double cpu_ms = cpu_delta_ms(ru_before, ru_after);
    double expected_cpu = threads * wall_ms;
    if (expected_cpu <= 0.0 || cpu_ms >= (1.0 - max_deficit) * expected_cpu) {
      return wall_ms;
    }
  }
  return -1.0;
}

char encode_col(int col) {
  return col < 9 ? static_cast<char>('1' + col) : static_cast<char>('a' + col - 9);
}

// --- Corpus generation: random legal positions, duration-filtered ----------
// Generates positions at a random ply within [min_ply, max_ply], solves each
// fresh (single-threaded, real TT size — no shrinking, no pre-warming) and
// keeps ones whose solve time lands in [dur_min_ms, dur_max_ms]. Also applies
// the noise check above (single-threaded, so expected_cpu == wall_ms) so a
// corpus position's "duration" isn't an artifact of the box being busy during
// generation. Output uses the same "pos score" format as test-data/, so it
// loads directly via load_positions() and works with the existing
// independent-parallelism benchmarks (Control B) unmodified.
template <int W, int H>
void run_gen_corpus(int min_ply, int max_ply, int count, double dur_min_ms, double dur_max_ms,
                     const std::string &out_path, int max_attempts, unsigned int seed) {
  size_t mem_size = get_cache_size();
  std::mt19937 rng(seed);
  double gen_timeout_ms = dur_max_ms * 2.0;

  std::vector<std::pair<std::string, int>> accepted;
  int attempts = 0, noise_discards = 0;

  while ((int)accepted.size() < count && attempts < max_attempts) {
    attempts++;
    int target_ply = min_ply + (max_ply > min_ply ? (int)(rng() % (unsigned)(max_ply - min_ply + 1)) : 0);

    GenericPosition<W, H> p;
    std::string seq;
    bool ok = true;
    for (int m = 0; m < target_ply; m++) {
      std::vector<int> legal;
      for (int c = 0; c < W; c++) {
        if (p.canPlay(c) && !p.isWinningMove(c)) legal.push_back(c);
      }
      if (legal.empty()) { ok = false; break; }
      int col = legal[rng() % legal.size()];
      p.playCol(col);
      seq += encode_col(col);
    }
    if (!ok || (int)seq.size() != target_ply) continue;

    auto cache = Solver<W, H>::createCache(mem_size);
    auto solver = Solver<W, H>::createWithCache(cache.get());
    ::GameSolver::Connect4::SolverResult res;
    double wall_ms = run_clean_trial(1, [&]() { cache->reset(); }, [&]() {
      res = solver->solve(p, false, 1, nullptr, gen_timeout_ms);
    }, 3, 0.10);

    if (wall_ms < 0) { noise_discards++; continue; }
    if (wall_ms >= dur_min_ms && wall_ms <= dur_max_ms) {
      accepted.push_back({seq, res.score});
      std::cerr << "[corpus] accepted ply=" << target_ply << " dur=" << (int)wall_ms
                << "ms (" << accepted.size() << "/" << count << ")\n";
    }
  }

  std::ofstream out(out_path);
  for (auto &entry : accepted) out << entry.first << " " << entry.second << "\n";
  std::cerr << "[corpus] wrote " << accepted.size() << "/" << count << " positions to " << out_path
            << " (" << attempts << " attempts, " << noise_discards << " noise discards)\n";
}

// --- Diagnostic mode ("Test A"): real in-search multithreading on ONE ------
// position at a time (Lazy SMP for solve(), root-split for analyze()), swept
// across thread counts. This is the code path Control B (existing
// run_solve/run_exact_analyze independent-parallelism mode) never exercises —
// every call there uses threads=1 on different positions. Always fresh TT
// per trial (no pre-warming), median-of-`repeats` clean trials per position.
template <int W, int H>
void run_diag_solve(const std::vector<BenchPos> &positions, const std::vector<int> &thread_counts,
                     bool weak, int repeats, double max_deficit = 0.10) {
  size_t mem_size = get_cache_size();
  // One Solver (and its one persistent ThreadPool) for the whole sweep — recreating
  // it per trial would spin up/tear down N-1 OS threads every trial. getNodeCount()/
  // getDropCount()/getRetryCount() only ever accumulate (never reset internally), so
  // every trial is measured as a before/after delta instead. cache->reset() (fresh TT,
  // no pre-warming) runs as `prep`, outside the timed/noise-checked region.
  auto cache = Solver<W, H>::createCache(mem_size);
  auto solver = Solver<W, H>::createWithCache(cache.get());

  std::map<int, double> agg_time_ms;
  std::map<int, uint64_t> agg_nodes, agg_drops, agg_retries;
  std::map<int, int> agg_skipped;

  for (int threads : thread_counts) {
    warn_if_loaded(threads);
    double total_time = 0;
    uint64_t total_nodes = 0, total_drops = 0, total_retries = 0;
    int skipped = 0;

    for (const auto &bp : positions) {
      GenericPosition<W, H> p;
      p.play(bp.pos);

      std::vector<double> trial_times;
      uint64_t last_nodes = 0, last_drops = 0, last_retries = 0;
      for (int r = 0; r < repeats; r++) {
        uint64_t nodes_before = 0, drops_before = 0, retries_before = 0;
        double wall_ms = run_clean_trial(threads, [&]() {
          cache->reset();
          nodes_before = solver->getNodeCount();
          drops_before = cache->getDropCount();
          retries_before = cache->getRetryCount();
        }, [&]() {
          solver->solve(p, weak, threads, nullptr);
        }, 5, max_deficit);
        if (wall_ms < 0) continue;
        trial_times.push_back(wall_ms);
        last_nodes = solver->getNodeCount() - nodes_before;
        last_drops = cache->getDropCount() - drops_before;
        last_retries = cache->getRetryCount() - retries_before;
      }
      if (trial_times.empty()) { skipped++; continue; }
      std::sort(trial_times.begin(), trial_times.end());
      total_time += trial_times[trial_times.size() / 2];
      total_nodes += last_nodes;
      total_drops += last_drops;
      total_retries += last_retries;
    }

    agg_time_ms[threads] = total_time;
    agg_nodes[threads] = total_nodes;
    agg_drops[threads] = total_drops;
    agg_retries[threads] = total_retries;
    agg_skipped[threads] = skipped;
  }

  double baseline_ms = agg_time_ms.count(1) ? agg_time_ms[1] : 0.0;
  std::string board_str = std::to_string(W) + "x" + std::to_string(H);
  std::cout << "\n| Mode              | Board | Thr | Pos | Skip | Nodes      | MN/s  | Time(ms) | Speedup | Drops    | Retries  |\n";
  std::cout <<   "|-------------------|-------|-----|-----|------|------------|-------|----------|---------|----------|----------|\n";
  for (int threads : thread_counts) {
    double t = agg_time_ms[threads];
    uint64_t n = agg_nodes[threads];
    double mns = t > 0 ? (n / 1000000.0) / (t / 1000.0) : 0.0;
    double speedup = (baseline_ms > 0 && t > 0) ? baseline_ms / t : 0.0;
    std::cout << "| " << std::left << std::setw(17) << (std::string("diag-solve") + (weak ? "(weak)" : ""))
              << " | " << std::setw(5) << board_str
              << " | " << std::setw(3) << threads
              << " | " << std::setw(3) << positions.size()
              << " | " << std::setw(4) << agg_skipped[threads]
              << " | " << std::setw(10) << n
              << " | " << std::fixed << std::setprecision(2) << std::setw(5) << mns
              << " | " << std::setw(8) << (int)t
              << " | " << std::setprecision(2) << std::setw(6) << speedup << "x"
              << " | " << std::setw(8) << agg_drops[threads]
              << " | " << std::setw(8) << agg_retries[threads]
              << " |\n";
  }
}

template <int W, int H>
void run_diag_analyze(const std::vector<BenchPos> &positions, const std::vector<int> &thread_counts,
                       int repeats, double max_deficit = 0.10) {
  size_t mem_size = get_cache_size();
  auto cache = Solver<W, H>::createCache(mem_size);
  auto solver = Solver<W, H>::createWithCache(cache.get());

  std::map<int, double> agg_time_ms;
  std::map<int, uint64_t> agg_nodes, agg_drops, agg_retries;
  std::map<int, int> agg_skipped;

  for (int threads : thread_counts) {
    // analyze() clamps to min(width, threads) by default (Solver.cpp:675, toggled by
    // ANALYZE_WIDTH_CLAMP) — root-split can't use more threads than there are columns
    // unless the clamp is compiled out. Match whichever behavior this binary was built
    // with, or the noise check targets a CPU-time figure that's unreachable either way.
#if ANALYZE_WIDTH_CLAMP
    int effective_threads = std::min(W, threads);
#else
    int effective_threads = threads;
#endif
    warn_if_loaded(effective_threads);
    double total_time = 0;
    uint64_t total_nodes = 0, total_drops = 0, total_retries = 0;
    int skipped = 0;

    for (const auto &bp : positions) {
      GenericPosition<W, H> p;
      p.play(bp.pos);

      std::vector<double> trial_times;
      uint64_t last_nodes = 0, last_drops = 0, last_retries = 0;
      for (int r = 0; r < repeats; r++) {
        uint64_t nodes_before = 0, drops_before = 0, retries_before = 0;
        double wall_ms = run_clean_trial(effective_threads, [&]() {
          cache->reset();
          nodes_before = solver->getNodeCount();
          drops_before = cache->getDropCount();
          retries_before = cache->getRetryCount();
        }, [&]() {
          solver->analyze(p, false, threads, nullptr);
        }, 5, max_deficit);
        if (wall_ms < 0) continue;
        trial_times.push_back(wall_ms);
        last_nodes = solver->getNodeCount() - nodes_before;
        last_drops = cache->getDropCount() - drops_before;
        last_retries = cache->getRetryCount() - retries_before;
      }
      if (trial_times.empty()) { skipped++; continue; }
      std::sort(trial_times.begin(), trial_times.end());
      total_time += trial_times[trial_times.size() / 2];
      total_nodes += last_nodes;
      total_drops += last_drops;
      total_retries += last_retries;
    }

    agg_time_ms[threads] = total_time;
    agg_nodes[threads] = total_nodes;
    agg_drops[threads] = total_drops;
    agg_retries[threads] = total_retries;
    agg_skipped[threads] = skipped;
  }

  double baseline_ms = agg_time_ms.count(1) ? agg_time_ms[1] : 0.0;
  std::string board_str = std::to_string(W) + "x" + std::to_string(H);
  std::cout << "\n| Mode              | Board | Thr | Pos | Skip | Nodes      | MN/s  | Time(ms) | Speedup | Drops    | Retries  |\n";
  std::cout <<   "|-------------------|-------|-----|-----|------|------------|-------|----------|---------|----------|----------|\n";
  for (int threads : thread_counts) {
    double t = agg_time_ms[threads];
    uint64_t n = agg_nodes[threads];
    double mns = t > 0 ? (n / 1000000.0) / (t / 1000.0) : 0.0;
    double speedup = (baseline_ms > 0 && t > 0) ? baseline_ms / t : 0.0;
    std::cout << "| " << std::left << std::setw(17) << "diag-analyze"
              << " | " << std::setw(5) << board_str
              << " | " << std::setw(3) << threads
              << " | " << std::setw(3) << positions.size()
              << " | " << std::setw(4) << agg_skipped[threads]
              << " | " << std::setw(10) << n
              << " | " << std::fixed << std::setprecision(2) << std::setw(5) << mns
              << " | " << std::setw(8) << (int)t
              << " | " << std::setprecision(2) << std::setw(6) << speedup << "x"
              << " | " << std::setw(8) << agg_drops[threads]
              << " | " << std::setw(8) << agg_retries[threads]
              << " |\n";
  }
}

// --- Exact solve benchmark (Independent Parallelism, or Fresh-TT per position) ---
// Each thread gets its own Solver instance. When fresh_tt=true, a new TT is
// created per position so node counts are not inflated by warm-up from earlier positions.
template <int W, int H>
void run_solve(const std::vector<BenchPos> &positions, int threads, bool weak,
               int budget_ms = 2000, int timeout_ms_per = 200,
               const OpeningBookBase<W, H>* book = nullptr,
               bool fresh_tt = false) {
  size_t mem_size = get_cache_size();
  if (fresh_tt) {
    // Fresh-TT mode: each position gets its own solver with a cold TT.
    // Forces single-threaded sequential execution.
    uint64_t total_nodes = 0;
    int correct_cnt = 0, completed_cnt = 0;
    auto bench_start = Clock::now();
    for (const auto &bp : positions) {
      if (elapsed_ms(bench_start) > budget_ms) break;
      auto fresh_cache = Solver<W, H>::createCache(mem_size);
      auto solver = Solver<W, H>::createWithCache(fresh_cache.get());
      auto pos_start = Clock::now();
      GenericPosition<W, H> p;
      p.play(bp.pos);
      auto res = solver->solve(p, weak, 1, book, (double)timeout_ms_per);
      if (res.score == 0 && elapsed_ms(pos_start) >= timeout_ms_per * 0.9) continue; // timed out
      completed_cnt++;
      total_nodes += solver->getNodeCount();
      int expected = weak ? (bp.expected_score > 0 ? 1 : (bp.expected_score < 0 ? -1 : 0)) : bp.expected_score;
      int actual   = weak ? (res.score > 0 ? 1 : (res.score < 0 ? -1 : 0)) : res.score;
      if (actual == expected) correct_cnt++;
      else {
        g_parity_failures++;
        std::cerr << "PARITY FAIL [fresh solve" << (weak ? " weak" : "") << "]: pos=\""
                  << bp.pos << "\" expected=" << expected << " got=" << actual << "\n";
      }
    }
    double total_ms = elapsed_ms(bench_start);
    double mns = (total_nodes / 1000000.0) / (total_ms / 1000.0);
    static bool fsolve_header_printed = false;
    if (!fsolve_header_printed) {
      std::cout << "\n| Mode         | Type      | Board | Cache  | Slot    |"
                   " Thr | Pos  | Nodes      | MN/s  | Time     | Parity |\n";
      std::cout << "|--------------|-----------|-------|--------|---------|-----|"
                   "------|------------|-------|----------|--------|\n";
      fsolve_header_printed = true;
    }
    std::string mode = std::string(weak ? "solve(weak)" : "solve()") + "*";
    std::string board_str = std::to_string(W) + "x" + std::to_string(H);
    std::cout << "| " << std::left << std::setw(12) << mode << " | "
              << std::setw(9) << "Exact"
              << " | " << std::setw(5) << board_str
              << " | " << std::setw(6) << std::to_string(mem_size / (1024 * 1024)) + " MB"
              << " | " << std::setw(7) << std::to_string(Solver<W,H>::createCache(mem_size)->getSlotWidth()) + "-bit"
              << " | " << std::setw(3) << 1
              << " | " << std::setw(4) << completed_cnt
              << " | " << std::setw(10) << total_nodes
              << " | " << std::fixed << std::setprecision(2) << std::setw(5) << mns
              << " | " << std::setw(8) << std::to_string((int)total_ms) + " ms"
              << " | " << correct_cnt << "/" << completed_cnt
              << (correct_cnt == completed_cnt ? " ✓" : " FAIL") << " |\n";
    return;
  }

  // Shared-TT mode (original)
  auto cache = Solver<W, H>::createCache(mem_size);
  
  // Create a pool of solvers sharing the same cache
  std::vector<std::unique_ptr<Solver<W, H>>> solvers;
  for (int i = 0; i < threads; i++) {
    solvers.push_back(Solver<W, H>::createWithCache(cache.get()));
  }

  std::atomic<int> correct{0};
  std::atomic<int> completed{0};
  std::atomic<int> next_pos{0};
  auto bench_start = Clock::now();

  auto worker = [&](int tid) {
    while (true) {
      int idx = next_pos.fetch_add(1);
      if (idx >= (int)positions.size() || elapsed_ms(bench_start) > budget_ms) break;

      const auto &bp = positions[idx];
      auto pos_start = Clock::now();
      GenericPosition<W, H> p;
      p.play(bp.pos);
      
      // We use threads=1 here because we are parallelizing ACROSS positions
      auto res = solvers[tid]->solve(p, weak, 1, book);

      if (elapsed_ms(pos_start) >= timeout_ms_per * 0.9) continue;
      completed++;

      int expected = weak ? (bp.expected_score > 0 ? 1 : (bp.expected_score < 0 ? -1 : 0)) : bp.expected_score;
      int actual = weak ? (res.score > 0 ? 1 : (res.score < 0 ? -1 : 0)) : res.score;

      if (actual == expected) {
        correct++;
      } else {
        g_parity_failures++;
        // Mutex for clean error output
        static std::mutex cerr_mutex;
        std::lock_guard<std::mutex> lock(cerr_mutex);
        std::cerr << "PARITY FAIL [solve" << (weak ? " weak" : "") << " "
                  << threads << "T-Parallel]: pos=\"" << bp.pos
                  << "\" expected=" << expected << " got=" << actual << "\n";
      }
    }
  };

  std::vector<std::thread> thread_pool;
  for (int i = 0; i < threads; i++) {
    thread_pool.emplace_back(worker, i);
  }
  for (auto &t : thread_pool) {
    t.join();
  }

  uint64_t total_nodes = 0;
  for (const auto &s : solvers) total_nodes += s->getNodeCount();
  
  double total_ms = elapsed_ms(bench_start);
  double mns = (total_nodes / 1000000.0) / (total_ms / 1000.0);

  static bool solve_header_printed = false;
  if (!solve_header_printed) {
    std::cout << "\n| Mode         | Type      | Board | Cache  | Slot    | "
                 "Thr | Pos  | Nodes      | MN/s  | Time     | Parity |\n";
    std::cout << "|--------------|-----------|-------|--------|---------|-----|-"
                 "-----|------------|-------|----------|--------|\n";
    solve_header_printed = true;
  }

  std::string mode = weak ? "solve(weak)" : "solve()";
  std::string board_str = std::to_string(W) + "x" + std::to_string(H);
  std::cout << "| " << std::left << std::setw(12) << mode << " | "
            << std::setw(9) << "Exact"
            << " | " << std::setw(5) << board_str << " | " << std::setw(6)
            << std::to_string(mem_size / (1024 * 1024)) + " MB" << " | "
            << std::setw(7) << std::to_string(cache->getSlotWidth()) + "-bit"
            << " | " << std::setw(3) << threads << " | " << std::setw(4)
            << completed << " | " << std::setw(10) << total_nodes
            << " | " << std::fixed << std::setprecision(2) << std::setw(5)
            << mns << " | " << std::setw(8)
            << std::to_string((int)total_ms) + " ms" << " | " << (int)correct << "/"
            << (int)completed
            << (correct == completed ? " ✓" : " FAIL") << " |\n";
}

// --- Exact analyze benchmark (Independent Parallelism) ---
template <int W, int H>
void run_exact_analyze(const std::vector<BenchPos> &positions, int threads,
                       int budget_ms = 2000, int timeout_ms_per = 200) {
  size_t mem_size = get_cache_size();
  auto cache = Solver<W, H>::createCache(mem_size);
  
  std::vector<std::unique_ptr<Solver<W, H>>> solvers;
  for (int i = 0; i < threads; i++) {
    solvers.push_back(Solver<W, H>::createWithCache(cache.get()));
  }

  std::atomic<int> correct{0};
  std::atomic<int> completed{0};
  std::atomic<int> next_pos{0};
  auto bench_start = Clock::now();

  auto worker = [&](int tid) {
    while (true) {
      int idx = next_pos.fetch_add(1);
      if (idx >= (int)positions.size() || elapsed_ms(bench_start) > budget_ms) break;

      const auto &bp = positions[idx];
      auto pos_start = Clock::now();
      GenericPosition<W, H> p;
      p.play(bp.pos);
      
      auto res = solvers[tid]->analyze(p, false, 1, nullptr);

      if (elapsed_ms(pos_start) >= timeout_ms_per * 0.9) continue;
      completed++;

      int best_score = -1000;
      for (int s : res) {
        if (s > best_score) best_score = s;
      }
      if (best_score == bp.expected_score) {
        correct++;
      } else {
        g_parity_failures++;
        static std::mutex cerr_mutex;
        std::lock_guard<std::mutex> lock(cerr_mutex);
        std::cerr << "PARITY FAIL [analyze " << threads << "T-Parallel]: pos=\"" << bp.pos
                  << "\" expected=" << bp.expected_score << " got=" << best_score << "\n";
      }
    }
  };

  std::vector<std::thread> thread_pool;
  for (int i = 0; i < threads; i++) {
    thread_pool.emplace_back(worker, i);
  }
  for (auto &t : thread_pool) {
    t.join();
  }

  uint64_t total_nodes = 0;
  for (const auto &s : solvers) total_nodes += s->getNodeCount();
  double total_ms = elapsed_ms(bench_start);
  double mns = (total_nodes / 1000000.0) / (total_ms / 1000.0);

  if (threads == 1) {
    std::cout << "\n| Mode      | Type      | Board | Cache  | Slot    | Thr | "
                 "Pos  | Nodes      | MN/s  | Time    | Parity |\n";
    std::cout << "|-----------|-----------|-------|--------|---------|-----|---"
                 "---|------------|-------|---------|--------|\n";
  }

  std::string board_str = std::to_string(W) + "x" + std::to_string(H);
  std::cout << "| " << std::left << std::setw(9) << "analyze()"
            << " | " << std::setw(9) << "Exact"
            << " | " << std::setw(5) << board_str << " | " << std::setw(6)
            << std::to_string(mem_size / (1024 * 1024)) + " MB" << " | "
            << std::setw(7) << std::to_string(cache->getSlotWidth()) + "-bit"
            << " | " << std::setw(3) << threads << " | " << std::setw(4)
            << (int)completed << " | " << std::setw(10) << total_nodes
            << " | " << std::fixed << std::setprecision(2) << std::setw(5)
            << mns << " | " << std::setw(7)
            << std::to_string((int)total_ms) + " ms" << " | " << (int)correct << "/"
            << (int)completed
            << (correct == completed ? " ✓" : " FAIL") << " |\n";
}

std::vector<int> parse_thread_list(const std::string &s) {
  std::vector<int> out;
  std::stringstream ss(s);
  std::string tok;
  while (std::getline(ss, tok, ',')) {
    if (!tok.empty()) out.push_back(std::stoi(tok));
  }
  return out;
}

int main(int argc, char* argv[]) {
  bool flag_exact = false;
  bool flag_solve = false, flag_analyze = false;
  bool flag_pgo = false, flag_fresh = false;
  bool flag_gen_corpus = false;
  bool flag_diag_solve = false, flag_diag_analyze = false;
  bool flag_control_b = false;
  int budget_ms = 2000;
  int timeout_ms = 200;

  // gen-corpus options
  int min_ply = 8, max_ply = 10, corpus_count = 20, max_attempts = 20000;
  double dur_min_ms = 500.0, dur_max_ms = 1500.0;
  std::string corpus_out = "";
  unsigned int seed = 42;

  // diag options
  std::vector<int> thread_counts = {1, 2, 4, 6, 12};
  int repeats = 3;
  double max_deficit = 0.10;
  bool flag_weak = false;

  for (int i = 1; i < argc; i++) {
    std::string arg = argv[i];
    if (arg == "--exact") flag_exact = true;
    else if (arg == "--solve") flag_solve = true;
    else if (arg == "--analyze") flag_analyze = true;
    else if (arg == "--pgo") flag_pgo = true;
    else if (arg == "--fresh") flag_fresh = true;
    else if (arg == "--gen-corpus") flag_gen_corpus = true;
    else if (arg == "--diag-solve") flag_diag_solve = true;
    else if (arg == "--diag-analyze") flag_diag_analyze = true;
    else if (arg == "--control-b") flag_control_b = true;
    else if (arg == "--weak") flag_weak = true;
    else if (arg.find("--file=") == 0) continue;
    else if (arg == "--budget" && i + 1 < argc) budget_ms = std::stoi(argv[++i]);
    else if (arg == "--timeout" && i + 1 < argc) timeout_ms = std::stoi(argv[++i]);
    else if (arg == "--min-ply" && i + 1 < argc) min_ply = std::stoi(argv[++i]);
    else if (arg == "--max-ply" && i + 1 < argc) max_ply = std::stoi(argv[++i]);
    else if (arg == "--count" && i + 1 < argc) corpus_count = std::stoi(argv[++i]);
    else if (arg == "--max-attempts" && i + 1 < argc) max_attempts = std::stoi(argv[++i]);
    else if (arg == "--dur-min" && i + 1 < argc) dur_min_ms = std::stod(argv[++i]);
    else if (arg == "--dur-max" && i + 1 < argc) dur_max_ms = std::stod(argv[++i]);
    else if (arg == "--out" && i + 1 < argc) corpus_out = argv[++i];
    else if (arg == "--seed" && i + 1 < argc) seed = (unsigned int)std::stoul(argv[++i]);
    else if (arg == "--threads" && i + 1 < argc) thread_counts = parse_thread_list(argv[++i]);
    else if (arg == "--repeats" && i + 1 < argc) repeats = std::stoi(argv[++i]);
    else if (arg == "--max-deficit" && i + 1 < argc) max_deficit = std::stod(argv[++i]);
    else {
      std::cerr << "Unknown flag: " << arg << "\n";
      return 1;
    }
  }

  if (flag_gen_corpus) {
    std::string dim_str = std::to_string(BOARD_WIDTH_MACRO) + "x" + std::to_string(BOARD_HEIGHT_MACRO);
    if (corpus_out.empty()) corpus_out = "test-data/corpus_threading_" + dim_str + ".txt";
    run_gen_corpus<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(
        min_ply, max_ply, corpus_count, dur_min_ms, dur_max_ms, corpus_out, max_attempts, seed);
    return 0;
  }

  if (flag_diag_solve || flag_diag_analyze) {
    std::string dim_str = std::to_string(BOARD_WIDTH_MACRO) + "x" + std::to_string(BOARD_HEIGHT_MACRO);
    std::string pos_file = "test-data/corpus_threading_" + dim_str + ".txt";
    for (int i = 1; i < argc; i++) {
      std::string arg = argv[i];
      if (arg.find("--file=") == 0) pos_file = arg.substr(7);
    }
    auto pos_all = load_positions(pos_file);
    if (pos_all.empty()) {
      std::cerr << "No positions loaded from " << pos_file << "\n";
      return 1;
    }
    std::vector<BenchPos> valid_positions;
    for (const auto &bp : pos_all) {
      if (is_valid_position<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(bp.pos)) valid_positions.push_back(bp);
    }
    std::cout << "\n===========================================\n";
    std::cout << "Diagnostic (Test A): " << dim_str << " (" << valid_positions.size()
               << " positions, " << repeats << " repeats/trial)\n";
    std::cout << "===========================================";
    if (flag_diag_solve) run_diag_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(valid_positions, thread_counts, flag_weak, repeats, max_deficit);
    if (flag_diag_analyze) run_diag_analyze<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(valid_positions, thread_counts, repeats, max_deficit);
    return 0;
  }

  if (flag_control_b) {
    // Control B: N independent single-threaded solvers, each on a DIFFERENT position,
    // sharing one TT — by construction no thread ever redoes another's work, so this
    // isolates pure shared-memory/TT-contention cost with zero possibility of stomping.
    // Reuses the existing independent-parallelism benchmarks (run_solve/run_exact_analyze)
    // driven by the same --threads sweep as Test A, against the same frozen corpus.
    std::string dim_str = std::to_string(BOARD_WIDTH_MACRO) + "x" + std::to_string(BOARD_HEIGHT_MACRO);
    std::string pos_file = "test-data/corpus_threading_" + dim_str + ".txt";
    for (int i = 1; i < argc; i++) {
      std::string arg = argv[i];
      if (arg.find("--file=") == 0) pos_file = arg.substr(7);
    }
    auto pos_all = load_positions(pos_file);
    if (pos_all.empty()) {
      std::cerr << "No positions loaded from " << pos_file << "\n";
      return 1;
    }
    std::vector<BenchPos> valid_positions;
    for (const auto &bp : pos_all) {
      if (is_valid_position<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(bp.pos)) valid_positions.push_back(bp);
    }
    std::cout << "\n===========================================\n";
    std::cout << "Control B (independent parallelism): " << dim_str << " (" << valid_positions.size() << " positions)\n";
    std::cout << "===========================================";
    int cb_budget = budget_ms > 2000 ? budget_ms : 60000;
    int cb_timeout = timeout_ms > 200 ? timeout_ms : 5000;
    for (int threads : thread_counts) {
      if (flag_analyze) {
        run_exact_analyze<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(valid_positions, threads, cb_budget, cb_timeout);
      } else {
        run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(valid_positions, threads, flag_weak, cb_budget, cb_timeout);
      }
    }
    return 0;
  }

  bool run_all = !flag_exact && !flag_solve && !flag_analyze;
  bool do_exact_analyze = run_all || flag_analyze || (flag_exact && !flag_solve);
  bool do_exact_solve = run_all || flag_solve || (flag_exact && !flag_analyze);

  if (flag_pgo) run_all = true;

  std::string dim_str = std::to_string(BOARD_WIDTH_MACRO) + "x" + std::to_string(BOARD_HEIGHT_MACRO);
  std::string pos_file = "test-data/positions_" + dim_str + ".txt";
  for (int i = 1; i < argc; i++) {
    std::string arg = argv[i];
    if (arg.find("--file=") == 0) pos_file = arg.substr(7);
  }
  auto pos_all = load_positions(pos_file);
  if (pos_all.empty()) return 1;

  std::vector<BenchPos> valid_positions;
  for (const auto &bp : pos_all) {
    if (is_valid_position<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(bp.pos)) valid_positions.push_back(bp);
  }

  std::cout << "\n===========================================\n";
  std::cout << "Throughput Benchmark: " << dim_str << " (" << valid_positions.size() << " positions)\n";
  std::cout << "===========================================";

  const size_t max_solve = flag_pgo ? 50 : 50;
  const size_t max_analyze = flag_pgo ? 100 : 100;

  std::vector<BenchPos> exact_subset;
  int min_length_analyze = 0;
  for (const auto &bp : valid_positions) {
    if ((int)bp.pos.length() >= min_length_analyze) {
      exact_subset.push_back(bp);
      if (exact_subset.size() >= max_analyze) break;
    }
  }

  std::vector<BenchPos> solve_hard = valid_positions;
  if (solve_hard.size() > max_solve) solve_hard.resize(max_solve);

  if (!solve_hard.empty()) {
    if (do_exact_solve) {
      DummyBook<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO> dummy;
      if (flag_fresh) {
        // Fresh-TT mode: one cold solve per position (strong only — most useful for ordering comparison)
        run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 1, false, budget_ms, timeout_ms, &dummy, true);
      } else {
        run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 1, true, budget_ms, timeout_ms);
        run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 4, true, budget_ms, timeout_ms);
        run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 18, true, budget_ms, timeout_ms);
        run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 1, false, budget_ms, timeout_ms, &dummy);
        run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 4, false, budget_ms, timeout_ms, &dummy);
        run_solve<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(solve_hard, 18, false, budget_ms, timeout_ms, &dummy);
      }
    }
  }

  if (do_exact_analyze) {
    if (exact_subset.size() >= 2) {
      run_exact_analyze<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(exact_subset, 1, budget_ms, timeout_ms);
      run_exact_analyze<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(exact_subset, 4, budget_ms, timeout_ms);
      run_exact_analyze<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>(exact_subset, 18, budget_ms, timeout_ms);
    }
  }

  if (g_parity_failures > 0) return 1;
  return 0;
}
