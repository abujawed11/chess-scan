/* stockfish-loader.worker.js
   Classic Worker that loads Stockfish from /stockfish.js and routes messages.
   - Supports both "factory" builds (STOCKFISH()/Stockfish()) and "worker" builds (self.onmessage set by engine).
   - Ensures WASM is requested from /stockfish.wasm via Module.locateFile.
   - Posts "Stockfish loaded" once wiring is established.
*/

(() => {
  'use strict';

  // Helpful diagnostics to main thread if a top-level error occurs inside the worker
  self.addEventListener('error', (e) => {
    try {
      self.postMessage(`worker-error: ${e.message || e}`);
    } catch {}
  });

  self.addEventListener('unhandledrejection', (e) => {
    try {
      const reason = (e && (e.reason?.message || e.reason)) || 'unhandledrejection';
      self.postMessage(`worker-unhandledrejection: ${reason}`);
    } catch {}
  });

  // Ensure Emscripten resolves the .wasm from the root public path
  // This supports server hosting at /stockfish.wasm (MIME must be application/wasm)
  self.Module = self.Module || {};
  const previousLocateFile = self.Module.locateFile;
  self.Module.locateFile = (path, prefix) => {
    if (path && path.endsWith('.wasm')) {
      // Always request from the web root; adjust if you serve under a prefix
      return '/stockfish.wasm';
    }
    return typeof previousLocateFile === 'function' ? previousLocateFile(path, prefix) : (prefix || '') + path;
  };

  // Flag and engine reference
  let engine = null;

  const sendLoaded = () => {
    try {
      self.postMessage('Stockfish loaded');
    } catch {}
  };

  try {
    // Load the engine script. Place both files in your app's public/ directory:
    // - /public/stockfish.js   -> served as /stockfish.js
    // - /public/stockfish.wasm -> served as /stockfish.wasm (MIME: application/wasm)
    importScripts('/stockfish.js');
  } catch (err) {
    try {
      self.postMessage(`worker-error: Failed to import /stockfish.js: ${err && err.message ? err.message : err}`);
    } catch {}
    return;
  }

  // After importing, detect if this is a "factory" build or a "worker" build
  const factory = (typeof self.STOCKFISH === 'function' && self.STOCKFISH)
               || (typeof self.Stockfish === 'function' && self.Stockfish)
               || null;

  if (factory) {
    // Factory-style build: create an instance, wire bidirectional message relays
    try {
      engine = factory();

      // Forward engine -> main thread
      engine.onmessage = (event) => {
        try {
          // Many builds send plain strings; forward transparently
          self.postMessage(typeof event === 'string' ? event : event?.data ?? event);
        } catch {}
      };

      // Forward main thread -> engine
      self.onmessage = (event) => {
        try {
          const payload = event?.data ?? event;
          engine.postMessage(payload);
        } catch (err) {
          try {
            self.postMessage(`worker-error: Failed to post to engine: ${err && err.message ? err.message : err}`);
          } catch {}
        }
      };

      sendLoaded();
    } catch (err) {
      try {
        self.postMessage(`worker-error: Failed to initialize factory engine: ${err && err.message ? err.message : err}`);
      } catch {}
    }
  } else {
    // Worker-style build:
    // The imported /stockfish.js has already set self.onmessage and uses self.postMessage natively.
    // Messages sent to this worker instance will be handled by Stockfish directly.
    sendLoaded();
  }
})();

