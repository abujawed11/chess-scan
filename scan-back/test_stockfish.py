#!/usr/bin/env python
"""Test script to verify Stockfish integration."""
import os
from dotenv import load_dotenv
import chess
import chess.engine

# Load environment variables
load_dotenv()

STOCKFISH_PATH = os.getenv("STOCKFISH_PATH", "stockfish")
print(f"Stockfish path: {STOCKFISH_PATH}")
print(f"Path exists: {os.path.exists(STOCKFISH_PATH)}")

try:
    # Create board from FEN
    fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    board = chess.Board(fen)
    print(f"Board created: {board.fen()}")

    # Open Stockfish engine
    print("Opening Stockfish engine...")
    with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
        print("Engine opened successfully!")

        # Analyze position
        print("Analyzing position...")
        info = engine.analyse(
            board,
            chess.engine.Limit(depth=10),
            multipv=1
        )

        print(f"Analysis result: {info}")

        # Extract best move
        best_move = info.get("pv", [None])[0]
        print(f"Best move: {best_move}")

        # Extract evaluation
        score = info.get("score")
        print(f"Score: {score}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
