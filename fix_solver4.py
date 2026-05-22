import re

with open("native/Solver.cpp", "r") as f:
    code = f.read()

# Fix constexpr if that depends on P.height()
code = code.replace("if constexpr (P.height() % 2 == 0)", "if (P.height() % 2 == 0)")

# Fix GenericPosition<WIDTH, HEIGHT>:: references
code = code.replace("GenericPosition<WIDTH, HEIGHT>::COLUMN_ORDER[i]", "this->COLUMN_ORDER[i]")
code = code.replace("GenericPosition<WIDTH, HEIGHT>::MAX_SCORE", "P.max_score()")
code = code.replace("GenericPosition<WIDTH, HEIGHT>::MIN_SCORE", "P.min_score()")
code = code.replace("GenericPosition<WIDTH, HEIGHT>::column_mask(col)", "P.column_mask(col)")

# Fix any remaining ones like GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS
code = code.replace("GenericPosition<WIDTH, HEIGHT>::TROMP_WEIGHTS", "this->TROMP_WEIGHTS")

with open("native/Solver.cpp", "w") as f:
    f.write(code)
