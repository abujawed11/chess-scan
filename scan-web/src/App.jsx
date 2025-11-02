// import { useState } from 'react'
// import VisualEditor from './VisualEditor'

// function App() {
//   const [selectedImage, setSelectedImage] = useState(null)
//   const [preview, setPreview] = useState(null)
//   const [result, setResult] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)
//   const [rotation, setRotation] = useState('auto')  // 'auto', '0', '90', '180', '270'
//   const [isStartingPosition, setIsStartingPosition] = useState(false)
//   const [extractedSquares, setExtractedSquares] = useState(null)
//   const [showVisualEditor, setShowVisualEditor] = useState(false)

//   const handleImageSelect = (event) => {
//     const file = event.target.files[0]
//     if (file) {
//       setSelectedImage(file)
//       setPreview(URL.createObjectURL(file))
//       setResult(null)
//       setError(null)
//     }
//   }

//   const handleExtractSquares = async () => {
//     if (!selectedImage) return

//     setLoading(true)
//     setError(null)

//     const formData = new FormData()
//     formData.append('image', selectedImage)

//     try {
//       const response = await fetch('http://localhost:3000/api/vision/extract-squares', {
//         method: 'POST',
//         body: formData,
//       })

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`)
//       }

//       const data = await response.json()

//       if (!data.boardDetected) {
//         setError(data.message)
//         return
//       }

//       setExtractedSquares(data.squares)
//       setShowVisualEditor(true)
//     } catch (err) {
//       setError(err.message)
//       console.error('Extract error:', err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleEditorComplete = (fenData) => {
//     setResult(fenData)
//     setShowVisualEditor(false)
//   }

//   const handleEditorCancel = () => {
//     setShowVisualEditor(false)
//   }

//   // Show visual editor if squares are extracted
//   if (showVisualEditor && extractedSquares) {
//     return (
//       <VisualEditor
//         squares={extractedSquares}
//         onComplete={handleEditorComplete}
//         onCancel={handleEditorCancel}
//       />
//     )
//   }

//   return (
//     <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
//       <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
//         ♟️ Chess Position Scanner
//       </h1>
//       <p style={{ color: '#666', marginBottom: '30px' }}>
//         Upload a chess board image and identify pieces visually
//       </p>

//       {/* Upload Section */}
//       <div style={{
//         border: '2px dashed #ccc',
//         borderRadius: '8px',
//         padding: '40px',
//         textAlign: 'center',
//         marginBottom: '30px',
//         backgroundColor: '#f9f9f9'
//       }}>
//         <input
//           type="file"
//           accept="image/*"
//           onChange={handleImageSelect}
//           style={{ display: 'none' }}
//           id="file-input"
//         />
//         <label
//           htmlFor="file-input"
//           style={{
//             cursor: 'pointer',
//             padding: '12px 24px',
//             backgroundColor: '#3b82f6',
//             color: 'white',
//             borderRadius: '6px',
//             display: 'inline-block',
//             fontWeight: '600'
//           }}
//         >
//           📁 Choose Image
//         </label>
//         <p style={{ marginTop: '12px', color: '#666', fontSize: '0.9rem' }}>
//           Or drag and drop a chess board image
//         </p>
//       </div>

//       {/* Settings Panel */}
//       {preview && (
//         <>
//           {/* Starting Position Calibration */}
//           <div style={{
//             marginBottom: '20px',
//             padding: '16px',
//             backgroundColor: '#fef3c7',
//             borderRadius: '8px',
//             border: '2px solid #f59e0b'
//           }}>
//             <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
//               <input
//                 type="checkbox"
//                 checked={isStartingPosition}
//                 onChange={(e) => setIsStartingPosition(e.target.checked)}
//                 style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
//               />
//               <div>
//                 <strong style={{ fontSize: '1rem' }}>📚 This is a starting position</strong>
//                 <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px', marginBottom: 0 }}>
//                   Check this box if uploading a starting position to calibrate piece templates (recommended for first use)
//                 </p>
//               </div>
//             </label>
//           </div>

//           {/* Board Orientation Selector */}
//           <div style={{
//             marginBottom: '30px',
//             padding: '20px',
//             backgroundColor: '#f0f9ff',
//             borderRadius: '8px',
//             border: '1px solid #3b82f6'
//           }}>
//             <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', fontWeight: '600' }}>
//               🧭 Board Orientation
//             </h3>
//             <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '12px' }}>
//               Specify which corner is square a1 (bottom-left from white's perspective):
//             </p>
//             <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
//               <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
//                 <input
//                   type="radio"
//                   value="auto"
//                   checked={rotation === 'auto'}
//                   onChange={(e) => setRotation(e.target.value)}
//                   style={{ marginRight: '6px' }}
//                 />
//                 <span>🔄 Auto-detect</span>
//               </label>
//               <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
//                 <input
//                   type="radio"
//                   value="0"
//                   checked={rotation === '0'}
//                   onChange={(e) => setRotation(e.target.value)}
//                   style={{ marginRight: '6px' }}
//                 />
//                 <span>⬇️ Bottom-left (0°)</span>
//               </label>
//               <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
//                 <input
//                   type="radio"
//                   value="90"
//                   checked={rotation === '90'}
//                   onChange={(e) => setRotation(e.target.value)}
//                   style={{ marginRight: '6px' }}
//                 />
//                 <span>⬅️ Bottom-right (90°)</span>
//               </label>
//               <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
//                 <input
//                   type="radio"
//                   value="180"
//                   checked={rotation === '180'}
//                   onChange={(e) => setRotation(e.target.value)}
//                   style={{ marginRight: '6px' }}
//                 />
//                 <span>⬆️ Top-right (180°)</span>
//               </label>
//               <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
//                 <input
//                   type="radio"
//                   value="270"
//                   checked={rotation === '270'}
//                   onChange={(e) => setRotation(e.target.value)}
//                   style={{ marginRight: '6px' }}
//                 />
//                 <span>➡️ Top-left (270°)</span>
//               </label>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Preview Section */}
//       {preview && (
//         <div style={{ marginBottom: '30px' }}>
//           <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Preview:</h3>
//           <img
//             src={preview}
//             alt="Preview"
//             style={{
//               maxWidth: '100%',
//               maxHeight: '400px',
//               border: '2px solid #ccc',
//               borderRadius: '8px'
//             }}
//           />
//           <button
//             onClick={handleExtractSquares}
//             disabled={loading}
//             style={{
//               marginTop: '16px',
//               padding: '12px 32px',
//               backgroundColor: loading ? '#ccc' : '#3b82f6',
//               color: 'white',
//               border: 'none',
//               borderRadius: '6px',
//               fontSize: '1rem',
//               fontWeight: '600',
//               cursor: loading ? 'not-allowed' : 'pointer'
//             }}
//           >
//             {loading ? '🔄 Extracting...' : '🎨 Open Visual Editor'}
//           </button>
//         </div>
//       )}

//       {/* Error Section */}
//       {error && (
//         <div style={{
//           padding: '16px',
//           backgroundColor: '#fee',
//           border: '1px solid #fcc',
//           borderRadius: '6px',
//           marginBottom: '20px'
//         }}>
//           <strong>❌ Error:</strong> {error}
//         </div>
//       )}

//       {/* Result Section */}
//       {result && (
//         <div style={{
//           padding: '20px',
//           backgroundColor: '#f0f9ff',
//           border: '2px solid #3b82f6',
//           borderRadius: '8px'
//         }}>
//           <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>
//             ✅ Position Detected!
//           </h3>
//           <div style={{ marginBottom: '12px' }}>
//             <strong>FEN:</strong>
//             <div style={{
//               padding: '12px',
//               backgroundColor: 'white',
//               borderRadius: '4px',
//               fontFamily: 'monospace',
//               fontSize: '0.9rem',
//               marginTop: '8px',
//               wordBreak: 'break-all'
//             }}>
//               {result.fen}
//             </div>
//           </div>
//           <div>
//             <strong>Confidence:</strong> {(result.confidence * 100).toFixed(0)}%
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default App




// scan-web/src/App.jsx
// import { useState } from 'react'
// import VisualEditor from './VisualEditor'
// import GridAdjuster from './GridAdjuster'   // ⬅️ add this import

// function App() {
//   const [selectedImage, setSelectedImage] = useState(null)
//   const [preview, setPreview] = useState(null)         // object URL for the image
//   const [result, setResult] = useState(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState(null)
//   const [rotation, setRotation] = useState('auto')
//   const [isStartingPosition, setIsStartingPosition] = useState(false)

//   const [extractedSquares, setExtractedSquares] = useState(null)
//   const [mode, setMode] = useState('home')             // 'home' | 'editor' | 'adjust'

//   // For manual grid adjuster
//   const [warpedBoard, setWarpedBoard] = useState(null)  // base64 PNG from /extract-grid
//   const [originalImageDataUrl, setOriginalImageDataUrl] = useState(null) // base64 original image
//   const [gridSegments, setGridSegments] = useState({ h: null, v: null })

//   const handleImageSelect = (event) => {
//     const file = event.target.files[0]
//     if (!file) return
//     const url = URL.createObjectURL(file)
//     setSelectedImage(file)
//     setPreview(url)
//     setResult(null)
//     setError(null)
//     setExtractedSquares(null)
//     setMode('home')

//     // Convert to base64 data URL for GridAdjuster fallback
//     const reader = new FileReader()
//     reader.onload = (e) => {
//       setOriginalImageDataUrl(e.target.result) // e.g., "data:image/jpeg;base64,..."
//     }
//     reader.readAsDataURL(file)
//   }

//   const handleExtractSquares = async () => {
//     if (!selectedImage) return
//     setLoading(true)
//     setError(null)

//     const formData = new FormData()
//     formData.append('image', selectedImage)

//     try {
//       // Always use /extract-grid so user can verify/adjust alignment
//       const response = await fetch('http://localhost:3000/api/vision/extract-grid', {
//         method: 'POST',
//         body: formData,
//       })
//       const data = await response.json()

//       if (!response.ok || !data.boardDetected) {
//         setError(data?.message || 'Could not detect board')
//         return
//       }

//       // Load the grid adjuster with auto-detected grid
//       setWarpedBoard(data.warpedBoard)
//       setGridSegments({ h: data.hSegments, v: data.vSegments })
//       setMode('adjust')
//     } catch (err) {
//       setError(err.message)
//     } finally {
//       setLoading(false)
//     }
//   }


//   const handleEditorComplete = (fenData) => {
//     setResult(fenData)
//     setMode('home')
//   }

//   const handleEditorCancel = () => setMode('home')

//   // ---------- Views ----------
//   if (mode === 'editor' && extractedSquares) {
//     return (
//       <VisualEditor
//         squares={extractedSquares}
//         onComplete={handleEditorComplete}
//         onCancel={handleEditorCancel}
//       />
//     )
//   }

//   if (mode === 'adjust' && (warpedBoard || originalImageDataUrl)) {
//     return (
//       <GridAdjuster
//         warpedBoard={warpedBoard}
//         originalImage={originalImageDataUrl}
//         initH={gridSegments.h}
//         initV={gridSegments.v}
//         onCancel={() => setMode('home')}
//         onDone={(squares) => {
//           // GridAdjuster.extractSquares returns an array of square objects
//           // Convert to the format expected by VisualEditor
//           const ok = Array.isArray(squares) && squares.every(s => !!s.imageData)
//           if (!ok) {
//             setError('Adjusted extraction returned invalid squares. Try re-adjusting guides closer to the inner grid.')
//             return
//           }
//           setExtractedSquares(squares)
//           setError(null)
//           setMode('editor')
//         }}
//       />
//     )
//   }

//   // ---------- Home ----------
//   return (
//     <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
//         <h1 style={{ fontSize: '2.0rem', fontWeight: 'bold' }}>♟️ Chess Position Scanner</h1>
//         <button
//           onClick={() => result && navigator.clipboard.writeText(result.fen)}
//           disabled={!result}
//           style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: result ? 'pointer' : 'not-allowed' }}
//         >
//           Copy FEN
//         </button>
//       </div>
//       <p style={{ color: '#666', marginBottom: '20px' }}>Upload a board image → auto extract → adjust if needed → label pieces.</p>

//       {/* Upload */}
//       <div style={{ border: '2px dashed #ccc', borderRadius: 8, padding: 24, textAlign: 'center', marginBottom: 20, background: '#f9f9f9' }}>
//         <input id="file-input" type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
//         <label htmlFor="file-input" style={{ cursor: 'pointer', padding: '10px 18px', background: '#3b82f6', color: '#fff', borderRadius: 6, fontWeight: 600 }}>
//           📁 Choose Image
//         </label>
//         <div style={{ marginTop: 8, color: '#666', fontSize: '.9rem' }}>Or drag & drop an image</div>
//       </div>

//       {/* Options */}
//       {preview && (
//         <>
//           <div style={{ marginBottom: 12 }}>
//             <button onClick={handleExtractSquares} disabled={loading}
//               style={{
//                 padding: '12px 24px',
//                 background: loading ? '#bbb' : '#3b82f6',
//                 color: '#fff',
//                 border: 'none',
//                 borderRadius: 6,
//                 fontWeight: 600,
//                 fontSize: '1rem',
//                 cursor: loading ? 'not-allowed' : 'pointer'
//               }}>
//               {loading ? '🔄 Detecting board...' : '🎯 Start → Adjust Grid & Extract'}
//             </button>
//             <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 8 }}>
//               Auto-detects the board, then lets you fine-tune the grid alignment before extracting pieces.
//             </p>
//           </div>

//           {/* Orientation (kept from your version) */}
//           <div style={{ marginBottom: 16 }}>
//             <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 380, border: '1px solid #ddd', borderRadius: 8 }} />
//           </div>
//         </>
//       )}

//       {/* Error */}
//       {error && (
//         <div style={{ padding: 12, background: '#fee', border: '1px solid #fcc', borderRadius: 6, marginBottom: 16 }}>
//           <strong>❌ Error:</strong> {error}
//           <div style={{ marginTop: 6, fontSize: '0.9rem', color: '#666' }}>
//             <b>Tips:</b> Make sure the board is clearly visible, well-lit, and fills most of the image.
//             Avoid extreme angles or reflections.
//           </div>
//         </div>
//       )}

//       {/* Result */}
//       {result && (
//         <div style={{ padding: 14, background: '#f0f9ff', border: '1px solid #3b82f6', borderRadius: 8 }}>
//           <div style={{ marginBottom: 6 }}><strong>✅ FEN:</strong></div>
//           <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{result.fen}</div>
//           <div style={{ marginTop: 6 }}><strong>Confidence:</strong> {(result.confidence * 100).toFixed(0)}%</div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default App




// scan-web/src/App.jsx
import { useState } from 'react'
import VisualEditor from './VisualEditor'
import GridAdjuster from './GridAdjuster'     // shows/edits grid lines, returns 64 crops
import BoardEditor from './BoardEditor'       // full final editor (flip, rotate, castling, etc.)

function App() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // flow control: 'home' | 'adjust' | 'editor' | 'board'
  const [mode, setMode] = useState('home')

  // extracted squares and grid adjuster state
  const [extractedSquares, setExtractedSquares] = useState(null)
  const [warpedBoard, setWarpedBoard] = useState(null) // base64 PNG from backend
  const [originalImageDataUrl, setOriginalImageDataUrl] = useState(null)
  const [gridSegments, setGridSegments] = useState({ h: null, v: null })

  // final board fen to send into BoardEditor
  const [boardFen, setBoardFen] = useState(null)

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    setPreview(URL.createObjectURL(file))
    setError(null)
    setResult(null)
    setMode('home')
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
      const res = await fetch('http://localhost:3000/api/vision/extract-grid', {
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
    setResult({ fen: finalData.fen, confidence: 1 })
    setMode('home')
  }

  // ---------- Screens ----------
  if (mode === 'adjust' && (warpedBoard || originalImageDataUrl)) {
    return (
      <GridAdjuster
        warpedBoard={warpedBoard}
        originalImage={originalImageDataUrl}
        initH={gridSegments.h}
        initV={gridSegments.v}
        onCancel={() => setMode('home')}
        onDone={handleAdjustDone}
      />
    )
  }

  if (mode === 'editor' && extractedSquares) {
    return (
      <VisualEditor
        squares={extractedSquares}
        onComplete={handleEditorComplete}
        onCancel={() => setMode('home')}
      />
    )
  }

  if (mode === 'board' && boardFen) {
    return (
      <BoardEditor
        initialFen={boardFen}
        onCancel={() => setMode('home')}
        onDone={handleBoardDone}
      />
    )
  }

  // ---------- Home ----------
  return (
    <div style={{ padding: '40px', maxWidth: 820, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>♟️ Chess Position Scanner</h1>
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
