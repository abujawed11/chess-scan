

// scan-web/src/App.jsx
import { useState } from 'react'
import Home from './components/pages/Home'
import GamePlay from './components/pages/GamePlay'
import GameReview from './components/pages/GameReview'
import VisualEditor from './VisualEditor'
import GridAdjuster from './GridAdjuster'     // shows/edits grid lines, returns 64 crops
import BoardEditor from './BoardEditor'       // full final editor (flip, rotate, castling, etc.)
import ErrorBoundary from './components/common/ErrorBoundary'
import { API_ENDPOINTS } from './utils/constants'

function App() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // flow control: 'home' | 'scan' | 'adjust' | 'editor' | 'board' | 'play' | 'analyze'
  const [mode, setMode] = useState('home')

  // extracted squares and grid adjuster state
  const [extractedSquares, setExtractedSquares] = useState(null)
  const [warpedBoard, setWarpedBoard] = useState(null) // base64 PNG from backend
  const [originalImageDataUrl, setOriginalImageDataUrl] = useState(null)
  const [gridSegments, setGridSegments] = useState({ h: null, v: null })

  // final board fen to send into BoardEditor
  const [boardFen, setBoardFen] = useState(null)

  // game fen for GamePlay component
  const [gameFen, setGameFen] = useState(null)

  // Handle mode selection from Home page
  const handleModeSelect = (selectedMode, options = {}) => {
    switch (selectedMode) {
      case 'play':
        // Start a new game or load from FEN
        if (options.fen) {
          setGameFen(options.fen)
        } else {
          setGameFen(null) // Fresh game
        }
        setMode('play')
        break
      case 'analyze':
        // Start analysis mode
        setGameFen(null)
        setMode('play') // GamePlay component handles analyze mode
        break
      case 'scan':
        // Enter scan mode
        setMode('scan')
        break
      case 'review':
        // Enter PGN review mode
        setMode('review')
        break
      default:
        setMode('home')
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    setPreview(URL.createObjectURL(file))
    setError(null)
    setResult(null)
    setExtractedSquares(null)

    // also store base64 for GridAdjuster (fallback/preview)
    const reader = new FileReader()
    reader.onload = (ev) => setOriginalImageDataUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleExtractSquares = async () => {
    if (!selectedImage) return
    setLoading(true); setError(null)

    const form = new FormData()
    form.append('image', selectedImage)

    try {
      // detect + warp + send guides so user can verify/adjust
      const res = await fetch(API_ENDPOINTS.EXTRACT_GRID, {
        method: 'POST',
        body: form,
      })
      const data = await res.json()

      if (!res.ok || !data?.boardDetected) {
        setError(data?.message || 'Could not detect a chessboard in this image.')
        return
      }

      setWarpedBoard(data.warpedBoard) // base64 PNG (no header or with data:, either is fine for <img>)
      setGridSegments({ h: data.hSegments, v: data.vSegments })
      setMode('adjust')
    } catch (err) {
      setError(err.message || 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }

  // called after GridAdjuster finishes cropping 64 tiles
  const handleAdjustDone = (squares) => {
    const ok = Array.isArray(squares) && squares.length === 64 && squares.every(s => s?.imageData)
    if (!ok) {
      setError('Adjusted extraction returned invalid squares. Please re-align the guides closer to the inner grid.')
      setMode('scan')
      return
    }
    setExtractedSquares(squares)
    setError(null)
    setMode('editor')
  }

  // called when VisualEditor posts to backend and gets back { fen, confidence, ... }
  const handleEditorComplete = (fenData) => {
    // take user to BoardEditor for final polishing
    setBoardFen(fenData?.fen || '')
    setMode('board')
  }

  const handleBoardDone = (finalData) => {
    // Check if user clicked Play button
    if (finalData.action === 'play') {
      setGameFen(finalData.fen)
      setMode('play')
    } else {
      // Regular save - go back to scan view with result
      setResult({ fen: finalData.fen, confidence: 1 })
      setMode('scan')
    }
  }

  // ---------- Screens ----------

  // Home page
  if (mode === 'home') {
    return <Home onModeSelect={handleModeSelect} />
  }

  // Play/Analyze mode
  if (mode === 'play') {
    return (
      <ErrorBoundary
        errorType="Chess Engine Error"
        onReset={() => {
          setMode('home')
          setGameFen(null)
        }}
      >
        <GamePlay
          initialFen={gameFen}
          onBack={() => {
            setMode('home')
            setGameFen(null)
          }}
        />
      </ErrorBoundary>
    )
  }

  // PGN Review mode
  if (mode === 'review') {
    return (
      <ErrorBoundary
        errorType="PGN Review Error"
        onReset={() => setMode('home')}
      >
        <GameReview
          onBack={() => setMode('home')}
        />
      </ErrorBoundary>
    )
  }

  // Scan flow screens
  if (mode === 'adjust' && (warpedBoard || originalImageDataUrl)) {
    return (
      <ErrorBoundary onReset={() => setMode('scan')}>
        <GridAdjuster
          warpedBoard={warpedBoard}
          originalImage={originalImageDataUrl}
          initH={gridSegments.h}
          initV={gridSegments.v}
          onCancel={() => setMode('scan')}
          onDone={handleAdjustDone}
        />
      </ErrorBoundary>
    )
  }

  if (mode === 'editor' && extractedSquares) {
    return (
      <ErrorBoundary onReset={() => setMode('scan')}>
        <VisualEditor
          squares={extractedSquares}
          onComplete={handleEditorComplete}
          onCancel={() => setMode('scan')}
        />
      </ErrorBoundary>
    )
  }

  if (mode === 'board' && boardFen) {
    return (
      <ErrorBoundary onReset={() => setMode('scan')}>
        <BoardEditor
          initialFen={boardFen}
          onCancel={() => setMode('scan')}
          onDone={handleBoardDone}
        />
      </ErrorBoundary>
    )
  }

  // ---------- Scan Mode ----------
  return (
    <div style={{ padding: '40px', maxWidth: 820, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>♟️ Chess Position Scanner</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setMode('home')}
            style={{
              padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6,
              background: '#fff', cursor: 'pointer', fontWeight: 500
            }}
          >
            ← Back to Home
          </button>
          <button
            onClick={() => result && navigator.clipboard.writeText(result.fen)}
            disabled={!result}
            style={{
              padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6,
              background: '#fff', cursor: result ? 'pointer' : 'not-allowed'
            }}
          >
            Copy FEN
          </button>
        </div>
      </div>

      {/* uploader */}
      <div style={{
        border: '2px dashed #ccc', borderRadius: 8, padding: 24, textAlign: 'center',
        marginBottom: 16, background: '#f9f9f9'
      }}>
        <input id="file-input" type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
        <label htmlFor="file-input" style={{
          cursor: 'pointer', padding: '10px 18px', background: '#3b82f6',
          color: '#fff', borderRadius: 6, fontWeight: 600
        }}>
          📁 Choose Image
        </label>
        <div style={{ marginTop: 8, color: '#666', fontSize: '.9rem' }}>Or drag & drop an image</div>
      </div>

      {preview && (
        <>
          <img
            src={preview}
            alt="preview"
            style={{ maxWidth: '100%', maxHeight: 380, border: '1px solid #ddd', borderRadius: 8, marginBottom: 10 }}
          />
          <button
            onClick={handleExtractSquares}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#bbb' : '#3b82f6',
              color: '#fff', border: 'none', borderRadius: 6,
              fontWeight: 700, fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Detecting board…' : '🎯 Start → Adjust Grid & Extract'}
          </button>
          <p style={{ fontSize: '.9rem', color: '#666', marginTop: 8 }}>
            Auto-detects the board, then lets you fine-tune the grid alignment before labeling pieces.
          </p>
        </>
      )}

      {error && (
        <div style={{ padding: 12, background: '#fee', border: '1px solid #fcc', borderRadius: 6, marginTop: 12 }}>
          <strong>❌ Error:</strong> {error}
          <div style={{ marginTop: 6, fontSize: '0.9rem', color: '#666' }}>
            Tips: ensure the board fills most of the image and is well lit.
          </div>
        </div>
      )}

      {result && (
        <div style={{ padding: 14, background: '#f0f9ff', border: '1px solid #3b82f6', borderRadius: 8, marginTop: 16 }}>
          <div style={{ marginBottom: 6 }}><strong>✅ FEN:</strong></div>
          <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{result.fen}</div>
          {'confidence' in result && (
            <div style={{ marginTop: 6 }}><strong>Confidence:</strong> {(result.confidence * 100).toFixed(0)}%</div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
