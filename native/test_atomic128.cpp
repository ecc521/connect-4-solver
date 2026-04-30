#include <atomic>
#include <iostream>

int main() {
    std::atomic<unsigned __int128> x;
    x.store(10);
    std::cout << (x.is_lock_free() ? "Lock-free" : "Locked") << std::endl;
    return 0;
}
