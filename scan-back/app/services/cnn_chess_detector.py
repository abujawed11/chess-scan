"""
CNN-based chess piece detection using transfer learning.
Works with any chess board theme/style.
"""
import numpy as np
from PIL import Image
import os
from pathlib import Path


# Global model cache
CNN_MODEL = None
CLASS_NAMES = ['bb', 'bk', 'bn', 'bp', 'bq', 'br', 'empty', 'wb', 'wk', 'wn', 'wp', 'wq', 'wr']

# Mapping from class names to FEN symbols
CLASS_TO_FEN = {
    'bb': 'b',  # Black bishop
    'bk': 'k',  # Black king
    'bn': 'n',  # Black knight
    'bp': 'p',  # Black pawn
    'bq': 'q',  # Black queen
    'br': 'r',  # Black rook
    'empty': '.',
    'wb': 'B',  # White bishop
    'wk': 'K',  # White king
    'wn': 'N',  # White knight
    'wp': 'P',  # White pawn
    'wq': 'Q',  # White queen
    'wr': 'R',  # White rook
}


def load_cnn_model():
    """
    Load the CNN model for piece classification.
    Uses lazy loading - only loads when first needed.

    Returns:
        Keras model
    """
    global CNN_MODEL

    if CNN_MODEL is not None:
        return CNN_MODEL

    print("🤖 Loading CNN model for chess piece recognition...")

    try:
        import tensorflow as tf
        from tensorflow import keras
        from tensorflow.keras.applications import MobileNetV2
        from tensorflow.keras import layers

        # Build a simple model using transfer learning
        # MobileNetV2 is lightweight and fast
        base_model = MobileNetV2(
            input_shape=(64, 64, 3),
            include_top=False,
            weights='imagenet'
        )
        base_model.trainable = False  # Freeze base model

        # Add classification head
        model = keras.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dropout(0.2),
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(len(CLASS_NAMES), activation='softmax')
        ])

        # Try to load pre-trained weights
        weights_path = Path(__file__).parent.parent / 'models' / 'chess_cnn_weights.h5'

        if weights_path.exists():
            print(f"  ✅ Loading weights from {weights_path}")
            model.load_weights(str(weights_path))
        else:
            print(f"  ⚠️ No pre-trained weights found at {weights_path}")
            print(f"  ⚠️ Model will use ImageNet features only (may have lower accuracy)")

        CNN_MODEL = model
        print("  ✅ CNN model loaded successfully")
        return model

    except ImportError as e:
        print(f"  ❌ Failed to load CNN model: {e}")
        return None


def preprocess_square_for_cnn(square_img: Image.Image):
    """
    Preprocess a square image for CNN input.

    Args:
        square_img: PIL Image of chess square

    Returns:
        Preprocessed numpy array
    """
    # Resize to 64x64
    square_resized = square_img.resize((64, 64), Image.Resampling.LANCZOS)

    # Convert to RGB if needed
    if square_resized.mode != 'RGB':
        square_resized = square_resized.convert('RGB')

    # Convert to numpy array and normalize
    img_array = np.array(square_resized, dtype=np.float32)

    # Normalize to [-1, 1] (MobileNetV2 preprocessing)
    img_array = (img_array / 127.5) - 1.0

    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)

    return img_array


def classify_piece_cnn(square_img: Image.Image, model=None, debug=False):
    """
    Classify a chess piece using CNN.

    Args:
        square_img: PIL Image of chess square
        model: CNN model (will load if None)
        debug: Print debug information

    Returns:
        Tuple of (fen_symbol, confidence)
    """
    if model is None:
        model = load_cnn_model()

    if model is None:
        if debug:
            print("  ❌ CNN model not available")
        return ('.', 0.0)

    # Preprocess image
    img_array = preprocess_square_for_cnn(square_img)

    # Predict
    predictions = model.predict(img_array, verbose=0)[0]

    # Get top prediction
    top_idx = np.argmax(predictions)
    top_class = CLASS_NAMES[top_idx]
    top_confidence = predictions[top_idx]

    # Convert to FEN
    fen_symbol = CLASS_TO_FEN[top_class]

    if debug:
        # Show top 3 predictions
        top_3_idx = np.argsort(predictions)[-3:][::-1]
        print(f"    Top 3 predictions:")
        for idx in top_3_idx:
            class_name = CLASS_NAMES[idx]
            confidence = predictions[idx]
            marker = "✓" if idx == top_idx else " "
            print(f"      {marker} {class_name}: {confidence:.3f}")
        print(f"  → Classified as: {fen_symbol} (confidence: {top_confidence:.3f})")

    return (fen_symbol, float(top_confidence))


def squares_to_fen_cnn(squares, rotation=None):
    """
    Convert 64 squares to FEN using CNN.

    Args:
        squares: List of 64 PIL Images
        rotation: Board rotation (0, 90, 180, 270, or None)

    Returns:
        FEN string
    """
    print("🤖 Analyzing squares with CNN...")

    if not squares or len(squares) != 64:
        print("❌ Invalid number of squares")
        return None

    # Load model once
    model = load_cnn_model()

    if model is None:
        print("❌ CNN model not available")
        return None

    board = []

    for i in range(64):
        # Apply rotation to square index
        if rotation == 0 or rotation is None:
            idx = i
        elif rotation == 90:
            row, col = i // 8, i % 8
            idx = col * 8 + (7 - row)
        elif rotation == 180:
            idx = 63 - i
        elif rotation == 270:
            row, col = i // 8, i % 8
            idx = (7 - col) * 8 + row
        else:
            idx = i

        square_img = squares[idx]

        # Debug first 16 squares
        debug = (i < 16)

        if debug:
            # Convert square index to chess notation
            rank = 8 - (i // 8)
            file = chr(ord('a') + (i % 8))
            square_name = f"{file}{rank}"
            print(f"\n  Square {i} ({square_name}):")

        # Classify using CNN
        fen_symbol, confidence = classify_piece_cnn(square_img, model=model, debug=debug)

        board.append(fen_symbol)

    # Convert board array to FEN
    fen_rows = []
    for row in range(8):
        fen_row = ""
        empty_count = 0

        for col in range(8):
            idx = row * 8 + col
            piece = board[idx]

            if piece == '.':
                empty_count += 1
            else:
                if empty_count > 0:
                    fen_row += str(empty_count)
                    empty_count = 0
                fen_row += piece

        if empty_count > 0:
            fen_row += str(empty_count)

        fen_rows.append(fen_row)

    # Join rows with /
    fen = '/'.join(fen_rows)

    # Add default turn and castling info
    fen += ' w KQkq - 0 1'

    print(f"✅ Generated FEN: {fen}")
    return fen


def detect_chess_position_cnn(image: Image.Image, rotation=None):
    """
    Main function: Detect chess position using CNN.

    Args:
        image: PIL Image of a chess board
        rotation: Board rotation (0, 90, 180, 270, or None for auto-detect)

    Returns:
        FEN string or None if detection failed
    """
    try:
        from app.services.simple_chess_detector import detect_grid_lines, extract_board_squares

        print("🤖 Starting CNN-based detection...")

        # Step 1: Detect grid lines
        h_lines, v_lines = detect_grid_lines(image)

        if h_lines is None or v_lines is None:
            print("⚠️  Grid detection failed")
            return None

        # Step 2: Extract 64 squares
        squares = extract_board_squares(image, h_lines, v_lines)

        if squares is None:
            print("⚠️  Square extraction failed")
            return None

        # Step 3: Classify using CNN
        fen = squares_to_fen_cnn(squares, rotation=rotation)

        return fen

    except Exception as e:
        print(f"❌ Error in CNN detection: {e}")
        import traceback
        traceback.print_exc()
        return None
