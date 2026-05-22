const fs = require('fs');
const createModule = require('./build/analyze_threaded.js');

async function run() {
  console.log("Loading WebAssembly module...");
  const wasmModule = await createModule();
  
  console.log("Module loaded.");
  
  // Wait a tick to ensure caches initialize if they happen asynchronously (they shouldn't)
  await new Promise(resolve => setTimeout(resolve, 100));

  const memory = wasmModule.wasmMemory;
  const buffer = memory.buffer;
  const bytes = buffer.byteLength;
  const mb = bytes / (1024 * 1024);
  
  console.log(`Current WASM Memory Heap Size: ${mb.toFixed(2)} MB`);
  console.log(`Current WASM Memory Buffer: ${bytes} bytes`);

  // Optionally query node count to ensure it's functional
  const count = wasmModule._getNodeCount();
  console.log("Transposition Table initialized successfully (nodes: " + count + ")");
}

run().catch(console.error);
