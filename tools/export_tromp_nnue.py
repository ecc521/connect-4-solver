import sys
import struct

def main():
    infile = "tools/fhourstones88/book88"
    outfile = "data/tromp_8x8_dataset.csv"
    
    # Tromp's score enum mapping
    # UNKNOWN=0, LOSS=1, DRAWLOSS=2, DRAW=3, DRAWWIN=4, WIN=5, LOSSWIN=6
    SCORE_LABELS = {
        1: "LOSS",
        2: "DRAWLOSS", # Upper bound: Score <= DRAW
        3: "DRAW",
        4: "DRAWWIN",  # Lower bound: Score >= DRAW
        5: "WIN"
    }
    
    entries = 0
    bounds = 0
    exact = 0
    
    with open(infile, "rb") as f_in, open(outfile, "w") as f_out:
        f_out.write("bitboard_hash,score_type,score_val\n")
        
        while True:
            chunk = f_in.read(11)
            if not chunk or len(chunk) < 11:
                break
            
            # Read 9 bytes for bb, pad to 16
            bb_bytes = chunk[:9] + b'\x00' * 7
            bb = struct.unpack("<Q", bb_bytes[:8])[0]
            bb_high = chunk[8]
            bb |= (bb_high << 64)
            
            rslt = struct.unpack("<H", chunk[9:11])[0]
            sc = rslt & 7
            
            label = SCORE_LABELS.get(sc, "UNKNOWN")
            
            if sc in [1, 3, 5]:
                exact += 1
            elif sc in [2, 4]:
                bounds += 1
                
            entries += 1
            f_out.write(f"{bb},{label},{sc}\n")
            
    print(f"Exported {entries} total entries to {outfile}")
    print(f"  - Exact Scores: {exact}")
    print(f"  - Bounds (Pruned Branches): {bounds}")

if __name__ == "__main__":
    main()
