// src/components/pages/GameReview.jsx
import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { useGameReview } from '../../hooks/useGameReview';
import { useStockfish } from '../../hooks/useStockfish';
import ChessBoard from '../chess/ChessBoard';
import PGNImport from '../review/PGNImport';
import GameSummary from '../review/GameSummary';
import MoveListReview from '../review/MoveListReview';
import NavigationControls from '../review/NavigationControls';
import Button from '../ui/Button';

export default function GameReview({ onBack }) {
  const [showImport, setShowImport] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [importError, setImportError] = useState(null);

  const {
    gameData,
    currentPly,
    currentPosition,
    currentMove,
    isPlaying,
    playSpeed,
    stats,
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
  } = useGameReview();

  const {
    requestAnalysis: requestStockfishAnalysis,
    engineError,
    clearError,
  } = useStockfish();

  // Handle PGN import
  const handleImport = useCallback((pgnString) => {
    setImportError(null);
    const success = loadPGN(pgnString);
    if (success) {
      setShowImport(false);
    } else {
      setImportError('Failed to parse PGN. Please check the format and try again.');
    }
  }, [loadPGN]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showImport) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          previousMove();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextMove();
          break;
        case 'Home':
          e.preventDefault();
          goToStart();
          break;
        case 'End':
          e.preventDefault();
          goToEnd();
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showImport, previousMove, nextMove, goToStart, goToEnd, togglePlay]);

  // Analyze game with Stockfish
  const handleAnalyzeGame = useCallback(async () => {
    if (!gameData || analyzing) return;

    setAnalyzing(true);

    // Create analysis function that uses Stockfish
    const analyzePosition = async (fen) => {
      return new Promise((resolve) => {
        // This is a simplified version - in reality, we'd need to wait for Stockfish
        // to complete analysis and return the evaluation
        // For now, we'll return a placeholder
        setTimeout(() => {
          resolve(Math.random() * 200 - 100); // Random eval for testing
        }, 100);
      });
    };

    await analyzeGame(analyzePosition);
    setAnalyzing(false);
  }, [gameData, analyzing, analyzeGame]);

  // Show import screen
  if (showImport || !gameData) {
    return (
      <PGNImport
        onImport={handleImport}
        onCancel={onBack}
        externalError={importError}
      />
    );
  }

  // Get current board position
  const chess = new Chess();
  if (currentPosition) {
    try {
      chess.load(currentPosition);
    } catch (error) {
      console.error('Error loading position:', error);
    }
  }

  return (
    <div style={{
      padding: 20,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        background: 'white',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: '2px solid #f0f0f0',
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              📋 PGN Game Review
            </h2>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              {gameData.tags.white} vs {gameData.tags.black}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {!analyzing && !stats?.white?.accuracy && (
              <Button onClick={handleAnalyzeGame} variant="success">
                🔍 Analyze Game
              </Button>
            )}

            {analyzing && (
              <div style={{
                padding: '8px 16px',
                background: '#fef3c7',
                borderRadius: 8,
                color: '#92400e',
                fontWeight: 600,
                fontSize: 14,
              }}>
                ⏳ Analyzing...
              </div>
            )}

            <Button
              onClick={() => {
                clearGame();
                setShowImport(true);
              }}
            >
              📁 New PGN
            </Button>

            <Button onClick={onBack}>
              ← Back
            </Button>
          </div>
        </div>

        {/* Engine Error */}
        {engineError && (
          <div style={{
            padding: 16,
            marginBottom: 16,
            background: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ color: '#b91c1c' }}>
              ⚠️ {engineError}
            </div>
            <button
              onClick={clearError}
              style={{
                padding: '6px 12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: 24,
        }}>
          {/* Left: Board and Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Chess Board */}
            <ChessBoard
              position={chess.board()}
              onSquareClick={() => {}} // Read-only
              gameMode="analyze"
            />

            {/* Navigation Controls */}
            <NavigationControls
              isPlaying={isPlaying}
              playSpeed={playSpeed}
              currentPly={currentPly}
              totalPlies={gameData.totalPlies}
              onPrevious={previousMove}
              onNext={nextMove}
              onStart={goToStart}
              onEnd={goToEnd}
              onTogglePlay={togglePlay}
              onSpeedChange={setSpeed}
            />

            {/* Current Move Info */}
            {currentMove && (
              <div style={{
                padding: 16,
                background: '#f9fafb',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
              }}>
                <div style={{
                  fontSize: 14,
                  color: '#6b7280',
                  marginBottom: 8,
                }}>
                  {currentMove.color === 'w' ? 'White' : 'Black'}'s move {currentMove.moveNumber}:
                </div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: '#374151',
                }}>
                  {currentMove.san}
                </div>

                {currentMove.comment && (
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    background: '#eff6ff',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#1e40af',
                  }}>
                    💬 {currentMove.comment}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Summary and Move List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Game Summary */}
            <GameSummary gameData={gameData} stats={stats} />

            {/* Move List */}
            <div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 12,
                color: '#374151',
              }}>
                Move List
              </h3>
              <MoveListReview
                moves={gameData.moves}
                currentPly={currentPly}
                onMoveClick={goToPly}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
