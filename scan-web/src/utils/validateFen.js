import { Chess } from 'chess.js';

export function validateFen(fen) {
  try {
    new Chess(fen); // throws if FEN is invalid/illegal
    return { valid: true };
  } catch (e) {
    return { valid: false, reason: (e && e.message) || 'Invalid FEN' };
  }
}
