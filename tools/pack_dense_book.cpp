#include "Position.hpp"
#include "OpeningBook.hpp"

#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>

using namespace GameSolver::Connect4;

int main(int argc, char** argv) {
  if(argc < 2) {
    std::cerr << "Usage: pack_dense_book <max_depth> < scored.txt\n";
    return 1;
  }

  int depth = atoi(argv[1]);

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

  std::cerr << "Sorting " << all_items.size() << " positions...\n";
  std::sort(all_items.begin(), all_items.end());

  all_items.erase(std::unique(all_items.begin(), all_items.end(), 
    [](const auto& a, const auto& b) { return a.first == b.first; }), all_items.end());

  int key_bytes = std::ceil(((depth + Position::WIDTH - 1) * 1.58496250072) / 8.0);
  if(key_bytes < 1) key_bytes = 1;
  if(key_bytes > 16) key_bytes = 16;

  std::ostringstream book_file;
  book_file << "../data/" << Position::WIDTH << "x" << Position::HEIGHT << "_dense" << depth << ".book";

  std::ofstream ofs(book_file.str(), std::ios::binary);
  char tmp;
  tmp = Position::WIDTH; ofs.write(&tmp, 1);
  tmp = Position::HEIGHT; ofs.write(&tmp, 1);
  tmp = depth; ofs.write(&tmp, 1);
  tmp = key_bytes; ofs.write(&tmp, 1);
  tmp = 1; ofs.write(&tmp, 1); // value size
  tmp = 0; ofs.write(&tmp, 1); // unused

  for (size_t i = 0; i < all_items.size(); i++) {
    Position::position_t key = all_items[i].first;
    for (int b = 0; b < key_bytes; b++) {
      tmp = (key >> (b * 8)) & 0xFF;
      ofs.write(&tmp, 1);
    }
  }

  for (size_t i = 0; i < all_items.size(); i++) {
    tmp = all_items[i].second;
    ofs.write(&tmp, 1);
  }
  ofs.close();
  
  std::cerr << "Successfully saved Dense Array Book to " << book_file.str() << "\n";
  std::cerr << "Key Size: " << key_bytes << " bytes\n";
  std::cerr << "Total Size: " << (all_items.size() * (key_bytes + 1.0)) / 1048576.0 << " MB\n";
  return 0;
}
