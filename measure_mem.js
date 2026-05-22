import fs from 'fs';
import createModule from './build/analyze_threaded.js';

async function main() {
  const Module = await createModule();
  
  // 32MB exactly
  const bytes = 32 * 1024 * 1024;
  
  const cachePtr = Module._createCache(7, 6, bytes, false);
  const solverPtr = Module._createSolver(7, 6, cachePtr, false);
  
  const byteLength = Module.wasmMemory.buffer.byteLength;
  console.log('Final Memory Size with 32MB cache and solver: ' + byteLength + ' bytes (' + (byteLength / 1024 / 1024).toFixed(2) + ' MB)');
  
  Module._destroySolver(solverPtr);
  Module._destroyCache(cachePtr);
}

main().catch(console.error);
