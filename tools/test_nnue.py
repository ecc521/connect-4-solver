import torch
import numpy as np
from train_nnue import NNUE, ClippedReLU

model = NNUE(8, 8, 2)
model.load_state_dict(torch.load("nnue_8x8.pth", map_location='cpu'))
model.eval()

# Let's test the first position from test-data/positions_8x8.txt
# 7663372 0
# 77556211211 31025

def print_eval(moves):
    # build board
    pass
