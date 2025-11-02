import { useEffect, useRef, useState, useMemo } from 'react'

/**
 * Props:
 *  - warpedBoard: base64 PNG for a *square board image* (already perspective-warped) - can be null if warp failed
 *  - originalImage: data URL of original uploaded image (fallback if warp is bad)
 *  - initH: number[] (length 9) y-positions (0..size) for horizontal grid lines
 *  - initV: number[] (length 9) x-positions (0..size) for vertical grid lines
 *  - onCancel(): void
 *  - onDone(squares: { position, index, imageData, isEmpty, detectedColor }[]): void
 */
export default function GridAdjuster({ warpedBoard, originalImage, initH, initV, onCancel, onDone }) {
  const imgRef = useRef(null)
  const canvasRef = useRef(null)
  const [size, setSize] = useState(512)

  // 9 horizontal + 9 vertical guide positions; if not given, we make equal spacing after image loads
  const [h, setH] = useState(initH || null)
  const [v, setV] = useState(initV || null)

  const [drag, setDrag] = useState(null) // { type: 'h'|'v', idx: number } or { type: 'image', startX, startY }
  const [selectedGuide, setSelectedGuide] = useState(null) // for keyboard nudging
  const [mode, setMode] = useState('grid') // 'grid' | 'image'
  const [useOriginal, setUseOriginal] = useState(!warpedBoard) // Auto-use original if warpedBoard failed

  // Image transformation state
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 }) // pan offset in pixels
  const [imageRotation, setImageRotation] = useState(0) // rotation in degrees
  const [imageScale, setImageScale] = useState(1) // zoom/scale

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  // Determine which image source to use
  const activeImageSource = useOriginal && originalImage ? originalImage : warpedBoard

  // Load the active image (warped or original)
  useEffect(() => {
    if (!activeImageSource) return
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const sz = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height)
      setSize(sz)

      // initialize equal guides if not provided
      if (!initH || initH.length !== 9 || !initV || initV.length !== 9) {
        const segs = [...Array(9)].map((_, i) => Math.round((i * sz) / 8))
        setH(segs)
        setV(segs)
      } else {
        setH(initH)
        setV(initV)
      }

      draw(sz)
    }

    // Handle both formats: "data:image/png;base64,XXX" or just "XXX"
    if (activeImageSource.startsWith('data:')) {
      img.src = activeImageSource
    } else {
      img.src = `data:image/png;base64,${activeImageSource}`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeImageSource])

  // Redraw when guides move or image transforms
  useEffect(() => {
    if (!imgRef.current || !h || !v) return
    draw(size)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h, v, size, selectedGuide, imageOffset, imageRotation, imageScale])

  // Keyboard controls: arrow keys for nudging, Tab to switch modes, G/I for quick mode switch
  useEffect(() => {
    function handleKeyDown(e) {
      // Mode switching shortcuts
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setMode(m => m === 'grid' ? 'image' : 'grid')
        return
      }
      if (e.key === 'g' || e.key === 'G') {
        setMode('grid')
        return
      }
      if (e.key === 'i' || e.key === 'I') {
        setMode('image')
        return
      }

      // Guide nudging in grid mode
      if (selectedGuide && mode === 'grid') {
        const step = e.shiftKey ? 5 : 1

        if (selectedGuide.type === 'v' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          e.preventDefault()
          const delta = e.key === 'ArrowRight' ? step : -step
          setV((prev) => clampMonotonic(prev, selectedGuide.idx, prev[selectedGuide.idx] + delta, 0, size))
        }
        if (selectedGuide.type === 'h' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault()
          const delta = e.key === 'ArrowDown' ? step : -step
          setH((prev) => clampMonotonic(prev, selectedGuide.idx, prev[selectedGuide.idx] + delta, 0, size))
        }
        if (e.key === 'Escape') {
          setSelectedGuide(null)
        }
      }

      // Image rotation in image mode
      if (mode === 'image' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault()
        const delta = e.shiftKey ? 5 : 1
        setImageRotation(r => r + (e.key === 'ArrowRight' ? delta : -delta))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedGuide, size, mode])

  function draw(sz) {
    const cnv = canvasRef.current
    const ctx = cnv?.getContext?.('2d')
    if (!cnv || !ctx || !imgRef.current) return

    // Render at device pixel ratio for crisp lines
    cnv.width = Math.round(sz * dpr)
    cnv.height = Math.round(sz * dpr)
    cnv.style.width = `${sz}px`
    cnv.style.height = `${sz}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Clear
    ctx.clearRect(0, 0, sz, sz)
    ctx.imageSmoothingEnabled = false

    // Apply image transformations
    ctx.save()
    const centerX = sz / 2
    const centerY = sz / 2

    // Translate to center, apply rotation and scale, translate back
    ctx.translate(centerX + imageOffset.x, centerY + imageOffset.y)
    ctx.rotate((imageRotation * Math.PI) / 180)
    ctx.scale(imageScale, imageScale)
    ctx.translate(-centerX, -centerY)

    // Draw image
    ctx.drawImage(imgRef.current, 0, 0, sz, sz)
    ctx.restore()

    // Draw guides
    // verticals
    v?.forEach((x, i) => {
      const isSelected = selectedGuide?.type === 'v' && selectedGuide?.idx === i
      const isOuter = i === 0 || i === 8
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.strokeStyle = isSelected ? '#f59e0b' : (isOuter ? '#00BCD4' : '#22c55e')
      ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, sz); ctx.stroke()
      dot(ctx, x, 16, ctx.strokeStyle, isSelected ? 6 : 4)
      dot(ctx, x, sz - 16, ctx.strokeStyle, isSelected ? 6 : 4)
    })
    // horizontals
    h?.forEach((y, i) => {
      const isSelected = selectedGuide?.type === 'h' && selectedGuide?.idx === i
      const isOuter = i === 0 || i === 8
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.strokeStyle = isSelected ? '#f59e0b' : (isOuter ? '#00BCD4' : '#22c55e')
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(sz, y + 0.5); ctx.stroke()
      dot(ctx, 16, y, ctx.strokeStyle, isSelected ? 6 : 4)
      dot(ctx, sz - 16, y, ctx.strokeStyle, isSelected ? 6 : 4)
    })
  }

  function dot(ctx, x, y, color, radius = 4) {
    ctx.fillStyle = color
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill()
  }

  function nearestGuide(x, y) {
    const tol = 15  // Increased from 10 to 15 for easier grabbing on mobile
    // Prefer whichever is closer
    let best = null
    let bestDist = tol + 1
    for (let i = 0; i < (v?.length || 0); i++) {
      const dx = Math.abs(x - v[i])
      if (dx <= tol && dx < bestDist) { best = { type: 'v', idx: i }; bestDist = dx }
    }
    for (let i = 0; i < (h?.length || 0); i++) {
      const dy = Math.abs(y - h[i])
      if (dy <= tol && dy < bestDist) { best = { type: 'h', idx: i }; bestDist = dy }
    }
    return best
  }

  function onDown(e) {
    if (!h || !v) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (size / rect.width)
    const y = (e.clientY - rect.top) * (size / rect.height)

    if (mode === 'image') {
      // Image drag mode - start dragging the image
      setDrag({ type: 'image', startX: e.clientX, startY: e.clientY, initialOffset: { ...imageOffset } })
    } else {
      // Grid mode - try to grab a guide line
      const hit = nearestGuide(x, y)
      if (hit) {
        setDrag(hit)
        setSelectedGuide(hit)
      }
    }
  }

  function onMove(e) {
    if (!drag) return

    if (drag.type === 'image') {
      // Dragging the image - update offset
      const rect = e.currentTarget.getBoundingClientRect()
      const deltaX = ((e.clientX - drag.startX) * size) / rect.width
      const deltaY = ((e.clientY - drag.startY) * size) / rect.height
      setImageOffset({
        x: drag.initialOffset.x + deltaX,
        y: drag.initialOffset.y + deltaY
      })
    } else {
      // Dragging a guide line
      const rect = e.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min((e.clientX - rect.left) * (size / rect.width), size))
      const y = Math.max(0, Math.min((e.clientY - rect.top) * (size / rect.height), size))
      if (drag.type === 'v') {
        setV((prev) => clampMonotonic(prev, drag.idx, x, 0, size))
      } else {
        setH((prev) => clampMonotonic(prev, drag.idx, y, 0, size))
      }
    }
  }

  function onUp() { setDrag(null) }

  // Touch support
  function onTouchStart(e) {
    if (!h || !v) return
    const t = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (t.clientX - rect.left) * (size / rect.width)
    const y = (t.clientY - rect.top) * (size / rect.height)

    if (mode === 'image') {
      setDrag({ type: 'image', startX: t.clientX, startY: t.clientY, initialOffset: { ...imageOffset } })
    } else {
      const hit = nearestGuide(x, y)
      if (hit) {
        setDrag(hit)
        setSelectedGuide(hit)
      }
    }
  }

  function onTouchMove(e) {
    if (!drag) return
    const t = e.touches[0]

    if (drag.type === 'image') {
      const rect = e.currentTarget.getBoundingClientRect()
      const deltaX = ((t.clientX - drag.startX) * size) / rect.width
      const deltaY = ((t.clientY - drag.startY) * size) / rect.height
      setImageOffset({
        x: drag.initialOffset.x + deltaX,
        y: drag.initialOffset.y + deltaY
      })
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min((t.clientX - rect.left) * (size / rect.width), size))
      const y = Math.max(0, Math.min((t.clientY - rect.top) * (size / rect.height), size))
      if (drag.type === 'v') {
        setV((prev) => clampMonotonic(prev, drag.idx, x, 0, size))
      } else {
        setH((prev) => clampMonotonic(prev, drag.idx, y, 0, size))
      }
    }
  }
  function onTouchEnd() { setDrag(null) }

  function clampMonotonic(arr, idx, val, min, max) {
    const out = [...arr]
    // Keep lines strictly increasing; small 4px buffer
    const lower = idx === 0 ? min : out[idx - 1] + 4
    const upper = idx === out.length - 1 ? max : out[idx + 1] - 4
    out[idx] = Math.max(lower, Math.min(val, upper))
    return out
  }

  function resetEqual() {
    const sz = size
    const segs = [...Array(9)].map((_, i) => Math.round((i * sz) / 8))
    setH(segs); setV(segs)
  }

  async function extractSquares() {
    if (!imgRef.current || !h || !v) return

    // First, create a transformed version of the image
    const transformedCanvas = document.createElement('canvas')
    const transformedCtx = transformedCanvas.getContext('2d')
    transformedCanvas.width = size
    transformedCanvas.height = size

    transformedCtx.imageSmoothingEnabled = false

    // Apply the same transformations as in draw()
    transformedCtx.save()
    const centerX = size / 2
    const centerY = size / 2

    transformedCtx.translate(centerX + imageOffset.x, centerY + imageOffset.y)
    transformedCtx.rotate((imageRotation * Math.PI) / 180)
    transformedCtx.scale(imageScale, imageScale)
    transformedCtx.translate(-centerX, -centerY)

    transformedCtx.drawImage(imgRef.current, 0, 0, size, size)
    transformedCtx.restore()

    // Now crop 64 squares from the transformed image
    const cnv = document.createElement('canvas')
    const ctx = cnv.getContext('2d', { willReadFrequently: true })

    const squares = []
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x1 = v[c], x2 = v[c + 1]
        const y1 = h[r], y2 = h[r + 1]
        const w = Math.max(1, Math.round(x2 - x1))
        const hhh = Math.max(1, Math.round(y2 - y1))

        // Adaptive padding: 1.5% of min dimension to avoid grid lines but keep piece content
        const minDim = Math.min(w, hhh)
        const pad = Math.max(1, Math.min(5, Math.round(minDim * 0.015)))
        const sx = Math.max(0, Math.round(x1 + pad))
        const sy = Math.max(0, Math.round(y1 + pad))
        const sw = Math.max(1, Math.round(w - 2 * pad))
        const sh = Math.max(1, Math.round(hhh - 2 * pad))

        cnv.width = sw
        cnv.height = sh
        ctx.clearRect(0, 0, sw, sh)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(transformedCanvas, sx, sy, sw, sh, 0, 0, sw, sh)

        const dataUrl = cnv.toDataURL('image/png')
        const b64 = (dataUrl && dataUrl.startsWith('data:')) ? dataUrl.split(',')[1] : null
        if (!b64) {
          alert('One of the cropped squares was empty. Try adjusting the grid or image alignment.')
          return
        }

        const index = r * 8 + c
        const file = String.fromCharCode('a'.charCodeAt(0) + c)
        const rank = 8 - r
        const position = `${file}${rank}`

        squares.push({
          position,
          index,
          imageData: b64,
          isEmpty: false,
          detectedColor: null
        })
      }
    }

    onDone(squares)
  }

  if (!warpedBoard && !originalImage) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ padding: 12, background:'#fff7ed', border:'1px solid #fdba74', borderRadius: 8 }}>
          No board image provided to GridAdjuster.
        </div>
        <div style={{ marginTop: 8 }}>
          <button onClick={onCancel} style={btn('#6b7280')}>Back</button>
        </div>
      </div>
    )
  }

  // Calculate grid statistics for quality feedback
  const gridStats = useMemo(() => {
    if (!h || !v) return null
    const hGaps = h.slice(1).map((val, i) => val - h[i])
    const vGaps = v.slice(1).map((val, i) => val - v[i])
    const avgH = hGaps.reduce((a, b) => a + b, 0) / hGaps.length
    const avgV = vGaps.reduce((a, b) => a + b, 0) / vGaps.length
    const maxDevH = Math.max(...hGaps.map(g => Math.abs(g - avgH)))
    const maxDevV = Math.max(...vGaps.map(g => Math.abs(g - avgV)))
    const quality = maxDevH < 3 && maxDevV < 3 ? 'excellent' : maxDevH < 8 && maxDevV < 8 ? 'good' : 'needs adjustment'
    return { avgH: avgH.toFixed(1), avgV: avgV.toFixed(1), maxDevH: maxDevH.toFixed(1), maxDevV: maxDevV.toFixed(1), quality }
  }, [h, v])

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ marginBottom: 16, padding: 12, background: '#f0f9ff', borderRadius: 8, border: '1px solid #3b82f6' }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem', marginBottom: 6 }}>📐 Grid Alignment Adjuster</h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
          The board has been auto-detected. <b>Adjust the grid and/or image</b> to perfectly align squares.
          Use <b>Grid Mode</b> to move guides or <b>Image Mode</b> to pan/rotate the board.
        </p>
      </div>

      {/* Warning if auto-warp failed, show original as fallback */}
      {!warpedBoard && originalImage && (
        <div style={{ marginBottom: 12, padding: 12, background: '#fee2e2', borderRadius: 8, border: '2px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, color: '#7f1d1d' }}>Auto-Warp Failed</div>
              <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>
                The board could not be automatically detected and warped. Using your <b>original image</b> instead.
                You'll need to manually adjust the grid more carefully to align with the board squares.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Source Switcher (only show if both images available) */}
      {warpedBoard && originalImage && (
        <div style={{ marginBottom: 12, padding: 10, background: useOriginal ? '#fee2e2' : '#dcfce7', borderRadius: 8, border: `2px solid ${useOriginal ? '#ef4444' : '#22c55e'}` }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {useOriginal ? '⚠️ Using Original Image' : '✓ Using Auto-Warped Image'}
            </span>
            <button
              onClick={() => {
                setUseOriginal(!useOriginal)
                // Reset transformations when switching
                setImageOffset({ x: 0, y: 0 })
                setImageRotation(0)
                setImageScale(1)
              }}
              style={{
                ...btn(useOriginal ? '#22c55e' : '#ef4444'),
                padding: '6px 12px',
                fontSize: '0.85rem'
              }}
            >
              {useOriginal ? '↩ Switch to Auto-Warped' : '🔄 Use Original (if distorted)'}
            </button>
            <span style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
              {useOriginal
                ? 'Auto-warp failed? Using original image. You may need more manual adjustment.'
                : 'Auto-warp successful! Switch to original if you see distortion or missing squares.'}
            </span>
          </div>
        </div>
      )}

      {/* Mode Switcher */}
      <div style={{ marginBottom: 12, padding: 10, background: '#fafafa', borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', marginRight: 4 }}>Adjust Mode:</span>
          <button
            onClick={() => setMode('grid')}
            style={{
              ...btn(mode === 'grid' ? '#3b82f6' : '#e5e7eb'),
              color: mode === 'grid' ? '#fff' : '#6b7280',
              padding: '6px 12px'
            }}
          >
            🔲 Grid
          </button>
          <button
            onClick={() => setMode('image')}
            style={{
              ...btn(mode === 'image' ? '#3b82f6' : '#e5e7eb'),
              color: mode === 'image' ? '#fff' : '#6b7280',
              padding: '6px 12px'
            }}
          >
            🖼️ Image
          </button>

          {mode === 'image' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>Rotate:</span>
              <button onClick={() => setImageRotation(r => r - 1)} style={{ ...btn('#3b82f6'), padding: '4px 10px', fontSize: '0.85rem' }}>
                ↶ -1°
              </button>
              <input
                type="range"
                min="-45"
                max="45"
                step="0.1"
                value={imageRotation}
                onChange={(e) => setImageRotation(parseFloat(e.target.value))}
                style={{ width: 120 }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: 50 }}>{imageRotation.toFixed(1)}°</span>
              <button onClick={() => setImageRotation(r => r + 1)} style={{ ...btn('#3b82f6'), padding: '4px 10px', fontSize: '0.85rem' }}>
                ↷ +1°
              </button>
              <button
                onClick={() => {
                  setImageRotation(0)
                  setImageOffset({ x: 0, y: 0 })
                  setImageScale(1)
                }}
                style={{ ...btn('#ef4444'), padding: '4px 10px', fontSize: '0.85rem' }}
              >
                ↺ Reset Image
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={extractSquares} style={btn('#10b981')}>
          {gridStats?.quality === 'excellent' ? '✓ Looks Perfect - Continue' : '✓ Continue to Piece Labeling'}
        </button>
        {mode === 'grid' && <button onClick={resetEqual} style={btn('#3b82f6')}>↻ Reset Grid</button>}
        <button onClick={onCancel} style={btn('#6b7280')}>← Back</button>

        {gridStats && (
          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#666', padding: '6px 12px', background: '#f3f4f6', borderRadius: 6 }}>
            Alignment: <b style={{ color: gridStats.quality === 'excellent' ? '#10b981' : gridStats.quality === 'good' ? '#f59e0b' : '#ef4444' }}>
              {gridStats.quality}
            </b> (max dev: {gridStats.maxDevH}×{gridStats.maxDevV}px)
          </div>
        )}
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            maxWidth: 800,
            touchAction: 'none',
            cursor: drag ? 'grabbing' : mode === 'image' ? 'move' : 'crosshair',
            border: '2px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      </div>

      <div style={{ marginTop: 12, fontSize: '0.9rem' }}>
        {/* Alignment quality message */}
        {gridStats?.quality === 'excellent' && (
          <div style={{ padding: 10, background: '#dcfce7', borderRadius: 6, border: '1px solid #22c55e', color: '#166534', marginBottom: 8 }}>
            ✓ <b>Perfect alignment detected!</b> The grid matches the board squares. You can proceed directly or make fine adjustments.
          </div>
        )}
        {gridStats?.quality === 'needs adjustment' && (
          <div style={{ padding: 10, background: '#fee2e2', borderRadius: 6, border: '1px solid #ef4444', color: '#7f1d1d', marginBottom: 8 }}>
            ⚠️ <b>Grid needs adjustment.</b> Switch to the appropriate mode and adjust alignment.
          </div>
        )}

        {/* Mode-specific instructions */}
        <div style={{ padding: 10, background: mode === 'grid' ? '#f0f9ff' : '#fff7ed', borderRadius: 6, border: `1px solid ${mode === 'grid' ? '#3b82f6' : '#f59e0b'}`, marginBottom: 8 }}>
          {mode === 'grid' ? (
            <>
              <b>🔲 Grid Mode Active:</b> Drag <b style={{color: '#00BCD4'}}>cyan</b> outer borders to board edges and <b style={{color: '#22c55e'}}>green</b> inner lines to align with squares.
              Click a line to select (turns <b style={{color: '#f59e0b'}}>orange</b>), then use arrow keys for pixel-perfect adjustment.
              <div style={{ fontSize: '0.8rem', marginTop: 4, opacity: 0.8 }}>
                💡 Press <kbd>Tab</kbd> or <kbd>I</kbd> to switch to Image Mode
              </div>
            </>
          ) : (
            <>
              <b>🖼️ Image Mode Active:</b> <b>Drag anywhere</b> on the canvas to pan the board image (grid stays fixed).
              Use the <b>rotation slider</b>, ±1° buttons, or <b>arrow keys</b> (Shift for 5°) to fix tilted boards.
              <div style={{ fontSize: '0.8rem', marginTop: 4, opacity: 0.8 }}>
                💡 Press <kbd>Tab</kbd> or <kbd>G</kbd> to switch to Grid Mode
              </div>
            </>
          )}
        </div>

        {/* Keyboard controls info when a guide is selected */}
        {selectedGuide && mode === 'grid' && (
          <div style={{ padding: 8, background: '#fef3c7', borderRadius: 6, border: '1px solid #f59e0b' }}>
            ⌨️ Selected {selectedGuide.type === 'h' ? 'horizontal' : 'vertical'} line {selectedGuide.idx + 1}/9.
            Use <b>arrow keys</b> to nudge (hold <b>Shift</b> for 5px steps). Press <b>Esc</b> to deselect.
          </div>
        )}
      </div>
    </div>
  )
}

function btn(bg) {
  return {
    padding: '10px 14px',
    color: '#fff',
    background: bg,
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer'
  }
}
