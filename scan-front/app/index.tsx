import { router } from "expo-router";
import { View, Text, StyleSheet, ScrollView, TextInput, StatusBar } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import ModeCard from '@/components/ui/ModeCard';
import Button from '@/components/ui/Button';
import ThemeSelector from '@/components/ui/ThemeSelector';
import * as ImagePicker from 'expo-image-picker';
import { recognizeChessBoard } from '@/services/visionApi';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function Home() {
  const [showFenInput, setShowFenInput] = useState(false);
  const [fenInput, setFenInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleLoadFromFen = () => {
    if (fenInput.trim()) {
      router.push({
        pathname: '/analyze',
        params: { fen: fenInput.trim(), mode: 'analyze' }
      });
    }
  };

  const handleUploadImage = async () => {
    try {
      console.log('📂 Opening image picker from home...');
      setUploading(true);

      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload images!');
        setUploading(false);
        return;
      }

      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('✅ Image selected from gallery:', imageUri);
        console.log('🔄 Processing image...');

        // Resize image to reduce network payload
        const resizedImage = await manipulateAsync(
          imageUri,
          [{ resize: { width: 1600 } }],
          { compress: 0.8, format: SaveFormat.JPEG }
        );

        console.log('📤 Sending to backend for board detection...');
        const boardResult = await recognizeChessBoard(resizedImage.uri);

        console.log('✅ Board detected!');
        console.log('♟️ FEN:', boardResult.fen);

        // Navigate to board preview
        router.push({
          pathname: '/board-preview',
          params: {
            imageUri: resizedImage.uri,
            boardCorners: boardResult.boardCorners ? JSON.stringify(boardResult.boardCorners) : '',
            fen: boardResult.fen,
          },
        });
      } else {
        console.log('❌ Image picker cancelled');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again with a clear board photo.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>♟️</Text>
          </View>
          <Text style={styles.title}>Chess Scan</Text>
          <Text style={styles.subtitle}>Play · Analyze · Scan</Text>
        </View>

        {/* Main Options Grid */}
        <View style={styles.grid}>
          <ModeCard
            icon="🎮"
            title="Play New Game"
            description="Start a fresh chess game"
            onPress={() => router.push({ pathname: '/analyze', params: { mode: 'play-white' } })}
          />

          <ModeCard
            icon="🔍"
            title="Analysis Board"
            description="Analyze with Stockfish engine"
            onPress={() => router.push({ pathname: '/analyze', params: { mode: 'analyze' } })}
          />

          <ModeCard
            icon="📸"
            title="Scan from Camera"
            description="Capture board position photo"
            onPress={() => router.push('/scan')}
          />

          <ModeCard
            icon="🖼️"
            title="Upload Image"
            description="Select board photo from gallery"
            onPress={handleUploadImage}
            disabled={uploading}
          />

          <ModeCard
            icon="✏️"
            title="Board Editor"
            description="Manually create positions"
            onPress={() => router.push('/board-editor')}
          />

          <ModeCard
            icon="📋"
            title="Load from FEN"
            description="Input FEN to analyze"
            onPress={() => setShowFenInput(!showFenInput)}
          />

          <ModeCard
            icon="🔍"
            title="Backend Diagnostics"
            description="Check backend connection"
            onPress={() => router.push('/diagnostics')}
          />
        </View>

        {/* FEN Input Section */}
        {showFenInput && (
          <View style={styles.fenSection}>
            <Text style={styles.fenTitle}>Load Position from FEN</Text>
            <Text style={styles.fenDescription}>
              Enter FEN (Forsyth-Edwards Notation) string
            </Text>
            <View style={styles.fenInputRow}>
              <TextInput
                placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                placeholderTextColor="#94a3b8"
                value={fenInput}
                onChangeText={setFenInput}
                style={styles.fenInput}
                multiline
              />
            </View>
            <Button
              title="Load Position"
              onPress={handleLoadFromFen}
              disabled={!fenInput.trim()}
              variant="primary"
            />
          </View>
        )}

        {/* Theme Selector */}
        <View style={styles.themeSection}>
          <ThemeSelector />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by Stockfish</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  grid: {
    gap: 16,
    marginBottom: 24,
  },
  fenSection: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
  },
  fenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  fenDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  fenInputRow: {
    marginBottom: 16,
  },
  fenInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    fontFamily: 'monospace',
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#ffffff',
  },
  themeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
  },
});
