/*
 * This file is part of Connect4 Game Solver <http://connect4.gamesolver.org>
 * Copyright (C) 2017-2019 Pascal Pons <contact@gamesolver.org>
 *
 * Connect4 Game Solver is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Connect4 Game Solver is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Connect4 Game Solver. If not, see <http://www.gnu.org/licenses/>.
 */

#include "Solver.hpp"
#include <iostream>
#include <thread>
#include <mutex>
#include <vector>
#include <string>

using namespace GameSolver::Connect4;

/**
 * Main function.
 * Reads Connect 4 positions, line by line, from standard input
 * and writes one line per position to standard output containing:
 *  - score of the position
 *  - number of nodes explored
 *  - time spent in microsecond to solve the position.
 *
 *  Any invalid position (invalid sequence of move, or already won game)
 *  will generate an error message to standard error and an empty line to standard output.
 */
int main(int argc, char** argv) {
  std::unique_ptr<Solver> solver;
  bool weak = false;
  bool analyze = false;
  int cores = 1;
  uint64_t memory_bytes = 67108864; // 64MB default

  std::string opening_book = "";
  for(int i = 1; i < argc; i++) {
    if(argv[i][0] == '-') {
      if(argv[i][1] == 'w') weak = true; // parameter -w: use weak solver
      else if(argv[i][1] == 'b') { // paramater -b: define an alternative opening book
        if(++i < argc) opening_book = std::string(argv[i]);
      }
      else if(argv[i][1] == 'a') { // paramater -a: make an analysis of all possible moves
        analyze = true;
      }
      else if(std::string(argv[i]) == "--cores") {
        if(++i < argc) cores = std::stoi(argv[i]);
      }
      else if(std::string(argv[i]) == "--memory") {
        if(++i < argc) memory_bytes = std::stoull(argv[i]);
      }
    }
  }
  if (!solver) solver = Solver::create(memory_bytes);
  if (!opening_book.empty()) solver->loadBook(opening_book);

  if (cores > 1) {
    std::mutex io_mutex;
    
    auto worker = [&]() {
      while (true) {
        std::string current_line;
        {
          std::lock_guard<std::mutex> lock(io_mutex);
          if (!std::getline(std::cin, current_line)) {
            return;
          }
        }
        
        Position P;
        if(P.play(current_line) != current_line.size()) {
          std::lock_guard<std::mutex> lock(io_mutex);
          std::cerr << "Invalid move \"" << current_line << "\"" << std::endl;
        } else {
          std::string result = current_line;
          if(analyze) {
            std::vector<int> scores = solver->analyze(P, weak);
            for(int i = 0; i < Position::WIDTH; i++) result += " " + std::to_string(scores[i]);
          } else {
            int score = solver->solve(P, weak);
            result += " " + std::to_string(score);
          }
          std::lock_guard<std::mutex> lock(io_mutex);
          std::cout << result << "\n";
        }
      }
    };

    std::vector<std::thread> threads;
    for (int i = 0; i < cores - 1; i++) {
      threads.emplace_back(worker);
    }
    worker(); // run in main thread too
    
    for (auto& t : threads) {
      if (t.joinable()) t.join();
    }
  } else {
    std::string line;
    for(int l = 1; std::getline(std::cin, line); l++) {
      Position P;
      if(P.play(line) != line.size()) {
        std::cerr << "Line " << l << ": Invalid move " << (P.nbMoves() + 1) << " \"" << line << "\"" << std::endl;
      } else {
        std::cout << line;
        if(analyze) {
          std::vector<int> scores = solver->analyze(P, weak);
          for(int i = 0; i < Position::WIDTH; i++) std::cout << " " << scores[i];
        }
        else {
          int score = solver->solve(P, weak);
          std::cout << " " << score;
        }
        std::cout << "\n";
      }
    }
  }
}
