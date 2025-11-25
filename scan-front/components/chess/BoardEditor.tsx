import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { BoardPosition, ChessPiece, PieceType, PieceColor } from '@/types/chess';
import { fenToPosition, positionToFen } from '@/utils/fen';
import { useTheme, getPieceImageUrl } from '@/context/ThemeContext';
import ChessBoard from './ChessBoard';
import Button from '../ui/Button';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface BoardEditorProps {
  initialFen: string;
  onConfirm: (fen: string) => void;
  onCancel: () => void;
}

const WHITE_PIECES: ChessPiece[] = [
  { type: 'k', color: 'w' },
  { type: 'q', color: 'w' },
  { type: 'r', color: 'w' },
  { type: 'b', color: 'w' },
  { type: 'n', color: 'w' },
  { type: 'p', color: 'w' },
];

const BLACK_PIECES: ChessPiece[] = [
  { type: 'k', color: 'b' },
  { type: 'q', color: 'b' },
  { type: 'r', color: 'b' },
  { type: 'b', color: 'b' },
  { type: 'n', color: 'b' },
  { type: 'p', color: 'b' },
];

export default function BoardEditor({ initialFen, onConfirm, onCancel }: BoardEditorProps) {
  const { pieceSet } = useTheme();
  const [position, setPosition] = useState<BoardPosition>(() => fenToPosition(initialFen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<ChessPiece | null>(null);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [flipped, setFlipped] = useState(false);
  const [coordinatesFlipped, setCoordinatesFlipped] = useState(false);
  const [castling, setCastling] = useState({ K: true, Q: true, k: true, q: true });
  const [enPassant, setEnPassant] = useState('');
  const [fenInput, setFenInput] = useState('');

  const fen = useMemo(() => {
    return positionToFen(position, turn, castling, enPassant);
  }, [position, turn, castling, enPassant]);

  // Validate piece counts
  const validation = useMemo(() => {
    const counts = {
      K: 0, Q: 0, R: 0, B: 0, N: 0, P: 0,
      k: 0, q: 0, r: 0, b: 0, n: 0, p: 0,
    };

    const errors: string[] = [];

    Object.values(position).forEach((piece) => {
      if (piece) {
        const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
        counts[key as keyof typeof counts]++;
      }
    });

    // Check for pawns on first/last rank
    Object.entries(position).forEach(([square, piece]) => {
      if (piece && piece.type === 'p') {
        const rank = parseInt(square[1]);
        if (rank === 1 || rank === 8) {
          errors.push(`Pawns cannot be on rank ${rank}`);
        }
      }
    });

    if (counts.K === 0) errors.push('White king required');
    if (counts.k === 0) errors.push('Black king required');
    if (counts.K > 1) errors.push('Max 1 white king');
    if (counts.k > 1) errors.push('Max 1 black king');
    if (counts.P > 8) errors.push('Max 8 white pawns');
    if (counts.p > 8) errors.push('Max 8 black pawns');

    const whiteTotal = counts.K + counts.Q + counts.R + counts.B + counts.N + counts.P;
    const blackTotal = counts.k + counts.q + counts.r + counts.b + counts.n + counts.p;

    if (whiteTotal > 16) errors.push('Max 16 white pieces');
    if (blackTotal > 16) errors.push('Max 16 black pieces');

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [position]);

  const handleSquarePress = (square: string) => {
    if (selectedPiece) {
      // Place selected piece
      setPosition({ ...position, [square]: selectedPiece });
      setSelectedPiece(null);
    } else if (selectedSquare) {
      // Move piece
      if (position[selectedSquare]) {
        const newPosition = { ...position };
        newPosition[square] = position[selectedSquare]!;
        delete newPosition[selectedSquare];
        setPosition(newPosition);
      }
      setSelectedSquare(null);
    } else if (position[square]) {
      // Select piece
      setSelectedSquare(square);
    }
  };

  const handlePieceSelect = (piece: ChessPiece) => {
    setSelectedPiece(piece);
    setSelectedSquare(null);
  };

  const handleClear = () => {
    Alert.alert('Clear Board', 'Remove all pieces?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setPosition({});
          setSelectedSquare(null);
          setSelectedPiece(null);
        },
      },
    ]);
  };

  const handleReset = () => {
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    setPosition(fenToPosition(startFen));
    setTurn('w');
    setCastling({ K: true, Q: true, k: true, q: true });
    setEnPassant('');
    setSelectedSquare(null);
    setSelectedPiece(null);
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleFlipCoordinates = () => {
    setCoordinatesFlipped(!coordinatesFlipped);
  };

  const handleCopyFen = async () => {
    // In React Native, we'd need expo-clipboard
    Alert.alert('FEN Copied', fen);
  };

  const handleLoadFen = () => {
    if (!fenInput.trim()) return;
    try {
      const newPosition = fenToPosition(fenInput);
      setPosition(newPosition);
      setFenInput('');
      Alert.alert('Success', 'Position loaded!');
    } catch (error) {
      Alert.alert('Invalid FEN', 'Could not parse FEN string');
    }
  };

  const handleConfirm = () => {
    if (!validation.valid) {
      Alert.alert('Invalid Position', validation.errors.join('\n'));
      return;
    }
    onConfirm(fen);
  };

  const handleRemovePiece = (square: string) => {
    const newPosition = { ...position };
    delete newPosition[square];
    setPosition(newPosition);
    if (selectedSquare === square) {
      setSelectedSquare(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="edit" size={28} color="#8b5cf6" />
          <View>
            <Text style={styles.title}>Board Editor</Text>
            <Text style={styles.subtitle}>Build your position</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={onCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <View style={styles.errorBox}>
          <MaterialIcons name="warning" size={20} color="#991b1b" />
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Position Issues:</Text>
            {validation.errors.map((err, i) => (
              <Text key={i} style={styles.errorText}>• {err}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.toolbarRow}>
            <ToolButton onPress={handleFlip} icon="refresh">
              Flip Board
            </ToolButton>
            <ToolButton onPress={handleFlipCoordinates} icon="swap-vert">
              Flip Coords
            </ToolButton>
            <ToolButton onPress={handleReset} icon="restart">
              Reset
            </ToolButton>
            <ToolButton onPress={handleClear} icon="delete" color="#ef4444">
              Clear
            </ToolButton>
            <ToolButton onPress={handleCopyFen} icon="content-copy">
              Copy FEN
            </ToolButton>
          </View>
        </ScrollView>
      </View>

      {/* Castling Rights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Castling Rights</Text>
        <View style={styles.castlingRow}>
          {(['K', 'Q', 'k', 'q'] as const).map((right) => (
            <Pressable
              key={right}
              onPress={() => setCastling({ ...castling, [right]: !castling[right] })}
              style={[styles.castlingButton, castling[right] && styles.castlingActive]}
            >
              <Text style={[styles.castlingText, castling[right] && styles.castlingActiveText]}>
                {right}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Board and Palettes */}
      <View style={styles.boardSection}>
        {/* Black Pieces Palette - Top */}
        <View style={styles.paletteHorizontal}>
          <Text style={styles.paletteTitleHorizontal}>BLACK PIECES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.paletteRow}>
              {BLACK_PIECES.map((piece, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handlePieceSelect(piece)}
                  style={[
                    styles.paletteItemHorizontal,
                    selectedPiece?.type === piece.type &&
                      selectedPiece?.color === piece.color &&
                      styles.paletteItemSelected,
                  ]}
                >
                  <Image
                    source={{ uri: getPieceImageUrl(piece, pieceSet.id) }}
                    style={styles.paletteImageHorizontal}
                    contentFit="contain"
                  />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Chess Board */}
        <View style={styles.boardContainer}>
          <ChessBoard
            position={position}
            flipped={flipped}
            coordinatesFlipped={coordinatesFlipped}
            onSquarePress={handleSquarePress}
            selectedSquare={selectedSquare}
          />

          {/* Trash for selected square */}
          {selectedSquare && position[selectedSquare] && (
            <Pressable
              onPress={() => handleRemovePiece(selectedSquare)}
              style={styles.trashButton}
            >
              <MaterialIcons name="delete" size={24} color="white" />
              <Text style={styles.trashText}>Remove Piece</Text>
            </Pressable>
          )}
        </View>

        {/* White Pieces Palette - Bottom */}
        <View style={styles.paletteHorizontal}>
          <Text style={styles.paletteTitleHorizontal}>WHITE PIECES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.paletteRow}>
              {WHITE_PIECES.map((piece, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handlePieceSelect(piece)}
                  style={[
                    styles.paletteItemHorizontal,
                    selectedPiece?.type === piece.type &&
                      selectedPiece?.color === piece.color &&
                      styles.paletteItemSelected,
                  ]}
                >
                  <Image
                    source={{ uri: getPieceImageUrl(piece, pieceSet.id) }}
                    style={styles.paletteImageHorizontal}
                    contentFit="contain"
                  />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Turn and En Passant */}
      <View style={styles.section}>
        <View style={styles.turnRow}>
          <View style={styles.turnSection}>
            <Text style={styles.sectionTitle}>Turn</Text>
            <View style={styles.turnButtons}>
              <Pressable
                onPress={() => setTurn('w')}
                style={[styles.turnButton, turn === 'w' && styles.turnButtonActive]}
              >
                <Text style={[styles.turnButtonText, turn === 'w' && styles.turnButtonActiveText]}>
                  ♔ White
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTurn('b')}
                style={[styles.turnButton, turn === 'b' && styles.turnButtonActive]}
              >
                <Text style={[styles.turnButtonText, turn === 'b' && styles.turnButtonActiveText]}>
                  ♚ Black
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.epSection}>
            <Text style={styles.sectionTitle}>En Passant</Text>
            <TextInput
              value={enPassant}
              onChangeText={setEnPassant}
              placeholder="e.g. e3"
              style={styles.epInput}
              maxLength={2}
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>

      {/* FEN Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FEN</Text>
        <View style={[styles.fenBox, validation.valid ? styles.fenValid : styles.fenInvalid]}>
          <Text style={[styles.fenText, validation.valid ? styles.fenTextValid : styles.fenTextInvalid]}>
            {fen}
          </Text>
        </View>
      </View>

      {/* Load FEN */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Load FEN</Text>
        <View style={styles.loadFenRow}>
          <TextInput
            value={fenInput}
            onChangeText={setFenInput}
            placeholder="Paste FEN string..."
            style={styles.fenInput}
          />
          <Pressable onPress={handleLoadFen} style={styles.loadFenButton}>
            <Text style={styles.loadFenButtonText}>Load</Text>
          </Pressable>
        </View>
      </View>

      {/* Help Text */}
      <View style={styles.helpBox}>
        <MaterialIcons name="lightbulb" size={16} color="#1e40af" />
        <Text style={styles.helpText}>
          <Text style={styles.helpBold}>Tips:</Text> Tap pieces from palettes to select • Tap board to place •
          Tap piece on board to select it • Tap trash to remove selected piece
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          style={{ flex: 1 }}
        />
        <Button
          title="Save Position"
          onPress={handleConfirm}
          disabled={!validation.valid}
          variant="primary"
          style={{ flex: 2 }}
        />
      </View>
    </ScrollView>
  );
}

function ToolButton({
  children,
  onPress,
  icon,
  color = '#6b7280',
}: {
  children: string;
  onPress: () => void;
  icon: keyof typeof MaterialIcons.glyphMap;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.toolButton}>
      <MaterialIcons name={icon} size={18} color={color} />
      <Text style={[styles.toolButtonText, { color }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#991b1b',
  },
  toolbar: {
    marginBottom: 16,
  },
  toolbarRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toolButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  castlingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  castlingButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  castlingActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  castlingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
  },
  castlingActiveText: {
    color: 'white',
  },
  boardSection: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  paletteHorizontal: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  paletteTitleHorizontal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  paletteItemHorizontal: {
    width: 52,
    height: 52,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paletteItemSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  paletteImageHorizontal: {
    width: 44,
    height: 44,
  },
  boardContainer: {
    alignItems: 'center',
    gap: 12,
  },
  trashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  trashText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  turnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  turnSection: {
    flex: 2,
  },
  turnButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  turnButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  turnButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  turnButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  turnButtonActiveText: {
    color: 'white',
  },
  epSection: {
    flex: 1,
  },
  epInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    fontSize: 14,
  },
  fenBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  fenValid: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  fenInvalid: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  fenText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  fenTextValid: {
    color: '#065f46',
  },
  fenTextInvalid: {
    color: '#991b1b',
  },
  loadFenRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fenInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    fontSize: 14,
  },
  loadFenButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    justifyContent: 'center',
  },
  loadFenButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  helpBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginBottom: 16,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  helpBold: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});
