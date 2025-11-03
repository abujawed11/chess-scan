// src/utils/pgn/pgnParser.js
import { Chess } from 'chess.js';

/**
 * Parse a PGN string and extract game information
 * @param {string} pgnString - The PGN string to parse
 * @returns {Object} Parsed game data or null if invalid
 */
export function parsePGN(pgnString) {
  if (!pgnString || typeof pgnString !== 'string') {
    return null;
  }

  try {
    const chess = new Chess();

    // Clean up PGN - remove excessive whitespace and normalize newlines
    let cleanedPgn = pgnString
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')     // Handle old Mac line endings
      .trim();

    // Extract only the first game if multiple games are present
    // Look for a line starting with "[Event" after the first one (indicates second game)
    const lines = cleanedPgn.split('\n');
    let firstGameEnd = lines.length;
    let foundFirstEvent = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('[Event')) {
        if (foundFirstEvent) {
          // This is the second game - cut here
          firstGameEnd = i;
          console.log('Multiple games detected, extracting only first game');
          break;
        }
        foundFirstEvent = true;
      }
    }

    // Take only the first game
    const firstGameLines = lines.slice(0, firstGameEnd);

    // Filter out unsupported headers that chess.js doesn't recognize
    // Keep only standard PGN headers
    const supportedHeaders = [
      'Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result',
      'WhiteElo', 'BlackElo', 'TimeControl', 'ECO', 'PlyCount', 'FEN'
    ];

    const filteredLines = [];
    let lastHeaderIndex = -1;

    for (let i = 0; i < firstGameLines.length; i++) {
      const line = firstGameLines[i].trim();
      if (line.startsWith('[') && line.endsWith(']')) {
        // Check if this is a supported header
        const headerMatch = line.match(/\[(\w+)\s/);
        if (headerMatch) {
          const headerName = headerMatch[1];
          // Only include supported headers
          if (supportedHeaders.includes(headerName)) {
            filteredLines.push(firstGameLines[i]);
            lastHeaderIndex = filteredLines.length - 1;
          } else {
            console.log('Skipping unsupported header:', headerName);
          }
        }
      } else {
        // Not a header, keep it
        filteredLines.push(firstGameLines[i]);
      }
    }

    // Rebuild with proper spacing
    const processedLines = [];
    for (let i = 0; i < filteredLines.length; i++) {
      processedLines.push(filteredLines[i]);
      // Add blank line after last header if not present
      if (i === lastHeaderIndex && i + 1 < filteredLines.length) {
        const nextLine = filteredLines[i + 1].trim();
        if (nextLine && !nextLine.startsWith('[')) {
          // Next line is moves, ensure blank line
          if (filteredLines[i + 1].trim()) {
            processedLines.push('');
          }
        }
      }
    }

    cleanedPgn = processedLines.join('\n').trim();

    // Ensure the game has a result marker at the end
    // Check if it ends with a result (1-0, 0-1, 1/2-1/2, or *)
    const resultPattern = /\s+(1-0|0-1|1\/2-1\/2|\*)\s*$/;
    if (!resultPattern.test(cleanedPgn)) {
      // No result found, add it from the header or use *
      const resultMatch = cleanedPgn.match(/\[Result\s+"([^"]+)"\]/);
      const result = resultMatch ? resultMatch[1] : '*';
      cleanedPgn = cleanedPgn + ' ' + result;
      console.log('Added missing result marker:', result);
    }

    console.log('Attempting to parse PGN:', cleanedPgn.substring(0, 200) + '...');

    // Try manual parsing approach - extract moves and play them one by one
    // This is more reliable than loadPgn()

    // Extract headers manually
    const headerLines = cleanedPgn.split('\n').filter(line =>
      line.trim().startsWith('[') && line.trim().endsWith(']')
    );

    const headers = {};
    headerLines.forEach(line => {
      const match = line.match(/\[(\w+)\s+"([^"]+)"\]/);
      if (match) {
        headers[match[1]] = match[2];
      }
    });

    // Extract moves section (everything after headers)
    const moveSection = cleanedPgn
      .split('\n')
      .filter(line => !line.trim().startsWith('['))
      .join(' ')
      .trim();

    // Parse moves - remove move numbers and result markers
    const movesText = moveSection
      .replace(/\d+\./g, '') // Remove move numbers
      .replace(/1-0|0-1|1\/2-1\/2|\*/g, '') // Remove result
      .replace(/\{[^}]*\}/g, '') // Remove comments
      .replace(/\([^)]*\)/g, '') // Remove variations
      .trim();

    // Split into individual moves
    const movesList = movesText.split(/\s+/).filter(m => m.length > 0);

    console.log('Extracted', movesList.length, 'moves');

    // Play through moves one by one
    const playedMoves = [];
    for (let i = 0; i < movesList.length; i++) {
      try {
        const move = chess.move(movesList[i], { sloppy: true });
        if (move) {
          playedMoves.push(move);
        } else {
          console.warn('Invalid move at index', i, ':', movesList[i]);
          // Continue anyway, some PGNs have annotations that look like moves
        }
      } catch (error) {
        console.warn('Error playing move', i, ':', movesList[i], error.message);
        // Continue to next move
      }
    }

    if (playedMoves.length === 0) {
      console.error('No valid moves found in PGN');
      return null;
    }

    console.log('Successfully played', playedMoves.length, 'moves');

    // Use the manually extracted headers from above
    // (don't call chess.header() since we didn't use loadPgn)

    // Get the game history with verbose details
    const history = chess.history({ verbose: true });

    // Parse moves with additional metadata
    const moves = [];
    const tempChess = new Chess();

    for (let i = 0; i < history.length; i++) {
      const move = history[i];
      const fen = tempChess.fen();

      // Make the move to get to next position
      tempChess.move(move);

      moves.push({
        moveNumber: Math.floor(i / 2) + 1,
        ply: i + 1,
        color: move.color,
        san: move.san,
        from: move.from,
        to: move.to,
        piece: move.piece,
        captured: move.captured,
        promotion: move.promotion,
        flags: move.flags,
        fenBefore: fen,
        fenAfter: tempChess.fen(),
        comment: null, // Will be extracted from PGN comments
        nag: null, // Numeric Annotation Glyph
        quality: null, // Will be set during analysis
        evaluation: null, // Will be set during analysis
      });
    }

    // Extract comments from original PGN (chess.js doesn't preserve comments in history)
    const movesWithComments = extractCommentsFromPGN(pgnString, moves);

    return {
      // Game metadata
      tags: {
        event: headers.Event || 'Unknown Event',
        site: headers.Site || 'Unknown Site',
        date: headers.Date || '????.??.??',
        round: headers.Round || '?',
        white: headers.White || 'White',
        black: headers.Black || 'Black',
        result: headers.Result || '*',
        eco: headers.ECO || null,
        whiteElo: headers.WhiteElo || null,
        blackElo: headers.BlackElo || null,
        timeControl: headers.TimeControl || null,
        opening: headers.Opening || null,
      },

      // Game moves
      moves: movesWithComments,

      // Initial position
      initialFen: headers.FEN || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',

      // Final position
      finalFen: chess.fen(),

      // Game result
      result: headers.Result || '*',

      // Total plies
      totalPlies: moves.length,

      // Original PGN
      pgn: pgnString,
    };
  } catch (error) {
    console.error('Failed to parse PGN:', error);
    console.error('Error message:', error.message);
    console.error('PGN that failed (first 500 chars):', pgnString.substring(0, 500));
    return null;
  }
}

/**
 * Extract comments from PGN string and add them to moves
 * @param {string} pgnString - The original PGN string
 * @param {Array} moves - Array of move objects
 * @returns {Array} Moves with comments added
 */
function extractCommentsFromPGN(pgnString, moves) {
  // Simple comment extraction (this is a basic implementation)
  // Comments in PGN are enclosed in curly braces {}

  const commentRegex = /\{([^}]+)\}/g;
  const comments = [];
  let match;

  while ((match = commentRegex.exec(pgnString)) !== null) {
    comments.push(match[1].trim());
  }

  // Try to associate comments with moves (simple heuristic)
  // This is simplified - a full parser would track move-comment associations
  const movesWithComments = moves.map((move, index) => {
    return {
      ...move,
      comment: comments[index] || null,
    };
  });

  return movesWithComments;
}

/**
 * Validate if a string is valid PGN format
 * @param {string} pgnString - The PGN string to validate
 * @returns {boolean} True if valid PGN
 */
export function isValidPGN(pgnString) {
  if (!pgnString || typeof pgnString !== 'string') {
    return false;
  }

  try {
    const chess = new Chess();
    return chess.loadPgn(pgnString);
  } catch {
    return false;
  }
}

/**
 * Generate PGN from game data
 * @param {Object} gameData - Game data object
 * @returns {string} PGN string
 */
export function generatePGN(gameData) {
  const chess = new Chess();

  // Set headers
  if (gameData.tags) {
    Object.entries(gameData.tags).forEach(([key, value]) => {
      if (value) {
        chess.header(key.charAt(0).toUpperCase() + key.slice(1), value);
      }
    });
  }

  // Play through moves
  if (gameData.moves) {
    gameData.moves.forEach(move => {
      try {
        chess.move(move.san);
      } catch (error) {
        console.error('Error generating PGN move:', move.san, error);
      }
    });
  }

  return chess.pgn();
}

/**
 * Parse multiple PGN games from a single string
 * @param {string} pgnString - String containing multiple PGNs
 * @returns {Array} Array of parsed game objects
 */
export function parseMultiplePGNs(pgnString) {
  if (!pgnString || typeof pgnString !== 'string') {
    return [];
  }

  // Split by game separator (usually blank lines between games)
  // This is a simple split - might need refinement
  const games = pgnString.split(/\n\n\[Event/);

  const parsedGames = [];

  games.forEach((gameText, index) => {
    // Re-add [Event tag except for first game
    const pgnText = index === 0 ? gameText : '[Event' + gameText;

    const parsed = parsePGN(pgnText);
    if (parsed) {
      parsedGames.push(parsed);
    }
  });

  return parsedGames;
}
