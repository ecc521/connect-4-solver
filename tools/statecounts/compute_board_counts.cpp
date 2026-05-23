#include <iostream>
#include <vector>
#include <algorithm>
#include <thread>
#include <mutex>
#include <atomic>
#include <chrono>
#include <iomanip>
#include <cmath>
#include <string>
#include <sstream>
#include <fstream>
#include <cstdio>
#include <filesystem>
#include "Position.hpp"

using namespace GameSolver::Connect4;

// 256 buckets for partitioning the state space
const int NUM_BUCKETS = 256;

// Mix the bits of a key to get a uniform distribution across buckets
template <typename T>
inline int get_bucket(T key) {
    uint64_t k = (uint64_t)key;
    k ^= k >> 33;
    k *= 0xff51afd7ed558ccdULL;
    k ^= k >> 33;
    k *= 0xc4ceb9fe1a85ec53ULL;
    k ^= k >> 33;
    return k & 0xFF; // 8 bits -> 256 buckets
}

// Convert __int128 to decimal string for printing
std::string to_string(unsigned __int128 value) {
    if (value == 0) return "0";
    std::string s = "";
    while (value > 0) {
        s += (char)('0' + (value % 10));
        value /= 10;
    }
    std::reverse(s.begin(), s.end());
    return s;
}

// Format a number with commas
std::string format_num(unsigned __int128 val) {
    std::string s = to_string(val);
    std::string res = "";
    int n = s.length();
    for (int i = 0; i < n; i++) {
        res += s[i];
        if ((n - 1 - i) % 3 == 0 && i != n - 1) {
            res += ",";
        }
    }
    return res;
}

template <typename Func>
void parallel_for(size_t total, int num_threads, Func func) {
    std::vector<std::thread> threads;
    std::atomic<size_t> index{0};
    for (int t = 0; t < num_threads; ++t) {
        threads.emplace_back([&]() {
            for (;;) {
                size_t idx = index.fetch_add(1);
                if (idx >= total) break;
                func(idx);
            }
        });
    }
    for (auto& thread : threads) {
        if (thread.joinable()) thread.join();
    }
}

template <int W, int H>
inline bool has_won(typename GenericPosition<W, H>::position_t stones) {
    if (GenericPosition<W, H>::template haswond_const<1>(stones)) return true;
    if (GenericPosition<W, H>::template haswond_const<H + 1>(stones)) return true;
    if (GenericPosition<W, H>::template haswond_const<H>(stones)) return true;
    if (GenericPosition<W, H>::template haswond_const<H + 2>(stones)) return true;
    return false;
}

template <int W, int H>
void run_computation(int num_threads, bool disk_mode, const std::string& temp_dir) {
    using position_t = typename GenericPosition<W, H>::position_t;
    std::cout << "Starting computation for " << W << "x" << H << " board..." << std::endl;
    std::cout << "Threads: " << num_threads << ", Mode: " << (disk_mode ? "DISK" : "RAM") << std::endl;
    if (disk_mode) {
        std::cout << "Temp directory: " << temp_dir << std::endl;
    }

    auto start_time = std::chrono::high_resolution_clock::now();

    // Setup buckets
    // In RAM mode, we store vectors.
    std::vector<std::vector<position_t>> level_buckets(NUM_BUCKETS);
    
    // In Disk mode, we write level buckets to binary files.
    // For level 0, the empty board has key = 0.
    GenericPosition<W, H> empty_pos;
    position_t empty_key = empty_pos.key() + empty_pos.get_bottom_mask();
    int empty_bucket = get_bucket(empty_key);
    
    if (disk_mode) {
        std::filesystem::create_directories(temp_dir);
        // Clear old temp files if any
        for (auto& p : std::filesystem::directory_iterator(temp_dir)) {
            std::filesystem::remove(p);
        }
        
        // Write level 0 empty state
        std::ofstream out(temp_dir + "/level_0_bucket_" + std::to_string(empty_bucket) + ".bin", std::ios::binary);
        out.write(reinterpret_cast<const char*>(&empty_key), sizeof(position_t));
    } else {
        level_buckets[empty_bucket].push_back(empty_key);
    }

    unsigned __int128 total_legal_states = 0;

    // Loop through levels (up to W * H moves)
    for (int d = 0; d <= W * H; ++d) {
        auto level_start = std::chrono::high_resolution_clock::now();

        // 1. Count states at level d
        unsigned __int128 unique_reps_at_level = 0;
        unsigned __int128 total_states_at_level = 0;

        if (disk_mode) {
            for (int b = 0; b < NUM_BUCKETS; ++b) {
                std::string path = temp_dir + "/level_" + std::to_string(d) + "_bucket_" + std::to_string(b) + ".bin";
                if (std::filesystem::exists(path)) {
                    std::ifstream in(path, std::ios::binary | std::ios::ate);
                    size_t size = in.tellg();
                    size_t count = size / sizeof(position_t);
                    unique_reps_at_level += count;

                    in.seekg(0, std::ios::beg);
                    std::vector<position_t> temp(count);
                    in.read(reinterpret_cast<char*>(temp.data()), size);

                    for (const auto& key : temp) {
                        auto P = GenericPosition<W, H>::fromKey(key);
                        if (key == P.mirror_key(key)) {
                            total_states_at_level += 1;
                        } else {
                            total_states_at_level += 2;
                        }
                    }
                }
            }
        } else {
            for (int b = 0; b < NUM_BUCKETS; ++b) {
                unique_reps_at_level += level_buckets[b].size();
                for (const auto& key : level_buckets[b]) {
                    auto P = GenericPosition<W, H>::fromKey(key);
                    if (key == P.mirror_key(key)) {
                        total_states_at_level += 1;
                    } else {
                        total_states_at_level += 2;
                    }
                }
            }
        }

        if (total_states_at_level == 0 && d > 0) {
            std::cout << "No states at level " << d << ". Search finished." << std::endl;
            break;
        }

        total_legal_states += total_states_at_level;

        std::cout << "Level " << std::setw(2) << d << ": Unique reps = " 
                  << std::setw(15) << format_num(unique_reps_at_level) 
                  << ", Total states = " << std::setw(20) << format_num(total_states_at_level);

        // 2. Generate level d + 1
        if (d == W * H) break;

        // Writers for the next level
        std::vector<std::vector<position_t>> raw_next_buckets(NUM_BUCKETS);
        std::vector<std::mutex> bucket_mutexes(NUM_BUCKETS);
        
        std::vector<std::ofstream> disk_writers;
        if (disk_mode) {
            disk_writers.resize(NUM_BUCKETS);
            for (int b = 0; b < NUM_BUCKETS; ++b) {
                std::string path = temp_dir + "/raw_level_" + std::to_string(d + 1) + "_bucket_" + std::to_string(b) + ".bin";
                disk_writers[b].open(path, std::ios::binary | std::ios::app);
            }
        }

        // Thread local buffers for expansion
        struct ThreadLocalBuffer {
            std::vector<position_t> bufs[NUM_BUCKETS];
        };
        std::vector<ThreadLocalBuffer> thread_local_bufs(num_threads);

        const size_t FLUSH_LIMIT = 65536; // flush to global bucket when local buffer reaches this size

        // We process the NUM_BUCKETS of the current level in parallel
        parallel_for(NUM_BUCKETS, num_threads, [&](size_t b) {
            // Find current thread ID
            static thread_local int tid = -1;
            if (tid == -1) {
                // A safe way to get a unique thread index from 0 to num_threads - 1
                static std::atomic<int> next_tid{0};
                tid = next_tid.fetch_add(1) % num_threads;
            }

            std::vector<position_t> current_keys;
            if (disk_mode) {
                std::string path = temp_dir + "/level_" + std::to_string(d) + "_bucket_" + std::to_string(b) + ".bin";
                if (std::filesystem::exists(path)) {
                    std::ifstream in(path, std::ios::binary | std::ios::ate);
                    size_t size = in.tellg();
                    current_keys.resize(size / sizeof(position_t));
                    in.seekg(0, std::ios::beg);
                    in.read(reinterpret_cast<char*>(current_keys.data()), size);
                }
            } else {
                current_keys = level_buckets[b];
            }

            for (const auto& key : current_keys) {
                auto P = GenericPosition<W, H>::fromKey(key);
                
                // If game is already won by the player who just moved, it's terminal
                if (has_won<W, H>(P.getMask() ^ P.getCurrentPosition())) {
                    continue;
                }

                // Try placing a stone in each column
                for (int col = 0; col < W; ++col) {
                    if (P.canPlay(col)) {
                        auto P2 = P;
                        P2.playCol(col);
                        position_t k_forward = P2.key() + P2.get_bottom_mask();
                        position_t k_reverse = P2.mirror_key(k_forward);
                        position_t next_key = (k_forward < k_reverse) ? k_forward : k_reverse;
                        int next_b = get_bucket(next_key);

                        thread_local_bufs[tid].bufs[next_b].push_back(next_key);

                        if (thread_local_bufs[tid].bufs[next_b].size() >= FLUSH_LIMIT) {
                            std::lock_guard<std::mutex> lock(bucket_mutexes[next_b]);
                            if (disk_mode) {
                                disk_writers[next_b].write(reinterpret_cast<const char*>(thread_local_bufs[tid].bufs[next_b].data()), 
                                                          thread_local_bufs[tid].bufs[next_b].size() * sizeof(position_t));
                            } else {
                                raw_next_buckets[next_b].insert(raw_next_buckets[next_b].end(), 
                                                                thread_local_bufs[tid].bufs[next_b].begin(), 
                                                                thread_local_bufs[tid].bufs[next_b].end());
                            }
                            thread_local_bufs[tid].bufs[next_b].clear();
                        }
                    }
                }
            }
        });

        // Flush remaining thread local buffers
        for (int tid = 0; tid < num_threads; ++tid) {
            for (int b = 0; b < NUM_BUCKETS; ++b) {
                if (!thread_local_bufs[tid].bufs[b].empty()) {
                    if (disk_mode) {
                        disk_writers[b].write(reinterpret_cast<const char*>(thread_local_bufs[tid].bufs[b].data()), 
                                              thread_local_bufs[tid].bufs[b].size() * sizeof(position_t));
                    } else {
                        raw_next_buckets[b].insert(raw_next_buckets[b].end(), 
                                                    thread_local_bufs[tid].bufs[b].begin(), 
                                                    thread_local_bufs[tid].bufs[b].end());
                    }
                    thread_local_bufs[tid].bufs[b].clear();
                }
            }
        }

        // Close disk writers
        if (disk_mode) {
            for (int b = 0; b < NUM_BUCKETS; ++b) {
                disk_writers[b].close();
            }
        }

        // Clean up current level's bucket memory/files
        if (disk_mode) {
            for (int b = 0; b < NUM_BUCKETS; ++b) {
                std::string path = temp_dir + "/level_" + std::to_string(d) + "_bucket_" + std::to_string(b) + ".bin";
                if (std::filesystem::exists(path)) {
                    std::filesystem::remove(path);
                }
            }
        } else {
            for (int b = 0; b < NUM_BUCKETS; ++b) {
                level_buckets[b].clear();
                level_buckets[b].shrink_to_fit();
            }
        }

        // 3. Deduplicate level d + 1
        parallel_for(NUM_BUCKETS, num_threads, [&](size_t b) {
            std::vector<position_t> vec;
            if (disk_mode) {
                std::string path = temp_dir + "/raw_level_" + std::to_string(d + 1) + "_bucket_" + std::to_string(b) + ".bin";
                if (std::filesystem::exists(path)) {
                    std::ifstream in(path, std::ios::binary | std::ios::ate);
                    size_t size = in.tellg();
                    vec.resize(size / sizeof(position_t));
                    in.seekg(0, std::ios::beg);
                    in.read(reinterpret_cast<char*>(vec.data()), size);
                    in.close();
                    std::filesystem::remove(path);
                }
            } else {
                vec = std::move(raw_next_buckets[b]);
            }

            if (!vec.empty()) {
                std::sort(vec.begin(), vec.end());
                vec.erase(std::unique(vec.begin(), vec.end()), vec.end());
                
                if (disk_mode) {
                    std::string out_path = temp_dir + "/level_" + std::to_string(d + 1) + "_bucket_" + std::to_string(b) + ".bin";
                    std::ofstream out(out_path, std::ios::binary);
                    out.write(reinterpret_cast<const char*>(vec.data()), vec.size() * sizeof(position_t));
                } else {
                    level_buckets[b] = std::move(vec);
                }
            }
        });

        auto level_end = std::chrono::high_resolution_clock::now();
        double level_time = std::chrono::duration<double>(level_end - level_start).count();
        std::cout << " (" << std::fixed << std::setprecision(2) << level_time << "s)" << std::endl;
    }

    // Cleanup temp dir if disk mode
    if (disk_mode) {
        std::filesystem::remove_all(temp_dir);
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    double total_time = std::chrono::duration<double>(end_time - start_time).count();
    
    std::cout << "\n=============================================" << std::endl;
    std::cout << "Total Legal Positions: " << format_num(total_legal_states) << std::endl;
    std::cout << "Total Time: " << std::fixed << std::setprecision(2) << total_time << " seconds" << std::endl;
    std::cout << "=============================================\n" << std::endl;
}

int main(int argc, char** argv) {
    int w = 6;
    int h = 6;
    int threads = std::thread::hardware_concurrency();
    bool disk = false;
    std::string temp = "./temp_buckets";

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "-w" && i + 1 < argc) {
            w = std::stoi(argv[++i]);
        } else if (arg == "-h" && i + 1 < argc) {
            h = std::stoi(argv[++i]);
        } else if (arg == "--threads" && i + 1 < argc) {
            threads = std::stoi(argv[++i]);
        } else if (arg == "--disk") {
            disk = true;
        } else if (arg == "--temp" && i + 1 < argc) {
            temp = argv[++i];
        }
    }

    // Compile-time optimized dispatching
    #define DISPATCH(W_CONST, H_CONST) \
        if (w == W_CONST && h == H_CONST) { \
            run_computation<W_CONST, H_CONST>(threads, disk, temp); \
            return 0; \
        }

    DISPATCH(1, 1);
    DISPATCH(1, 2);
    DISPATCH(2, 1);
    DISPATCH(1, 3);
    DISPATCH(3, 1);
    DISPATCH(2, 2);
    DISPATCH(3, 2);
    DISPATCH(2, 3);
    DISPATCH(4, 2);
    DISPATCH(2, 4);
    DISPATCH(5, 2);
    DISPATCH(2, 5);
    DISPATCH(6, 2);
    DISPATCH(2, 6);
    DISPATCH(3, 3);
    DISPATCH(4, 3);
    DISPATCH(3, 4);
    DISPATCH(5, 3);
    DISPATCH(3, 5);
    DISPATCH(6, 3);
    DISPATCH(3, 6);
    DISPATCH(4, 4);
    DISPATCH(5, 4);
    DISPATCH(4, 5);
    DISPATCH(6, 4);
    DISPATCH(4, 6);
    DISPATCH(5, 5);
    DISPATCH(6, 5);
    DISPATCH(5, 6);
    DISPATCH(6, 6);
    DISPATCH(7, 6);
    DISPATCH(8, 6);
    DISPATCH(8, 8);

    std::cerr << "Board size " << w << "x" << h << " is not pre-compiled in template list." << std::endl;
    std::cerr << "Please add DISPATCH(" << w << ", " << h << ") to tools/compute_board_counts.cpp to support it." << std::endl;
    return 1;
}
