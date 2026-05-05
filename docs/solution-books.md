# Solution Books

Perfectly solving a Connect 4 position can be CPU-intensive, so the exact solver supports loading pre-computed **Solution Books** (Opening Books). The heuristic solver (`heuristic: true`) can also optionally accept books to eliminate search latency and guarantee perfect play in the early game.

These books map early-game and mid-game position sequences to their evaluations (supporting both Weak and Strong solution mappings). When the exact solver encounters a position that exists within a loaded book, it returns the solution immediately and avoids deep Alpha-Beta tree searches.

## Precomputed Books

You can download pre-computed, highly optimized Opening Books for various standard board sizes from the official GitHub Releases page:
**[Download Solution Books](https://github.com/ecc521/connect-4-solver/releases/tag/solutionbooks)**

> **Note:** To keep the `connect-4-solver` NPM package as lightweight as possible, opening books are **not** bundled by default. You must download them separately if you require instant empty-board evaluation.

### Usage Example

To use a book, instantiate an `OpeningBook`, load the raw `.book` file buffer into it, and pass it into your solver's `analyze` method options!

```typescript
import { OpeningBook } from "connect-4-solver";
import fs from "fs";

// 1. Read the binary book off the disk or network
const bookBuffer = fs.readFileSync("my_book.book");

// 2. Load the book! (Dimensions are automatically detected)
const book = await OpeningBook.fromBuffer(bookBuffer);

// 3. Pass it to your solver's analyze method
await solver.analyze("4424", { book });

// 4. Always free native memory when finished!
book.unload();
```

### Weak vs. Strong Solutions

Solution books come in two primary types, depending on how they were generated:

- **Strong Solutions (Perfect):** These books store the exact distance-to-win for every position. The engine uses these to play perfectly and find the shortest possible path to victory.
- **Weak Solutions:** These books only store the binary game outcome (Win, Draw, or Loss). The outcome evaluations are 100% mathematically correct, but any reported move depths are effectively "upper bounds" because the solver stops searching as soon as it finds _any_ winning path, rather than proving it is the _fastest_ path.

> [!TIP]
> Loading a **Strong Book** into a **Weak Solver** is perfectly safe. Loading a **Weak Book** into a **Strong Solver** will still preserve the correct Win/Draw/Loss outcome, but because the strong solver cannot differentiate between the `+1` scores returned by the weak book, it will often choose slower, suboptimal winning paths.

## Generating Custom Books

You can generate your own Dense or Elias-Fano books for any board size and search depth using the included TypeScript script.

### Requirements

- Node.js (v20+)
- `connect4.node` Native Addon compiled (`npm run build:native`)

### Hardware Guidelines

While the engine can run on limited hardware, generating deep books is parallelizable and cache-size sensitive.

Allocating multiple threads and a **4GB minimum cache** is recommended to avoid excessive duplicate work on deeper books. The more RAM and cores you provide, the faster generation will complete.

### Generation Command

From the root of the repository, use the `tools/generate-book.ts` script:

```bash
npx ts-node tools/generate-book.ts --width 7 --height 7 --depth 10 --cacheMB 4096 --threads 12
```

> **Safe to Quit:** Generating deep books can take hours or days. You can safely press `Ctrl+C` (SIGINT) at any time to halt the generator. The script executes the Alpha-Beta evaluation synchronously across the C++ worker threads.

#### Arguments

- `--width` & `--height`: The dimensions of the Connect 4 board.
- `--depth`: The maximum move sequence length to precompute. (e.g., Depth 10 evaluates all game states up to ply 10).
- `--cacheMB`: The size of the RAM Transposition Table in Megabytes (`MB`). `--cacheMB 4096` allocates roughly 4GB of RAM. A larger cache prevents deep leaf nodes from evicting your shallow nodes during generation.
- `--threads`: Number of parallel C++ worker threads to distribute the Alpha-Beta evaluation across.
- `--ef`: Instructs the generator to natively compress and save the output as an `.efbook` (Elias-Fano) instead of a standard Dense array.
- `--weak`: Generates a **Weak Solution** book. Instead of finding the exact distance-to-win, the solver will only determine the binary outcome (Win/Draw/Loss). This is significantly faster for deep searches.
- `--bootstrap <path>`: Provide a path to a smaller, existing `.book` or `.efbook`. The solver will query this book during evaluation, massively speeding up the generation of deeper books.

### Binary Compression

The orchestrator generates standard **Dense Array** books by default. The engine also supports **Elias-Fano** compression, which greatly reduces file sizes and memory usage. While Elias-Fano supports O(1) random lookups at <1ms, it is still substantially slower per lookup than Dense Arrays.

Sparse books are supported, however using extremely sparse books is not recommended. Books will be queried for all solver evaluations where `depth <= maxDepthContainedInBook`.

> **Note:** The `generate-book.ts` script saves in Dense Array format automatically. If you want to compress the book using Elias-Fano, simply append the `--ef` flag to your generator command!
