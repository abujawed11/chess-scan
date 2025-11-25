import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ChessPiece as ChessPieceType } from '@/types/chess';
import { useTheme, getPieceImageUrl } from '@/context/ThemeContext';

interface ChessPieceProps {
  piece: ChessPieceType;
  size?: number;
}

export default function ChessPiece({ piece, size = 40 }: ChessPieceProps) {
  const { pieceSet } = useTheme();
  const imageUrl = getPieceImageUrl(piece, pieceSet.id);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
