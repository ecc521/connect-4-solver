import numpy as np

dt = np.dtype([
    ('pos', np.uint64),
    ('opp', np.uint64),
    ('exact_wdl', np.int16),
    ('search_score', np.int16)
])

data = np.fromfile('data/dataset_8x8.bin', dtype=dt).copy()

for i in range(len(data)):
    pos = data['pos'][i]
    opp = data['opp'][i]
    moves = bin(int(pos)).count('1') + bin(int(opp)).count('1')
    if moves % 2 != 0:
        data['exact_wdl'][i] = -data['exact_wdl'][i]

data.tofile('data/dataset_8x8.bin')
print("Successfully fixed exact_wdl polarity!")
