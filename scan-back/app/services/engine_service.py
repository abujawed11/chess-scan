"""
Chess engine service using Stockfish.

Requires Stockfish binary to be installed.
Download from: https://stockfishchess.org/download/
"""
import chess
import chess.engine
from app.models.chess_models import EngineResponse
import os

# Path to Stockfish binary
STOCKFISH_PATH = os.getenv("STOCKFISH_PATH", "stockfish")

async def analyze_position(fen: str, depth: int = 15, multi_pv: int = 1) -> EngineResponse:
    """
    Analyze chess position using Stockfish engine.

    Args:
        fen: Position in FEN notation
        depth: Search depth
        multi_pv: Number of principal variations to return

    Returns:
        EngineResponse with best move and evaluation
    """
    try:
        # Create board from FEN
        board = chess.Board(fen)

        # Open Stockfish engine
        with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
            # Analyze position
            info_list = engine.analyse(
                board,
                chess.engine.Limit(depth=depth),
                multipv=multi_pv
            )

            # engine.analyse returns a list, get the first element
            info = info_list[0] if isinstance(info_list, list) else info_list

            # Extract best move
            best_move = info.get("pv", [None])[0]
            if best_move is None:
                raise ValueError("No legal moves available")

            # Extract evaluation (in centipawns)
            score = info.get("score")
            if score:
                # Convert score to float (centipawns / 100)
                if score.is_mate():
                    evaluation = 100.0 if score.relative.mate() > 0 else -100.0
                else:
                    evaluation = score.relative.score() / 100.0
            else:
                evaluation = 0.0

            # Extract principal variation
            pv = [move.uci() for move in info.get("pv", [])]

            return EngineResponse(
                bestMove=best_move.uci(),
                evaluation=evaluation,
                depth=depth,
                pv=pv[:5]  # Return top 5 moves
            )

    except FileNotFoundError:
        # Stockfish not found - return random legal move
        board = chess.Board(fen)
        legal_moves = list(board.legal_moves)

        if not legal_moves:
            raise ValueError("No legal moves available")

        # Return first legal move as fallback
        return EngineResponse(
            bestMove=legal_moves[0].uci(),
            evaluation=0.0,
            depth=1,
            pv=[legal_moves[0].uci()]
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Engine error: {error_details}")
        raise Exception(f"Engine error: {str(e)}")
