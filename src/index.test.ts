import { Connect4Solver, Outcome, Player } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

describe('Connect4Solver', () => {
  let solver: Connect4Solver;

  beforeAll(async () => {
    solver = new Connect4Solver();
    await solver.init();
    const bookPath = path.join(__dirname, '..', '7x6.book');
    const bookData = new Uint8Array(fs.readFileSync(bookPath));
    await solver.loadBook(bookData);
  }, 10000); // Give ample time for init

  test('should analyze a deep position instead of empty to save time', () => {
    // A Deep position
    const result = solver.analyze('121212333');
    expect(result.originalPosition).toBe('121212333');
    expect(result.evaluation).not.toBeNull();
    expect(result.moveOptions).toHaveLength(7);
  });

  test('should detect a winning position', () => {
    // 1:P1, 2:P2
    // P1: 1, 1, 1, 1 -> Vertical win
    const result = solver.analyze('1212121');
    expect(result.evaluation?.outcome).toBe(Outcome.Win);
    expect(result.evaluation?.winner).toBe(Player.P1);
    expect(result.position).toBe('1212121');
  });

  test('should handle invalid moves', () => {
    // Fill column 1
    const result = solver.analyze('1111111');
    expect(result.position).not.toBe(result.originalPosition);
    expect(result.evaluation).toBeNull();
  });

  test('should correctly analyze 200 positions against expected C++ raw solver output', () => {
    const dataPath = path.join(__dirname, '..', 'test-data', 'positions.txt');
    if (!fs.existsSync(dataPath)) {
        console.warn('Skipping parity test, test-data/positions.txt not found. If running locally, please generate it.');
        return;
    }

    const lines = fs.readFileSync(dataPath, 'utf8').split('\n').filter(l => l.trim().length > 0);
    expect(lines.length).toBeGreaterThan(0);

    for (const line of lines) {
      const parts = line.split(' ');
      const pos = parts[0];
      const expectedRawScore = parseInt(parts[1]!, 10);
      
      const result = solver.analyze(pos);
      
      // Verification logic: compare outcome, winner, and movesToEnd derived from raw score
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
        console.log(`Mismatch on ${pos}`, result.evaluation, { expectedOutcome, expectedWinner, expectedMoves });
        throw new Error(`Mismatch at position ${pos}.`);
      }
      
      expect(result.originalPosition).toBe(pos);
    }
  });
});
