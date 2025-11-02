import { Platform } from 'react-native';

export type StockfishAnalysis = {
  bestMove: string;
  evaluation: number; // pawns (+/-)
  depth: number;
  pv?: string[];
};

class StockfishClientImpl {
  private worker: Worker | null = null as any;
  private ready: boolean = false;
  private readyPromise: Promise<void> | null = null;
  private resolveReady: (() => void) | null = null;
  private rejectReady: ((err: any) => void) | null = null;

  private currentJobId = 0;
  private currentResolve: ((r: StockfishAnalysis) => void) | null = null;
  private currentReject: ((e: any) => void) | null = null;
  private lastEval: number | null = null;
  private lastDepth: number = 0;
  private lastPV: string[] | undefined;

  private ensureWorker() {
    if (this.worker) return;
    if (typeof Worker === 'undefined') {
      throw new Error('Web Worker is not available in this environment.');
    }
    const w = new Worker('/stockfish-loader.worker.js');
    this.worker = w as any;
    w.onmessage = (e: MessageEvent) => this.handleMessage(e);
  }

  private handleMessage(e: MessageEvent) {
    const text = typeof e.data === 'string' ? e.data : String((e as any).data || '');

    if (text.startsWith('worker-error') || text.startsWith('worker-unhandledrejection')) {
      if (this.currentReject) this.currentReject(new Error(text));
      if (this.rejectReady && !this.ready) this.rejectReady(new Error(text));
      return;
    }

    if (text.startsWith('Stockfish loaded')) {
      this.worker?.postMessage('uci');
      return;
    }

    if (text.startsWith('uciok')) {
      this.worker?.postMessage('isready');
      return;
    }

    if (text.startsWith('readyok')) {
      this.ready = true;
      if (this.resolveReady) this.resolveReady();
      this.resolveReady = null;
      this.rejectReady = null;
      return;
    }

    if (text.startsWith('info ')) {
      // Track depth/eval/pv for final result
      const { evalPawns, depth, pvMoves } = this.parseInfo(text);
      if (typeof depth === 'number') this.lastDepth = depth;
      if (Array.isArray(pvMoves) && pvMoves.length) this.lastPV = pvMoves;
      if (typeof evalPawns === 'number') this.lastEval = evalPawns;
      return;
    }

    if (text.startsWith('bestmove ')) {
      const parts = text.split(/\s+/);
      const move = parts[1] || '';
      if (this.currentResolve) {
        const result: StockfishAnalysis = {
          bestMove: move,
          evaluation: this.lastEval ?? 0,
          depth: this.lastDepth || 0,
          pv: this.lastPV,
        };
        this.currentResolve(result);
      }
      this.currentResolve = null;
      this.currentReject = null;
      return;
    }
  }

  private parseInfo(line: string) {
    const depthMatch = line.match(/\bdepth\s+(\d+)/);
    const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
    const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
    const pvSplit = line.split(/\bpv\s+/);
    const pvMoves = pvSplit.length > 1 ? pvSplit[1].trim().split(/\s+/) : [];

    const depth = depthMatch ? parseInt(depthMatch[1], 10) : undefined;
    let evalPawns: number | null = null;
    if (mateMatch) {
      const mateIn = parseInt(mateMatch[1], 10);
      evalPawns = mateIn > 0 ? 1000 : -1000;
    } else if (cpMatch) {
      evalPawns = parseInt(cpMatch[1], 10) / 100;
    }
    return { depth, evalPawns, pvMoves };
  }

  async ensureReady(): Promise<void> {
    if (this.ready) return;
    this.ensureWorker();
    if (!this.readyPromise) {
      this.readyPromise = new Promise<void>((resolve, reject) => {
        this.resolveReady = resolve;
        this.rejectReady = reject;
      });
      // ping until ready, to cover slow starts
      const ping = () => this.worker?.postMessage('isready');
      const interval = setInterval(ping, 1000);
      try {
        await this.readyPromise;
      } finally {
        clearInterval(interval);
      }
    }
    return this.readyPromise;
  }

  async analyzeFEN(fen: string, depth: number, multiPV: number = 1): Promise<StockfishAnalysis> {
    if (Platform.OS !== 'web') {
      throw new Error('Stockfish worker is only available on web.');
    }
    await this.ensureReady();
    this.currentJobId += 1;
    this.lastEval = null;
    this.lastDepth = 0;
    this.lastPV = undefined;

    const jobId = this.currentJobId;

    return new Promise<StockfishAnalysis>((resolve, reject) => {
      this.currentResolve = (result) => {
        // ensure this is the latest job
        if (jobId === this.currentJobId) {
          resolve(result);
        }
      };
      this.currentReject = (err) => {
        if (jobId === this.currentJobId) {
          reject(err);
        }
      };

      try {
        this.worker?.postMessage('stop');
        this.worker?.postMessage('ucinewgame');
        this.worker?.postMessage(`setoption name MultiPV value ${multiPV}`);
        this.worker?.postMessage(`position fen ${fen}`);
        this.worker?.postMessage(`go depth ${depth}`);
      } catch (err) {
        reject(err);
      }
    });
  }

  terminate() {
    try {
      this.worker?.terminate();
    } catch {}
    this.worker = null as any;
    this.ready = false;
    this.readyPromise = null;
    this.resolveReady = null;
    this.rejectReady = null;
  }
}

export const StockfishClient = new StockfishClientImpl();

