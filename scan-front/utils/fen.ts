// FEN (Forsyth-Edwards Notation) utility functions

import { BoardPosition, ChessPiece, PieceColor, PieceType } from '@/types/chess';

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
  castling: string = 'KQkq',
  enPassant: string = '-',
  halfmove: number = 0,
  fullmove: number = 1
): string {
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

  return `${fen} ${turn} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
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
