#include <iostream>
#include <vector>
#include <string>
#include <chrono>
#include <algorithm>
#include <cstdlib>
#include <getopt.h>
#include "cuddObj.hh"

// Helper to count minterms and return as a decimal string
std::string get_count_str(Cudd &mgr, const BDD &f, int nvars) {
    int digits = 0;
    DdApaNumber apa_minterms = f.ApaCountMinterm(nvars, &digits);
    if (!apa_minterms) {
        return "0";
    }
    std::string s = mgr.ApaStringDecimal(digits, apa_minterms);
    free(apa_minterms);
    return s;
}

// Simple arbitrary-precision addition for decimal strings
std::string add_decimal_strings(const std::string &a, const std::string &b) {
    std::string res = "";
    int i = a.size() - 1;
    int j = b.size() - 1;
    int carry = 0;
    while (i >= 0 || j >= 0 || carry) {
        int sum = carry;
        if (i >= 0) sum += a[i--] - '0';
        if (j >= 0) sum += b[j--] - '0';
        res += std::to_string(sum % 10);
        carry = sum / 10;
    }
    std::reverse(res.begin(), res.end());
    return res;
}

int main(int argc, char **argv) {
    int W = 6;
    int H = 6;
    bool enable_reordering = false;
    bool verbose = false;

    bool row_major = false;

    int opt;
    static struct option long_options[] = {
        {"width", required_argument, 0, 'w'},
        {"height", required_argument, 0, 'h'},
        {"reorder", no_argument, 0, 'r'},
        {"verbose", no_argument, 0, 'v'},
        {"order", required_argument, 0, 'o'},
        {0, 0, 0, 0}
    };

    while ((opt = getopt_long(argc, argv, "w:h:rvo:", long_options, nullptr)) != -1) {
        switch (opt) {
            case 'w':
                W = std::atoi(optarg);
                break;
            case 'h':
                H = std::atoi(optarg);
                break;
            case 'r':
                enable_reordering = true;
                break;
            case 'v':
                verbose = true;
                break;
            case 'o':
                row_major = (std::string(optarg) == "row");
                break;
            default:
                std::cerr << "Usage: " << argv[0] << " [-w width] [-h height] [-r] [-v] [-o row|col]\n";
                return 1;
        }
    }

    std::cout << "Configuring BDD Solver for Connect 4 board size: " << W << "x" << H << "\n";
    
    int nvars = 2 * W * H;
    std::cout << "Number of BDD variables: " << nvars << "\n";

    // Initialize CUDD manager with 2*W*H variables
    Cudd mgr(nvars);

    if (enable_reordering) {
        std::cout << "Enabling automatic dynamic variable reordering (SIFT)\n";
        mgr.AutodynEnable(CUDD_REORDER_SIFT);
    } else {
        std::cout << "Automatic dynamic variable reordering disabled. Manual memory-bound reordering enabled.\n";
    }

    auto start_time = std::chrono::high_resolution_clock::now();

    // 1. Create variables
    // p[c][r] is Player 1 occupied at (c, r)
    // q[c][r] is Player 2 occupied at (c, r)
    // Ordered column-major interleaved:
    // column 0 bottom-to-top, column 1 bottom-to-top, etc.
    std::vector<std::vector<BDD>> p(W, std::vector<BDD>(H));
    std::vector<std::vector<BDD>> q(W, std::vector<BDD>(H));
    for (int c = 0; c < W; ++c) {
        for (int r = 0; r < H; ++r) {
            if (row_major) {
                p[c][r] = mgr.bddVar(2 * (r * W + c));
                q[c][r] = mgr.bddVar(2 * (r * W + c) + 1);
            } else {
                p[c][r] = mgr.bddVar(2 * (c * H + r));
                q[c][r] = mgr.bddVar(2 * (c * H + r) + 1);
            }
        }
    }

    // 2. Build win condition BDDs (W1 for Player 1, W2 for Player 2)
    std::cout << "Building win condition BDDs...\n";
    BDD W1 = mgr.bddZero();
    BDD W2 = mgr.bddZero();

    // Horizontal wins (4-in-a-row horizontally)
    for (int c = 0; c <= W - 4; ++c) {
        for (int r = 0; r < H; ++r) {
            W1 |= p[c][r] & p[c+1][r] & p[c+2][r] & p[c+3][r];
            W2 |= q[c][r] & q[c+1][r] & q[c+2][r] & q[c+3][r];
        }
    }

    // Vertical wins (4-in-a-row vertically)
    for (int c = 0; c < W; ++c) {
        for (int r = 0; r <= H - 4; ++r) {
            W1 |= p[c][r] & p[c][r+1] & p[c][r+2] & p[c][r+3];
            W2 |= q[c][r] & q[c][r+1] & q[c][r+2] & q[c][r+3];
        }
    }

    // Diagonal Up-Right wins
    for (int c = 0; c <= W - 4; ++c) {
        for (int r = 0; r <= H - 4; ++r) {
            W1 |= p[c][r] & p[c+1][r+1] & p[c+2][r+2] & p[c+3][r+3];
            W2 |= q[c][r] & q[c+1][r+1] & q[c+2][r+2] & q[c+3][r+3];
        }
    }

    // Diagonal Down-Right wins
    for (int c = 0; c <= W - 4; ++c) {
        for (int r = 3; r < H; ++r) {
            W1 |= p[c][r] & p[c+1][r-1] & p[c+2][r-2] & p[c+3][r-3];
            W2 |= q[c][r] & q[c+1][r-1] & q[c+2][r-2] & q[c+3][r-3];
        }
    }

    std::cout << "Win BDD built. W1 nodes: " << W1.nodeCount() << ", W2 nodes: " << W2.nodeCount() << "\n";

    // 3. Precompute column condition BDDs
    // Cond[c][r] = (lowest empty row in column c is r)
    // Cond[c][r] = !p[c][r] & !q[c][r] & \bigwedge_{k<r} (p[c][k] | q[c][k])
    std::cout << "Precomputing column occupancy conditions...\n";
    std::vector<std::vector<BDD>> Cond(W, std::vector<BDD>(H));
    for (int c = 0; c < W; ++c) {
        for (int r = 0; r < H; ++r) {
            BDD cond = !p[c][r] & !q[c][r];
            for (int k = 0; k < r; ++k) {
                cond &= (p[c][k] | q[c][k]);
            }
            Cond[c][r] = cond;
        }
    }

    // 4. Start BFS reachability
    // S is the set of states at depth d
    // S0 is the empty board
    BDD S = mgr.bddOne();
    for (int c = 0; c < W; ++c) {
        for (int r = 0; r < H; ++r) {
            S &= !p[c][r] & !q[c][r];
        }
    }

    std::cout << "Starting BFS...\n";
    std::string total_states = "0";

    for (int d = 0; d <= W * H; ++d) {
        auto lvl_start = std::chrono::high_resolution_clock::now();
        
        // Count states at level d
        std::string count_str = get_count_str(mgr, S, nvars);
        total_states = add_decimal_strings(total_states, count_str);
        
        auto lvl_end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> diff = lvl_end - lvl_start;

        std::cout << "Level " << d << ": states = " << count_str 
                  << " (accumulated = " << total_states << "), nodes = " << S.nodeCount()
                  << ", time = " << diff.count() << "s" << std::endl;

        if (S.IsZero()) {
            std::cout << "Reached empty state set at level " << d << ". BFS complete.\n";
            break;
        }

        if (d == W * H) {
            break;
        }

        // Filter out wins of the player who just moved to reach d:
        // - if d is even, player 2 just moved, so we filter out W2.
        // - if d is odd, player 1 just moved, so we filter out W1.
        BDD S_filtered;
        if (d % 2 == 0) {
            S_filtered = S & !W2;
        } else {
            S_filtered = S & !W1;
        }

        if (S_filtered.IsZero()) {
            S = mgr.bddZero();
            continue;
        }

        // Transition to d+1
        BDD S_next = mgr.bddZero();

        // The active player who will move at level d (to reach d+1):
        // - if d is even, player 1 is moving (we set p[c][r] = 1)
        // - if d is odd, player 2 is moving (we set q[c][r] = 1)
        std::vector<BDD> col_bdds;
        for (int c = 0; c < W; ++c) {
            // Early Column Pruning: check if this column is already full for all states in S_filtered
            BDD col_full = p[c][H-1] | q[c][H-1]; // top cell is occupied
            BDD valid_moves_in_col = S_filtered & !col_full;
            if (valid_moves_in_col.IsZero()) {
                continue; // Prune: nobody can play in this column
            }

            BDD temp_col = mgr.bddZero();
            for (int r = 0; r < H; ++r) {
                BDD v = (d % 2 == 0) ? p[c][r] : q[c][r];
                // Relational product: \exists v . (valid_moves_in_col \wedge Cond[c][r])
                BDD temp = valid_moves_in_col.AndAbstract(Cond[c][r], v);
                // Conjoin v to set it to 1
                BDD next_state_c_r = temp & v;
                temp_col |= next_state_c_r;
            }
            col_bdds.push_back(temp_col);
        }


        if (!col_bdds.empty()) {
            // Binary tree reduction for the ORs to prevent linear BDD growth
            while (col_bdds.size() > 1) {
                std::vector<BDD> next_bdds;
                for (size_t i = 0; i < col_bdds.size(); i += 2) {
                    if (i + 1 < col_bdds.size()) {
                        next_bdds.push_back(col_bdds[i] | col_bdds[i+1]);
                    } else {
                        next_bdds.push_back(col_bdds[i]);
                    }
                }
                col_bdds = next_bdds;
            }
            S_next = col_bdds[0];
        }

        S = S_next;

        // Manual memory-bound reordering
        if (!enable_reordering) {
            double mem_mb = mgr.ReadMemoryInUse() / (1024.0 * 1024.0);
            if (mem_mb > 4000.0) { // 4 GB limit
                std::cout << "Memory threshold exceeded (" << mem_mb << " MB). Triggering manual SIFT reordering...\n";
                mgr.ReduceHeap(CUDD_REORDER_SIFT);
                std::cout << "Reordering complete. New memory usage: " << mgr.ReadMemoryInUse() / (1024.0 * 1024.0) << " MB\n";
            }
        }
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> total_diff = end_time - start_time;
    std::cout << "-------------------------------------------\n";
    std::cout << "Total legal Connect 4 positions: " << total_states << "\n";
    std::cout << "Total execution time: " << total_diff.count() << "s\n";
    std::cout << "Peak BDD nodes: " << mgr.ReadPeakNodeCount() << "\n";
    std::cout << "Memory in use: " << mgr.ReadMemoryInUse() / (1024.0 * 1024.0) << " MB\n";

    return 0;
}
