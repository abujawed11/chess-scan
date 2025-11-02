// /public/stockfish.worker.js

// ---- CONFIG — update these two if needed ----
const BASE_PATH = '/'; // e.g. '/chess-scan/' if your app is served under a subpath
const WASM_FILENAME = 'stockfish-17.1-lite-single-03e3232.wasm'; // <- your actual file name
// --------------------------------------------

const ABS = (p) => `${self.location.origin}${p.startsWith('/') ? p : '/'+p}`;
const WASM_URL = ABS(`${BASE_PATH.replace(/\/?$/, '/')}${WASM_FILENAME}`);
const ENGINE_URL = ABS(`${BASE_PATH.replace(/\/?$/, '/')}` + 'stockfish-engine.js');

// 1) Tell Emscripten *exactly* where the wasm is.
self.Module = {
  locateFile: (path) => (path.endsWith('.wasm') ? WASM_URL : ABS(`${BASE_PATH}${path}`)),
  wasmBinaryFile: WASM_URL,
  // optional debug:
  print: (txt) => postMessage(String(txt)),
  printErr: (txt) => postMessage(String(txt)),
};

// 2) Some builds use instantiateStreaming(fetch(<auto-resolved>))
//    Monkey-patch fetch so any '*.wasm' request is redirected to WASM_URL.
const _fetch = self.fetch.bind(self);
self.fetch = async (input, init) => {
  try {
    const url = typeof input === 'string' ? input : (input && input.url) ? input.url : '';
    if (typeof url === 'string' && url.toLowerCase().endsWith('.wasm')) {
      return _fetch(WASM_URL, init);
    }
    return _fetch(input, init);
  } catch (e) {
    return _fetch(input, init);
  }
};

// 3) Some engines cache instantiateStreaming; null it so it falls back to ArrayBuffer path using wasmBinaryFile.
try { WebAssembly.instantiateStreaming = null; } catch (_) { /* ignore */ }

// 4) Load the engine file (must be in /public)
importScripts(ENGINE_URL);

// 5) Wire up the engine factory exposed by the script we just imported.
let engine = null;

if (typeof STOCKFISH === 'function') {
  STOCKFISH().then((sf) => {
    engine = sf;
    if (typeof engine.addMessageListener === 'function') {
      engine.addMessageListener((msg) => postMessage(msg));
    } else if (typeof engine.onmessage === 'function') {
      // some builds use onmessage property
      const orig = engine.onmessage;
      engine.onmessage = (e) => { postMessage(e && e.data ? e.data : e); orig?.(e); };
    }
    postMessage('Stockfish loaded');
  });
} else {
  // Fallback (rare)
  postMessage('Stockfish loaded');
}

onmessage = (e) => {
  if (engine && typeof engine.postMessage === 'function') {
    engine.postMessage(e.data); // 'uci', 'position fen ...', 'go depth 18', etc.
  }
};
