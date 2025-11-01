# Chess Scan Backend API

FastAPI backend for chess position recognition and analysis.

## Tech Stack

- **FastAPI**: Modern Python web framework
- **Stockfish**: Chess engine for analysis
- **python-chess**: Chess logic and engine integration
- **OpenCV + PIL**: Image processing (for vision recognition)

## Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Stockfish

**Windows:**
```bash
# Download from https://stockfishchess.org/download/
# Add to PATH or set STOCKFISH_PATH environment variable
```

**Mac:**
```bash
brew install stockfish
```

**Linux:**
```bash
sudo apt-get install stockfish
```

### 3. Set Environment Variables (Optional)

```bash
export STOCKFISH_PATH="/path/to/stockfish"
```

### 4. Run the Server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 3000
```

Server will run at: `http://localhost:3000`

## API Endpoints

### Vision API

#### `POST /api/vision/recognize`
Recognize chess position from image.

**Request:**
- Body: `multipart/form-data`
- Field: `image` (file upload)

**Response:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "confidence": 0.95,
  "detectedPieces": [...]
}
```

### Engine API

#### `POST /api/engine/analyze`
Analyze chess position using Stockfish.

**Request:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 15,
  "multiPV": 1
}
```

**Response:**
```json
{
  "bestMove": "e2e4",
  "evaluation": 0.25,
  "depth": 15,
  "pv": ["e2e4", "e7e5", "g1f3"]
}
```

### Health Check

#### `GET /health`
Check if API is running.

## Development

### Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app & middleware
│   ├── routers/             # API routes
│   │   ├── vision.py        # Vision endpoints
│   │   └── engine.py        # Engine endpoints
│   ├── services/            # Business logic
│   │   ├── vision_service.py    # CV/ML logic
│   │   └── engine_service.py    # Stockfish integration
│   └── models/              # Pydantic models
│       └── chess_models.py
├── requirements.txt
└── README.md
```

## TODO: Vision Recognition

The vision service currently returns a mock response. To implement actual recognition:

### Option 1: Use Existing Solutions
- **LiveChess2FEN**: https://github.com/davidmallasen/LiveChess2FEN
- **ChessVision.ai**: Commercial API (paid)

### Option 2: Build Custom
1. Board detection using OpenCV (find corners, perspective transform)
2. Square extraction (divide into 8x8 grid)
3. Piece classification using CNN
4. FEN generation

### Recommended: Start with LiveChess2FEN
```bash
pip install LiveChess2FEN
```

Then integrate in `vision_service.py`.

## Connecting React Native App

Update your React Native app's `constants/config.ts`:

```typescript
export const API_CONFIG = {
  // For Android emulator
  VISION_API_URL: 'http://10.0.2.2:3000/api/vision',
  CHESS_ENGINE_URL: 'http://10.0.2.2:3000/api/engine',

  // For iOS simulator
  // VISION_API_URL: 'http://localhost:3000/api/vision',
  // CHESS_ENGINE_URL: 'http://localhost:3000/api/engine',

  // For physical device (use your computer's IP)
  // VISION_API_URL: 'http://192.168.1.XXX:3000/api/vision',
  // CHESS_ENGINE_URL: 'http://192.168.1.XXX:3000/api/engine',
};
```

## Testing

Test endpoints using curl:

```bash
# Health check
curl http://localhost:3000/health

# Test engine
curl -X POST http://localhost:3000/api/engine/analyze \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "depth": 10}'
```
