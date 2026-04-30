#include <iostream>
#include <cassert>
#include "Position.hpp"
#include "TranspositionTable.hpp"

using namespace GameSolver::Connect4;

int main() {
    // We use a small table to make math easy
    size_t table_bytes = 100000;
    TranspositionTable<uint64_t, uint8_t, 8, 7, unsigned __int128> tt(table_bytes);
    
    unsigned __int128 num_buckets = tt.getSize() / 2;
    std::cout << "Num buckets: " << (uint64_t)num_buckets << std::endl;
    
    // Calculate the partial key bits
    int shift_amount = 8 + 7 + TranspositionTable<uint64_t, uint8_t, 8, 7, unsigned __int128>::MoveBits; // ValueBits + WorkBits + MoveBits
    int available_bits = 64 - shift_amount;
    
    unsigned __int128 K1 = 12345; // arbitrary base key
    
    // K2 has the same index (K2 % num_buckets == K1 % num_buckets)
    // AND the same partial key mod 2^available_bits
    // K2 = K1 + num_buckets * 2^available_bits
    unsigned __int128 K2 = K1 + num_buckets * ((unsigned __int128)1 << available_bits);
    
    // Insert K1
    tt.put(K1, 42, 10, 3);
    
    // Look up K2
    auto res1 = tt.getPacked(K1);
    auto res2 = tt.getPacked(K2);
    
    std::cout << "K1 value: " << (int)res1.value << " move: " << (int)res1.best_move << std::endl;
    std::cout << "K2 value: " << (int)res2.value << " move: " << (int)res2.best_move << std::endl;
    
    if (res2.value != 0) {
        std::cout << "COLLISION DETECTED! K2 falsely matched K1!" << std::endl;
    } else {
        std::cout << "No collision detected." << std::endl;
    }
    
    return 0;
}
