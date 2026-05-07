#ifndef NNUE_HPP
#define NNUE_HPP

#include "nnue_weights_8x8.hpp"
#include "nnue_weights_7x6.hpp"
#include "Position.hpp"
#include "NNUEAccumulator.hpp"
#include <cstdint>
#include <algorithm>

namespace GameSolver {
namespace Connect4 {

// Base template
template <int W, int H>
class NNUE {
 public:
  static int evaluate(const GenericPosition<W, H>& /* P */) {
    return 0;
  }
  static int evaluate_accumulated(const NNUEAccumulator<W, H>& /* acc */, const GenericPosition<W, H>& P) {
    return 0;
  }
};

// 8x8 NNUE Specialization (2-layer)
template <>
class NNUE<8, 8> {
 public:
  static int evaluate(const GenericPosition<8, 8>& P) {
    NNUEAccumulator<8, 8> acc;
    acc.init(P);
    return acc.evaluate(P.nbMoves() % 2);
  }

  static int evaluate_accumulated(const NNUEAccumulator<8, 8>& acc, const GenericPosition<8, 8>& P) {
    return acc.evaluate(P.nbMoves() % 2);
  }
};

// 7x6 NNUE Specialization
template <>
class NNUE<7, 6> {
 public:
  static int evaluate(const GenericPosition<7, 6>& P) {
    NNUEAccumulator<7, 6> acc;
    acc.init(P);
    return acc.evaluate(P.nbMoves() % 2);
  }

  static int evaluate_accumulated(const NNUEAccumulator<7, 6>& acc, const GenericPosition<7, 6>& P) {
    return acc.evaluate(P.nbMoves() % 2);
  }
};

}
}
#endif
