#!/usr/bin/env python3
import argparse
import subprocess
import os
import re
import sys

def main():
    parser = argparse.ArgumentParser(description="Generic Connect-4 State Space Counter Orchestrator using Sylvan BDD")
    parser.add_argument("-w", "--width", type=int, required=True, help="Board width")
    parser.add_argument("-H", "--height", type=int, required=True, help="Board height")
    parser.add_argument("-r", "--ram", type=int, required=True, help="RAM limit in GB")
    parser.add_argument("-m", "--mode", choices=["none", "3-way", "9-way"], required=True, help="Partitioning mode")
    parser.add_argument("-t", "--threads", type=int, default=0, help="Number of Sylvan threads (0 = auto-detect)")
    parser.add_argument("-o", "--order", choices=["col", "row"], default="col", help="Variable ordering (col/row)")
    args = parser.parse_args()

    # Change directory to the script's directory (tools/statecounts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    # Compile the binary if it does not exist
    if not os.path.exists("./compute_sylvan_counts"):
        print("Compiling compute_sylvan_counts...")
        subprocess.check_call(["make", "compute_sylvan_counts"])

    # Define partition runs depending on mode
    if args.mode == "none":
        partitions = [0]
    elif args.mode == "3-way":
        partitions = [1, 2, 3]
    else:
        partitions = list(range(4, 13))

    results = {}
    
    print("=========================================================")
    print(f"Starting {args.width}x{args.height} State Space Count ({args.mode} mode)")
    print(f"RAM Limit: {args.ram} GB, Threads: {args.threads}, Order: {args.order}")
    print("=========================================================")

    for p in partitions:
        suffix = "single" if p == 0 else f"p{p}"
        log_name = f"{args.width}x{args.height}_{suffix}.log"
        
        # Build command
        cmd = ["./compute_sylvan_counts", "-w", str(args.width), "-h", str(args.height), "--ram", str(args.ram), "-o", args.order]
        if args.threads > 0:
            cmd += ["-t", str(args.threads)]
        if p > 0:
            cmd += ["-p", str(p)]
            
        print(f"\n[{partitions.index(p)+1}/{len(partitions)}] Running partition {p}...")
        print(f"Command: {' '.join(cmd)}")
        print(f"Logging to {log_name}...")
        
        with open(log_name, "w") as log_file:
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            
            for line in process.stdout:
                sys.stdout.write(line)
                sys.stdout.flush()
                log_file.write(line)
                log_file.flush()
                
            process.wait()
            if process.returncode != 0:
                print(f"\nError: Solver exited with code {process.returncode} on partition {p}.", file=sys.stderr)
                sys.exit(process.returncode)
                
        # Parse result
        with open(log_name, "r") as f:
            content = f.read()
            match = re.search(r'Total legal Connect 4 positions:\s*(\d+)', content)
            if match:
                results[p] = int(match.group(1))
            else:
                print(f"\nError: Could not find state count in {log_name}.", file=sys.stderr)
                sys.exit(1)

    print("\n=========================================================")
    print("All runs completed successfully!")
    print("=========================================================")
    
    if args.mode == "none":
        total = results[0]
        print(f"Total {args.width}x{args.height} States: {total}")
    elif args.mode == "3-way":
        total = results[1] + results[2] - results[3]
        print("Breakdown:")
        print(f"  P1 (Exclude P2 center): {results[1]}")
        print(f"  P2 (Exclude P1 center): {results[2]}")
        print(f"  P3 (Center empty):      {results[3]}")
        print(f"Total {args.width}x{args.height} States (P1 + P2 - P3): {total}")
    elif args.mode == "9-way":
        q = results
        total = q[4] + q[5] - q[6] + q[7] + q[8] - q[9] - q[10] - q[11] + q[12]
        print("Breakdown:")
        for i in range(4, 13):
            print(f"  Q{i}: {q[i]}")
        print(f"Total {args.width}x{args.height} States (Q4 + Q5 - Q6 + Q7 + Q8 - Q9 - Q10 - Q11 + Q12): {total}")

if __name__ == "__main__":
    main()
