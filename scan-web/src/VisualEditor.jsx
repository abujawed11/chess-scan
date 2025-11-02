// import { useState, useEffect } from 'react'

// const PIECE_TYPES = ['P', 'N', 'B', 'R', 'Q', 'K']
// const PIECE_LABELS = {
//   'P': '♟ Pawn',
//   'N': '♞ Knight',
//   'B': '♝ Bishop',
//   'R': '♜ Rook',
//   'Q': '♛ Queen',
//   'K': '♚ King'
// }

// function validateFEN(pieces) {
//   const warnings = []
//   const pieceCounts = {}

//   // Count each piece type
//   Object.values(pieces).forEach(piece => {
//     pieceCounts[piece] = (pieceCounts[piece] || 0) + 1
//   })

//   // Check for multiple kings
//   if ((pieceCounts['K'] || 0) > 1) warnings.push('⚠️ Multiple white kings detected')
//   if ((pieceCounts['k'] || 0) > 1) warnings.push('⚠️ Multiple black kings detected')

//   // Check for missing kings (if pieces identified)
//   if (Object.keys(pieces).length > 5) {
//     if (!pieceCounts['K']) warnings.push('⚠️ No white king found')
//     if (!pieceCounts['k']) warnings.push('⚠️ No black king found')
//   }

//   return warnings
// }

// function VisualEditor({ squares, onComplete, onCancel }) {
//   const [pieces, setPieces] = useState({})
//   const [selectedSquare, setSelectedSquare] = useState(null)
//   const [generatedFEN, setGeneratedFEN] = useState('')
//   const [markedEmpty, setMarkedEmpty] = useState(new Set())

//   // Filter only non-empty squares for manual identification
//   const piecesSquares = squares.filter(sq => !sq.isEmpty && !markedEmpty.has(sq.position))
//   const warnings = validateFEN(pieces)

//   useEffect(() => {
//     // Generate FEN whenever pieces change
//     generateFEN()
//   }, [pieces])

//   const generateFEN = () => {
//     const board = Array(64).fill('.')

//     // Place identified pieces
//     Object.entries(pieces).forEach(([position, piece]) => {
//       const square = squares.find(s => s.position === position)
//       if (square) {
//         board[square.index] = piece
//       }
//     })

//     // Convert to FEN
//     const fenRows = []
//     for (let row = 0; row < 8; row++) {
//       let fenRow = ''
//       let emptyCount = 0

//       for (let col = 0; col < 8; col++) {
//         const idx = row * 8 + col
//         const piece = board[idx]

//         if (piece === '.') {
//           emptyCount++
//         } else {
//           if (emptyCount > 0) {
//             fenRow += emptyCount
//             emptyCount = 0
//           }
//           fenRow += piece
//         }
//       }

//       if (emptyCount > 0) {
//         fenRow += emptyCount
//       }

//       fenRows.push(fenRow)
//     }

//     const fen = fenRows.join('/') + ' w KQkq - 0 1'
//     setGeneratedFEN(fen)
//   }

//   const handlePieceSelect = (position, pieceType, color) => {
//     const piece = color === 'w' ? pieceType.toUpperCase() : pieceType.toLowerCase()
//     setPieces({
//       ...pieces,
//       [position]: piece
//     })
//   }

//   const handleMarkEmpty = (position) => {
//     setMarkedEmpty(new Set([...markedEmpty, position]))
//     // Remove from pieces if it was there
//     const newPieces = { ...pieces }
//     delete newPieces[position]
//     setPieces(newPieces)
//   }

//   const handleComplete = async () => {
//     // Send to backend for final FEN generation
//     const piecesArray = Object.entries(pieces).map(([position, piece]) => ({
//       position,
//       piece
//     }))

//     try {
//       const response = await fetch('http://localhost:3000/api/vision/generate-fen-from-pieces', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ pieces: piecesArray })
//       })

//       const data = await response.json()
//       onComplete(data)
//     } catch (err) {
//       console.error('Failed to generate FEN:', err)
//     }
//   }

//   const progress = Object.keys(pieces).length
//   const total = piecesSquares.length

//   return (
//     <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
//       <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <div>
//           <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Visual Chess Board Editor</h2>
//           <p style={{ color: '#666' }}>
//             Click on each piece to identify its type ({progress}/{total} identified)
//           </p>
//         </div>
//         <div style={{ display: 'flex', gap: '10px' }}>
//           <button
//             onClick={onCancel}
//             style={{
//               padding: '10px 20px',
//               backgroundColor: '#6b7280',
//               color: 'white',
//               border: 'none',
//               borderRadius: '6px',
//               cursor: 'pointer'
//             }}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleComplete}
//             disabled={progress === 0}
//             style={{
//               padding: '10px 20px',
//               backgroundColor: progress === 0 ? '#ccc' : '#10b981',
//               color: 'white',
//               border: 'none',
//               borderRadius: '6px',
//               cursor: progress === 0 ? 'not-allowed' : 'pointer',
//               fontWeight: '600'
//             }}
//           >
//             ✅ Generate FEN
//           </button>
//         </div>
//       </div>

//       {/* Progress Bar */}
//       <div style={{ marginBottom: '20px' }}>
//         <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
//           <div style={{
//             width: `${(progress / total) * 100}%`,
//             height: '100%',
//             backgroundColor: '#10b981',
//             transition: 'width 0.3s'
//           }} />
//         </div>
//       </div>

//       {/* Warnings */}
//       {warnings.length > 0 && (
//         <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', border: '2px solid #f59e0b' }}>
//           <strong>⚠️ Warnings:</strong>
//           <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
//             {warnings.map((warning, idx) => (
//               <li key={idx}>{warning}</li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* FEN Preview */}
//       {generatedFEN && (
//         <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #3b82f6' }}>
//           <strong>Live FEN Preview:</strong>
//           <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '8px', wordBreak: 'break-all' }}>
//             {generatedFEN}
//           </div>
//         </div>
//       )}

//       {/* Chess Board Grid */}
//       <div style={{
//         display: 'grid',
//         gridTemplateColumns: 'repeat(8, 1fr)',
//         gap: '4px',
//         maxWidth: '800px',
//         margin: '0 auto'
//       }}>
//         {squares.map((square) => {
//           const isEven = (Math.floor(square.index / 8) + (square.index % 8)) % 2 === 0
//           const bgColor = isEven ? '#f0d9b5' : '#b58863'
//           const isIdentified = pieces[square.position]

//           return (
//             <div
//               key={square.position}
//               style={{
//                 position: 'relative',
//                 aspectRatio: '1',
//                 backgroundColor: bgColor,
//                 border: isIdentified ? '3px solid #10b981' : '1px solid #999',
//                 borderRadius: '4px',
//                 overflow: 'hidden',
//                 cursor: square.isEmpty ? 'default' : 'pointer'
//               }}
//               onClick={() => !square.isEmpty && setSelectedSquare(square.position)}
//             >
//               {/* Square Image */}
//               <img
//                 src={`data:image/png;base64,${square.imageData}`}
//                 alt={square.position}
//                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
//               />

//               {/* Position Label */}
//               <div style={{
//                 position: 'absolute',
//                 top: '2px',
//                 left: '2px',
//                 fontSize: '0.7rem',
//                 fontWeight: 'bold',
//                 color: isEven ? '#b58863' : '#f0d9b5',
//                 textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
//               }}>
//                 {square.position}
//               </div>

//               {/* Identified Piece Badge */}
//               {isIdentified && (
//                 <div style={{
//                   position: 'absolute',
//                   bottom: '2px',
//                   right: '2px',
//                   backgroundColor: '#10b981',
//                   color: 'white',
//                   padding: '2px 6px',
//                   borderRadius: '4px',
//                   fontSize: '0.8rem',
//                   fontWeight: 'bold'
//                 }}>
//                   {isIdentified}
//                 </div>
//               )}

//               {/* Click to Identify Overlay */}
//               {!square.isEmpty && !isIdentified && (
//                 <div style={{
//                   position: 'absolute',
//                   inset: 0,
//                   backgroundColor: 'rgba(0,0,0,0.3)',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                   color: 'white',
//                   fontSize: '0.7rem',
//                   opacity: 0,
//                   transition: 'opacity 0.2s',
//                   pointerEvents: 'none'
//                 }}
//                 className="hover-overlay"
//               >
//                 Click to identify
//               </div>
//               )}
//             </div>
//           )
//         })}
//       </div>

//       {/* Piece Selection Modal */}
//       {selectedSquare && (
//         <div
//           style={{
//             position: 'fixed',
//             inset: 0,
//             backgroundColor: 'rgba(0,0,0,0.7)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             zIndex: 1000
//           }}
//           onClick={() => setSelectedSquare(null)}
//         >
//           <div
//             style={{
//               backgroundColor: 'white',
//               borderRadius: '12px',
//               padding: '30px',
//               maxWidth: '500px',
//               width: '90%'
//             }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>
//               Identify piece at <strong>{selectedSquare}</strong>
//             </h3>

//             {/* Show the square image */}
//             <div style={{ marginBottom: '20px', textAlign: 'center' }}>
//               <img
//                 src={`data:image/png;base64,${squares.find(s => s.position === selectedSquare)?.imageData}`}
//                 alt={selectedSquare}
//                 style={{ maxWidth: '150px', border: '2px solid #ddd', borderRadius: '8px' }}
//               />
//             </div>

//             {/* Piece Type Buttons */}
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
//               {PIECE_TYPES.map((pieceType) => {
//                 const square = squares.find(s => s.position === selectedSquare)
//                 const color = square?.detectedColor || 'w'

//                 return (
//                   <button
//                     key={pieceType}
//                     onClick={() => {
//                       handlePieceSelect(selectedSquare, pieceType, color)
//                       setSelectedSquare(null)
//                     }}
//                     style={{
//                       padding: '16px',
//                       backgroundColor: '#f0f9ff',
//                       border: '2px solid #3b82f6',
//                       borderRadius: '8px',
//                       cursor: 'pointer',
//                       fontSize: '1rem',
//                       fontWeight: '600',
//                       transition: 'all 0.2s'
//                     }}
//                     onMouseOver={(e) => {
//                       e.target.style.backgroundColor = '#dbeafe'
//                       e.target.style.transform = 'scale(1.05)'
//                     }}
//                     onMouseOut={(e) => {
//                       e.target.style.backgroundColor = '#f0f9ff'
//                       e.target.style.transform = 'scale(1)'
//                     }}
//                   >
//                     {PIECE_LABELS[pieceType]}
//                   </button>
//                 )
//               })}
//             </div>

//             <button
//               onClick={() => {
//                 handleMarkEmpty(selectedSquare)
//                 setSelectedSquare(null)
//               }}
//               style={{
//                 marginTop: '20px',
//                 width: '100%',
//                 padding: '12px',
//                 backgroundColor: '#ef4444',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '6px',
//                 cursor: 'pointer',
//                 fontWeight: '600'
//               }}
//             >
//               ❌ Mark as Empty (False Positive)
//             </button>

//             <button
//               onClick={() => setSelectedSquare(null)}
//               style={{
//                 marginTop: '12px',
//                 width: '100%',
//                 padding: '12px',
//                 backgroundColor: '#6b7280',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '6px',
//                 cursor: 'pointer'
//               }}
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}

//       <style>{`
//         .hover-overlay:hover {
//           opacity: 1 !important;
//         }
//       `}</style>
//     </div>
//   )
// }

// export default VisualEditor




// import { useState, useEffect } from 'react'
// import { Chess } from 'chess.js'   // <-- add this

// const PIECE_TYPES = ['P', 'N', 'B', 'R', 'Q', 'K']
// const PIECE_LABELS = {
//   P: '♟ Pawn',
//   N: '♞ Knight',
//   B: '♝ Bishop',
//   R: '♜ Rook',
//   Q: '♛ Queen',
//   K: '♚ King',
// }

// // ---- helpers ----

// // conservative castling inference: grant right only if king + rook on start squares
// function inferCastlingRights(board64) {
//   // board64: array of length 64, a8..h1, '.' or piece letters
//   const at = (file, rank) => board64[rank * 8 + file] // file: 0=a..7=h, rank: 0=8th..7=1st

//   const rights = []

//   // White
//   const wk = at(4, 7) === 'K' // e1
//   const wra = at(0, 7) === 'R' // a1
//   const wrh = at(7, 7) === 'R' // h1
//   if (wk && wrh) rights.push('K')
//   if (wk && wra) rights.push('Q')

//   // Black
//   const bk = at(4, 0) === 'k' // e8
//   const bra = at(0, 0) === 'r' // a8
//   const brh = at(7, 0) === 'r' // h8
//   if (bk && brh) rights.push('k')
//   if (bk && bra) rights.push('q')

//   return rights.length ? rights.join('') : '-'
// }

// function validateFENHeuristics(pieces) {
//   const warnings = []
//   const counts = {}
//   Object.values(pieces).forEach(p => (counts[p] = (counts[p] || 0) + 1))

//   if ((counts['K'] || 0) > 1) warnings.push('⚠️ Multiple white kings detected')
//   if ((counts['k'] || 0) > 1) warnings.push('⚠️ Multiple black kings detected')

//   if (Object.keys(pieces).length > 5) {
//     if (!counts['K']) warnings.push('⚠️ No white king found')
//     if (!counts['k']) warnings.push('⚠️ No black king found')
//   }

//   return warnings
// }

// function validateFenWithChessJS(fen) {
//   try {
//     new Chess(fen) // throws on illegal FEN (e.g., impossible castling)
//     return { valid: true }
//   } catch (e) {
//     return { valid: false, reason: e?.message || 'Invalid FEN' }
//   }
// }

// function VisualEditor({ squares, onComplete, onCancel }) {
//   const [pieces, setPieces] = useState({})
//   const [selectedSquare, setSelectedSquare] = useState(null)
//   const [generatedFEN, setGeneratedFEN] = useState('')
//   const [fenStatus, setFenStatus] = useState({ valid: true })
//   const [markedEmpty, setMarkedEmpty] = useState(new Set())

//   // only non-empty tiles (minus any the user marked empty)
//   const piecesSquares = squares.filter(
//     (sq) => !sq.isEmpty && !markedEmpty.has(sq.position)
//   )
//   const warnings = validateFENHeuristics(pieces)

//   useEffect(() => {
//     const fen = buildFenFromPieces(pieces, squares)
//     setGeneratedFEN(fen)
//     setFenStatus(validateFenWithChessJS(fen))
//   }, [pieces, squares])

//   // === build fen (replaces your previous generateFEN) ===
//   function buildFenFromPieces(piecesMap, squaresList) {
//     const board = Array(64).fill('.')

//     // place identified pieces
//     for (const [position, piece] of Object.entries(piecesMap)) {
//       const sq = squaresList.find((s) => s.position === position)
//       if (sq) board[sq.index] = piece
//     }

//     // rows a8..h1 to FEN ranks
//     const fenRows = []
//     for (let row = 0; row < 8; row++) {
//       let fenRow = ''
//       let empties = 0
//       for (let col = 0; col < 8; col++) {
//         const p = board[row * 8 + col]
//         if (p === '.') {
//           empties++
//         } else {
//           if (empties) {
//             fenRow += empties
//             empties = 0
//           }
//           fenRow += p
//         }
//       }
//       if (empties) fenRow += empties
//       fenRows.push(fenRow)
//     }

//     const castling = inferCastlingRights(board)
//     // Halfmove/fullmove left simple; you can wire turn and EP square later if needed
//     return `${fenRows.join('/')} w ${castling} - 0 1`
//   }

//   const handlePieceSelect = (position, pieceType, color) => {
//     const piece = color === 'w' ? pieceType.toUpperCase() : pieceType.toLowerCase()
//     setPieces((prev) => ({ ...prev, [position]: piece }))
//   }

//   const handleMarkEmpty = (position) => {
//     setMarkedEmpty(new Set([...markedEmpty, position]))
//     setPieces((prev) => {
//       const n = { ...prev }
//       delete n[position]
//       return n
//     })
//   }

//   const handleComplete = async () => {
//     // optional guard – don’t submit invalid FEN
//     if (!fenStatus.valid) return

//     const piecesArray = Object.entries(pieces).map(([position, piece]) => ({
//       position,
//       piece,
//     }))

//     try {
//       const res = await fetch('http://localhost:3000/api/vision/generate-fen-from-pieces', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ pieces: piecesArray }),
//       })
//       const data = await res.json()
//       onComplete(data)
//     } catch (err) {
//       console.error('Failed to generate FEN:', err)
//     }
//   }

//   const progress = Object.keys(pieces).length
//   const total = piecesSquares.length

//   return (
//     <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
//       <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <div>
//           <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Visual Chess Board Editor</h2>
//           <p style={{ color: '#666' }}>
//             Click on each piece to identify its type ({progress}/{total} identified)
//           </p>
//         </div>
//         <div style={{ display: 'flex', gap: '10px' }}>
//           <button
//             onClick={onCancel}
//             style={{
//               padding: '10px 20px',
//               backgroundColor: '#6b7280',
//               color: 'white',
//               border: 'none',
//               borderRadius: '6px',
//               cursor: 'pointer',
//             }}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleComplete}
//             disabled={!fenStatus.valid || progress === 0}
//             style={{
//               padding: '10px 20px',
//               backgroundColor: !fenStatus.valid || progress === 0 ? '#ccc' : '#10b981',
//               color: 'white',
//               border: 'none',
//               borderRadius: '6px',
//               cursor: !fenStatus.valid || progress === 0 ? 'not-allowed' : 'pointer',
//               fontWeight: '600',
//             }}
//           >
//             ✅ Generate FEN
//           </button>
//         </div>
//       </div>

//       {/* Progress Bar */}
//       <div style={{ marginBottom: '12px' }}>
//         <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
//           <div
//             style={{
//               width: `${(progress / Math.max(1, total)) * 100}%`,
//               height: '100%',
//               backgroundColor: '#10b981',
//               transition: 'width 0.3s',
//             }}
//           />
//         </div>
//       </div>

//       {/* Live FEN status */}
//       {generatedFEN && (
//         <div
//           style={{
//             marginBottom: '16px',
//             padding: '12px',
//             borderRadius: '8px',
//             border: '1px solid',
//             borderColor: fenStatus.valid ? '#16a34a' : '#dc2626',
//             background: fenStatus.valid ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)',
//             color: fenStatus.valid ? '#14532d' : '#7f1d1d',
//           }}
//         >
//           <strong>{fenStatus.valid ? '✅ Valid FEN' : '⛔ Invalid FEN'}</strong>
//           <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginTop: 6, wordBreak: 'break-all' }}>
//             {generatedFEN}
//           </div>
//           {!fenStatus.valid && fenStatus.reason && (
//             <div style={{ marginTop: 4, opacity: 0.85 }}>Reason: {fenStatus.reason}</div>
//           )}
//         </div>
//       )}

//       {/* Heuristic warnings */}
//       {warnings.length > 0 && (
//         <div
//           style={{
//             marginBottom: '16px',
//             padding: '12px',
//             backgroundColor: '#fef3c7',
//             borderRadius: '6px',
//             border: '2px solid #f59e0b',
//           }}
//         >
//           <strong>⚠️ Warnings:</strong>
//           <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
//             {warnings.map((w, i) => (
//               <li key={i}>{w}</li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Grid */}
//       <div
//         style={{
//           display: 'grid',
//           gridTemplateColumns: 'repeat(8, 1fr)',
//           gap: 4,
//           maxWidth: 800,
//           margin: '0 auto',
//         }}
//       >
//         {squares.map((square) => {
//           const isEven = (Math.floor(square.index / 8) + (square.index % 8)) % 2 === 0
//           const bgColor = isEven ? '#f0d9b5' : '#b58863'
//           const isIdentified = pieces[square.position]

//           return (
//             <div
//               key={square.position}
//               style={{
//                 position: 'relative',
//                 aspectRatio: '1',
//                 backgroundColor: bgColor,
//                 border: isIdentified ? '3px solid #10b981' : '1px solid #999',
//                 borderRadius: 4,
//                 overflow: 'hidden',
//                 cursor: square.isEmpty ? 'default' : 'pointer',
//               }}
//               onClick={() => !square.isEmpty && setSelectedSquare(square.position)}
//             >
//               <img
//                 src={`data:image/png;base64,${square.imageData}`}
//                 alt={square.position}
//                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
//               />
//               <div
//                 style={{
//                   position: 'absolute',
//                   top: 2,
//                   left: 2,
//                   fontSize: '0.7rem',
//                   fontWeight: 'bold',
//                   color: isEven ? '#b58863' : '#f0d9b5',
//                   textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
//                 }}
//               >
//                 {square.position}
//               </div>
//               {isIdentified && (
//                 <div
//                   style={{
//                     position: 'absolute',
//                     bottom: 2,
//                     right: 2,
//                     backgroundColor: '#10b981',
//                     color: 'white',
//                     padding: '2px 6px',
//                     borderRadius: 4,
//                     fontSize: '0.8rem',
//                     fontWeight: 'bold',
//                   }}
//                 >
//                   {isIdentified}
//                 </div>
//               )}
//               {!square.isEmpty && !isIdentified && (
//                 <div
//                   style={{
//                     position: 'absolute',
//                     inset: 0,
//                     backgroundColor: 'rgba(0,0,0,0.3)',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                     color: 'white',
//                     fontSize: '0.7rem',
//                     opacity: 0,
//                     transition: 'opacity 0.2s',
//                     pointerEvents: 'none',
//                   }}
//                   className="hover-overlay"
//                 >
//                   Click to identify
//                 </div>
//               )}
//             </div>
//           )
//         })}
//       </div>

//       {/* Modal */}
//       {selectedSquare && (
//         <div
//           style={{
//             position: 'fixed',
//             inset: 0,
//             backgroundColor: 'rgba(0,0,0,0.7)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             zIndex: 1000,
//           }}
//           onClick={() => setSelectedSquare(null)}
//         >
//           <div
//             style={{
//               backgroundColor: 'white',
//               borderRadius: 12,
//               padding: 30,
//               maxWidth: 500,
//               width: '90%',
//             }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <h3 style={{ marginBottom: 20, fontSize: '1.2rem' }}>
//               Identify piece at <strong>{selectedSquare}</strong>
//             </h3>

//             <div style={{ marginBottom: 20, textAlign: 'center' }}>
//               <img
//                 src={`data:image/png;base64,${
//                   squares.find((s) => s.position === selectedSquare)?.imageData
//                 }`}
//                 alt={selectedSquare}
//                 style={{ maxWidth: 150, border: '2px solid #ddd', borderRadius: 8 }}
//               />
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
//               {PIECE_TYPES.map((pieceType) => {
//                 const sq = squares.find((s) => s.position === selectedSquare)
//                 const color = sq?.detectedColor || 'w'
//                 return (
//                   <button
//                     key={pieceType}
//                     onClick={() => {
//                       handlePieceSelect(selectedSquare, pieceType, color)
//                       setSelectedSquare(null)
//                     }}
//                     style={{
//                       padding: 16,
//                       backgroundColor: '#f0f9ff',
//                       border: '2px solid #3b82f6',
//                       borderRadius: 8,
//                       cursor: 'pointer',
//                       fontSize: '1rem',
//                       fontWeight: 600,
//                       transition: 'all 0.2s',
//                     }}
//                     onMouseOver={(e) => {
//                       e.currentTarget.style.backgroundColor = '#dbeafe'
//                       e.currentTarget.style.transform = 'scale(1.05)'
//                     }}
//                     onMouseOut={(e) => {
//                       e.currentTarget.style.backgroundColor = '#f0f9ff'
//                       e.currentTarget.style.transform = 'scale(1)'
//                     }}
//                   >
//                     {PIECE_LABELS[pieceType]}
//                   </button>
//                 )
//               })}
//             </div>

//             <button
//               onClick={() => {
//                 handleMarkEmpty(selectedSquare)
//                 setSelectedSquare(null)
//               }}
//               style={{
//                 marginTop: 20,
//                 width: '100%',
//                 padding: 12,
//                 backgroundColor: '#ef4444',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: 6,
//                 cursor: 'pointer',
//                 fontWeight: 600,
//               }}
//             >
//               ❌ Mark as Empty (False Positive)
//             </button>

//             <button
//               onClick={() => setSelectedSquare(null)}
//               style={{
//                 marginTop: 12,
//                 width: '100%',
//                 padding: 12,
//                 backgroundColor: '#6b7280',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: 6,
//                 cursor: 'pointer',
//               }}
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}

//       <style>{`
//         .hover-overlay:hover { opacity: 1 !important; }
//       `}</style>
//     </div>
//   )
// }

// export default VisualEditor




import { useState, useMemo } from 'react'
import { Chess } from 'chess.js/dist/esm/chess.js' // vite-friendly import

const PALETTE = [
  { k: 'P', label: '♙ Pawn' },
  { k: 'N', label: '♘ Knight' },
  { k: 'B', label: '♗ Bishop' },
  { k: 'R', label: '♖ Rook' },
  { k: 'Q', label: '♕ Queen' },
  { k: 'K', label: '♔ King' },
]

function validateFen(fen) {
  try {
    new Chess(fen)
    return { valid: true }
  } catch (e) {
    return { valid: false, reason: e?.message || 'Invalid FEN' }
  }
}

// Build FEN from a board map + UI state
// function buildFen({ pieces, squares, sideToMove, castling, epSquare }) {
//   const board = Array(64).fill('.')
//   for (const [pos, piece] of Object.entries(pieces)) {
//     const sq = squares.find((s) => s.position === pos)
//     if (sq) board[sq.index] = piece
//   }




//   // ranks a8..h1
//   const rows = []
//   for (let r = 0; r < 8; r++) {
//     let row = ''
//     let empty = 0
//     for (let c = 0; c < 8; c++) {
//       const v = board[r * 8 + c]
//       if (v === '.') empty++
//       else {
//         if (empty) { row += empty; empty = 0 }
//         row += v
//       }
//     }
//     if (empty) row += empty
//     rows.push(row)
//   }

//   // const castlingStr =
//   //   (castling.K ? 'K' : '') +
//   //   (castling.Q ? 'Q' : '') +
//   //   (castling.k ? 'k' : '') +
//   //   (castling.q ? 'q' : '')
//   // const cs = castlingStr.length ? castlingStr : '-'

//   // Auto-infer if user didn’t toggle checkboxes
//   let cs = (castling && Object.values(castling).some(Boolean))
//   ? ((castling.K ? 'K' : '') + (castling.Q ? 'Q' : '') + (castling.k ? 'k' : '') + (castling.q ? 'q' : ''))
//   : inferCastlingRights(board);

//   const ep = epSquare || '-'
//   return `${rows.join('/')} ${sideToMove} ${cs} ${ep} 0 1`
// }


// Build FEN from a board map + UI state (auto-castling)
function buildFen({ pieces, squares, sideToMove, castling, epSquare }) {
  // 1) Build a8..h1 board array (64 entries of '.' or piece letter)
  const board = Array(64).fill('.');
  for (const [pos, piece] of Object.entries(pieces)) {
    const sq = squares.find((s) => s.position === pos);
    if (sq) board[sq.index] = piece;
  }

  // 2) Make ranks a8..h1
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let row = '';
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const v = board[r * 8 + c];
      if (v === '.') empty++;
      else {
        if (empty) { row += empty; empty = 0; }
        row += v;
      }
    }
    if (empty) row += empty;
    rows.push(row);
  }

  // 3) Castling: sanitize user choice OR infer if nothing ticked
  const cs = sanitizeOrInferCastling(board, castling);

  // 4) En-passant square: keep simple (blank → '-')
  const ep = (epSquare && /^[a-h][36]$/.test(epSquare)) ? epSquare : '-';

  // 5) Assemble FEN
  return `${rows.join('/')} ${sideToMove} ${cs} ${ep} 0 1`;
}

/* ===== Helpers (paste these just below buildFen) ===== */

// If user toggled any castling flags, keep only those that are legal on the board.
// If nothing is toggled, infer all legal flags.
function sanitizeOrInferCastling(board64, castlingFlags) {
  const legal = inferCastlingRights(board64); // e.g. "KQ", "K", "-", etc.

  // If no checkboxes ticked, use full legal
  const anyTicked = castlingFlags && Object.values(castlingFlags).some(Boolean);
  if (!anyTicked) return legal;

  // Otherwise intersect (drop impossible flags)
  const chosen = [
    castlingFlags.K ? 'K' : '',
    castlingFlags.Q ? 'Q' : '',
    castlingFlags.k ? 'k' : '',
    castlingFlags.q ? 'q' : '',
  ].join('');

  if (legal === '-') return '-';
  const filtered = chosen.split('').filter(ch => legal.includes(ch)).join('');
  return filtered.length ? filtered : '-';
}

// Legal by placement only (what FEN validators like chess.js/chess.com require)
// Requires kings on e1/e8 and rooks on a1/h1/a8/h8.
function inferCastlingRights(board64 /* a8..h1 */) {
  const at = (file, rank) => board64[rank * 8 + file]; // file 0=a..7=h, rank 0=8th..7=1st
  const rights = [];

  // White
  const wk  = at(4, 7) === 'K'; // e1
  const wra = at(0, 7) === 'R'; // a1
  const wrh = at(7, 7) === 'R'; // h1
  if (wk && wrh) rights.push('K');
  if (wk && wra) rights.push('Q');

  // Black
  const bk  = at(4, 0) === 'k'; // e8
  const bra = at(0, 0) === 'r'; // a8
  const brh = at(7, 0) === 'r'; // h8
  if (bk && brh) rights.push('k');
  if (bk && bra) rights.push('q');

  return rights.length ? rights.join('') : '-';
}



// function inferCastlingRights(board64 /* length 64, a8..h1 with '.' or piece */) {
//   const at = (file, rank) => board64[rank * 8 + file]; // file 0=a..7=h, rank 0=8th..7=1st
//   const rights = [];

//   // White
//   const wk = at(4, 7) === 'K';     // e1
//   const wra = at(0, 7) === 'R';    // a1
//   const wrh = at(7, 7) === 'R';    // h1
//   if (wk && wrh) rights.push('K');
//   if (wk && wra) rights.push('Q');

//   // Black
//   const bk = at(4, 0) === 'k';     // e8
//   const bra = at(0, 0) === 'r';    // a8
//   const brh = at(7, 0) === 'r';    // h8
//   if (bk && brh) rights.push('k');
//   if (bk && bra) rights.push('q');

//   return rights.length ? rights.join('') : '-';
// }

// Fill standard chess starting position
function makeStartingPieces() {
  const p = {}
  // White
  'abcdefgh'.split('').forEach((f, i) => {
    p[`${f}2`] = 'P'
  })
  p['a1'] = 'R'; p['h1'] = 'R'
  p['b1'] = 'N'; p['g1'] = 'N'
  p['c1'] = 'B'; p['f1'] = 'B'
  p['d1'] = 'Q'; p['e1'] = 'K'
  // Black
  'abcdefgh'.split('').forEach((f, i) => {
    p[`${f}7`] = 'p'
  })
  p['a8'] = 'r'; p['h8'] = 'r'
  p['b8'] = 'n'; p['g8'] = 'n'
  p['c8'] = 'b'; p['f8'] = 'b'
  p['d8'] = 'q'; p['e8'] = 'k'
  return p
}

export default function VisualEditor({ squares, onComplete, onCancel }) {
  // pieces: { "e4": "K" | "p" ... }
  const [pieces, setPieces] = useState({})
  const [selected, setSelected] = useState({ type: 'P', color: 'w' }) // palette choice
  const [removeMode, setRemoveMode] = useState(false)
  const [sideToMove, setSideToMove] = useState('w')
  const [castling, setCastling] = useState({ K: false, Q: false, k: false, q: false })
  const [epSquare, setEpSquare] = useState('') // optional manual EP (like "e3"), leave blank for '-'

  const fen = useMemo(
    () => buildFen({ pieces, squares, sideToMove, castling, epSquare }),
    [pieces, squares, sideToMove, castling, epSquare]
  )
  const fenStatus = useMemo(() => validateFen(fen), [fen])

  // convenience: count of identifiable tiles (non-empty thumbnails)
  const totalCandidates = squares.filter((s) => !s.isEmpty).length
  const progress = Object.keys(pieces).length

  function placeOrRemove(position, isRightClick = false) {
    setPieces((prev) => {
      const next = { ...prev }
      if (removeMode || isRightClick) {
        delete next[position]
      } else {
        const piece = selected.color === 'w' ? selected.type : selected.type.toLowerCase()
        next[position] = piece
      }
      return next
    })
  }

  function onSquareClick(position) {
    placeOrRemove(position, false)
  }
  function onSquareRightClick(e, position) {
    e.preventDefault()
    placeOrRemove(position, true)
  }

  function clearBoard() {
    setPieces({})
    setCastling({ K: false, Q: false, k: false, q: false })
    setEpSquare('')
  }
  function fillStart() {
    const start = makeStartingPieces()
    setPieces(start)
    setSideToMove('w')
    setCastling({ K: true, Q: true, k: true, q: true })
    setEpSquare('')
  }

  async function handleComplete() {
    if (!fenStatus.valid) return
    const piecesArray = Object.entries(pieces).map(([position, piece]) => ({ position, piece }))

    try {
      const res = await fetch('http://localhost:3000/api/vision/generate-fen-from-pieces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pieces: piecesArray }),
      })
      const data = await res.json()
      onComplete(data)
    } catch (e) {
      console.error('Failed to generate FEN:', e)
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Visual Chess Board Editor</h2>
          <div style={{ color: '#666' }}>Identified: {progress}/{totalCandidates}</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={btn({ bg: '#6b7280' })}>Cancel</button>
          <button onClick={handleComplete} disabled={!fenStatus.valid} style={btn({
            bg: fenStatus.valid ? '#10b981' : '#ccc',
            cursor: fenStatus.valid ? 'pointer' : 'not-allowed'
          })}>
            ✅ Generate FEN
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={toolbar()}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={fillStart} style={btn({ bg: '#3b82f6' })}>Fill Starting Position</button>
          <button onClick={clearBoard} style={btn({ bg: '#ef4444' })}>Clear Board</button>

          <label style={chip()}>
            <input
              type="checkbox"
              checked={removeMode}
              onChange={(e) => setRemoveMode(e.target.checked)}
              style={{ marginRight: 6 }}
            />
            Remove mode (or right-click)
          </label>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Side to move:</label>
            <select value={sideToMove} onChange={(e) => setSideToMove(e.target.value)}>
              <option value="w">White</option>
              <option value="b">Black</option>
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Castling:</label>
            {['K','Q','k','q'].map((k) => (
              <label key={k} style={{ marginRight: 10 }}>
                <input
                  type="checkbox"
                  checked={!!castling[k]}
                  onChange={(e) => setCastling({ ...castling, [k]: e.target.checked })}
                  style={{ marginRight: 4 }}
                />
                {k}
              </label>
            ))}
          </div>

          <div>
            <label style={{ fontWeight: 600, marginRight: 8 }}>EP square:</label>
            <input
              placeholder="e3 or leave blank"
              value={epSquare}
              onChange={(e) => setEpSquare(e.target.value.trim())}
              style={{ width: 100 }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 600, marginRight: 8 }}>Place as:</label>
            <label style={{ marginRight: 10 }}>
              <input
                type="radio"
                name="place-color"
                checked={selected.color === 'w'}
                onChange={() => setSelected({ ...selected, color: 'w' })}
                style={{ marginRight: 4 }}
              />
              White
            </label>
            <label>
              <input
                type="radio"
                name="place-color"
                checked={selected.color === 'b'}
                onChange={() => setSelected({ ...selected, color: 'b' })}
                style={{ marginRight: 4 }}
              />
              Black
            </label>
          </div>
        </div>
      </div>

      {/* Live FEN status */}
      <div style={{
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
        border: `1px solid ${fenStatus.valid ? '#16a34a' : '#dc2626'}`,
        background: fenStatus.valid ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)',
        color: fenStatus.valid ? '#14532d' : '#7f1d1d'
      }}>
        <strong>{fenStatus.valid ? '✅ Valid FEN' : '⛔ Invalid FEN'}</strong>
        <div style={{ fontFamily: 'monospace', marginTop: 6, wordBreak: 'break-word' }}>{fen}</div>
        {!fenStatus.valid && fenStatus.reason && (
          <div style={{ marginTop: 4, opacity: 0.85 }}>Reason: {fenStatus.reason}</div>
        )}
      </div>

      {/* Palette */}
      <div style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <span style={{ fontWeight: 600, marginRight: 8 }}>Pieces:</span>
        {PALETTE.map((p) => {
          const active = selected.type === p.k
          return (
            <button
              key={p.k}
              onClick={() => setSelected({ ...selected, type: p.k })}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: `2px solid ${active ? '#3b82f6' : '#cbd5e1'}`,
                background: active ? '#dbeafe' : '#f8fafc',
                cursor: 'pointer'
              }}
              title={p.label}
            >
              {p.k}
            </button>
          )
        })}
      </div>

      {/* Board grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 4,
          maxWidth: 800,
          margin: '0 auto',
          userSelect: 'none'
        }}
      >
        {squares.map((square) => {
          const isEven = (Math.floor(square.index / 8) + (square.index % 8)) % 2 === 0
          const bgColor = isEven ? '#f0d9b5' : '#b58863'
          const pieceHere = pieces[square.position]

          return (
            <div
              key={square.position}
              onClick={() => onSquareClick(square.position)}
              onContextMenu={(e) => onSquareRightClick(e, square.position)}
              title={`${square.position}${pieceHere ? `: ${pieceHere}` : ''}`}
              style={{
                position: 'relative',
                aspectRatio: '1',
                backgroundColor: bgColor,
                border: pieceHere ? '3px solid #10b981' : '1px solid #999',
                borderRadius: 4,
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >
              <img
                src={`data:image/png;base64,${square.imageData}`}
                alt={square.position}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                draggable={false}
              />
              <div style={{
                position: 'absolute',
                top: 2,
                left: 2,
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: isEven ? '#b58863' : '#f0d9b5',
                textShadow: '1px 1px 2px rgba(0,0,0,.5)'
              }}>
                {square.position}
              </div>
              {pieceHere && (
                <div style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {pieceHere}
                </div>
              )}
              {removeMode && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(239,68,68,.18)'
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* tiny style helpers */
function btn({ bg = '#3b82f6', cursor = 'pointer' } = {}) {
  return {
    padding: '10px 14px',
    backgroundColor: bg,
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor,
    fontWeight: 600,
  }
}
function toolbar() {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 12,
    marginBottom: 12,
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    background: '#fafafa',
  }
}
function chip() {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    borderRadius: 999,
    border: '1px solid #d1d5db',
    background: 'white',
    fontWeight: 600,
  }
}
