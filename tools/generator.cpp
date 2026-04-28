#include "Position.hpp"
#include "OpeningBook.hpp"

#include <iostream>
#include <sstream>
#include <string>
#include <unordered_set>

using namespace GameSolver::Connect4;

std::unordered_set<uint64_t> visited;

int target_print_depth = -1;

/**
 * Explore and print all possible position under a given depth.
 * symmetric positions are printed only once.
 */
void explore(const Position &P, char* pos_str, const int max_depth) {
  uint64_t key = P.key3();
  if(!visited.insert(key).second)
    return; // already explored position

  int nb_moves = P.nbMoves();
  if(nb_moves == target_print_depth) {
    std::cout << pos_str << "\n";
  }
  
  if(nb_moves >= max_depth) return;  // do not explore at further depth

  for(int i = 0; i < Position::WIDTH; i++) // explore all possible moves
    if(P.canPlay(i) && !P.isWinningMove(i)) {
      Position P2(P);
      P2.playCol(i);
      pos_str[nb_moves] = '1' + i;
      explore(P2, pos_str, max_depth);
      pos_str[nb_moves] = 0;
    }
}

/**
 * Generate all unique position up to max depth in Reverse Depth Order (Bottom-Up)
 */
int main(int argc, char** argv) {
  if(argc > 1) {
    int max_depth = atoi(argv[1]);
    char* pos_str = new char[max_depth + 1]();
    
    for (int d = max_depth; d >= 0; d--) {
      visited.clear();
      target_print_depth = d;
      explore(Position(), pos_str, d);
    }
    
    delete[] pos_str;
  } else {
    std::cerr << "Usage: generator <depth>" << std::endl;
  }
  return 0;
}
