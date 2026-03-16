import { Connect4Solver, Outcome, Player } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

describe('Connect4Solver', () => {
  let solver: Connect4Solver;
  let bookLoaded = false;

  beforeAll(async () => {
    solver = new Connect4Solver();
    await solver.init();
    
    // Check both legacy root and new data/ directory for the book
    const pathsToTry = [
      path.join(__dirname, '..', 'data', '7x6.book'),
      path.join(__dirname, '..', '7x6.book')
    ];

    for (const bookPath of pathsToTry) {
      if (fs.existsSync(bookPath)) {
        const bookData = new Uint8Array(fs.readFileSync(bookPath));
        await solver.loadBook(bookData);
        bookLoaded = true;
        break;
      }
    }

    if (!bookLoaded) {
      console.warn('Opening book (7x6.book) not found. Solver will run in pure logic mode.');
    }
  }, 15000);

  test('should analyze a deep position', () => {
    const result = solver.analyze('121212333');
    expect(result.originalPosition).toBe('121212333');
    expect(result.evaluation).not.toBeNull();
    expect(result.moveOptions).toHaveLength(7);
  });

  test('should detect a winning position', () => {
    const result = solver.analyze('1212121');
    expect(result.evaluation?.outcome).toBe(Outcome.Win);
    expect(result.evaluation?.winner).toBe(Player.P1);
    expect(result.position).toBe('1212121');
  });

  test('should handle invalid moves', () => {
    const result = solver.analyze('1111111');
    expect(result.position).not.toBe(result.originalPosition);
    expect(result.evaluation).toBeNull();
  });

  test('should correctly analyze 200 positions against expected C++ raw solver output', () => {
    const dataPath = path.join(__dirname, '..', 'test-data', 'positions.txt');
    if (!fs.existsSync(dataPath)) {
        console.warn('Skipping parity test, test-data/positions.txt not found.');
        return;
    }

    const lines = fs.readFileSync(dataPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
    expect(lines.length).toBeGreaterThan(0);

    for (const line of lines) {
      const parts = line.split(' ');
      const pos = parts[0];
      const expectedRawScore = parseInt(parts[1]!, 10);
      
      // Skip early game if no book
      if (!bookLoaded && pos.length <= 6) {
          continue;
      }

      const result = solver.analyze(pos);
      
      const nbMoves = pos.length;
      const isP1Turn = nbMoves % 2 === 0;
      const currentPlayer = isP1Turn ? Player.P1 : Player.P2;
      const opponent = isP1Turn ? Player.P2 : Player.P1;
      
      const movesRemaining = 42 - nbMoves;
      const halfMovesRemaining = Math.ceil(movesRemaining/2);

      let expectedOutcome: Outcome = Outcome.Draw;
      let expectedWinner: Player | null = null;
      let expectedMoves: number | null = null;

      if (expectedRawScore > 0) {
        expectedOutcome = Outcome.Win;
        expectedWinner = currentPlayer;
        expectedMoves = halfMovesRemaining - expectedRawScore + 1;
      } else if (expectedRawScore < 0) {
        expectedOutcome = Outcome.Loss;
        expectedWinner = opponent;
        expectedMoves = halfMovesRemaining + expectedRawScore + 1;
      }

      if (!result.evaluation || 
          result.evaluation.outcome !== expectedOutcome || 
          result.evaluation.winner !== expectedWinner ||
          result.evaluation.movesToEnd !== expectedMoves) {
        throw new Error(`Mismatch at position ${pos}. Expected ${expectedOutcome}/${expectedWinner}/${expectedMoves}, got ${result.evaluation?.outcome}/${result.evaluation?.winner}/${result.evaluation?.movesToEnd}`);
      }
      
      expect(result.originalPosition).toBe(pos);
    }
  });
});
