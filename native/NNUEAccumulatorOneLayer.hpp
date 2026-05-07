#ifndef NNUE_ACCUMULATOR_ONE_LAYER_HPP
#define NNUE_ACCUMULATOR_ONE_LAYER_HPP

#include "Position.hpp"
#include <cstdint>
#include <cstring>
#if defined(__ARM_NEON) || defined(__aarch64__)
#include <arm_neon.h>
#endif

namespace GameSolver {
namespace Connect4 {

template <int W, int H, typename WTS>
class NNUEAccumulatorOneLayer {
public:
    alignas(64) int32_t hidden[2][WTS::H1];

    NNUEAccumulatorOneLayer() { reset(); }

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
        int32_t sum = WTS::B2;
        const int32_t* h1 = hidden[current_player];
        
#if defined(__ARM_NEON) || defined(__aarch64__)
        int32x4_t v_sum = vdupq_n_s32(0);
        int32x4_t v_qa = vdupq_n_s32(WTS::QA);
        int32x4_t v_zero = vdupq_n_s32(0);

        for (int i = 0; i < WTS::H1; i += 4) {
            int32x4_t v_act = vld1q_s32(&h1[i]);
            v_act = vmaxq_s32(v_act, v_zero);
            v_act = vminq_s32(v_act, v_qa);
            v_sum = vmlaq_s32(v_sum, v_act, vld1q_s32(&WTS::W2[i]));
        }
        
        sum += vgetq_lane_s32(v_sum, 0) + vgetq_lane_s32(v_sum, 1) + vgetq_lane_s32(v_sum, 2) + vgetq_lane_s32(v_sum, 3);
#else
        #pragma clang loop vectorize(enable)
        for (int i = 0; i < WTS::H1; i++) {
            int32_t act = h1[i];
            if (act > 0) {
                if (act > WTS::QA) act = WTS::QA;
                sum += act * WTS::W2[i];
            }
        }
#endif
        
        sum = sum / WTS::QA;
        if (sum > 30000) sum = 30000;
        if (sum < -30000) sum = -30000;
        return sum;
    }
};

}
}
#endif
