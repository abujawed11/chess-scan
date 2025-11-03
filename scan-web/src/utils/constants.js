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
// export const STOCKFISH_CONFIG = {
//   WORKER_PATH: '/stockfish.js',
//   DEFAULT_DEPTH: 18,
//   MULTI_PV: 1,
// };
export const STOCKFISH_CONFIG = {
  WORKER_PATH: '/stockfish-17.1-lite-single-03e3232.js', // exact filename you downloaded
  DEFAULT_DEPTH: 18,
  MULTI_PV: 1,
  VERSION: 'Stockfish 17.1',
  VARIANT: 'Lite (Single)',
};

// Colors
export const COLORS = {
  WHITE: 'white',
  BLACK: 'black',
};

// Time Controls for Chess Clock
export const TIME_CONTROLS = {
  // Unlimited
  UNLIMITED: { 
    name: 'Unlimited', 
    minutes: Infinity, 
    increment: 0, 
    category: '∞ Unlimited',
    description: 'No time limit'
  },
  
  // Bullet
  BULLET_1_0: { 
    name: '1+0 Bullet', 
    minutes: 1, 
    increment: 0, 
    category: '⚡ Bullet',
    description: 'Fast-paced, quick decisions'
  },
  BULLET_1_1: { 
    name: '1+1 Bullet', 
    minutes: 1, 
    increment: 1, 
    category: '⚡ Bullet',
    description: 'Fast-paced with small increment'
  },
  BULLET_2_1: { 
    name: '2+1 Bullet', 
    minutes: 2, 
    increment: 1, 
    category: '⚡ Bullet',
    description: 'Fast-paced, slightly more time'
  },
  
  // Blitz
  BLITZ_3_0: { 
    name: '3+0 Blitz', 
    minutes: 3, 
    increment: 0, 
    category: '⚙️ Blitz',
    description: 'Fast game without increment'
  },
  BLITZ_3_2: { 
    name: '3+2 Blitz', 
    minutes: 3, 
    increment: 2, 
    category: '⚙️ Blitz',
    description: 'Fast game with increment'
  },
  BLITZ_5_0: { 
    name: '5+0 Blitz', 
    minutes: 5, 
    increment: 0, 
    category: '⚙️ Blitz',
    description: 'Popular fast format'
  },
  BLITZ_5_3: { 
    name: '5+3 Blitz', 
    minutes: 5, 
    increment: 3, 
    category: '⚙️ Blitz',
    description: 'Balanced, some thinking time'
  },
  
  // Rapid
  RAPID_10_0: { 
    name: '10+0 Rapid', 
    minutes: 10, 
    increment: 0, 
    category: '📈 Rapid',
    description: 'Medium pace game'
  },
  RAPID_10_5: { 
    name: '10+5 Rapid', 
    minutes: 10, 
    increment: 5, 
    category: '📈 Rapid',
    description: 'Comfortable thinking time'
  },
  RAPID_15_10: { 
    name: '15+10 Rapid', 
    minutes: 15, 
    increment: 10, 
    category: '📈 Rapid',
    description: 'Slower, more thoughtful play'
  },
  
  // Classical
  CLASSICAL_30_0: { 
    name: '30+0 Classical', 
    minutes: 30, 
    increment: 0, 
    category: '♟️ Classical',
    description: 'Long game, plenty of time'
  },
  CLASSICAL_30_20: { 
    name: '30+20 Classical', 
    minutes: 30, 
    increment: 20, 
    category: '♟️ Classical',
    description: 'Tournament-style format'
  },
};

// Default time control
export const DEFAULT_TIME_CONTROL = TIME_CONTROLS.BLITZ_5_3;
