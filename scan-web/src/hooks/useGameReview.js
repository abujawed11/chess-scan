// src/hooks/useGameReview.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { parsePGN } from '../utils/pgn/pgnParser';
import { isBookMove, getOpeningProgression } from '../utils/pgn/openingBook';
import {
  classifyMoveQuality,
  getQualityStats,
  MOVE_QUALITY,
} from '../utils/pgn/moveQuality';

/**
 * Custom hook for managing game review state and functionality
 */
export function useGameReview() {
  const [gameData, setGameData] = useState(null);
  const [currentPly, setCurrentPly] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 0.5x, 1x, 2x
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);

  const playIntervalRef = useRef(null);
  const chessRef = useRef(new Chess());

  /**
   * Load a PGN string
   */
  const loadPGN = useCallback((pgnString) => {
    const parsed = parsePGN(pgnString);

    if (!parsed) {
      console.error('Failed to parse PGN');
      return false;
    }

    // Mark opening moves
    const openingInfo = getOpeningProgression(parsed.moves);
    const movesWithBook = parsed.moves.map(move => ({
      ...move,
      isBook: isBookMove(move.fenAfter, move.ply),
    }));

    const enhancedGameData = {
      ...parsed,
      moves: movesWithBook,
      openingInfo,
    };

    setGameData(enhancedGameData);
    setCurrentPly(0);
    setIsPlaying(false);

    // Set up initial position
    const chess = new Chess();
    if (parsed.initialFen && parsed.initialFen !== chess.fen()) {
      chess.load(parsed.initialFen);
    }
    chessRef.current = chess;
    setCurrentPosition(chess.fen());

    return true;
  }, []);

  /**
   * Navigate to a specific ply
   */
  const goToPly = useCallback((ply) => {
    if (!gameData) return;

    const targetPly = Math.max(0, Math.min(ply, gameData.totalPlies));
    setCurrentPly(targetPly);

    // Replay moves up to target ply
    const chess = new Chess();
    if (gameData.initialFen && gameData.initialFen !== chess.fen()) {
      chess.load(gameData.initialFen);
    }

    for (let i = 0; i < targetPly; i++) {
      const move = gameData.moves[i];
      try {
        chess.move(move.san);
      } catch (error) {
        console.error('Error replaying move:', move.san, error);
        break;
      }
    }

    chessRef.current = chess;
    setCurrentPosition(chess.fen());
  }, [gameData]);

  /**
   * Go to next move
   */
  const nextMove = useCallback(() => {
    if (!gameData || currentPly >= gameData.totalPlies) {
      setIsPlaying(false);
      return false;
    }

    goToPly(currentPly + 1);
    return true;
  }, [currentPly, gameData, goToPly]);

  /**
   * Go to previous move
   */
  const previousMove = useCallback(() => {
    if (currentPly <= 0) return;
    goToPly(currentPly - 1);
  }, [currentPly, goToPly]);

  /**
   * Go to start of game
   */
  const goToStart = useCallback(() => {
    goToPly(0);
  }, [goToPly]);

  /**
   * Go to end of game
   */
  const goToEnd = useCallback(() => {
    if (!gameData) return;
    goToPly(gameData.totalPlies);
  }, [gameData, goToPly]);

  /**
   * Toggle auto-play
   */
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  /**
   * Set play speed (0.5, 1, 2)
   */
  const setSpeed = useCallback((speed) => {
    setPlaySpeed(speed);
  }, []);

  /**
   * Auto-play effect
   */
  useEffect(() => {
    if (!isPlaying || !gameData) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      return;
    }

    // Calculate interval based on speed (base: 1000ms)
    const interval = 1000 / playSpeed;

    playIntervalRef.current = setInterval(() => {
      const hasNext = nextMove();
      if (!hasNext) {
        setIsPlaying(false);
      }
    }, interval);

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, playSpeed, nextMove, gameData]);

  /**
   * Analyze all moves in the game
   * This will be called with Stockfish integration
   */
  const analyzeGame = useCallback(async (analyzeFunction) => {
    if (!gameData || analyzing) return;

    setAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const analyzedMoves = [...gameData.moves];

      for (let i = 0; i < analyzedMoves.length; i++) {
        const move = analyzedMoves[i];

        // Skip if already marked as book
        if (move.isBook) {
          move.quality = MOVE_QUALITY.BOOK;
          move.evalDelta = 0;
          setAnalysisProgress(((i + 1) / analyzedMoves.length) * 100);
          continue;
        }

        // Analyze position before and after move
        try {
          const evalBefore = await analyzeFunction(move.fenBefore);
          const evalAfter = await analyzeFunction(move.fenAfter);

          // Calculate evaluation delta
          // From the perspective of the side that just moved
          const evalDelta = move.color === 'w'
            ? (evalBefore - evalAfter) // White's perspective
            : (evalAfter - evalBefore); // Black's perspective (flip)

          move.evaluation = evalAfter;
          move.evalDelta = evalDelta;
          move.quality = classifyMoveQuality(Math.abs(evalDelta), move.isBook);

          analyzedMoves[i] = move;
        } catch (error) {
          console.error('Error analyzing move:', i, error);
          move.quality = MOVE_QUALITY.UNSCORED;
        }

        setAnalysisProgress(((i + 1) / analyzedMoves.length) * 100);

        // Update game data incrementally
        setGameData(prev => ({
          ...prev,
          moves: [...analyzedMoves],
        }));
      }

      setAnalyzing(false);
      setAnalysisProgress(100);

      return analyzedMoves;
    } catch (error) {
      console.error('Error during game analysis:', error);
      setAnalyzing(false);
      return null;
    }
  }, [gameData, analyzing]);

  /**
   * Get current move object
   */
  const getCurrentMove = useCallback(() => {
    if (!gameData || currentPly === 0) return null;
    return gameData.moves[currentPly - 1];
  }, [gameData, currentPly]);

  /**
   * Get quality statistics
   */
  const getStats = useCallback(() => {
    if (!gameData) return null;
    return getQualityStats(gameData.moves);
  }, [gameData]);

  /**
   * Clear loaded game
   */
  const clearGame = useCallback(() => {
    setGameData(null);
    setCurrentPly(0);
    setIsPlaying(false);
    setAnalyzing(false);
    setAnalysisProgress(0);
    setCurrentPosition(null);
    chessRef.current = new Chess();
  }, []);

  return {
    // State
    gameData,
    currentPly,
    currentPosition,
    currentMove: getCurrentMove(),
    isPlaying,
    playSpeed,
    analyzing,
    analysisProgress,
    stats: getStats(),

    // Actions
    loadPGN,
    goToPly,
    nextMove,
    previousMove,
    goToStart,
    goToEnd,
    togglePlay,
    setSpeed,
    analyzeGame,
    clearGame,
  };
}
