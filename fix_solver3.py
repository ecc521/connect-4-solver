import re

with open("native/Solver.cpp", "r") as f:
    lines = f.readlines()

inside_method = False

for i in range(len(lines)):
    line = lines[i]
    
    if "SolverImpl" in line and "::" in line and "{" in line:
        inside_method = True
        
    if "template" in line or "TypedCache" in line or "createCache" in line or "createWithCache" in line or "create" in line:
        if "::" in line and "{" in line:
            pass # might be entering a method, but not the ones we want
            
    # We only replace WIDTH/HEIGHT in negamax, solve_single, and analyze, except in their signatures.
    if inside_method and "SolverImpl" not in line and "GenericPosition<WIDTH, HEIGHT>" not in line and "OpeningBookBase<WIDTH, HEIGHT>" not in line and "GenericMoveSorter<WIDTH, HEIGHT>" not in line:
        line = re.sub(r'\bWIDTH \* HEIGHT\b', '(P.width() * P.height())', line)
        line = re.sub(r'\bWIDTH\b', 'P.width()', line)
        line = re.sub(r'\bHEIGHT\b', 'P.height()', line)
    
    lines[i] = line
    
    if line.startswith("}") and inside_method:
        inside_method = False

with open("native/Solver.cpp", "w") as f:
    f.writelines(lines)
