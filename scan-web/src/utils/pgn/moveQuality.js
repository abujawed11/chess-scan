// src/utils/pgn/moveQuality.js

/**
 * Move quality thresholds in centipawns
 * These can be tuned based on user preferences
 */
export const QUALITY_THRESHOLDS = {
  BEST: 15,
  EXCELLENT: 50,
  GOOD: 120,
  INACCURACY: 300,
  MISTAKE: 700,
  // Anything above MISTAKE is a BLUNDER
};

/**
 * Move quality types
 */
export const MOVE_QUALITY = {
  BOOK: 'book',
  BEST: 'best',
  EXCELLENT: 'excellent',
  GOOD: 'good',
  INACCURACY: 'inaccuracy',
  MISTAKE: 'mistake',
  BLUNDER: 'blunder',
  UNSCORED: 'unscored',
};

/**
 * Penalties for accuracy score calculation
 */
export const QUALITY_PENALTIES = {
  [MOVE_QUALITY.BOOK]: 0,
  [MOVE_QUALITY.BEST]: 0,
  [MOVE_QUALITY.EXCELLENT]: 10,
  [MOVE_QUALITY.GOOD]: 30,
  [MOVE_QUALITY.INACCURACY]: 60,
  [MOVE_QUALITY.MISTAKE]: 120,
  [MOVE_QUALITY.BLUNDER]: 200,
  [MOVE_QUALITY.UNSCORED]: 0,
};

/**
 * Quality display configurations
 */
export const QUALITY_CONFIG = {
  [MOVE_QUALITY.BOOK]: {
    label: 'Book',
    symbol: '📖',
    color: '#8b5cf6',
    bgColor: '#f3e8ff',
  },
  [MOVE_QUALITY.BEST]: {
    label: 'Best',
    symbol: '!!',
    color: '#10b981',
    bgColor: '#d1fae5',
  },
  [MOVE_QUALITY.EXCELLENT]: {
    label: 'Excellent',
    symbol: '!',
    color: '#059669',
    bgColor: '#d1fae5',
  },
  [MOVE_QUALITY.GOOD]: {
    label: 'Good',
    symbol: '',
    color: '#3b82f6',
    bgColor: '#dbeafe',
  },
  [MOVE_QUALITY.INACCURACY]: {
    label: 'Inaccuracy',
    symbol: '?!',
    color: '#f59e0b',
    bgColor: '#fef3c7',
  },
  [MOVE_QUALITY.MISTAKE]: {
    label: 'Mistake',
    symbol: '?',
    color: '#ef4444',
    bgColor: '#fee2e2',
  },
  [MOVE_QUALITY.BLUNDER]: {
    label: 'Blunder',
    symbol: '??',
    color: '#b91c1c',
    bgColor: '#fecaca',
  },
  [MOVE_QUALITY.UNSCORED]: {
    label: 'Not Analyzed',
    symbol: '—',
    color: '#6b7280',
    bgColor: '#f3f4f6',
  },
};

/**
 * Classify move quality based on evaluation delta
 * @param {number} evalDelta - Difference in centipawns (positive means loss)
 * @param {boolean} isBook - Whether move is from opening book
 * @returns {string} Quality classification
 */
export function classifyMoveQuality(evalDelta, isBook = false) {
  if (isBook) {
    return MOVE_QUALITY.BOOK;
  }

  if (evalDelta === null || evalDelta === undefined) {
    return MOVE_QUALITY.UNSCORED;
  }

  const absDelta = Math.abs(evalDelta);

  if (absDelta <= QUALITY_THRESHOLDS.BEST) {
    return MOVE_QUALITY.BEST;
  } else if (absDelta <= QUALITY_THRESHOLDS.EXCELLENT) {
    return MOVE_QUALITY.EXCELLENT;
  } else if (absDelta <= QUALITY_THRESHOLDS.GOOD) {
    return MOVE_QUALITY.GOOD;
  } else if (absDelta <= QUALITY_THRESHOLDS.INACCURACY) {
    return MOVE_QUALITY.INACCURACY;
  } else if (absDelta <= QUALITY_THRESHOLDS.MISTAKE) {
    return MOVE_QUALITY.MISTAKE;
  } else {
    return MOVE_QUALITY.BLUNDER;
  }
}

/**
 * Calculate accuracy score for a player
 * @param {Array} moves - Array of moves with quality classifications
 * @param {string} color - 'w' or 'b' for white or black
 * @returns {number} Accuracy score from 0-100
 */
export function calculateAccuracy(moves, color) {
  if (!moves || moves.length === 0) {
    return 0;
  }

  // Filter moves by color
  const playerMoves = moves.filter(move => move.color === color);

  if (playerMoves.length === 0) {
    return 0;
  }

  // Calculate total penalty
  let totalPenalty = 0;
  let scoredMoves = 0;

  playerMoves.forEach(move => {
    if (move.quality && move.quality !== MOVE_QUALITY.UNSCORED) {
      totalPenalty += QUALITY_PENALTIES[move.quality] || 0;
      scoredMoves++;
    }
  });

  if (scoredMoves === 0) {
    return 0;
  }

  // Calculate average penalty per move
  const avgPenalty = totalPenalty / scoredMoves;

  // Convert to accuracy score (0-100)
  // Max penalty is 200 (blunder), so we normalize
  const accuracy = Math.max(0, Math.min(100, 100 - (avgPenalty / 2)));

  return Math.round(accuracy * 10) / 10; // Round to 1 decimal place
}

/**
 * Count moves by quality for a player
 * @param {Array} moves - Array of moves with quality classifications
 * @param {string} color - 'w' or 'b' for white or black
 * @returns {Object} Count of each quality type
 */
export function countMoveQualities(moves, color) {
  const counts = {
    [MOVE_QUALITY.BOOK]: 0,
    [MOVE_QUALITY.BEST]: 0,
    [MOVE_QUALITY.EXCELLENT]: 0,
    [MOVE_QUALITY.GOOD]: 0,
    [MOVE_QUALITY.INACCURACY]: 0,
    [MOVE_QUALITY.MISTAKE]: 0,
    [MOVE_QUALITY.BLUNDER]: 0,
    [MOVE_QUALITY.UNSCORED]: 0,
  };

  if (!moves) return counts;

  moves
    .filter(move => move.color === color)
    .forEach(move => {
      if (move.quality) {
        counts[move.quality]++;
      }
    });

  return counts;
}

/**
 * Get evaluation delta for a move
 * Positive delta means the position got worse for the side that moved
 * @param {number} evalBefore - Evaluation before the move (from moving side's perspective)
 * @param {number} evalAfter - Evaluation after the move (from moving side's perspective)
 * @returns {number} Evaluation delta in centipawns
 */
export function getEvaluationDelta(evalBefore, evalAfter) {
  if (evalBefore === null || evalBefore === undefined ||
      evalAfter === null || evalAfter === undefined) {
    return null;
  }

  // Delta is how much the evaluation worsened
  // (evalBefore - evalAfter) because eval is from moving side's perspective
  return evalBefore - evalAfter;
}

/**
 * Convert mate score to centipawn equivalent for comparison
 * @param {number} mateIn - Mate in N moves (positive = winning, negative = losing)
 * @returns {number} Centipawn equivalent
 */
export function mateToCP(mateIn) {
  if (mateIn === 0) return 0;

  // Convert mate score to large centipawn value
  // Winning mate = very high positive value
  // Losing mate = very high negative value
  const sign = mateIn > 0 ? 1 : -1;
  const absMate = Math.abs(mateIn);

  // Closer mates are better, so we subtract the mate distance from max
  // Max CP for mate = 10000, reduce by 100 per move
  return sign * (10000 - (absMate * 100));
}

/**
 * Normalize evaluation from Stockfish output
 * @param {Object} evalData - Evaluation data from Stockfish
 * @param {string} perspective - 'w' or 'b' for perspective
 * @returns {number} Normalized evaluation in centipawns
 */
export function normalizeEvaluation(evalData, perspective = 'w') {
  if (!evalData) return 0;

  let cp = 0;

  if (evalData.type === 'cp') {
    cp = evalData.value;
  } else if (evalData.type === 'mate') {
    cp = mateToCP(evalData.value);
  }

  // If perspective is black, flip the evaluation
  return perspective === 'w' ? cp : -cp;
}

/**
 * Get quality statistics summary
 * @param {Array} moves - Array of moves
 * @returns {Object} Summary statistics
 */
export function getQualityStats(moves) {
  if (!moves || moves.length === 0) {
    return {
      white: { accuracy: 0, counts: {} },
      black: { accuracy: 0, counts: {} },
      total: 0,
    };
  }

  return {
    white: {
      accuracy: calculateAccuracy(moves, 'w'),
      counts: countMoveQualities(moves, 'w'),
    },
    black: {
      accuracy: calculateAccuracy(moves, 'b'),
      counts: countMoveQualities(moves, 'b'),
    },
    total: moves.length,
  };
}
