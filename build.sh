mkdir -p wasm-out
EXPORTS='["_free", "_malloc", "_createCache", "_destroyCache", "_createSolver", "_destroySolver", "_stopSolver", "_createBookFromBuffer", "_destroyBook", "_solveExact", "_solveHeuristic", "_analyzeExact", "_analyzeHeuristic", "_getNodeCount"]'

emcc -O3 -flto -std=c++20 -msimd128 -DNDEBUG -fwasm-exceptions -DCACHE_BUCKET_SIZE=2 -o wasm-out/analyze.js native/analyze.cpp -s NO_EXIT_RUNTIME=1 -s EXPORTED_FUNCTIONS="$EXPORTS" -s EXPORTED_RUNTIME_METHODS='["FS", "UTF8ToString", "stringToNewUTF8", "getValue", "wasmMemory"]' -s INITIAL_MEMORY=200MB -s ALLOW_MEMORY_GROWTH -s WASM=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME="createModule" -s STACK_SIZE=1048576

emcc -O3 -flto -std=c++20 -msimd128 -DNDEBUG -fwasm-exceptions -DUSE_PTHREADS=1 -pthread -DCACHE_BUCKET_SIZE=2 -o wasm-out/analyze_threaded.js native/analyze.cpp -s NO_EXIT_RUNTIME=1 -s EXPORTED_FUNCTIONS="$EXPORTS" -s EXPORTED_RUNTIME_METHODS='["FS", "UTF8ToString", "stringToNewUTF8", "getValue", "wasmMemory"]' -s INITIAL_MEMORY=200MB -s MAXIMUM_MEMORY=4GB -s ALLOW_MEMORY_GROWTH -s WASM=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORT_NAME="createThreadedModule" -s PTHREAD_POOL_SIZE=4 -s PTHREAD_POOL_SIZE_STRICT=0 -s STACK_SIZE=1048576

# Ensure artifacts are synced to the build directory for runtime/test imports
mkdir -p build
cp wasm-out/analyze.js build/ 2>/dev/null || true
cp wasm-out/analyze.wasm build/ 2>/dev/null || true
cp wasm-out/analyze_threaded.js build/ 2>/dev/null || true
cp wasm-out/analyze_threaded.wasm build/ 2>/dev/null || true

