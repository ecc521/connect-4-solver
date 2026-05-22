#include <iostream>
#include "native/Solver.hpp"

int main() {
    GameSolver::Connect4::GenericPosition<-1, -1> P(7, 6);
    std::cout << "P width: " << P.width() << " height: " << P.height() << "\n";
    auto solver_ptr = GameSolver::Connect4::Solver<-1, -1>::create(8388608);
    try {
        solver_ptr->solve(P, false);
    } catch (const std::exception& e) {
        std::cout << "Exception: " << e.what() << "\n";
    }
    return 0;
}
