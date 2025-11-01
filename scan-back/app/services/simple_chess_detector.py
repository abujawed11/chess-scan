"""
Simple grid-based chess position detector for digital boards.
Works by detecting the 8x8 grid and analyzing each square.
"""
import cv2
import numpy as np
from PIL import Image
import io


def detect_grid_lines(image: Image.Image):
    """
    Detect horizontal and vertical grid lines in a chess board.

    Returns:
        (horizontal_lines, vertical_lines) - Lists of line positions
    """
    # Convert to OpenCV format
    img_array = np.array(image)
    if len(img_array.shape) == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_array

    print("🔍 Detecting grid lines...")

    # Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)

    # Edge detection
    edges = cv2.Canny(enhanced, 50, 150, apertureSize=3)

    # Detect lines using Hough Transform
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100,
                            minLineLength=100, maxLineGap=10)

    if lines is None:
        print("❌ No lines detected")
        return None, None

    # Separate horizontal and vertical lines
    horizontal_lines = []
    vertical_lines = []

    height, width = gray.shape

    for line in lines:
        x1, y1, x2, y2 = line[0]

        # Calculate angle
        if x2 - x1 == 0:
            angle = 90
        else:
            angle = abs(np.degrees(np.arctan((y2 - y1) / (x2 - x1))))

        # Horizontal lines (angle close to 0)
        if angle < 10:
            y_avg = (y1 + y2) // 2
            horizontal_lines.append(y_avg)
        # Vertical lines (angle close to 90)
        elif angle > 80:
            x_avg = (x1 + x2) // 2
            vertical_lines.append(x_avg)

    # Remove duplicate lines (close to each other)
    def remove_duplicates(lines, threshold=20):
        if not lines:
            return []
        lines = sorted(lines)
        filtered = [lines[0]]
        for line in lines[1:]:
            if line - filtered[-1] > threshold:
                filtered.append(line)
        return filtered

    horizontal_lines = remove_duplicates(horizontal_lines)
    vertical_lines = remove_duplicates(vertical_lines)

    print(f"  📏 Found {len(horizontal_lines)} horizontal lines")
    print(f"  📏 Found {len(vertical_lines)} vertical lines")

    return horizontal_lines, vertical_lines


def extract_board_squares(image: Image.Image, h_lines, v_lines):
    """
    Extract 64 individual square images from the board.

    Returns:
        List of 64 PIL Images (row by row, a8 to h1)
    """
    if h_lines is None or v_lines is None:
        return None

    # Need exactly 9 lines for 8 squares (borders + dividers)
    if len(h_lines) < 2 or len(v_lines) < 2:
        print("❌ Not enough grid lines detected")
        return None

    print("✂️  Extracting 64 squares...")

    # Convert to numpy array
    img_array = np.array(image)

    # Sort lines
    h_lines = sorted(h_lines)
    v_lines = sorted(v_lines)

    # If we have exactly 9 lines, use them all
    # Otherwise, interpolate 8 equal segments between first and last
    def get_segments(lines, num_segments=8):
        if len(lines) == num_segments + 1:
            return lines
        else:
            # Use first and last line, interpolate the rest
            start = lines[0]
            end = lines[-1]
            return [int(start + i * (end - start) / num_segments) for i in range(num_segments + 1)]

    h_segments = get_segments(h_lines)
    v_segments = get_segments(v_lines)

    squares = []

    # Extract each square (from top-left to bottom-right)
    for row in range(8):
        for col in range(8):
            y1 = h_segments[row]
            y2 = h_segments[row + 1]
            x1 = v_segments[col]
            x2 = v_segments[col + 1]

            # Add small padding to avoid grid lines
            padding = 2
            y1 += padding
            y2 -= padding
            x1 += padding
            x2 -= padding

            square = img_array[y1:y2, x1:x2]

            if square.size > 0:
                square_img = Image.fromarray(square)
                squares.append(square_img)

    print(f"✅ Extracted {len(squares)} squares")
    return squares


def classify_square(square_img: Image.Image):
    """
    Classify what's in a square: empty, white piece, or black piece.
    Uses multiple detection features for better accuracy.

    Returns:
        ('empty', None) or ('piece', 'color') where color is 'w' or 'b'
    """
    from scipy.stats import entropy

    # Convert to numpy array
    square = np.array(square_img)

    # Convert to grayscale if needed
    if len(square.shape) == 3:
        gray = cv2.cvtColor(square, cv2.COLOR_RGB2GRAY)
    else:
        gray = square

    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Feature 1: Canny edge detection
    edges = cv2.Canny(blurred, 30, 100)
    edge_pixel_count = np.sum(edges > 0)
    total_pixels = edges.size
    edge_ratio = edge_pixel_count / total_pixels

    # Feature 2: Variance (already computed)
    variance = np.var(gray)

    # Feature 3: Standard deviation
    std_dev = np.std(gray)

    # Feature 4: Laplacian variance (alternative edge detection)
    laplacian = cv2.Laplacian(blurred, cv2.CV_64F)
    laplacian_var = laplacian.var()

    # Feature 5: Entropy (complexity measure)
    # Calculate histogram and normalize
    hist, _ = np.histogram(gray, bins=32, range=(0, 256))
    hist = hist / hist.sum()
    img_entropy = entropy(hist + 1e-7)  # Add small value to avoid log(0)

    # Feature 6: Center region analysis
    # Pieces typically have more detail in center, empty squares are uniform
    h, w = gray.shape
    center_h, center_w = h // 4, w // 4
    center_region = gray[center_h:3*center_h, center_w:3*center_w]
    edge_region_top = gray[0:center_h, :]
    edge_region_bottom = gray[3*center_h:, :]

    center_mean = np.mean(center_region) if center_region.size > 0 else np.mean(gray)
    edge_mean = (np.mean(edge_region_top) + np.mean(edge_region_bottom)) / 2
    center_edge_diff = abs(center_mean - edge_mean)

    # Feature 7: Sobel edge detection (horizontal + vertical)
    sobelx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
    sobel_magnitude = np.sqrt(sobelx**2 + sobely**2)
    sobel_mean = np.mean(sobel_magnitude)

    # Scoring system: combine multiple features
    piece_score = 0

    # Score based on edges (weight: 3)
    if edge_ratio > 0.04:
        piece_score += 3
    elif edge_ratio > 0.025:
        piece_score += 2
    elif edge_ratio > 0.015:
        piece_score += 1

    # Score based on variance (weight: 2)
    if variance > 600:
        piece_score += 2
    elif variance > 400:
        piece_score += 1

    # Score based on laplacian variance (weight: 2)
    if laplacian_var > 300:
        piece_score += 2
    elif laplacian_var > 150:
        piece_score += 1

    # Score based on entropy (weight: 2)
    if img_entropy > 3.5:
        piece_score += 2
    elif img_entropy > 3.0:
        piece_score += 1

    # Score based on center-edge difference (weight: 1)
    if center_edge_diff > 20:
        piece_score += 1

    # Score based on sobel (weight: 1)
    if sobel_mean > 25:
        piece_score += 1

    # Decision threshold: if score >= 4, it's a piece
    # Max score is 11, we need at least 4 to consider it a piece
    if piece_score < 4:
        return ('empty', None)

    # It's a piece - determine color
    # Calculate statistics on the original grayscale image
    mean_brightness = np.mean(gray)

    # Also check the darkest pixels
    dark_pixels = np.sum(gray < 80)
    dark_ratio = dark_pixels / total_pixels

    # Black pieces have more dark pixels and lower mean brightness
    if dark_ratio > 0.15 or mean_brightness < 120:
        return ('piece', 'b')
    else:
        return ('piece', 'w')


def classify_piece_type(square_img: Image.Image, color: str, debug=False):
    """
    Classify the type of piece (P, N, B, R, Q, K) using shape analysis.

    Uses contour analysis, aspect ratios, and pixel distribution patterns.
    """
    # Convert to numpy array
    square = np.array(square_img)

    # Convert to grayscale if needed
    if len(square.shape) == 3:
        gray = cv2.cvtColor(square, cv2.COLOR_RGB2GRAY)
    else:
        gray = square

    # Enhance contrast for better piece extraction
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4,4))
    enhanced = clahe.apply(gray)

    # Blur to reduce noise and connect piece parts
    blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)

    # Adaptive thresholding works better for digital boards with gradients
    if color == 'b':
        # Black pieces - use adaptive threshold
        binary = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                        cv2.THRESH_BINARY_INV, 11, 2)
    else:
        # White pieces - use adaptive threshold
        binary = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                        cv2.THRESH_BINARY, 11, 2)

    # Morphological operations to fill holes and connect components
    kernel = np.ones((3, 3), np.uint8)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)

    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return 'P'  # Default to pawn

    # Get the largest contour (the piece)
    main_contour = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(main_contour)

    # If area is too small, likely empty or error
    if area < 50:
        return 'P'

    # Calculate bounding rectangle
    x, y, w, h = cv2.boundingRect(main_contour)

    # Sanity check: reject crazy aspect ratios (likely detection errors)
    if w == 0 or h == 0:
        return 'P'

    aspect_ratio_check = h / w
    if aspect_ratio_check > 3.0 or aspect_ratio_check < 0.3:
        # Crazy aspect ratio - probably bad detection, default to pawn
        if debug:
            print(f"    ⚠️  Rejecting bad aspect ratio: {aspect_ratio_check:.2f}, defaulting to PAWN")
        return 'P'

    # Feature 1: Aspect ratio (height/width)
    aspect_ratio = h / w if w > 0 else 1.0

    # Feature 2: Extent (contour area / bounding box area)
    bbox_area = w * h
    extent = area / bbox_area if bbox_area > 0 else 0

    # Feature 3: Vertical center of mass (where is the piece's weight?)
    M = cv2.moments(main_contour)
    if M['m00'] != 0:
        cy = M['m01'] / M['m00']
        # Normalize to 0-1 (top to bottom)
        vertical_com = cy / gray.shape[0]
    else:
        vertical_com = 0.5

    # Feature 4: Top half vs bottom half mass distribution
    top_half = binary[:binary.shape[0]//2, :]
    bottom_half = binary[binary.shape[0]//2:, :]
    top_mass = np.sum(top_half > 0)
    bottom_mass = np.sum(bottom_half > 0)
    mass_ratio = top_mass / (bottom_mass + 1)  # +1 to avoid division by zero

    # Feature 5: Convex hull - how much of the contour is convex?
    hull = cv2.convexHull(main_contour)
    hull_area = cv2.contourArea(hull)
    solidity = area / hull_area if hull_area > 0 else 0

    # Optional debug output
    if debug:
        print(f"    Features: aspect={aspect_ratio:.2f}, extent={extent:.2f}, "
              f"mass_ratio={mass_ratio:.2f}, solidity={solidity:.2f}, vcom={vertical_com:.2f}")

    # Classification rules based on piece characteristics for digital boards:
    # Digital pieces are more uniform, so we need more relaxed thresholds

    # ROOK: Rectangular/tower shape, moderate extent, nearly square aspect
    # Rooks have a very blocky, solid shape
    if 0.85 < aspect_ratio < 1.05 and 0.55 < extent < 0.70 and solidity > 0.70:
        if debug: print(f"    → Classified as ROOK")
        return 'R'

    # KNIGHT: Very irregular shape (low solidity), distinctive outline
    # Knights have the most irregular, asymmetric shape
    if solidity < 0.65:
        if debug: print(f"    → Classified as KNIGHT")
        return 'N'

    # BISHOP: Pointed top, moderate solidity, narrow
    # Bishops have a pointed outline
    if 0.85 < aspect_ratio < 1.05 and extent < 0.60 and 0.50 < solidity < 0.75:
        if debug: print(f"    → Classified as BISHOP")
        return 'B'

    # QUEEN: Tall crown, spiky top (low solidity), tall
    if aspect_ratio > 1.05 and solidity < 0.75 and mass_ratio > 0.7:
        if debug: print(f"    → Classified as QUEEN")
        return 'Q'

    # KING: Cross on top, taller, high top mass
    if aspect_ratio > 1.05 and mass_ratio > 0.7 and extent < 0.70:
        if debug: print(f"    → Classified as KING")
        return 'K'

    # PAWN: Small, rounded, bottom-heavy or default case
    # Most pieces that don't fit other categories are pawns
    if debug: print(f"    → Classified as PAWN (default)")
    return 'P'


def detect_board_orientation(squares):
    """
    Detect which side is white by analyzing piece distribution.

    Returns:
        rotation: 0 (white bottom), 180 (black bottom), or None (auto-detect failed)
    """
    print("🧭 Detecting board orientation...")

    # Count white and black pieces in bottom 2 rows vs top 2 rows
    bottom_white = 0
    bottom_black = 0
    top_white = 0
    top_black = 0

    for i in range(64):
        square_type, color = classify_square(squares[i])
        if square_type == 'piece':
            row = i // 8
            if row >= 6:  # Bottom 2 rows
                if color == 'w':
                    bottom_white += 1
                else:
                    bottom_black += 1
            elif row <= 1:  # Top 2 rows
                if color == 'w':
                    top_white += 1
                else:
                    top_black += 1

    print(f"  📊 Top rows: {top_white} white, {top_black} black")
    print(f"  📊 Bottom rows: {bottom_white} white, {bottom_black} black")

    # If bottom has more white pieces, white is on bottom (normal orientation)
    # If top has more white pieces, board is flipped
    if bottom_white > top_white and bottom_black < top_black:
        print("  ✅ Detected: White on bottom (normal)")
        return 0
    elif top_white > bottom_white and top_black < bottom_black:
        print("  ✅ Detected: White on top (flipped 180°)")
        return 180
    else:
        print("  ⚠️ Could not auto-detect orientation")
        return None


def squares_to_fen(squares, rotation=None):
    """
    Convert 64 classified squares to FEN notation.

    Args:
        squares: List of 64 PIL Images
        rotation: 0 (white bottom), 90, 180 (black bottom), 270, or None (auto-detect)

    Returns:
        FEN string
    """
    print("🎯 Analyzing squares and generating FEN...")

    if not squares or len(squares) != 64:
        print("❌ Invalid number of squares")
        return None

    # Auto-detect orientation if not specified
    if rotation is None:
        rotation = detect_board_orientation(squares)
        if rotation is None:
            print("  ⚠️ Defaulting to 0° rotation (white on bottom)")
            rotation = 0

    print(f"🔄 Using rotation: {rotation}°")

    board = []

    # Save first row of squares for debugging
    import tempfile
    import os
    debug_dir = tempfile.gettempdir()

    print(f"💾 Saving debug squares to: {debug_dir}")

    for i in range(64):
        # Apply rotation to square index
        if rotation == 0:
            idx = i
        elif rotation == 90:
            # Rotate 90° clockwise: row becomes col, col becomes 7-row
            row, col = i // 8, i % 8
            idx = col * 8 + (7 - row)
        elif rotation == 180:
            # Rotate 180°: reverse order
            idx = 63 - i
        elif rotation == 270:
            # Rotate 270° clockwise (90° counter-clockwise)
            row, col = i // 8, i % 8
            idx = (7 - col) * 8 + row
        else:
            idx = i

        square_img = squares[idx]
        square_type, color = classify_square(square_img)

        if square_type == 'empty':
            board.append('.')
        else:
            # Save first 16 squares for inspection
            if i < 16:
                debug_path = os.path.join(debug_dir, f"square_{i:02d}_{color}.png")
                square_img.save(debug_path)
                print(f"  💾 Saved square {i} to: {debug_path}")

            # Detect piece type with debug enabled for first few pieces
            debug = (i < 16)  # Debug first 16 squares (first 2 rows)
            piece_type = classify_piece_type(square_img, color, debug=debug)

            # Combine color and type
            if color == 'w':
                piece = piece_type.upper()
            else:
                piece = piece_type.lower()

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


def detect_chess_position_simple(image: Image.Image, rotation=None):
    """
    Main function: Detect chess position from digital board image.

    Args:
        image: PIL Image of a chess board
        rotation: 0 (white bottom), 90, 180 (black bottom), 270, or None (auto-detect)

    Returns:
        FEN string or None if detection failed
    """
    try:
        print("🎲 Starting simple grid-based detection...")

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

        # Step 3: Classify squares and generate FEN
        fen = squares_to_fen(squares, rotation=rotation)

        return fen

    except Exception as e:
        print(f"❌ Error in simple detection: {e}")
        import traceback
        traceback.print_exc()
        return None
