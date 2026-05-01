#ifndef NNUE_ACCUMULATOR_HPP
#define NNUE_ACCUMULATOR_HPP

#include "nnue_weights_8x8.hpp"
#include "nnue_weights_7x6.hpp"
#include "Position.hpp"
#include <cstdint>
#include <cstring>

namespace GameSolver {
namespace Connect4 {

// Base Template (Safely does nothing for unsupported sizes)
template <int W, int H>
class NNUEAccumulator {
public:
    int32_t hidden[2][256];
    NNUEAccumulator() {}
    inline void reset() {}
    inline void init(const GenericPosition<W, H>& /* P */) {}
    inline void addPiece(int /* player */, int /* col */, int /* row */) {}
    inline void removePiece(int /* player */, int /* col */, int /* row */) {}
    inline int evaluate(int /* current_player */) const { return 0; }
};

// 8x8 Specialization
template <>
class NNUEAccumulator<8, 8> {
public:
    int32_t hidden[2][256];

    NNUEAccumulator() { reset(); }

    inline void reset() {
        for (int i = 0; i < 256; i++) {
            hidden[0][i] = NNUE_8x8::FEATURE_BIAS[i];
            hidden[1][i] = NNUE_8x8::FEATURE_BIAS[i];
        }
    }

    inline void init(const GenericPosition<8, 8>& P) {
        reset();
        using position_t = typename GenericPosition<8, 8>::position_t;
        position_t pos = P.getCurrentPosition();
        position_t opp = P.getMask() ^ pos;
        int current_player = P.nbMoves() % 2;

        for (int c = 0; c < 8; c++) {
            for (int r = 0; r < 8; r++) {
                int bit_idx = c * (8 + 1) + r;
                if ((pos >> bit_idx) & 1) {
                    addPiece(current_player, c, r);
                } else if ((opp >> bit_idx) & 1) {
                    addPiece(1 - current_player, c, r);
                }
            }
        }
    }

    inline void addPiece(int player, int col, int row) {
        int my_feature_idx = col * 8 + row;
        int opp_feature_idx = 8 * 8 + col * 8 + row;

        for (int i = 0; i < 256; i++) {
            hidden[player][i] += NNUE_8x8::FEATURE_WEIGHTS[my_feature_idx][i];
            hidden[1 - player][i] += NNUE_8x8::FEATURE_WEIGHTS[opp_feature_idx][i];
        }
    }

    inline void removePiece(int player, int col, int row) {
        int my_feature_idx = col * 8 + row;
        int opp_feature_idx = 8 * 8 + col * 8 + row;

        for (int i = 0; i < 256; i++) {
            hidden[player][i] -= NNUE_8x8::FEATURE_WEIGHTS[my_feature_idx][i];
            hidden[1 - player][i] -= NNUE_8x8::FEATURE_WEIGHTS[opp_feature_idx][i];
        }
    }

    inline int evaluate(int current_player) const {
        int32_t sum = NNUE_8x8::OUTPUT_BIAS;
        for (int i = 0; i < 256; i++) {
            int32_t act = hidden[current_player][i];
            if (act > 0) {
                if (act > NNUE_8x8::QA) act = NNUE_8x8::QA;
                sum += act * NNUE_8x8::OUTPUT_WEIGHTS[i];
            }
        }
        sum = sum / NNUE_8x8::QA;
        if (sum > 30000) sum = 30000;
        if (sum < -30000) sum = -30000;
        return sum;
    }
};

// 7x6 Specialization
template <>
class NNUEAccumulator<7, 6> {
public:
    int32_t hidden[2][256];

    NNUEAccumulator() { reset(); }

    inline void reset() {
        for (int i = 0; i < 256; i++) {
            hidden[0][i] = NNUE_7x6::FEATURE_BIAS[i];
            hidden[1][i] = NNUE_7x6::FEATURE_BIAS[i];
        }
    }

    inline void init(const GenericPosition<7, 6>& P) {
        reset();
        using position_t = typename GenericPosition<7, 6>::position_t;
        position_t pos = P.getCurrentPosition();
        position_t opp = P.getMask() ^ pos;
        int current_player = P.nbMoves() % 2;

        for (int c = 0; c < 7; c++) {
            for (int r = 0; r < 6; r++) {
                int bit_idx = c * (6 + 1) + r;
                if ((pos >> bit_idx) & 1) {
                    addPiece(current_player, c, r);
                } else if ((opp >> bit_idx) & 1) {
                    addPiece(1 - current_player, c, r);
                }
            }
        }
    }

    inline void addPiece(int player, int col, int row) {
        int my_feature_idx = col * 6 + row;
        int opp_feature_idx = 7 * 6 + col * 6 + row;

        for (int i = 0; i < 256; i++) {
            hidden[player][i] += NNUE_7x6::FEATURE_WEIGHTS[my_feature_idx][i];
            hidden[1 - player][i] += NNUE_7x6::FEATURE_WEIGHTS[opp_feature_idx][i];
        }
    }

    inline void removePiece(int player, int col, int row) {
        int my_feature_idx = col * 6 + row;
        int opp_feature_idx = 7 * 6 + col * 6 + row;

        for (int i = 0; i < 256; i++) {
            hidden[player][i] -= NNUE_7x6::FEATURE_WEIGHTS[my_feature_idx][i];
            hidden[1 - player][i] -= NNUE_7x6::FEATURE_WEIGHTS[opp_feature_idx][i];
        }
    }

    inline int evaluate(int current_player) const {
        int32_t sum = NNUE_7x6::OUTPUT_BIAS;
        for (int i = 0; i < 256; i++) {
            int32_t act = hidden[current_player][i];
            if (act > 0) {
                if (act > NNUE_7x6::QA) act = NNUE_7x6::QA;
                sum += act * NNUE_7x6::OUTPUT_WEIGHTS[i];
            }
        }
        sum = sum / NNUE_7x6::QA;
        if (sum > 30000) sum = 30000;
        if (sum < -30000) sum = -30000;
        return sum;
    }
};

} // namespace Connect4
} // namespace GameSolver

#endif
