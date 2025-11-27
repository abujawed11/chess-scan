# Backend Setup for Mobile App

## Issue Fixed: "NO_RESULTS" Error

The mobile app was getting `NO_RESULTS` error when trying to analyze because it wasn't initializing the backend Stockfish engine before making analysis requests.

### What Was Fixed:

1. **Added engine initialization**: The app now calls `/start_engine` endpoint when it starts
2. **Better error handling**: More detailed error messages to help debug connection issues
3. **Automatic initialization**: Engine initializes automatically when app loads

### Backend Configuration

Your backend is at: `D:\react\chess-detector\chess-api`

#### Step 1: Start the Backend

Open a terminal in `D:\react\chess-detector\chess-api` and run:

```bash
# Activate virtual environment (if you have one)
venv\Scripts\activate

# Start the backend (default port is 8000)
uvicorn app:app --reload --port 8000

# Or if you prefer a different port:
# uvicorn app:app --reload --port 8001
```

**Important**: The mobile app is configured for port **8000** by default. If your backend runs on a different port, update the mobile app's `.env` file.

#### Step 2: Configure Mobile App Backend URL

The mobile app needs to know where your backend is running:

**For Android Emulator:**
- Use `10.0.2.2` instead of `localhost` (this maps to your computer's localhost)
- Default: `http://10.0.2.2:8000`

**For iOS Simulator:**
- Use `localhost` or `127.0.0.1`
- Default: `http://localhost:8000`

**For Physical Device:**
- Use your computer's IP address on the local network
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Example: `http://192.168.1.100:8000`

#### Step 3: Update Environment Variables

Create or update `.env` file in `scan-front` folder:

```env
# For Android Emulator (default)
EXPO_PUBLIC_CHESS_ENGINE_URL=http://10.0.2.2:8000
EXPO_PUBLIC_VISION_API_URL=http://10.0.2.2:8000

# For iOS Simulator
# EXPO_PUBLIC_CHESS_ENGINE_URL=http://localhost:8000
# EXPO_PUBLIC_VISION_API_URL=http://localhost:8000

# For Physical Device (replace with your computer's IP)
# EXPO_PUBLIC_CHESS_ENGINE_URL=http://192.168.1.100:8000
# EXPO_PUBLIC_VISION_API_URL=http://192.168.1.100:8000
```

#### Step 4: Restart Metro Bundler

After changing `.env`, restart your Metro bundler:

1. Press `Ctrl+C` to stop Metro
2. Clear cache and restart:
   ```bash
   npx expo start -c
   ```

### Verifying Backend Connection

When you start the mobile app, check the logs (Metro terminal):

✅ **Success:**
```
♟️ Chess Engine Module Loaded
🔗 CHESS_ENGINE_URL: http://10.0.2.2:8000
🚀 App started, initializing chess engine...
✅ Backend Stockfish initialized successfully
  🔧 Engine: /path/to/stockfish
✅ Chess engine ready for analysis
```

❌ **Connection Failed:**
```
❌ Engine initialization failed
🔌 Cannot connect to backend. Is the server running at http://10.0.2.2:8000?
⚠️ Chess engine initialization failed. Analysis features may not work.
```

### Testing Analysis

1. Open the app
2. Tap "Analysis Board" or "Play New Game"
3. The app should automatically initialize the engine
4. When you analyze, check logs for:
   ```
   🤔 getBestMove called
   🚀 Sending analysis request to: http://10.0.2.2:8000/analyze
   ✅ Analysis response received!
   ♟️ Best move: e2e4
   ```

### Troubleshooting

#### Problem: "Cannot connect to backend"

**Solution:**
1. Make sure backend is running: `uvicorn app:app --reload --port 8000`
2. Check backend URL in logs matches your setup
3. For Android emulator, use `10.0.2.2`, NOT `localhost`
4. For physical device, make sure computer and device are on same WiFi

#### Problem: "NO_RESULTS" Error

**Solution:**
1. Restart the backend server
2. Check if Stockfish binary exists at the path shown in backend logs
3. Make sure the backend port matches (8000 by default)

#### Problem: Analysis is slow

**Solution:**
1. Backend processes requests synchronously
2. Reduce analysis depth (default is 15) if needed
3. Check backend logs for timing information

### Backend Endpoints Used

- `POST /start_engine` - Initialize Stockfish engine (called once at app start)
- `POST /analyze` - Analyze position (called for each analysis request)
  - Parameters: `fen`, `depth`, `multipv`

### Port Configuration

- **Backend location**: `D:\react\chess-detector\chess-api`
- **Default port**: 8000 (FastAPI/uvicorn default)
- Both web app and mobile app use the same backend

Make sure the mobile app's backend URL matches where your backend is running!
