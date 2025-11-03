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
  const analysisInProgressRef = useRef(false);
  const pendingAnalysisRef = useRef(null); // Store pending FEN to analyze after current one
  const analysisTimeoutRef = useRef(null);

  // Initialize Stockfish engine
  useEffect(() => {
    const engine = new StockfishClient(STOCKFISH_CONFIG.WORKER_PATH);
    engineRef.current = engine;

    // Listen to all engine lines and parse what we need
    const off = engine.onMessage((msg) => {
      console.log('🔧 Engine:', msg); // Debug all messages

      // Mark ready
      if (msg.includes('readyok')) engineReadyRef.current = true;

      // Best move
      if (msg.includes('bestmove')) {
        const m = msg.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
        if (m) {
          console.log('✅ Got bestmove:', m[1]);

          // Clear the safety timeout
          if (analysisTimeoutRef.current) {
            clearTimeout(analysisTimeoutRef.current);
            analysisTimeoutRef.current = null;
          }

          setBestMove(m[1]);
          setThinking(false);
          analysisInProgressRef.current = false;

          // Process pending analysis if there is one
          if (pendingAnalysisRef.current) {
            const pendingFen = pendingAnalysisRef.current;
            pendingAnalysisRef.current = null;
            console.log('📋 Processing pending analysis for:', pendingFen);

            // Delay to let engine settle, then analyze pending position
            setTimeout(() => {
              if (engineRef.current && !engineRef.current.hasCrashed()) {
                console.log('🎯 Starting queued analysis');
                analysisInProgressRef.current = true;
                setThinking(true);

                // Set new timeout for queued analysis
                analysisTimeoutRef.current = setTimeout(() => {
                  if (analysisInProgressRef.current) {
                    console.warn('⚠️ Queued analysis timeout');
                    engineRef.current?.stop();
                    setThinking(false);
                    analysisInProgressRef.current = false;
                  }
                }, 5000);

                setTimeout(() => {
                  engineRef.current.positionFen(pendingFen);
                  setTimeout(() => {
                    engineRef.current.goMovetime(1000);
                  }, 50);
                }, 200);
              }
            }, 100);
          }
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

    // Ensure UCI boot - wait for engine to be fully ready
    engine.waitReady()
      .then(() => {
        console.log('✅ Stockfish engine initialized and ready');
        // Send ucinewgame ONCE at initialization
        engine.ucinewgame();
        // Add a small delay to ensure WASM is fully initialized
        return new Promise(resolve => setTimeout(resolve, 100));
      })
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
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      pendingAnalysisRef.current = null;
      engineRef.current?.terminate();
      engineRef.current = null;
      engineReadyRef.current = false;
    };
  }, []);

  // Request analysis from Stockfish
  const requestAnalysis = useCallback((fen, depth = 10) => { // Use depth 10 for Lite build
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

    // If analysis is in progress, queue this request instead of interrupting
    if (analysisInProgressRef.current) {
      console.log('⏸️ Analysis in progress, queuing new position:', fen);
      pendingAnalysisRef.current = fen; // Only keep the LATEST position
      return;
    }

    try {
      console.log('🎯 Starting analysis for position:', fen);
      console.log('📊 Using depth:', depth);
      setThinking(true);
      setEngineError(null);
      analysisInProgressRef.current = true;

      // Clear any existing timeout
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      // Safety timeout: if no bestmove after 5 seconds, force stop
      analysisTimeoutRef.current = setTimeout(() => {
        if (analysisInProgressRef.current) {
          console.warn('⚠️ Analysis timeout - forcing stop');
          engine.stop();
          setThinking(false);
          analysisInProgressRef.current = false;

          // Process pending if exists
          if (pendingAnalysisRef.current) {
            const pending = pendingAnalysisRef.current;
            pendingAnalysisRef.current = null;
            setTimeout(() => requestAnalysis(pending), 100);
          }
        }
      }, 5000); // 5 second timeout

      // Stop any ongoing analysis
      engine.stop();

      // Wait longer for stop to complete before sending new commands
      setTimeout(() => {
        if (engine.hasCrashed && engine.hasCrashed()) {
          setEngineError('Chess engine has crashed. Please refresh the page.');
          setThinking(false);
          analysisInProgressRef.current = false;
          if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
          return;
        }

        console.log('📤 Sending position:', fen);
        engine.positionFen(fen);

        // Small delay between position and go to let engine process
        setTimeout(() => {
          // Use movetime instead of depth for more reliable analysis with Lite build
          console.log('📤 Sending go movetime 1000');
          engine.goMovetime(1000); // Analyze for 1 second instead of fixed depth
        }, 50);
      }, 300); // Increased delay from 200 to 300
    } catch (error) {
      console.error('Error during analysis:', error);
      setEngineError('Failed to start analysis. Please try again.');
      setThinking(false);
      analysisInProgressRef.current = false;
      if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
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
      analysisInProgressRef.current = false;
      pendingAnalysisRef.current = null; // Clear pending
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
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
