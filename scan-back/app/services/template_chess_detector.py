"""
Template-based chess piece detection for digital boards.
Works by matching piece images against templates using normalized cross-correlation.
"""
import cv2
import numpy as np
from PIL import Image
import os
from pathlib import Path


# Template cache
TEMPLATES = {}
TEMPLATE_SIZE = (32, 32)  # Standard size for templates


def load_templates_from_starting_position(squares):
    """
    Extract templates from a starting position.

    Args:
        squares: List of 64 PIL Images from starting position

    Returns:
        Dictionary mapping piece symbols to template images
    """
    global TEMPLATES

    # Starting position layout (from white's perspective, row 0 = rank 8)
    starting_layout = [
        'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r',  # Black back rank
        'p', 'p', 'p', 'p', 'p', 'p', 'p', 'p',  # Black pawns
        '.', '.', '.', '.', '.', '.', '.', '.',  # Empty
        '.', '.', '.', '.', '.', '.', '.', '.',  # Empty
        '.', '.', '.', '.', '.', '.', '.', '.',  # Empty
        '.', '.', '.', '.', '.', '.', '.', '.',  # Empty
        'P', 'P', 'P', 'P', 'P', 'P', 'P', 'P',  # White pawns
        'R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R',  # White back rank
    ]

    print("🎨 Extracting piece templates from starting position...")

    templates = {}
    piece_counts = {}

    for i, piece in enumerate(starting_layout):
        if piece == '.':
            continue

        # Get the square image
        square_img = squares[i]

        # Resize to standard template size
        square_resized = square_img.resize(TEMPLATE_SIZE, Image.Resampling.LANCZOS)

        # Convert to grayscale numpy array
        template_gray = np.array(square_resized.convert('L'))

        # Store template (use first occurrence of each piece type)
        if piece not in templates:
            templates[piece] = template_gray
            piece_counts[piece] = 1
            print(f"  ✅ Extracted template for {piece}")
        else:
            piece_counts[piece] += 1

    TEMPLATES = templates
    print(f"  📦 Loaded {len(templates)} unique piece templates")
    return templates


def classify_piece_by_template(square_img: Image.Image, templates=None, debug=False):
    """
    Classify a piece using template matching.

    Args:
        square_img: PIL Image of a chess square
        templates: Dict of piece templates (will use global if None)
        debug: Print debug information

    Returns:
        Tuple of (piece_symbol, confidence)
        piece_symbol is like 'P', 'p', 'R', 'r', etc. or '.' for empty
        confidence is 0.0 to 1.0
    """
    if templates is None:
        templates = TEMPLATES

    if not templates:
        if debug:
            print("  ⚠️ No templates loaded, cannot classify")
        return ('.', 0.0)

    # Resize to template size
    square_resized = square_img.resize(TEMPLATE_SIZE, Image.Resampling.LANCZOS)
    square_gray = np.array(square_resized.convert('L'))

    # Try matching against each template
    best_match = '.'
    best_score = 0.5  # Higher threshold - need at least 50% correlation
    second_best_score = 0.0

    scores = {}
    for piece, template in templates.items():
        # Use normalized cross-correlation
        result = cv2.matchTemplate(square_gray, template, cv2.TM_CCOEFF_NORMED)
        max_val = result[0][0]
        scores[piece] = max_val

        if max_val > best_score:
            second_best_score = best_score
            best_score = max_val
            best_match = piece
        elif max_val > second_best_score:
            second_best_score = max_val

    if debug:
        # Show top 5 matches sorted by score
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        print(f"    Top matches:")
        for piece, score in sorted_scores[:5]:
            marker = "✓" if piece == best_match else " "
            print(f"      {marker} {piece}: {score:.3f}")

    # Require a clear winner (at least 10% better than second place)
    if best_match != '.' and (best_score - second_best_score) < 0.1:
        if debug:
            print(f"  ⚠️ Ambiguous match (diff={best_score - second_best_score:.3f}), defaulting to empty")
        return ('.', 0.0)

    if debug:
        print(f"  → Best match: {best_match} (confidence: {best_score:.3f})")

    return (best_match, best_score)


def detect_empty_square(square_img: Image.Image):
    """
    Determine if a square is empty using edge detection.

    Returns:
        True if empty, False if has a piece
    """
    # Convert to numpy array
    square = np.array(square_img)

    # Convert to grayscale if needed
    if len(square.shape) == 3:
        gray = cv2.cvtColor(square, cv2.COLOR_RGB2GRAY)
    else:
        gray = square

    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Edge detection
    edges = cv2.Canny(blurred, 30, 100)

    # Count edge pixels
    edge_pixel_count = np.sum(edges > 0)
    total_pixels = edges.size
    edge_ratio = edge_pixel_count / total_pixels

    # Empty squares have very few edges (< 2%)
    return edge_ratio < 0.02


def squares_to_fen_template(squares, rotation=None, use_starting_position_templates=False):
    """
    Convert 64 squares to FEN using template matching.

    Args:
        squares: List of 64 PIL Images
        rotation: Board rotation (0, 90, 180, 270, or None for auto-detect)
        use_starting_position_templates: If True, assume first image is starting position

    Returns:
        FEN string
    """
    print("🎯 Analyzing squares with template matching...")

    if not squares or len(squares) != 64:
        print("❌ Invalid number of squares")
        return None

    # If we should use starting position templates and don't have any yet
    if use_starting_position_templates and not TEMPLATES:
        load_templates_from_starting_position(squares)

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

        # First check if empty
        is_empty = detect_empty_square(square_img)

        # Debug first 16 squares
        debug = (i < 16)

        if debug:
            # Convert square index to chess notation
            rank = 8 - (i // 8)
            file = chr(ord('a') + (i % 8))
            square_name = f"{file}{rank}"
            print(f"\n  Square {i} ({square_name}):")
            print(f"    Empty detection: {is_empty}")

        if is_empty:
            if debug:
                print(f"    → Classified as EMPTY")
            board.append('.')
            continue

        # Use template matching
        piece, confidence = classify_piece_by_template(square_img, debug=debug)

        board.append(piece)

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


def detect_chess_position_template(image: Image.Image, rotation=None, is_starting_position=False):
    """
    Main function: Detect chess position using template matching.

    Args:
        image: PIL Image of a chess board
        rotation: Board rotation (0, 90, 180, 270, or None for auto-detect)
        is_starting_position: If True, use this image to extract templates

    Returns:
        FEN string or None if detection failed
    """
    try:
        from app.services.simple_chess_detector import detect_grid_lines, extract_board_squares

        print("🎲 Starting template-based detection...")

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

        # Step 3: Classify using templates
        fen = squares_to_fen_template(squares, rotation=rotation,
                                       use_starting_position_templates=is_starting_position)

        return fen

    except Exception as e:
        print(f"❌ Error in template detection: {e}")
        import traceback
        traceback.print_exc()
        return None
