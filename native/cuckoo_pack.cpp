#include "Position.hpp"
#include "OpeningBook.hpp"
#include "CuckooTable.hpp"

#include <iostream>
#include <sstream>
#include <string>

using namespace GameSolver::Connect4;

int main(int argc, char** argv) {
  if(argc < 3) {
    std::cerr << "Usage: cuckoo_pack <max_depth> <num_lines> < scored.txt\n";
    return 1;
  }

  int depth = atoi(argv[1]);
  int num_lines = atoi(argv[2]);

  // Cuckoo table targets a highly compact 95% load factor explicitly initially.
  // 4 items per bucket. So num_buckets = (num_lines / 0.95) / 4
  size_t target_buckets = next_prime((size_t)((num_lines / 0.95) / 4) + 1);

  std::vector<std::pair<Position::position_t, int>> all_items;
  long long count = 1;
  for(std::string line; getline(std::cin, line); count++) {
    if(line.length() == 0) break;
    std::istringstream iss(line);
    std::string pos;
    getline(iss, pos, ' ');
    int score;
    iss >> score;

    Position P;
    if(iss.fail() || !iss.eof() || P.play(pos) != pos.length() || 
       score < Position::MIN_SCORE || score > Position::MAX_SCORE) {
      continue;
    }
    all_items.push_back({P.key3(), score - Position::MIN_SCORE + 1});
  }

  CuckooTable<Position::position_t, uint8_t> *table = nullptr;

  while (true) {
    std::cerr << "Building Cuckoo Table with " << target_buckets << " buckets (" 
              << (target_buckets * 8) / 1048576.0 << " MB)...\n";
    
    table = new CuckooTable<Position::position_t, uint8_t>(target_buckets);
    for (const auto& item : all_items) {
      table->put(item.first, item.second);
    }
    
    int fails = table->build();
    if (fails == 0) {
      std::cerr << "Successfully built perfect Cuckoo Graph!\n";
      break;
    }
    std::cerr << "Graph full (" << fails << " evictions). Expanding by 1%...\n";
    delete table;
    target_buckets = next_prime(target_buckets * 1.01);
  }

  OpeningBook book(Position::WIDTH, Position::HEIGHT, depth, table);
  
  std::ostringstream book_file;
  book_file << "../data/" << Position::WIDTH << "x" << Position::HEIGHT << "_dense" << depth << ".cbook";
  
  book.save(book_file.str());
  
  std::fstream fs(book_file.str(), std::ios::in | std::ios::out | std::ios::binary);
  fs.seekp(4, std::ios::beg); 
  char val = 2; // Cuckoo flag
  fs.write(&val, 1);
  fs.close();
  
  std::cerr << "Successfully saved Cuckoo Book to " << book_file.str() << "\n";
  return 0;
}
