// Chess engine service using chess.js and backend API

import { Chess } from 'chess.js';
import axios from 'axios';
import { API_CONFIG, CHESS_CONFIG } from '@/constants/config';
import { AnalysisResult, Move, GameMode } from '@/types/chess';

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
 * Get best move from chess engine
 */
export async function getBestMove(fen: string, depth: number = CHESS_CONFIG.ENGINE_DEPTH): Promise<AnalysisResult> {
  try {
    const response = await axios.post<AnalysisResult>(
      `${API_CONFIG.CHESS_ENGINE_URL}/analyze`,
      {
        fen,
        depth,
        multiPV: 1,
      },
      {
        timeout: API_CONFIG.TIMEOUT,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Chess engine error:', error);

    // Fallback: use chess.js to find a random legal move
    const game = new Chess(fen);
    const moves = game.moves({ verbose: true });
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
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
