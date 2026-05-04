#ifndef THREADPOOL_HPP
#define THREADPOOL_HPP

#include <vector>
#include <queue>
#include <functional>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <atomic>

namespace GameSolver {
namespace Connect4 {

class ThreadPool {
 public:
  std::vector<std::thread> workers;
  std::queue<std::function<void()>> tasks;
  std::mutex queue_mutex;
  std::condition_variable condition;
  std::atomic<bool> stop{false};
  int current_threads{0};

  ThreadPool() : stop(false), current_threads(0) {}

  ~ThreadPool() {
#ifndef __EMSCRIPTEN__
    stop = true;
    condition.notify_all();
    for (std::thread &worker : workers) {
      if (worker.joinable()) worker.join();
    }
#endif
  }

  void ensureCapacity(int n) {
    if (n <= current_threads) return;
    std::unique_lock<std::mutex> lock(queue_mutex);
    for (int i = current_threads; i < n; ++i) {
      workers.emplace_back([this] {
        for (;;) {
          std::function<void()> task;
          {
            std::unique_lock<std::mutex> lock(this->queue_mutex);
            this->condition.wait(lock, [this] { return this->stop || !this->tasks.empty(); });
            if (this->stop && this->tasks.empty()) return;
            task = std::move(this->tasks.front());
            this->tasks.pop();
          }
          task();
        }
      });
    }
    current_threads = n;
  }

  void enqueue(std::function<void()> task) {
    {
      std::unique_lock<std::mutex> lock(queue_mutex);
      tasks.push(std::move(task));
    }
    condition.notify_one();
  }
};

} // namespace Connect4
} // namespace GameSolver

#endif
