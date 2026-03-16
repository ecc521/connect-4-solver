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
import { Connect4Solver, Player, Outcome } from "connect-4-solver";
import * as fs from "fs";

async function run() {
  const solver = new Connect4Solver();
  await solver.init();

  // Load an opening book for instant performance (Optional but recommended)
  // Get books from: https://github.com/PascalPons/connect4/releases/tag/book
  const bookBuffer = fs.readFileSync("data/7x6.book");
  await solver.loadBook(new Uint8Array(bookBuffer));

  // Analyze a position (column sequence: 1-7)
  const result = solver.analyze("4424");

  if (result.evaluation) {
    if (result.evaluation.outcome === Outcome.Win) {
      console.log(
        `${result.evaluation.winner} wins in ${result.evaluation.movesToEnd} moves`,
      );
    } else if (result.evaluation.outcome === Outcome.Draw) {
      console.log("The game is a draw");
    }
  }

  // Iterate over move options (index 0-6 maps to columns 1-7)
  result.moveOptions.forEach((ev, index) => {
    if (ev) {
      console.log(`Column ${index + 1}: ${ev.outcome} (${ev.score})`);
    } else {
      console.log(`Column ${index + 1}: Full`);
    }
  });
}

run();
```

### Analysis Result Structure

The `analyze` method returns a `PositionAnalysis` object:

```typescript
export enum Player {
  P1 = "P1", // Moves first
  P2 = "P2", // Moves second
}

export enum Outcome {
  Win = "Win",
  Loss = "Loss",
  Draw = "Draw",
}

export interface Evaluation {
  outcome: Outcome;
  winner: Player | null; // null when Draw
  movesToEnd: number | null; // null when Draw
  score: number; // raw score (positive = current player winning)
}

export interface PositionAnalysis {
  position: string; // Validated position (may differ if input was invalid)
  originalPosition: string; // Raw input string
  currentPlayer: Player; // Whose turn it is at the analyzed position
  evaluation: Evaluation | null; // Overall evaluation of the position
  moveOptions: (Evaluation | null)[]; // Evaluation for playing in each column (1-7)
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
