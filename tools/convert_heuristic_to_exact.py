"""
convert_heuristic_to_exact.py
Converts the old binary dataset (heuristic-scale scores ±31000+N)
to exact minimax scores in [-32, +32].

Conversion: exact = heuristic - 31000  if heuristic > 0
            exact = heuristic + 31000  if heuristic < 0
            exact = 0                  if heuristic == 0

Usage: python tools/convert_heuristic_to_exact.py <input.bin> <output.bin>
"""

import numpy as np
import sys

def convert(src, dst):
    dtype = np.dtype([
        ('pos',          np.uint64),
        ('opp',          np.uint64),
        ('search_score', np.int16),
        ('exact_wdl',    np.int16),
    ])

    data = np.fromfile(src, dtype=dtype)
    print(f"Loaded {len(data)} records from {src}")

    exact = data['exact_wdl'].astype(np.int32)

    # Convert heuristic → exact
    out_exact = np.where(exact > 0, exact - 31000,
                np.where(exact < 0, exact + 31000, 0)).astype(np.int16)

    # Validate range
    max_score = 32
    in_range = (out_exact >= -max_score) & (out_exact <= max_score)
    print(f"  Records in valid range [-{max_score}, +{max_score}]: {in_range.sum()} / {len(data)}")
    print(f"  Discarding {(~in_range).sum()} out-of-range records")

    data_out = data[in_range].copy()
    data_out['search_score'] = out_exact[in_range]
    data_out['exact_wdl']    = out_exact[in_range]

    # Write
    with open(dst, 'wb') as f:
        for r in data_out:
            f.write(r['pos'].tobytes())
            f.write(r['opp'].tobytes())
            f.write(r['search_score'].tobytes())
            f.write(r['exact_wdl'].tobytes())

    wins   = (data_out['exact_wdl'] > 0).sum()
    losses = (data_out['exact_wdl'] < 0).sum()
    draws  = (data_out['exact_wdl'] == 0).sum()
    print(f"  Wins={wins}  Losses={losses}  Draws={draws}")
    print(f"  Score range: [{data_out['exact_wdl'].min()}, {data_out['exact_wdl'].max()}]")
    print(f"Saved {len(data_out)} records to {dst}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_heuristic_to_exact.py <input.bin> <output.bin>")
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2])
