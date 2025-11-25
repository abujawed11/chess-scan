# Backend Setup for Mobile App

This guide explains how to run the backend and connect your mobile app to it.

## Backend Location
Your trained model backend is located at:
```
D:\react\chess-detector\chess-api
```

## Running the Backend

1. **Navigate to backend directory:**
   ```bash
   cd D:\react\chess-detector\chess-api
   ```

2. **Activate Python virtual environment:**
   ```bash
   .\venv\Scripts\activate
   ```

3. **Install dependencies (if not already installed):**
   ```bash
   pip install -r requirements.txt
   ```

4. **Check the .env file:**
   Make sure `D:\react\chess-detector\chess-api\.env` has the correct paths:
   ```env
   BOARD_MODEL_PATH=D:/react/chess-detector/runs/segment/board_v2/weights/best.pt
   PIECES_MODEL_PATH=D:/react/chess-detector/models/backups/best_pieces_v3.pt
   BOARD_CONF=0.25
   PIECES_CONF=0.25
   STOCKFISH_PATH=D:/react/chess-detector/engine/stockfish.exe
   CORS_ORIGINS=*
   ```
   > **Important:** Set `CORS_ORIGINS=*` to allow mobile app requests

5. **Run the FastAPI backend:**
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```

   This will start the backend on `http://0.0.0.0:8000`

## Connecting Mobile App to Backend

### Option 1: Physical Device (Phone on WiFi)
1. Find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.0.107`)

2. Update `scan-front\.env`:
   ```env
   EXPO_PUBLIC_VISION_API_URL=http://192.168.0.107:8000
   EXPO_PUBLIC_CHESS_ENGINE_URL=http://192.168.0.107:8000
   ```

3. **Make sure your phone and computer are on the same WiFi network!**

### Option 2: Android Emulator
Update `scan-front\.env`:
```env
EXPO_PUBLIC_VISION_API_URL=http://10.0.2.2:8000
EXPO_PUBLIC_CHESS_ENGINE_URL=http://10.0.2.2:8000
```
> `10.0.2.2` is a special alias for `localhost` in Android emulator

### Option 3: iOS Simulator
Update `scan-front\.env`:
```env
EXPO_PUBLIC_VISION_API_URL=http://localhost:8000
EXPO_PUBLIC_CHESS_ENGINE_URL=http://localhost:8000
```

## Running the Mobile App

1. **Navigate to mobile app directory:**
   ```bash
   cd D:\react\chess-scan\scan-front
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Start Expo:**
   ```bash
   npm start
   ```

4. **Scan QR code with Expo Go app** (physical device) or press:
   - `a` for Android emulator
   - `i` for iOS simulator

## Backend API Endpoints

Your mobile app now uses these endpoints:

### Chess Detection
- **POST** `/infer`
  - Upload image
  - Returns: FEN, detected pieces, board corners, overlay images

### Chess Engine (Stockfish)
- **POST** `/start_engine` - Start Stockfish engine
- **GET** `/engine_status` - Check if engine is running
- **POST** `/analyze` - Analyze position (get best move, evaluation)
- **POST** `/evaluate` - Evaluate a specific move
- **POST** `/stop_engine` - Stop the engine

### Health Check
- **GET** `/health` - Check if backend is running

## Testing the Connection

1. Start the backend
2. Open your mobile app
3. Check console logs for connection messages
4. Try scanning a chess board image

## Troubleshooting

### "Network Error" or "Connection Refused"
- ✅ Check backend is running (`http://localhost:8000/health` in browser)
- ✅ Check IP address is correct in `.env`
- ✅ Check phone and computer are on same WiFi
- ✅ Check Windows Firewall isn't blocking port 8000

### "No board mask detected"
- ✅ Check model paths in backend `.env`
- ✅ Check models exist at specified paths

### "Stockfish engine failed"
- ✅ Check Stockfish path in backend `.env`
- ✅ Call `/start_engine` before `/analyze`

## Quick Test Commands

Test backend from command line:

```bash
# Health check
curl http://localhost:8000/health

# Start engine
curl -X POST http://localhost:8000/start_engine

# Check engine status
curl http://localhost:8000/engine_status

# Test analysis
curl -X POST http://localhost:8000/analyze -F "fen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" -F "depth=15" -F "multipv=1"
```

## Models Used

- **Board Detection:** YOLO segmentation model at `runs/segment/board_v2/weights/best.pt`
- **Piece Detection:** YOLO detection model at `models/backups/best_pieces_v3.pt`
- **Chess Engine:** Stockfish 17.1 at `engine/stockfish.exe`

---

Your mobile app is now connected to the same backend that powers your web app! 🎉
