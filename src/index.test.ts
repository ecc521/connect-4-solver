import { Connect4Solver } from '../src/index';
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
    expect(result.evaluation).toBeDefined();
    expect(result.moveOptions).toHaveLength(7);
  });

  test('should detect a winning position', () => {
    // 1:Y, 2:R
    // Y: 1, 1, 1, 1 -> Vertical win
    const result = solver.analyze('1212121');
    expect(result.evaluation).toBe('Y');
    expect(result.position).toBe('1212121');
  });

  test('should handle invalid moves', () => {
    // Fill column 1
    const result = solver.analyze('1111111');
    expect(result.evaluation).toBe('Invalid');
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
      
      const isYellowNext = pos.length % 2 === 0;
      const movesRemaining = 42 - pos.length;
      const halfMovesRemaining = Math.ceil(movesRemaining / 2);

      let expectedEvalStr = "D";
      if (expectedRawScore > 0) {
        expectedEvalStr = (isYellowNext ? "Y" : "R") + "+" + (halfMovesRemaining - expectedRawScore + 1);
      } else if (expectedRawScore < 0) {
        expectedEvalStr = (isYellowNext ? "R" : "Y") + "-" + (halfMovesRemaining + expectedRawScore + 1);
      }
      if (result.evaluation !== expectedEvalStr) {
        console.log(`Mismatch on ${pos}`, result.moveOptions);
        throw new Error(`Mismatch at position ${pos}. Expected ${expectedEvalStr} but got ${result.evaluation}`);
      }
      expect(result.originalPosition).toBe(pos);
      expect(result.evaluation).toBe(expectedEvalStr);
    }
  });
});
