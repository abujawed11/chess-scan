# Quick Backend Test Guide

Use this to verify your backend is working before testing the mobile app.

## Test 1: Health Check

```bash
curl http://192.168.1.7:8000/health
```

**Expected:** `{"ok":true}`

## Test 2: Start Stockfish Engine

```bash
curl -X POST http://192.168.1.7:8000/start_engine
```

**Expected:**
```json
{
  "status": "started",
  "message": "Engine started successfully",
  ...
}
```

## Test 3: Check Engine Status

```bash
curl http://192.168.1.7:8000/engine_status
```

**Expected:**
```json
{
  "running": true,
  "engine_path": "...",
  "engine_exists": true
}
```

## Test 4: Analyze Position (Stockfish)

```bash
curl -X POST http://192.168.1.7:8000/analyze \
  -F "fen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" \
  -F "depth=15" \
  -F "multipv=1"
```

**Expected:** JSON with `bestMove`, `evaluation`, `lines`, etc.

## Test 5: Image Detection (YOLO)

First, have a test chess board image ready. Then:

```bash
curl -X POST http://192.168.1.7:8000/infer \
  -F "file=@path/to/your/chessboard.jpg" \
  -F "flip_ranks=false"
```

**Expected:** JSON with `fen`, `num_pieces`, `detections`, `board_corners`

---

## Common Issues:

### ❌ "Connection refused"
- Backend not running
- Wrong IP address
- Check firewall

### ❌ "Engine not running"
- Run `/start_engine` first
- Check Stockfish path in backend `.env`

### ❌ "No board mask detected"
- Model files missing
- Wrong model paths in backend `.env`
- Image quality too low

---

## Quick Check (All Tests)

```bash
# 1. Health
curl http://192.168.1.7:8000/health

# 2. Start engine
curl -X POST http://192.168.1.7:8000/start_engine

# 3. Test analysis
curl -X POST http://192.168.1.7:8000/analyze \
  -F "fen=rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1" \
  -F "depth=12" \
  -F "multipv=1"
```

If all 3 work, your backend is ready! 🎉
