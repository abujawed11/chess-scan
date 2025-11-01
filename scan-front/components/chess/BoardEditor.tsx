import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { BoardPosition, ChessPiece, PieceType, PieceColor } from '@/types/chess';
import { fenToPosition, positionToFen } from '@/utils/fen';
import ChessBoard from './ChessBoard';
import ChessPieceComponent from './ChessPiece';
import Button from '../ui/Button';

interface BoardEditorProps {
  initialFen: string;
  onConfirm: (fen: string) => void;
  onCancel: () => void;
}

export default function BoardEditor({ initialFen, onConfirm, onCancel }: BoardEditorProps) {
  const [position, setPosition] = useState<BoardPosition>(() => fenToPosition(initialFen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<ChessPiece | null>(null);
  const [editMode, setEditMode] = useState<'move' | 'add' | 'delete'>('move');
  const [turn, setTurn] = useState<PieceColor>('w');

  const pieces: ChessPiece[] = [
    { type: 'k', color: 'w' },
    { type: 'q', color: 'w' },
    { type: 'r', color: 'w' },
    { type: 'b', color: 'w' },
    { type: 'n', color: 'w' },
    { type: 'p', color: 'w' },
    { type: 'k', color: 'b' },
    { type: 'q', color: 'b' },
    { type: 'r', color: 'b' },
    { type: 'b', color: 'b' },
    { type: 'n', color: 'b' },
    { type: 'p', color: 'b' },
  ];

  const handleSquarePress = (square: string) => {
    if (editMode === 'add' && selectedPiece) {
      // Add piece to square
      setPosition({ ...position, [square]: selectedPiece });
      setSelectedPiece(null);
    } else if (editMode === 'delete') {
      // Remove piece from square
      const newPosition = { ...position };
      delete newPosition[square];
      setPosition(newPosition);
    } else if (editMode === 'move') {
      // Move mode
      if (selectedSquare) {
        // Second click - move piece
        if (position[selectedSquare]) {
          const newPosition = { ...position };
          newPosition[square] = position[selectedSquare]!;
          delete newPosition[selectedSquare];
          setPosition(newPosition);
        }
        setSelectedSquare(null);
      } else if (position[square]) {
        // First click - select piece
        setSelectedSquare(square);
      }
    }
  };

  const handlePieceSelect = (piece: ChessPiece) => {
    setSelectedPiece(piece);
    setEditMode('add');
  };

  const handleClear = () => {
    setPosition({});
    setSelectedSquare(null);
  };

  const handleReset = () => {
    setPosition(fenToPosition(initialFen));
    setSelectedSquare(null);
  };

  const handleConfirm = () => {
    const fen = positionToFen(position, turn);
    onConfirm(fen);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Board Position</Text>
        <Text style={styles.subtitle}>
          {editMode === 'move' && 'Tap a piece, then tap destination'}
          {editMode === 'add' && 'Select a piece below, then tap where to place it'}
          {editMode === 'delete' && 'Tap pieces to remove them'}
        </Text>
      </View>

      <ChessBoard
        position={position}
        onSquarePress={handleSquarePress}
        selectedSquare={selectedSquare}
      />

      <View style={styles.modeSelector}>
        <Pressable
          onPress={() => { setEditMode('move'); setSelectedPiece(null); }}
          style={[styles.modeButton, editMode === 'move' && styles.activeMode]}
        >
          <Text style={[styles.modeText, editMode === 'move' && styles.activeModeText]}>Move</Text>
        </Pressable>
        <Pressable
          onPress={() => { setEditMode('add'); setSelectedSquare(null); }}
          style={[styles.modeButton, editMode === 'add' && styles.activeMode]}
        >
          <Text style={[styles.modeText, editMode === 'add' && styles.activeModeText]}>Add</Text>
        </Pressable>
        <Pressable
          onPress={() => { setEditMode('delete'); setSelectedSquare(null); setSelectedPiece(null); }}
          style={[styles.modeButton, editMode === 'delete' && styles.activeMode]}
        >
          <Text style={[styles.modeText, editMode === 'delete' && styles.activeModeText]}>Delete</Text>
        </Pressable>
      </View>

      {editMode === 'add' && (
        <ScrollView horizontal style={styles.pieceSelector} showsHorizontalScrollIndicator={false}>
          {pieces.map((piece, index) => (
            <Pressable
              key={index}
              onPress={() => handlePieceSelect(piece)}
              style={[
                styles.pieceOption,
                selectedPiece?.type === piece.type && selectedPiece?.color === piece.color && styles.selectedPieceOption,
              ]}
            >
              <ChessPieceComponent piece={piece} size={50} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.turnSelector}>
        <Text style={styles.turnLabel}>Turn to move:</Text>
        <Pressable
          onPress={() => setTurn('w')}
          style={[styles.turnButton, turn === 'w' && styles.activeTurn]}
        >
          <Text style={[styles.turnText, turn === 'w' && styles.activeTurnText]}>White</Text>
        </Pressable>
        <Pressable
          onPress={() => setTurn('b')}
          style={[styles.turnButton, turn === 'b' && styles.activeTurn]}
        >
          <Text style={[styles.turnText, turn === 'b' && styles.activeTurnText]}>Black</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Button title="Clear" onPress={handleClear} variant="outline" style={{ flex: 1 }} />
        <Button title="Reset" onPress={handleReset} variant="secondary" style={{ flex: 1 }} />
      </View>

      <View style={styles.footer}>
        <Button title="Cancel" onPress={onCancel} variant="outline" style={{ flex: 1 }} />
        <Button title="Continue" onPress={handleConfirm} variant="primary" style={{ flex: 2 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  activeMode: {
    backgroundColor: '#000',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeModeText: {
    color: '#fff',
  },
  pieceSelector: {
    marginVertical: 16,
  },
  pieceOption: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  selectedPieceOption: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  turnSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  turnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  turnButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  activeTurn: {
    backgroundColor: '#000',
  },
  turnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTurnText: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
});
