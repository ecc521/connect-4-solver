"""
export_weights_8x8.py
Exports a trained 8x8 NNUE PyTorch model to native/nnue_weights_8x8.hpp.

Quantization scheme (matches NNUEAccumulatorTwoLayer in NNUEAccumulator.hpp):
  QA = 127
  W1: float * QA  → int32   (accumulator weights)
  B1: float * QA  → int32   (accumulator biases)
  W2: float * QA  → int32   (hidden layer weights, applied after ClipReLU/QA)
  B2: float * QA  → int32   (hidden layer biases)
  W3: float * SCALE / QA → int32  (output weights, SCALE maps to SCORE_NNUE_MAX)
  B3: float * SCALE       → int32  (output bias)

SCALE is chosen so that the maximum possible output ≈ SCORE_NNUE_MAX (30000).
For a model with normalized targets in [-1, +1], output ≈ 1.0 at saturation,
so SCALE = SCORE_NNUE_MAX = 30000.

Usage:
  python tools/export_weights_8x8.py --model data/nnue_8x8_S.pt --hidden1 256 --hidden2 32
  python tools/export_weights_8x8.py --model data/nnue_8x8_M.pt --hidden1 512 --hidden2 64
  python tools/export_weights_8x8.py --model data/nnue_8x8_L.pt --hidden1 1024 --hidden2 128
"""

import argparse
import numpy as np
import torch
import torch.nn as nn


WIDTH  = 8
HEIGHT = 8
INPUT  = WIDTH * HEIGHT * 2  # 128

SCORE_NNUE_MAX = 30000
QA = 127
# SCALE maps model output (normalized [-1,+1]) to integer NNUE range.
# W3 is applied AFTER ClipReLU/QA division, so effective multiply is SCALE.
SCALE = SCORE_NNUE_MAX


class ClippedReLU(nn.Module):
    def forward(self, x): return torch.clamp(x, 0.0, 1.0)


class NNUE(nn.Module):
    def __init__(self, hidden1, hidden2):
        super().__init__()
        self.fc1   = nn.Linear(INPUT, hidden1)
        self.relu1 = ClippedReLU()
        self.fc2   = nn.Linear(hidden1, hidden2)
        self.relu2 = ClippedReLU()
        self.fc3   = nn.Linear(hidden2, 1)

    def forward(self, x):
        x = self.relu1(self.fc1(x))
        x = self.relu2(self.fc2(x))
        return self.fc3(x)


def quantize(arr, scale, dtype=np.int32):
    return np.round(arr * scale).astype(dtype)


def export(model_path, output_path, hidden1, hidden2):
    model = NNUE(hidden1, hidden2)
    state = torch.load(model_path, map_location='cpu', weights_only=True)
    model.load_state_dict(state)
    model.eval()

    w1 = model.fc1.weight.detach().numpy()  # [H1, INPUT]
    b1 = model.fc1.bias.detach().numpy()    # [H1]
    w2 = model.fc2.weight.detach().numpy()  # [H2, H1]
    b2 = model.fc2.bias.detach().numpy()    # [H2]
    w3 = model.fc3.weight.detach().numpy()  # [1, H2]
    b3 = model.fc3.bias.detach().numpy()    # [1]

    # Quantize
    W1_int = quantize(w1, QA)         # shape [H1, INPUT]
    B1_int = quantize(b1, QA)         # shape [H1]
    W2_int = quantize(w2, QA)         # shape [H2, H1]
    B2_int = quantize(b2, QA)         # shape [H2]
    W3_int = quantize(w3[0], SCALE)   # shape [H2]  (after /QA division in C++)
    B3_int = int(round(b3[0] * SCALE))

    # W1 is stored transposed for memory locality: W1[INPUT_FEATURE][H1]
    W1_T = W1_int.T  # [INPUT, H1]
    # W2 is stored transposed: W2[H1][H2]
    W2_T = W2_int.T  # [H1, H2]

    guard = f"NNUE_WEIGHTS_8X8_HPP"

    with open(output_path, 'w') as f:
        f.write(f"// Auto-generated NNUE weights — 8x8 Connect 4\n")
        f.write(f"// Architecture: {INPUT} -> {hidden1} -> {hidden2} -> 1\n")
        f.write(f"// Source model: {model_path}\n")
        f.write(f"// QA={QA}, SCALE={SCALE}\n\n")
        f.write(f"#ifndef {guard}\n#define {guard}\n\n")
        f.write(f"#include <cstdint>\n\n")
        f.write(f"namespace GameSolver {{\nnamespace Connect4 {{\nnamespace NNUE_8x8 {{\n\n")

        f.write(f"struct Weights {{\n")
        f.write(f"  static constexpr int32_t H1 = {hidden1};\n")
        f.write(f"  static constexpr int32_t H2 = {hidden2};\n")
        f.write(f"  static constexpr int32_t QA = {QA};\n\n")

        # W1: [INPUT][H1]
        f.write(f"  static constexpr int32_t W1[{INPUT}][{hidden1}] = {{\n")
        for i in range(INPUT):
            f.write("    {" + ", ".join(map(str, W1_T[i])) + "},\n")
        f.write("  };\n\n")

        # B1: [H1]
        f.write(f"  static constexpr int32_t B1[{hidden1}] = {{")
        f.write(", ".join(map(str, B1_int)))
        f.write("};\n\n")

        # W2: [H1][H2]
        f.write(f"  static constexpr int32_t W2[{hidden1}][{hidden2}] = {{\n")
        for i in range(hidden1):
            f.write("    {" + ", ".join(map(str, W2_T[i])) + "},\n")
        f.write("  };\n\n")

        # B2: [H2]
        f.write(f"  static constexpr int32_t B2[{hidden2}] = {{")
        f.write(", ".join(map(str, B2_int)))
        f.write("};\n\n")

        # W3: [H2]
        f.write(f"  static constexpr int32_t W3[{hidden2}] = {{")
        f.write(", ".join(map(str, W3_int)))
        f.write("};\n\n")

        # B3
        f.write(f"  static constexpr int32_t B3 = {B3_int};\n")

        f.write(f"}};\n\n")  # close Weights struct
        f.write("}\n}\n}\n\n")  # close namespaces
        f.write(f"#endif // {guard}\n")

    print(f"Exported {hidden1}x{hidden2} weights -> {output_path}")
    print(f"  W1: {INPUT}x{hidden1} ({INPUT*hidden1*4//1024} KB)")
    print(f"  W2: {hidden1}x{hidden2} ({hidden1*hidden2*4//1024} KB)")
    print(f"  Total weight size: ~{(INPUT*hidden1 + hidden1 + hidden1*hidden2 + hidden2 + hidden2 + 1)*4//1024} KB")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model",   required=True, help="Path to .pt model file")
    parser.add_argument("--hidden1", type=int, default=256, help="Hidden layer 1 size")
    parser.add_argument("--hidden2", type=int, default=32,  help="Hidden layer 2 size")
    parser.add_argument("--output",  default="../native/nnue_weights_8x8.hpp")
    args = parser.parse_args()
    export(args.model, args.output, args.hidden1, args.hidden2)
