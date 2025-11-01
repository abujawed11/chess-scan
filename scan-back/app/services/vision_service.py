"""
Chess position recognition service.

Uses simple grid-based detection for digital boards.
Falls back to board-to-fen if simple detection fails.
"""
from PIL import Image
from app.models.chess_models import VisionResponse
import tempfile
import os

# Don't load TensorFlow/board-to-fen at startup - only if needed
BOARD_TO_FEN_AVAILABLE = None  # Will check lazily

async def recognize_chess_position(image: Image.Image, rotation: int = None, use_template_matching: bool = True, is_starting_position: bool = False) -> VisionResponse:
    """
    Recognize chess position from image.

    Uses template matching first (best for digital boards).
    Falls back to shape-based then board-to-fen AI if needed.

    Args:
        image: PIL Image of the chess board
        rotation: 0 (white bottom), 90, 180 (black bottom), 270, or None (auto-detect)
        use_template_matching: If True, try template matching first
        is_starting_position: If True, use this image to extract piece templates

    Returns:
        VisionResponse with FEN notation and confidence
    """

    try:
        print("🔍 Starting chess position recognition...")

        # Method 1: board-to-fen AI (universal, pre-trained model)
        # This is lazy-loaded only when needed
        global BOARD_TO_FEN_AVAILABLE
        if BOARD_TO_FEN_AVAILABLE is None:
            try:
                print("📦 Loading board-to-fen AI model (first time only)...")
                import sys
                import tf_keras
                sys.modules['keras'] = tf_keras
                sys.modules['keras.models'] = tf_keras.models
                sys.modules['keras.layers'] = tf_keras.layers
                from board_to_fen.predict import get_fen_from_image
                BOARD_TO_FEN_AVAILABLE = True
                print("✅ board-to-fen loaded successfully")
            except ImportError as e:
                BOARD_TO_FEN_AVAILABLE = False
                print(f"❌ Could not load board-to-fen: {e}")

        if BOARD_TO_FEN_AVAILABLE:
            from board_to_fen.predict import get_fen_from_image
            import tempfile

            print("🤖 Trying board-to-fen AI detection...")

            # Try with ORIGINAL image (board-to-fen needs to detect board itself)
            try:
                print(f"  📸 Passing original image ({image.size}) to board-to-fen...")
                fen_result = get_fen_from_image(image)

                print(f"  🔍 board-to-fen returned: {repr(fen_result)}")

                if isinstance(fen_result, str):
                    # Check if it's a valid-looking FEN
                    if "can't find" not in fen_result.lower() and "model can't" not in fen_result.lower():
                        print(f"✅ board-to-fen succeeded: {fen_result}")
                        return VisionResponse(
                            fen=fen_result,
                            confidence=0.85,
                            detectedPieces=[]
                        )
                    else:
                        print(f"⚠️ board-to-fen failed: {fen_result}")
                else:
                    print(f"⚠️ board-to-fen returned unexpected type: {type(fen_result)}")
            except Exception as e:
                print(f"⚠️ board-to-fen error: {e}")
                import traceback
                traceback.print_exc()

        # Method 2: Template matching (for same-style boards)
        if use_template_matching:
            from app.services.template_chess_detector import detect_chess_position_template, TEMPLATES

            print("🎨 Trying template matching...")

            if TEMPLATES or is_starting_position:
                fen_result = detect_chess_position_template(image, rotation=rotation,
                                                             is_starting_position=is_starting_position)

                if fen_result:
                    confidence = 0.95 if TEMPLATES else 0.85
                    print(f"✅ Template matching succeeded: {fen_result}")
                    return VisionResponse(
                        fen=fen_result,
                        confidence=confidence,
                        detectedPieces=[]
                    )

        # Method 3: Shape-based detection (last resort)
        from app.services.simple_chess_detector import detect_chess_position_simple

        print("🎲 Trying shape-based detection...")
        fen_result = detect_chess_position_simple(image, rotation=rotation)

        if fen_result:
            print(f"✅ Shape detection succeeded: {fen_result}")
            return VisionResponse(
                fen=fen_result,
                confidence=0.50,
                detectedPieces=[]
            )

        # All methods failed - return starting position as fallback
        print("⚠️  All detection methods failed, returning starting position")
        return VisionResponse(
            fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            confidence=0.0,
            detectedPieces=[]
        )

    except Exception as e:
        print(f"❌ Error recognizing chess board: {e}")
        import traceback
        traceback.print_exc()

        # Fallback to starting position on error
        print("⚠️  Falling back to starting position")
        return VisionResponse(
            fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            confidence=0.0,
            detectedPieces=[]
        )
