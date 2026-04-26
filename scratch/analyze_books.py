import os
import struct

def next_prime(n):
    def is_prime(k):
        if k < 2: return False
        for i in range(2, int(k**0.5) + 1):
            if k % i == 0: return False
        return True
    while not is_prime(n):
        n += 1
    return n

data_dir = "/Users/tuckerwillenborg/Documents/GitHub/connect-4-solver/data"
files = sorted([f for f in os.listdir(data_dir) if f.endswith(".book") or f.endswith(".cbook")])

print(f"{'Filename':<25} | {'W':<2} | {'H':<2} | {'D':<2} | {'PK':<2} | {'VB':<2} | {'LS':<2} | {'Size':<10} | {'Pos Count':<10}")
print("-" * 100)

for filename in files:
    path = os.path.join(data_dir, filename)
    file_size = os.path.getsize(path)
    with open(path, "rb") as f:
        header = f.read(6)
        if len(header) < 6:
            print(f"{filename:<25} | Invalid header")
            continue
        
        w, h, d, pk, vb, ls = struct.unpack("bbbbbb", header)
        
        pos_count = 0
        if vb == 2: # Cuckoo
            pos_count = (file_size - 6) // 8 * 4
        else: # TranspositionTable
            size = next_prime(1 << ls)
            pos_count = size
            
        print(f"{filename:<25} | {w:<2} | {h:<2} | {d:<2} | {pk:<2} | {vb:<2} | {ls:<2} | {file_size:<10} | {pos_count:<10}")
