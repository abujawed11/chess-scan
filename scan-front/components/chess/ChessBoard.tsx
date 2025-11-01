import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BoardPosition } from '@/types/chess';
import { BOARD_CONFIG } from '@/constants/config';
import ChessPiece from './ChessPiece';

interface ChessBoardProps {
  position: BoardPosition;
  flipped?: boolean;
  onSquarePress?: (square: string) => void;
  highlightedSquares?: string[];
  selectedSquare?: string | null;
}

export default function ChessBoard({
  position,
  flipped = false,
  onSquarePress,
  highlightedSquares = [],
  selectedSquare = null,
}: ChessBoardProps) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  if (flipped) {
    files.reverse();
    ranks.reverse();
  }

  const renderSquare = (file: string, rank: string) => {
    const square = `${file}${rank}`;
    const fileIndex = files.indexOf(file);
    const rankIndex = ranks.indexOf(rank);
    const isLightSquare = (fileIndex + rankIndex) % 2 === 0;
    const piece = position[square];
    const isHighlighted = highlightedSquares.includes(square);
    const isSelected = selectedSquare === square;

    return (
      <Pressable
        key={square}
        onPress={() => onSquarePress?.(square)}
        style={[
          styles.square,
          isLightSquare ? styles.lightSquare : styles.darkSquare,
          isSelected && styles.selectedSquare,
          isHighlighted && styles.highlightedSquare,
        ]}
      >
        {piece && <ChessPiece piece={piece} size={BOARD_CONFIG.SQUARE_SIZE * 0.8} />}

        {/* Show file and rank labels on edges */}
        {rankIndex === 7 && (
          <Text style={[styles.fileLabel, isLightSquare ? styles.darkText : styles.lightText]}>
            {file}
          </Text>
        )}
        {fileIndex === (flipped ? 0 : 7) && (
          <Text style={[styles.rankLabel, isLightSquare ? styles.darkText : styles.lightText]}>
            {rank}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.board}>
      {ranks.map((rank) => (
        <View key={rank} style={styles.row}>
          {files.map((file) => renderSquare(file, rank))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: BOARD_CONFIG.SQUARE_SIZE,
    height: BOARD_CONFIG.SQUARE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lightSquare: {
    backgroundColor: BOARD_CONFIG.LIGHT_SQUARE_COLOR,
  },
  darkSquare: {
    backgroundColor: BOARD_CONFIG.DARK_SQUARE_COLOR,
  },
  selectedSquare: {
    backgroundColor: '#7dd3fc',
  },
  highlightedSquare: {
    backgroundColor: '#86efac',
  },
  fileLabel: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    fontSize: 10,
    fontWeight: '600',
  },
  rankLabel: {
    position: 'absolute',
    top: 2,
    left: 2,
    fontSize: 10,
    fontWeight: '600',
  },
  darkText: {
    color: BOARD_CONFIG.DARK_SQUARE_COLOR,
  },
  lightText: {
    color: BOARD_CONFIG.LIGHT_SQUARE_COLOR,
  },
});
