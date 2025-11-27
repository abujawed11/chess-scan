// app/scan.tsx
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { View, Text, StyleSheet } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { recognizeChessBoard } from '@/services/visionApi';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ImageCropper from '@/components/ui/ImageCropper';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

type ScanStep = 'camera' | 'cropping' | 'processing';

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
        // OPTION: Skip cropping and go directly to processing
        // Comment out next line and uncomment the one after to skip cropping
        //setStep('cropping'); // Show cropper
        await handlePhotoCapture(picture.uri); // Skip cropper, process directly
      }
    } catch (error) {
      console.error('Photo capture error:', error);
    } finally {
      setTaking(false);
    }
  };

  const handleCropConfirm = async (imageUri: string) => {
    await handlePhotoCapture(imageUri);
  };

  const handleCropRetake = () => {
    setPhotoUri(null);
    setStep('camera');
  };

  const handleCropCancel = () => {
    setPhotoUri(null);
    setStep('camera');
  };

  const handlePhotoCapture = async (imageUri: string) => {
    const startTime = Date.now();
    console.log('📸 Photo received! Starting analysis...');
    console.log('🖼️ Original Image URI:', imageUri);

    setStep('processing');
    try {
      console.log('🔄 Preparing image for backend...');

      // Resize image to reduce network payload size
      // This prevents network timeout/failure with large camera images
      const resizedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: 1600 } }], // Max width 1600px
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      console.log('✅ Image resized:', resizedImage.uri);
      console.log('📤 Sending to backend for auto-detection...');

      const uploadStart = Date.now();
      const result = await recognizeChessBoard(resizedImage.uri);
      const uploadTime = Date.now() - uploadStart;
      const totalTime = Date.now() - startTime;

      console.log('✅ Recognition successful! FEN:', result.fen);
      console.log('⏱️ Timing: Upload+Detect:', uploadTime, 'ms, Total:', totalTime, 'ms');

      // Navigate to board editor with recognized FEN
      router.push({
        pathname: '/board-editor',
        params: { fen: result.fen, imageUri: resizedImage.uri },
      });
    } catch (error) {
      console.error('❌ Recognition error:', error);
      alert(`Recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTip: Make sure the chessboard is clearly visible.`);

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

  if (step === 'cropping' && photoUri) {
    return (
      <ImageCropper
        imageUri={photoUri}
        onConfirm={handleCropConfirm}
        onRetake={handleCropRetake}
        onCancel={handleCropCancel}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={camRef}
          style={styles.camera}
          facing="back"
          active={isFocused}
        />

        <View style={styles.backButtonContainer}>
          <Button
            title="← Back"
            onPress={() => router.replace('/')}
            variant="outline"
          />
        </View>

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
  backButtonContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
});
