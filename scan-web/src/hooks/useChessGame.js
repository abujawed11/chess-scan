import { useState, useCallback } from 'react';
import { Chess } from 'chess.js/dist/esm/chess.js';

export function useChessGame(initialFen) {
  const [game] = useState(() => new Chess(initialFen || undefined));
  const [boardFen, setBoardFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);

  // Check game status
  const checkGameStatus = useCallback(() => {
    if (game.isCheckmate()) {
      setGameOver(true);
      setResult(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
      return true;
    } else if (game.isDraw()) {
      setGameOver(true);
      if (game.isStalemate()) setResult('Draw by stalemate');
      else if (game.isThreefoldRepetition()) setResult('Draw by repetition');
      else if (game.isInsufficientMaterial()) setResult('Draw by insufficient material');
      else setResult('Draw');
      return true;
    }
    return false;
  }, [game]);

  // Make a move
  const makeMove = useCallback((from, to, promotion) => {
    try {
      const move = game.move({ from, to, promotion });
      if (move) {
        setBoardFen(game.fen());
        setMoveHistory(prev => [...prev, move]);
        setSelectedSquare(null);
        setLegalMoves([]);
        checkGameStatus();
        return move;
      }
    } catch (e) {
      console.error('Invalid move:', e);
    }
    return null;
  }, [game, checkGameStatus]);

  // Handle square click
  const onSquareClick = useCallback((square, playerColor = null, gameMode = 'hvh') => {
    if (gameOver) return;

    // Check if it's human's turn in HvC mode
    if (gameMode === 'hvc' && playerColor) {
      const currentTurn = game.turn() === 'w' ? 'white' : 'black';
      if (currentTurn !== playerColor) return;
    }

    const piece = game.get(square);

    // If no piece selected, select this square if it has a piece of current player
    if (!selectedSquare) {
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map(m => m.to));
      }
      return;
    }

    // If clicking the same square, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Try to make the move
    const isLegalMove = legalMoves.includes(square);

    if (isLegalMove) {
      // Handle promotion
      const fromRank = parseInt(selectedSquare[1]);
      const toRank = parseInt(square[1]);
      const movingPiece = game.get(selectedSquare);

      let promotion = undefined;
      if (movingPiece?.type === 'p' && (toRank === 8 || toRank === 1)) {
        promotion = 'q'; // Auto-promote to queen for simplicity
      }

      return makeMove(selectedSquare, square, promotion);
    } else {
      // Select new piece
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map(m => m.to));
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    }
  }, [game, gameOver, selectedSquare, legalMoves, makeMove]);

  // Undo move
  const undoMove = useCallback(() => {
    if (moveHistory.length === 0) return;
    game.undo();
    setBoardFen(game.fen());
    setMoveHistory(prev => prev.slice(0, -1));
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOver(false);
    setResult(null);
  }, [game, moveHistory.length]);

  // Reset game
  const resetGame = useCallback(() => {
    game.reset();
    if (initialFen) game.load(initialFen);
    setBoardFen(game.fen());
    setSelectedSquare(null);
    setLegalMoves([]);
    setMoveHistory([]);
    setGameOver(false);
    setResult(null);
  }, [game, initialFen]);

  return {
    game,
    boardFen,
    selectedSquare,
    legalMoves,
    moveHistory,
    gameOver,
    result,
    onSquareClick,
    makeMove,
    undoMove,
    resetGame,
    checkGameStatus,
  };
}
