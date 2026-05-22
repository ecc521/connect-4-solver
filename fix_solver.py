import re

with open("native/Solver.cpp", "r") as f:
    lines = f.readlines()

for i in range(len(lines)):
    line = lines[i]
    if "template" in line or "GenericPosition" in line or "SolverImpl<" in line or "TypedCache" in line or "createCache" in line or "createWithCache" in line or "create" in line:
        continue
    
    # We are only replacing in logical expressions inside the methods.
    if "WIDTH * HEIGHT" in line:
        line = line.replace("WIDTH * HEIGHT", "(P.width() * P.height())")
    if "WIDTH" in line and "HEIGHT" not in line:
        # e.g., i < WIDTH, WIDTH - 1
        line = re.sub(r'\bWIDTH\b', 'P.width()', line)
    
    lines[i] = line

with open("native/Solver.cpp", "w") as f:
    f.writelines(lines)
