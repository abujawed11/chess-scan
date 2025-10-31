import { Link } from "expo-router";
import { View, Text } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-semibold mb-6">Chess Scan</Text>
      <Link
        href="/scan"
        className="px-5 py-3 rounded-2xl bg-black"
      >
        <Text className="text-white text-base">Open Camera</Text>
      </Link>
    </View>
  );
}
