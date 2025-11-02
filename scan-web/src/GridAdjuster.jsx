import { useEffect, useRef, useState, useMemo } from 'react'

/**
 * Props:
 *  - warpedBoard: base64 PNG for a *square board image* (already perspective-warped)
 *  - initH: number[] (length 9) y-positions (0..size) for horizontal grid lines
 *  - initV: number[] (length 9) x-positions (0..size) for vertical grid lines
 *  - onCancel(): void
 *  - onDone(squares: { position, index, imageData, isEmpty, detectedColor }[]): void
 */
export default function GridAdjuster({ warpedBoard, initH, initV, onCancel, onDone }) {
  const imgRef = useRef(null)
  const canvasRef = useRef(null)
  const [size, setSize] = useState(512)

  // 9 horizontal + 9 vertical guide positions; if not given, we make equal spacing after image loads
  const [h, setH] = useState(initH || null)
  const [v, setV] = useState(initV || null)

  const [drag, setDrag] = useState(null) // { type: 'h'|'v', idx: number }
  const [selectedGuide, setSelectedGuide] = useState(null) // for keyboard nudging
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  // Load the base64 image once
  useEffect(() => {
    if (!warpedBoard) return
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
    img.src = `data:image/png;base64,${warpedBoard}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warpedBoard])

  // Redraw when guides move
  useEffect(() => {
    if (!imgRef.current || !h || !v) return
    draw(size)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h, v, size, selectedGuide])

  // Keyboard nudging: arrow keys to adjust selected guide
  useEffect(() => {
    if (!selectedGuide) return

    function handleKeyDown(e) {
      const step = e.shiftKey ? 5 : 1  // Hold Shift for faster movement

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

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedGuide, size])

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

    // Clear & draw image
    ctx.clearRect(0, 0, sz, sz)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(imgRef.current, 0, 0, sz, sz)

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
    const hit = nearestGuide(x, y)
    if (hit) {
      setDrag(hit)
      setSelectedGuide(hit)  // Enable keyboard nudging for this guide
    }
  }

  function onMove(e) {
    if (!drag) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min((e.clientX - rect.left) * (size / rect.width), size))
    const y = Math.max(0, Math.min((e.clientY - rect.top) * (size / rect.height), size))
    if (drag.type === 'v') {
      setV((prev) => clampMonotonic(prev, drag.idx, x, 0, size))
    } else {
      setH((prev) => clampMonotonic(prev, drag.idx, y, 0, size))
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
    const hit = nearestGuide(x, y)
    if (hit) {
      setDrag(hit)
      setSelectedGuide(hit)  // Enable keyboard nudging for this guide
    }
  }
  function onTouchMove(e) {
    if (!drag) return
    const t = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min((t.clientX - rect.left) * (size / rect.width), size))
    const y = Math.max(0, Math.min((t.clientY - rect.top) * (size / rect.height), size))
    if (drag.type === 'v') {
      setV((prev) => clampMonotonic(prev, drag.idx, x, 0, size))
    } else {
      setH((prev) => clampMonotonic(prev, drag.idx, y, 0, size))
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
    // Crop 64 squares using guides; add a tiny padding to avoid grid lines
    const base = imgRef.current
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
        // Clamped between 1-5px to handle various board sizes gracefully
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
        ctx.drawImage(base, sx, sy, sw, sh, 0, 0, sw, sh)

        const dataUrl = cnv.toDataURL('image/png')
        const b64 = (dataUrl && dataUrl.startsWith('data:')) ? dataUrl.split(',')[1] : null
        if (!b64) {
          // If any crop failed, abort with a friendly hint
          alert('One of the cropped squares was empty. Try nudging guides a bit closer to the inner grid.')
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
          isEmpty: false,       // user will decide in VisualEditor
          detectedColor: null
        })
      }
    }

    onDone(squares)
  }

  if (!warpedBoard) {
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={resetEqual} style={btn('#3b82f6')}>Reset equal</button>
        <button onClick={extractSquares} style={btn('#10b981')}>Use adjusted grid</button>
        <button onClick={onCancel} style={btn('#6b7280')}>Cancel</button>

        {gridStats && (
          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#666', padding: '6px 12px', background: '#f3f4f6', borderRadius: 6 }}>
            Alignment: <b style={{ color: gridStats.quality === 'excellent' ? '#10b981' : gridStats.quality === 'good' ? '#f59e0b' : '#ef4444' }}>
              {gridStats.quality}
            </b> (max deviation: {gridStats.maxDevH}×{gridStats.maxDevV}px)
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
            cursor: drag ? 'grabbing' : 'crosshair',
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

      <div style={{ marginTop: 12, color:'#666', fontSize: '0.9rem' }}>
        <div>Tip: drag the <b>cyan</b> outer borders to the board edges and the <b>green</b> inner lines to align the 8×8 grid.</div>
        {selectedGuide && (
          <div style={{ marginTop: 8, padding: 8, background: '#fef3c7', borderRadius: 6, border: '1px solid #f59e0b' }}>
            ⌨️ Selected {selectedGuide.type === 'h' ? 'horizontal' : 'vertical'} line {selectedGuide.idx + 1}/9 (shown in <b style={{color: '#f59e0b'}}>orange</b>).
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
