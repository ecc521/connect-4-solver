#include <iostream>
#include <chrono>
#include <vector>
#include <string>
#include <fstream>
#include "Solver.hpp"
#include "HeuristicSolver.hpp"

using namespace GameSolver::Connect4;
using namespace std::chrono;

void run_bench() {
    std::vector<std::string> test_positions;
    std::ifstream file("test-data/positions_7x6.txt");
    if (!file.is_open()) {
        std::cout << "Failed to open file!\n";
        test_positions = {"444452233", "454545", "4545454", "1234567"};
    } else {
        std::string line;
        int count = 0;
        while(std::getline(file, line) && count < 1000) {
            test_positions.push_back(line.substr(0, line.find(' ')));
            count++;
        }
    }

    std::cout << "Running benchmark on " << test_positions.size() << " positions..." << std::endl;

    // Heuristic Static 7x6
    {
        HeuristicSolver<7, 6> solver;
        uint64_t total_nodes = 0;
        auto start = high_resolution_clock::now();
        for(const auto& pos : test_positions) {
            GenericPosition<7, 6> P; P.play(pos);
            auto res = solver.analyze_heuristic(P, 8, 1, 0);
            total_nodes += solver.getNodeCount();
        }
        auto end = high_resolution_clock::now();
        std::cout << "Heuristic Static <7, 6>: " << duration_cast<milliseconds>(end - start).count() << " ms" << std::endl;
    }

    // Heuristic Dynamic -1x-1
    {
        HeuristicSolver<-1, -1> solver;
        uint64_t total_nodes = 0;
        auto start = high_resolution_clock::now();
        for(const auto& pos : test_positions) {
            GenericPosition<-1, -1> P(7, 6); P.play(pos);
            auto res = solver.analyze_heuristic(P, 8, 1, 0);
            total_nodes += solver.getNodeCount();
        }
        auto end = high_resolution_clock::now();
        std::cout << "Heuristic Dynamic <-1, -1>: " << duration_cast<milliseconds>(end - start).count() << " ms" << std::endl;
    }

    // Exact Static 7x6
    {
        SolverImpl<7, 6, uint64_t> solver((1ULL << 20) * 16ULL);
        uint64_t total_nodes = 0;
        int count = 0;
        auto start = high_resolution_clock::now();
        for(const auto& pos : test_positions) {
            GenericPosition<7, 6> P;
            int played = P.play(pos);
            auto res = solver.solve(P, false);
            if (count++ == 0) std::cout << "Static score: " << res.score << " played: " << played << " expected: " << pos.length() << "\n";
            total_nodes += solver.getNodeCount();
        }
        auto end = high_resolution_clock::now();
        std::cout << "Exact Static <7, 6>: " << duration_cast<milliseconds>(end - start).count() << " ms (Nodes: " << total_nodes << ")" << std::endl;
    }

    // Exact Dynamic -1x-1
    {
        SolverImpl<-1, -1, uint64_t> solver((1ULL << 20) * 16ULL, 7, 6);
        uint64_t total_nodes = 0;
        int count_dyn = 0;
        auto start = high_resolution_clock::now();
        for(const auto& pos : test_positions) {
            GenericPosition<-1, -1> P(7, 6);
            int played = P.play(pos);
            auto res = solver.solve(P, false);
            if (count_dyn < 3) {
                std::cout << "Dynamic pos " << count_dyn << " score: " << res.score << " expected: " << pos.length() << " nodes: " << res.nodes << "\n";
            }
            count_dyn++;
            total_nodes += res.nodes;
        }
        auto end = high_resolution_clock::now();
        std::cout << "Exact Dynamic <-1, -1>: " << duration_cast<milliseconds>(end - start).count() << " ms (Nodes: " << total_nodes << ")" << std::endl;
    }
}

int main() {
    run_bench();
    return 0;
}
