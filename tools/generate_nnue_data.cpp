#include <iostream>
#include <fstream>
#include <vector>
#include <random>
#include <thread>
#include <mutex>
#include <atomic>
#include <string>
#include "Solver.hpp"
#include "Position.hpp"

using namespace GameSolver::Connect4;
using C4Solver = Solver<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>;
using C4OpeningBook = OpeningBookBase<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO>;

// Mutex for writing to the CSV output safely
std::mutex out_mutex;

// Function to generate a random position by playing `moves` random valid moves
Position generate_random_position(int moves, std::mt19937& rng) {
    Position P;
    std::uniform_int_distribution<int> dist(0, Position::WIDTH - 1);
    for (int i = 0; i < moves; ++i) {
        std::vector<int> valid_moves;
        for (int col = 0; col < Position::WIDTH; ++col) {
            if (P.canPlay(col) && !P.isWinningMove(col)) {
                valid_moves.push_back(col);
            }
        }
        if (valid_moves.empty()) break;
        int col = valid_moves[dist(rng) % valid_moves.size()];
        P.playCol(col);
    }
    return P;
}

// Function to dump definitive Win/Loss bounds from the Transposition Table
template <typename SlotType>
void dump_cache(const std::shared_ptr<TranspositionTable<SlotType, uint8_t, SolverImpl<BOARD_WIDTH_MACRO, BOARD_HEIGHT_MACRO, SlotType>::VALUE_BITS>>& transTable, std::ofstream& out) {
    size_t size = transTable->getSize();
    int exported = 0;

    // Direct memory access is required because `get()` requires the full key. 
    // We will cheat slightly by passing full keys into a modified get-like logic or 
    // just add a method to dump directly. Since we can't easily modify TranspositionTable 
    // without touching headers, we'll iterate and check bounds.
    
    // To extract positions: We can reconstruct keys from public sizes or modify the TranspositionTable
    // to provide a dedicated dump function. For now, extracting exact scores of ROOT positions ensures quality.
}

void worker_thread(int id, int num_positions, int depth, std::atomic<int>& progress) {
    auto cache = C4Solver::createCache(128 * 1024 * 1024); // 128MB cache per thread
    auto solver = C4Solver::createWithCache(cache.get());
    
    // Inject the depth-14 dense book to instantly return exact scores for early branches
    auto book = C4OpeningBook::load("../data/7x6_ef14.book", 7, 6);
    
    std::mt19937 rng(std::random_device{}() + id);

    std::string filename = "../data/7x6_nnue_dataset_thread_" + std::to_string(id) + ".csv";
    std::ofstream out(filename);

    for (int i = 0; i < num_positions; ++i) {
        // Generate positions from depth 0 up to 41 for 7x6 to train across all phases
        int d = rng() % 42;
        Position P = generate_random_position(d, rng);
        
        // Ensure no immediate win
        if (P.canWinNext()) continue;

        // Weak solve to quickly populate cache with exact bounds
        int score = solver->solve(P, true, 1, book.get()).score;

        out << P.key() << "," << score << "\n";

        int p = progress.fetch_add(1);
        if (p % 100 == 0) {
            std::cout << "\rProgress: " << p << " positions root-solved..." << std::flush;
        }
    }
}

int main(int argc, char** argv) {
    int total_positions = 50000;
    int depth = 40; // Deep enough so perfect solver finishes instantly
    int threads = 12;

    std::cout << "Starting Generation of " << total_positions << " positions at depth " << depth << " using " << threads << " threads.\n";

    std::atomic<int> progress{0};
    std::vector<std::thread> workers;

    int pos_per_thread = total_positions / threads;

    for (int i = 0; i < threads; ++i) {
        workers.emplace_back(worker_thread, i, pos_per_thread, depth, std::ref(progress));
    }

    for (auto& w : workers) {
        w.join();
    }

    std::cout << "\nMerging thread files...\n";
    std::ofstream final_out("../data/7x6_nnue_dataset_combined.csv");
    final_out << "key,score\n";
    
    for (int i = 0; i < threads; ++i) {
        std::string filename = "../data/7x6_nnue_dataset_thread_" + std::to_string(i) + ".csv";
        std::ifstream in(filename);
        std::string line;
        while (std::getline(in, line)) {
            final_out << line << "\n";
        }
        in.close();
        std::remove(filename.c_str()); // cleanup
    }

    std::cout << "Dataset successfully combined into ../data/7x6_nnue_dataset_combined.csv\n";
    return 0;
}
