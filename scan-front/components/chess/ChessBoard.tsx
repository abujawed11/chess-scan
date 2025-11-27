import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Defs, Marker, Path, Polygon } from 'react-native-svg';
import { BoardPosition } from '@/types/chess';
import { BOARD_CONFIG } from '@/constants/config';
import { useTheme } from '@/context/ThemeContext';
import ChessPiece from './ChessPiece';

interface Arrow {
  from: string;
  to: string;
  color?: string;
}

interface ChessBoardProps {
  position: BoardPosition;
  flipped?: boolean;
  coordinatesFlipped?: boolean;
  onSquarePress?: (square: string) => void;
  highlightedSquares?: string[];
  selectedSquare?: string | null;
  arrows?: Arrow[];
}

export default function ChessBoard({
  position,
  flipped = false,
  coordinatesFlipped = false,
  onSquarePress,
  highlightedSquares = [],
  selectedSquare = null,
  arrows = [],
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

  // Calculate square position for arrows
  const getSquarePosition = (square: string) => {
    const file = square[0];
    const rank = square[1];
    const fileIndex = files.indexOf(file);
    const rankIndex = ranks.indexOf(rank);

    // Calculate center position of the square
    const x = fileIndex * BOARD_CONFIG.SQUARE_SIZE + BOARD_CONFIG.SQUARE_SIZE / 2;
    const y = rankIndex * BOARD_CONFIG.SQUARE_SIZE + BOARD_CONFIG.SQUARE_SIZE / 2;

    return { x, y };
  };

  // Render arrows
  const renderArrows = () => {
    if (arrows.length === 0) return null;

    const boardSize = BOARD_CONFIG.SQUARE_SIZE * 8;

    return (
      <Svg
        style={StyleSheet.absoluteFill}
        width={boardSize}
        height={boardSize}
        pointerEvents="none"
      >
        <Defs>
          <Marker
            id="arrowhead"
            markerWidth="4"
            markerHeight="4"
            refX="3.5"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <Polygon
              points="0 0, 4 2, 0 4"
              fill="rgba(255, 170, 0, 0.85)"
            />
          </Marker>
        </Defs>
        {arrows.map((arrow, idx) => {
          const from = getSquarePosition(arrow.from);
          const to = getSquarePosition(arrow.to);

          // Calculate angle and shorten the arrow so it doesn't cover the piece
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const angle = Math.atan2(dy, dx);
          const length = Math.sqrt(dx * dx + dy * dy);

          // Shorten arrow by 30% on each end
          const shortenBy = BOARD_CONFIG.SQUARE_SIZE * 0.15;
          const startX = from.x + Math.cos(angle) * shortenBy;
          const startY = from.y + Math.sin(angle) * shortenBy;
          const endX = to.x - Math.cos(angle) * shortenBy;
          const endY = to.y - Math.sin(angle) * shortenBy;

          return (
            <Path
              key={idx}
              d={`M ${startX} ${startY} L ${endX} ${endY}`}
              stroke={arrow.color || 'rgba(255, 170, 0, 0.85)'}
              strokeWidth="8"
              strokeLinecap="round"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
      </Svg>
    );
  };

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
    <View style={styles.boardContainer}>
      <View style={styles.board}>
        {ranks.map((rank) => (
          <View key={rank} style={styles.row}>
            {files.map((file) => renderSquare(file, rank))}
          </View>
        ))}
      </View>
      {renderArrows()}
    </View>
  );
}

const styles = StyleSheet.create({
  boardContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  board: {
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
