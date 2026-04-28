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

/**
 * The core WASM Bridge Interface.
 * 
 * WebAssembly does not natively support garbage collection or complex objects.
 * This interface bridges the TypeScript boundary to the C++ runtime using 
 * raw integer memory pointers.
 * 
 * IMPORTANT: Because memory is allocated in the WASM heap, developers MUST
 * manually call the respective _destroy* methods to prevent memory leaks.
 */
export interface SolverModule {
  stringToNewUTF8(str: string): number;
  /** Allocates a Transposition Table in the WASM heap. Returns a raw pointer. */
  _createCache: (w: number, h: number, bytes: number, is_heuristic: boolean) => number;
  /** Frees a Transposition Table from the WASM heap. */
  _destroyCache: (ptr: number) => void;
  
  /** Initializes a Solver bound to a specific Cache pointer. */
  _createSolver: (w: number, h: number, cachePtr: number, is_heuristic: boolean) => number;
  /** Destroys the Solver instance (but does NOT free the cache). */
  _destroySolver: (w: number, h: number, ptr: number, is_heuristic: boolean) => void;
  
  _createBook: (w: number, h: number, pathPtr: number) => number;
  _destroyBook: (w: number, h: number, ptr: number) => void;
  _analyzeExact: (w: number, h: number, solverPtr: number, posPtr: number, threads: number, bookPtr: number) => number;
  _analyzeHeuristic: (w: number, h: number, solverPtr: number, posPtr: number, threads: number, max_depth: number, timeout: number) => number;
  _getNodeCount: (w: number, h: number, solverPtr: number, is_heuristic: boolean) => number;
  UTF8ToString(pointer: number): string;
  _malloc(size: number): number;
  _free(pointer: number): void;
  onRuntimeInitialized?: () => void;
  FS: {
    writeFile(path: string, data: Uint8Array): void;
  };
  getValue(ptr: number, type: string): number;
}

/**
 * Base abstract class for Connect 4 solvers to allow clean structural 
 * sharing between WASM implementations and Native implementations
 * without forcing double-bundling of the WASM glue code.
 */
export abstract class BaseConnect4Solver {
  public width: number;
  public height: number;
  protected initialized = false;

  constructor(
    widthOrOpts?: number | { width?: number; height?: number; cache?: any },
    heightOpt?: number
  ) {
    let width = 7;
    let height = 6;

    if (typeof widthOrOpts === "number") {
      width = widthOrOpts;
      if (heightOpt !== undefined) {
        height = heightOpt;
      }
    } else if (widthOrOpts && typeof widthOrOpts === "object") {
      if (widthOrOpts.width !== undefined) width = widthOrOpts.width;
      if (widthOrOpts.height !== undefined) height = widthOrOpts.height;
    }

    const validSizes = ["6x5", "6x6", "7x6", "7x7", "8x6", "9x7", "8x8", "9x6", "11x4"];
    if (!validSizes.includes(`${width}x${height}`)) {
      throw new Error(
        `Board size ${width}x${height} is not supported by the generated WASM bundle.`
      );
    }
    this.width = width;
    this.height = height;
  }

  abstract init(): Promise<void>;
  abstract analyze(positionStr: string, opts?: any): PositionAnalysis;
  abstract analyzeAsync(positionStr: string, opts?: any): Promise<PositionAnalysis>;
  abstract unload(): void;
}
