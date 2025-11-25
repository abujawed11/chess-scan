import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Board color themes (same as web app)
export const BOARD_THEMES = {
  classic: {
    name: 'Classic',
    light: '#f0d9b5',
    dark: '#b58863',
    selected: '#baca44',
    lastMoveLight: '#cdd26a',
    lastMoveDark: '#aaa23a',
    highlight: '#aaa23a',
    hover: '#cdd26a',
  },
  green: {
    name: 'Green',
    light: '#eeeed2',
    dark: '#769656',
    selected: '#baca44',
    lastMoveLight: '#f6f669',
    lastMoveDark: '#baca44',
    highlight: '#baca44',
    hover: '#f6f669',
  },
  blue: {
    name: 'Blue',
    light: '#dee3e6',
    dark: '#8ca2ad',
    selected: '#83a5c4',
    lastMoveLight: '#afc8e4',
    lastMoveDark: '#6d98ba',
    highlight: '#6d98ba',
    hover: '#afc8e4',
  },
  purple: {
    name: 'Purple',
    light: '#e8e0f0',
    dark: '#9b7bb8',
    selected: '#c4a4d8',
    lastMoveLight: '#d4c4e8',
    lastMoveDark: '#a888c8',
    highlight: '#a888c8',
    hover: '#d4c4e8',
  },
  brown: {
    name: 'Brown',
    light: '#f0d9b5',
    dark: '#946f51',
    selected: '#d4a84b',
    lastMoveLight: '#e8c878',
    lastMoveDark: '#c4983b',
    highlight: '#c4983b',
    hover: '#e8c878',
  },
  icySea: {
    name: 'Icy Sea',
    light: '#d9e4ec',
    dark: '#6a9bb8',
    selected: '#8dc4e8',
    lastMoveLight: '#b8d8f0',
    lastMoveDark: '#78b4d8',
    highlight: '#78b4d8',
    hover: '#b8d8f0',
  },
  coral: {
    name: 'Coral',
    light: '#f5e6e0',
    dark: '#d4a59a',
    selected: '#e8c8b8',
    lastMoveLight: '#f0d8c8',
    lastMoveDark: '#d8b8a8',
    highlight: '#d8b8a8',
    hover: '#f0d8c8',
  },
  dusk: {
    name: 'Dusk',
    light: '#ccb7ae',
    dark: '#706677',
    selected: '#9888a8',
    lastMoveLight: '#c4b8c8',
    lastMoveDark: '#8878a8',
    highlight: '#8878a8',
    hover: '#c4b8c8',
  },
};

// Piece set themes (from Lichess - same as web app)
export const PIECE_THEMES = {
  cburnett: { name: 'Cburnett', id: 'cburnett' },
  merida: { name: 'Merida', id: 'merida' },
  alpha: { name: 'Alpha', id: 'alpha' },
  pirouetti: { name: 'Pirouetti', id: 'pirouetti' },
  chessnut: { name: 'Chessnut', id: 'chessnut' },
  chess7: { name: 'Chess7', id: 'chess7' },
  companion: { name: 'Companion', id: 'companion' },
  riohacha: { name: 'Riohacha', id: 'riohacha' },
  kosal: { name: 'Kosal', id: 'kosal' },
  leipzig: { name: 'Leipzig', id: 'leipzig' },
  fantasy: { name: 'Fantasy', id: 'fantasy' },
  spatial: { name: 'Spatial', id: 'spatial' },
  california: { name: 'California', id: 'california' },
  pixel: { name: 'Pixel', id: 'pixel' },
  maestro: { name: 'Maestro', id: 'maestro' },
  fresca: { name: 'Fresca', id: 'fresca' },
  cardinal: { name: 'Cardinal', id: 'cardinal' },
  gioco: { name: 'Gioco', id: 'gioco' },
  tatiana: { name: 'Tatiana', id: 'tatiana' },
  staunty: { name: 'Staunty', id: 'staunty' },
  governor: { name: 'Governor', id: 'governor' },
  dubrovny: { name: 'Dubrovny', id: 'dubrovny' },
};

export type BoardThemeKey = keyof typeof BOARD_THEMES;
export type PieceThemeKey = keyof typeof PIECE_THEMES;

interface ThemeContextType {
  boardTheme: BoardThemeKey;
  pieceTheme: PieceThemeKey;
  setBoardTheme: (theme: BoardThemeKey) => void;
  setPieceTheme: (theme: PieceThemeKey) => void;
  boardColors: typeof BOARD_THEMES[BoardThemeKey];
  pieceSet: typeof PIECE_THEMES[PieceThemeKey];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'chess-theme-preferences';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [boardTheme, setBoardThemeState] = useState<BoardThemeKey>('classic');
  const [pieceTheme, setPieceThemeState] = useState<PieceThemeKey>('cburnett');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme from AsyncStorage
  useEffect(() => {
    loadTheme();
  }, []);

  // Save theme to AsyncStorage when changed
  useEffect(() => {
    if (isLoaded) {
      saveTheme();
    }
  }, [boardTheme, pieceTheme, isLoaded]);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (BOARD_THEMES[parsed.boardTheme as BoardThemeKey]) {
          setBoardThemeState(parsed.boardTheme);
        }
        if (PIECE_THEMES[parsed.pieceTheme as PieceThemeKey]) {
          setPieceThemeState(parsed.pieceTheme);
        }
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveTheme = async () => {
    try {
      const themeData = { boardTheme, pieceTheme };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(themeData));
      console.log('✅ Theme saved:', themeData);
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  };

  const setBoardTheme = (theme: BoardThemeKey) => {
    setBoardThemeState(theme);
  };

  const setPieceTheme = (theme: PieceThemeKey) => {
    setPieceThemeState(theme);
  };

  const value: ThemeContextType = {
    boardTheme,
    pieceTheme,
    setBoardTheme,
    setPieceTheme,
    boardColors: BOARD_THEMES[boardTheme],
    pieceSet: PIECE_THEMES[pieceTheme],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper function to get piece image URL from Lichess
export function getPieceImageUrl(piece: { type: string; color: string }, pieceThemeId = 'cburnett') {
  // Handle both 'w'/'b' and 'white'/'black' color formats
  const color = piece.color === 'w' || piece.color === 'white' ? 'w' : 'b';

  // Handle both short ('p', 'n', etc.) and long ('pawn', 'knight', etc.) type formats
  const typeMap: Record<string, string> = {
    p: 'P', pawn: 'P',
    n: 'N', knight: 'N',
    b: 'B', bishop: 'B',
    r: 'R', rook: 'R',
    q: 'Q', queen: 'Q',
    k: 'K', king: 'K',
  };
  const type = typeMap[piece.type.toLowerCase()] || piece.type.toUpperCase();
  return `https://lichess1.org/assets/piece/${pieceThemeId}/${color}${type}.svg`;
}
