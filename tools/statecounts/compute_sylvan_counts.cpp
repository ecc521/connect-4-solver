#include <iostream>
#include <vector>
#include <string>
#include <chrono>
#include <algorithm>
#include <cstdlib>
#include <getopt.h>
#include <sylvan.h>
#include <sylvan_obj.hpp>

using namespace sylvan;

int W = 6;
int H = 6;
bool row_major = false;
int ram_gb = -1;
int partition_mode = 0;


VOID_TASK_0(solve_connect4) {
    auto start_time = std::chrono::high_resolution_clock::now();

    int nvars = 2 * W * H;
    std::cout << "Number of BDD variables: " << nvars << "\n";

    std::vector<std::vector<Bdd>> p(W, std::vector<Bdd>(H));
    std::vector<std::vector<Bdd>> q(W, std::vector<Bdd>(H));

    for (int c = 0; c < W; ++c) {
        for (int r = 0; r < H; ++r) {
            if (row_major) {
                p[c][r] = Bdd::bddVar(2 * (r * W + c));
                q[c][r] = Bdd::bddVar(2 * (r * W + c) + 1);
            } else {
                p[c][r] = Bdd::bddVar(2 * (c * H + r));
                q[c][r] = Bdd::bddVar(2 * (c * H + r) + 1);
            }
        }
    }

    std::cout << "Building win condition BDDs...\n";
    Bdd W1 = Bdd::bddZero();
    Bdd W2 = Bdd::bddZero();

    for (int c = 0; c <= W - 4; ++c) {
        for (int r = 0; r < H; ++r) {
            W1 |= p[c][r] * p[c+1][r] * p[c+2][r] * p[c+3][r];
            W2 |= q[c][r] * q[c+1][r] * q[c+2][r] * q[c+3][r];
        }
    }
    for (int c = 0; c < W; ++c) {
        for (int r = 0; r <= H - 4; ++r) {
            W1 |= p[c][r] * p[c][r+1] * p[c][r+2] * p[c][r+3];
            W2 |= q[c][r] * q[c][r+1] * q[c][r+2] * q[c][r+3];
        }
    }
    for (int c = 0; c <= W - 4; ++c) {
        for (int r = 0; r <= H - 4; ++r) {
            W1 |= p[c][r] * p[c+1][r+1] * p[c+2][r+2] * p[c+3][r+3];
            W2 |= q[c][r] * q[c+1][r+1] * q[c+2][r+2] * q[c+3][r+3];
        }
        for (int r = 3; r < H; ++r) {
            W1 |= p[c][r] * p[c+1][r-1] * p[c+2][r-2] * p[c+3][r-3];
            W2 |= q[c][r] * q[c+1][r-1] * q[c+2][r-2] * q[c+3][r-3];
        }
    }

    std::vector<std::vector<Bdd>> Cond(W, std::vector<Bdd>(H));
    for (int c = 0; c < W; ++c) {
        for (int r = 0; r < H; ++r) {
            Bdd cond = (!p[c][r]) * (!q[c][r]);
            for (int k = 0; k < r; ++k) {
                cond *= (p[c][k] | q[c][k]);
            }
            Cond[c][r] = cond;
        }
    }

    Bdd S = Bdd::bddOne();
    for (int c = 0; c < W; ++c) {
        for (int r = 0; r < H; ++r) {
            S *= (!p[c][r]) * (!q[c][r]);
        }
    }

    Bdd filter_mask = Bdd::bddOne();
    if (partition_mode == 1) {
        filter_mask = !q[W/2][0];
        std::cout << "Partition 1: Filtering out states where P2 owns bottom of column " << W/2 << "\n";
    } else if (partition_mode == 2) {
        filter_mask = !p[W/2][0];
        std::cout << "Partition 2: Filtering out states where P1 owns bottom of column " << W/2 << "\n";
    } else if (partition_mode == 3) {
        filter_mask = (!p[W/2][0]) * (!q[W/2][0]);
        std::cout << "Partition 3: Filtering out states where anyone owns bottom of column " << W/2 << "\n";
    } else if (partition_mode >= 4 && partition_mode <= 12) {
        int A = W / 2;
        int B = W / 2 - 1;
        if (B < 0) {
            std::cerr << "Error: Board width too small for 9-way partition.\n";
            exit(1);
        }
        Bdd nA = !p[A][0]; // Exclude P1 from A
        Bdd mA = !q[A][0]; // Exclude P2 from A
        Bdd eA = (!p[A][0]) * (!q[A][0]); // Exclude both from A

        Bdd nB = !p[B][0]; // Exclude P1 from B
        Bdd mB = !q[B][0]; // Exclude P2 from B
        Bdd eB = (!p[B][0]) * (!q[B][0]); // Exclude both from B

        if (partition_mode == 4) {
            filter_mask = mA * mB;
            std::cout << "Partition 4 (Q_P2_P2): Exclude P2 from col " << A << ", Exclude P2 from col " << B << "\n";
        } else if (partition_mode == 5) {
            filter_mask = mA * nB;
            std::cout << "Partition 5 (Q_P2_P1): Exclude P2 from col " << A << ", Exclude P1 from col " << B << "\n";
        } else if (partition_mode == 6) {
            filter_mask = mA * eB;
            std::cout << "Partition 6 (Q_P2_both): Exclude P2 from col " << A << ", col " << B << " empty\n";
        } else if (partition_mode == 7) {
            filter_mask = nA * mB;
            std::cout << "Partition 7 (Q_P1_P2): Exclude P1 from col " << A << ", Exclude P2 from col " << B << "\n";
        } else if (partition_mode == 8) {
            filter_mask = nA * nB;
            std::cout << "Partition 8 (Q_P1_P1): Exclude P1 from col " << A << ", Exclude P1 from col " << B << "\n";
        } else if (partition_mode == 9) {
            filter_mask = nA * eB;
            std::cout << "Partition 9 (Q_P1_both): Exclude P1 from col " << A << ", col " << B << " empty\n";
        } else if (partition_mode == 10) {
            filter_mask = eA * mB;
            std::cout << "Partition 10 (Q_both_P2): col " << A << " empty, Exclude P2 from col " << B << "\n";
        } else if (partition_mode == 11) {
            filter_mask = eA * nB;
            std::cout << "Partition 11 (Q_both_P1): col " << A << " empty, Exclude P1 from col " << B << "\n";
        } else if (partition_mode == 12) {
            filter_mask = eA * eB;
            std::cout << "Partition 12 (Q_both_both): col " << A << " empty, col " << B << " empty\n";
        }
    }

    std::cout << "Starting BFS...\n";
    long long total_states = 0;


    for (int d = 0; d <= W * H; ++d) {
        auto lvl_start = std::chrono::high_resolution_clock::now();
        
        if (partition_mode > 0) {
            S = S * filter_mask;
        }

        long long current_states = (long long)S.SatCount(nvars);
        total_states += current_states;
        
        auto lvl_end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> diff = lvl_end - lvl_start;

        std::cout << "Level " << d << ": states = " << current_states 
                  << " (accumulated = " << total_states << "), nodes = " << S.NodeCount()
                  << ", time = " << diff.count() << "s" << std::endl;

        if (S.isZero()) break;
        if (d == W * H) break;

        Bdd S_filtered = (d % 2 == 0) ? (S * (!W2)) : (S * (!W1));
        S = Bdd::bddZero(); // Aggressively free previous level to enable GC
        if (S_filtered.isZero()) {
            continue;
        }

        std::vector<Bdd> col_bdds;
        for (int c = 0; c < W; ++c) {
            Bdd col_full = p[c][H-1] | q[c][H-1];
            Bdd valid_moves_in_col = S_filtered * (!col_full);
            if (valid_moves_in_col.isZero()) continue;

            Bdd temp_col = Bdd::bddZero();
            for (int r = 0; r < H; ++r) {
                Bdd v = (d % 2 == 0) ? p[c][r] : q[c][r];
                BddSet cube;
                cube.add(v.TopVar());
                Bdd temp = valid_moves_in_col.AndAbstract(Cond[c][r], cube);
                temp_col |= (temp * v);
            }
            col_bdds.push_back(temp_col);
        }

        Bdd S_next = Bdd::bddZero();
        if (!col_bdds.empty()) {
            while (col_bdds.size() > 1) {
                std::vector<Bdd> next_bdds;
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
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> total_diff = end_time - start_time;
    std::cout << "-------------------------------------------\n";
    std::cout << "Total legal Connect 4 positions: " << total_states << "\n";
    std::cout << "Total execution time: " << total_diff.count() << "s\n";
}

VOID_TASK_1(main_task, void*, arg) {
    if (ram_gb <= 0) {
        std::cerr << "Error: --ram <GB> is strictly required.\n";
        std::cerr << "Please specify the maximum physical RAM in gigabytes you want the engine to use (e.g., --ram 8).\n";
        exit(1);
    }

    // Calculate maximum Sylvan node tier (2^N) that safely fits within the requested RAM limit
    size_t target_bytes = (size_t)ram_gb * 1024ULL * 1024ULL * 1024ULL;
    int n = 24; // start at 2^24 nodes (384 MB)
    while (true) {
        size_t node_bytes = (1ULL << n) * 24ULL;
        size_t cache_bytes = (1ULL << (n - 4)) * 36ULL;
        if (node_bytes + cache_bytes > target_bytes) {
            n--;
            break;
        }
        n++;
    }

    if (n < 20) {
        std::cerr << "Error: --ram limit is too small. Please allocate at least 1 GB.\n";
        exit(1);
    }

    size_t final_node_bytes = (1ULL << n) * 24ULL;
    size_t final_cache_bytes = (1ULL << (n - 4)) * 36ULL;
    double final_gb = (double)(final_node_bytes + final_cache_bytes) / (1024.0 * 1024.0 * 1024.0);

    std::cout << "--- Memory Configuration ---\n";
    std::cout << "Requested Limit: " << ram_gb << " GB\n";
    std::cout << "Sylvan Nodes: 2^" << n << " nodes (~" << (final_node_bytes / (1024*1024)) << " MB)\n";
    std::cout << "Sylvan Cache: 2^" << (n-4) << " buckets (~" << (final_cache_bytes / (1024*1024)) << " MB)\n";
    std::cout << "Total Allocated: " << final_gb << " GB\n";
    std::cout << "----------------------------\n";

    sylvan_set_sizes(1ULL<<n, 1ULL<<n, 1ULL<<(n-4), 1ULL<<(n-4));
    sylvan_init_package();
    sylvan_init_bdd();

    CALL(solve_connect4);

    sylvan_stats_report(stdout);
    sylvan_quit();
    (void)arg;
}

int main(int argc, char **argv) {
    int opt;
    int threads = 0;
    static struct option long_options[] = {
        {"width", required_argument, 0, 'w'},
        {"height", required_argument, 0, 'h'},
        {"order", required_argument, 0, 'o'},
        {"threads", required_argument, 0, 't'},
        {"ram", required_argument, 0, 'r'},
        {"partition", required_argument, 0, 'p'},
        {0, 0, 0, 0}
    };

    while ((opt = getopt_long(argc, argv, "w:h:o:t:r:p:", long_options, nullptr)) != -1) {
        switch (opt) {
            case 'w': W = std::atoi(optarg); break;
            case 'h': H = std::atoi(optarg); break;
            case 'o': row_major = (std::string(optarg) == "row"); break;
            case 't': threads = std::atoi(optarg); break;
            case 'r': ram_gb = std::atoi(optarg); break;
            case 'p': partition_mode = std::atoi(optarg); break;
        }
    }

    lace_start(threads, 0); // 0 = auto-detect, otherwise specific threads
    RUN(main_task, nullptr);

    return 0;
}
