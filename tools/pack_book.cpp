#include "TranspositionTable.hpp"
#include <iostream>
#include <fstream>
#include <vector>

using namespace GameSolver::Connect4;

int main(int argc, char** argv) {
  if (argc != 3) {
    std::cerr << "Usage: pack_book <input.book> <output.pbook>\n";
    return 1;
  }

  std::string input_file = argv[1];
  std::string output_file = argv[2];

  std::ifstream ifs(input_file, std::ios::binary);
  if (ifs.fail()) {
    std::cerr << "Failed to open " << input_file << "\n";
    return 1;
  }

  char _width, _height, _depth, value_bytes, partial_key_bytes, log_size_char;
  ifs.read(&_width, 1);
  ifs.read(&_height, 1);
  ifs.read(&_depth, 1);
  ifs.read(&partial_key_bytes, 1);
  ifs.read(&value_bytes, 1);
  ifs.read(&log_size_char, 1);

  if (value_bytes != 1 || (partial_key_bytes != 1 && partial_key_bytes != 2)) {
    std::cerr << "Input is not a legacy 1-byte or 2-byte sparse book.\n";
    return 1;
  }

  unsigned int log_size = (unsigned int)log_size_char;
  size_t table_size = next_prime(1 << log_size);

  std::vector<uint8_t> K1(table_size);
  std::vector<uint16_t> K2(table_size);
  std::vector<uint8_t> V(table_size);

  if (partial_key_bytes == 1) {
    ifs.read(reinterpret_cast<char *>(K1.data()), table_size);
  } else {
    ifs.read(reinterpret_cast<char *>(K2.data()), table_size * 2);
  }
  ifs.read(reinterpret_cast<char *>(V.data()), table_size);
  ifs.close();

  std::vector<uint16_t> Data(table_size);
  for (size_t i = 0; i < table_size; i++) {
    uint8_t p_key = (partial_key_bytes == 1) ? K1[i] : (K2[i] & 0xFF);
    Data[i] = ((uint16_t)p_key << 8) | (uint16_t)V[i];
  }

  std::ofstream ofs(output_file, std::ios::binary);
  ofs.write(&_width, 1);
  ofs.write(&_height, 1);
  ofs.write(&_depth, 1);

  // New packed format: partial_key_bytes = 2 (signifying uint16_t element size)
  char new_partial_key_bytes = 2;
  ofs.write(&new_partial_key_bytes, 1);

  // New packed format: value_bytes = 0
  char new_value_bytes = 0;
  ofs.write(&new_value_bytes, 1);

  ofs.write(&log_size_char, 1);

  ofs.write(reinterpret_cast<const char *>(Data.data()), table_size * sizeof(uint16_t));
  ofs.close();

  std::cout << "Successfully packed " << input_file << " -> " << output_file << "\n";
  std::cout << "Original Size: " << (table_size * 2.0) / 1048576.0 << " MB\n";
  std::cout << "Packed Size:   " << (table_size * 2.0) / 1048576.0 << " MB (L1/L3 Optimized)\n";

  return 0;
}
