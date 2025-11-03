import { useEffect, useRef, useState, useCallback } from 'react';
import { StockfishClient } from '../engine/stockfishClient';
import { STOCKFISH_CONFIG } from '../utils/constants';

export function useStockfish() {
  const [evaluation, setEvaluation] = useState(0);
  const [bestMove, setBestMove] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [engineError, setEngineError] = useState(null);
  const engineRef = useRef(null);
  const engineReadyRef = useRef(false);

  // Initialize Stockfish engine
  useEffect(() => {
    const engine = new StockfishClient(STOCKFISH_CONFIG.WORKER_PATH);
    engineRef.current = engine;

    // Listen to all engine lines and parse what we need
    const off = engine.onMessage((msg) => {
      // Mark ready
      if (msg.includes('readyok')) engineReadyRef.current = true;

      // Best move
      if (msg.includes('bestmove')) {
        const m = msg.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
        if (m) {
          setBestMove(m[1]);
          setThinking(false);
        }
      }

      // Evaluation
      const cp = msg.match(/score cp (-?\d+)/);
      const mate = msg.match(/score mate (-?\d+)/);
      if (cp) setEvaluation(parseInt(cp[1], 10) / 100);
      if (mate) setEvaluation(parseInt(mate[1], 10) > 0 ? 100 : -100);
    });

    // Listen to engine errors
    const offError = engine.onError((errorData) => {
      console.error('Engine error:', errorData);
      setEngineError(errorData.message);
      setThinking(false);
    });

    // Ensure UCI boot
    engine.waitReady()
      .then(() => {
        engineReadyRef.current = true;
      })
      .catch((error) => {
        console.error('Engine failed to initialize:', error);
        setEngineError('Chess engine failed to start. Please refresh the page.');
      });

    return () => {
      off();
      offError();
      engineRef.current?.terminate();
      engineRef.current = null;
      engineReadyRef.current = false;
    };
  }, []);

  // Request analysis from Stockfish
  const requestAnalysis = useCallback((fen, depth = STOCKFISH_CONFIG.DEFAULT_DEPTH) => {
    const engine = engineRef.current;
    if (!engine) {
      console.log('❌ Engine not available');
      setEngineError('Chess engine is not available. Please refresh the page.');
      return;
    }

    // Check if engine has crashed
    if (engine.hasCrashed && engine.hasCrashed()) {
      console.log('❌ Engine has crashed');
      setEngineError('Chess engine has crashed. Please refresh the page to restart it.');
      return;
    }

    if (!engineReadyRef.current) {
      console.log('⏳ Engine not ready, waiting...');
      engine.waitReady()
        .then(() => {
          engineReadyRef.current = true;
          requestAnalysis(fen, depth);
        })
        .catch((error) => {
          console.error('Engine failed to become ready:', error);
          setEngineError('Chess engine failed to start. Please refresh the page.');
        });
      return;
    }

    try {
      console.log('🎯 Starting analysis for position:', fen);
      setThinking(true);
      setEngineError(null); // Clear any previous errors
      engine.stop();
      engine.ucinewgame();
      engine.setOption('MultiPV', STOCKFISH_CONFIG.MULTI_PV);
      engine.positionFen(fen);
      engine.goDepth(depth);
    } catch (error) {
      console.error('Error during analysis:', error);
      setEngineError('Failed to start analysis. Please try again.');
      setThinking(false);
    }
  }, []);

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    try {
      console.log('⏹️ Stopping analysis...');
      engine.stop();
      setThinking(false);
      setBestMove(null);
    } catch (error) {
      console.error('Error stopping analysis:', error);
      setEngineError('Failed to stop analysis.');
    }
  }, []);

  // Clear engine error
  const clearError = useCallback(() => {
    setEngineError(null);
  }, []);

  return {
    evaluation,
    bestMove,
    thinking,
    engineError,
    requestAnalysis,
    stopAnalysis,
    clearError,
  };
}
