import { useState } from 'react'
import VisualEditor from './VisualEditor'

function App() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rotation, setRotation] = useState('auto')  // 'auto', '0', '90', '180', '270'
  const [isStartingPosition, setIsStartingPosition] = useState(false)
  const [extractedSquares, setExtractedSquares] = useState(null)
  const [showVisualEditor, setShowVisualEditor] = useState(false)

  const handleImageSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
      setError(null)
    }
  }

  const handleExtractSquares = async () => {
    if (!selectedImage) return

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('image', selectedImage)

    try {
      const response = await fetch('http://localhost:3000/api/vision/extract-squares', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.boardDetected) {
        setError(data.message)
        return
      }

      setExtractedSquares(data.squares)
      setShowVisualEditor(true)
    } catch (err) {
      setError(err.message)
      console.error('Extract error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditorComplete = (fenData) => {
    setResult(fenData)
    setShowVisualEditor(false)
  }

  const handleEditorCancel = () => {
    setShowVisualEditor(false)
  }

  // Show visual editor if squares are extracted
  if (showVisualEditor && extractedSquares) {
    return (
      <VisualEditor
        squares={extractedSquares}
        onComplete={handleEditorComplete}
        onCancel={handleEditorCancel}
      />
    )
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
        ♟️ Chess Position Scanner
      </h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Upload a chess board image and identify pieces visually
      </p>

      {/* Upload Section */}
      <div style={{
        border: '2px dashed #ccc',
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        marginBottom: '30px',
        backgroundColor: '#f9f9f9'
      }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label
          htmlFor="file-input"
          style={{
            cursor: 'pointer',
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            display: 'inline-block',
            fontWeight: '600'
          }}
        >
          📁 Choose Image
        </label>
        <p style={{ marginTop: '12px', color: '#666', fontSize: '0.9rem' }}>
          Or drag and drop a chess board image
        </p>
      </div>

      {/* Settings Panel */}
      {preview && (
        <>
          {/* Starting Position Calibration */}
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '2px solid #f59e0b'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isStartingPosition}
                onChange={(e) => setIsStartingPosition(e.target.checked)}
                style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '1rem' }}>📚 This is a starting position</strong>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px', marginBottom: 0 }}>
                  Check this box if uploading a starting position to calibrate piece templates (recommended for first use)
                </p>
              </div>
            </label>
          </div>

          {/* Board Orientation Selector */}
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #3b82f6'
          }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', fontWeight: '600' }}>
              🧭 Board Orientation
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '12px' }}>
              Specify which corner is square a1 (bottom-left from white's perspective):
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="auto"
                  checked={rotation === 'auto'}
                  onChange={(e) => setRotation(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                <span>🔄 Auto-detect</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="0"
                  checked={rotation === '0'}
                  onChange={(e) => setRotation(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                <span>⬇️ Bottom-left (0°)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="90"
                  checked={rotation === '90'}
                  onChange={(e) => setRotation(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                <span>⬅️ Bottom-right (90°)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="180"
                  checked={rotation === '180'}
                  onChange={(e) => setRotation(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                <span>⬆️ Top-right (180°)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="270"
                  checked={rotation === '270'}
                  onChange={(e) => setRotation(e.target.value)}
                  style={{ marginRight: '6px' }}
                />
                <span>➡️ Top-left (270°)</span>
              </label>
            </div>
          </div>
        </>
      )}

      {/* Preview Section */}
      {preview && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Preview:</h3>
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              border: '2px solid #ccc',
              borderRadius: '8px'
            }}
          />
          <button
            onClick={handleExtractSquares}
            disabled={loading}
            style={{
              marginTop: '16px',
              padding: '12px 32px',
              backgroundColor: loading ? '#ccc' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Extracting...' : '🎨 Open Visual Editor'}
          </button>
        </div>
      )}

      {/* Error Section */}
      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f0f9ff',
          border: '2px solid #3b82f6',
          borderRadius: '8px'
        }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>
            ✅ Position Detected!
          </h3>
          <div style={{ marginBottom: '12px' }}>
            <strong>FEN:</strong>
            <div style={{
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              marginTop: '8px',
              wordBreak: 'break-all'
            }}>
              {result.fen}
            </div>
          </div>
          <div>
            <strong>Confidence:</strong> {(result.confidence * 100).toFixed(0)}%
          </div>
        </div>
      )}
    </div>
  )
}

export default App
