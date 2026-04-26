#include "Position.hpp"
#include "OpeningBook.hpp"
#include <iostream>

using namespace GameSolver::Connect4;

int main() {
    OpeningBook book{7, 6};
    book.load("data/7x6_dense10.book");
    
    Position p;
    int score = book.get(p);
    std::cout << "Score for empty position: " << score << std::endl;
    
    p.play("4");
    std::cout << "Score for '4': " << book.get(p) << std::endl;
    
    return 0;
}
