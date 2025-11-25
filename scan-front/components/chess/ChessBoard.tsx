import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BoardPosition } from '@/types/chess';
import { BOARD_CONFIG } from '@/constants/config';
import { useTheme } from '@/context/ThemeContext';
import ChessPiece from './ChessPiece';

interface ChessBoardProps {
  position: BoardPosition;
  flipped?: boolean;
  coordinatesFlipped?: boolean;
  onSquarePress?: (square: string) => void;
  highlightedSquares?: string[];
  selectedSquare?: string | null;
}

export default function ChessBoard({
  position,
  flipped = false,
  coordinatesFlipped = false,
  onSquarePress,
  highlightedSquares = [],
  selectedSquare = null,
}: ChessBoardProps) {
  const { boardColors } = useTheme();
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  if (flipped) {
    files.reverse();
    ranks.reverse();
  }

  // Create separate arrays for coordinate labels AFTER board flip
  const displayFiles = coordinatesFlipped ? [...files].reverse() : files;
  const displayRanks = coordinatesFlipped ? [...ranks].reverse() : ranks;

  const renderSquare = (file: string, rank: string) => {
    const square = `${file}${rank}`;
    const fileIndex = files.indexOf(file);
    const rankIndex = ranks.indexOf(rank);
    const isLightSquare = (fileIndex + rankIndex) % 2 === 0;
    const piece = position[square];
    const isHighlighted = highlightedSquares.includes(square);
    const isSelected = selectedSquare === square;

    // Determine square color based on state
    let squareColor = isLightSquare ? boardColors.light : boardColors.dark;
    if (isSelected) {
      squareColor = boardColors.selected;
    } else if (isHighlighted) {
      squareColor = boardColors.highlight;
    }

    return (
      <Pressable
        key={square}
        onPress={() => onSquarePress?.(square)}
        style={[
          styles.square,
          { backgroundColor: squareColor },
        ]}
      >
        {piece && <ChessPiece piece={piece} size={BOARD_CONFIG.SQUARE_SIZE * 0.8} />}

        {/* Show file and rank labels on edges */}
        {rankIndex === 7 && (
          <Text style={[styles.fileLabel, { color: isLightSquare ? boardColors.dark : boardColors.light }]}>
            {displayFiles[fileIndex]}
          </Text>
        )}
        {fileIndex === (flipped ? 0 : 7) && (
          <Text style={[styles.rankLabel, { color: isLightSquare ? boardColors.dark : boardColors.light }]}>
            {displayRanks[rankIndex]}
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
    borderColor: '#2d2d2d',
    borderRadius: 4,
    overflow: 'hidden',
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
  fileLabel: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    fontSize: 10,
    fontWeight: '700',
  },
  rankLabel: {
    position: 'absolute',
    top: 2,
    left: 2,
    fontSize: 10,
    fontWeight: '700',
  },
});
