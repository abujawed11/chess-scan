// app/scan.tsx
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { router } from 'expo-router';
import { recognizeChessBoard } from '@/services/visionApi';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ImageCropper from '@/components/ui/ImageCropper';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

type ScanStep = 'camera' | 'cropping' | 'processing';

export default function Scan() {
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView | null>(null);
  const [step, setStep] = useState<ScanStep>('camera');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Handle hardware back button (Android)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  // Debug: Log current state
  console.log('🎬 Scan component state:', { step, uploading, taking, hasPhotoUri: !!photoUri });

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
      // Maximum quality to match web app - send original unmodified image
      const picture = await camRef.current.takePictureAsync({
        quality: 1.0,
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

  const pickImageFromGallery = async () => {
    try {
      console.log('📂 Opening image picker...');

      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload images!');
        return;
      }

      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // We'll handle cropping/resizing ourselves
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('✅ Image selected from gallery:', imageUri);

        // Set loading state first
        setUploading(true);
        setPhotoUri(imageUri);

        // Wait for next frame to ensure state update is rendered
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 500); // Visible delay for loading screen
          });
        });

        console.log('📊 Starting image processing...');

        // Process the selected image
        await handlePhotoCapture(imageUri);
      } else {
        console.log('❌ Image picker cancelled');
      }
    } catch (error) {
      console.error('❌ Image picker error:', error);
      setUploading(false);
      alert(`Failed to pick image: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    console.log('📸 Photo received! Starting board detection...');
    console.log('🖼️ Original Image URI:', imageUri);

    setStep('processing');
    // Don't clear uploading here - let processing state take over

    try {
      console.log('📤 Sending ORIGINAL image to backend (no resize/compression to match web app)...');

      const uploadStart = Date.now();
      const result = await recognizeChessBoard(imageUri);
      const uploadTime = Date.now() - uploadStart;
      const totalTime = Date.now() - startTime;

      console.log('✅ Board detection successful!');
      console.log('⏱️ Timing: Upload+Detect:', uploadTime, 'ms, Total:', totalTime, 'ms');
      console.log('📊 Result:', {
        fen: result.fen,
        hasDebugImage: !!result.debugImage,
        hasOverlayImage: !!result.overlayImage,
        hasBoardCorners: !!result.boardCorners
      });

      // Save overlay image (warped board) to temp file to match web app behavior
      let overlayUri = '';
      if (result.overlayImage) {
        try {
          console.log('💾 Saving overlay image to temp file...');
          // Extract base64 data (remove data:image/png;base64, prefix)
          const base64Data = result.overlayImage.replace(/^data:image\/\w+;base64,/, '');

          // Use legacy FileSystem API (still supported in Expo SDK v54)
          const fileName = `overlay_${Date.now()}.png`;
          const tempPath = FileSystem.cacheDirectory + fileName;

          await FileSystem.writeAsStringAsync(tempPath, base64Data, {
            encoding: 'base64',
          });

          overlayUri = tempPath;
          console.log('✅ Overlay saved to:', overlayUri);
        } catch (error) {
          console.error('❌ Failed to save overlay image:', error);
        }
      }

      // Navigate to board preview screen to show detected board
      console.log('🔀 Navigating to board-preview...');
      console.log('📦 Navigation params:', {
        hasImageUri: !!imageUri,
        hasOverlayUri: !!overlayUri,
        hasBoardCorners: !!result.boardCorners,
        fen: result.fen,
      });

      // Pass the warped overlay image (matches web app behavior)
      router.replace({
        pathname: '/board-preview',
        params: {
          imageUri: imageUri,
          overlayUri: overlayUri, // Warped board with detections
          boardCorners: result.boardCorners ? JSON.stringify(result.boardCorners) : '',
          fen: result.fen,
        },
      });
      
      console.log('✅ Navigation initiated');
    } catch (error) {
      console.error('❌ Board detection error:', error);

      // Log detailed error info
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      // Reset state first
      setStep('camera');
      setPhotoUri(null);
      setUploading(false);

      // Then show alert
      alert(`Board detection failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try taking another photo with the board clearly visible.`);
    }
  };

  if (step === 'processing') {
    console.log('🔄 Rendering: Processing screen');
    return <LoadingSpinner message="Analyzing board position..." />;
  }

  if (uploading) {
    console.log('📤 Rendering: Upload loading screen');
    return <LoadingSpinner message="Loading image..." />;
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
            onPress={() => router.back()}
            variant="outline"
          />
        </View>

        <View style={styles.controls}>
          <Button
            title="📸 Capture Board"
            onPress={takePhoto}
            loading={taking}
            size="lg"
            style={{ marginBottom: 12 }}
          />
          <Button
            title="🖼️ Upload from Gallery"
            onPress={pickImageFromGallery}
            variant="secondary"
            size="lg"
            disabled={uploading}
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
