import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/context/ThemeContext';
import { useEffect } from 'react';
import { initializeEngine } from '@/services/chessEngine';
import '../global.css';

export default function RootLayout() {
  // Initialize chess engine when app starts
  useEffect(() => {
    console.log('🚀 App started, initializing chess engine...');
    initializeEngine()
      .then(success => {
        if (success) {
          console.log('✅ Chess engine ready for analysis');
        } else {
          console.warn('⚠️ Chess engine initialization failed. Analysis features may not work.');
          console.warn('💡 Make sure the backend is running at:', process.env.EXPO_PUBLIC_CHESS_ENGINE_URL || 'http://10.0.2.2:8000');
        }
      })
      .catch(err => {
        console.error('❌ Engine initialization error:', err);
      });
  }, []);

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
