import React, { useState, useEffect } from 'react';
import { View, Image, Pressable, Text, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

const SCREEN = Dimensions.get('window');
const CONTAINER_WIDTH = SCREEN.width - 32;
const MAX_HEIGHT = SCREEN.height * 0.6;

interface ImageCropperProps {
  imageUri: string;
  onCropComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageUri, onCropComplete, onCancel }: ImageCropperProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [cropping, setCropping] = useState(false);
  const [loading, setLoading] = useState(true);

  // Crop area state (as fraction of display dimensions)
  // Note: cropSize is used for both width and height to maintain square aspect ratio
  const cropX = useSharedValue(0.1);
  const cropY = useSharedValue(0.1);
  const cropSize = useSharedValue(0.8); // Single value for square crop

  // Load image dimensions
  useEffect(() => {
    Image.getSize(
      imageUri,
      (width, height) => {
        setImageSize({ width, height });

        // Calculate display size maintaining aspect ratio
        let displayWidth = CONTAINER_WIDTH;
        let displayHeight = (height / width) * displayWidth;

        // If too tall, scale down
        if (displayHeight > MAX_HEIGHT) {
          displayHeight = MAX_HEIGHT;
          displayWidth = (width / height) * displayHeight;
        }

        setDisplaySize({ width: displayWidth, height: displayHeight });
        setLoading(false);
      },
      (error) => {
        console.error('Error loading image:', error);
        setLoading(false);
      }
    );
  }, [imageUri]);

  const handleCrop = async () => {
    if (!imageSize.width || !imageSize.height) {
      console.log('Image size not loaded yet');
      return;
    }

    setCropping(true);
    try {
      // Calculate actual crop coordinates on the original image
      const scaleX = imageSize.width / displaySize.width;
      const scaleY = imageSize.height / displaySize.height;

      // Use the smaller display dimension for reference to ensure square fits
      const displayRefSize = Math.min(displaySize.width, displaySize.height);
      const cropPixelSize = cropSize.value * displayRefSize;

      const cropData = {
        originX: Math.round(cropX.value * displaySize.width * scaleX),
        originY: Math.round(cropY.value * displaySize.height * scaleY),
        width: Math.round(cropPixelSize * scaleX),
        height: Math.round(cropPixelSize * scaleY),
      };

      console.log('Cropping with:', cropData);

      const manipResult = await manipulateAsync(
        imageUri,
        [{ crop: cropData }],
        { compress: 0.9, format: SaveFormat.JPEG }
      );

      onCropComplete(manipResult.uri);
    } catch (error) {
      console.error('Crop error:', error);
      setCropping(false);
    }
  };

  const cropBoxStyle = useAnimatedStyle(() => {
    // Use the smaller dimension as reference for square crop
    const displayRefSize = Math.min(displaySize.width, displaySize.height);
    const cropPixelSize = cropSize.value * displayRefSize;

    return {
      position: 'absolute',
      left: cropX.value * displaySize.width,
      top: cropY.value * displaySize.height,
      width: cropPixelSize,
      height: cropPixelSize,
      borderWidth: 3,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
    };
  });

  // Pan gesture for moving the crop box
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      const displayRefSize = Math.min(displaySize.width, displaySize.height);
      const cropPixelSize = cropSize.value * displayRefSize;

      const deltaX = event.translationX / displaySize.width;
      const deltaY = event.translationY / displaySize.height;

      // Calculate max position based on square crop size
      const maxX = 1 - (cropPixelSize / displaySize.width);
      const maxY = 1 - (cropPixelSize / displaySize.height);

      const newX = Math.max(0, Math.min(maxX, cropX.value + deltaX));
      const newY = Math.max(0, Math.min(maxY, cropY.value + deltaY));

      cropX.value = newX;
      cropY.value = newY;
    })
    .onEnd(() => {
      'worklet';
      // Reset for next gesture
    });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading image...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crop the chessboard</Text>
        <Text style={styles.subtitle}>Drag the square box to select just the 64 chess squares</Text>
      </View>

      <View style={styles.imageWrapper}>
        <View style={[styles.imageContainer, { width: displaySize.width, height: displaySize.height }]}>
          <Image
            source={{ uri: imageUri }}
            style={{ width: displaySize.width, height: displaySize.height }}
            resizeMode="contain"
          />

          <GestureDetector gesture={panGesture}>
            <Animated.View style={cropBoxStyle}>
              <View style={styles.cropHandles}>
                <View style={[styles.handle, styles.topLeft]} />
                <View style={[styles.handle, styles.topRight]} />
                <View style={[styles.handle, styles.bottomLeft]} />
                <View style={[styles.handle, styles.bottomRight]} />
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onCancel} style={styles.cancelButton} disabled={cropping}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleCrop}
          style={[styles.cropButton, cropping && styles.buttonDisabled]}
          disabled={cropping}
        >
          {cropping ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.cropText}>Continue</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  cropHandles: {
    flex: 1,
  },
  handle: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
  },
  topLeft: { top: -12, left: -12 },
  topRight: { top: -12, right: -12 },
  bottomLeft: { bottom: -12, left: -12 },
  bottomRight: { bottom: -12, right: -12 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#374151',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cropButton: {
    flex: 2,
    paddingVertical: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cropText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
