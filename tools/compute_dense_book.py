import argparse
import subprocess
import os
import re
import time
import sys

def set_generator_bounds(width, height, depth, book_size):
    print(f"\n[+] Re-Compiling natively for {width}x{height} Depth {depth} (Book Size: 2^{book_size})...")
    with open("generator.cpp", "r") as f:
        content = f.read()

    content = re.sub(r'static constexpr int BOOK_SIZE = \d+;', f'static constexpr int BOOK_SIZE = {book_size};', content)
    content = re.sub(r'static constexpr int DEPTH = \d+;', f'static constexpr int DEPTH = {depth};', content)
    
    with open("generator.cpp", "w") as f:
        f.write(content)
        
    os.system(f'make clean && make CXXFLAGS="--std=c++11 -W -Wall -O3 -march=native -DNDEBUG -DBOARD_WIDTH_MACRO={width} -DBOARD_HEIGHT_MACRO={height}" generator c4solver')

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
        
    all_chunks_exist = all(os.path.exists(f"chunk_{width}x{height}_d{depth}_{i}.txt") for i in range(cores))
    if not all_chunks_exist:
        print(f"[+] Fragmenting {pos_file} across {cores} physical cores...")
        files_out = [open(f"chunk_{width}x{height}_d{depth}_{i}.txt", "w") for i in range(cores)]
        with open(pos_file, "r") as f:
            for i, line in enumerate(f):
                files_out[i % cores].write(line)
        for f in files_out:
            f.close()
    else:
        print(f"[+] Active chunk fragments detected natively! Checking load balance...")
        remaining = []
        skip_list = []
        for i in range(cores):
            cf = f"chunk_{width}x{height}_d{depth}_{i}.txt"
            of = f"out_{width}x{height}_d{depth}_{i}.txt"
            skip = sum(1 for _ in open(of)) if os.path.exists(of) else 0
            skip_list.append(skip)
            tot = sum(1 for _ in open(cf)) if os.path.exists(cf) else 0
            remaining.append(tot - skip)
            
        if remaining and max(remaining) - min(remaining) > 5000:
            print("[!] Workload imbalance detected! Re-fragmenting remaining evaluations...")
            os.system(f"cat out_{width}x{height}_d{depth}_*.txt >> {scored_file} 2>/dev/null")
            unsolved = []
            for i in range(cores):
                if not os.path.exists(f"chunk_{width}x{height}_d{depth}_{i}.txt"): continue
                with open(f"chunk_{width}x{height}_d{depth}_{i}.txt", "r") as f:
                    for _ in range(skip_list[i]):
                        next(f, None)
                    unsolved.extend(f.readlines())
            files_out = [open(f"chunk_{width}x{height}_d{depth}_{i}.txt", "w") for i in range(cores)]
            for i, line in enumerate(unsolved):
                files_out[i % cores].write(line)
            for f in files_out:
                f.close()
            os.system(f"rm out_{width}x{height}_d{depth}_*.txt 2>/dev/null")
            print("[+] Successfully re-fragmented! Resuming with perfectly balanced load...")
        else:
            print("[+] Load balance is fine. Preparing array for resume...")
        
    print(f"[+] Crunching Alpha-Beta evaluation natively across {cores} cores...")
    procs = []
    
    total_bytes = os.path.getsize(pos_file)
    
    try:
        for i in range(cores):
            chunk_file = f"chunk_{width}x{height}_d{depth}_{i}.txt"
            out_file = f"out_{width}x{height}_d{depth}_{i}.txt"
            
            skip_lines = 0
            if os.path.exists(out_file):
                skip_lines = sum(1 for _ in open(out_file))
                if skip_lines > 0:
                    print(f"    - Core {i} is seamlessly resuming from line {skip_lines:,} natively...")
            
            cmd = f"tail -n +{skip_lines + 1} {chunk_file} | nice -n 20 ./c4solver"
            if bootstrap_book:
                cmd += f" -b {bootstrap_book}"
            cmd += f" >> {out_file}" 
            
            p = subprocess.Popen(cmd, shell=True)
            procs.append(p)
            
        while True:
            all_done = True
            for p in procs:
                if p.poll() is None:
                    all_done = False
                    break
            
            if all_done:
                break
                
            current_bytes = sum(os.path.getsize(f"out_{width}x{height}_d{depth}_{i}.txt") for i in range(cores) if os.path.exists(f"out_{width}x{height}_d{depth}_{i}.txt"))
            pct = min(99.9, (current_bytes / (total_bytes * 1.3)) * 100)
            
            sys.stdout.write(f"\r    -> Progress: ~{pct:.1f}% conservatively estimated... ")
            sys.stdout.flush()
            time.sleep(2)
            
        print("\n[+] All cores successfully converged processing!")
        
    except KeyboardInterrupt:
        print(f"\n\n[!] KeyboardInterrupt detected! Terminating all {cores} worker threads to prevent RAM bleeding...")
        for p in procs:
            p.kill()
        os.system("pkill -9 c4solver")
        sys.exit(1)
        
    print("[+] Merging parallel evaluation logs natively...")
    os.system(f"cat out_{width}x{height}_d{depth}_*.txt >> {scored_file}")
    
    print(f"[+] Packing transitive sequence cache into standard .book natively ...")
    os.system(f"cat {scored_file} | ./generator")
    os.system(f"mv {width}x{height}.book {temp_book}")
        
    print("[+] Cleaning local chunk fragmentation securely...\n")
    os.system(f"rm chunk_{width}x{height}_d{depth}_*.txt out_{width}x{height}_d{depth}_*.txt")


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
