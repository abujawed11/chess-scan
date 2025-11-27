# Quick Start - Analysis Fix ✅

## The Problem (FIXED!)
Your mobile app was showing: `ERROR: "NO_RESULTS" - Engine returned no analysis results`

## The Solution
The app now automatically initializes the Stockfish engine when it starts, just like the web app does!

---

## ⚡ Quick Start (3 Steps)

### 1️⃣ Start Backend

```bash
cd D:\react\chess-detector\chess-api
uvicorn app:app --reload --port 8000
```

✅ Look for: `Uvicorn running on http://127.0.0.1:8000`

---

### 2️⃣ Check Backend URL

**For Android Emulator** (most common):
- Default is already correct: `http://10.0.2.2:8000` ✅
- No changes needed!

**For iOS Simulator or Physical Device**:
- Create/edit `.env` file in `scan-front` folder:
```env
EXPO_PUBLIC_CHESS_ENGINE_URL=http://localhost:8000    # iOS
# or
EXPO_PUBLIC_CHESS_ENGINE_URL=http://YOUR_IP:8000      # Physical device
```

---

### 3️⃣ Start Mobile App

```bash
cd D:\react\chess-scan\scan-front
npx expo start -c
```

---

## ✅ Success Indicators

### In Metro Terminal:
```
✅ Backend Stockfish initialized successfully
✅ Chess engine ready for analysis
```

### In App:
- "Analysis Board" works
- "Play New Game" works
- No more "NO_RESULTS" errors!

---

## ❌ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot connect to backend" | Make sure backend is running on port 8000 |
| "NO_RESULTS" still showing | Restart backend: `uvicorn app:app --reload --port 8000` |
| Analysis not working | Check Metro logs for red error messages |
| Engine initialization failed | Verify backend is at `D:\react\chess-detector\chess-api` |

---

## 📚 More Details

- **Complete Setup Guide**: See `BACKEND_SETUP.md`
- **What Was Fixed**: See `FIX_SUMMARY.md`
- **Configuration**: See `constants/config.ts`

---

## 🎮 Test It!

1. Open app
2. Tap "Analysis Board"
3. Move a piece
4. Watch the analysis work! ♟️

**Enjoy your working chess app!** 🎉

