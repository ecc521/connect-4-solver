import os
import glob

files = glob.glob("../data/8x8_nnue_dataset_thread_*.csv") + glob.glob("../data/8x8_nnue_dataset_midgame_thread_*.csv")
print("Found files:", files)

with open("../data/8x8_nnue_dataset_combined.csv", "a") as out:
    for f in files:
        with open(f, "r") as infile:
            first = True
            for line in infile:
                if first:
                    first = False
                    continue
                out.write(line)
        os.remove(f)

print("Merged datasets!")
