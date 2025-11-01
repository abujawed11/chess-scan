import { useState, useEffect } from 'react'

const PIECE_TYPES = ['P', 'N', 'B', 'R', 'Q', 'K']
const PIECE_LABELS = {
  'P': '♟ Pawn',
  'N': '♞ Knight',
  'B': '♝ Bishop',
  'R': '♜ Rook',
  'Q': '♛ Queen',
  'K': '♚ King'
}

function validateFEN(pieces) {
  const warnings = []
  const pieceCounts = {}

  // Count each piece type
  Object.values(pieces).forEach(piece => {
    pieceCounts[piece] = (pieceCounts[piece] || 0) + 1
  })

  // Check for multiple kings
  if ((pieceCounts['K'] || 0) > 1) warnings.push('⚠️ Multiple white kings detected')
  if ((pieceCounts['k'] || 0) > 1) warnings.push('⚠️ Multiple black kings detected')

  // Check for missing kings (if pieces identified)
  if (Object.keys(pieces).length > 5) {
    if (!pieceCounts['K']) warnings.push('⚠️ No white king found')
    if (!pieceCounts['k']) warnings.push('⚠️ No black king found')
  }

  return warnings
}

function VisualEditor({ squares, onComplete, onCancel }) {
  const [pieces, setPieces] = useState({})
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [generatedFEN, setGeneratedFEN] = useState('')
  const [markedEmpty, setMarkedEmpty] = useState(new Set())

  // Filter only non-empty squares for manual identification
  const piecesSquares = squares.filter(sq => !sq.isEmpty && !markedEmpty.has(sq.position))
  const warnings = validateFEN(pieces)

  useEffect(() => {
    // Generate FEN whenever pieces change
    generateFEN()
  }, [pieces])

  const generateFEN = () => {
    const board = Array(64).fill('.')

    // Place identified pieces
    Object.entries(pieces).forEach(([position, piece]) => {
      const square = squares.find(s => s.position === position)
      if (square) {
        board[square.index] = piece
      }
    })

    // Convert to FEN
    const fenRows = []
    for (let row = 0; row < 8; row++) {
      let fenRow = ''
      let emptyCount = 0

      for (let col = 0; col < 8; col++) {
        const idx = row * 8 + col
        const piece = board[idx]

        if (piece === '.') {
          emptyCount++
        } else {
          if (emptyCount > 0) {
            fenRow += emptyCount
            emptyCount = 0
          }
          fenRow += piece
        }
      }

      if (emptyCount > 0) {
        fenRow += emptyCount
      }

      fenRows.push(fenRow)
    }

    const fen = fenRows.join('/') + ' w KQkq - 0 1'
    setGeneratedFEN(fen)
  }

  const handlePieceSelect = (position, pieceType, color) => {
    const piece = color === 'w' ? pieceType.toUpperCase() : pieceType.toLowerCase()
    setPieces({
      ...pieces,
      [position]: piece
    })
  }

  const handleMarkEmpty = (position) => {
    setMarkedEmpty(new Set([...markedEmpty, position]))
    // Remove from pieces if it was there
    const newPieces = { ...pieces }
    delete newPieces[position]
    setPieces(newPieces)
  }

  const handleComplete = async () => {
    // Send to backend for final FEN generation
    const piecesArray = Object.entries(pieces).map(([position, piece]) => ({
      position,
      piece
    }))

    try {
      const response = await fetch('http://localhost:3000/api/vision/generate-fen-from-pieces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pieces: piecesArray })
      })

      const data = await response.json()
      onComplete(data)
    } catch (err) {
      console.error('Failed to generate FEN:', err)
    }
  }

  const progress = Object.keys(pieces).length
  const total = piecesSquares.length

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Visual Chess Board Editor</h2>
          <p style={{ color: '#666' }}>
            Click on each piece to identify its type ({progress}/{total} identified)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={progress === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: progress === 0 ? '#ccc' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: progress === 0 ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            ✅ Generate FEN
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width: `${(progress / total) * 100}%`,
            height: '100%',
            backgroundColor: '#10b981',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', border: '2px solid #f59e0b' }}>
          <strong>⚠️ Warnings:</strong>
          <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* FEN Preview */}
      {generatedFEN && (
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #3b82f6' }}>
          <strong>Live FEN Preview:</strong>
          <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '8px', wordBreak: 'break-all' }}>
            {generatedFEN}
          </div>
        </div>
      )}

      {/* Chess Board Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '4px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {squares.map((square) => {
          const isEven = (Math.floor(square.index / 8) + (square.index % 8)) % 2 === 0
          const bgColor = isEven ? '#f0d9b5' : '#b58863'
          const isIdentified = pieces[square.position]

          return (
            <div
              key={square.position}
              style={{
                position: 'relative',
                aspectRatio: '1',
                backgroundColor: bgColor,
                border: isIdentified ? '3px solid #10b981' : '1px solid #999',
                borderRadius: '4px',
                overflow: 'hidden',
                cursor: square.isEmpty ? 'default' : 'pointer'
              }}
              onClick={() => !square.isEmpty && setSelectedSquare(square.position)}
            >
              {/* Square Image */}
              <img
                src={`data:image/png;base64,${square.imageData}`}
                alt={square.position}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Position Label */}
              <div style={{
                position: 'absolute',
                top: '2px',
                left: '2px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: isEven ? '#b58863' : '#f0d9b5',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>
                {square.position}
              </div>

              {/* Identified Piece Badge */}
              {isIdentified && (
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {isIdentified}
                </div>
              )}

              {/* Click to Identify Overlay */}
              {!square.isEmpty && !isIdentified && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.7rem',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  pointerEvents: 'none'
                }}
                className="hover-overlay"
              >
                Click to identify
              </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Piece Selection Modal */}
      {selectedSquare && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedSquare(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>
              Identify piece at <strong>{selectedSquare}</strong>
            </h3>

            {/* Show the square image */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <img
                src={`data:image/png;base64,${squares.find(s => s.position === selectedSquare)?.imageData}`}
                alt={selectedSquare}
                style={{ maxWidth: '150px', border: '2px solid #ddd', borderRadius: '8px' }}
              />
            </div>

            {/* Piece Type Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {PIECE_TYPES.map((pieceType) => {
                const square = squares.find(s => s.position === selectedSquare)
                const color = square?.detectedColor || 'w'

                return (
                  <button
                    key={pieceType}
                    onClick={() => {
                      handlePieceSelect(selectedSquare, pieceType, color)
                      setSelectedSquare(null)
                    }}
                    style={{
                      padding: '16px',
                      backgroundColor: '#f0f9ff',
                      border: '2px solid #3b82f6',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#dbeafe'
                      e.target.style.transform = 'scale(1.05)'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#f0f9ff'
                      e.target.style.transform = 'scale(1)'
                    }}
                  >
                    {PIECE_LABELS[pieceType]}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => {
                handleMarkEmpty(selectedSquare)
                setSelectedSquare(null)
              }}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              ❌ Mark as Empty (False Positive)
            </button>

            <button
              onClick={() => setSelectedSquare(null)}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        .hover-overlay:hover {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}

export default VisualEditor
