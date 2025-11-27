import React, { useState, useMemo, useEffect } from 'react';
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
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import { BoardPosition, ChessPiece, PieceType, PieceColor } from '@/types/chess';
import { fenToPosition, positionToFen, inferCastlingRights, validateAndFixSide } from '@/utils/fen';
import { useTheme, getPieceImageUrl } from '@/context/ThemeContext';
import ChessBoard from './ChessBoard';
import Button from '../ui/Button';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface BoardEditorProps {
  initialFen: string;
  onConfirm: (fen: string) => void;
  onCancel: () => void;
  referenceImageUri?: string;
  boardCorners?: [[number, number], [number, number], [number, number], [number, number]] | string;
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

export default function BoardEditor({ 
  initialFen, 
  onConfirm, 
  onCancel,
  referenceImageUri,
  boardCorners 
}: BoardEditorProps) {
  const { pieceSet } = useTheme();
  const [position, setPosition] = useState<BoardPosition>(() => fenToPosition(initialFen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [showReferenceImage, setShowReferenceImage] = useState(true); // Show image by default
  const [croppedImageUri, setCroppedImageUri] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);

  // Auto-crop the image based on board corners when component mounts
  useEffect(() => {
    const cropImage = async () => {
      if (!referenceImageUri) {
        setCroppedImageUri(null);
        return;
      }

      // If no board corners, just use the original image
      if (!boardCorners) {
        setCroppedImageUri(referenceImageUri);
        return;
      }

      try {
        setProcessingImage(true);
        console.log('🔲 Cropping image based on board corners...');
        console.log('📦 Raw boardCorners:', boardCorners);

        // Parse boardCorners - it might be a string (from navigation params) or already parsed
        let corners: [[number, number], [number, number], [number, number], [number, number]];
        if (typeof boardCorners === 'string') {
          try {
            const parsed = JSON.parse(boardCorners);
            // Handle case where it might be double-stringified
            if (typeof parsed === 'string') {
              corners = JSON.parse(parsed);
            } else {
              corners = parsed;
            }
          } catch (e) {
            console.error('❌ Failed to parse boardCorners JSON:', e);
            console.error('Raw boardCorners:', boardCorners);
            setCroppedImageUri(referenceImageUri);
            return;
          }
        } else {
          corners = boardCorners;
        }

        // Validate corners format
        if (!Array.isArray(corners) || corners.length !== 4) {
          console.warn('⚠️ Invalid boardCorners format:', corners);
          setCroppedImageUri(referenceImageUri);
          return;
        }

        // Validate each corner is a valid [x, y] pair
        for (let i = 0; i < corners.length; i++) {
          const corner = corners[i];
          if (!Array.isArray(corner) || corner.length !== 2) {
            console.warn(`⚠️ Invalid corner at index ${i}:`, corner);
            setCroppedImageUri(referenceImageUri);
            return;
          }
          if (typeof corner[0] !== 'number' || typeof corner[1] !== 'number' || 
              isNaN(corner[0]) || isNaN(corner[1])) {
            console.warn(`⚠️ Invalid corner coordinates at index ${i}:`, corner);
            setCroppedImageUri(referenceImageUri);
            return;
          }
        }

        // boardCorners format: [[x, y], [x, y], [x, y], [x, y]]
        // Extract x and y coordinates from all 4 corners
        const xs = corners.map(corner => corner[0]);
        const ys = corners.map(corner => corner[1]);

        const minX = Math.max(0, Math.min(...xs));
        const maxX = Math.max(...xs);
        const minY = Math.max(0, Math.min(...ys));
        const maxY = Math.max(...ys);

        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);

        console.log('📐 Crop region:', { minX, minY, width, height });
        console.log('📐 Corners:', JSON.stringify(corners, null, 2));

        // Validate crop dimensions are reasonable
        if (width < 10 || height < 10) {
          console.warn('⚠️ Crop region too small, using original image');
          setCroppedImageUri(referenceImageUri);
          return;
        }

        // Crop the image to the detected board region
        const result = await manipulateAsync(
          referenceImageUri,
          [
            {
              crop: {
                originX: Math.round(minX),
                originY: Math.round(minY),
                width: Math.round(width),
                height: Math.round(height),
              },
            },
          ],
          { compress: 0.9, format: SaveFormat.JPEG }
        );

        console.log('✅ Image cropped successfully:', result.uri);
        setCroppedImageUri(result.uri);
      } catch (error) {
        console.error('❌ Error cropping image:', error);
        // Fallback to original image
        setCroppedImageUri(referenceImageUri);
      } finally {
        setProcessingImage(false);
      }
    };

    cropImage();
  }, [referenceImageUri, boardCorners]);
  const [selectedPiece, setSelectedPiece] = useState<ChessPiece | null>(null);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [flipped, setFlipped] = useState(false);
  const [coordinatesFlipped, setCoordinatesFlipped] = useState(false);
  const [castling, setCastling] = useState({ K: false, Q: false, k: false, q: false });
  const [enPassant, setEnPassant] = useState('');
  const [fenInput, setFenInput] = useState('');
  const [castlingExpanded, setCastlingExpanded] = useState(false);
  const [sideWarning, setSideWarning] = useState<string | null>(null);

  // Transform position if coordinates are flipped
  const getTransformedPosition = (pos: BoardPosition, coordsFlipped: boolean): BoardPosition => {
    if (!coordsFlipped) return pos;

    const transformed: BoardPosition = {};
    const fileMap: Record<string, string> = { a: 'h', b: 'g', c: 'f', d: 'e', e: 'd', f: 'c', g: 'b', h: 'a' };
    const rankMap: Record<string, string> = { '1': '8', '2': '7', '3': '6', '4': '5', '5': '4', '6': '3', '7': '2', '8': '1' };

    Object.entries(pos).forEach(([square, piece]) => {
      const file = square[0];
      const rank = square[1];
      const newSquare = fileMap[file] + rankMap[rank];
      transformed[newSquare] = piece;
    });

    return transformed;
  };

  // Auto-infer castling rights when position changes
  useEffect(() => {
    const transformedPosition = getTransformedPosition(position, coordinatesFlipped);
    const inferred = inferCastlingRights(transformedPosition);

    // Update castling state to match inferred rights
    setCastling(inferred);
  }, [position, coordinatesFlipped]);

  const fen = useMemo(() => {
    const transformedPosition = getTransformedPosition(position, coordinatesFlipped);
    return positionToFen(transformedPosition, turn, castling, enPassant);
  }, [position, turn, castling, enPassant, coordinatesFlipped]);

  // Validate FEN and auto-correct turn if needed
  useEffect(() => {
    const result = validateAndFixSide(fen);

    // If side was auto-corrected, update the turn state
    if (result.sideChanged && result.correctedSide) {
      setSideWarning(result.reason || 'Turn auto-corrected');
      // Auto-correct the turn after a brief moment
      setTimeout(() => {
        setTurn(result.correctedSide!);
        setTimeout(() => setSideWarning(null), 3000); // Clear warning after 3s
      }, 100);
    } else if (!result.valid) {
      // Show validation error but don't auto-correct
      setSideWarning(result.reason || null);
    } else {
      setSideWarning(null);
    }
  }, [fen]);

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

      {/* Reference Image Preview */}
      {referenceImageUri && (
        <View style={styles.referenceImageSection}>
          <Pressable
            onPress={() => setShowReferenceImage(!showReferenceImage)}
            style={styles.referenceImageHeader}
          >
            <View style={styles.referenceImageHeaderLeft}>
              <MaterialIcons
                name={showReferenceImage ? "expand-less" : "expand-more"}
                size={20}
                color="#6b7280"
              />
              <Text style={styles.referenceImageTitle}>
                📸 {boardCorners ? 'Detected Board' : 'Original Photo'}
              </Text>
            </View>
            <Text style={styles.referenceImageHint}>
              {showReferenceImage ? 'Tap to hide' : 'Tap to show'}
            </Text>
          </Pressable>
          {showReferenceImage && (
            <View style={styles.referenceImageContainer}>
              {processingImage ? (
                <View style={[styles.referenceImage, styles.processingContainer]}>
                  <MaterialIcons name="hourglass-empty" size={32} color="#9ca3af" />
                  <Text style={styles.processingText}>Cropping image...</Text>
                </View>
              ) : croppedImageUri ? (
                <>
                  <Image
                    source={{ uri: croppedImageUri }}
                    style={styles.referenceImage}
                    contentFit="contain"
                  />
                  <Text style={styles.referenceImageCaption}>
                    {boardCorners 
                      ? '✨ Auto-cropped to detected board • Use as reference to fix errors'
                      : 'Use this reference to correct any detection errors'}
                  </Text>
                </>
              ) : null}
            </View>
          )}
        </View>
      )}

      {/* Side Auto-Correction Warning */}
      {sideWarning && (
        <View style={styles.warningBox}>
          <MaterialIcons name="info" size={20} color="#92400e" />
          <View style={styles.errorContent}>
            <Text style={styles.warningTitle}>Auto-corrected:</Text>
            <Text style={styles.warningText}>{sideWarning}</Text>
          </View>
        </View>
      )}

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
            <ToolButton onPress={handleReset} icon="replay">
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
        <Pressable
          onPress={() => setCastlingExpanded(!castlingExpanded)}
          style={styles.castlingHeader}
        >
          <View style={styles.castlingHeaderLeft}>
            <MaterialIcons
              name={castlingExpanded ? "expand-less" : "expand-more"}
              size={20}
              color="#6b7280"
            />
            <Text style={styles.sectionTitle}>Castling Rights</Text>
          </View>
          <View style={styles.castlingPreview}>
            {castling.K && <Image source={{ uri: getPieceImageUrl({ type: 'k', color: 'w' }, pieceSet.id) }} style={styles.castlingPreviewIcon} contentFit="contain" />}
            {castling.Q && <Image source={{ uri: getPieceImageUrl({ type: 'q', color: 'w' }, pieceSet.id) }} style={styles.castlingPreviewIcon} contentFit="contain" />}
            {castling.k && <Image source={{ uri: getPieceImageUrl({ type: 'k', color: 'b' }, pieceSet.id) }} style={styles.castlingPreviewIcon} contentFit="contain" />}
            {castling.q && <Image source={{ uri: getPieceImageUrl({ type: 'q', color: 'b' }, pieceSet.id) }} style={styles.castlingPreviewIcon} contentFit="contain" />}
          </View>
        </Pressable>

        {castlingExpanded && (
          <View style={styles.castlingContent}>
            {/* White Castling */}
            <View style={styles.castlingColorSection}>
              <Text style={styles.castlingColorTitle}>White</Text>
              <View style={styles.castlingOptionsRow}>
                <Pressable
                  onPress={() => setCastling({ ...castling, K: !castling.K })}
                  style={[styles.castlingOption, castling.K && styles.castlingOptionActive]}
                >
                  <Image
                    source={{ uri: getPieceImageUrl({ type: 'k', color: 'w' }, pieceSet.id) }}
                    style={styles.castlingIcon}
                    contentFit="contain"
                  />
                  <Text style={[styles.castlingLabel, castling.K && styles.castlingLabelActive]}>
                    King-side
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setCastling({ ...castling, Q: !castling.Q })}
                  style={[styles.castlingOption, castling.Q && styles.castlingOptionActive]}
                >
                  <Image
                    source={{ uri: getPieceImageUrl({ type: 'q', color: 'w' }, pieceSet.id) }}
                    style={styles.castlingIcon}
                    contentFit="contain"
                  />
                  <Text style={[styles.castlingLabel, castling.Q && styles.castlingLabelActive]}>
                    Queen-side
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Black Castling */}
            <View style={styles.castlingColorSection}>
              <Text style={styles.castlingColorTitle}>Black</Text>
              <View style={styles.castlingOptionsRow}>
                <Pressable
                  onPress={() => setCastling({ ...castling, k: !castling.k })}
                  style={[styles.castlingOption, castling.k && styles.castlingOptionActive]}
                >
                  <Image
                    source={{ uri: getPieceImageUrl({ type: 'k', color: 'b' }, pieceSet.id) }}
                    style={styles.castlingIcon}
                    contentFit="contain"
                  />
                  <Text style={[styles.castlingLabel, castling.k && styles.castlingLabelActive]}>
                    King-side
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setCastling({ ...castling, q: !castling.q })}
                  style={[styles.castlingOption, castling.q && styles.castlingOptionActive]}
                >
                  <Image
                    source={{ uri: getPieceImageUrl({ type: 'q', color: 'b' }, pieceSet.id) }}
                    style={styles.castlingIcon}
                    contentFit="contain"
                  />
                  <Text style={[styles.castlingLabel, castling.q && styles.castlingLabelActive]}>
                    Queen-side
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
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
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 8,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#92400e',
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
  castlingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  castlingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  castlingPreview: {
    flexDirection: 'row',
    gap: 4,
  },
  castlingPreviewIcon: {
    width: 20,
    height: 20,
  },
  castlingContent: {
    marginTop: 12,
    gap: 12,
  },
  castlingColorSection: {
    gap: 8,
  },
  castlingColorTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  castlingOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  castlingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  castlingOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  castlingIcon: {
    width: 28,
    height: 28,
  },
  castlingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  castlingLabelActive: {
    color: '#1e40af',
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
  referenceImageSection: {
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  referenceImageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  referenceImageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  referenceImageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  referenceImageHint: {
    fontSize: 12,
    color: '#9ca3af',
  },
  referenceImageContainer: {
    padding: 12,
  },
  referenceImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
  referenceImageCaption: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  processingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
