// app/scan.tsx
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { View, Text, StyleSheet } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { recognizeChessBoard } from '@/services/visionApi';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type ScanStep = 'camera' | 'processing';

export default function Scan() {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView | null>(null);
  const [step, setStep] = useState<ScanStep>('camera');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required.</Text>
        <Button title="Grant Permission" onPress={() => requestPermission()} />
      </View>
    );
  }

  const takePhoto = async () => {
    if (!camRef.current) return;
    try {
      setTaking(true);
      // Lower quality since we resize anyway - faster capture
      const picture = await camRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      });
      if (picture?.uri) {
        setPhotoUri(picture.uri);
        // Skip cropping - send full image directly to backend (like web app)
        await handlePhotoCapture(picture.uri);
      }
    } catch (error) {
      console.error('Photo capture error:', error);
    } finally {
      setTaking(false);
    }
  };

  const handlePhotoCapture = async (imageUri: string) => {
    const startTime = Date.now();
    console.log('📸 Photo captured! Starting optimization...');
    console.log('🖼️ Original image URI:', imageUri);

    setStep('processing');
    try {
      // Resize image to max 1600px on longest side for faster upload and processing
      // This matches typical web upload sizes and speeds up everything
      const resizeStart = Date.now();
      console.log('🔧 Resizing image for faster processing...');
      const resizedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: 1600 } }], // Resize to max 1600px width (maintains aspect ratio)
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      const resizeTime = Date.now() - resizeStart;

      console.log('✅ Image optimized in', resizeTime, 'ms');
      console.log('🔄 Sending to backend for auto-detection...');

      const uploadStart = Date.now();
      // Send optimized image to backend for auto-detection (like web app does)
      const result = await recognizeChessBoard(resizedImage.uri);
      const uploadTime = Date.now() - uploadStart;
      const totalTime = Date.now() - startTime;

      console.log('✅ Recognition successful! FEN:', result.fen);
      console.log('⏱️ Timing: Resize:', resizeTime, 'ms, Upload+Detect:', uploadTime, 'ms, Total:', totalTime, 'ms');

      // Navigate to board editor with recognized FEN
      router.push({
        pathname: '/board-editor',
        params: { fen: result.fen, imageUri: resizedImage.uri },
      });
    } catch (error) {
      console.error('❌ Recognition error:', error);
      alert(`Recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTip: Make sure the chessboard is clearly visible in the photo.`);

      // Even if recognition fails, go to board editor with default position
      router.push({
        pathname: '/board-editor',
        params: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', imageUri: imageUri },
      });
    }
  };

  if (step === 'processing') {
    return <LoadingSpinner message="Analyzing board position..." />;
  }

  // Note: Cropping step removed - we now send full image to backend like web app
  // Backend auto-detects the board corners using YOLO

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={camRef}
          style={styles.camera}
          facing="back"
          active={isFocused}
        />

        <View style={styles.controls}>
          <Button
            title="Capture Board"
            onPress={takePhoto}
            loading={taking}
            size="lg"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
});
