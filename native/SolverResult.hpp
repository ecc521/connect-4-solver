#ifndef SOLVER_RESULT_HPP
#define SOLVER_RESULT_HPP

namespace GameSolver {
namespace Connect4 {

struct SolverResult {
  int score;
  int bestMove;
  int depth;
  unsigned long long nodes;
};

}
}

#endif
