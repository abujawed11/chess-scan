import React, { useState, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, Text, PanResponder, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import Button from './Button';

interface ImageCropperProps {
  imageUri: string;
  onConfirm: (croppedImageUri: string) => void;
  onRetake: () => void;
  onCancel: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const INITIAL_CROP_SIZE = SCREEN_WIDTH * 0.8;

export default function ImageCropper({ imageUri, onConfirm, onRetake, onCancel }: ImageCropperProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cropLoading, setCropLoading] = useState(false);
  const [imageLayout, setImageLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [containerLayout, setContainerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const imageRef = useRef<any>(null);
  const containerRef = useRef<any>(null);

  // Crop area position and size (animated)
  const pan = useRef(new Animated.ValueXY({ x: (SCREEN_WIDTH - INITIAL_CROP_SIZE) / 2, y: 100 })).current;
  const cropSize = useRef(new Animated.Value(INITIAL_CROP_SIZE)).current;

  // Get image dimensions
  React.useEffect(() => {
    Image.getSize(imageUri, (width, height) => {
      setImageSize({ width, height });
    });
  }, [imageUri]);

  // Pan responder for moving the crop frame
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // Handle crop confirmation
  const handleConfirm = async () => {
    setCropLoading(true);
    try {
      // Get current crop position and size
      const cropX = (pan.x as any)._value;
      const cropY = (pan.y as any)._value;
      const size = (cropSize as any)._value;

      console.log('='.repeat(60));
      console.log('🎯 CROP DEBUG START (NEW COORDINATE SYSTEM)');
      console.log('='.repeat(60));
      console.log('📱 Screen dimensions:', { SCREEN_WIDTH, SCREEN_HEIGHT });
      console.log('🎯 Crop Box Position (pan values - relative to image wrapper):', { cropX, cropY, size });
      console.log('📦 Container Layout:', containerLayout);
      console.log('📏 Image Layout (within wrapper):', imageLayout);
      console.log('🖼️ Original Image Size:', imageSize);

      // Since crop overlay is now in the same coordinate space as the Image,
      // we use the Image wrapper dimensions (which should match containerLayout roughly)
      const wrapperWidth = containerLayout.width || SCREEN_WIDTH;
      const wrapperHeight = containerLayout.height || SCREEN_HEIGHT * 0.7;

      // Calculate where the actual image pixels are displayed within the wrapper
      const imageAspect = imageSize.width / imageSize.height;
      const wrapperAspect = wrapperWidth / wrapperHeight;

      let actualDisplayWidth, actualDisplayHeight, imageStartX, imageStartY;

      console.log('📊 Aspect Ratios:', { imageAspect, wrapperAspect });

      if (imageAspect > wrapperAspect) {
        // Image is wider - fit to wrapper width
        actualDisplayWidth = wrapperWidth;
        actualDisplayHeight = wrapperWidth / imageAspect;
        imageStartX = 0;
        imageStartY = (wrapperHeight - actualDisplayHeight) / 2;
      } else {
        // Image is taller - fit to wrapper height  
        actualDisplayHeight = wrapperHeight;
        actualDisplayWidth = wrapperHeight * imageAspect;
        imageStartX = (wrapperWidth - actualDisplayWidth) / 2;
        imageStartY = 0;
      }

      console.log('📐 Actual Image Display (in wrapper):', { 
        width: actualDisplayWidth, 
        height: actualDisplayHeight,
        startX: imageStartX,
        startY: imageStartY 
      });

      // Calculate crop position relative to the displayed image
      // Now cropX and cropY are already in the same coordinate space as the image wrapper
      const relativeCropX = cropX - imageStartX;
      const relativeCropY = cropY - imageStartY;

      console.log('🔄 Crop Position Relative to Actual Image:', { relativeCropX, relativeCropY });
      console.log('📊 Crop as % of image:', {
        xPercent: ((relativeCropX / actualDisplayWidth) * 100).toFixed(1) + '%',
        yPercent: ((relativeCropY / actualDisplayHeight) * 100).toFixed(1) + '%',
        sizePercent: ((size / actualDisplayWidth) * 100).toFixed(1) + '%'
      });

      // Scale to original image coordinates
      const scaleX = imageSize.width / actualDisplayWidth;
      const scaleY = imageSize.height / actualDisplayHeight;

      console.log('🔢 Scale Factors:', { scaleX, scaleY });

      const originX = Math.max(0, relativeCropX * scaleX);
      const originY = Math.max(0, relativeCropY * scaleY);
      const cropWidth = Math.min(size * scaleX, imageSize.width - originX);
      const cropHeight = Math.min(size * scaleY, imageSize.height - originY);

      console.log('✂️ Final Crop in Original Image:', {
        originX: Math.round(originX),
        originY: Math.round(originY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight)
      });
      console.log('📊 Crop as % of original:', {
        xPercent: ((originX / imageSize.width) * 100).toFixed(1) + '%',
        yPercent: ((originY / imageSize.height) * 100).toFixed(1) + '%',
        widthPercent: ((cropWidth / imageSize.width) * 100).toFixed(1) + '%',
        heightPercent: ((cropHeight / imageSize.height) * 100).toFixed(1) + '%'
      });

      // Prepare manipulation actions
      const actions: any[] = [
        {
          crop: {
            originX: Math.round(originX),
            originY: Math.round(originY),
            width: Math.round(cropWidth),
            height: Math.round(cropHeight),
          },
        },
      ];

      // Only resize if crop is larger than 1600px (avoid upscaling)
      if (cropWidth > 1600) {
        actions.push({ resize: { width: 1600 } });
        console.log('📏 Resizing to 1600px width');
      } else {
        console.log('📏 Keeping original crop size:', Math.round(cropWidth));
      }

      // Crop the image
      const croppedImage = await manipulateAsync(
        imageUri,
        actions,
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      console.log('✅ Cropped image created:', croppedImage.uri);
      console.log('='.repeat(60));
      onConfirm(croppedImage.uri);
    } catch (error) {
      console.error('❌ Crop error:', error);
      // If crop fails, use original image
      onConfirm(imageUri);
    } finally {
      setCropLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Image Preview */}
      <View 
        style={styles.imageContainer}
        onLayout={(event) => {
          const { x, y, width, height } = event.nativeEvent.layout;
          setContainerLayout({ x, y, width, height });
          console.log('📦 Container Layout Measured:', { x, y, width, height });
        }}
      >
        <View style={{ position: 'relative', flex: 1, width: '100%' }}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
            onLayout={(event) => {
              const { x, y, width, height } = event.nativeEvent.layout;
              setImageLayout({ x, y, width, height });
              console.log('🖼️ Image Layout Measured (within wrapper):', { x, y, width, height });
            }}
          />

          {/* Crop Frame Overlay - Positioned absolutely WITHIN the image wrapper */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }} pointerEvents="box-none">
          {/* Debug: Show actual image boundaries */}
          {containerLayout.width > 0 && imageSize.width > 0 && (() => {
            const wrapperWidth = containerLayout.width;
            const wrapperHeight = containerLayout.height;
            const imageAspect = imageSize.width / imageSize.height;
            const wrapperAspect = wrapperWidth / wrapperHeight;
            
            let displayWidth, displayHeight, startX, startY;
            if (imageAspect > wrapperAspect) {
              displayWidth = wrapperWidth;
              displayHeight = wrapperWidth / imageAspect;
              startX = 0;
              startY = (wrapperHeight - displayHeight) / 2;
            } else {
              displayHeight = wrapperHeight;
              displayWidth = wrapperHeight * imageAspect;
              startX = (wrapperWidth - displayWidth) / 2;
              startY = 0;
            }
            
            return (
              <View
                style={{
                  position: 'absolute',
                  left: startX,
                  top: startY,
                  width: displayWidth,
                  height: displayHeight,
                  borderWidth: 3,
                  borderColor: 'rgba(255, 0, 0, 0.8)',
                  borderStyle: 'dashed',
                  pointerEvents: 'none',
                }}
              />
            );
          })()}

          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.cropFrame,
              {
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
                width: cropSize,
                height: cropSize,
              },
            ]}
          >
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Drag hint */}
            <View style={styles.dragHint}>
              <Text style={styles.dragHintText}>Drag to adjust</Text>
            </View>
          </Animated.View>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.9)']}
        style={styles.instructionsContainer}
      >
        <Text style={styles.instructionsTitle}>Position the Chessboard</Text>
        <Text style={styles.instructionsText}>
          Drag the frame to position over the chessboard
        </Text>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <View style={styles.topButtons}>
          <Button
            title="✕ Cancel"
            onPress={onCancel}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>

        <View style={styles.bottomButtons}>
          <Button
            title="↻ Retake"
            onPress={onRetake}
            variant="secondary"
            style={styles.retakeButton}
          />
          <Button
            title="✓ Use Photo"
            onPress={handleConfirm}
            loading={cropLoading}
            variant="primary"
            style={styles.confirmButton}
          />
          <Button
            title="🧪 Test: Use Full Image"
            onPress={() => {
              console.log('🧪 Testing with full uncropped image');
              onConfirm(imageUri);
            }}
            variant="secondary"
            style={{ marginTop: 8 }}
          />
          <Button
            title="🔬 Test: Crop Bottom Half"
            onPress={async () => {
              console.log('🔬 Testing: Cropping bottom 60% of image');
              try {
                const cropFromPercent = 40; // Start at 40% down
                const cropHeightPercent = 60; // Take 60% height
                
                const originY = Math.round((imageSize.height * cropFromPercent) / 100);
                const cropHeight = Math.round((imageSize.height * cropHeightPercent) / 100);
                
                console.log(`🔬 Cropping from ${cropFromPercent}% (y=${originY}) with height ${cropHeightPercent}% (${cropHeight}px)`);
                
                const testCrop = await manipulateAsync(
                  imageUri,
                  [{
                    crop: {
                      originX: 0,
                      originY,
                      width: imageSize.width,
                      height: cropHeight,
                    }
                  }],
                  { compress: 0.8, format: SaveFormat.JPEG }
                );
                
                console.log('🔬 Test crop created:', testCrop.uri);
                onConfirm(testCrop.uri);
              } catch (error) {
                console.error('🔬 Test crop failed:', error);
              }
            }}
            variant="secondary"
            style={{ marginTop: 8 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  cropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cropFrame: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  dragHint: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -15 }],
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dragHintText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#667eea',
    borderWidth: 4,
  },
  topLeft: {
    top: -4,
    left: -4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -4,
    right: -4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -4,
    left: -4,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -4,
    right: -4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  instructionsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  instructionsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topButtons: {
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 2,
  },
});
