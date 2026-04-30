#include <atomic>
int main() {
    std::atomic<unsigned __int128> x;
    x.store(10);
    return 0;
}
