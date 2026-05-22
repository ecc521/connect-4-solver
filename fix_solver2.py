import re

with open("native/Solver.cpp", "r") as f:
    code = f.read()

# Replace WIDTH * HEIGHT
code = code.replace("WIDTH * HEIGHT", "(P.width() * P.height())")

# Replace WIDTH in loops and initializations inside negamax, solve_single, analyze
code = code.replace("for (int i = 0; i < WIDTH; i++)", "for (int i = 0; i < P.width(); i++)")
code = code.replace("for(int i = WIDTH; i--;)", "for(int i = P.width(); i--;)")
code = code.replace("uint8_t table_move = WIDTH;", "uint8_t table_move = P.width();")
code = code.replace("table_move < WIDTH", "table_move < P.width()")
code = code.replace("stored_move < WIDTH", "stored_move < P.width()")
code = code.replace("WIDTH - 1 - table_move", "P.width() - 1 - table_move")
code = code.replace("WIDTH - 1 - stored_move", "P.width() - 1 - stored_move")
code = code.replace("uint8_t best_move = WIDTH;", "uint8_t best_move = P.width();")

# Fix analyze method array allocations
code = code.replace("std::vector<int> scores(WIDTH, -1000);", "std::vector<int> scores(P.width(), -1000);")
code = code.replace("std::atomic<bool> col_done[WIDTH];", "auto col_done = std::make_unique<std::atomic<bool>[]>(P.width());")
code = code.replace("std::atomic<bool> col_abort[WIDTH];", "auto col_abort = std::make_unique<std::atomic<bool>[]>(P.width());")
code = code.replace("GenericPosition<WIDTH, HEIGHT> col_positions[WIDTH];", "std::vector<GenericPosition<WIDTH, HEIGHT>> col_positions(P.width(), GenericPosition<WIDTH, HEIGHT>(P.width(), P.height()));")
code = code.replace("bool col_valid[WIDTH];", "std::vector<bool> col_valid(P.width());")
code = code.replace("unsigned int num_threads = std::min((unsigned int)WIDTH", "unsigned int num_threads = std::min((unsigned int)P.width()")
code = code.replace("int32_t local_history[WIDTH * (HEIGHT + 1)];", "std::vector<int32_t> local_history(P.width() * (P.height() + 1));")
code = code.replace("for (int j = 0; j < WIDTH * (HEIGHT + 1); j++)", "for (int j = 0; j < P.width() * (P.height() + 1); j++)")

# For the local_history array pass
code = code.replace("&col_abort[straggler_col], local_history)", "&col_abort[straggler_col], local_history.data())")

with open("native/Solver.cpp", "w") as f:
    f.write(code)
