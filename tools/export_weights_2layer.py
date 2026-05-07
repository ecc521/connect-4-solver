import torch
import torch.nn as nn
import os

WIDTH = 8
HEIGHT = 8

class ClippedReLU(nn.Module):
    def forward(self, x):
        return torch.clamp(x, 0.0, 1.0)

class NNUE(nn.Module):
    def __init__(self):
        super(NNUE, self).__init__()
        self.fc1 = nn.Linear(WIDTH * HEIGHT * 2, 256)
        self.relu1 = ClippedReLU()
        self.fc2 = nn.Linear(256, 32)
        self.relu2 = ClippedReLU()
        self.fc3 = nn.Linear(32, 1)

def export_to_cpp(model_path, output_path):
    model = NNUE()
    model.load_state_dict(torch.load(model_path, map_location='cpu'))
    model.eval()

    QA = 127
    # Training targets are normalized: model_output ≈ exact_score / MAX_SCORE (in [-1, +1])
    # C++ evaluate() returns: SCALE * model_output / QA
    # We want C++ output ≈ 100 * exact_score:
    #   SCALE * (exact_score/32) / 127 = 100 * exact_score
    #   SCALE = 100 * 32 * 127 = 406400
    # → C++ output range: [-3200, +3200] vs ±31000 forced-win sentinels
    SCALE = 406400

    w1 = model.fc1.weight.detach().numpy() # [256, 128]
    b1 = model.fc1.bias.detach().numpy()   # [256]
    w2 = model.fc2.weight.detach().numpy() # [32, 256]
    b2 = model.fc2.bias.detach().numpy()   # [32]
    w3 = model.fc3.weight.detach().numpy() # [1, 32]
    b3 = model.fc3.bias.detach().numpy()   # [1]

    w1_int = (w1 * QA).round().astype(int)
    b1_int = (b1 * QA).round().astype(int)
    
    w2_int = (w2 * QA).round().astype(int)
    b2_int = (b2 * QA).round().astype(int)
    
    w3_int = (w3 * SCALE / QA).round().astype(int)
    b3_int = (b3 * SCALE).round().astype(int)

    with open(output_path, "w") as f:
        f.write("// Auto-generated NNUE weights for 8x8 Connect 4\n")
        f.write("#ifndef NNUE_WEIGHTS_8X8_HPP\n")
        f.write("#define NNUE_WEIGHTS_8X8_HPP\n\n")
        f.write("#include <cstdint>\n\n")
        
        f.write("namespace GameSolver {\n")
        f.write("namespace Connect4 {\n")
        f.write("namespace NNUE_8x8 {\n")
        f.write("struct Weights {\n\n")

        f.write("static constexpr int32_t H1 = 256;\n")
        f.write("static constexpr int32_t H2 = 32;\n")
        f.write("static constexpr int32_t QA = 127;\n\n")

        # W1 transposed for memory locality [128, 256]
        f.write("static constexpr int32_t W1[128][256] = {\n")
        for i in range(128):
            f.write("    {")
            f.write(", ".join(map(str, w1_int[:, i])))
            f.write("},\n")
        f.write("};\n\n")

        f.write("static constexpr int32_t B1[256] = {")
        f.write(", ".join(map(str, b1_int)))
        f.write("};\n\n")

        # W2 transposed [256, 32]
        f.write("static constexpr int32_t W2[256][32] = {\n")
        for i in range(256):
            f.write("    {")
            f.write(", ".join(map(str, w2_int[:, i])))
            f.write("},\n")
        f.write("};\n\n")

        f.write("static constexpr int32_t B2[32] = {")
        f.write(", ".join(map(str, b2_int)))
        f.write("};\n\n")

        f.write("static constexpr int32_t W3[32] = {")
        f.write(", ".join(map(str, w3_int[0])))
        f.write("};\n\n")

        f.write(f"static constexpr int32_t B3 = {b3_int[0]};\n\n")

        f.write("};\n}\n}\n}\n")
        f.write("#endif\n")

    print(f"Successfully exported integer quantized weights to {output_path}")

if __name__ == "__main__":
    export_to_cpp("nnue_8x8_L2.pth", "native/nnue_weights_8x8.hpp")
