// Chess-related TypeScript types

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export interface Square {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
}

export interface BoardPosition {
  [square: string]: ChessPiece | null; // e.g., { 'e2': { type: 'p', color: 'w' } }
}

export interface Move {
  from: string;
  to: string;
  promotion?: PieceType;
}

export interface AnalysisResult {
  bestMove: string;
  evaluation: number;
  depth?: number;
  pv?: string[]; // Principal variation
}

export interface GameState {
  fen: string;
  turn: PieceColor;
  castling: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
  enPassant: string | null;
  halfmoveClock: number;
  fullmoveNumber: number;
}

export type GameMode = 'analyze' | 'play-white' | 'play-black' | 'watch';

export interface ChessEngineConfig {
  depth: number;
  multiPV?: number;
  threads?: number;
}
