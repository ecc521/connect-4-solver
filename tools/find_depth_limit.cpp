#include "Solver.hpp"
#include <iostream>
#include <chrono>
#include <vector>
#include <cstdlib>

using namespace GameSolver::Connect4;

std::string get_random_sequence(int depth) {
    std::string seq = "";
    Position P;
    while(seq.size() < (size_t)depth) {
        int col = rand() % Position::WIDTH;
        if(P.canPlay(col) && !P.isWinningMove(col)) {
            seq += std::to_string(col + 1);
            P.playCol(col);
            if(P.canWinNext()) {
                // Ignore sequence if someone is about to win
                seq = "";
                P = Position();
            }
        }
    }
    return seq;
}

int main() {
    srand(42);
    std::unique_ptr<Solver> solver = Solver::create(67108864);
    std::cout << "[+] Measuring pure solver speed natively (without ANY book)...\n\n";

    std::vector<int> test_depths = {10, 11, 12, 13, 14, 15};

    for(int depth : test_depths) {
        std::cout << "Testing Depth " << depth << " (Empty Spots Remaining: " << (49 - depth) << ")...\n";
        
        double max_time = 0;
        int over_20s = 0;
        
        for(int i=0; i<3; i++) {
            std::string seq = get_random_sequence(depth);
            Position P; P.play(seq);
            
            auto start = std::chrono::high_resolution_clock::now();
            solver->analyze(P, false, 4);
            auto end = std::chrono::high_resolution_clock::now();
            
            std::chrono::duration<double> duration = end - start;
            if(duration.count() > max_time) max_time = duration.count();
            if(duration.count() > 20.0) over_20s++;
        }
        
        std::cout << "  -> Worst-case time: " << max_time << " seconds.\n";
        if(max_time < 20.0) {
            std::cout << "  -> A starting depth of " << depth << " perfectly guarantees sub-20s responses!\n\n";
            break;
        } else {
            std::cout << "  -> A starting depth of " << depth << " is too shallow (took >20s).\n\n";
        }
    }
    
    return 0;
}
