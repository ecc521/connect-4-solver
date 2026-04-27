#include "../native/Position.hpp"
#include <iostream>
#include <fstream>
#include <vector>
#include <cmath>
#include <algorithm>

using namespace GameSolver::Connect4;

int main(int argc, char** argv) {
    if (argc < 2) {
        std::cerr << "Usage: verify_book <book_path> [moves...]\n";
        return 1;
    }

    std::string book_path = argv[1];

    std::ifstream ifs(book_path, std::ios::binary);
    if (!ifs) {
        std::cerr << "Could not open book\n";
        return 1;
    }

    unsigned char width, height, depth, key_bytes, val_size, unused;
    ifs.read((char*)&width, 1);
    ifs.read((char*)&height, 1);
    ifs.read((char*)&depth, 1);
    ifs.read((char*)&key_bytes, 1);
    ifs.read((char*)&val_size, 1);
    ifs.read((char*)&unused, 1);

    std::cout << "Book Header: " << (int)width << "x" << (int)height 
              << " Depth: " << (int)depth << " KeyBytes: " << (int)key_bytes << std::endl;

    // Calculate number of items
    ifs.seekg(0, std::ios::end);
    size_t file_size = ifs.tellg();
    size_t num_items = (file_size - 6) / (key_bytes + 1);
    
    std::cout << "Number of items in book: " << num_items << std::endl;

    ifs.seekg(6, std::ios::beg);
    std::vector<Position::position_t> keys(num_items);
    for(size_t i = 0; i < num_items; ++i) {
        Position::position_t key = 0;
        for(int b = 0; b < key_bytes; ++b) {
            unsigned char c;
            ifs.read((char*)&c, 1);
            key |= (static_cast<Position::position_t>(c) << (b * 8));
        }
        keys[i] = key;
    }

    std::vector<uint8_t> values(num_items);
    for(size_t i = 0; i < num_items; ++i) {
        ifs.read((char*)&values[i], 1);
    }

    for (int i = 2; i < argc; ++i) {
        std::string moves = argv[i];
        Position P;
        if (P.play(moves) != moves.length()) {
            std::cout << "Position: " << moves << " INVALID" << std::endl;
            continue;
        }
        Position::position_t target_key = P.key3();

        auto it = std::lower_bound(keys.begin(), keys.end(), target_key);
        if (it != keys.end() && *it == target_key) {
            size_t idx = std::distance(keys.begin(), it);
            int score = (int)values[idx] + Position::MIN_SCORE - 1;
            std::cout << "Position: " << moves << " Score in book: " << score << " (Key: " << target_key << ")" << std::endl;
        } else {
            std::cout << "Position: " << moves << " NOT FOUND in book (Key: " << target_key << ")" << std::endl;
        }
    }

    return 0;
}
