// app/board-editor.tsx
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import BoardEditor from '@/components/chess/BoardEditor';
import { GameMode } from '@/types/chess';
import Button from '@/components/ui/Button';
import ThemeSelector from '@/components/ui/ThemeSelector';

export default function BoardEditorScreen() {
  const { fen, imageUri } = useLocalSearchParams<{ fen?: string; imageUri?: string }>();
  const [showEditor, setShowEditor] = useState(false);
  const [editedFen, setEditedFen] = useState(fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  const handleEditComplete = (newFen: string) => {
    setEditedFen(newFen);
    setShowEditor(false);
  };

  const handleStartAnalysis = () => {
    if (!selectedMode) return;

    router.push({
      pathname: '/analyze',
      params: { fen: editedFen, mode: selectedMode },
    });
  };

  if (showEditor) {
    return (
      <BoardEditor
        initialFen={editedFen}
        onConfirm={handleEditComplete}
        onCancel={() => setShowEditor(false)}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Position Recognized</Text>
          <Text style={styles.subtitle}>
            {editedFen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
              ? '⚠️ AI used starting position (adjust pieces below if needed)'
              : '✓ AI recognized the position'}
          </Text>
        </View>
        <ThemeSelector />
      </View>

      <View style={styles.fenContainer}>
        <Text style={styles.fenLabel}>FEN:</Text>
        <Text style={styles.fenText} numberOfLines={2}>{editedFen}</Text>
        <Pressable onPress={() => setShowEditor(true)} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Position</Text>
        </Pressable>
      </View>

      <View style={styles.modeSection}>
        <Text style={styles.sectionTitle}>Choose Game Mode:</Text>

        <Pressable
          onPress={() => setSelectedMode('analyze')}
          style={[styles.modeCard, selectedMode === 'analyze' && styles.selectedMode]}
        >
          <Text style={styles.modeTitle}>🔍 Analyze</Text>
          <Text style={styles.modeDescription}>
            Get best move suggestions and position evaluation from the engine
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedMode('play-white')}
          style={[styles.modeCard, selectedMode === 'play-white' && styles.selectedMode]}
        >
          <Text style={styles.modeTitle}>♔ Play as White</Text>
          <Text style={styles.modeDescription}>
            Continue the game as White against the chess engine
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedMode('play-black')}
          style={[styles.modeCard, selectedMode === 'play-black' && styles.selectedMode]}
        >
          <Text style={styles.modeTitle}>♚ Play as Black</Text>
          <Text style={styles.modeDescription}>
            Continue the game as Black against the chess engine
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedMode('watch')}
          style={[styles.modeCard, selectedMode === 'watch' && styles.selectedMode]}
        >
          <Text style={styles.modeTitle}>👁 Watch</Text>
          <Text style={styles.modeDescription}>
            Watch the engine play against itself from this position
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Button
          title="Back"
          onPress={() => router.back()}
          variant="outline"
          style={{ flex: 1 }}
        />
        <Button
          title="Start"
          onPress={handleStartAnalysis}
          disabled={!selectedMode}
          style={{ flex: 2 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  fenContainer: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  fenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  fenText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#111827',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  modeSection: {
    marginBottom: 24,
  },
  modeCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMode: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
