// App configuration constants

export const API_CONFIG = {
  // Chess Detector Backend (FastAPI with YOLO models)
  // Default port: 8000 (FastAPI uvicorn default)
  // For Android emulator (10.0.2.2 = localhost on your computer)
  VISION_API_URL: process.env.EXPO_PUBLIC_VISION_API_URL || 'http://10.0.2.2:8000',
  CHESS_ENGINE_URL: process.env.EXPO_PUBLIC_CHESS_ENGINE_URL || 'http://10.0.2.2:8000',

  // For iOS simulator, use: http://localhost:8000
  // For physical device, use your computer's IP: http://192.168.1.XXX:8000
  
  // NOTE: If your backend runs on a different port, set these in your .env file:
  // EXPO_PUBLIC_VISION_API_URL=http://10.0.2.2:8001
  // EXPO_PUBLIC_CHESS_ENGINE_URL=http://10.0.2.2:8001

  TIMEOUT: 30000,
};

export const CHESS_CONFIG = {
  DEFAULT_FEN: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  ENGINE_DEPTH: 15,
  ENGINE_THREADS: 1,
};

export const CAMERA_CONFIG = {
  QUALITY: 0.85,
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1920,
};

export const BOARD_CONFIG = {
  SQUARE_SIZE: 45, // pixels
  LIGHT_SQUARE_COLOR: '#f0d9b5',
  DARK_SQUARE_COLOR: '#b58863',
};
