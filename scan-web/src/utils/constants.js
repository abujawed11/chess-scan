// Chess board constants
export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

// API endpoints
export const API_BASE_URL = 'http://localhost:3000';
export const API_ENDPOINTS = {
  EXTRACT_GRID: `${API_BASE_URL}/api/vision/extract-grid`,
};

// Game modes
export const GAME_MODES = {
  HUMAN_VS_HUMAN: 'hvh',
  HUMAN_VS_COMPUTER: 'hvc',
  COMPUTER_VS_COMPUTER: 'cvc',
  ANALYZE: 'analyze',
};

// Default Stockfish settings
export const STOCKFISH_CONFIG = {
  WORKER_PATH: '/stockfish.js',
  DEFAULT_DEPTH: 18,
  MULTI_PV: 1,
};

// Colors
export const COLORS = {
  WHITE: 'white',
  BLACK: 'black',
};
