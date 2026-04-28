# Solution Books

Because perfectly solving a complex Connect 4 game state can be incredibly CPU intensive, the engine supports loading pre-computed **Solution Books** (also known as Opening Books). 

These books map trillions of early-game and mid-game position sequences to their evaluations (supporting both Weak and Strong solution mappings). When the solver encounters a position that exists within a loaded book, it returns the solution immediately, and avoids deep Alpha-Beta tree searches.

## Precomputed Books

*(Placeholder: Precomputed `.book` files for various board sizes and depths will be provided here shortly.)*

## Generating Custom Books

You can easily generate your own Dense or Elias-Fano books for any board size and search depth using the included TypeScript orchestration script. 

### Requirements

- Node.js (v20+)
- `connect4.node` Native Addon compiled (`npm run build:native`)

### Hardware Guidelines

While the engine can run on limited hardware, generating deep books is highly parallelizable and very cache-size sensitive. 

Allocating multiple threads and a **4GB minimum cache** is recommended to avoid excessive duplicate work on deeper books. The more RAM and cores you provide, the faster generation will complete.

### Generation Command

From the root of the repository, use the `tools/generate-book.ts` script:

```bash
npx ts-node tools/generate-book.ts --width 7 --height 7 --depth 10 --cache 4096 --threads 12
```

> **Safe to Quit:** Generating deep books can take hours or days. You can safely press `Ctrl+C` (SIGINT) at any time to halt the generator. The script executes the Alpha-Beta evaluation synchronously across the C++ worker threads.

#### Arguments
* `--width` & `--height`: The dimensions of the Connect 4 board.
* `--depth`: The maximum move sequence length to precompute. (e.g., Depth 10 evaluates all game states up to ply 10).
* `--cache`: The size of the RAM Transposition Table in Megabytes (`MB`). `--cache 4096` allocates roughly 4GB of RAM. A larger cache prevents deep leaf nodes from evicting your shallow nodes during generation.
* `--threads`: Number of parallel C++ worker threads to distribute the Alpha-Beta evaluation across natively.

### Binary Compression
The orchestrator natively generates standard **Dense Array** books by default. However, if you append `--ef` to the underlying `pack_dense_book` command, it will pack the file using **Elias-Fano** compression, which drastically reduces the payload size (often by >30%) for mobile and WebAssembly deployment while maintaining near $O(1)$ lookup speeds.

### Converting Book Types
Because the underlying C++ `OpeningBook` architecture exposes a dynamic `.dump()` API, you can seamlessly convert between book formats (e.g. Dense to Elias-Fano) directly in C++ by loading the book, dumping the `EntryList`, and calling the corresponding `save_elias_fano()` static method.
