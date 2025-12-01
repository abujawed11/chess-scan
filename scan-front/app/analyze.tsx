// app/analyze.tsx - Advanced Analysis Mode
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, BackHandler, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chess } from 'chess.js';
import ChessBoard from '@/components/chess/ChessBoard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { fenToPosition } from '@/utils/fen';
import { GameMode } from '@/types/chess';
import { getBestMove, createChessGame, makeMove, getGameStatus } from '@/services/chessEngine';

interface Move {
  from: string;
  to: string;
  san: string;
  fen: string;
  evaluation?: number | null;
  bestMove?: string | null;
}

interface EngineLine {
  pv: string[];
  evaluation: number;
  mate: number | null;
  pvSan?: string;
}

// Simple horizontal evaluation bar for mobile
const MAX_ABS_EVAL = 5; // show full bar at ±5 pawns

type EvaluationBarProps = {
  // evaluation should be from White's perspective: >0 = White better, <0 = Black better
  evaluation: number | null;
};

const EvaluationBar: React.FC<EvaluationBarProps> = ({ evaluation }) => {
  // If no eval yet, treat as equal
  let ev = evaluation ?? 0;

  // Treat "mate" values specially (you use |ev| > 90 for mate in formatEvaluation)
  if (Math.abs(ev) > 90) {
    ev = ev > 0 ? MAX_ABS_EVAL : -MAX_ABS_EVAL;
  }

  // Clamp to [-MAX_ABS_EVAL, MAX_ABS_EVAL]
  const clamped = Math.max(-MAX_ABS_EVAL, Math.min(MAX_ABS_EVAL, ev));

  // Fractions for each side (0 → 1)
  const whiteFrac = clamped > 0 ? clamped / MAX_ABS_EVAL : 0;
  const blackFrac = clamped < 0 ? -clamped / MAX_ABS_EVAL : 0;

  return (
    <View style={styles.evalBarContainer}>
      <View style={styles.evalBarTrack}>
        {/* Black side (left) */}
        <View style={styles.evalHalf}>
          <View
            style={[
              styles.evalBlackFill,
              { width: `${blackFrac * 100}%` },
            ]}
          />
        </View>

        {/* White side (right) */}
        <View style={styles.evalHalf}>
          <View
            style={[
              styles.evalWhiteFill,
              { width: `${whiteFrac * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.evalBarLabelsRow}>
        <Text style={styles.evalLabel}>Black</Text>
        <Text style={styles.evalLabel}>Equal</Text>
        <Text style={styles.evalLabel}>White</Text>
      </View>
    </View>
  );
};




export default function Analyze() {
  const { fen, mode } = useLocalSearchParams<{ fen?: string; mode?: GameMode }>();

  const initialFen = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const [game, setGame] = useState<Chess>(() => createChessGame(initialFen));
  const [position, setPosition] = useState(() => fenToPosition(initialFen));
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [engineLines, setEngineLines] = useState<EngineLine[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState(() => getGameStatus(game));
  const [moves, setMoves] = useState<Move[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  // Promotion state
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);

  // Settings
  const [flipped, setFlipped] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [showBestMove, setShowBestMove] = useState(false);
  const [analysisDepth, setAnalysisDepth] = useState(15);

  const gameMode = (mode as GameMode) || 'analyze';
  const isPlayerTurn =
    (gameMode === 'play-white' && game.turn() === 'w') ||
    (gameMode === 'play-black' && game.turn() === 'b');

  // Handle hardware back button (Android)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // Auto-analyze when position changes
  useEffect(() => {
    if (autoAnalyze && !loading && !gameStatus.isGameOver && currentMoveIndex === moves.length - 1) {
      analyzePosition();
    }
  }, [game.fen(), autoAnalyze]);

  // Update highlighted squares when showBestMove toggle changes
  useEffect(() => {
    if (showBestMove && bestMove && bestMove.length >= 4) {
      const from = bestMove.substring(0, 2);
      const to = bestMove.substring(2, 4);
      setHighlightedSquares([from, to]);
    } else {
      setHighlightedSquares([]);
    }
  }, [showBestMove, bestMove]);

  const analyzePosition = async () => {
    if (gameStatus.isGameOver) return;

    setLoading(true);
    try {
      const result = await getBestMove(game.fen(), analysisDepth);
      setBestMove(result.bestMove);
      setEvaluation(result.evaluation);

      // Store engine lines (simplified for mobile)
      if (result.pv && result.pv.length > 0) {
        setEngineLines([{
          pv: result.pv,
          evaluation: result.evaluation,
          mate: null,
          pvSan: formatPVtoSAN(result.pv, game.fen())
        }]);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Analysis Error', error instanceof Error ? error.message : 'Failed to analyze position');
    } finally {
      setLoading(false);
    }
  };

  const formatPVtoSAN = (pv: string[], fen: string): string => {
    try {
      const tempGame = new Chess(fen);
      const sanMoves: string[] = [];
      for (let i = 0; i < Math.min(pv.length, 6); i++) {
        const uci = pv[i];
        const from = uci.substring(0, 2);
        const to = uci.substring(2, 4);
        const promotion = uci.length > 4 ? uci[4] : undefined;
        const move = tempGame.move({ from, to, promotion: promotion as any });
        if (move) {
          sanMoves.push(move.san);
        } else {
          break;
        }
      }
      return sanMoves.join(' ');
    } catch {
      return pv.slice(0, 6).join(' ');
    }
  };

  const makeEngineMove = async () => {
    if (gameStatus.isGameOver) return;

    setLoading(true);
    try {
      const result = await getBestMove(game.fen(), analysisDepth);

      if (result.bestMove.length >= 4) {
        const from = result.bestMove.substring(0, 2);
        const to = result.bestMove.substring(2, 4);
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          const moveResult = game.move({ from, to });
          if (moveResult) {
            const newMove: Move = {
              from,
              to,
              san: moveResult.san,
              fen: game.fen(),
              evaluation: result.evaluation,
              bestMove: result.bestMove
            };

            setMoves(prev => [...prev, newMove]);
            setCurrentMoveIndex(prev => prev + 1);
            setPosition(fenToPosition(game.fen()));
            setGameStatus(getGameStatus(game));
            setHighlightedSquares([from, to]);
          }
        } catch (moveError) {
          console.error('Invalid engine move:', moveError);
        }
      }
    } catch (error) {
      console.error('Engine move error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if a move is a pawn promotion
  const isPromotionMove = (from: string, to: string): boolean => {
    const piece = position[from];
    if (!piece || piece.type !== 'p') return false;

    const toRank = to[1];
    return (piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1');
  };

  // Execute a move with promotion handling
  const executeMove = (from: string, to: string, promotion?: string) => {
    try {
      const moveResult = game.move({ from, to, promotion: promotion as any });
      if (moveResult) {
        const newMove: Move = {
          from,
          to,
          san: moveResult.san,
          fen: game.fen(),
        };

        setMoves(prev => [...prev.slice(0, currentMoveIndex + 1), newMove]);
        setCurrentMoveIndex(prev => prev + 1);
        setPosition(fenToPosition(game.fen()));
        setGameStatus(getGameStatus(game));
        setHighlightedSquares([from, to]);
        setSelectedSquare(null);
        return true;
      }
    } catch (error) {
      console.log('Invalid move attempted:', from, 'to', to);
    }
    return false;
  };

  // Handle promotion piece selection
  const handlePromotion = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (promotionMove) {
      executeMove(promotionMove.from, promotionMove.to, piece);
      setShowPromotionDialog(false);
      setPromotionMove(null);
    }
  };

  const handleSquarePress = (square: string) => {
    if (gameMode === 'analyze') {
      // In analyze mode, allow piece dragging for exploration
      if (selectedSquare) {
        // Check if this is a pawn promotion
        if (isPromotionMove(selectedSquare, square)) {
          setPromotionMove({ from: selectedSquare, to: square });
          setShowPromotionDialog(true);
          return;
        }

        // Try to execute the move
        const success = executeMove(selectedSquare, square);
        if (!success) {
          // Invalid move - try selecting a different piece
          const piece = position[square];
          if (piece && piece.color === game.turn()) {
            setSelectedSquare(square);
          } else {
            setSelectedSquare(null);
          }
        }
      } else {
        const piece = position[square];
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
        }
      }
      return;
    }

    if (gameMode === 'watch' || !isPlayerTurn || gameStatus.isGameOver) {
      return;
    }

    // Play mode logic
    if (selectedSquare) {
      // Check if this is a pawn promotion
      if (isPromotionMove(selectedSquare, square)) {
        setPromotionMove({ from: selectedSquare, to: square });
        setShowPromotionDialog(true);
        return;
      }

      // Try to execute the move
      const success = executeMove(selectedSquare, square);
      if (!success) {
        // Invalid move - try selecting a different piece
        const piece = position[square];
        if (piece && piece.color === game.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      const piece = position[square];
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    }
  };

  const navigateToMove = useCallback((index: number) => {
    if (index < -1 || index >= moves.length) return;

    const newGame = createChessGame(initialFen);

    if (index >= 0) {
      try {
        for (let i = 0; i <= index; i++) {
          const move = moves[i];
          newGame.move({ from: move.from, to: move.to });
        }
      } catch (error) {
        console.error('Error replaying moves:', error);
        return;
      }
    }

    setGame(newGame);
    setPosition(fenToPosition(newGame.fen()));
    setGameStatus(getGameStatus(newGame));
    setCurrentMoveIndex(index);

    if (index >= 0) {
      setHighlightedSquares([moves[index].from, moves[index].to]);
      setEvaluation(moves[index].evaluation || null);
      setBestMove(moves[index].bestMove || null);
    } else {
      setHighlightedSquares([]);
      setEvaluation(null);
      setBestMove(null);
    }
  }, [moves, initialFen]);

  const handleReset = () => {
    const newGame = createChessGame(initialFen);
    setGame(newGame);
    setPosition(fenToPosition(initialFen));
    setGameStatus(getGameStatus(newGame));
    setMoves([]);
    setCurrentMoveIndex(-1);
    setBestMove(null);
    setEvaluation(null);
    setEngineLines([]);
    setHighlightedSquares([]);
    setSelectedSquare(null);
  };

  const handleMakeBestMove = () => {
    if (!bestMove || bestMove.length < 4) return;

    const from = bestMove.substring(0, 2);
    const to = bestMove.substring(2, 4);

    try {
      const moveResult = game.move({ from, to });
      if (moveResult) {
        const newMove: Move = {
          from,
          to,
          san: moveResult.san,
          fen: game.fen(),
          evaluation,
          bestMove
        };

        setMoves(prev => [...prev.slice(0, currentMoveIndex + 1), newMove]);
        setCurrentMoveIndex(prev => prev + 1);
        setPosition(fenToPosition(game.fen()));
        setGameStatus(getGameStatus(game));
        setHighlightedSquares([from, to]);
        setBestMove(null);
        setEvaluation(null);
      }
    } catch (error) {
      console.error('Failed to make best move:', error);
      Alert.alert('Invalid Move', 'The suggested move is not valid in the current position.');
    }
  };

  // Engine move effect for play modes
  useEffect(() => {
    if (gameMode !== 'analyze' && !isPlayerTurn && !gameStatus.isGameOver && currentMoveIndex === moves.length - 1) {
      const timer = setTimeout(() => {
        makeEngineMove();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game.fen(), isPlayerTurn, gameMode]);

  const formatEvaluation = (ev: number | null): string => {
    if (ev === null) return 'N/A';
    if (Math.abs(ev) > 90) return ev > 0 ? 'M+' : 'M-'; // Mate
    return (ev > 0 ? '+' : '') + ev.toFixed(2);
  };

  const getEvaluationColor = (ev: number | null): string => {
    if (ev === null) return '#6b7280';
    if (ev > 2) return '#16a34a'; // Green for white advantage
    if (ev < -2) return '#dc2626'; // Red for black advantage
    return '#6b7280'; // Gray for equal
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Settings Bar */}
      <View style={styles.settingsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.settingsScroll}>
          <Pressable
            style={[styles.settingToggle, autoAnalyze && styles.settingActive]}
            onPress={() => setAutoAnalyze(!autoAnalyze)}
          >
            <Text style={[styles.settingText, autoAnalyze && styles.settingTextActive]}>
              Auto-Analyze {autoAnalyze ? '✓' : ''}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.settingToggle, showBestMove && styles.settingActive]}
            onPress={() => setShowBestMove(!showBestMove)}
          >
            <Text style={[styles.settingText, showBestMove && styles.settingTextActive]}>
              Show Hint {showBestMove ? '✓' : ''}
            </Text>
          </Pressable>

          <Pressable style={styles.settingToggle} onPress={() => setFlipped(!flipped)}>
            <Text style={styles.settingText}>Flip ↻</Text>
          </Pressable>

          <View style={styles.depthSelector}>
            <Text style={styles.depthLabel}>Depth:</Text>
            {[10, 12, 15, 18, 20].map(d => (
              <Pressable
                key={d}
                style={[styles.depthButton, analysisDepth === d && styles.depthActive]}
                onPress={() => setAnalysisDepth(d)}
              >
                <Text style={[styles.depthText, analysisDepth === d && styles.depthTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {gameMode === 'analyze' && '🔍 Analysis'}
              {gameMode === 'play-white' && '♔ Playing White'}
              {gameMode === 'play-black' && '♚ Playing Black'}
              {gameMode === 'watch' && '👁 Watch'}
            </Text>
            {loading && (
              <View style={styles.headerLoading}>
                <LoadingSpinner message="Analyzing..." size="small" />
              </View>
            )}
            {isPlayerTurn && !gameStatus.isGameOver && (
              <Text style={styles.turnIndicator}>Your turn</Text>
            )}
          </View>

        </View>

        {/* Board */}
        <View style={styles.boardContainer}>
          <ChessBoard
            position={position}
            flipped={flipped || gameMode === 'play-black'}
            onSquarePress={handleSquarePress}
            selectedSquare={selectedSquare}
            highlightedSquares={highlightedSquares}
            arrows={
              autoAnalyze && bestMove && bestMove.length >= 4
                ? [{ from: bestMove.substring(0, 2), to: bestMove.substring(2, 4) }]
                : []
            }
          />
        </View>

        {/* Promotion Dialog */}
        <Modal
          visible={showPromotionDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPromotionDialog(false)}
        >
          <View style={styles.promotionOverlay}>
            <View style={styles.promotionDialog}>
              <Text style={styles.promotionTitle}>Promote Pawn</Text>
              <View style={styles.promotionOptions}>
                <Pressable style={styles.promotionButton} onPress={() => handlePromotion('q')}>
                  <Text style={styles.promotionPiece}>♕</Text>
                  <Text style={styles.promotionLabel}>Queen</Text>
                </Pressable>
                <Pressable style={styles.promotionButton} onPress={() => handlePromotion('r')}>
                  <Text style={styles.promotionPiece}>♖</Text>
                  <Text style={styles.promotionLabel}>Rook</Text>
                </Pressable>
                <Pressable style={styles.promotionButton} onPress={() => handlePromotion('b')}>
                  <Text style={styles.promotionPiece}>♗</Text>
                  <Text style={styles.promotionLabel}>Bishop</Text>
                </Pressable>
                <Pressable style={styles.promotionButton} onPress={() => handlePromotion('n')}>
                  <Text style={styles.promotionPiece}>♘</Text>
                  <Text style={styles.promotionLabel}>Knight</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Move Navigation */}
        <View style={styles.navigationBar}>
          <Pressable
            style={[styles.navButton, currentMoveIndex === -1 && styles.navButtonDisabled]}
            onPress={() => navigateToMove(-1)}
            disabled={currentMoveIndex === -1}
          >
            <Text style={styles.navButtonText}>⏮</Text>
          </Pressable>
          <Pressable
            style={[styles.navButton, currentMoveIndex === -1 && styles.navButtonDisabled]}
            onPress={() => navigateToMove(currentMoveIndex - 1)}
            disabled={currentMoveIndex === -1}
          >
            <Text style={styles.navButtonText}>◀</Text>
          </Pressable>

          <View style={styles.moveCounter}>
            <Text style={styles.moveCounterText}>
              {currentMoveIndex + 1} / {moves.length || 'Start'}
            </Text>
          </View>

          <Pressable
            style={[styles.navButton, currentMoveIndex === moves.length - 1 && styles.navButtonDisabled]}
            onPress={() => navigateToMove(currentMoveIndex + 1)}
            disabled={currentMoveIndex === moves.length - 1}
          >
            <Text style={styles.navButtonText}>▶</Text>
          </Pressable>
          <Pressable
            style={[styles.navButton, currentMoveIndex === moves.length - 1 && styles.navButtonDisabled]}
            onPress={() => navigateToMove(moves.length - 1)}
            disabled={currentMoveIndex === moves.length - 1}
          >
            <Text style={styles.navButtonText}>⏭</Text>
          </Pressable>
        </View>

        {/* Game Over Banner */}
        {gameStatus.isGameOver && (
          <View style={styles.gameOverBanner}>
            <Text style={styles.gameOverText}>
              {gameStatus.isCheckmate && `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`}
              {gameStatus.isStalemate && 'Stalemate! Draw.'}
              {gameStatus.isDraw && !gameStatus.isStalemate && 'Draw!'}
            </Text>
          </View>
        )}

        {/* Evaluation & Best Move */}
        {!gameStatus.isGameOver && (
          <View style={styles.infoPanel}>
            {/* NEW: horizontal evaluation bar */}
            <EvaluationBar evaluation={evaluation} />

            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Evaluation</Text>
                <Text style={[styles.infoValue, { color: getEvaluationColor(evaluation) }]}>
                  {formatEvaluation(evaluation)}
                </Text>
              </View>
              {bestMove && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Best Move</Text>
                  <Text style={styles.infoValue}>{bestMove}</Text>
                </View>
              )}
            </View>

            {gameMode === 'analyze' && bestMove && (
              <Button title="Make Best Move" onPress={handleMakeBestMove} size="sm" style={{ marginTop: 12 }} />
            )}
          </View>
        )}

        {/* {!gameStatus.isGameOver && (
          <View style={styles.infoPanel}>
            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Evaluation</Text>
                <Text style={[styles.infoValue, { color: getEvaluationColor(evaluation) }]}>
                  {formatEvaluation(evaluation)}
                </Text>
              </View>
              {bestMove && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoLabel}>Best Move</Text>
                  <Text style={styles.infoValue}>{bestMove}</Text>
                </View>
              )}
            </View>

            {gameMode === 'analyze' && bestMove && (
              <Button title="Make Best Move" onPress={handleMakeBestMove} size="sm" style={{ marginTop: 12 }} />
            )}
          </View>
        )} */}

        {/* Engine Lines */}
        {engineLines.length > 0 && (
          <View style={styles.linesPanel}>
            <Text style={styles.linesTitle}>Engine Analysis</Text>
            {engineLines.map((line, idx) => (
              <View key={idx} style={styles.line}>
                <Text style={styles.lineEval}>{formatEvaluation(line.evaluation)}</Text>
                <Text style={styles.linePV} numberOfLines={2}>{line.pvSan || line.pv.join(' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Move History */}
        {moves.length > 0 && (
          <View style={styles.historyPanel}>
            <Text style={styles.historyTitle}>Move History</Text>
            <View style={styles.historyMoves}>
              {moves.map((move, idx) => {
                const moveNumber = Math.floor(idx / 2) + 1;
                const isWhite = idx % 2 === 0;
                return (
                  <Pressable
                    key={idx}
                    style={[
                      styles.historyMove,
                      currentMoveIndex === idx && styles.historyMoveActive
                    ]}
                    onPress={() => navigateToMove(idx)}
                  >
                    {isWhite && <Text style={styles.moveNumber}>{moveNumber}.</Text>}
                    <Text style={[styles.moveSan, currentMoveIndex === idx && styles.moveSanActive]}>
                      {move.san}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button title="Reset" onPress={handleReset} variant="secondary" style={{ flex: 1 }} />
          {gameMode === 'analyze' && (
            <Button
              title="Analyze"
              onPress={analyzePosition}
              disabled={gameStatus.isGameOver || loading}
              style={{ flex: 1 }}
            />
          )}
          <Button title="Back" onPress={() => router.back()} variant="outline" style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({


  evalBarContainer: {
    marginBottom: 12,
  },
  evalBarTrack: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  evalHalf: {
    flex: 1,
    justifyContent: 'center',
  },
  evalBlackFill: {
    height: '100%',
    backgroundColor: '#dc2626', // red for Black advantage
    alignSelf: 'flex-end',      // fill from center towards left
  },
  evalWhiteFill: {
    height: '100%',
    backgroundColor: '#16a34a', // green for White advantage
    alignSelf: 'flex-start',    // fill from center towards right
  },
  evalBarLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  evalLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  settingsBar: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  settingsScroll: {
    paddingHorizontal: 12,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingToggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    minHeight: 36,
    justifyContent: 'center',
  },
  settingActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  settingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  settingTextActive: {
    color: '#fff',
  },
  depthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  depthLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 4,
  },
  depthButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    minWidth: 32,
    alignItems: 'center',
  },
  depthActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  depthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  depthTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLoading: {
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  turnIndicator: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  boardContainer: {
    marginBottom: 16,
  },
  navigationBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  navButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  navButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  moveCounter: {
    paddingHorizontal: 12,
  },
  moveCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  gameOverBanner: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  gameOverText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    textAlign: 'center',
  },
  infoPanel: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  linesPanel: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  linesTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  line: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  lineEval: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
    fontFamily: 'monospace',
    width: 50,
  },
  linePV: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  historyPanel: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  historyMoves: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyMove: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
    gap: 4,
  },
  historyMoveActive: {
    backgroundColor: '#3b82f6',
  },
  moveNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  moveSan: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  moveSanActive: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  promotionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promotionDialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  promotionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111827',
  },
  promotionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  promotionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  promotionPiece: {
    fontSize: 48,
    marginBottom: 8,
  },
  promotionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
});


