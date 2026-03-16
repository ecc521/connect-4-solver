# Connect 4 Game Solver

Perfect Connect 4 solver in C++ with a high-performance WebAssembly binary bridge and an object-oriented TypeScript wrapper.

## Installation

```bash
npm install connect-4-solver
```

## Features

- **High Performance**: Native C++ solver compiled to WebAssembly.
- **Binary Bridge**: Efficient data transfer between WASM and JS (no string parsing).
- **TypeScript Ready**: Full type definitions included.
- **Opening Book Support**: Fast analysis even from move 0.

## Usage

```typescript
import { Connect4Solver } from 'connect-4-solver';
import * as fs from 'fs';

async function run() {
  const solver = new Connect4Solver();
  await solver.init();

  // Load an opening book for instant performance (Optional but recommended)
  // Get books from: https://github.com/PascalPons/connect4/releases/tag/book
  const bookBuffer = fs.readFileSync('7x6.book');
  await solver.loadBook(new Uint8Array(bookBuffer));

  // Analyze a position (column sequence: 1-7)
  const result = solver.analyze('4424');

  console.log('Evaluation:', result.evaluation); // e.g., "D" for Draw or "Y+15" for Yellow win in 15
  console.log('Valid Moves:', result.moveOptions.filter(m => m.evaluation !== null));
}

run();
```

### Analysis Result Structure

The `analyze` method returns a `PositionAnalysis` object:

```typescript
interface PositionAnalysis {
  position: string;         // The position analyzed
  originalPosition: string; // The input string
  evaluation: string;       // Best move evaluation (e.g. "Y+5", "R-10", "D")
  moveOptions: {            // Scores for every column (1-7)
    column: number;
    evaluation: string | null; // null if column is full
  }[];
}
```

## Advanced

### Building from source

If you want to recompile the WASM module, ensure you have Emscripten installed:

```bash
npm run build
```

## Credits & License

- Core algorithm by [Pascal Pons](http://blog.gamesolver.org).
- Original C++ source code is published under **AGPL v3** license.
- Wrapper and distribution by Tucker Willenborg.
