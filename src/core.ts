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
  moveOptions: (Evaluation | null)[]; // Evaluation for playing in each column (1 to board width)
  depthReached?: number; // Actual depth reached during search
}

export interface SolverModule {
  stringToNewUTF8(str: string): number;
  _analyzePosition6x5(pointer: number, threads: number): number;
  _loadBook6x5(pointer: number): void;
  _releaseSolver6x5(): void;
  _analyzePosition6x6(pointer: number, threads: number): number;
  _loadBook6x6(pointer: number): void;
  _releaseSolver6x6(): void;
  _analyzePosition7x6(pointer: number, threads: number): number;
  _loadBook7x6(pointer: number): void;
  _releaseSolver7x6(): void;
  _analyzePosition7x7(pointer: number, threads: number): number;
  _loadBook7x7(pointer: number): void;
  _releaseSolver7x7(): void;
  _analyzePosition8x6(pointer: number, threads: number): number;
  _loadBook8x6(pointer: number): void;
  _releaseSolver8x6(): void;
  _analyzePosition9x7(pointer: number, threads: number): number;
  _loadBook9x7(pointer: number): void;
  _releaseSolver9x7(): void;
  _analyzePosition8x8(pointer: number, threads: number): number;
  _loadBook8x8(pointer: number): void;
  _releaseSolver8x8(): void;
  _analyzePosition10x7(pointer: number, threads: number): number;
  _loadBook10x7(pointer: number): void;
  _releaseSolver10x7(): void;
  _analyzePosition9x9(pointer: number, threads: number): number;
  _loadBook9x9(pointer: number): void;
  _releaseSolver9x9(): void;
  _analyzePosition10x10(pointer: number, threads: number): number;
  _loadBook10x10(pointer: number): void;
  _releaseSolver10x10(): void;
  UTF8ToString(pointer: number): string;
  _malloc(size: number): number;
  _free(pointer: number): void;
  onRuntimeInitialized?: () => void;
  FS: {
    writeFile(path: string, data: Uint8Array): void;
  };
  getValue(ptr: number, type: string): number;
}
