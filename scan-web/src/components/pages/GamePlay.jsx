// import { useState, useEffect, useCallback, useRef } from "react";
// import { useChessGame } from "../../hooks/useChessGame";
// import { useStockfish } from "../../hooks/useStockfish";
// import { useChessTimer } from "../../hooks/useChessTimer";
// import ChessBoard from "../chess/ChessBoard";
// import EvaluationBar from "../chess/EvaluationBar";
// import MoveHistory from "../chess/MoveHistory";
// import AnalysisPanel from "../chess/AnalysisPanel";
// import GameActions from "../chess/GameActions";
// import ChessTimer from "../ChessTimer";
// import TimeControlSelector from "../TimeControlSelector";
// import Button from "../ui/Button";
// import ModeCard from "../ui/ModeCard";
// import { GAME_MODES, STOCKFISH_CONFIG, DEFAULT_TIME_CONTROL } from "../../utils/constants";
// import { classifyMoveQuality, getEvaluationDelta, normalizeEvaluation } from "../../utils/pgn/moveQuality";

// export default function GamePlay({ initialFen, onBack, boardCoordinatesFlipped = false }) {
//   const [gameMode, setGameMode] = useState(null);
//   const [playerColor, setPlayerColor] = useState('white');
//   const [analysisEnabled, setAnalysisEnabled] = useState(false);
//   const [selectedTimeControl, setSelectedTimeControl] = useState(null);
//   const [showTimeSelector, setShowTimeSelector] = useState(false);
//   const [boardFlipped, setBoardFlipped] = useState(boardCoordinatesFlipped);
//   const lastEvalRef = useRef({ fen: null, value: null });


//   // Move quality tracking for Analysis mode
//   const [moveQualities, setMoveQualities] = useState([]); // Array of move quality data
//   const [pendingMoveQuality, setPendingMoveQuality] = useState(null); // Move waiting for evaluation
//   const [moveAnalysisEnabled, setMoveAnalysisEnabled] = useState(false); // Toggle for move analysis

//   const lastAnalyzedFenRef = useRef(null);

//   // Use custom hooks
//   const {
//     game,
//     boardFen,
//     selectedSquare,
//     legalMoves,
//     moveHistory,
//     gameOver,
//     result,
//     onSquareClick,
//     makeMove,
//     undoMove,
//     resetGame,
//     checkGameStatus,
//   } = useChessGame(initialFen);

//   const {
//     evaluation,
//     bestMove,
//     thinking,
//     engineError,
//     requestAnalysis,
//     stopAnalysis,
//     clearError,
//   } = useStockfish();

//   // Chess timer hook - always call, but pass null if no time control selected yet
//   const timer = useChessTimer(selectedTimeControl || null);

//   // Track if we've initialized the timer for this game
//   const timerInitializedRef = useRef(false);

//   // Track last attempted move for each position to prevent duplicates
//   const lastAttemptedMoveRef = useRef({ fen: null, move: null });

//   // Track if we've scheduled a move for the current position to prevent re-scheduling
//   const moveScheduledRef = useRef({ fen: null, move: null });


//   useEffect(() => {
//     if (evaluation == null || !lastAnalyzedFenRef.current) return;
//     lastEvalRef.current = { fen: lastAnalyzedFenRef.current, value: evaluation };
//   }, [evaluation]);

//   // Calculate move quality when new evaluation arrives
//   // useEffect(() => {
//   //   // if (gameMode === GAME_MODES.ANALYZE && evaluation !== null && pendingMoveQuality && analysisEnabled && moveAnalysisEnabled) {
//   //   if (gameMode === GAME_MODES.ANALYZE && analysisEnabled && moveAnalysisEnabled) {
//   //     const { move, evalBefore, moveNumber } = pendingMoveQuality;

//   //     // Normalize evaluations from the perspective of the player who just moved
//   //     const evalAfter = normalizeEvaluation(evaluation, move.color);

//   //     // Calculate evaluation delta (how much the position worsened)
//   //     const evalDelta = getEvaluationDelta(evalBefore, evalAfter);

//   //     // Classify move quality
//   //     const quality = classifyMoveQuality(evalDelta);

//   //     // Add move quality to our tracking array
//   //     const moveQuality = {
//   //       moveNumber: moveNumber,
//   //       color: move.color,
//   //       san: move.san,
//   //       quality: quality,
//   //       evalBefore: evalBefore,
//   //       evalAfter: evalAfter,
//   //       evalDelta: evalDelta
//   //     };

//   //     setMoveQualities(prev => [...prev, moveQuality]);

//   //     console.log(`📊 Move Quality: ${move.san} (${move.color === 'w' ? 'White' : 'Black'}) = ${quality} (Δ${evalDelta?.toFixed(1) || 'N/A'}cp, before: ${evalBefore?.toFixed(1)}, after: ${evalAfter?.toFixed(1)})`);

//   //     // Clear pending move
//   //     setPendingMoveQuality(null);
//   //   }
//   // }, [evaluation, gameMode, analysisEnabled, moveAnalysisEnabled, pendingMoveQuality]);


//   useEffect(() => {
//     //- if (gameMode === GAME_MODES.ANALYZE && evaluation !== null && pendingMoveQuality && analysisEnabled && moveAnalysisEnabled) {
//     if (gameMode === GAME_MODES.ANALYZE && pendingMoveQuality && analysisEnabled && moveAnalysisEnabled && lastEvalRef.current.value != null) {
//       const { move, evalBefore, moveNumber } = pendingMoveQuality;

//       // Only proceed when the latest evaluation corresponds to the AFTER position
//       // (different from the pre-move fen). If you want, also store beforeFen in pending.
//       // For now we assume requestAnalysis ran AFTER the move, so lastEvalRef is "after".
//       const evalAfter = normalizeEvaluation(lastEvalRef.current.value, move.color);
//       const evalDelta = (evalBefore != null) ? getEvaluationDelta(evalBefore, evalAfter) : null;
//       const quality = (evalDelta != null) ? classifyMoveQuality(evalDelta) : '—';
//       // Add move quality to our tracking array
//       const moveQuality = {
//         moveNumber: moveNumber,
//         color: move.color,
//         san: move.san,
//         quality: quality,
//         evalBefore: evalBefore,
//         evalAfter: evalAfter,
//         evalDelta: evalDelta
//       };

//       setMoveQualities(prev => [...prev, moveQuality]);
//       setPendingMoveQuality(null);
//     }
//   }, [evaluation, gameMode, analysisEnabled, moveAnalysisEnabled, pendingMoveQuality]);

//   // Auto-trigger analysis when position changes (only in analyze mode)
//   useEffect(() => {
//     const currentFen = boardFen;

//     // For computer modes, auto-enable analysis at game start
//     // This allows the computer to immediately start thinking without user intervention
//     // Human vs Computer: Computer thinks on its turn
//     // Computer vs Computer: Both sides think automatically
//     if ((gameMode === GAME_MODES.HUMAN_VS_COMPUTER || gameMode === GAME_MODES.COMPUTER_VS_COMPUTER) && !analysisEnabled) {
//       console.log('🟢 Auto-enabling analysis for computer mode');
//       setAnalysisEnabled(true);
//       return; // Will trigger analysis on next effect run
//     }

//     // For Human vs Computer: Stop analysis when it's the human player's turn
//     // Only analyze during computer's turn
//     if (gameMode === GAME_MODES.HUMAN_VS_COMPUTER && analysisEnabled) {
//       const currentTurn = game.turn() === 'w' ? 'white' : 'black';
//       const isComputerTurn = currentTurn !== playerColor;

//       if (!isComputerTurn) {
//         // It's the human's turn - stop analysis to avoid suggesting moves
//         stopAnalysis();
//         return;
//       }
//     }

//     // Only analyze if:
//     // 1. Analysis is enabled
//     // 2. Not currently thinking
//     // 3. Game is not over
//     // 4. Position has actually changed (prevent duplicate analysis)
//     if (analysisEnabled && !thinking && !gameOver && currentFen !== lastAnalyzedFenRef.current) {
//       console.log('🔄 Position changed, triggering analysis for:', currentFen);
//       lastAnalyzedFenRef.current = currentFen;
//       requestAnalysis(boardFen);
//     } else if (analysisEnabled) {
//       console.log('⏸️ Analysis not triggered:', {
//         thinking,
//         gameOver,
//         fensMatch: currentFen === lastAnalyzedFenRef.current,
//         currentFen: currentFen.substring(0, 50) + '...'
//       });
//     }
//   }, [analysisEnabled, boardFen, gameOver, thinking, requestAnalysis, game, gameMode, playerColor, stopAnalysis]);

//   // Make computer move
//   const makeComputerMove = useCallback(() => {
//     if (!bestMove || gameOver) return;

//     const currentFen = game.fen();

//     // Don't try to make the same move twice for the same position
//     if (lastAttemptedMoveRef.current.fen === currentFen &&
//       lastAttemptedMoveRef.current.move === bestMove) {
//       console.log('⚠️ Already attempted move:', bestMove, 'for position:', currentFen);
//       return;
//     }

//     const from = bestMove.substring(0, 2);
//     const to = bestMove.substring(2, 4);
//     const promotion = bestMove.length > 4 ? bestMove[4] : undefined;

//     // Mark this move as attempted for this position
//     lastAttemptedMoveRef.current = { fen: currentFen, move: bestMove };

//     // Stop current analysis before making the move
//     stopAnalysis();

//     const move = makeMove(from, to, promotion);

//     // Only continue if move was successfully made
//     if (move) {
//       console.log(`✅ Computer move made: ${from}${to}, new position:`, game.fen());
//       if (timer) {
//         // Start timer on first move
//         if (moveHistory.length === 1 && !timer.gameActive) {
//           console.log('⏱️ Starting timer on first move (computer)');
//           timer.startTimer();
//         }
//         // Always switch turn after a move (including first move)
//         setTimeout(() => timer.switchTurn(), 50);
//       }
//       // Don't manually request analysis here - let the auto-trigger effect handle it
//       // This prevents double analysis requests and race conditions
//     } else {
//       console.warn(`❌ Failed to make move: ${from}${to} for position: ${currentFen}`);
//       // If move failed, reset the attempted move tracker so we can try again
//       lastAttemptedMoveRef.current = { fen: null, move: null };
//     }
//   }, [bestMove, gameOver, makeMove, game, stopAnalysis, timer, moveHistory]);

//   // Computer vs Computer auto-play
//   useEffect(() => {
//     if (gameMode === GAME_MODES.COMPUTER_VS_COMPUTER && !thinking && bestMove && !gameOver) {
//       const currentFen = game.fen();

//       // Check if we've already scheduled this move for this position
//       if (moveScheduledRef.current.fen === currentFen && moveScheduledRef.current.move === bestMove) {
//         console.log(`🤖 CvC: Move ${bestMove} already scheduled for this position, skipping`);
//         return; // Don't schedule again or return a cleanup function
//       }

//       console.log(`🤖 CvC: Scheduling move ${bestMove} in 1.5s...`);
//       moveScheduledRef.current = { fen: currentFen, move: bestMove };

//       const timer = setTimeout(() => {
//         console.log(`🤖 CvC: Executing scheduled move ${bestMove}`);
//         moveScheduledRef.current = { fen: null, move: null }; // Clear after execution
//         makeComputerMove();
//       }, 1500); // 1.5 second delay between moves for better viewing

//       return () => {
//         console.log('🤖 CvC: Cleanup - clearing scheduled move timer');
//         clearTimeout(timer);
//         moveScheduledRef.current = { fen: null, move: null };
//       };
//     } else if (gameMode === GAME_MODES.COMPUTER_VS_COMPUTER) {
//       console.log('🤖 CvC: Not scheduling move:', { thinking, bestMove, gameOver });
//     }
//   }, [gameMode, thinking, bestMove, gameOver, makeComputerMove, game]);

//   // Human vs Computer: make computer move when it's computer's turn
//   useEffect(() => {
//     if (gameMode === GAME_MODES.HUMAN_VS_COMPUTER && !gameOver) {
//       const currentTurn = game.turn() === 'w' ? 'white' : 'black';
//       const isComputerTurn = currentTurn !== playerColor;

//       if (isComputerTurn && !thinking && bestMove) {
//         const timer = setTimeout(() => {
//           makeComputerMove();
//         }, 500);
//         return () => clearTimeout(timer);
//       }
//     }
//   }, [gameMode, playerColor, game, gameOver, thinking, bestMove, makeComputerMove]);

//   // Handle square click with game mode context
//   const handleSquareClick = useCallback((square) => {
//     const move = onSquareClick(square, playerColor, gameMode);
//     if (move) {
//       // Store move for quality analysis when new evaluation arrives
//       if (gameMode === GAME_MODES.ANALYZE && evaluation !== null && analysisEnabled && moveAnalysisEnabled) {
//         // Store the current evaluation and move info for later quality calculation
//         const evalBefore = normalizeEvaluation(evaluation, move.color);
//         const moveNumber = Math.ceil(moveHistory.length / 2);

//         setPendingMoveQuality({
//           move: move,
//           evalBefore: evalBefore,
//           moveNumber: moveNumber
//         });

//         console.log(`🔄 Stored move for quality analysis: ${move.san} (${move.color === 'w' ? 'White' : 'Black'}), eval before: ${evalBefore?.toFixed(1)}cp`);
//       }

//       if (timer) {
//         // Start timer on first move
//         if (moveHistory.length === 1 && !timer.gameActive) {
//           console.log('⏱️ Starting timer on first move');
//           timer.startTimer();
//         }
//         // Always switch turn after a move (including first move)
//         setTimeout(() => timer.switchTurn(), 50);
//       }
//       // if (analysisEnabled) {
//       //   setTimeout(() => requestAnalysis(game.fen()), 100);
//       // }
//       if (analysisEnabled) {
//         setTimeout(() => {

//           const afterFen = game.fen();
//           requestAnalysis(afterFen);
//           lastAnalyzedFenRef.current = afterFen;  // asked-for FEN
//         }, 100);
//       }
//     }
//   }, [onSquareClick, playerColor, gameMode, analysisEnabled, moveAnalysisEnabled, game, requestAnalysis, timer, moveHistory, evaluation]);

//   // Get hint
//   const getHint = useCallback(() => {
//     if (bestMove) {
//       const from = bestMove.substring(0, 2);
//       handleSquareClick(from);
//     }
//   }, [bestMove, handleSquareClick]);

//   // Start game
//   const startGame = (mode, color = 'white') => {
//     setGameMode(mode);
//     setPlayerColor(color);
//     // Skip time control selector for Analyze mode
//     if (mode === GAME_MODES.ANALYZE) {
//       setSelectedTimeControl(null);
//       setShowTimeSelector(false);
//     } else {
//       // Show time control selector for other modes
//       setShowTimeSelector(true);
//     }
//   };

//   // Handle time control selection
//   const handleTimeControlSelect = useCallback((timeControl) => {
//     setSelectedTimeControl(timeControl);
//     setShowTimeSelector(false);
//   }, []);

//   // Don't auto-start timer - it will start on first move
//   useEffect(() => {
//     console.log(`⏱️ GamePlay timer ready: selectedTimeControl=${selectedTimeControl?.name}, gameMode=${gameMode}`);
//   }, [selectedTimeControl, gameMode]);

//   // Handle time flag (player runs out of time)
//   useEffect(() => {
//     if (timer) {
//       timer.setOnTimeout((player) => {
//         console.log(`⏱️ ${player} ran out of time!`);
//         timer.pauseTimer();
//         // You can add game over logic here if needed
//         // For now, the timer will stop and show the timeout status
//       });
//     }
//   }, [timer]);

//   // Handle reset with mode context
//   const handleReset = useCallback(() => {
//     resetGame();
//     setAnalysisEnabled(false);
//     stopAnalysis();
//     setMoveQualities([]); // Reset move quality tracking
//     setPendingMoveQuality(null); // Reset pending move quality
//     setMoveAnalysisEnabled(false); // Reset move analysis toggle
//     lastAttemptedMoveRef.current = { fen: null, move: null };
//     moveScheduledRef.current = { fen: null, move: null };
//     if (timer) {
//       timer.resetTimer();
//       // Don't auto-start timer - it will start on first move
//       console.log('⏱️ Timer reset - waiting for first move to start');
//     }
//   }, [resetGame, stopAnalysis, timer]);

//   // Game Action Handlers
//   const handleResign = useCallback(() => {
//     console.log('🏳️ Player resigned');
//     // Stop the engine and timer
//     stopAnalysis();
//     setAnalysisEnabled(false);
//     lastAttemptedMoveRef.current = { fen: null, move: null };
//     moveScheduledRef.current = { fen: null, move: null };
//     if (timer) {
//       timer.resetTimer();
//     }
//     // End game with resignation result
//     resetGame();
//     setGameMode(null);
//   }, [resetGame, stopAnalysis, timer]);

//   const handleDrawOffer = useCallback(() => {
//     console.log('🤝 Draw offer sent');
//     // In a real multiplayer scenario, this would send to opponent
//     // For now, just show a message
//     alert('Draw offer sent! (In multiplayer, opponent would see this)');
//   }, []);

//   const handleAbort = useCallback(() => {
//     console.log('⏸️ Game aborted');
//     // Stop the engine and timer
//     stopAnalysis();
//     setAnalysisEnabled(false);
//     lastAttemptedMoveRef.current = { fen: null, move: null };
//     moveScheduledRef.current = { fen: null, move: null };
//     if (timer) {
//       timer.resetTimer();
//     }
//     // Abort without rating
//     resetGame();
//     setGameMode(null);
//   }, [resetGame, stopAnalysis, timer]);

//   const handleRematch = useCallback(() => {
//     console.log('🎮 Rematch requested');
//     // Stop the engine and reset timer
//     stopAnalysis();
//     setAnalysisEnabled(false);
//     setMoveQualities([]); // Reset move quality tracking
//     setPendingMoveQuality(null); // Reset pending move quality
//     setMoveAnalysisEnabled(false); // Reset move analysis toggle
//     lastAttemptedMoveRef.current = { fen: null, move: null };
//     moveScheduledRef.current = { fen: null, move: null };
//     if (timer) {
//       timer.resetTimer();
//     }
//     // Reset for new game with same mode and settings
//     setBoardFlipped(false);
//     resetGame();
//     // Keep the same time control and game mode
//   }, [resetGame, stopAnalysis, timer]);

//   const handleNewGameSameSettings = useCallback(() => {
//     console.log('⚙️ New game with same settings');
//     // Stop the engine and reset timer
//     stopAnalysis();
//     setAnalysisEnabled(false);
//     setMoveQualities([]); // Reset move quality tracking
//     setPendingMoveQuality(null); // Reset pending move quality
//     setMoveAnalysisEnabled(false); // Reset move analysis toggle
//     lastAttemptedMoveRef.current = { fen: null, move: null };
//     moveScheduledRef.current = { fen: null, move: null };
//     if (timer) {
//       timer.resetTimer();
//     }
//     // Reset for new game with same mode and settings
//     setBoardFlipped(false);
//     resetGame();
//   }, [resetGame, stopAnalysis, timer]);

//   const handleFlipBoard = useCallback(() => {
//     setBoardFlipped(!boardFlipped);
//     console.log('🔄 Board flipped');
//   }, [boardFlipped]);

//   // Time control selector screen
//   if (showTimeSelector && gameMode) {
//     return (
//       <div style={{ padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
//         <TimeControlSelector
//           onSelect={handleTimeControlSelect}
//           onCancel={() => {
//             setShowTimeSelector(false);
//             setGameMode(null);
//           }}
//         />
//       </div>
//     );
//   }

//   // Mode selection screen
//   if (!gameMode) {
//     return (
//       <div style={{
//         padding: 20,
//         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//         minHeight: '100vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center'
//       }}>
//         <div style={{
//           background: 'white',
//           borderRadius: 20,
//           padding: 48,
//           maxWidth: 600,
//           width: '100%',
//           boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
//         }}>
//           <h1 style={{
//             fontSize: 32,
//             fontWeight: 700,
//             marginBottom: 16,
//             textAlign: 'center',
//             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//             WebkitBackgroundClip: 'text',
//             WebkitTextFillColor: 'transparent'
//           }}>
//             ♟️ Chess Game
//           </h1>

//           <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 32 }}>
//             Choose your game mode
//           </p>

//           <div style={{ display: 'grid', gap: 16 }}>
//             <ModeCard
//               icon="👥"
//               title="Human vs Human"
//               description="Play against a friend locally"
//               onClick={() => startGame(GAME_MODES.HUMAN_VS_HUMAN)}
//             />

//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
//               <ModeCard
//                 icon="🤖"
//                 title="vs Computer (White)"
//                 description="You play as White"
//                 onClick={() => startGame(GAME_MODES.HUMAN_VS_COMPUTER, 'white')}
//                 compact
//               />
//               <ModeCard
//                 icon="🤖"
//                 title="vs Computer (Black)"
//                 description="You play as Black"
//                 onClick={() => startGame(GAME_MODES.HUMAN_VS_COMPUTER, 'black')}
//                 compact
//               />
//             </div>

//             <ModeCard
//               icon="🤖⚔️🤖"
//               title="Computer vs Computer"
//               description="Watch AI play itself"
//               onClick={() => startGame(GAME_MODES.COMPUTER_VS_COMPUTER)}
//             />
//             <ModeCard
//               icon="🔍"
//               title="Analyze Position"
//               description="Explore moves with Stockfish"
//               onClick={() => startGame(GAME_MODES.ANALYZE)}
//             />
//           </div>

//           <button
//             onClick={onBack}
//             style={{
//               marginTop: 24,
//               width: '100%',
//               padding: 12,
//               border: '2px solid #e5e7eb',
//               borderRadius: 10,
//               background: 'white',
//               cursor: 'pointer',
//               fontWeight: 500
//             }}
//           >
//             ← Back to Editor
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Get game mode title
//   const getGameModeTitle = () => {
//     switch (gameMode) {
//       case GAME_MODES.HUMAN_VS_HUMAN:
//         return '👥 Human vs Human';
//       case GAME_MODES.HUMAN_VS_COMPUTER:
//         return `🤖 Playing as ${playerColor === 'white' ? 'White ♔' : 'Black ♚'}`;
//       case GAME_MODES.COMPUTER_VS_COMPUTER:
//         return '🤖⚔️🤖 Computer vs Computer';
//       case GAME_MODES.ANALYZE:
//         return '🔍 Analysis Mode';
//       default:
//         return 'Chess Game';
//     }
//   };

//   // Game screen
//   return (
//     <div style={{
//       padding: 20,
//       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//       minHeight: '100vh'
//     }}>
//       <div style={{
//         maxWidth: 1400,
//         margin: '0 auto',
//         background: 'white',
//         borderRadius: 16,
//         padding: 24,
//         boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
//       }}>
//         {/* Header */}
//         <div style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           marginBottom: 24,
//           paddingBottom: 16,
//           borderBottom: '2px solid #f0f0f0'
//         }}>
//           <div>
//             <h2 style={{
//               margin: 0,
//               fontSize: 24,
//               fontWeight: 700,
//               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//               WebkitBackgroundClip: 'text',
//               WebkitTextFillColor: 'transparent'
//             }}>
//               {getGameModeTitle()}
//             </h2>
//             <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
//               {game.turn() === 'w' ? "White's turn" : "Black's turn"}
//               {game.isCheck() && <span style={{ color: '#ef4444', fontWeight: 600 }}> • CHECK!</span>}
//               {gameMode === GAME_MODES.ANALYZE && moveAnalysisEnabled && (
//                 <span style={{ color: '#10b981', fontWeight: 600 }}> • MOVE ANALYSIS ON</span>
//               )}
//             </div>
//             <div style={{
//               fontSize: 12,
//               color: '#9ca3af',
//               marginTop: 6,
//               display: 'flex',
//               alignItems: 'center',
//               gap: 6
//             }}>
//               <span>🤖</span>
//               <span>{STOCKFISH_CONFIG.VERSION} ({STOCKFISH_CONFIG.VARIANT})</span>
//             </div>
//           </div>

//           <div style={{ display: 'flex', gap: 10 }}>
//             {/* Start/Stop Analysis Button - Only show for Analyze mode, not for computer modes */}
//             {gameMode === GAME_MODES.ANALYZE && !analysisEnabled ? (
//               <Button
//                 onClick={() => {
//                   console.log('🟢 Start Analysis button clicked');
//                   setAnalysisEnabled(true);
//                 }}
//                 variant="success"
//               >
//                 ▶️ Start Analysis
//               </Button>
//             ) : null}

//             {/* Stop Analysis Button - Show for any mode when analysis is enabled */}
//             {analysisEnabled && gameMode === GAME_MODES.ANALYZE ? (
//               <Button
//                 onClick={() => {
//                   console.log('🔴 Stop Analysis button clicked');
//                   stopAnalysis();
//                   setAnalysisEnabled(false);
//                 }}
//                 variant="danger"
//               >
//                 ⏹️ Stop Analysis {thinking && '(Analyzing...)'}
//               </Button>
//             ) : null}

//             {/* Move Analysis Toggle - Only show in Analysis mode */}
//             {gameMode === GAME_MODES.ANALYZE ? (
//               <Button
//                 onClick={() => {
//                   setMoveAnalysisEnabled(!moveAnalysisEnabled);
//                   console.log(`📊 Move Analysis ${!moveAnalysisEnabled ? 'enabled' : 'disabled'}`);
//                 }}
//                 variant={moveAnalysisEnabled ? 'success' : 'secondary'}
//                 style={{
//                   background: moveAnalysisEnabled
//                     ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
//                     : '#6b7280',
//                   color: 'white'
//                 }}
//               >
//                 {moveAnalysisEnabled ? '📊 Move Analysis ON' : '📊 Move Analysis OFF'}
//               </Button>
//             ) : null}

//             <Button onClick={undoMove} disabled={moveHistory.length === 0}>
//               ↶ Undo
//             </Button>
//             <Button onClick={getHint} disabled={!bestMove || gameOver}>
//               💡 Hint
//             </Button>
//             <Button onClick={handleReset}>
//               ⟲ Reset
//             </Button>
//             <Button onClick={() => setGameMode(null)}>
//               ← Back
//             </Button>
//           </div>
//         </div>

//         {/* Engine Error Notification */}
//         {engineError && (
//           <div style={{
//             padding: 16,
//             marginBottom: 16,
//             background: '#fef2f2',
//             border: '2px solid #ef4444',
//             borderRadius: 12,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             gap: 12
//           }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//               <span style={{ fontSize: 24 }}>⚠️</span>
//               <div>
//                 <div style={{ fontWeight: 600, color: '#b91c1c', marginBottom: 4 }}>
//                   Chess Engine Error
//                 </div>
//                 <div style={{ fontSize: 14, color: '#991b1b' }}>
//                   {engineError}
//                 </div>
//               </div>
//             </div>
//             <button
//               onClick={clearError}
//               style={{
//                 padding: '8px 16px',
//                 background: '#ef4444',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: 6,
//                 cursor: 'pointer',
//                 fontWeight: 600,
//                 fontSize: 14
//               }}
//             >
//               Dismiss
//             </button>
//           </div>
//         )}

//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
//           {/* Board */}
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//             {/* Chess Timer */}
//             {timer && selectedTimeControl && (
//               <ChessTimer
//                 whiteTime={timer.whiteTime}
//                 blackTime={timer.blackTime}
//                 isWhiteTurn={timer.isWhiteTurn}
//                 whiteTimedOut={timer.whiteTimedOut}
//                 blackTimedOut={timer.blackTimedOut}
//                 formatTime={timer.formatTime}
//                 getTimeColor={timer.getTimeColor}
//                 timeControl={selectedTimeControl}
//               />
//             )}

//             {/* Evaluation Bar */}
//             <EvaluationBar evaluation={evaluation} turn={game.turn()} />

//             {/* Chess Board */}
//             <ChessBoard
//               position={game.board()}
//               selectedSquare={selectedSquare}
//               legalMoves={legalMoves}
//               lastMove={moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null}
//               bestMove={bestMove}
//               showBestMoveArrow={gameMode === GAME_MODES.ANALYZE}
//               onSquareClick={handleSquareClick}
//               gameMode={gameMode}
//               flipped={boardFlipped}
//             />

//             {/* Best Move Display */}
//             {bestMove && !gameOver && (
//               // Only show best move when:
//               // 1. In Analyze mode (user explicitly enabled analysis)
//               // 2. In Human vs Computer and it's the COMPUTER'S turn (not showing hints to human)
//               // 3. NOT showing suggestions to human player on their turn
//               (() => {
//                 const currentTurn = game.turn() === 'w' ? 'white' : 'black';
//                 const isComputerTurn = currentTurn !== playerColor;
//                 const shouldShowBestMove =
//                   gameMode === GAME_MODES.ANALYZE ||
//                   (gameMode === GAME_MODES.HUMAN_VS_COMPUTER && isComputerTurn) ||
//                   gameMode === GAME_MODES.COMPUTER_VS_COMPUTER;

//                 return shouldShowBestMove ? (
//                   <div style={{
//                     padding: 12,
//                     background: '#f0fdf4',
//                     border: '2px solid #10b981',
//                     borderRadius: 10,
//                     textAlign: 'center',
//                     fontWeight: 600,
//                     color: '#065f46'
//                   }}>
//                     💡 Best move: {bestMove.substring(0, 2)} → {bestMove.substring(2, 4)}
//                     {thinking && <span style={{ marginLeft: 8 }}>🤔 Analyzing...</span>}
//                   </div>
//                 ) : null;
//               })()
//             )}
//           </div>

//           {/* Side Panel */}
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//             {/* Game Status */}
//             {gameOver && (
//               <div style={{
//                 padding: 16,
//                 background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
//                 borderRadius: 12,
//                 color: 'white',
//                 textAlign: 'center',
//                 fontWeight: 600,
//                 fontSize: 16,
//                 boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
//               }}>
//                 🎉 Game Over!
//                 <div style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>
//                   {result}
//                 </div>
//               </div>
//             )}

//             {/* Game Actions */}
//             <GameActions
//               gameOver={gameOver}
//               moveCount={moveHistory.length}
//               gameMode={gameMode}
//               playerColor={playerColor}
//               onResign={handleResign}
//               onDrawOffer={handleDrawOffer}
//               onAbort={handleAbort}
//               onRematch={handleRematch}
//               onNewGameSameSettings={handleNewGameSameSettings}
//               onFlipBoard={handleFlipBoard}
//               boardFlipped={boardFlipped}
//             />

//             {/* Move History */}
//             <MoveHistory moves={moveHistory} moveQualities={moveQualities} />

//             {/* Analysis Panel */}
//             <AnalysisPanel
//               evaluation={evaluation}
//               moveCount={moveHistory.length}
//               gameOver={gameOver}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }




import { useState, useEffect, useCallback, useRef } from "react";
import { useChessGame } from "../../hooks/useChessGame";
import { useStockfish } from "../../hooks/useStockfish";
import { useChessTimer } from "../../hooks/useChessTimer";
import ChessBoard from "../chess/ChessBoard";
import EvaluationBar from "../chess/EvaluationBar";
import MoveHistory from "../chess/MoveHistory";
import AnalysisPanel from "../chess/AnalysisPanel";
import GameActions from "../chess/GameActions";
import ChessTimer from "../ChessTimer";
import TimeControlSelector from "../TimeControlSelector";
import Button from "../ui/Button";
import ModeCard from "../ui/ModeCard";
import { GAME_MODES, STOCKFISH_CONFIG } from "../../utils/constants";
import {
  classifyMoveQuality,
  getEvaluationDelta,
  normalizeEvaluation
} from "../../utils/pgn/moveQuality";

export default function GamePlay({ initialFen, onBack, boardCoordinatesFlipped = false }) {
  const [gameMode, setGameMode] = useState(null);
  const [playerColor, setPlayerColor] = useState("white");
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [moveAnalysisEnabled, setMoveAnalysisEnabled] = useState(false);
  const [selectedTimeControl, setSelectedTimeControl] = useState(null);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [boardFlipped, setBoardFlipped] = useState(boardCoordinatesFlipped);


  const inAnalyze = String(gameMode).toLowerCase() === 'analyze';
  // DEBUG:
  console.log('[GamePlay] State:', { gameMode, inAnalyze, analysisEnabled, moveAnalysisEnabled });

  // Move quality state
  const [moveQualities, setMoveQualities] = useState([]);
  const [pendingMoveQuality, setPendingMoveQuality] = useState(null);

  // FEN bindings for evals
  const lastAnalyzedFenRef = useRef(null);        // the FEN we most recently requested eval for
  const lastEvalRef = useRef({ fen: null, value: null }); // the last eval + its FEN

  // hooks
  const {
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
    resetGame
  } = useChessGame(initialFen);

  const {
    evaluation,     // raw engine eval (cp or normalized the way your hook defines)
    bestMove,
    thinking,
    engineError,
    requestAnalysis,
    stopAnalysis,
    clearError
  } = useStockfish();

  const timer = useChessTimer(selectedTimeControl || null);

  // misc refs
  const lastAttemptedMoveRef = useRef({ fen: null, move: null });
  const moveScheduledRef = useRef({ fen: null, move: null });

  // ---------- DEBUG helpers ----------
  const dbg = (...args) => console.log("[GamePlay]", ...args);
  // -----------------------------------

  // When evaluation changes, bind it to the last requested FEN
  useEffect(() => {
    if (evaluation == null || !lastAnalyzedFenRef.current) return;
    lastEvalRef.current = { fen: lastAnalyzedFenRef.current, value: evaluation };
    // DEBUG:
    dbg("EVAL arrived:", {
      forFen: lastAnalyzedFenRef.current,
      eval: evaluation
    });
  }, [evaluation]);

  // Grade a move when we have a pending move and a fresh eval for the AFTER FEN
  useEffect(() => {
    // if (gameMode !== GAME_MODES.ANALYZE) return;
    // if (!pendingMoveQuality || !analysisEnabled || !moveAnalysisEnabled) return;

    if (!inAnalyze) return;
    if (!pendingMoveQuality || !moveAnalysisEnabled) return;
    if (!lastEvalRef.current.value) return;

    const { move, evalBefore, moveNumber, beforeFen } = pendingMoveQuality;

    // ensure the latest eval is for AFTER the move (i.e., not the same as beforeFen)
    if (!lastEvalRef.current.fen || lastEvalRef.current.fen === beforeFen) {
      // DEBUG:
      dbg("GRADE skipped: eval corresponds to BEFORE fen or is missing", {
        lastEvalFen: lastEvalRef.current.fen,
        beforeFen
      });
      return;
    }

    const evalAfter = normalizeEvaluation(lastEvalRef.current.value, move.color);
    const evalDelta =
      evalBefore != null ? getEvaluationDelta(evalBefore, evalAfter) : null;
    const quality =
      evalDelta != null ? classifyMoveQuality(evalDelta) : "—";

    const moveQuality = {
      moveNumber,
      color: move.color,
      san: move.san,
      quality,
      evalBefore: evalBefore ?? null,
      evalAfter,
      evalDelta
    };

    setMoveQualities((prev) => [...prev, moveQuality]);

    // DEBUG:
    dbg("GRADE done:", {
      san: move.san,
      color: move.color,
      moveNumber,
      evalBefore,
      evalAfter,
      evalDelta,
      quality
    });

    setPendingMoveQuality(null);

    // IMPORTANT: Stop analysis after grading the move
    // When Move Analysis is ON, we only want to grade moves, not suggest next moves
    stopAnalysis();
    dbg("Analysis stopped after grading move");

    // }, [evaluation, gameMode, analysisEnabled, moveAnalysisEnabled, pendingMoveQuality]);
  }, [evaluation, inAnalyze, moveAnalysisEnabled, pendingMoveQuality, stopAnalysis]);

  // Auto-trigger analysis when position changes (only where allowed)
  useEffect(() => {
    const currentFen = boardFen;

    // Computer modes: auto-enable engine (for making moves), not grading
    if (
      (gameMode === GAME_MODES.HUMAN_VS_COMPUTER ||
        gameMode === GAME_MODES.COMPUTER_VS_COMPUTER) &&
      !analysisEnabled
    ) {
      dbg("Auto-enabling analysis (computer mode).");
      setAnalysisEnabled(true);
      return;
    }

    // In HvC: stop analysis when it's *human* turn (avoid hints)
    if (gameMode === GAME_MODES.HUMAN_VS_COMPUTER && analysisEnabled) {
      const currentTurn = game.turn() === "w" ? "white" : "black";
      const isComputerTurn = currentTurn !== playerColor;

      if (!isComputerTurn) {
        // NOTE: for grading, we only grade in ANALYZE mode anyway.
        stopAnalysis();
        dbg("HvC human turn -> stopAnalysis()");
        return;
      }
    }

    // Only analyze if enabled and position changed
    if (
      analysisEnabled &&
      !thinking &&
      !gameOver &&
      currentFen !== lastAnalyzedFenRef.current
    ) {
      lastAnalyzedFenRef.current = currentFen;
      requestAnalysis(currentFen);
      // DEBUG:
      dbg("REQ eval (position changed effect):", currentFen.slice(0, 60));
    } else if (analysisEnabled) {
      // DEBUG:
      dbg("No REQ (effect):", {
        thinking,
        gameOver,
        sameFen: currentFen === lastAnalyzedFenRef.current,
        fen: currentFen.slice(0, 60)
      });
    }
  }, [
    analysisEnabled,
    boardFen,
    gameOver,
    thinking,
    requestAnalysis,
    game,
    gameMode,
    playerColor,
    stopAnalysis
  ]);

  // Computer move helper
  const makeComputerMove = useCallback(() => {
    if (!bestMove || gameOver) return;

    const currentFen = game.fen();

    if (
      lastAttemptedMoveRef.current.fen === currentFen &&
      lastAttemptedMoveRef.current.move === bestMove
    ) {
      dbg("Already attempted move for this position:", bestMove);
      return;
    }

    const from = bestMove.substring(0, 2);
    const to = bestMove.substring(2, 4);
    const promotion = bestMove.length > 4 ? bestMove[4] : undefined;

    lastAttemptedMoveRef.current = { fen: currentFen, move: bestMove };

    stopAnalysis(); // avoid racing

    const move = makeMove(from, to, promotion);

    if (move) {
      dbg("Computer move:", { from, to, promotion, newFen: game.fen() });
      if (timer) {
        if (moveHistory.length === 1 && !timer.gameActive) {
          dbg("Timer start (computer first move).");
          timer.startTimer();
        }
        setTimeout(() => timer.switchTurn(), 50);
      }
    } else {
      dbg("Computer move FAILED:", { from, to, promotion, currentFen });
      lastAttemptedMoveRef.current = { fen: null, move: null };
    }
  }, [bestMove, gameOver, makeMove, game, stopAnalysis, timer, moveHistory]);

  // CvC scheduling
  useEffect(() => {
    if (
      gameMode === GAME_MODES.COMPUTER_VS_COMPUTER &&
      !thinking &&
      bestMove &&
      !gameOver
    ) {
      const currentFen = game.fen();
      if (
        moveScheduledRef.current.fen === currentFen &&
        moveScheduledRef.current.move === bestMove
      ) {
        dbg("CvC already scheduled:", bestMove);
        return;
      }

      dbg("CvC scheduling:", bestMove);
      moveScheduledRef.current = { fen: currentFen, move: bestMove };

      const t = setTimeout(() => {
        dbg("CvC executing:", bestMove);
        moveScheduledRef.current = { fen: null, move: null };
        makeComputerMove();
      }, 1500);

      return () => {
        clearTimeout(t);
        moveScheduledRef.current = { fen: null, move: null };
      };
    }
  }, [gameMode, thinking, bestMove, gameOver, makeComputerMove, game]);

  // HvC: let engine play when it's the computer's turn
  useEffect(() => {
    if (gameMode === GAME_MODES.HUMAN_VS_COMPUTER && !gameOver) {
      const currentTurn = game.turn() === "w" ? "white" : "black";
      const isComputerTurn = currentTurn !== playerColor;

      if (isComputerTurn && !thinking && bestMove) {
        const t = setTimeout(() => {
          makeComputerMove();
        }, 500);
        return () => clearTimeout(t);
      }
    }
  }, [gameMode, playerColor, game, gameOver, thinking, bestMove, makeComputerMove]);

  // CLICK handler (stores BEFORE FEN + optional evalBefore) and requests AFTER eval in Analysis mode
  const handleSquareClick = useCallback(


    (square) => {
      const beforeFen = game.fen();
      // DEBUG:
      dbg("CLICK on", square, "beforeFen=", beforeFen);

      const move = onSquareClick(square, playerColor, gameMode);
      if (!move) return;

      // Only grade in ANALYZE mode with toggle ON
      // if (gameMode === GAME_MODES.ANALYZE && analysisEnabled && moveAnalysisEnabled) {
      if (inAnalyze && moveAnalysisEnabled) {
        // Take evalBefore only if it belongs to BEFORE
        let evalBefore = null;
        if (
          lastEvalRef.current.fen === beforeFen &&
          lastEvalRef.current.value != null
        ) {
          evalBefore = normalizeEvaluation(lastEvalRef.current.value, move.color);
        }

        const moveNumber = Math.ceil(moveHistory.length / 2);

        setPendingMoveQuality({
          move,
          evalBefore,
          moveNumber,
          beforeFen
        });

        // DEBUG:
        dbg("PENDING set:", {
          san: move.san,
          color: move.color,
          moveNumber,
          beforeFen,
          evalBefore
        });

        // Request AFTER eval (single-shot) for the new position
        setTimeout(() => {
          const afterFen = game.fen();
          lastAnalyzedFenRef.current = afterFen;
          requestAnalysis(afterFen);
          // DEBUG:
          dbg("REQ eval (after human move):", afterFen);
        }, 100);
      }

      // timer logic
      if (timer) {
        if (moveHistory.length === 1 && !timer.gameActive) {
          dbg("Timer start (human first move).");
          timer.startTimer();
        }
        setTimeout(() => timer.switchTurn(), 50);
      }
    },
    [
      onSquareClick,
      playerColor,
      gameMode,
      analysisEnabled,
      moveAnalysisEnabled,
      game,
      requestAnalysis,
      timer,
      moveHistory
    ]
  );

  // Hint just reuses bestMove's 'from' to click
  const getHint = useCallback(() => {
    if (bestMove) {
      const from = bestMove.substring(0, 2);
      handleSquareClick(from);
    }
  }, [bestMove, handleSquareClick]);

  // Start / reset / etc.
  const startGame = (mode, color = "white") => {
    setGameMode(mode);
    setPlayerColor(color);
    if (mode === GAME_MODES.ANALYZE) {
      setSelectedTimeControl(null);
      setShowTimeSelector(false);
    } else {
      setShowTimeSelector(true);
    }
  };

  const handleTimeControlSelect = useCallback((timeControl) => {
    setSelectedTimeControl(timeControl);
    setShowTimeSelector(false);
  }, []);

  useEffect(() => {
    dbg("Timer ready:", {
      selectedTC: selectedTimeControl?.name,
      gameMode
    });
  }, [selectedTimeControl, gameMode]);

  useEffect(() => {
    if (timer) {
      timer.setOnTimeout((player) => {
        dbg("TIMEOUT:", player);
        timer.pauseTimer();
      });
    }
  }, [timer]);

  const handleReset = useCallback(() => {
    resetGame();
    setAnalysisEnabled(false);
    setMoveAnalysisEnabled(false);
    stopAnalysis();
    setMoveQualities([]);
    setPendingMoveQuality(null);
    lastAttemptedMoveRef.current = { fen: null, move: null };
    moveScheduledRef.current = { fen: null, move: null };
    if (timer) {
      timer.resetTimer();
      dbg("Timer reset.");
    }
  }, [resetGame, stopAnalysis, timer]);

  const handleResign = useCallback(() => {
    stopAnalysis();
    setAnalysisEnabled(false);
    if (timer) timer.resetTimer();
    resetGame();
    setGameMode(null);
  }, [resetGame, stopAnalysis, timer]);

  const handleAbort = useCallback(() => {
    stopAnalysis();
    setAnalysisEnabled(false);
    if (timer) timer.resetTimer();
    resetGame();
    setGameMode(null);
  }, [resetGame, stopAnalysis, timer]);

  const handleRematch = useCallback(() => {
    stopAnalysis();
    setAnalysisEnabled(false);
    setMoveAnalysisEnabled(false);
    setMoveQualities([]);
    setPendingMoveQuality(null);
    lastAttemptedMoveRef.current = { fen: null, move: null };
    moveScheduledRef.current = { fen: null, move: null };
    if (timer) timer.resetTimer();
    setBoardFlipped(false);
    resetGame();
  }, [resetGame, stopAnalysis, timer]);

  const handleNewGameSameSettings = useCallback(() => {
    stopAnalysis();
    setAnalysisEnabled(false);
    setMoveAnalysisEnabled(false);
    setMoveQualities([]);
    setPendingMoveQuality(null);
    lastAttemptedMoveRef.current = { fen: null, move: null };
    moveScheduledRef.current = { fen: null, move: null };
    if (timer) timer.resetTimer();
    setBoardFlipped(false);
    resetGame();
  }, [resetGame, stopAnalysis, timer]);

  const handleFlipBoard = useCallback(() => {
    setBoardFlipped((b) => !b);
  }, []);

  // Screens
  if (showTimeSelector && gameMode) {
    return (
      <div style={{ padding: "20px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", minHeight: "100vh" }}>
        <TimeControlSelector
          onSelect={handleTimeControlSelect}
          onCancel={() => {
            setShowTimeSelector(false);
            setGameMode(null);
          }}
        />
      </div>
    );
  }

  if (!gameMode) {
    return (
      <div style={{
        padding: 20,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          background: "white",
          borderRadius: 20,
          padding: 48,
          maxWidth: 600,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 16,
            textAlign: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            ♟️ Chess Game
          </h1>

          <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 32 }}>
            Choose your game mode
          </p>

          <div style={{ display: "grid", gap: 16 }}>
            <ModeCard
              icon="👥"
              title="Human vs Human"
              description="Play against a friend locally"
              onClick={() => startGame(GAME_MODES.HUMAN_VS_HUMAN)}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <ModeCard
                icon="🤖"
                title="vs Computer (White)"
                description="You play as White"
                onClick={() => startGame(GAME_MODES.HUMAN_VS_COMPUTER, "white")}
                compact
              />
              <ModeCard
                icon="🤖"
                title="vs Computer (Black)"
                description="You play as Black"
                onClick={() => startGame(GAME_MODES.HUMAN_VS_COMPUTER, "black")}
                compact
              />
            </div>

            <ModeCard
              icon="🤖⚔️🤖"
              title="Computer vs Computer"
              description="Watch AI play itself"
              onClick={() => startGame(GAME_MODES.COMPUTER_VS_COMPUTER)}
            />
            <ModeCard
              icon="🔍"
              title="Analyze Position"
              description="Explore moves with Stockfish"
              onClick={() => startGame(GAME_MODES.ANALYZE)}
            />
          </div>

          <button
            onClick={onBack}
            style={{
              marginTop: 24,
              width: "100%",
              padding: 12,
              border: "2px solid #e5e7eb",
              borderRadius: 10,
              background: "white",
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            ← Back to Editor
          </button>
        </div>
      </div>
    );
  }

  const getGameModeTitle = () => {
    switch (gameMode) {
      case GAME_MODES.HUMAN_VS_HUMAN:
        return "👥 Human vs Human";
      case GAME_MODES.HUMAN_VS_COMPUTER:
        return `🤖 Playing as ${playerColor === "white" ? "White ♔" : "Black ♚"}`;
      case GAME_MODES.COMPUTER_VS_COMPUTER:
        return "🤖⚔️🤖 Computer vs Computer";
      case GAME_MODES.ANALYZE:
        return "🔍 Analysis Mode";
      default:
        return "Chess Game";
    }
  };

  return (
    <div style={{
      padding: 20,
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      minHeight: "100vh"
    }}>
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        background: "white",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "2px solid #f0f0f0"
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              {getGameModeTitle()}
            </h2>
            <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
              {game.turn() === "w" ? "White's turn" : "Black's turn"}
              {game.isCheck() && <span style={{ color: "#ef4444", fontWeight: 600 }}> • CHECK!</span>}
              {gameMode === GAME_MODES.ANALYZE && moveAnalysisEnabled && (
                <span style={{ color: "#10b981", fontWeight: 600 }}> • MOVE ANALYSIS ON</span>
              )}
            </div>
            <div style={{
              fontSize: 12,
              color: "#9ca3af",
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <span>🤖</span>
              <span>{STOCKFISH_CONFIG.VERSION} ({STOCKFISH_CONFIG.VARIANT})</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {/* Analysis controls — only in ANALYZE mode */}
            {inAnalyze && !analysisEnabled ? (
              <Button
                onClick={() => {
                  dbg("Start Analysis clicked");
                  setAnalysisEnabled(true);
                }}
                variant="success"
              >
                ▶️ Start Analysis
              </Button>
            ) : null}

            {analysisEnabled && inAnalyze ? (
              <Button
                onClick={() => {
                  dbg("Stop Analysis clicked");
                  stopAnalysis();
                  setAnalysisEnabled(false);
                }}
                variant="danger"
              >
                ⏹️ Stop Analysis {thinking && "(Analyzing...)"}
              </Button>
            ) : null}

            {inAnalyze  ? (
              <Button
                onClick={() => {
                  const next = !moveAnalysisEnabled;
                  setMoveAnalysisEnabled(next);
                  dbg(`Move Analysis ${next ? "ENABLED" : "DISABLED"}`);
                }}
                variant={moveAnalysisEnabled ? "success" : "secondary"}
                style={{
                  background: moveAnalysisEnabled
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "#6b7280",
                  color: "white"
                }}
              >
                {moveAnalysisEnabled ? "📊 Move Analysis ON" : "📊 Move Analysis OFF"}
              </Button>
            ) : null}

            <Button onClick={undoMove} disabled={moveHistory.length === 0}>
              ↶ Undo
            </Button>
            <Button onClick={getHint} disabled={!bestMove || gameOver}>
              💡 Hint
            </Button>
            <Button onClick={handleReset}>
              ⟲ Reset
            </Button>
            <Button onClick={() => setGameMode(null)}>
              ← Back
            </Button>
          </div>
        </div>

        {/* Engine Error Notification */}
        {engineError && (
          <div style={{
            padding: 16,
            marginBottom: 16,
            background: "#fef2f2",
            border: "2px solid #ef4444",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 600, color: "#b91c1c", marginBottom: 4 }}>
                  Chess Engine Error
                </div>
                <div style={{ fontSize: 14, color: "#991b1b" }}>
                  {engineError}
                </div>
              </div>
            </div>
            <button
              onClick={clearError}
              style={{
                padding: "8px 16px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 24 }}>
          {/* Board + widgets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {timer && selectedTimeControl && (
              <ChessTimer
                whiteTime={timer.whiteTime}
                blackTime={timer.blackTime}
                isWhiteTurn={timer.isWhiteTurn}
                whiteTimedOut={timer.whiteTimedOut}
                blackTimedOut={timer.blackTimedOut}
                formatTime={timer.formatTime}
                getTimeColor={timer.getTimeColor}
                timeControl={selectedTimeControl}
              />
            )}

            <EvaluationBar evaluation={evaluation} turn={game.turn()} />

            <ChessBoard
              position={game.board()}
              selectedSquare={selectedSquare}
              legalMoves={legalMoves}
              lastMove={moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null}
              bestMove={bestMove}
              showBestMoveArrow={gameMode === GAME_MODES.ANALYZE}
              onSquareClick={handleSquareClick}
              gameMode={gameMode}
              flipped={boardFlipped}
            />

            {/* Show last move quality when Move Analysis is ON */}
            {inAnalyze && moveAnalysisEnabled && moveQualities.length > 0 && !gameOver && (() => {
              const lastQuality = moveQualities[moveQualities.length - 1];
              const qualityColors = {
                "Brilliant!!": { bg: "#f0f9ff", border: "#0ea5e9", text: "#0c4a6e", emoji: "🌟" },
                "Excellent!": { bg: "#f0fdf4", border: "#10b981", text: "#065f46", emoji: "✓✓" },
                "Good": { bg: "#f0fdf4", border: "#22c55e", text: "#166534", emoji: "✓" },
                "Inaccuracy": { bg: "#fffbeb", border: "#f59e0b", text: "#92400e", emoji: "?!" },
                "Mistake": { bg: "#fef2f2", border: "#f97316", text: "#991b1b", emoji: "?" },
                "Blunder": { bg: "#fef2f2", border: "#ef4444", text: "#7f1d1d", emoji: "??" },
                "Book": { bg: "#f5f3ff", border: "#8b5cf6", text: "#5b21b6", emoji: "📖" },
                "—": { bg: "#f9fafb", border: "#9ca3af", text: "#374151", emoji: "—" }
              };
              const colors = qualityColors[lastQuality.quality] || qualityColors["—"];

              return (
                <div style={{
                  padding: 16,
                  background: colors.bg,
                  border: `2px solid ${colors.border}`,
                  borderRadius: 10,
                  textAlign: "center",
                  fontWeight: 600,
                  color: colors.text
                }}>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>
                    {colors.emoji} {lastQuality.san} - {lastQuality.quality}
                  </div>
                  {lastQuality.evalDelta != null && (
                    <div style={{ fontSize: 14, opacity: 0.8 }}>
                      Evaluation: {lastQuality.evalBefore?.toFixed(1) || "?"} → {lastQuality.evalAfter?.toFixed(1)}
                      ({lastQuality.evalDelta > 0 ? '+' : ''}{lastQuality.evalDelta?.toFixed(1)}cp)
                    </div>
                  )}
                  {thinking && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>Analyzing next position...</div>}
                </div>
              );
            })()}

            {/* Show best move suggestion when NOT in Move Analysis mode */}
            {bestMove && !gameOver && (() => {
              const currentTurn = game.turn() === "w" ? "white" : "black";
              const isComputerTurn = currentTurn !== playerColor;

              // Don't show best move suggestion when Move Analysis is ON
              // (we want to show move quality instead, not suggestions)
              const shouldShowBestMove =
                (gameMode === GAME_MODES.ANALYZE && !moveAnalysisEnabled) ||
                (gameMode === GAME_MODES.HUMAN_VS_COMPUTER && isComputerTurn) ||
                gameMode === GAME_MODES.COMPUTER_VS_COMPUTER;

              return shouldShowBestMove ? (
                <div style={{
                  padding: 12,
                  background: "#f0fdf4",
                  border: "2px solid #10b981",
                  borderRadius: 10,
                  textAlign: "center",
                  fontWeight: 600,
                  color: "#065f46"
                }}>
                  💡 Best move: {bestMove.substring(0, 2)} → {bestMove.substring(2, 4)}
                  {thinking && <span style={{ marginLeft: 8 }}>🤔 Analyzing...</span>}
                </div>
              ) : null;
            })()}
          </div>

          {/* Side Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {gameOver && (
              <div style={{
                padding: 16,
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                borderRadius: 12,
                color: "white",
                textAlign: "center",
                fontWeight: 600,
                fontSize: 16,
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
              }}>
                🎉 Game Over!
                <div style={{ fontSize: 14, marginTop: 8, opacity: 0.9 }}>
                  {result}
                </div>
              </div>
            )}

            <GameActions
              gameOver={gameOver}
              moveCount={moveHistory.length}
              gameMode={gameMode}
              playerColor={playerColor}
              onResign={handleResign}
              onDrawOffer={() => alert("Draw offer sent!")}
              onAbort={handleAbort}
              onRematch={handleRematch}
              onNewGameSameSettings={handleNewGameSameSettings}
              onFlipBoard={handleFlipBoard}
              boardFlipped={boardFlipped}
            />

            <MoveHistory moves={moveHistory} moveQualities={moveQualities} />

            <AnalysisPanel
              evaluation={evaluation}
              moveCount={moveHistory.length}
              gameOver={gameOver}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

