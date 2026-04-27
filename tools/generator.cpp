#include "Position.hpp"
#include "OpeningBook.hpp"

#include <iostream>
#include <sstream>
#include <string>
#include <unordered_set>

using namespace GameSolver::Connect4;

std::unordered_set<uint64_t> visited;

/**
 * Explore and print all possible position under a given depth.
 * symmetric positions are printed only once.
 */
void explore(const Position &P, char* pos_str, const int depth) {
  uint64_t key = P.key3();
  if(!visited.insert(key).second)
    return; // already explored position

  int nb_moves = P.nbMoves();
  if(nb_moves <= depth)
  std::cout << pos_str << std::endl;
  if(nb_moves >= depth) return;  // do not explore at further depth

  for(int i = 0; i < Position::WIDTH; i++) // explore all possible moves
    if(P.canPlay(i) && !P.isWinningMove(i)) {
      Position P2(P);
      P2.playCol(i);
      pos_str[nb_moves] = '1' + i;
      explore(P2, pos_str, depth);
      pos_str[nb_moves] = 0;
    }
}



/**
 * Generate all unique position up to max depth
 */
int main(int argc, char** argv) {
  if(argc > 1) {
    int depth = atoi(argv[1]);
    char* pos_str = new char[depth + 1]();
    explore(Position(), pos_str, depth);
    delete[] pos_str;
  } else {
    std::cerr << "Usage: generator <depth>" << std::endl;
  }
  return 0;
}
