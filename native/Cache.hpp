#ifndef CACHE_HPP
#define CACHE_HPP

namespace GameSolver {
namespace Connect4 {

class Cache {
 public:
  virtual ~Cache() = default;
  virtual void reset() = 0;
  virtual int getSlotWidth() const = 0;
  virtual std::shared_ptr<void> getSharedPtr() { return nullptr; }

  // Contention diagnostics — 0 unless the TranspositionTable was built with
  // -DTT_CONTENTION_STATS=1. See native/TranspositionTable.hpp.
  virtual unsigned long long getDropCount() const { return 0; }
  virtual unsigned long long getRetryCount() const { return 0; }
  virtual size_t getNumBuckets() const { return 0; }
};

} // namespace Connect4
} // namespace GameSolver

#endif
