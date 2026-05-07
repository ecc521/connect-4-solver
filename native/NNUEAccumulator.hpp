#ifndef NNUE_ACCUMULATOR_HPP
#define NNUE_ACCUMULATOR_HPP

#include "nnue_weights_8x8.hpp"
#include "NNUEAccumulatorOneLayer.hpp"
#include "nnue_weights_7x6.hpp"
#include "Position.hpp"
#include <cstdint>
#include <cstring>
#if defined(__ARM_NEON) || defined(__aarch64__)
#include <arm_neon.h>
#endif

namespace GameSolver {
namespace Connect4 {

// Base Template (Safely does nothing for unsupported sizes)
template <int W, int H>
class NNUEAccumulator {
public:
    inline void reset() {}
    inline void init(const GenericPosition<W, H>& /* P */) {}
    inline void addPiece(int /* player */, int /* col */, int /* row */) {}
    inline void removePiece(int /* player */, int /* col */, int /* row */) {}
    inline int evaluate(int /* current_player */) const { return 0; }
};

// Generic 2-layer NNUE Accumulator
template <int W, int H, typename WTS>
class NNUEAccumulatorTwoLayer {
public:
    alignas(64) int32_t hidden[2][WTS::H1];

    NNUEAccumulatorTwoLayer() { reset(); }

    inline void reset() {
        for (int i = 0; i < WTS::H1; i++) {
            hidden[0][i] = WTS::B1[i];
            hidden[1][i] = WTS::B1[i];
        }
    }

    inline void init(const GenericPosition<W, H>& P) {
        reset();
        using position_t = typename GenericPosition<W, H>::position_t;
        position_t pos = P.getCurrentPosition();
        position_t opp = P.getMask() ^ pos;
        int current_player = P.nbMoves() % 2;

        for (int c = 0; c < W; c++) {
            for (int r = 0; r < H; r++) {
                int bit_idx = c * (H + 1) + r;
                if ((pos >> bit_idx) & 1) {
                    addPiece(current_player, c, r);
                } else if ((opp >> bit_idx) & 1) {
                    addPiece(1 - current_player, c, r);
                }
            }
        }
    }

    inline void addPiece(int player, int col, int row) {
        int my_feature_idx = col * H + row;
        int opp_feature_idx = W * H + col * H + row;

        int32_t* h_my = hidden[player];
        int32_t* h_opp = hidden[1 - player];
        const int32_t* w_my = WTS::W1[my_feature_idx];
        const int32_t* w_opp = WTS::W1[opp_feature_idx];

#if defined(__ARM_NEON) || defined(__aarch64__)
        for (int i = 0; i < WTS::H1; i += 4) {
            vst1q_s32(&h_my[i], vaddq_s32(vld1q_s32(&h_my[i]), vld1q_s32(&w_my[i])));
            vst1q_s32(&h_opp[i], vaddq_s32(vld1q_s32(&h_opp[i]), vld1q_s32(&w_opp[i])));
        }
#else
        #pragma clang loop vectorize(enable)
        for (int i = 0; i < WTS::H1; i++) {
            h_my[i] += w_my[i];
            h_opp[i] += w_opp[i];
        }
#endif
    }

    inline void removePiece(int player, int col, int row) {
        int my_feature_idx = col * H + row;
        int opp_feature_idx = W * H + col * H + row;

        int32_t* h_my = hidden[player];
        int32_t* h_opp = hidden[1 - player];
        const int32_t* w_my = WTS::W1[my_feature_idx];
        const int32_t* w_opp = WTS::W1[opp_feature_idx];

#if defined(__ARM_NEON) || defined(__aarch64__)
        for (int i = 0; i < WTS::H1; i += 4) {
            vst1q_s32(&h_my[i], vsubq_s32(vld1q_s32(&h_my[i]), vld1q_s32(&w_my[i])));
            vst1q_s32(&h_opp[i], vsubq_s32(vld1q_s32(&h_opp[i]), vld1q_s32(&w_opp[i])));
        }
#else
        #pragma clang loop vectorize(enable)
        for (int i = 0; i < WTS::H1; i++) {
            h_my[i] -= w_my[i];
            h_opp[i] -= w_opp[i];
        }
#endif
    }

    inline int evaluate(int current_player) const {
#if defined(__ARM_NEON) || defined(__aarch64__)
        int32x4_t v_h2[WTS::H2 / 4];
        for (int j = 0; j < WTS::H2 / 4; j++) {
            v_h2[j] = vld1q_s32(&WTS::B2[j * 4]);
        }

        const int32_t* h1 = hidden[current_player];
        for (int i = 0; i < WTS::H1; i++) {
            int32_t act = h1[i];
            if (act > 0) {
                if (act > WTS::QA) act = WTS::QA;
                const int32_t* weights = WTS::W2[i];
                int32x4_t v_act = vdupq_n_s32(act);
                
                #pragma unroll
                for (int j = 0; j < WTS::H2 / 4; j++) {
                    v_h2[j] = vmlaq_s32(v_h2[j], v_act, vld1q_s32(&weights[j * 4]));
                }
            }
        }

        alignas(64) int32_t h2[WTS::H2];
        for (int j = 0; j < WTS::H2 / 4; j++) {
            vst1q_s32(&h2[j * 4], v_h2[j]);
        }
#else
        alignas(64) int32_t h2[WTS::H2];
        for (int j = 0; j < WTS::H2; j++) {
            h2[j] = WTS::B2[j];
        }

        const int32_t* h1 = hidden[current_player];
        for (int i = 0; i < WTS::H1; i++) {
            int32_t act = h1[i];
            if (act > 0) {
                if (act > WTS::QA) act = WTS::QA;
                const int32_t* weights = WTS::W2[i];
                #pragma clang loop vectorize(enable)
                for (int j = 0; j < WTS::H2; j++) {
                    h2[j] += act * weights[j];
                }
            }
        }
#endif

        // Layer 3: ClippedReLU(H2) * W3 + B3
        int32_t sum = WTS::B3;
        for (int j = 0; j < WTS::H2; j++) {
            int32_t act = h2[j] / WTS::QA;
            if (act > 0) {
                if (act > WTS::QA) act = WTS::QA;
                sum += act * WTS::W3[j];
            }
        }

        sum = sum / WTS::QA;
        if (sum > 30000) sum = 30000;
        if (sum < -30000) sum = -30000;
        return (int)sum;
    }
};

// 8x8 Specialization (2-layer)
template <>
class NNUEAccumulator<8, 8> : public NNUEAccumulatorTwoLayer<8, 8, NNUE_8x8::Weights> {
public:
    using NNUEAccumulatorTwoLayer<8, 8, NNUE_8x8::Weights>::NNUEAccumulatorTwoLayer;
};



// 7x6 Specialization (Legacy 1-layer)
template <>
class NNUEAccumulator<7, 6> {
public:
    alignas(64) int32_t hidden[2][256];

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
