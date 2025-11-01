// app/scan.tsx
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { View, Text, StyleSheet } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { router } from 'expo-router';
import ImageCropper from '@/components/camera/ImageCropper';
import { recognizeChessBoard } from '@/services/visionApi';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type ScanStep = 'camera' | 'crop' | 'processing';

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
      const picture = await camRef.current.takePictureAsync({ quality: 0.85 });
      if (picture?.uri) {
        setPhotoUri(picture.uri);
        setStep('crop');
      }
    } catch (error) {
      console.error('Photo capture error:', error);
    } finally {
      setTaking(false);
    }
  };

  const handleCropComplete = async (croppedUri: string) => {
    setStep('processing');
    try {
      // Recognize chess position from cropped image
      const result = await recognizeChessBoard(croppedUri);

      // Navigate to board editor with recognized FEN
      router.push({
        pathname: '/board-editor',
        params: { fen: result.fen, imageUri: croppedUri },
      });
    } catch (error) {
      console.error('Recognition error:', error);
      // Even if recognition fails, go to board editor with default position
      router.push({
        pathname: '/board-editor',
        params: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', imageUri: croppedUri },
      });
    }
  };

  const handleCropCancel = () => {
    setPhotoUri(null);
    setStep('camera');
  };

  if (step === 'processing') {
    return <LoadingSpinner message="Analyzing chess position..." />;
  }

  if (step === 'crop' && photoUri) {
    return (
      <ImageCropper
        imageUri={photoUri}
        onCropComplete={handleCropComplete}
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
