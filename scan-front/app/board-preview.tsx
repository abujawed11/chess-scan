// app/board-preview.tsx - Shows detected board after photo capture
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function BoardPreview() {
  const { imageUri, overlayUri, boardCorners, fen } = useLocalSearchParams<{
    imageUri: string;
    overlayUri?: string;
    boardCorners?: string;
    fen: string;
  }>();

  useEffect(() => {
    console.log('🖼️ BoardPreview mounted');
    console.log('📦 Received params:', {
      hasImageUri: !!imageUri,
      hasOverlayUri: !!overlayUri,
      hasBoardCorners: !!boardCorners,
      fen: fen,
    });

    // Validate required params
    if (!imageUri || !fen) {
      console.error('❌ Missing required params:', { imageUri: !!imageUri, fen: !!fen });
    }
  }, [imageUri, overlayUri, fen, boardCorners]);

  const handleRetake = () => {
    console.log('📸 Retake requested, going back to camera');
    router.back(); // Go back to camera
  };

  const handleContinue = () => {
    console.log('✅ User confirmed detected board, proceeding to board editor');
    console.log('♟️ Using FEN:', fen);

    // Navigate to board editor with the detected FEN
    // autoEdit=true will skip "Position Recognized" screen and go directly to editing
    router.replace({
      pathname: '/board-editor',
      params: {
        fen: fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        imageUri: overlayUri || imageUri, // Use warped overlay if available, otherwise original
        boardCorners: boardCorners || '',
        autoEdit: 'true', // Skip preview, go directly to editor
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Board Detected!</Text>
        <Text style={styles.subtitle}>
          The AI found your chessboard. Review the position below.
        </Text>
      </View>

      {/* Detected Board Image */}
      <View style={styles.imageContainer}>
        <Text style={styles.imageLabel}>
          {overlayUri ? 'Detected Pieces (Cropped Board):' : 'Captured Board:'}
        </Text>
        <Image
          source={{ uri: overlayUri || imageUri }}
          style={styles.boardImage}
          resizeMode="contain"
          onError={(e) => {
            console.error('❌ Image load error:', e.nativeEvent.error);
            console.error('Tried to load URI:', overlayUri || imageUri);
          }}
          onLoad={() => console.log('✅ Board image loaded successfully')}
        />
        <Text style={styles.imageCaption}>
          {overlayUri
            ? '✨ Warped & cropped board with piece detections (matches web app)'
            : `FEN: ${fen}`
          }
        </Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ Next Steps</Text>
        <Text style={styles.infoText}>
          • If the board looks correct, tap <Text style={styles.bold}>"Continue"</Text> to detect pieces
        </Text>
        <Text style={styles.infoText}>
          • If the detection is wrong, tap <Text style={styles.bold}>"Retake Photo"</Text>
        </Text>
        <Text style={styles.infoText}>
          • You can edit the position manually in the next step
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="📸 Retake Photo"
          onPress={handleRetake}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Continue →"
          onPress={handleContinue}
          style={styles.actionButton}
        />
      </View>

      {/* Debug Info (optional) */}
      {boardCorners && (
        <View style={styles.debugCard}>
          <Text style={styles.debugTitle}>🔍 Debug Info</Text>
          <Text style={styles.debugText}>Board corners detected</Text>
        </View>
      )}
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
    paddingBottom: 100, // Extra padding to prevent overlap with bottom navigation
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  imageContainer: {
    marginBottom: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  boardImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  imageCaption: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e40af',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 8,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
  },
  debugCard: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
});

