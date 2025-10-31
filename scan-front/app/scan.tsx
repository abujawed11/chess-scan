// app/scan.tsx
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { View, Text, Image, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useRef, useState, useEffect } from 'react';

export default function Scan() {
  const isFocused = useIsFocused();               // <— key line
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [taking, setTaking] = useState(false);
  const [fen, setFen] = useState('');

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (!permission?.granted) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="mb-4">Camera access is required.</Text>
        <Pressable onPress={() => requestPermission()} className="px-4 py-2 bg-black rounded-xl">
          <Text className="text-white">Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!camRef.current) return;
    try {
      setTaking(true);
      const picture = await camRef.current.takePictureAsync({ quality: 0.85 });
      setPhotoUri(picture?.uri ?? null);
    } finally {
      setTaking(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {!photoUri ? (
        <View className="flex-1">
          {/* Ensure it’s active and has height */}
          <CameraView
            ref={camRef}
            className="flex-1"
            facing="back"
            active={isFocused}            // <— this starts the live preview
          />

          {/* Bottom capture bar overlays on top of preview */}
          <View className="p-4 bg-white">
            <Pressable onPress={takePhoto} className="px-5 py-3 rounded-2xl bg-black items-center">
              {taking ? <ActivityIndicator /> : <Text className="text-white">Capture Board</Text>}
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="flex-1 p-4">
          <Image source={{ uri: photoUri }} className="w-full h-72 rounded-2xl mb-4" />
          <Text className="mb-2 font-medium">(Prototype) Paste/Edit FEN:</Text>
          <TextInput
            placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
            value={fen}
            onChangeText={setFen}
            className="border border-neutral-300 rounded-xl p-3"
            multiline
          />
          <View className="flex-row gap-3 mt-3">
            <Pressable onPress={() => setPhotoUri(null)} className="px-4 py-3 bg-neutral-200 rounded-2xl">
              <Text>Retake</Text>
            </Pressable>
            <Pressable onPress={() => { /* navigate to analyze as before */ }} className="px-4 py-3 bg-black rounded-2xl">
              <Text className="text-white">Analyze Best Move</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
