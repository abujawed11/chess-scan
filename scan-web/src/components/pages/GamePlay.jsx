import { useState, useEffect, useCallback, useRef } from "react";
import { useChessGame } from "../../hooks/useChessGame";
import { useStockfish } from "../../hooks/useStockfish";
import ChessBoard from "../chess/ChessBoard";
import EvaluationBar from "../chess/EvaluationBar";
import MoveHistory from "../chess/MoveHistory";
import AnalysisPanel from "../chess/AnalysisPanel";
import Button from "../ui/Button";
import ModeCard from "../ui/ModeCard";
import { GAME_MODES, STOCKFISH_CONFIG } from "../../utils/constants";

export default function GamePlay({ initialFen, onBack }) {
  const [gameMode, setGameMode] = useState(null);
  const [playerColor, setPlayerColor] = useState('white');
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const lastAnalyzedFenRef = useRef(null);

  // Use custom hooks
  const {
    game,
    boardFen,
    selectedSquare,
    legalMoves,
    moveHistory,
    gameOver,
    result,
    onSquareClick,
    makeMove,
    undoMove,
    resetGame,
    checkGameStatus,
  } = useChessGame(initialFen);

  const {
    evaluation,
    bestMove,
    thinking,
    engineError,
    requestAnalysis,
    stopAnalysis,
    clearError,
  } = useStockfish();

  // Auto-trigger analysis when position changes (only in analyze mode)
  useEffect(() => {
    const currentFen = boardFen;

    // Only analyze if:
    // 1. Analysis is enabled
    // 2. Not currently thinking
    // 3. Game is not over
    // 4. Position has actually changed (prevent duplicate analysis)
    if (analysisEnabled && !thinking && !gameOver && currentFen !== lastAnalyzedFenRef.current) {
      console.log('🔄 Position changed, triggering analysis for:', currentFen);
      lastAnalyzedFenRef.current = currentFen;
      requestAnalysis(game.fen());
    }
  }, [analysisEnabled, boardFen, gameOver, thinking, requestAnalysis, game]);

  // Make computer move
  const makeComputerMove = useCallback(() => {
    if (!bestMove || gameOver) return;

    // Auto-enable analysis for computer modes
    if ((gameMode === GAME_MODES.HUMAN_VS_COMPUTER || gameMode === GAME_MODES.COMPUTER_VS_COMPUTER) && !analysisEnabled) {
      setAnalysisEnabled(true);
    }

    const from = bestMove.substring(0, 2);
    const to = bestMove.substring(2, 4);
    const promotion = bestMove.length > 4 ? bestMove[4] : undefined;

    const move = makeMove(from, to, promotion);
    if (move && analysisEnabled) {
      setTimeout(() => requestAnalysis(game.fen()), 100);
    }
  }, [bestMove, gameOver, gameMode, analysisEnabled, makeMove, game, requestAnalysis]);

  // Computer vs Computer auto-play
  useEffect(() => {
    if (gameMode === GAME_MODES.COMPUTER_VS_COMPUTER && !thinking && bestMove && !gameOver) {
      const timer = setTimeout(() => {
        makeComputerMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameMode, thinking, bestMove, gameOver, makeComputerMove]);

  // Human vs Computer: make computer move when it's computer's turn
  useEffect(() => {
    if (gameMode === GAME_MODES.HUMAN_VS_COMPUTER && !gameOver) {
      const currentTurn = game.turn() === 'w' ? 'white' : 'black';
      const isComputerTurn = currentTurn !== playerColor;

      if (isComputerTurn && !thinking && bestMove) {
        const timer = setTimeout(() => {
          makeComputerMove();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameMode, playerColor, game, gameOver, thinking, bestMove, makeComputerMove]);

  // Handle square click with game mode context
  const handleSquareClick = useCallback((square) => {
    const move = onSquareClick(square, playerColor, gameMode);
    if (move && analysisEnabled) {
      setTimeout(() => requestAnalysis(game.fen()), 100);
    }
  }, [onSquareClick, playerColor, gameMode, analysisEnabled, game, requestAnalysis]);

  // Get hint
  const getHint = useCallback(() => {
    if (bestMove) {
      const from = bestMove.substring(0, 2);
      handleSquareClick(from);
    }
  }, [bestMove, handleSquareClick]);

  // Start game
  const startGame = (mode, color = 'white') => {
    setGameMode(mode);
    setPlayerColor(color);
  };

  // Handle reset with mode context
  const handleReset = useCallback(() => {
    resetGame();
    setAnalysisEnabled(false);
    stopAnalysis();
  }, [resetGame, stopAnalysis]);

  // Mode selection screen
  if (!gameMode) {
    return (
      <div style={{
        padding: 20,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 48,
          maxWidth: 600,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 16,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ♟️ Chess Game
          </h1>

          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 32 }}>
            Choose your game mode
          </p>

          <div style={{ display: 'grid', gap: 16 }}>
            <ModeCard
              icon="👥"
              title="Human vs Human"
              description="Play against a friend locally"
              onClick={() => startGame(GAME_MODES.HUMAN_VS_HUMAN)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ModeCard
                icon="🤖"
                title="vs Computer (White)"
                description="You play as White"
                onClick={() => startGame(GAME_MODES.HUMAN_VS_COMPUTER, 'white')}
                compact
              />
              <ModeCard
                icon="🤖"
                title="vs Computer (Black)"
                description="You play as Black"
                onClick={() => startGame(GAME_MODES.HUMAN_VS_COMPUTER, 'black')}
                compact
              />
            </div>

            <ModeCard
              icon="🤖⚔️🤖"
              title="Computer vs Computer"
              description="Watch AI play itself"
              onClick={() => startGame(GAME_MODES.COMPUTER_VS_COMPUTER)}
            />
            <ModeCard
              icon="🔍"
              title="Analyze Position"
              description="Explore moves with Stockfish"
              onClick={() => startGame(GAME_MODES.ANALYZE)}
            />
          </div>

          <button
            onClick={onBack}
            style={{
              marginTop: 24,
              width: '100%',
              padding: 12,
              border: '2px solid #e5e7eb',
              borderRadius: 10,
              background: 'white',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            ← Back to Editor
          </button>
        </div>
      </div>
    );
  }

  // Get game mode title
  const getGameModeTitle = () => {
    switch (gameMode) {
      case GAME_MODES.HUMAN_VS_HUMAN:
        return '👥 Human vs Human';
      case GAME_MODES.HUMAN_VS_COMPUTER:
        return `🤖 Playing as ${playerColor === 'white' ? 'White ♔' : 'Black ♚'}`;
      case GAME_MODES.COMPUTER_VS_COMPUTER:
        return '🤖⚔️🤖 Computer vs Computer';
      case GAME_MODES.ANALYZE:
        return '🔍 Analysis Mode';
      default:
        return 'Chess Game';
    }
  };

  // Game screen
  return (
    <div style={{
      padding: 20,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        background: 'white',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: '2px solid #f0f0f0'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {getGameModeTitle()}
            </h2>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              {game.turn() === 'w' ? "White's turn" : "Black's turn"}
              {game.isCheck() && <span style={{ color: '#ef4444', fontWeight: 600 }}> • CHECK!</span>}
            </div>
            <div style={{ 
              fontSize: 12, 
              color: '#9ca3af', 
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>🤖</span>
              <span>{STOCKFISH_CONFIG.VERSION} ({STOCKFISH_CONFIG.VARIANT})</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {/* Start/Stop Analysis Button */}
            {!analysisEnabled ? (
              <Button
                onClick={() => {
                  console.log('🟢 Start Analysis button clicked');
                  setAnalysisEnabled(true);
                }}
                variant="success"
              >
                ▶️ Start Analysis
              </Button>
            ) : (
              <Button
                onClick={() => {
                  console.log('🔴 Stop Analysis button clicked');
                  stopAnalysis();
                  setAnalysisEnabled(false);
                }}
                variant="danger"
              >
                ⏹️ Stop Analysis {thinking && '(Analyzing...)'}
              </Button>
            )}

            <Button onClick={undoMove} disabled={moveHistory.length === 0}>
              ↶ Undo
            </Button>
            <Button onClick={getHint} disabled={!bestMove || gameOver}>
              💡 Hint
            </Button>
            <Button onClick={handleReset}>
              ⟲ Reset
            </Button>
            <Button onClick={() => setGameMode(null)}>
              ← Back
            </Button>
          </div>
        </div>

        {/* Engine Error Notification */}
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
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 600, color: '#b91c1c', marginBottom: 4 }}>
                  Chess Engine Error
                </div>
                <div style={{ fontSize: 14, color: '#991b1b' }}>
                  {engineError}
                </div>
              </div>
            </div>
            <button
              onClick={clearError}
              style={{
                padding: '8px 16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
          {/* Board */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Evaluation Bar */}
            <EvaluationBar evaluation={evaluation} turn={game.turn()} />

            {/* Chess Board */}
            <ChessBoard
              position={game.board()}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null}
              bestMove={bestMove}
              showBestMoveArrow={gameMode === GAME_MODES.ANALYZE}
              onSquareClick={handleSquareClick}
              gameMode={gameMode}
            />

            {/* Best Move Display */}
            {bestMove && !gameOver && (
              <div style={{
                padding: 12,
                background: '#f0fdf4',
                border: '2px solid #10b981',
                borderRadius: 10,
                textAlign: 'center',
                fontWeight: 600,
                color: '#065f46'
              }}>
                💡 Best move: {bestMove.substring(0, 2)} → {bestMove.substring(2, 4)}
                {thinking && <span style={{ marginLeft: 8 }}>🤔 Analyzing...</span>}
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Game Status */}
            {gameOver && (
              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: 12,
                color: 'white',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: 16,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                🎉 Game Over!
                <div style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>
                  {result}
                </div>
              </div>
            )}

            {/* Move History */}
            <MoveHistory moves={moveHistory} />

            {/* Analysis Panel */}
            <AnalysisPanel
              evaluation={evaluation}
              moveCount={moveHistory.length}
              gameOver={gameOver}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
