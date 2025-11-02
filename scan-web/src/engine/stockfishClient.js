// src/utils/stockfishClient.js
export class StockfishClient {
  constructor(path = '/stockfish.js') {
    this.worker = new Worker(path);
    this._listeners = new Set();
    this._ready = false;
    this._resolver = null;

    this.worker.onmessage = (e) => {
      const msg = String(e.data);
      // Forward every line to listeners
      for (const fn of this._listeners) fn(msg);

      // Basic UCI boot sequence
      if (msg.includes('Stockfish')) {
        this.worker.postMessage('uci');
      } else if (msg.includes('uciok')) {
        this.worker.postMessage('isready');
      } else if (msg.includes('readyok')) {
        this._ready = true;
        if (this._resolver) {
          this._resolver();
          this._resolver = null;
        }
      }
    };
  }

  onMessage(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }
  waitReady() { return this._ready ? Promise.resolve() : new Promise(res => (this._resolver = res)); }

  // convenience commands
  ucinewgame()      { this.worker.postMessage('ucinewgame'); }
  stop()            { this.worker.postMessage('stop'); }
  setOption(n, v)   { this.worker.postMessage(`setoption name ${n} value ${v}`); }
  positionFen(fen)  { this.worker.postMessage(`position fen ${fen}`); }
  goDepth(d)        { this.worker.postMessage(`go depth ${d}`); }
  goMovetime(ms)    { this.worker.postMessage(`go movetime ${ms}`); }
  terminate()       { this.worker.terminate(); }
}
