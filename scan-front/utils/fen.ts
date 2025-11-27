// FEN (Forsyth-Edwards Notation) utility functions

import { BoardPosition, ChessPiece, PieceColor, PieceType } from '@/types/chess';
import { Chess } from 'chess.js';

/**
 * Infer castling rights from piece positions
 * Checks if king and rooks are in their starting positions
 */
export function inferCastlingRights(position: BoardPosition): { K: boolean; Q: boolean; k: boolean; q: boolean } {
  const rights = { K: false, Q: false, k: false, q: false };

  // White castling
  const whiteKing = position['e1'];
  const whiteRookH = position['h1'];
  const whiteRookA = position['a1'];

  if (whiteKing?.type === 'k' && whiteKing?.color === 'w') {
    if (whiteRookH?.type === 'r' && whiteRookH?.color === 'w') {
      rights.K = true; // White kingside
    }
    if (whiteRookA?.type === 'r' && whiteRookA?.color === 'w') {
      rights.Q = true; // White queenside
    }
  }

  // Black castling
  const blackKing = position['e8'];
  const blackRookH = position['h8'];
  const blackRookA = position['a8'];

  if (blackKing?.type === 'k' && blackKing?.color === 'b') {
    if (blackRookH?.type === 'r' && blackRookH?.color === 'b') {
      rights.k = true; // Black kingside
    }
    if (blackRookA?.type === 'r' && blackRookA?.color === 'b') {
      rights.q = true; // Black queenside
    }
  }

  return rights;
}

/**
 * Sanitize castling rights based on legal possibilities
 */
export function sanitizeCastling(
  legal: { K: boolean; Q: boolean; k: boolean; q: boolean },
  chosen: { K: boolean; Q: boolean; k: boolean; q: boolean }
): { K: boolean; Q: boolean; k: boolean; q: boolean } {
  return {
    K: legal.K && chosen.K,
    Q: legal.Q && chosen.Q,
    k: legal.k && chosen.k,
    q: legal.q && chosen.q,
  };
}

/**
 * Validate FEN using chess.js and check for illegal positions
 */
export function validateFenWithChess(fen: string): { valid: boolean; reason?: string } {
  try {
    const chess = new Chess(fen);

    // Check if the opponent's king (side that just moved) is in check
    // If it's White's turn, check if Black's king is in check (illegal!)
    // If it's Black's turn, check if White's king is in check (illegal!)

    const currentTurn = chess.turn(); // 'w' or 'b'
    const opponentColor = currentTurn === 'w' ? 'b' : 'w';

    // Temporarily switch turns to check if opponent king is in check
    const fenParts = fen.split(' ');
    fenParts[1] = opponentColor;
    const testFen = fenParts.join(' ');

    try {
      const testChess = new Chess(testFen);
      if (testChess.inCheck()) {
        return {
          valid: false,
          reason: `Position is illegal: ${opponentColor === 'w' ? 'White' : 'Black'}'s king is in check, but it's ${currentTurn === 'w' ? 'White' : 'Black'}'s turn to move. This means ${opponentColor === 'w' ? 'White' : 'Black'} would have moved and left their king in check, which is not allowed.`
        };
      }
    } catch (e) {
      // If we can't create test position, just continue with basic validation
    }

    return { valid: true };
  } catch (e: any) {
    return { valid: false, reason: e?.message || 'Invalid FEN' };
  }
}

/**
 * Smart validation: try both sides to find a legal position
 */
export function validateAndFixSide(fen: string): {
  valid: boolean;
  fen: string;
  sideChanged: boolean;
  correctedSide?: PieceColor;
  reason?: string;
} {
  // First try the FEN as-is
  const result = validateFenWithChess(fen);
  if (result.valid) {
    return { valid: true, fen, sideChanged: false };
  }

  // If invalid, try flipping the side to move
  const parts = fen.split(' ');
  if (parts.length >= 2) {
    const originalSide = parts[1];
    const flippedSide = originalSide === 'w' ? 'b' : 'w';
    parts[1] = flippedSide;
    const flippedFen = parts.join(' ');

    const flippedResult = validateFenWithChess(flippedFen);
    if (flippedResult.valid) {
      return {
        valid: true,
        fen: flippedFen,
        sideChanged: true,
        correctedSide: flippedSide as PieceColor,
        reason: `Position is illegal with ${originalSide === 'w' ? 'White' : 'Black'} to move (opponent in check). Auto-corrected to ${flippedSide === 'w' ? 'White' : 'Black'} to move.`
      };
    }
  }

  // Both failed, return original error
  return { valid: false, fen, sideChanged: false, reason: result.reason };
}

/**
 * Converts FEN string to board position object
 */
export function fenToPosition(fen: string): BoardPosition {
  const position: BoardPosition = {};
  const [boardPart] = fen.split(' ');
  const ranks = boardPart.split('/');

  ranks.forEach((rank, rankIndex) => {
    let fileIndex = 0;
    for (const char of rank) {
      if (isNaN(parseInt(char))) {
        // It's a piece
        const color: PieceColor = char === char.toUpperCase() ? 'w' : 'b';
        const type: PieceType = char.toLowerCase() as PieceType;
        const square = fileToLetter(fileIndex) + (8 - rankIndex);
        position[square] = { type, color };
        fileIndex++;
      } else {
        // It's a number representing empty squares
        fileIndex += parseInt(char);
      }
    }
  });

  return position;
}

/**
 * Converts board position object to FEN string
 */
export function positionToFen(
  position: BoardPosition,
  turn: PieceColor = 'w',
  castling: string | { K: boolean; Q: boolean; k: boolean; q: boolean } = '-',
  enPassant: string = '-',
  halfmove: number = 0,
  fullmove: number = 1
): string {
  // Infer legal castling rights from piece positions
  const legalCastling = inferCastlingRights(position);

  // Convert castling object to string if needed
  let castlingStr = '-';
  if (typeof castling === 'object') {
    // Sanitize chosen castling based on legal possibilities
    const sanitized = sanitizeCastling(legalCastling, castling);
    const rights = [];
    if (sanitized.K) rights.push('K');
    if (sanitized.Q) rights.push('Q');
    if (sanitized.k) rights.push('k');
    if (sanitized.q) rights.push('q');
    castlingStr = rights.length > 0 ? rights.join('') : '-';
  } else if (castling === '-' || !castling) {
    // If no castling specified, use inferred rights
    const rights = [];
    if (legalCastling.K) rights.push('K');
    if (legalCastling.Q) rights.push('Q');
    if (legalCastling.k) rights.push('k');
    if (legalCastling.q) rights.push('q');
    castlingStr = rights.length > 0 ? rights.join('') : '-';
  } else {
    castlingStr = castling || '-';
  }

  // Normalize en passant
  const epStr = enPassant && enPassant !== '' ? enPassant : '-';
  let fen = '';

  for (let rank = 7; rank >= 0; rank--) {
    let emptyCount = 0;
    for (let file = 0; file < 8; file++) {
      const square = fileToLetter(file) + (rank + 1);
      const piece = position[square];

      if (piece) {
        if (emptyCount > 0) {
          fen += emptyCount;
          emptyCount = 0;
        }
        const pieceChar = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
        fen += pieceChar;
      } else {
        emptyCount++;
      }
    }

    if (emptyCount > 0) {
      fen += emptyCount;
    }

    if (rank > 0) {
      fen += '/';
    }
  }

  return `${fen} ${turn} ${castlingStr} ${epStr} ${halfmove} ${fullmove}`;
}

/**
 * Validates FEN string format
 */
export function isValidFen(fen: string): boolean {
  const parts = fen.trim().split(/\s+/);
  if (parts.length !== 6) return false;

  const [board, turn, castling, enPassant, halfmove, fullmove] = parts;

  // Validate board
  const ranks = board.split('/');
  if (ranks.length !== 8) return false;

  for (const rank of ranks) {
    let count = 0;
    for (const char of rank) {
      if (isNaN(parseInt(char))) {
        if (!'pnbrqkPNBRQK'.includes(char)) return false;
        count++;
      } else {
        count += parseInt(char);
      }
    }
    if (count !== 8) return false;
  }

  // Validate turn
  if (turn !== 'w' && turn !== 'b') return false;

  // Validate castling
  if (!/^(-|[KQkq]{1,4})$/.test(castling)) return false;

  // Validate en passant
  if (enPassant !== '-' && !/^[a-h][36]$/.test(enPassant)) return false;

  // Validate halfmove and fullmove
  if (isNaN(parseInt(halfmove)) || isNaN(parseInt(fullmove))) return false;

  return true;
}

/**
 * Convert file index (0-7) to letter (a-h)
 */
function fileToLetter(file: number): string {
  return String.fromCharCode(97 + file); // 97 is 'a'
}

/**
 * Convert letter (a-h) to file index (0-7)
 */
export function letterToFile(letter: string): number {
  return letter.charCodeAt(0) - 97;
}

/**
 * Get piece unicode symbol
 */
export function getPieceSymbol(piece: ChessPiece): string {
  const symbols: Record<string, string> = {
    'wk': '♔', 'wq': '♕', 'wr': '♖', 'wb': '♗', 'wn': '♘', 'wp': '♙',
    'bk': '♚', 'bq': '♛', 'br': '♜', 'bb': '♝', 'bn': '♞', 'bp': '♟',
  };
  return symbols[`${piece.color}${piece.type}`] || '';
}
