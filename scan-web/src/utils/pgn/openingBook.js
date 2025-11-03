// src/utils/pgn/openingBook.js
import openingData from './openingBook.json';

/**
 * Check if a position (FEN) is in the opening book
 * @param {string} fen - FEN string of the position
 * @returns {Object|null} Opening info if found, null otherwise
 */
export function isInOpeningBook(fen) {
  if (!fen) return null;

  // Simplify FEN for comparison (ignore move counters)
  const simplifiedFen = simplifyFEN(fen);

  const opening = openingData.openings.find(op => {
    const simplifiedOpening = simplifyFEN(op.fen);
    return simplifiedOpening === simplifiedFen;
  });

  return opening || null;
}

/**
 * Check if a move number is likely within opening theory
 * Simple heuristic: first 16 plies (8 moves per side)
 * @param {number} ply - Ply number (half-move)
 * @returns {boolean} True if within typical opening range
 */
export function isOpeningPly(ply) {
  return ply <= 16;
}

/**
 * Get opening name for a position
 * @param {string} fen - FEN string
 * @returns {string|null} Opening name if found
 */
export function getOpeningName(fen) {
  const opening = isInOpeningBook(fen);
  return opening ? opening.name : null;
}

/**
 * Get ECO code for a position
 * @param {string} fen - FEN string
 * @returns {string|null} ECO code if found
 */
export function getECOCode(fen) {
  const opening = isInOpeningBook(fen);
  return opening ? opening.eco : null;
}

/**
 * Simplify FEN for comparison
 * Remove half-move clock and full move number for matching
 * @param {string} fen - Full FEN string
 * @returns {string} Simplified FEN
 */
function simplifyFEN(fen) {
  if (!fen) return '';

  // FEN format: position side castling en-passant half full
  // We keep: position side castling en-passant
  const parts = fen.split(' ');

  if (parts.length < 4) return fen;

  return parts.slice(0, 4).join(' ');
}

/**
 * Find all openings in the book
 * @returns {Array} Array of all openings
 */
export function getAllOpenings() {
  return openingData.openings;
}

/**
 * Search openings by name
 * @param {string} query - Search query
 * @returns {Array} Matching openings
 */
export function searchOpenings(query) {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();

  return openingData.openings.filter(opening =>
    opening.name.toLowerCase().includes(lowerQuery) ||
    (opening.eco && opening.eco.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Check if a move should be marked as "book" based on position and ply
 * @param {string} fen - Position FEN
 * @param {number} ply - Ply number
 * @returns {boolean} True if move should be marked as book
 */
export function isBookMove(fen, ply) {
  // Only check opening plies
  if (!isOpeningPly(ply)) {
    return false;
  }

  // Check if position is in opening book
  return isInOpeningBook(fen) !== null;
}

/**
 * Get opening progression for a game
 * Returns the longest opening line found
 * @param {Array} moves - Array of move objects with fenAfter
 * @returns {Object} Opening progression info
 */
export function getOpeningProgression(moves) {
  if (!moves || moves.length === 0) {
    return {
      opening: null,
      lastBookPly: 0,
      bookMoves: 0,
    };
  }

  let lastOpening = null;
  let lastBookPly = 0;
  let bookMoves = 0;

  for (let i = 0; i < moves.length && i < 16; i++) {
    const move = moves[i];
    const opening = isInOpeningBook(move.fenAfter);

    if (opening) {
      lastOpening = opening;
      lastBookPly = move.ply;
      bookMoves++;
    } else {
      // Once we leave the book, stop
      break;
    }
  }

  return {
    opening: lastOpening,
    lastBookPly,
    bookMoves,
  };
}
