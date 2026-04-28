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

  std::cerr << "Sorting " << all_items.size() << " positions...\n";
  std::sort(all_items.begin(), all_items.end());

  all_items.erase(std::unique(all_items.begin(), all_items.end(), 
    [](const auto& a, const auto& b) { return a.first == b.first; }), all_items.end());

  std::ostringstream book_file;
  book_file << "../data/" << Position::WIDTH << "x" << Position::HEIGHT << (use_ef ? "_ef" : "_dense") << depth << ".book";

  std::ofstream ofs(book_file.str(), std::ios::binary);
  if (use_ef) {
      uint64_t n = all_items.size();
      uint64_t max_key = n > 0 ? all_items.back().first : 0;
      uint64_t U = max_key + 1;
      uint8_t L = n > 0 ? (uint8_t)std::max(0, (int)std::floor(std::log2((double)U / n))) : 0;

      char header[6] = {(char)Position::WIDTH, (char)Position::HEIGHT, (char)depth, 0, 1, (char)0xFF};
      ofs.write(header, 6);
      ofs.write(reinterpret_cast<char*>(&n), 8);
      ofs.write(reinterpret_cast<char*>(&U), 8);
      ofs.write(reinterpret_cast<char*>(&L), 1);

      uint64_t ub_size = (n + (U >> L) + 64) / 64;
      std::vector<uint64_t> ub(ub_size, 0);
      for (size_t i = 0; i < n; i++) {
          uint64_t y = all_items[i].first >> L;
          ub[(y + i) / 64] |= (1ULL << ((y + i) % 64));
      }
      ofs.write(reinterpret_cast<char*>(ub.data()), ub_size * 8);

      uint64_t lb_size = (n * L + 63) / 64;
      std::vector<uint64_t> lb(lb_size, 0);
      for (size_t i = 0; i < n; i++) {
          if (L == 0) continue;
          uint64_t val = all_items[i].first & ((1ULL << L) - 1);
          uint64_t bit_pos = i * L;
          uint64_t idx = bit_pos / 64;
          uint64_t shift = bit_pos % 64;
          lb[idx] |= (val << shift);
          if (shift + L > 64) lb[idx + 1] |= (val >> (64 - shift));
      }
      ofs.write(reinterpret_cast<char*>(lb.data()), lb_size * 8);

      for (size_t i = 0; i < n; i++) ofs.write(reinterpret_cast<char*>(&all_items[i].second), 1);
  } else {
      int key_bytes = std::ceil(((depth + Position::WIDTH - 1) * 1.58496250072) / 8.0);
      if(key_bytes < 1) key_bytes = 1;
      if(key_bytes > 16) key_bytes = 16;

      char header[6] = {(char)Position::WIDTH, (char)Position::HEIGHT, (char)depth, (char)key_bytes, 1, 0};
      ofs.write(header, 6);

      for (size_t i = 0; i < all_items.size(); i++) {
        Position::position_t key = all_items[i].first;
        for (int b = 0; b < key_bytes; b++) {
          char tmp = (key >> (b * 8)) & 0xFF;
          ofs.write(&tmp, 1);
        }
      }
      for (size_t i = 0; i < all_items.size(); i++) {
        char tmp = all_items[i].second;
        ofs.write(&tmp, 1);
      }
  }
  ofs.close();
  
  std::cerr << "Successfully saved " << (use_ef ? "Elias-Fano" : "Dense Array") << " Book to " << book_file.str() << "\n";
  return 0;
}
