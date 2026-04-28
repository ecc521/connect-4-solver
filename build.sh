mkdir -p build
EXPORTS='["_free", "_malloc", "_createCache", "_destroyCache", "_createSolver", "_destroySolver", "_loadBook", "_analyzeExact", "_analyzeHeuristic", "_getNodeCount"]'

emcc -O3 -fwasm-exceptions -DCACHE_BUCKET_SIZE=2 -o build/analyze.js native/analyze.cpp -s NO_EXIT_RUNTIME=1 -s EXPORTED_FUNCTIONS="$EXPORTS" -s EXPORTED_RUNTIME_METHODS='["FS", "UTF8ToString", "stringToNewUTF8", "getValue", "wasmMemory"]' -s INITIAL_MEMORY=200MB -s ALLOW_MEMORY_GROWTH -s WASM=1 -s SINGLE_FILE=1 -s MODULARIZE=1 -s EXPORT_NAME="createModule"

emcc -O3 -fwasm-exceptions -DUSE_PTHREADS=1 -pthread -DCACHE_BUCKET_SIZE=2 -o build/analyze_threaded.js native/analyze.cpp -s NO_EXIT_RUNTIME=1 -s EXPORTED_FUNCTIONS="$EXPORTS" -s EXPORTED_RUNTIME_METHODS='["FS", "UTF8ToString", "stringToNewUTF8", "getValue", "wasmMemory"]' -s INITIAL_MEMORY=200MB -s MAXIMUM_MEMORY=1GB -s ALLOW_MEMORY_GROWTH -s WASM=1 -s SINGLE_FILE=1 -s MODULARIZE=1 -s EXPORT_NAME="createThreadedModule" -s PTHREAD_POOL_SIZE=4
