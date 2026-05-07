import numpy as np

dt = np.dtype([
    ('pos', np.uint64),
    ('opp', np.uint64),
    ('exact_wdl', np.int16),
    ('search_score', np.int16)
])

data = np.fromfile('data/dataset_8x8.bin', dtype=dt)

key = 18119952433676293

found = False
for i in range(len(data)):
    # Key is pos + opp + bottom
    pos = data['pos'][i]
    opp = data['opp'][i]
    mask = pos | opp
    bottom_mask = 0
    for col in range(8):
        bottom_mask |= (1 << (col * 9))
    
    k = pos + mask + bottom_mask
    if k == key:
        print(f"Found! exact_wdl: {data['exact_wdl'][i]}, search_score: {data['search_score'][i]}")
        found = True
        break

if not found:
    print("Not found.")
