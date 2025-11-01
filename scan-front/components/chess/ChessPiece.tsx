import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ChessPiece as ChessPieceType } from '@/types/chess';
import { getPieceSymbol } from '@/utils/fen';

interface ChessPieceProps {
  piece: ChessPieceType;
  size?: number;
}

export default function ChessPiece({ piece, size = 40 }: ChessPieceProps) {
  return (
    <Text style={[styles.piece, { fontSize: size }]}>
      {getPieceSymbol(piece)}
    </Text>
  );
}

const styles = StyleSheet.create({
  piece: {
    textAlign: 'center',
  },
});
