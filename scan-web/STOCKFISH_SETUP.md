# Stockfish Setup for Chess Gameplay

The GamePlay component uses Stockfish chess engine for computer moves and analysis.

## Option 1: Download Stockfish (Recommended)

1. **Download Stockfish.js:**
   - Visit: https://github.com/nmrugg/stockfish.js/
   - Download `stockfish.js` file
   - Place it in `public/stockfish.js`

2. **Alternative - Use CDN:**
   - The code will automatically fall back to a CDN version if local file is not found

## Option 2: Use Backend Stockfish

If you prefer to run Stockfish on the backend:

1. Install Stockfish engine on your system
2. Create an API endpoint in `scan-back` that communicates with Stockfish
3. Update `GamePlay.jsx` to use fetch instead of Web Worker

### Backend Integration Example:

```python
# scan-back/app/routers/engine.py

import subprocess
from fastapi import APIRouter

router = APIRouter()

@router.post("/analyze")
async def analyze_position(fen: str, depth: int = 18):
    """Analyze chess position with Stockfish"""
    # Run stockfish and get best move
    process = subprocess.Popen(
        ['stockfish'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    commands = [
        'uci',
        f'position fen {fen}',
        f'go depth {depth}',
        'quit'
    ]

    stdout, _ = process.communicate('\n'.join(commands))

    # Parse best move and evaluation
    # Return JSON response
    return {"bestMove": "e2e4", "evaluation": 0.3}
```

## Option 3: No Engine (Human vs Human only)

If you only want Human vs Human mode:
- The game will still work
- Computer modes will show "Stockfish not loaded" error
- Analysis features will be disabled

## Testing

After setup, test by:
1. Opening Board Editor
2. Click "▶️ Play"
3. Select "vs Computer"
4. Verify the engine is analyzing positions

## Files Modified

- `src/GamePlay.jsx` - Main gameplay component
- `src/BoardEditor.jsx` - Added "Play" button
- `public/stockfish.js` - Stockfish engine (you need to add this)

## Performance

- **Web Worker (Recommended)**: Runs in background thread, doesn't block UI
- **Backend**: Better for mobile, scales better for multiple users
- **Depth 18**: Good balance between speed and strength (~2-3 seconds per move)

Adjust depth in `GamePlay.jsx`:
```javascript
stockfishWorker.current.postMessage('go depth 18'); // Change 18 to your preferred depth
```
