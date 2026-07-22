#ifndef THREAD_PRIORITY_HPP
#define THREAD_PRIORITY_HPP

#if defined(__APPLE__) || defined(__linux__) || defined(__ANDROID__)
#include <cerrno>
#include <sys/resource.h>
#endif
#if defined(__linux__) || defined(__ANDROID__)
#include <sys/syscall.h>
#include <unistd.h>
#endif
#if defined(_WIN32)
#include <windows.h>
#endif
#include <algorithm>

namespace GameSolver {
namespace Connect4 {
namespace detail {

// Per-OS-thread cache of "what was this thread's priority before we ever
// touched it", captured lazily on first lower(). Shared (not per-function)
// so raise() can restore exactly what lower() found, even though ambient
// baseline isn't necessarily 0 -- e.g. tools/generate-book.ts renices its
// whole process to PRIORITY_LOW first, so every thread it spawns starts at
// nice 19, not 0.
inline thread_local bool g_priorityCached = false;
#if defined(__APPLE__) || defined(__linux__) || defined(__ANDROID__)
inline thread_local int g_originalNice = 0;
#elif defined(_WIN32)
inline thread_local int g_originalWinPriority = THREAD_PRIORITY_NORMAL;

// SetThreadPriority only documents these 7 values as valid input (plus the
// unrelated MODE_BACKGROUND_BEGIN/END sentinels, never used here). Only
// LOWEST..HIGHEST are contiguous relative offsets within the process's
// priority class -- ordinary scheduling weight, no side effects. IDLE and
// TIME_CRITICAL are a different kind of thing: absolute overrides that only
// have any guarantee at all via Windows' periodic anti-starvation boost, not
// proportional scheduling weight. Not something to lean on for a live
// solver, so IDLE is listed here (so "subtract 1" from LOWEST never lands on
// an undocumented value) but deliberately excluded from the reachable range
// below -- LOWEST is as low as this file will ever go.
inline constexpr int kWinPriorityLevels[] = {
    THREAD_PRIORITY_IDLE, THREAD_PRIORITY_LOWEST, THREAD_PRIORITY_BELOW_NORMAL,
    THREAD_PRIORITY_NORMAL, THREAD_PRIORITY_ABOVE_NORMAL, THREAD_PRIORITY_HIGHEST,
    THREAD_PRIORITY_TIME_CRITICAL,
};
constexpr int kWinPriorityLevelCount = 7;
constexpr int kWinPriorityFloorIndex = 1;  // LOWEST -- never reach IDLE

inline int winPriorityIndex(int level) {
  for (int i = 0; i < kWinPriorityLevelCount; i++) {
    if (kWinPriorityLevels[i] == level) return i;
  }
  return 3;  // NORMAL's index, if this thread's level somehow isn't one of the above
}
#endif

} // namespace detail

// Racer/helper tasks call this once at their single entry point, and
// raiseCurrentThreadPriority() once at their single exit point (restore-on-
// exit: fewer syscalls than re-declaring priority at the top of every task,
// since a pool thread only pays for a transition when its role actually
// changes). Lowers relative to THIS thread's own priority the first time it
// was ever touched here, never a hardcoded absolute -- if the whole process
// (or thread) started below normal, "lower" still means "one step further
// down from wherever it already was", not an absolute nice value that could
// accidentally be a promotion. If there's no headroom left (already at the
// platform's minimum), this is a no-op and the thread simply runs at
// minimum alongside everything else already there -- a degraded but safe
// outcome, not an error.
inline void lowerCurrentThreadPriority(int niceDelta) {
  // Benchmark-only escape hatch: DISABLE_THREAD_PRIORITY_HINTS turns both
  // lower/raise into no-ops so the priority mechanism's own contribution can
  // be A/B'd in isolation, independent of the piling-on mechanism itself.
  static const bool disabled = std::getenv("DISABLE_THREAD_PRIORITY_HINTS") != nullptr;
  if (disabled) return;
#if defined(__APPLE__) || defined(__linux__) || defined(__ANDROID__)
#if defined(__APPLE__)
  // PRIO_DARWIN_THREAD is the "nice" mechanism, not `taskpolicy` -- plain
  // nice never tips a thread into Darwin's background taskpolicy tier (that
  // requires the separate task_policy/taskpolicy API, which nothing here
  // touches), so nice 19 is a perfectly ordinary ceiling, same as Linux.
  const int which = PRIO_DARWIN_THREAD;
  const id_t who = 0;
#else
  const int which = PRIO_PROCESS;
  const id_t who = (id_t)syscall(SYS_gettid);
#endif
  if (!detail::g_priorityCached) {
    errno = 0;
    int cur = getpriority(which, who);
    if (cur == -1 && errno != 0) return;  // couldn't read, leave alone
    detail::g_originalNice = cur;
    detail::g_priorityCached = true;
  }
  // setpriority() clamps out-of-range values into the valid range rather
  // than failing, but clamp here too so the intent (niceDelta below
  // original) reads directly off this line rather than relying on kernel
  // behavior.
  setpriority(which, who, std::min(detail::g_originalNice + niceDelta, 19));
#elif defined(_WIN32)
  if (!detail::g_priorityCached) {
    int cur = GetThreadPriority(GetCurrentThread());
    if (cur == THREAD_PRIORITY_ERROR_RETURN) return;  // couldn't read, leave alone
    detail::g_originalWinPriority = cur;
    detail::g_priorityCached = true;
  }
  const int idx = detail::winPriorityIndex(detail::g_originalWinPriority);
  // If original was already below our floor (e.g. IDLE, set by something
  // outside this file), yield to it -- our floor caps how far we push
  // things down, it never pulls anything back up.
  const int floorIdx = std::min(detail::kWinPriorityFloorIndex, idx);
  SetThreadPriority(GetCurrentThread(), detail::kWinPriorityLevels[std::max(idx - 1, floorIdx)]);
#else
  (void)niceDelta;
#endif
}

// Restores this thread's priority to exactly what lowerCurrentThreadPriority()
// found the first time it ran here -- never higher, so a racer thread can
// never end up outranking wherever this thread (or process) started. No-op
// if this thread never lowered (nothing cached to restore). Best-effort:
// unprivileged processes can generally renice back to their own starting
// point, but this can still fail in locked-down environments (containers, a
// tightened RLIMIT_NICE) -- failure is silently tolerated, since a thread
// stuck at low priority just costs some throughput, it never corrupts
// anything.
inline void raiseCurrentThreadPriority() {
#if defined(__APPLE__) || defined(__linux__) || defined(__ANDROID__)
#if defined(__APPLE__)
  const int which = PRIO_DARWIN_THREAD;
  const id_t who = 0;
#else
  const int which = PRIO_PROCESS;
  const id_t who = (id_t)syscall(SYS_gettid);
#endif
  if (!detail::g_priorityCached) return;
  setpriority(which, who, detail::g_originalNice);
#elif defined(_WIN32)
  if (!detail::g_priorityCached) return;
  SetThreadPriority(GetCurrentThread(), detail::g_originalWinPriority);
#endif
}

} // namespace Connect4
} // namespace GameSolver

#endif
