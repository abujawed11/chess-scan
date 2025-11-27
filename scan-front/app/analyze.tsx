// app/analyze.tsx
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Chess } from 'chess.js';
import ChessBoard from '@/components/chess/ChessBoard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fenToPosition } from '@/utils/fen';
import { GameMode } from '@/types/chess';
import { getBestMove, createChessGame, makeMove, getGameStatus } from '@/services/chessEngine';

export default function Analyze() {
  const { fen, mode } = useLocalSearchParams<{ fen?: string; mode?: GameMode }>();

  const [game, setGame] = useState<Chess>(() => createChessGame(fen));
  const [position, setPosition] = useState(() => fenToPosition(fen || ''));
  const [loading, setLoading] = useState(false);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState(() => getGameStatus(game));
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const gameMode = (mode as GameMode) || 'analyze';
  const isPlayerTurn =
    (gameMode === 'play-white' && game.turn() === 'w') ||
    (gameMode === 'play-black' && game.turn() === 'b');

  useEffect(() => {
    if (gameMode === 'analyze') {
      analyzePosition();
    } else if (!isPlayerTurn && !gameStatus.isGameOver) {
      makeEngineMove();
    }
  }, [game.fen()]);

  const analyzePosition = async () => {
    setLoading(true);
    try {
      const result = await getBestMove(game.fen());
      setBestMove(result.bestMove);
      setEvaluation(result.evaluation);

      // Highlight best move
      if (result.bestMove.length >= 4) {
        const from = result.bestMove.substring(0, 2);
        const to = result.bestMove.substring(2, 4);
        setHighlightedSquares([from, to]);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const makeEngineMove = async () => {
    setLoading(true);
    try {
      const result = await getBestMove(game.fen());

      if (result.bestMove.length >= 4) {
        const from = result.bestMove.substring(0, 2);
        const to = result.bestMove.substring(2, 4);

        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        const moved = makeMove(game, { from, to });
        if (moved) {
          setPosition(fenToPosition(game.fen()));
          setGameStatus(getGameStatus(game));
          setMoveHistory(prev => [...prev, result.bestMove]);
          setHighlightedSquares([from, to]);
        }
      }
    } catch (error) {
      console.error('Engine move error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSquarePress = (square: string) => {
    if (gameMode === 'analyze' || gameMode === 'watch' || !isPlayerTurn || gameStatus.isGameOver) {
      return;
    }

    if (selectedSquare) {
      // Try to make a move
      const moved = makeMove(game, { from: selectedSquare, to: square });
      if (moved) {
        setPosition(fenToPosition(game.fen()));
        setGameStatus(getGameStatus(game));
        setMoveHistory(prev => [...prev, `${selectedSquare}${square}`]);
        setHighlightedSquares([selectedSquare, square]);
        setSelectedSquare(null);
      } else {
        // Invalid move, try selecting a new piece
        const piece = position[square];
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      // Select a piece
      const piece = position[square];
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    }
  };

  const handleReset = () => {
    const newGame = createChessGame(fen);
    setGame(newGame);
    setPosition(fenToPosition(fen || ''));
    setGameStatus(getGameStatus(newGame));
    setMoveHistory([]);
    setBestMove(null);
    setEvaluation(null);
    setHighlightedSquares([]);
    setSelectedSquare(null);
  };

  const handleMakeBestMove = () => {
    if (!bestMove || bestMove.length < 4) return;

    const from = bestMove.substring(0, 2);
    const to = bestMove.substring(2, 4);

    const moved = makeMove(game, { from, to });
    if (moved) {
      setPosition(fenToPosition(game.fen()));
      setGameStatus(getGameStatus(game));
      setMoveHistory(prev => [...prev, bestMove]);
      setHighlightedSquares([from, to]);
      setBestMove(null);
      setEvaluation(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {gameMode === 'analyze' && '🔍 Analysis Mode'}
          {gameMode === 'play-white' && '♔ Playing as White'}
          {gameMode === 'play-black' && '♚ Playing as Black'}
          {gameMode === 'watch' && '👁 Watch Mode'}
        </Text>
        {isPlayerTurn && !gameStatus.isGameOver && (
          <Text style={styles.turnIndicator}>Your turn</Text>
        )}
      </View>

      <View style={styles.boardContainer}>
        <ChessBoard
          position={position}
          flipped={gameMode === 'play-black'}
          onSquarePress={handleSquarePress}
          selectedSquare={selectedSquare}
          highlightedSquares={highlightedSquares}
        />
      </View>

      {gameStatus.isGameOver && (
        <View style={styles.gameOverBanner}>
          <Text style={styles.gameOverText}>
            {gameStatus.isCheckmate && `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`}
            {gameStatus.isStalemate && 'Stalemate! Draw.'}
            {gameStatus.isDraw && !gameStatus.isStalemate && 'Draw!'}
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <LoadingSpinner message="Thinking..." size="small" />
        </View>
      )}

      {!loading && gameMode === 'analyze' && bestMove && (
        <View style={styles.analysisPanel}>
          <View style={styles.analysisRow}>
            <View style={styles.analysisStat}>
              <Text style={styles.analysisLabel}>Best Move</Text>
              <Text style={styles.analysisValue}>{bestMove}</Text>
            </View>
            <View style={styles.analysisStat}>
              <Text style={styles.analysisLabel}>Evaluation</Text>
              <Text style={styles.analysisValue}>
                {evaluation !== null ? (evaluation > 0 ? '+' : '') + evaluation.toFixed(2) : 'N/A'}
              </Text>
            </View>
          </View>
          <Button title="Make Best Move" onPress={handleMakeBestMove} />
        </View>
      )}

      <View style={styles.actions}>
        <Button title="Reset" onPress={handleReset} variant="secondary" style={{ flex: 1 }} />
        {gameMode === 'analyze' && (
          <Button title="Analyze" onPress={analyzePosition} loading={loading} style={{ flex: 1 }} />
        )}
        <Button title="Back" onPress={() => router.replace('/')} variant="outline" style={{ flex: 1 }} />
      </View>

      {moveHistory.length > 0 && (
        <View style={styles.historyPanel}>
          <Text style={styles.historyTitle}>Move History</Text>
          <Text style={styles.historyText}>{moveHistory.join(', ')}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  turnIndicator: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '600',
  },
  boardContainer: {
    marginBottom: 20,
  },
  gameOverBanner: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  gameOverText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400e',
    textAlign: 'center',
  },
  loadingContainer: {
    marginBottom: 20,
  },
  analysisPanel: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  analysisRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  analysisStat: {
    flex: 1,
  },
  analysisLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  historyPanel: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  historyText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#6b7280',
  },
});
