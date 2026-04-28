#ifndef NNUE_HPP
#define NNUE_HPP

#include "nnue_weights_8x8.hpp"
#include "nnue_weights_7x6.hpp"
#include "Position.hpp"
#include <cstdint>
#include <algorithm>

namespace GameSolver {
namespace Connect4 {

// Base template: Fallback to fast bitwise heuristic if NNUE is not defined for the size.
template <int W, int H>
class NNUE {
 public:
  static int evaluate(const GenericPosition<W, H>& P) {
    return P.getScore();
  }
  static int evaluate_accumulated(const NNUEAccumulator<W, H>& acc, const GenericPosition<W, H>& P) {
    return P.heuristic_evaluate();
  }
};

// 8x8 NNUE Specialization
template <>
class NNUE<8, 8> {
 public:
  static int evaluate(const GenericPosition<8, 8>& P) {
    return evaluate_raw(P.getCurrentPosition(), P.getMask());
  }

  static int evaluate_accumulated(const NNUEAccumulator<8, 8>& acc, const GenericPosition<8, 8>& P) {
    return acc.evaluate(P.nbMoves() % 2);
  }

  static int evaluate_raw(typename GenericPosition<8, 8>::position_t pos, typename GenericPosition<8, 8>::position_t mask) {
    int32_t hidden[256];
    for (int i = 0; i < 256; i++) {
        hidden[i] = NNUE_8x8::FEATURE_BIAS[i];
    }

    typename GenericPosition<8, 8>::position_t opp = mask ^ pos;

    for (int c = 0; c < 8; c++) {
      for (int r = 0; r < 8; r++) {
        int bit_idx = c * (8 + 1) + r;
        if ((pos >> bit_idx) & 1) {
          int feature_idx = c * 8 + r;
          for (int i = 0; i < 256; i++) {
            hidden[i] += NNUE_8x8::FEATURE_WEIGHTS[feature_idx][i];
          }
        } else if ((opp >> bit_idx) & 1) {
          int feature_idx = 8 * 8 + c * 8 + r;
          for (int i = 0; i < 256; i++) {
            hidden[i] += NNUE_8x8::FEATURE_WEIGHTS[feature_idx][i];
          }
        }
      }
    }

    int32_t sum = NNUE_8x8::OUTPUT_BIAS;
    for (int i = 0; i < 256; i++) {
      int32_t act = hidden[i];
      if (act > 0) {
        if (act > NNUE_8x8::QA) act = NNUE_8x8::QA;
        sum += act * NNUE_8x8::OUTPUT_WEIGHTS[i];
      }
    }

    return sum;
  }
};

// 7x6 NNUE Specialization
template <>
class NNUE<7, 6> {
 public:
  static int evaluate(const GenericPosition<7, 6>& P) {
    return evaluate_raw(P.getCurrentPosition(), P.getMask());
  }

  static int evaluate_accumulated(const NNUEAccumulator<7, 6>& acc, const GenericPosition<7, 6>& P) {
    return acc.evaluate(P.nbMoves() % 2);
  }

  static int evaluate_raw(typename GenericPosition<7, 6>::position_t pos, typename GenericPosition<7, 6>::position_t mask) {
    int32_t hidden[256];
    for (int i = 0; i < 256; i++) {
        hidden[i] = NNUE_7x6::FEATURE_BIAS[i];
    }

    typename GenericPosition<7, 6>::position_t opp = mask ^ pos;

    for (int c = 0; c < 7; c++) {
      for (int r = 0; r < 6; r++) {
        int bit_idx = c * (6 + 1) + r;
        if ((pos >> bit_idx) & 1) {
          int feature_idx = c * 6 + r;
          for (int i = 0; i < 256; i++) {
            hidden[i] += NNUE_7x6::FEATURE_WEIGHTS[feature_idx][i];
          }
        } else if ((opp >> bit_idx) & 1) {
          int feature_idx = 7 * 6 + c * 6 + r;
          for (int i = 0; i < 256; i++) {
            hidden[i] += NNUE_7x6::FEATURE_WEIGHTS[feature_idx][i];
          }
        }
      }
    }

    int32_t sum = NNUE_7x6::OUTPUT_BIAS;
    for (int i = 0; i < 256; i++) {
      int32_t act = hidden[i];
      if (act > 0) {
        if (act > NNUE_7x6::QA) act = NNUE_7x6::QA;
        sum += act * NNUE_7x6::OUTPUT_WEIGHTS[i];
      }
    }

    return sum;
  }
};

}
}
#endif
