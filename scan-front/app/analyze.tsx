import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";

type Result = { best_move?: string; score?: string; error?: string };

export default function Analyze() {
  const { fen } = useLocalSearchParams<{ fen?: string }>();
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);

  const analyze = async () => {
    if (!fen) return;
    setLoading(true);
    try {
      // Step 3 will wire this to your backend
      // Temporary mock:
      const mock: Result = { best_move: "e2e4", score: "+0.20" };
      await new Promise(r => setTimeout(r, 600));
      setRes(mock);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyze();
  }, [fen]);

  return (
    <View className="flex-1 items-center justify-center p-6 bg-white">
      <Text className="text-lg font-semibold mb-2">FEN</Text>
      <Text className="text-center text-xs mb-6">{fen || "(none)"}</Text>

      {loading ? (
        <ActivityIndicator />
      ) : res?.error ? (
        <Text className="text-red-600 mb-6">{res.error}</Text>
      ) : (
        <>
          <Text className="text-2xl mb-2">Best move</Text>
          <Text className="text-3xl font-bold mb-6">{res?.best_move ?? "-"}</Text>
          <Text className="text-neutral-500 mb-8">{res?.score ? `Eval: ${res.score}` : ""}</Text>
        </>
      )}

      <Pressable
        onPress={() => router.back()}
        className="px-5 py-3 rounded-2xl bg-black"
      >
        <Text className="text-white">Back</Text>
      </Pressable>
    </View>
  );
}
