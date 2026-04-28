# ReactNativeConnect4Solver

The React Native bridge entirely bypasses WebAssembly. Instead, it utilizes JSI (JavaScript Interface) or JNI (Java Native Interface) to directly invoke the underlying C++ logic on mobile devices. This completely prevents the massive payload and memory overhead of WASM on iOS and Android.

**Import:** 
```typescript
import { ReactNativeConnect4Solver } from "connect-4-solver/react-native";
```

::: info ℹ️ Native Linking Required
To use this module, you must have successfully run `pod install` in your `ios/` directory, and your React Native build process must be configured to compile external C++ source files.
:::

## Caveats compared to WASM

The React Native solver has a few unique traits:
1. **Thread Blocking:** By default, mobile platforms severely constrain WebWorkers. To compensate, calling `.analyze()` directly triggers native C++ execution. This *will* freeze the UI thread on older devices unless explicitly dispatched to a background thread module or `Reanimated` worklet.
2. **Global Caching:** Depending on the OS memory constraints, the cache bindings might be enforced statically across the device instance instead of locally. Call `unload()` aggressively when navigating away from game screens.

## Constructor
```typescript
new ReactNativeConnect4Solver(width: number, height: number);
```

## Methods

Shares the core method signatures:

- **[`init()`](./standard.md#init)**: Bootstraps the JSI bridge.
- **`analyze(position: string)`**: Executes the exact analysis natively.
- **[`unload()`](./standard.md#unload)**: Sends a C++ deallocation command natively to prevent app termination via Out-Of-Memory (OOM) errors.
