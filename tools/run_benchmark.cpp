#include "../native/Solver.hpp"
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <sstream>
#include <chrono>

using namespace GameSolver::Connect4;

int main() {
    std::ifstream ifs("../test-data/Test_L3_R1");
    if(!ifs) return 1;
    
    std::string line;
    int matches = 0, mismatches = 0;
    auto solver = Solver::create(134217728);
    
    auto start = std::chrono::high_resolution_clock::now();
    
    while(std::getline(ifs, line) && matches + mismatches < 500) {
        std::stringstream ss(line);
        std::string moves;
        int expected_score;
        ss >> moves >> expected_score;
        
        Position P;
        for(char c : moves) {
            P.play(std::string(1, c));
        }
        
        solver->reset(); // clear cache so we test pure solving speed
        int native_score = solver->solve(P, false);
        if (native_score == expected_score) {
            matches++;
        } else {
            mismatches++;
        }
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration_ms = std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
    
    std::cout << "Benchmark Test_L3_R1 (500 items):\n";
    std::cout << "Matches: " << matches << "\n";
    std::cout << "Mismatches: " << mismatches << "\n";
    std::cout << "Total Time: " << duration_ms << " ms\n";
    std::cout << "Avg Time / pos: " << (double)duration_ms / 500.0 << " ms\n";
    return 0;
}
