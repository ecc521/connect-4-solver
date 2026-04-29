# Connect 4 Solver - React Native Example

This is a demonstration app for the `connect-4-solver` library, specifically showcasing the **Native C++ Bindings** for iOS and Android.

Unlike the WebAssembly version used in browsers, this example uses **JSI (JavaScript Interface)** on iOS and **JNI (Java Native Interface)** on Android to communicate directly with the high-performance C++ solver engine.

## Features

- **Zero-Latency Analysis**: Native execution bypasses WASM overhead.
- **Asynchronous Execution**: Background threads prevent UI freezing during deep searches.
- **Cross-Platform**: Shared C++ core running on both iOS and Android.
- **Real-time Evaluation**: Stockfish-style WDL (Win/Draw/Loss) probability curves.

## Prerequisites

Before running the example, ensure you have your mobile development environment set up:
- [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment)
- **iOS**: macOS with Xcode and CocoaPods.
- **Android**: Android Studio and SDK.

## Getting Started

### 1. Install Dependencies

From the root of this repository:
```bash
npm install
npm run build
```

Then, navigate to this example directory:
```bash
cd example
npm install
```

### 2. iOS Setup

Install the CocoaPods:
```bash
cd ios
pod install
cd ..
```

### 3. Run the App

**For iOS:**
```bash
npm run ios
```

**For Android:**
```bash
npm run android
```

## How it Works

The app uses the `ReactNativeConnect4Solver` class from the parent library. This class automatically routes calls to the native mobile modules:

```typescript
import { ReactNativeConnect4Solver } from "connect-4-solver/native";

const solver = new ReactNativeConnect4Solver(7, 6);
await solver.init();

// Analysis runs on a background thread natively
const result = await solver.analyzeAsync("4424");
console.log(result.evaluation?.eval.wdl);
```

## Performance Note

On mobile devices, we use a slightly smaller default transposition table (~24MB) to be memory-efficient while still providing "perfect" play for standard 7x6 boards.
