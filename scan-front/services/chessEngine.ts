// Chess engine service using chess.js and backend API
// Uses the same backend as the web app (chess-detector/chess-api)

import { Chess } from 'chess.js';
import axios from 'axios';
import { API_CONFIG, CHESS_CONFIG } from '@/constants/config';
import { AnalysisResult, Move, GameMode } from '@/types/chess';

// Debug: Log configuration when module loads
console.log('♟️ Chess Engine Module Loaded');
console.log('🔗 CHESS_ENGINE_URL:', API_CONFIG.CHESS_ENGINE_URL);
console.log('⚙️ Engine Depth:', CHESS_CONFIG.ENGINE_DEPTH);

/**
 * Initialize a new chess game from FEN
 */
export function createChessGame(fen?: string): Chess {
  try {
    return new Chess(fen || CHESS_CONFIG.DEFAULT_FEN);
  } catch (error) {
    console.error('Invalid FEN, using default position:', error);
    return new Chess();
  }
}

/**
 * Validate if a move is legal
 */
export function isLegalMove(game: Chess, from: string, to: string): boolean {
  const moves = game.moves({ square: from as any, verbose: true });
  return moves.some(move => move.to === to);
}

/**
 * Make a move on the chess board
 */
export function makeMove(game: Chess, move: Move): boolean {
  try {
    game.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || 'q',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Backend analysis response format (matches chess-detector/chess-api)
 */
interface BackendAnalysisResponse {
  evaluation: { type: 'cp' | 'mate'; value: number };
  lines: Array<{
    multipv: number;
    cp: number | null;
    mate: number | null;
    depth: number;
    pv: string[];
    pvSan?: string;
  }>;
  depth: number;
  bestMove: string;
  fen: string;
  side_to_move: 'white' | 'black';
}

/**
 * Get analysis from backend Stockfish engine
 * Uses the same /analyze endpoint as the web app
 */
export async function getBestMove(fen: string, depth: number = CHESS_CONFIG.ENGINE_DEPTH): Promise<AnalysisResult> {
  console.log('🤔 getBestMove called');
  console.log('📍 FEN:', fen);
  console.log('🎯 Depth:', depth);
  console.log('🔗 Backend URL:', API_CONFIG.CHESS_ENGINE_URL);

  try {
    const formData = new FormData();
    formData.append('fen', fen);
    formData.append('depth', depth.toString());
    formData.append('multipv', '1');

    console.log('🚀 Sending analysis request to:', `${API_CONFIG.CHESS_ENGINE_URL}/analyze`);

    const response = await axios.post<BackendAnalysisResponse>(
      `${API_CONFIG.CHESS_ENGINE_URL}/analyze`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: API_CONFIG.TIMEOUT,
      }
    );

    console.log('✅ Analysis response received!');
    console.log('📊 Full response:', JSON.stringify(response.data, null, 2));

    // Convert backend format to mobile app format
    const evaluation = response.data.evaluation;
    let evalScore = 0;
    if (evaluation.type === 'cp') {
      evalScore = evaluation.value / 100; // Convert centipawns to pawns
    } else if (evaluation.type === 'mate') {
      evalScore = evaluation.value > 0 ? 100 : -100; // Mate in X moves
    }

    console.log('♟️ Best move:', response.data.bestMove);
    console.log('📈 Evaluation:', evalScore);

    return {
      bestMove: response.data.bestMove,
      evaluation: evalScore,
      depth: response.data.depth,
      pv: response.data.lines[0]?.pv || [],
    };
  } catch (error) {
    console.error('❌ Chess engine error:', error);

    if (axios.isAxiosError(error)) {
      console.error('📡 Request URL:', error.config?.url);
      console.error('🔧 Request method:', error.config?.method);
      console.error('📨 Response status:', error.response?.status);
      console.error('📄 Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('🔌 Network error:', error.message);
      console.error('❗ Error code:', error.code);

      // Check if it's a network issue
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to chess engine backend. Is the server running?');
      }

      if (error.code === 'ETIMEDOUT') {
        throw new Error('Chess engine request timed out. Check your connection.');
      }

      if (error.response?.data?.error) {
        throw new Error(`Backend error: ${error.response.data.error}`);
      }
    }

    // Fallback: use chess.js to find a random legal move
    console.log('⚠️ Using fallback random move');
    const game = new Chess(fen);
    const moves = game.moves({ verbose: true });
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      console.log('🎲 Random move:', `${randomMove.from}${randomMove.to}`);
      return {
        bestMove: `${randomMove.from}${randomMove.to}`,
        evaluation: 0,
        depth: 1,
      };
    }

    throw new Error('No legal moves available');
  }
}

/**
 * Get all legal moves for current position
 */
export function getLegalMoves(game: Chess): string[] {
  return game.moves();
}

/**
 * Check game status
 */
export function getGameStatus(game: Chess): {
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
} {
  return {
    isCheck: game.inCheck(),
    isCheckmate: game.isCheckmate(),
    isStalemate: game.isStalemate(),
    isDraw: game.isDraw(),
    isGameOver: game.isGameOver(),
  };
}

/**
 * Undo last move
 */
export function undoMove(game: Chess): boolean {
  const move = game.undo();
  return move !== null;
}
