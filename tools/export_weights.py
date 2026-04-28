import torch
import torch.nn as nn

WIDTH = 7
HEIGHT = 6

class ClippedReLU(nn.Module):
    def forward(self, x):
        return torch.clamp(x, 0.0, 1.0)

class NNUE(nn.Module):
    def __init__(self):
        super(NNUE, self).__init__()
        self.fc1 = nn.Linear(WIDTH * HEIGHT * 2, 256)
        self.relu = ClippedReLU()
        self.fc2 = nn.Linear(256, 1)

def export_to_cpp(model_path, output_path):
    model = NNUE()
    model.load_state_dict(torch.load(model_path, map_location='cpu'))
    model.eval()

    # Quantization parameters
    QA = 127
    SCALE = 50000 # Score multiplier to match C++ heuristic ranges

    w1 = model.fc1.weight.detach().numpy() # [256, 128]
    b1 = model.fc1.bias.detach().numpy()   # [256]
    w2 = model.fc2.weight.detach().numpy() # [1, 256]
    b2 = model.fc2.bias.detach().numpy()   # [1]

    # Quantize
    w1_int = (w1 * QA).round().astype(int)
    b1_int = (b1 * QA).round().astype(int)
    
    w2_int = (w2 * SCALE / QA).round().astype(int)
    b2_int = (b2 * SCALE).round().astype(int)

    with open(output_path, "w") as f:
        f.write("// Auto-generated NNUE weights for 7x6 Connect 4\n")
        f.write("#ifndef NNUE_WEIGHTS_7X6_HPP\n")
        f.write("#define NNUE_WEIGHTS_7X6_HPP\n\n")
        f.write("#include <cstdint>\n\n")
        
        f.write("namespace GameSolver {\n")
        f.write("namespace Connect4 {\n")
        f.write("namespace NNUE_7x6 {\n\n")

        # Write W1
        f.write("constexpr int32_t FEATURE_WEIGHTS[84][256] = {\n")
        for i in range(84):
            f.write("    {")
            # transpose because w1 is [256, 84], we want [84, 256] for memory locality when updating a feature
            f.write(", ".join(map(str, w1_int[:, i])))
            f.write("},\n")
        f.write("};\n\n")

        # Write B1
        f.write("constexpr int32_t FEATURE_BIAS[256] = {")
        f.write(", ".join(map(str, b1_int)))
        f.write("};\n\n")

        # Write W2
        f.write("constexpr int32_t OUTPUT_WEIGHTS[256] = {")
        f.write(", ".join(map(str, w2_int[0])))
        f.write("};\n\n")

        # Write B2
        f.write(f"constexpr int32_t OUTPUT_BIAS = {b2_int[0]};\n\n")
        
        f.write("constexpr int32_t QA = 127;\n\n")

        f.write("}\n}\n}\n")
        f.write("#endif\n")

    print(f"Successfully exported integer quantized weights to {output_path}")

if __name__ == "__main__":
    export_to_cpp("../data/nnue_7x6.pt", "../native/nnue_weights_7x6.hpp")
