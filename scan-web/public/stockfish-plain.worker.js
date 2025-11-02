// /public/stockfish-plain.worker.js
// Make sure the WASM sits next to stockfish-engine.js as /public/stockfish-engine.wasm
self.Module = {
  locateFile(path) {
    // Tell Emscripten where the .wasm lives (served by Vite/CRA correctly)
    if (path.endsWith('.wasm')) return '/stockfish-engine.wasm';
    return path;
  },
};

importScripts('/stockfish-engine.js');

// Try the common exports patterns
let engine = null;

// Build type 1: exposes global STOCKFISH() that returns a worker-like object
if (typeof self.STOCKFISH === 'function') {
  self.STOCKFISH().then(sf => {
    engine = sf;
    engine.addMessageListener && engine.addMessageListener(msg => postMessage(msg));
    postMessage('Stockfish loaded');
  });
// Build type 2: exposes global Stockfish() (capital S only)
} else if (typeof self.Stockfish === 'function') {
  const sf = self.Stockfish();
  engine = sf;
  engine.addMessageListener && engine.addMessageListener(msg => postMessage(msg));
  postMessage('Stockfish loaded');
// Build type 3: the glue is itself a worker script (rare). In that case, it already
// has its own onmessage handler and posts messages — but most modern builds use 1 or 2.
} else {
  // Final fallback: let the user see a clear message
  postMessage('Error: No STOCKFISH() or Stockfish() factory found in stockfish-engine.js');
}

onmessage = (e) => {
  if (engine && engine.postMessage) {
    engine.postMessage(e.data);
  }
};
