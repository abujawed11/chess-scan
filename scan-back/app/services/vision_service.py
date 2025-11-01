"""
Chess position recognition service.
Order: Template → Warp+Slice → Legacy (Hough) → AI model
"""
from __future__ import annotations

from PIL import Image
from app.models.chess_models import VisionResponse

BOARD_TO_FEN_AVAILABLE = None  # lazy flag


async def recognize_chess_position(
    image: Image.Image,
    rotation: int | None = None,
    use_template_matching: bool = True,
    is_starting_position: bool = False
) -> VisionResponse:
    try:
        print("🔍 Starting chess position recognition...")

        # 1) Template matching (if you have templates)
        if use_template_matching:
            try:
                from app.services.template_chess_detector import detect_chess_position_template, TEMPLATES
                print("🎨 Trying template matching…")
                if TEMPLATES or is_starting_position:
                    fen_tm = detect_chess_position_template(image, rotation=rotation,
                                                            is_starting_position=is_starting_position)
                    if fen_tm:
                        return VisionResponse(fen=fen_tm, confidence=0.95 if TEMPLATES else 0.85, detectedPieces=[])
            except Exception as e:
                print(f"⚠️ Template matching error: {e}")

        # 2) Warp + uniform slicing → your classifier → FEN
        try:
            print("🧭 Trying warp + uniform slicing…")
            from app.services.board_detector import detect_and_warp_board, extract_board_squares_warped
            from app.services.simple_chess_detector import squares_to_fen

            warped_pil, _ = detect_and_warp_board(image, out_size=800)
            if warped_pil is not None:
                squares = extract_board_squares_warped(warped_pil, padding=2)
                if squares and len(squares) == 64:
                    fen_ws = squares_to_fen(squares, rotation=rotation)
                    if fen_ws:
                        return VisionResponse(fen=fen_ws, confidence=0.70, detectedPieces=[])
        except Exception as e:
            print(f"⚠️ Warp+Slice error: {e}")

        # 3) Legacy shape-based (Hough)
        try:
            print("🎲 Trying legacy shape-based detection…")
            from app.services.simple_chess_detector import detect_chess_position_simple
            fen_legacy = detect_chess_position_simple(image, rotation=rotation)
            if fen_legacy:
                return VisionResponse(fen=fen_legacy, confidence=0.50, detectedPieces=[])
        except Exception as e:
            print(f"⚠️ Legacy error: {e}")

        # 4) AI model last (heavy)
        global BOARD_TO_FEN_AVAILABLE
        if BOARD_TO_FEN_AVAILABLE is None:
            try:
                print("📦 Loading board-to-fen model…")
                import sys, tf_keras
                sys.modules['keras'] = tf_keras
                sys.modules['keras.models'] = tf_keras.models
                sys.modules['keras.layers'] = tf_keras.layers
                from board_to_fen.predict import get_fen_from_image
                BOARD_TO_FEN_AVAILABLE = True
            except ImportError as e:
                BOARD_TO_FEN_AVAILABLE = False
                print(f"❌ board-to-fen unavailable: {e}")

        if BOARD_TO_FEN_AVAILABLE:
            try:
                from board_to_fen.predict import get_fen_from_image
                fen_ai = get_fen_from_image(image)
                if isinstance(fen_ai, str) and "can't find" not in fen_ai.lower() and "model can't" not in fen_ai.lower():
                    return VisionResponse(fen=fen_ai, confidence=0.85, detectedPieces=[])
            except Exception as e:
                print(f"⚠️ board-to-fen error: {e}")

        # fallback
        return VisionResponse(
            fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            confidence=0.0,
            detectedPieces=[]
        )
    except Exception as e:
        print(f"❌ recognize error: {e}")
        return VisionResponse(
            fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            confidence=0.0,
            detectedPieces=[]
        )
