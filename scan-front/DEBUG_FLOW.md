# Mobile App Flow & Debug Guide

## Complete App Flow

```
1. HOME (index.tsx)
   ↓ Click "Open Camera"

2. SCAN (scan.tsx)
   ↓ Take photo
   ↓ Crop board
   ↓ Click "Continue"
   ↓ Calls: recognizeChessBoard(croppedUri)
   ↓ Backend: POST /infer (YOLO detection)

3. BOARD EDITOR (board-editor.tsx)
   ↓ Shows detected FEN
   ↓ Select game mode
   ↓ Click "Start"

4. ANALYZE (analyze.tsx)
   ↓ Calls: getBestMove(fen)
   ↓ Backend: POST /analyze (Stockfish)
   ↓ Shows best move & evaluation
```

---

## Expected Console Logs

### When App Starts:
```
🔧 Vision API Module Loaded
📍 VISION_API_URL: http://192.168.1.7:8000
🎮 CHESS_ENGINE_URL: http://192.168.1.7:8000
♟️ Chess Engine Module Loaded
🔗 CHESS_ENGINE_URL: http://192.168.1.7:8000
⚙️ Engine Depth: 15
```

### When You Click "Continue" After Cropping:
```
✂️ Crop complete! Starting recognition...
📸 Cropped image URI: file://...
🔄 Calling recognizeChessBoard...
🔍 recognizeChessBoard called with: { imageUri: "...", flipRanks: false }
📡 Backend URL: http://192.168.1.7:8000
📎 Preparing file: { filename: "...", type: "image/jpeg" }
🚀 Sending inference request to: http://192.168.1.7:8000/infer
📦 FormData keys: [...]
✅ Inference response received!
♟️ FEN: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
🎯 Pieces detected: 32
📐 Board corners: [[...]]
📊 Average confidence: 0.85
✅ Recognition successful! FEN: ...
```

### When You Click "Analyze" in Analyze Screen:
```
🤔 getBestMove called
📍 FEN: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
🎯 Depth: 15
🔗 Backend URL: http://192.168.1.7:8000
🚀 Sending analysis request to: http://192.168.1.7:8000/analyze
✅ Analysis response received!
📊 Full response: { ... }
♟️ Best move: e2e4
📈 Evaluation: 0.25
```

---

## Backend Logs (Expected)

### For /infer (Image Detection):
```
INFO:     POST /infer HTTP/1.1" 200 OK
```

### For /analyze (Stockfish):
```
INFO:     📊 /analyze request: FEN=rnbqkbnr/... depth=15 multipv=1
INFO:     ✅ /analyze complete in 1.23s: eval={'type': 'cp', 'value': 25} bestMove=e2e4
INFO:     POST /analyze HTTP/1.1" 200 OK
```

---

## Common Errors & Solutions

### ❌ "Recognition failed: Cannot connect to backend"

**Mobile App Log:**
```
❌ Vision API error: ...
🔌 Network error: connect ECONNREFUSED
❗ Error code: ECONNREFUSED
```

**Solutions:**
1. Check backend is running: `curl http://192.168.1.7:8000/health`
2. Verify IP in `.env` matches your computer's IP
3. Phone & computer on same WiFi
4. Windows Firewall not blocking port 8000

---

### ❌ "Cannot connect to chess engine backend"

**Mobile App Log:**
```
❌ Chess engine error: ...
🔌 Network error: connect ECONNREFUSED
❗ Error code: ECONNREFUSED
```

**Solutions:**
1. Backend running? Check uvicorn logs
2. Stockfish started? Call `/start_engine` first
3. Same as above network checks

---

### ❌ "Backend error: No board mask detected"

**Mobile App Log:**
```
❌ Vision API error: ...
📄 Response data: { "error": "No board mask detected" }
```

**Backend Log:**
```
ERROR: No board mask detected.
```

**Solutions:**
1. Check board model path in backend `.env`
2. Ensure image shows full chessboard
3. Try better lighting / angle
4. Model file exists at path?

---

### ❌ "Backend error: Stockfish engine failed"

**Mobile App Log:**
```
❌ Chess engine error: ...
📄 Response data: { "error": "ANALYSIS_FAILED" }
```

**Backend Log:**
```
ERROR: No PVs returned for fen=...
```

**Solutions:**
1. Start engine: `curl -X POST http://192.168.1.7:8000/start_engine`
2. Check Stockfish path in backend `.env`
3. Verify Stockfish executable exists
4. Check backend logs for Stockfish errors

---

## Debug Checklist

Before testing mobile app:

- [ ] Backend running on port 8000
- [ ] Health check returns `{"ok":true}`
- [ ] Stockfish engine started (`/start_engine`)
- [ ] CORS_ORIGINS=* in backend `.env`
- [ ] Correct IP (192.168.1.7) in mobile app `.env`
- [ ] Phone & computer on same WiFi network
- [ ] Mobile app restarted (for .env changes)
- [ ] Backend restarted (for .env changes)

---

## How to Test Step by Step

### 1. Test Backend First
```bash
# From command line
curl http://192.168.1.7:8000/health
curl -X POST http://192.168.1.7:8000/start_engine
```

### 2. Start Mobile App
```bash
cd D:\react\chess-scan\scan-front
npm start
```

### 3. Watch Logs
- Open React Native Debugger or Metro Bundler console
- Look for the module load logs when app starts

### 4. Test Camera Flow
- Click "Open Camera"
- Take photo of chess board
- Crop the board
- Click "Continue"
- Watch console for inference logs
- Check backend logs for POST /infer

### 5. Test Analysis Flow
- Select a game mode
- Click "Start"
- Click "Analyze"
- Watch console for analysis logs
- Check backend logs for POST /analyze

---

## Quick Verification

If you see these, everything is wired correctly:

✅ Backend: `Uvicorn running on http://0.0.0.0:8000`
✅ App: Module load logs with correct IP
✅ App: Request logs when clicking Continue/Analyze
✅ Backend: POST requests in uvicorn logs
✅ App: Success responses with data

If ANY of these are missing, follow the error solutions above! 🔍
