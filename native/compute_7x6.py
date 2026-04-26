import subprocess
import os
import re
import time
import sys

CORES = 12

def set_generator_bounds(depth, book_size):
    print(f"\n[+] Re-Compiling natively for 7x6 Depth {depth} (Book Size: 2^{book_size})...")
    with open("generator.cpp", "r") as f:
        content = f.read()

    content = re.sub(r'static constexpr int BOOK_SIZE = \d+;', f'static constexpr int BOOK_SIZE = {book_size};', content)
    content = re.sub(r'static constexpr int DEPTH = \d+;', f'static constexpr int DEPTH = {depth};', content)
    
    with open("generator.cpp", "w") as f:
        f.write(content)
        
    os.system('make clean && make CXXFLAGS="--std=c++11 -W -Wall -O3 -march=native -DNDEBUG -DBOARD_WIDTH_MACRO=7 -DBOARD_HEIGHT_MACRO=6" generator c4solver')

def process_stage(depth, book_size, bootstrap_book=None):
    temp_book = f"../data/7x6_dense{depth}.book"
    if os.path.exists(temp_book):
        print(f"\n[+] Target cache {temp_book} already definitively exists! Bypassing Phase {depth} entirely.")
        return
        
    set_generator_bounds(depth, book_size)
    
    pos_file = f"pos7x6_d{depth}.txt"
    scored_file = f"scored7x6_d{depth}.txt"
    
    if not os.path.exists(pos_file):
        print(f"[!] Generating raw permutations {pos_file} natively...")
        os.system(f"./generator {depth} > {pos_file}")
        
    all_chunks_exist = all(os.path.exists(f"chunk_7x6_d{depth}_{i}.txt") for i in range(CORES))
    if not all_chunks_exist:
        print(f"[+] Fragmenting {pos_file} across {CORES} physical cores...")
        files_out = [open(f"chunk_7x6_d{depth}_{i}.txt", "w") for i in range(CORES)]
        with open(pos_file, "r") as f:
            for i, line in enumerate(f):
                files_out[i % CORES].write(line)
        for f in files_out:
            f.close()
    else:
        print(f"[+] Active chunk fragments detected natively! Checking load balance...")
        remaining = []
        skip_list = []
        for i in range(CORES):
            cf = f"chunk_7x6_d{depth}_{i}.txt"
            of = f"out_7x6_d{depth}_{i}.txt"
            skip = sum(1 for _ in open(of)) if os.path.exists(of) else 0
            skip_list.append(skip)
            tot = sum(1 for _ in open(cf)) if os.path.exists(cf) else 0
            remaining.append(tot - skip)
            
        if remaining and max(remaining) - min(remaining) > 5000:
            print("[!] Workload imbalance detected! Re-fragmenting remaining evaluations...")
            os.system(f"cat out_7x6_d{depth}_*.txt >> {scored_file} 2>/dev/null")
            unsolved = []
            for i in range(CORES):
                if not os.path.exists(f"chunk_7x6_d{depth}_{i}.txt"): continue
                with open(f"chunk_7x6_d{depth}_{i}.txt", "r") as f:
                    for _ in range(skip_list[i]):
                        next(f, None)
                    unsolved.extend(f.readlines())
            files_out = [open(f"chunk_7x6_d{depth}_{i}.txt", "w") for i in range(CORES)]
            for i, line in enumerate(unsolved):
                files_out[i % CORES].write(line)
            for f in files_out:
                f.close()
            os.system(f"rm out_7x6_d{depth}_*.txt 2>/dev/null")
            print("[+] Successfully re-fragmented! Resuming with perfectly balanced load...")
        else:
            print("[+] Load balance is fine. Preparing array for resume...")
        
    print(f"[+] Crunching Alpha-Beta evaluation natively across {CORES} cores...")
    procs = []
    
    total_bytes = os.path.getsize(pos_file)
    
    try:
        for i in range(CORES):
            chunk_file = f"chunk_7x6_d{depth}_{i}.txt"
            out_file = f"out_7x6_d{depth}_{i}.txt"
            
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
                
            current_bytes = sum(os.path.getsize(f"out_7x6_d{depth}_{i}.txt") for i in range(CORES) if os.path.exists(f"out_7x6_d{depth}_{i}.txt"))
            pct = min(99.9, (current_bytes / (total_bytes * 1.3)) * 100)
            
            sys.stdout.write(f"\r    -> Progress: ~{pct:.1f}% conservatively estimated... ")
            sys.stdout.flush()
            time.sleep(2)
            
        print("\n[+] All cores successfully converged processing!")
        
    except KeyboardInterrupt:
        print("\n\n[!] KeyboardInterrupt detected! Terminating all 12 worker threads to prevent RAM bleeding...")
        for p in procs:
            p.kill()
        os.system("pkill -9 c4solver")
        print("[!] Thread bounds eliminated natively. Restoring github repo normalization parameters...")
        set_generator_bounds(14, 23)
        os.system('make clean && make generator c4solver')
        sys.exit(1)
        
    print("[+] Merging parallel evaluation logs natively...")
    os.system(f"cat out_7x6_d{depth}_*.txt >> {scored_file}")
    
    print(f"[+] Packing transitive sequence cache into standard .book natively ...")
    os.system(f"cat {scored_file} | ./generator")
    os.system(f"mv 7x6.book {temp_book}")
        
    print("[+] Cleaning local chunk fragmentation securely...\n")
    os.system(f"rm chunk_7x6_d{depth}_*.txt out_7x6_d{depth}_*.txt")

if __name__ == "__main__":
    print("=========================================================")
    print(" 7x6 12-Core Iterative Alpha-Beta Orchestrator")
    print("=========================================================")
    
    confirm = input("[WARNING] Ensure the 7x7 compute script is absolutely finished or exited before continuing! Running concurrently will crash both environments. Type 'y' to continue safely: ")
    if confirm.lower() != 'y':
        sys.exit(0)
    
    # Phase 1: Depth 8 
    process_stage(depth=8, book_size=19, bootstrap_book=None)
    
    # Phase 2: Depth 12 
    process_stage(depth=12, book_size=22, bootstrap_book="../data/7x6_dense8.book")
    
    # Phase 3: Depth 16 
    process_stage(depth=16, book_size=25, bootstrap_book="../data/7x6_dense12.book")
    
    print("\n[+] 7x6 Depth 16 Execution successfully completed!")
    
    # Reset generator natively to standard 7x6 14 safely before exiting
    set_generator_bounds(14, 23)
    os.system('make clean && make generator c4solver')
