import { FILES, RANKS } from './constants';

// Piece mapping for image URLs
const PIECE_MAP = {
  'K': 'wK', 'Q': 'wQ', 'R': 'wR', 'B': 'wB', 'N': 'wN', 'P': 'wP',
  'k': 'bK', 'q': 'bQ', 'r': 'bR', 'b': 'bB', 'n': 'bN', 'p': 'bP'
};

/**
 * Get piece image URL from Lichess CDN
 * @param {string} piece - Chess piece character (e.g., 'K', 'p')
 * @returns {string} Image URL
 */
export function getPieceImageUrl(piece) {
  const pieceName = PIECE_MAP[piece];
  if (!pieceName) return '';
  return `https://lichess1.org/assets/piece/cburnett/${pieceName}.svg`;
}

/**
 * Convert square notation to board unit coordinates (0-8)
 * @param {string} square - Square notation (e.g., 'e4')
 * @returns {{x: number, y: number} | null} Coordinates or null if invalid
 */
export function squareToUnitXY(square) {
  const file = square[0];
  const rank = parseInt(square[1], 10);
  const fx = FILES.indexOf(file);          // 0..7 (a..h)
  const ry = RANKS.indexOf(rank);          // 0..7 (8..1)
  if (fx < 0 || ry < 0) return null;
  // Center of the square in "board units"
  return { x: fx + 0.5, y: ry + 0.5 };
}

/**
 * Check if a square is light colored
 * @param {number} rank - Rank index (0-7)
 * @param {number} file - File index (0-7)
 * @returns {boolean}
 */
export function isLightSquare(rank, file) {
  return (rank + file) % 2 === 0;
}

/**
 * Get square notation from rank and file indices
 * @param {number} file - File index (0-7)
 * @param {number} rank - Rank index (0-7)
 * @returns {string} Square notation (e.g., 'e4')
 */
export function getSquareNotation(file, rank) {
  return `${FILES[file]}${RANKS[rank]}`;
}
