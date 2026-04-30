#include <iostream>
#include <chrono>

int main() {
    volatile uint64_t res64 = 0;
    auto t0 = std::chrono::high_resolution_clock::now();
    for (uint64_t i = 1; i < 50000000; i++) {
        res64 = (i * 123456789) / (i % 100 + 1);
    }
    auto t1 = std::chrono::high_resolution_clock::now();
    
    volatile unsigned __int128 res128 = 0;
    auto t2 = std::chrono::high_resolution_clock::now();
    for (unsigned __int128 i = 1; i < 50000000; i++) {
        res128 = (i * 123456789) / (i % 100 + 1);
    }
    auto t3 = std::chrono::high_resolution_clock::now();
    
    std::cout << "64-bit math: " << std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count() << "ms\n";
    std::cout << "128-bit math: " << std::chrono::duration_cast<std::chrono::milliseconds>(t3 - t2).count() << "ms\n";
    return 0;
}
