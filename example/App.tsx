import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import { ReactNativeConnect4Solver } from 'connect-4-solver/native';

// Core imports to handle types
import { PositionAnalysis, Player, Outcome } from 'connect-4-solver/core';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function App(): React.JSX.Element {
  const [boardWidth, setBoardWidth] = useState(7);
  const [boardHeight, setBoardHeight] = useState(6);
  const [heuristic, setHeuristic] = useState(false);
  const [threads, setThreads] = useState(1);
  const [maxDepth, setMaxDepth] = useState(12);

  const [positionStr, setPositionStr] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [analysis, setAnalysis] = useState<PositionAnalysis | null>(null);
  const [evalTime, setEvalTime] = useState<number>(0);

  const solverRef = useRef<ReactNativeConnect4Solver | null>(null);

  // Initialize solver when dimensions change
  useEffect(() => {
    let active = true;
    const initSolver = async () => {
      // Unload previous solver
      if (solverRef.current) {
        solverRef.current.unload();
      }

      const newSolver = new ReactNativeConnect4Solver({
        width: boardWidth,
        height: boardHeight,
        heuristic: heuristic,
      });
      await newSolver.init();

      if (active) {
        solverRef.current = newSolver;
        setPositionStr(''); // Reset game on dim change
        setAnalysis(null);
        setEvalTime(0);
        evaluatePosition('', newSolver);
      }
    };
    initSolver();

    return () => {
      active = false;
    };
  }, [boardWidth, boardHeight, heuristic]);

  const evaluatePosition = async (
    pos: string,
    solverInstance = solverRef.current,
  ) => {
    if (!solverInstance) return;
    try {
      setIsEvaluating(true);
      const start = Date.now();
      const res = await solverInstance.analyzeAsync(pos, {
        threads: threads,
        maxDepth: maxDepth,
        timeoutMs: 0,
      });
      const elapsed = Date.now() - start;
      setEvalTime(elapsed);
      setAnalysis(res);
    } catch (err: any) {
      console.warn('Evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleColumnPress = (colIndex: number) => {
    if (isEvaluating || !solverRef.current) return;

    // Check if column is full
    const movesInCol = positionStr
      .split('')
      .filter(c => parseInt(c, 10) === colIndex + 1).length;
    if (movesInCol >= boardHeight) return;

    // Check if game is over
    if (analysis && analysis.evaluation && analysis.evaluation.movesToEnd === 0)
      return;

    const newPos = positionStr + (colIndex + 1).toString();
    setPositionStr(newPos);
    evaluatePosition(newPos);
  };

  const handleReset = () => {
    if (isEvaluating) return;
    setPositionStr('');
    setAnalysis(null);
    setEvalTime(0);
    evaluatePosition('');
  };

  const handleUndo = () => {
    if (isEvaluating || positionStr.length === 0) return;
    const newPos = positionStr.slice(0, -1);
    setPositionStr(newPos);
    evaluatePosition(newPos);
  };

  // Reconstruct board from position string
  const board = useMemo(() => {
    const grid: (Player | null)[][] = Array(boardHeight)
      .fill(null)
      .map(() => Array(boardWidth).fill(null));
    const heights = Array(boardWidth).fill(0);

    for (let i = 0; i < positionStr.length; i++) {
      const col = parseInt(positionStr[i], 10) - 1;
      const player = i % 2 === 0 ? Player.P1 : Player.P2;
      const row = boardHeight - 1 - heights[col]; // 0 is top row
      if (row >= 0 && row < boardHeight) {
        grid[row][col] = player;
        heights[col]++;
      }
    }
    return grid;
  }, [positionStr, boardWidth, boardHeight]);

  // Status message
  const statusMessage = useMemo(() => {
    if (!analysis) return 'Ready';
    if (analysis.evaluation && analysis.evaluation.movesToEnd === 0) {
      if (analysis.evaluation.outcome === Outcome.Draw)
        return 'Game Over - Draw';
      return `Game Over - ${analysis.evaluation.winner} Wins`;
    }
    const currentPlayer = positionStr.length % 2 === 0 ? Player.P1 : Player.P2;
    return `${currentPlayer}'s Turn`;
  }, [analysis, positionStr]);

  // MN/s calculation
  const nodeCount = solverRef.current ? solverRef.current.getNodeCount() : 0;
  const mnps = evalTime > 0 ? nodeCount / 1000000 / (evalTime / 1000) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Connect 4 Pro</Text>
          <Text style={styles.status}>{statusMessage}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>{evalTime}ms</Text>
            {nodeCount > 0 && (
              <Text style={styles.statsText}>{mnps.toFixed(2)} MN/s</Text>
            )}
          </View>
        </View>

        {/* Board Container */}
        <View style={styles.boardWrapper}>
          <View style={styles.evaluationsRow}>
            {Array.from({ length: boardWidth }).map((_, col) => {
              const moveEval = analysis?.moveOptions?.[col];
              let evalText = '-';
              let evalColor = '#888';
              if (moveEval) {
                if (moveEval.outcome === Outcome.Win) {
                  evalText = `M${moveEval.movesToEnd}`;
                  evalColor =
                    moveEval.winner ===
                    (positionStr.length % 2 === 0 ? Player.P1 : Player.P2)
                      ? '#4CAF50'
                      : '#F44336';
                } else if (moveEval.outcome === Outcome.Loss) {
                  evalText = `-M${moveEval.movesToEnd}`;
                  evalColor = '#F44336';
                } else if (moveEval.outcome === Outcome.Draw) {
                  evalText = '0';
                  evalColor = '#FFC107';
                } else {
                  evalText = moveEval.score.toString();
                  evalColor =
                    moveEval.score > 0
                      ? '#4CAF50'
                      : moveEval.score < 0
                        ? '#F44336'
                        : '#FFC107';
                }
              }

              return (
                <View key={`eval-${col}`} style={styles.evalCell}>
                  <Text
                    style={[styles.evalText, { color: evalColor }]}
                    numberOfLines={1}
                  >
                    {evalText}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.board}>
            {Array.from({ length: boardWidth }).map((_, colIndex) => (
              <TouchableOpacity
                key={`col-${colIndex}`}
                style={styles.column}
                onPress={() => handleColumnPress(colIndex)}
                activeOpacity={0.7}
              >
                {board.map((row, rowIndex) => {
                  const cell = row[colIndex];
                  return (
                    <View
                      key={`cell-${rowIndex}-${colIndex}`}
                      style={styles.cell}
                    >
                      <View
                        style={[
                          styles.token,
                          cell === Player.P1 && styles.tokenP1,
                          cell === Player.P2 && styles.tokenP2,
                        ]}
                      />
                    </View>
                  );
                })}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={handleUndo}>
            <Text style={styles.btnText}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnReset]}
            onPress={handleReset}
          >
            <Text style={styles.btnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Config Panel */}
        <View style={styles.configPanel}>
          <Text style={styles.configTitle}>Solver Configuration</Text>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Size:</Text>
            <TouchableOpacity
              style={styles.smBtn}
              onPress={() => setBoardWidth(Math.max(4, boardWidth - 1))}
            >
              <Text style={styles.smBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.configVal}>
              {boardWidth}x{boardHeight}
            </Text>
            <TouchableOpacity
              style={styles.smBtn}
              onPress={() => setBoardWidth(Math.min(9, boardWidth + 1))}
            >
              <Text style={styles.smBtnText}>+</Text>
            </TouchableOpacity>
            <View style={{ width: 10 }} />
            <TouchableOpacity
              style={styles.smBtn}
              onPress={() => setBoardHeight(Math.max(4, boardHeight - 1))}
            >
              <Text style={styles.smBtnText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smBtn}
              onPress={() => setBoardHeight(Math.min(7, boardHeight + 1))}
            >
              <Text style={styles.smBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Threads:</Text>
            <TouchableOpacity
              style={styles.smBtn}
              onPress={() => setThreads(Math.max(1, threads - 1))}
            >
              <Text style={styles.smBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.configVal}>{threads}</Text>
            <TouchableOpacity
              style={styles.smBtn}
              onPress={() => setThreads(Math.min(8, threads + 1))}
            >
              <Text style={styles.smBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Max Depth:</Text>
            <TouchableOpacity
              style={styles.smBtn}
              onPress={() => setMaxDepth(Math.max(1, maxDepth - 1))}
            >
              <Text style={styles.smBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.configVal}>{maxDepth}</Text>
            <TouchableOpacity
              style={styles.smBtn}
              onPress={() => setMaxDepth(Math.min(40, maxDepth + 1))}
            >
              <Text style={styles.smBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Engine:</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, !heuristic && styles.toggleActive]}
              onPress={() => setHeuristic(false)}
            >
              <Text style={styles.smBtnText}>Exact</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, heuristic && styles.toggleActive]}
              onPress={() => setHeuristic(true)}
            >
              <Text style={styles.smBtnText}>Heuristic</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  status: {
    fontSize: 18,
    color: '#BB86FC',
    marginTop: 5,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 5,
    gap: 15,
  },
  statsText: {
    color: '#888',
    fontSize: 12,
  },
  boardWrapper: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  evaluationsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  evalCell: {
    flex: 1,
    alignItems: 'center',
  },
  evalText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  board: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 5,
  },
  column: {
    flex: 1,
  },
  cell: {
    aspectRatio: 1,
    padding: 4,
  },
  token: {
    flex: 1,
    borderRadius: 100,
    backgroundColor: '#121212',
  },
  tokenP1: {
    backgroundColor: '#FF2A55',
  },
  tokenP2: {
    backgroundColor: '#FFD700',
  },
  controls: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  btn: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  btnReset: {
    backgroundColor: '#FF2A55',
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  configPanel: {
    width: '100%',
    marginTop: 30,
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 16,
  },
  configTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  configLabel: {
    color: '#BBB',
    width: 80,
    fontSize: 14,
  },
  configVal: {
    color: '#FFF',
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  smBtn: {
    backgroundColor: '#333',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  smBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleBtn: {
    backgroundColor: '#333',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginRight: 10,
  },
  toggleActive: {
    backgroundColor: '#BB86FC',
  },
});

export default App;
