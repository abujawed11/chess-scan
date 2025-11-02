import { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js/dist/esm/chess.js";
import { StockfishClient } from "./engine/stockfishClient";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

// Get piece image URL from Lichess
function getPieceImageUrl(piece) {
  const pieceMap = {
    'K': 'wK', 'Q': 'wQ', 'R': 'wR', 'B': 'wB', 'N': 'wN', 'P': 'wP',
    'k': 'bK', 'q': 'bQ', 'r': 'bR', 'b': 'bB', 'n': 'bN', 'p': 'bP'
  };
  const pieceName = pieceMap[piece];
  return `https://lichess1.org/assets/piece/cburnett/${pieceName}.svg`;
}

export default function GamePlay({ initialFen, onBack }) {
  const [game] = useState(() => new Chess(initialFen || undefined));
  const [boardFen, setBoardFen] = useState(game.fen());
  const [gameMode, setGameMode] = useState(null); // 'hvh', 'hvc', 'cvc'
  const [playerColor, setPlayerColor] = useState('white'); // For human vs computer
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [evaluation, setEvaluation] = useState(0);
  const [bestMove, setBestMove] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);

  // const stockfishWorker = useRef(null);

  // Engine wrapper
  const engineRef = useRef(null);
  const engineReadyRef = useRef(false);


  // Convert 'e4' to board unit coords (0..8). We used FILES and RANKS already.
  function squareToUnitXY(sq) {
    const file = sq[0];
    const rank = parseInt(sq[1], 10);
    const fx = FILES.indexOf(file);          // 0..7 (a..h)
    const ry = RANKS.indexOf(rank);          // 0..7 (8..1, because RANKS = [8..1])
    if (fx < 0 || ry < 0) return null;
    // Center of the square in “board units”
    return { x: fx + 0.5, y: ry + 0.5 };
  }


  function ArrowOverlay({ bestMove, show }) {
    if (!show || !bestMove) return null;

    const from = bestMove.slice(0, 2);
    const to = bestMove.slice(2, 4);

    const p1 = squareToUnitXY(from);
    const p2 = squareToUnitXY(to);
    if (!p1 || !p2) return null;

    return (
      <svg
        viewBox="0 0 8 8"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Arrowhead */}
        <defs>
          {/* <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 7 3.5, 0 7" fill="rgba(16,185,129,0.95)" />
          </marker> */}
          <marker
            id="arrowhead"
            markerWidth="5"
            markerHeight="5"
            refX="4"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 5 2.5, 0 5" fill="rgba(16,185,129,0.7)" />
          </marker>

        </defs>

        {/* Main arrow line */}
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke="rgba(16,185,129,0.6)" // more transparent
          strokeWidth="0.12"            // thinner
          strokeLinecap="round"
          markerEnd="url(#arrowhead)"
          style={{ filter: 'drop-shadow(0 0 0.15px rgba(0,0,0,0.5))' }}
        />

      </svg>
    );
  }

  // Initialize Stockfish
  // useEffect(() => {
  //   // Use Stockfish web worker
  //   stockfishWorker.current = new Worker('/stockfish.js');

  //   stockfishWorker.current.onmessage = (e) => {
  //     const message = e.data;

  //     if (message.includes('bestmove')) {
  //       const match = message.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
  //       if (match) {
  //         setBestMove(match[1]);
  //         setThinking(false);
  //       }
  //     }

  //     if (message.includes('score cp')) {
  //       const match = message.match(/score cp (-?\d+)/);
  //       if (match) {
  //         setEvaluation(parseInt(match[1]) / 100);
  //       }
  //     }

  //     if (message.includes('score mate')) {
  //       const match = message.match(/score mate (-?\d+)/);
  //       if (match) {
  //         const mateIn = parseInt(match[1]);
  //         setEvaluation(mateIn > 0 ? 100 : -100);
  //       }
  //     }
  //   };

  //   // Initialize Stockfish
  //   stockfishWorker.current.postMessage('uci');
  //   stockfishWorker.current.postMessage('isready');

  //   return () => {
  //     stockfishWorker.current?.terminate();
  //   };
  // }, []);

  // Initialize Stockfish (via wrapper)
  useEffect(() => {
    const engine = new StockfishClient('/stockfish.js');
    engineRef.current = engine;
    // Listen to all engine lines and parse what we need
    const off = engine.onMessage((msg) => {
      // mark ready (the wrapper already resolves waitReady on readyok)
      if (msg.includes('readyok')) engineReadyRef.current = true;
      if (msg.includes('bestmove')) {
        const m = msg.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
        if (m) { setBestMove(m[1]); setThinking(false); }
      }
      // evaluations
      const cp = msg.match(/score cp (-?\d+)/);
      const mate = msg.match(/score mate (-?\d+)/);
      if (cp) setEvaluation(parseInt(cp[1], 10) / 100);
      if (mate) setEvaluation(parseInt(mate[1], 10) > 0 ? 100 : -100);
    });
    // ensure we run uci boot (wrapper does it automatically on first “Stockfish” line)
    engine.waitReady().then(() => { engineReadyRef.current = true; });
    return () => {
      off();
      engineRef.current?.terminate();
      engineRef.current = null;
      engineReadyRef.current = false;
    };
  }, []);



  // Request analysis from Stockfish
  // const requestAnalysis = useCallback(() => {
  //   if (!stockfishWorker.current) return;

  //   setThinking(true);
  //   stockfishWorker.current.postMessage('stop');
  //   stockfishWorker.current.postMessage(`position fen ${game.fen()}`);
  //   stockfishWorker.current.postMessage('go depth 18');
  // }, [game]);


  const requestAnalysis = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (!engineReadyRef.current) {
      // wait for ready, then retry once
      engine.waitReady().then(() => {
        engineReadyRef.current = true;
        requestAnalysis();
      });
      return;
    }

    setThinking(true);
    engine.stop();
    engine.ucinewgame();
    engine.setOption('MultiPV', 1);        // adjust if you add multi-line later
    engine.positionFen(game.fen());
    engine.goDepth(18);                    // or engine.goMovetime(1000)
  }, [game]);

  // Make computer move
  const makeComputerMove = useCallback(() => {
    if (!bestMove || gameOver) return;

    const from = bestMove.substring(0, 2);
    const to = bestMove.substring(2, 4);
    const promotion = bestMove.length > 4 ? bestMove[4] : undefined;

    try {
      const move = game.move({ from, to, promotion });
      if (move) {
        setBoardFen(game.fen());
        setMoveHistory(prev => [...prev, move]);
        checkGameStatus();

        // Request new analysis
        setTimeout(() => requestAnalysis(), 100);
      }
    } catch (e) {
      console.error('Invalid computer move:', e);
    }
  }, [bestMove, game, gameOver, requestAnalysis]);

  // Computer vs Computer auto-play
  useEffect(() => {
    if (gameMode === 'cvc' && !thinking && bestMove && !gameOver) {
      const timer = setTimeout(() => {
        makeComputerMove();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameMode, thinking, bestMove, gameOver, makeComputerMove]);

  // Human vs Computer: make computer move when it's computer's turn
  useEffect(() => {
    if (gameMode === 'hvc' && !gameOver) {
      const currentTurn = game.turn() === 'w' ? 'white' : 'black';
      const isComputerTurn = currentTurn !== playerColor;

      if (isComputerTurn && !thinking && bestMove) {
        const timer = setTimeout(() => {
          makeComputerMove();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameMode, playerColor, game, gameOver, thinking, bestMove, makeComputerMove]);

  // Check game status
  const checkGameStatus = () => {
    if (game.isCheckmate()) {
      setGameOver(true);
      setResult(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
    } else if (game.isDraw()) {
      setGameOver(true);
      if (game.isStalemate()) setResult('Draw by stalemate');
      else if (game.isThreefoldRepetition()) setResult('Draw by repetition');
      else if (game.isInsufficientMaterial()) setResult('Draw by insufficient material');
      else setResult('Draw');
    }
  };

  // Handle square click
  const onSquareClick = (square) => {
    if (gameOver) return;

    // Check if it's human's turn in HvC mode
    if (gameMode === 'hvc') {
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
      const piece = game.get(selectedSquare);

      let promotion = undefined;
      if (piece?.type === 'p' && (toRank === 8 || toRank === 1)) {
        promotion = 'q'; // Auto-promote to queen for simplicity
      }

      try {
        const move = game.move({ from: selectedSquare, to: square, promotion });
        if (move) {
          setBoardFen(game.fen());
          setMoveHistory(prev => [...prev, move]);
          setSelectedSquare(null);
          setLegalMoves([]);
          checkGameStatus();

          // Request analysis after move
          setTimeout(() => requestAnalysis(), 100);
        }
      } catch (e) {
        console.error('Invalid move:', e);
      }
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
  };

  // Start game
  const startGame = (mode, color = 'white') => {
    setGameMode(mode);
    setPlayerColor(color);
    requestAnalysis();
  };

  // Reset game
  const resetGame = () => {
    game.reset();
    if (initialFen) game.load(initialFen);
    setBoardFen(game.fen());
    setSelectedSquare(null);
    setLegalMoves([]);
    setMoveHistory([]);
    setEvaluation(0);
    setBestMove(null);
    setGameOver(false);
    setResult(null);
    setGameMode(null);
  };

  // Undo move
  const undoMove = () => {
    if (moveHistory.length === 0) return;
    game.undo();
    setBoardFen(game.fen());
    setMoveHistory(prev => prev.slice(0, -1));
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOver(false);
    setResult(null);
    requestAnalysis();
  };

  // Get hint
  const getHint = () => {
    if (bestMove) {
      const from = bestMove.substring(0, 2);
      const to = bestMove.substring(2, 4);
      setSelectedSquare(from);
      const moves = game.moves({ square: from, verbose: true });
      setLegalMoves(moves.map(m => m.to));
    }
  };

  // Render board
  const board = [];
  const position = game.board();

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = `${FILES[file]}${RANKS[rank]}`;
      const piece = position[rank][file];
      const isLight = (rank + file) % 2 === 0;
      const isSelected = selectedSquare === square;
      const isLegalMove = legalMoves.includes(square);
      const isLastMove = moveHistory.length > 0 &&
        (moveHistory[moveHistory.length - 1].from === square ||
          moveHistory[moveHistory.length - 1].to === square);

      board.push({ square, piece, isLight, isSelected, isLegalMove, isLastMove });
    }
  }

  // Mode selection screen
  if (!gameMode) {
    return (
      <div style={{
        padding: 20,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 48,
          maxWidth: 600,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 16,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ♟️ Chess Game
          </h1>

          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 32 }}>
            Choose your game mode
          </p>

          <div style={{ display: 'grid', gap: 16 }}>
            <ModeButton
              icon="👥"
              title="Human vs Human"
              description="Play against a friend locally"
              onClick={() => startGame('hvh')}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ModeButton
                icon="🤖"
                title="vs Computer (White)"
                description="You play as White"
                onClick={() => startGame('hvc', 'white')}
                compact
              />
              <ModeButton
                icon="🤖"
                title="vs Computer (Black)"
                description="You play as Black"
                onClick={() => startGame('hvc', 'black')}
                compact
              />
            </div>

            <ModeButton
              icon="🤖⚔️🤖"
              title="Computer vs Computer"
              description="Watch AI play itself"
              onClick={() => startGame('cvc')}
            />
            <ModeButton
              icon="🔍"
              title="Analyze Position"
              description="Explore moves with Stockfish"
              onClick={() => startGame('analyze')}
            />
          </div>

          <button
            onClick={onBack}
            style={{
              marginTop: 24,
              width: '100%',
              padding: 12,
              border: '2px solid #e5e7eb',
              borderRadius: 10,
              background: 'white',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            ← Back to Editor
          </button>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div style={{
      padding: 20,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        background: 'white',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: '2px solid #f0f0f0'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {/* {gameMode === 'hvh' ? '👥 Human vs Human' :
                gameMode === 'hvc' ? `🤖 Playing as ${playerColor === 'white' ? 'White ♔' : 'Black ♚'}` :
                  '🤖⚔️🤖 Computer vs Computer'} */}

              {gameMode === 'hvh' ? '👥 Human vs Human'
                : gameMode === 'hvc' ? `🤖 Playing as ${playerColor === 'white' ? 'White ♔' : 'Black ♚'}`
                  : gameMode === 'cvc' ? '🤖⚔️🤖 Computer vs Computer'
                    : '🔍 Analysis Mode'}
            </h2>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              {game.turn() === 'w' ? "White's turn" : "Black's turn"}
              {game.isCheck() && <span style={{ color: '#ef4444', fontWeight: 600 }}> • CHECK!</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <GameButton onClick={undoMove} disabled={moveHistory.length === 0}>
              ↶ Undo
            </GameButton>
            <GameButton onClick={getHint} disabled={!bestMove || gameOver}>
              💡 Hint
            </GameButton>
            <GameButton onClick={resetGame}>
              ⟲ Reset
            </GameButton>
            <GameButton onClick={() => setGameMode(null)}>
              ← Back
            </GameButton>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
          {/* Board */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Evaluation Bar */}
            <EvaluationBar evaluation={evaluation} turn={game.turn()} />

            {/* Chess Board */}
            {/* <div style={{
              border: '4px solid #8b5cf6',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)',
              background: '#312e81',
              padding: 12,
              width: 560,
              height: 560,
              margin: '0 auto'
            }}> */}
            <div style={{
              border: '4px solid #8b5cf6',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)',
              background: '#312e81',
              padding: 12,
              width: 560,
              height: 560,
              margin: '0 auto',
              position: 'relative' // <-- important for overlay
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gridTemplateRows: 'repeat(8, 1fr)',
                width: '100%',
                height: '100%',
                gap: 0
              }}>
                {/* {board.map(({ square, piece, isLight, isSelected, isLegalMove, isLastMove }) => (
                  
                  <div
                    key={square}
                    onClick={() => onSquareClick(square)}
                    style={{
                      position: 'relative',
                      background: isSelected ? '#f59e0b' :
                        isLastMove ? '#93c5fd' :
                          isLight ? '#f0d9b5' : '#b58863',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                  > */}
                {board.map(({ square, piece, isLight, isSelected, isLegalMove, isLastMove }) => {
                  const bestMoveFrom = bestMove ? bestMove.slice(0, 2) : null;
                  const bestMoveTo = bestMove ? bestMove.slice(2, 4) : null;
                  const isBestMoveSquare =
                    gameMode === 'analyze' &&
                    bestMove &&
                    (square === bestMoveFrom || square === bestMoveTo);

                  return (
                    <div
                      key={square}
                      onClick={() => onSquareClick(square)}
                      style={{
                        position: 'relative',
                        background: isSelected
                          ? '#f59e0b'
                          : isBestMoveSquare
                            ? 'rgba(16,185,129,0.35)' // ✅ highlight best-move squares (green)
                            : isLastMove
                              ? '#93c5fd'
                              : isLight
                                ? '#f0d9b5'
                                : '#b58863',
                        
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      {/* Coordinates */}
                      {square[0] === 'a' && (
                        <div style={{
                          position: 'absolute',
                          left: 4,
                          top: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          color: isLight ? '#b58863' : '#f0d9b5',
                          opacity: 0.7,
                          userSelect: 'none'
                        }}>
                          {square[1]}
                        </div>
                      )}
                      {square[1] === '1' && (
                        <div style={{
                          position: 'absolute',
                          right: 4,
                          bottom: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          color: isLight ? '#b58863' : '#f0d9b5',
                          opacity: 0.7,
                          userSelect: 'none'
                        }}>
                          {square[0]}
                        </div>
                      )}

                      {/* Piece */}
                      {piece && (
                        <img
                          src={getPieceImageUrl(piece.color === 'w' ?
                            piece.type.toUpperCase() : piece.type.toLowerCase())}
                          alt={piece.type}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '8%',
                            userSelect: 'none',
                            pointerEvents: 'none'
                          }}
                        />
                      )}

                      {/* Legal move indicator */}
                      {isLegalMove && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'grid',
                          placeItems: 'center',
                          pointerEvents: 'none'
                        }}>
                          <div style={{
                            width: piece ? '100%' : '30%',
                            height: piece ? '100%' : '30%',
                            borderRadius: '50%',
                            background: piece ?
                              'radial-gradient(circle, transparent 65%, rgba(34, 197, 94, 0.5) 65%)' :
                              'rgba(34, 197, 94, 0.4)',
                            border: piece ? 'none' : '3px solid rgba(34, 197, 94, 0.6)'
                          }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Draw engine arrow only when analyzing (or change condition to always show) */}
              <ArrowOverlay
                bestMove={bestMove}
                show={gameMode === 'analyze'}   // or: show={!!bestMove && showBestMove}
              />
            </div>

            {/* Best Move Display */}
            {bestMove && !gameOver && (
              <div style={{
                padding: 12,
                background: '#f0fdf4',
                border: '2px solid #10b981',
                borderRadius: 10,
                textAlign: 'center',
                fontWeight: 600,
                color: '#065f46'
              }}>
                💡 Best move: {bestMove.substring(0, 2)} → {bestMove.substring(2, 4)}
                {thinking && <span style={{ marginLeft: 8 }}>🤔 Analyzing...</span>}
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Game Status */}
            {gameOver && (
              <div style={{
                padding: 16,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: 12,
                color: 'white',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: 16,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                🎉 Game Over!
                <div style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>
                  {result}
                </div>
              </div>
            )}

            {/* Move History */}
            <div style={{
              background: '#f9fafb',
              borderRadius: 12,
              padding: 16,
              maxHeight: 400,
              overflowY: 'auto'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>
                📜 Move History
              </h3>
              {moveHistory.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: 14 }}>No moves yet</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {moveHistory.reduce((acc, move, i) => {
                    if (i % 2 === 0) {
                      acc.push([move]);
                    } else {
                      acc[acc.length - 1].push(move);
                    }
                    return acc;
                  }, []).map((pair, i) => (
                    <div key={i} style={{
                      display: 'grid',
                      gridTemplateColumns: '30px 1fr 1fr',
                      gap: 8,
                      padding: '6px 8px',
                      background: 'white',
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: 'monospace'
                    }}>
                      <div style={{ color: '#6b7280', fontWeight: 600 }}>{i + 1}.</div>
                      <div style={{ fontWeight: 600 }}>{pair[0].san}</div>
                      <div style={{ fontWeight: 600 }}>{pair[1]?.san || ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Analysis Panel */}
            <div style={{
              background: '#f9fafb',
              borderRadius: 12,
              padding: 16
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#374151' }}>
                📊 Analysis
              </h3>
              <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Evaluation:</span>
                  <span style={{ fontWeight: 600, color: evaluation > 0 ? '#10b981' : evaluation < 0 ? '#ef4444' : '#6b7280' }}>
                    {evaluation > 0 ? '+' : ''}{evaluation.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Moves played:</span>
                  <span style={{ fontWeight: 600 }}>{moveHistory.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Status:</span>
                  <span style={{ fontWeight: 600 }}>
                    {gameOver ? 'Finished' : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ModeButton({ icon, title, description, onClick, compact }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: compact ? 16 : 20,
        border: '2px solid #e5e7eb',
        borderRadius: 12,
        background: 'white',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#8b5cf6';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e7eb';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: compact ? 24 : 32, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: compact ? 14 : 16, fontWeight: 600, color: '#111' }}>{title}</div>
      <div style={{ fontSize: compact ? 12 : 13, color: '#6b7280' }}>{description}</div>
    </button>
  );
}

function GameButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 16px',
        border: 'none',
        borderRadius: 10,
        background: disabled ? '#e5e7eb' : '#f3f4f6',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        fontSize: 14,
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = '#e5e7eb';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = '#f3f4f6';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </button>
  );
}

function EvaluationBar({ evaluation, turn }) {
  // Clamp evaluation between -10 and +10 for display
  const clampedEval = Math.max(-10, Math.min(10, evaluation));
  const whitePercent = 50 + (clampedEval / 20) * 50;

  return (
    <div style={{
      height: 32,
      background: '#1f2937',
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
      border: '2px solid #374151'
    }}>
      <div style={{
        height: '100%',
        width: `${whitePercent}%`,
        background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)',
        transition: 'width 0.5s ease'
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontSize: 12,
        fontWeight: 600
      }}>
        <span style={{ color: whitePercent > 50 ? '#111' : '#fff' }}>
          ♔ {evaluation > 0 ? `+${evaluation.toFixed(1)}` : ''}
        </span>
        <span style={{ color: whitePercent < 50 ? '#fff' : '#111' }}>
          ♚ {evaluation < 0 ? evaluation.toFixed(1) : ''}
        </span>
      </div>
    </div>
  );
}
