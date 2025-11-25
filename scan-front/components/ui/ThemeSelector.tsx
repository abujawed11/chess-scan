import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import {
  useTheme,
  BOARD_THEMES,
  PIECE_THEMES,
  BoardThemeKey,
  PieceThemeKey,
  getPieceImageUrl,
} from '@/context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { boardTheme, pieceTheme, setBoardTheme, setPieceTheme, boardColors, pieceSet } = useTheme();

  return (
    <>
      {/* Theme Button */}
      <Pressable
        onPress={() => setIsOpen(true)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>🎨 Theme</Text>
      </Pressable>

      {/* Theme Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Board & Piece Themes</Text>
              <Pressable onPress={() => setIsOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Board Themes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>BOARD COLORS</Text>
                <View style={styles.grid}>
                  {Object.entries(BOARD_THEMES).map(([key, theme]) => (
                    <Pressable
                      key={key}
                      onPress={() => setBoardTheme(key as BoardThemeKey)}
                      style={[
                        styles.themeCard,
                        boardTheme === key && styles.selectedCard,
                      ]}
                    >
                      {/* Mini board preview */}
                      <View style={styles.miniBoard}>
                        {Array.from({ length: 16 }).map((_, i) => {
                          const row = Math.floor(i / 4);
                          const col = i % 4;
                          const isLight = (row + col) % 2 === 0;
                          return (
                            <View
                              key={i}
                              style={[
                                styles.miniSquare,
                                { backgroundColor: isLight ? theme.light : theme.dark },
                              ]}
                            />
                          );
                        })}
                      </View>
                      <Text style={[styles.themeName, boardTheme === key && styles.selectedText]}>
                        {theme.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Piece Themes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PIECE SET</Text>
                <View style={styles.grid}>
                  {Object.entries(PIECE_THEMES).map(([key, theme]) => (
                    <Pressable
                      key={key}
                      onPress={() => setPieceTheme(key as PieceThemeKey)}
                      style={[
                        styles.pieceCard,
                        pieceTheme === key && styles.selectedCard,
                      ]}
                    >
                      {/* Piece preview */}
                      <View style={styles.piecePreview}>
                        <Image
                          source={{ uri: getPieceImageUrl({ type: 'n', color: 'w' }, theme.id) }}
                          style={styles.pieceIcon}
                          contentFit="contain"
                          cachePolicy="memory-disk"
                        />
                        <Image
                          source={{ uri: getPieceImageUrl({ type: 'q', color: 'b' }, theme.id) }}
                          style={styles.pieceIcon}
                          contentFit="contain"
                          cachePolicy="memory-disk"
                        />
                      </View>
                      <Text style={[styles.pieceName, pieceTheme === key && styles.selectedText]}>
                        {theme.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Preview Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PREVIEW</Text>
                <View style={styles.previewBoard}>
                  {Array.from({ length: 64 }).map((_, i) => {
                    const row = Math.floor(i / 8);
                    const col = i % 8;
                    const isLight = (row + col) % 2 === 0;

                    // Add some pieces for preview (using correct piece type format)
                    let piece = null;
                    if (row === 0) {
                      const pieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
                      piece = { type: pieces[col], color: 'b' };
                    } else if (row === 1) {
                      piece = { type: 'p', color: 'b' };
                    } else if (row === 6) {
                      piece = { type: 'p', color: 'w' };
                    } else if (row === 7) {
                      const pieces = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
                      piece = { type: pieces[col], color: 'w' };
                    }

                    return (
                      <View
                        key={i}
                        style={[
                          styles.previewSquare,
                          { backgroundColor: isLight ? boardColors.light : boardColors.dark },
                        ]}
                      >
                        {piece && (
                          <Image
                            source={{ uri: getPieceImageUrl(piece, pieceSet.id) }}
                            style={styles.previewPiece}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Bottom spacing */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 28,
    color: '#9ca3af',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 12,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeCard: {
    width: (SCREEN_WIDTH - 64) / 3,
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pieceCard: {
    width: (SCREEN_WIDTH - 64) / 4,
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  selectedCard: {
    backgroundColor: '#374151',
    borderColor: '#8b5cf6',
  },
  miniBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    aspectRatio: 1,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  miniSquare: {
    width: '25%',
    aspectRatio: 1,
  },
  themeName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
  },
  piecePreview: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
    height: 24,
  },
  pieceIcon: {
    width: 24,
    height: 24,
  },
  pieceName: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
  },
  selectedText: {
    color: 'white',
  },
  previewBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: SCREEN_WIDTH - 80,
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewSquare: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPiece: {
    width: '85%',
    height: '85%',
  },
});
