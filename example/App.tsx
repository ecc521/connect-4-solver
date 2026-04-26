import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ReactNativeConnect4Solver } from 'connect-4-solver/native';

function App(): React.JSX.Element {
  const [resultText, setResultText] = useState('Press below to evaluate natively');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const evaluateNative = async () => {
    try {
      setIsEvaluating(true);
      setResultText('Initializing native solver...');
      
      const solver = new ReactNativeConnect4Solver(7, 6);
      await solver.init();
      
      setResultText('Evaluating "121212"...');
      const start = Date.now();
      const result = await solver.analyzeAsync('121212');
      const elapsed = Date.now() - start;

      if (result.evaluation) {
        setResultText(
          `Success!\n\nOutcome: ${result.evaluation.outcome}\nWinner: ${result.evaluation.winner}\nScore: ${result.evaluation.score}\nTime: ${elapsed}ms`
        );
      } else {
        setResultText(`Evaluated successfully, but no win detected.\nTime: ${elapsed}ms`);
      }
    } catch (err: any) {
      setResultText(`Error evaluating natively:\n${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>Connect 4 Solver</Text>
        <Text style={styles.subtitle}>Native JSI Testing</Text>

        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{resultText}</Text>
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={evaluateNative}
          disabled={isEvaluating}
        >
          <Text style={styles.buttonText}>
            {isEvaluating ? 'Evaluating...' : 'Test "121212" Natively'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  resultBox: {
    width: '100%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 30,
    minHeight: 150,
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default App;
