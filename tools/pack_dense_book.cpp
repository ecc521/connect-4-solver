#include "Position.hpp"
#include "OpeningBook.hpp"

#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>

using namespace GameSolver::Connect4;

int main(int argc, char** argv) {
  if(argc < 2) {
    std::cerr << "Usage: pack_dense_book <max_depth> [--ef] < scored.txt\n";
    return 1;
  }

  int depth = atoi(argv[1]);
  bool use_ef = (argc > 2 && std::string(argv[2]) == "--ef");

  std::vector<std::pair<Position::position_t, uint8_t>> all_items;
  for(std::string line; getline(std::cin, line);) {
    if(line.length() == 0) break;
    std::istringstream iss(line);
    std::string pos;
    getline(iss, pos, ' ');
    int score;
    iss >> score;

    Position P;
    if(iss.fail() || !iss.eof() || P.play(pos) != pos.length() || 
       score < Position::MIN_SCORE || score > Position::MAX_SCORE ||
       P.nbMoves() > depth) {
      continue;
    }
    all_items.push_back({P.key3(), static_cast<uint8_t>(score - Position::MIN_SCORE + 1)});
  }

  std::ostringstream book_file;
  book_file << "../data/" << Position::WIDTH << "x" << Position::HEIGHT << (use_ef ? "_ef" : "_dense") << depth << ".book";

  std::cerr << "Saving " << all_items.size() << " positions to " << book_file.str() << "...\n";

  if (use_ef) {
      OpeningBookBase<Position::WIDTH, Position::HEIGHT>::save_elias_fano(book_file.str(), depth, all_items);
  } else {
      OpeningBookBase<Position::WIDTH, Position::HEIGHT>::save_dense(book_file.str(), depth, all_items);
  }
  
  std::cerr << "Successfully saved " << (use_ef ? "Elias-Fano" : "Dense Array") << " Book.\n";
  return 0;
}
