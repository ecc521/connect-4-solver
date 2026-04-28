#ifndef CACHE_HPP
#define CACHE_HPP

namespace GameSolver {
namespace Connect4 {

class Cache {
 public:
  virtual ~Cache() = default;
  virtual void reset() = 0;
};

} // namespace Connect4
} // namespace GameSolver

#endif
