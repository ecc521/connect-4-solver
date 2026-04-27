import argparse
import subprocess
import os
import re
import time
import sys

def set_generator_bounds(width, height, depth, book_size):
    print(f"\n[+] Re-Compiling natively for {width}x{height} Depth {depth} (Book Size: 2^{book_size})...")
    os.system(f'make clean && make CXXFLAGS="--std=c++14 -W -Wall -O3 -march=native -DNDEBUG -pthread -I../native -DBOARD_WIDTH_MACRO={width} -DBOARD_HEIGHT_MACRO={height} -DBOOK_SIZE={book_size} -DBOOK_DEPTH={depth} -DEXACT_TABLE_SIZE={book_size}" generator c4solver pack_dense_book')

def process_stage(width, height, depth, book_size, cores, bootstrap_book=None):
    temp_book = f"../data/{width}x{height}_dense{depth}.book"
    if os.path.exists(temp_book):
        print(f"\n[+] Target cache {temp_book} already definitively exists! Bypassing Phase {depth} entirely.")
        return
        
    set_generator_bounds(width, height, depth, book_size)
    
    pos_file = f"pos{width}x{height}_d{depth}.txt"
    scored_file = f"scored{width}x{height}_d{depth}.txt"
    
    if not os.path.exists(pos_file):
        print(f"[!] Generating raw permutations {pos_file} natively...")
        os.system(f"./generator {depth} > {pos_file}")
        
    print(f"[+] Crunching Alpha-Beta evaluation natively across {cores} threads in shared memory...")
    
    total_bytes = os.path.getsize(pos_file)
    
    skip_lines = 0
    if os.path.exists(scored_file):
        skip_lines = sum(1 for _ in open(scored_file))
        if skip_lines > 0:
            print(f"    - Engine is seamlessly resuming from line {skip_lines:,} natively...")
            
    cmd = f"tail -n +{skip_lines + 1} {pos_file} | nice -n 20 ./c4solver --cores {cores}"
    if bootstrap_book:
        cmd += f" -b {bootstrap_book}"
    cmd += f" >> {scored_file}" 
    
    try:
        p = subprocess.Popen(cmd, shell=True)
        
        while p.poll() is None:
            current_bytes = os.path.getsize(scored_file) if os.path.exists(scored_file) else 0
            pct = min(99.9, (current_bytes / (total_bytes * 1.3)) * 100)
            
            sys.stdout.write(f"\r    -> Progress: ~{pct:.1f}% conservatively estimated... ")
            sys.stdout.flush()
            time.sleep(2)
            
        print("\n[+] Multithreaded execution successfully converged!")
        
    except KeyboardInterrupt:
        print(f"\n\n[!] KeyboardInterrupt detected! Terminating shared-memory worker threads to prevent RAM bleeding...")
        p.kill()
        os.system("pkill -9 c4solver")
        sys.exit(1)
        
    print(f"[+] Packing transitive sequence cache into dense .book natively ...")
    os.system(f"cat {scored_file} | ./pack_dense_book {depth}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Multi-core dense opening book generator")
    parser.add_argument("--width", type=int, required=True, help="Board width (e.g., 7)")
    parser.add_argument("--height", type=int, required=True, help="Board height (e.g., 6)")
    parser.add_argument("--depth", type=int, required=True, help="Max depth to evaluate (e.g., 14)")
    parser.add_argument("--book-size", type=int, required=True, help="Log2 of the hash table size (e.g., 23)")
    parser.add_argument("--cores", type=int, default=12, help="Number of concurrent solver threads to run (default: 12)")
    parser.add_argument("--bootstrap", type=str, default=None, help="Path to an existing .book to accelerate the solve")
    
    args = parser.parse_args()

    print("=========================================================")
    print(f" {args.width}x{args.height} {args.cores}-Core Iterative Alpha-Beta Orchestrator")
    print("=========================================================")
    
    process_stage(
        width=args.width, 
        height=args.height, 
        depth=args.depth, 
        book_size=args.book_size, 
        cores=args.cores, 
        bootstrap_book=args.bootstrap
    )
    
    print(f"\n[+] {args.width}x{args.height} Depth {args.depth} Execution successfully completed!")
