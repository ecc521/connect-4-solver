#!/usr/bin/env python3
"""
Convert John Tromp's book88 (8×8 Connect-4 forward-search book) to our v2
bounded dense format (8x8_dense_bounded.book).

book88 format (no header, 11 bytes per record):
  bytes 0..8   Tromp key3 (uint64 little-endian, 9 bytes used, top byte = 0)
               key3 = position_bitmap + mask_bitmap + bottom_mask
               (arithmetic, NOT base-3; different from our key3)
  byte  9  b9  score byte:
               [1..65]   score from P2's fixed perspective: score = b9 - 33
               [193..253] bounded from P2's perspective: b9 > 225 → P2 wins,
                          b9 = 225 → P2 draws-or-wins (stored as DRAW),
                          b9 < 225 → P1 wins
               other     anomalous (< 0.01%), skipped
  byte  10 b10 best-move byte: col = (b10 >> 1) & 7, parity = b10 & 1
               (informational, not used for score)

IMPORTANT: Tromp's b9 encodes score from PLAYER 2's fixed perspective (not the
current player's perspective). The current player depends on n = popcount(mask):
  n even → P1 to move → must INVERT P2-perspective WIN/LOSS for current player
  n odd  → P2 to move → P2-perspective matches current player directly

Our v2 bounded dense format:
  18-byte header + sorted keys (5 bytes each) + values (2 bytes each, uint16 LE)
  value encoding (ABS_MIN = 32 for 8×8):
    bounded WIN:  low_byte = 34 (ABS_MIN+2), high_byte = 65 (2*ABS_MIN+1)
    exact DRAW:   low_byte = 33 (ABS_MIN+1), high_byte = 0
    bounded LOSS: low_byte = 1,              high_byte = 32 (ABS_MIN)
"""

import sys
import struct
import math

W = 8
H = 8
ABS_MIN = (W * H + 1) // 2  # = 32

# Our v2 bounded dense format constants
BOOK_MAGIC_0 = 0xC4
BOOK_MAGIC_1 = 0x42
BOOK_VERSION = 0x02
FLAG_STORAGE_DENSE = 0x00
FLAG_KIND_BOUNDED = 0x08

# Encoded value constants (ABS_MIN = 32)
# stored_byte = score + ABS_MIN + 1 = score + 33; hi_byte = 0 means exact
EXACT_DRAW_VAL   = ABS_MIN + 1                        # = 33  (exact score 0)
WIN_LO           = ABS_MIN + 2                        # = 34  (score +1)
WIN_HI           = 2 * ABS_MIN + 1                   # = 65  (score +32)
LOSS_LO          = 1                                  # (score -32)
LOSS_HI          = ABS_MIN                            # = 32  (score -1)

# b9=225 bounded: "P2 doesn't lose" → range depends on whose turn it is
# P1 to move (even n): P1's score ∈ [-32, 0]  →  lo=1, hi=33
# P2 to move (odd n):  P2's score ∈ [0, +32]  →  lo=33, hi=65
DRAW_OR_LOSS_VAL = LOSS_LO | (EXACT_DRAW_VAL << 8)   # 1|(33<<8) = 8449
DRAW_OR_WIN_VAL  = EXACT_DRAW_VAL | (WIN_HI << 8)    # 33|(65<<8) = 16673

def encode_value(b9: int, n: int):
    """
    Convert b9 byte to our uint16 value encoding.
    Returns None for anomalous b9 values that should be skipped.

    b9 encodes score from Player 2's FIXED perspective (empirically verified by
    comparing book88 entries against our exact 8×8 solver at n=12 and n=14):
      small [1..65]:   score_p2 = b9 - 33; positive → P2 wins, 0 → draw, negative → P1 wins
      large [193..253]: b9 > 225 → P2 wins; b9 == 225 → draw-or-win for P2 (stored as DRAW);
                        b9 < 225 → P1 wins

    n = popcount(mask) = number of moves already played.
      n even → P1 to move: P2-perspective WIN becomes current-player LOSS (and vice versa)
      n odd  → P2 to move: P2-perspective matches current player directly
    """
    if 1 <= b9 <= 65:
        score_p2 = b9 - 33
        if score_p2 > 0:
            p2_wins = True
        elif score_p2 == 0:
            return EXACT_DRAW_VAL             # exact draw; symmetric, no perspective flip
        else:
            p2_wins = False
    elif 193 <= b9 <= 253:
        if b9 > 225:
            p2_wins = True
        elif b9 == 225:
            # Bounded: "P2 doesn't lose" (P2's score >= 0).
            # Encode as a proper range so the solver can prune correctly:
            #   P1 to move (even n): current player's score in [-32, 0]
            #   P2 to move (odd n):  current player's score in [0, +32]
            return DRAW_OR_LOSS_VAL if n % 2 == 0 else DRAW_OR_WIN_VAL
        else:
            p2_wins = False
    else:
        return None  # anomalous, skip

    # Convert P2-perspective to current-player perspective (bounded WIN or LOSS)
    current_player_wins = (p2_wins and n % 2 == 1) or (not p2_wins and n % 2 == 0)
    if current_player_wins:
        return WIN_LO | (WIN_HI << 8)
    else:
        return LOSS_LO | (LOSS_HI << 8)

BOTTOM = sum(1 << (c * (H + 1)) for c in range(W))

def decode_tromp_key(key3_val: int) -> tuple[int, int]:
    """Reconstruct (position, mask) bitmaps from Tromp's key3."""
    pos_plus_mask = key3_val - BOTTOM
    position = 0
    mask = 0
    for c in range(W):
        shift = c * (H + 1)
        col_ppm = (pos_plus_mask >> shift) & ((1 << (H + 1)) - 1)
        for n in range(H + 1):
            col_mask_c = (1 << n) - 1
            col_pos_c = col_ppm - col_mask_c
            if 0 <= col_pos_c <= col_mask_c and (col_pos_c & ~col_mask_c) == 0:
                position |= col_pos_c << shift
                mask |= col_mask_c << shift
                break
    return position, mask

def partial_key3(key: int, col: int, position: int, mask: int) -> int:
    """Accumulate our base-3 key for one column (bottom to top)."""
    pos = 1 << (col * (H + 1))
    while pos & mask:
        key *= 3
        if pos & position:
            key += 1
        else:
            key += 2
        pos <<= 1
    key *= 3
    return key

def compute_our_key3(position: int, mask: int) -> int:
    """Compute our canonical key3 (min of forward/reverse base-3 scan)."""
    key_fwd = 0
    for col in range(W):
        key_fwd = partial_key3(key_fwd, col, position, mask)

    key_rev = 0
    for col in range(W - 1, -1, -1):
        key_rev = partial_key3(key_rev, col, position, mask)

    return min(key_fwd, key_rev) // 3

def main() -> None:
    src = "data/book88"
    dst = "data/8x8_dense_bounded.book"

    data = open(src, "rb").read()
    n_records = len(data) // 11
    print(f"Reading {n_records} records from {src}", flush=True)

    entries: dict[int, int] = {}  # our_key3 → uint16 value
    skipped = 0
    duplicates = 0

    for i in range(n_records):
        if i % 100000 == 0:
            print(f"  Processing record {i}/{n_records} ...", flush=True)

        b9      = data[i * 11 + 9]
        key3_val = int.from_bytes(data[i * 11 : i * 11 + 9], "little")
        position, mask = decode_tromp_key(key3_val)
        n_moves = bin(mask).count('1')  # popcount(mask) = moves played

        val = encode_value(b9, n_moves)
        if val is None:
            skipped += 1
            continue

        our_key3 = compute_our_key3(position, mask)

        if our_key3 in entries:
            duplicates += 1
        else:
            entries[our_key3] = val

    print(f"Skipped {skipped} anomalous records, {duplicates} duplicates")
    print(f"Entries to write: {len(entries)}", flush=True)

    sorted_keys = sorted(entries.keys())
    max_key = sorted_keys[-1]
    key_bytes = max(1, math.ceil(max_key.bit_length() / 8))
    value_bytes = 2  # bounded format always uses 2 bytes
    count = len(sorted_keys)

    print(f"Max key = {max_key} ({max_key.bit_length()} bits), key_bytes = {key_bytes}")

    # v2 header (18 bytes)
    flags = FLAG_STORAGE_DENSE | FLAG_KIND_BOUNDED
    depth = 15  # max depth covered
    align = 4   # Connect-4

    header = bytes([
        BOOK_MAGIC_0,      # 0
        BOOK_MAGIC_1,      # 1
        BOOK_VERSION,      # 2
        W,                 # 3
        H,                 # 4
        depth,             # 5
        flags,             # 6
        align,             # 7
        key_bytes,         # 8
        value_bytes,       # 9
    ]) + struct.pack("<Q", count)  # 10..17: uint64 LE count

    assert len(header) == 18

    print(f"Writing {dst} ...", flush=True)
    with open(dst, "wb") as f:
        f.write(header)

        # Keys section (sorted ascending, key_bytes each, little-endian)
        for k in sorted_keys:
            f.write(k.to_bytes(key_bytes, "little"))

        # Values section (uint16 LE, same order as keys)
        for k in sorted_keys:
            f.write(struct.pack("<H", entries[k]))

    import os
    size = os.path.getsize(dst)
    print(f"Done. File size: {size:,} bytes ({size/1024/1024:.1f} MB)")
    print(f"Expected: 18 + {count}×{key_bytes} + {count}×{value_bytes} = {18 + count*key_bytes + count*value_bytes:,}")


if __name__ == "__main__":
    main()
