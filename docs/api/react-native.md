# ReactNativeConnect4Solver

The React Native solver bypasses WebAssembly entirely. It uses JSI (JavaScript Interface) on iOS and JNI (Java Native Interface) on Android to call the C++ engine directly.

**Import:**

```typescript
import { ReactNativeConnect4Solver } from "connect-4-solver/native";
```

::: info ℹ️ Native Linking Required
To use this module, you must have successfully run `pod install` in your `ios/` directory, and your React Native build process must be configured to compile external C++ source files.
:::

## Constructor

**Implements:** [`BaseConnect4Solver`](./base-solver)

```typescript
new ReactNativeConnect4Solver(options?: { width?: number, height?: number, cacheSizeMb?: number, heuristic?: boolean });
```
