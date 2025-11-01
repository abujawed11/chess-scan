"""
Automatic chessboard detection and extraction using OpenCV.
"""
import cv2
import numpy as np
from PIL import Image


def detect_chessboard_corners(image: Image.Image):
    """
    Detect chessboard corners using OpenCV.

    Args:
        image: PIL Image of a photo containing a chessboard

    Returns:
        List of 4 corner points [(x,y), ...] or None if not found
    """
    # Convert PIL to OpenCV format
    img_array = np.array(image)
    if len(img_array.shape) == 2:  # Grayscale
        img_cv = img_array
        gray = img_cv
    else:  # Color
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

    print("🔍 Detecting chessboard corners...")

    # Try to find chessboard corners (7x7 internal corners for 8x8 board)
    ret, corners = cv2.findChessboardCorners(gray, (7, 7), None)

    if ret:
        print("✅ Found chessboard using corner detection!")
        # Get the 4 outer corners from the detected grid
        top_left = corners[0][0]
        top_right = corners[6][0]
        bottom_left = corners[42][0]
        bottom_right = corners[48][0]

        return np.array([top_left, top_right, bottom_right, bottom_left], dtype=np.float32)

    print("⚠️ Chessboard corners not found with pattern detection, trying contour method...")

    # Fallback: Try contour detection
    return detect_board_by_contours(img_cv, gray)


def detect_board_by_contours(img_cv, gray):
    """
    Detect chessboard by finding the largest square-like contour.
    """
    # Apply multiple preprocessing techniques
    # 1. Blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # 2. Try adaptive thresholding
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY, 11, 2)

    # 3. Apply edge detection with different parameters
    edges1 = cv2.Canny(blurred, 30, 100)
    edges2 = cv2.Canny(blurred, 50, 150)
    edges3 = cv2.Canny(blurred, 100, 200)

    # Combine edges
    edges = cv2.bitwise_or(edges1, edges2)
    edges = cv2.bitwise_or(edges, edges3)

    # Dilate to connect edges
    kernel = np.ones((3, 3), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=2)

    # Find contours
    contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        print("❌ No contours found")
        return None

    print(f"📊 Found {len(contours)} contours total")

    # Sort by area and get the largest ones
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:20]

    img_area = gray.shape[0] * gray.shape[1]

    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)

        # Approximate the contour to a polygon
        peri = cv2.arcLength(contour, True)

        # Try different epsilon values for approximation
        for epsilon_factor in [0.02, 0.03, 0.04, 0.05]:
            approx = cv2.approxPolyDP(contour, epsilon_factor * peri, True)

            # Check if it's a quadrilateral (4 corners)
            if len(approx) == 4:
                # Check if area is reasonable (5% to 95% of image)
                if 0.05 * img_area < area < 0.95 * img_area:
                    print(f"✅ Found quadrilateral contour #{i} with area: {area} ({area/img_area*100:.1f}% of image)")

                    # Reshape to (4, 2)
                    corners = approx.reshape(4, 2).astype(np.float32)

                    # Order the corners: top-left, top-right, bottom-right, bottom-left
                    corners = order_points(corners)

                    return corners

    print(f"❌ No suitable board contour found. Largest contour area: {cv2.contourArea(contours[0]) if contours else 0}")
    return None


def order_points(pts):
    """
    Order points in clockwise order starting from top-left.
    Returns: [top-left, top-right, bottom-right, bottom-left]
    """
    # Initialize ordered coordinates
    rect = np.zeros((4, 2), dtype=np.float32)

    # Sum and diff to find corners
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)

    rect[0] = pts[np.argmin(s)]      # Top-left (smallest sum)
    rect[2] = pts[np.argmax(s)]      # Bottom-right (largest sum)
    rect[1] = pts[np.argmin(diff)]   # Top-right (smallest diff)
    rect[3] = pts[np.argmax(diff)]   # Bottom-left (largest diff)

    return rect


def extract_and_transform_board(image: Image.Image, corners=None):
    """
    Extract the chessboard and apply perspective transform to make it square.

    Args:
        image: PIL Image
        corners: Optional pre-detected corners. If None, will auto-detect.

    Returns:
        PIL Image of the transformed square board, or None if detection failed
    """
    # Auto-detect corners if not provided
    if corners is None:
        corners = detect_chessboard_corners(image)

    if corners is None:
        print("❌ Could not detect chessboard")
        return None

    print(f"📐 Board corners detected at: {corners}")

    # Convert PIL to OpenCV
    img_array = np.array(image)
    if len(img_array.shape) == 2:
        img_cv = img_array
    else:
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

    # Calculate the width and height of the board
    # Use the maximum dimensions to avoid distortion
    width_a = np.linalg.norm(corners[0] - corners[1])
    width_b = np.linalg.norm(corners[2] - corners[3])
    height_a = np.linalg.norm(corners[0] - corners[3])
    height_b = np.linalg.norm(corners[1] - corners[2])

    max_width = max(int(width_a), int(width_b))
    max_height = max(int(height_a), int(height_b))

    # Use square dimensions (take the larger dimension)
    size = max(max_width, max_height)

    # Destination points for perspective transform (square board)
    dst = np.array([
        [0, 0],
        [size - 1, 0],
        [size - 1, size - 1],
        [0, size - 1]
    ], dtype=np.float32)

    # Calculate perspective transform matrix
    M = cv2.getPerspectiveTransform(corners, dst)

    # Apply perspective transform
    warped = cv2.warpPerspective(img_cv, M, (size, size))

    print(f"✅ Board extracted and transformed to {size}x{size} square")

    # Convert back to PIL Image (RGB)
    if len(warped.shape) == 2:
        result = Image.fromarray(warped, mode='L')
    else:
        result = Image.fromarray(cv2.cvtColor(warped, cv2.COLOR_BGR2RGB))

    return result


def enhance_for_digital_board(image: Image.Image):
    """
    Enhance image specifically for digital chess boards photographed from screens.
    """
    import cv2
    import numpy as np

    # Convert to OpenCV format
    img_array = np.array(image)
    if len(img_array.shape) == 2:
        img_cv = img_array
    else:
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

    print("🎨 Enhancing image for digital board recognition...")

    # 1. Resize to ensure it's reasonably sized
    height, width = img_cv.shape[:2]
    target_size = 800
    if width > target_size or height > target_size:
        scale = target_size / max(width, height)
        new_width = int(width * scale)
        new_height = int(height * scale)
        img_cv = cv2.resize(img_cv, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
        print(f"  📏 Resized from {width}x{height} to {new_width}x{new_height}")

    # 2. Convert to grayscale for processing
    if len(img_cv.shape) == 3:
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    else:
        gray = img_cv.copy()

    # 3. Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    print("  ✨ Applied contrast enhancement")

    # 4. Denoise
    denoised = cv2.fastNlMeansDenoising(enhanced, h=10)
    print("  🔇 Applied denoising")

    # 5. Sharpen the image
    kernel = np.array([[-1,-1,-1],
                       [-1, 9,-1],
                       [-1,-1,-1]])
    sharpened = cv2.filter2D(denoised, -1, kernel)
    print("  🔪 Applied sharpening")

    # 6. Ensure square aspect ratio by center cropping
    h, w = sharpened.shape
    size = min(h, w)
    start_y = (h - size) // 2
    start_x = (w - size) // 2
    squared = sharpened[start_y:start_y+size, start_x:start_x+size]
    print(f"  ✂️  Center-cropped to square: {size}x{size}")

    # Convert back to PIL Image
    result = Image.fromarray(squared)
    print("✅ Enhancement complete")

    return result


def preprocess_for_recognition(image: Image.Image, debug=True):
    """
    Main preprocessing pipeline: detect board and extract square image.

    Args:
        image: PIL Image of photo containing a chessboard
        debug: If True, saves debug images to temp directory

    Returns:
        Tuple: (processed_image, success)
            - processed_image: Square PIL Image of just the 64 squares, or original if failed
            - success: Boolean indicating if auto-detection worked
    """
    try:
        print("🎯 Starting automatic board detection...")

        # Save debug image of input
        if debug:
            import tempfile
            import os
            debug_dir = tempfile.gettempdir()
            debug_path = os.path.join(debug_dir, "chess_input.jpg")
            image.save(debug_path)
            print(f"💾 Debug: Input image saved to {debug_path}")

        # Try to detect and extract the board
        extracted = extract_and_transform_board(image)

        if extracted is not None:
            print("✅ Automatic board detection successful!")

            # Save debug image of output
            if debug:
                debug_path = os.path.join(debug_dir, "chess_extracted.jpg")
                extracted.save(debug_path)
                print(f"💾 Debug: Extracted board saved to {debug_path}")

            return extracted, True
        else:
            print("⚠️ Automatic detection failed, trying enhancement...")

            # If auto-detection failed, try enhancing the image
            # This works better for digital boards photographed from screens
            enhanced = enhance_for_digital_board(image)

            if debug:
                debug_path = os.path.join(debug_dir, "chess_enhanced.jpg")
                enhanced.save(debug_path)
                print(f"💾 Debug: Enhanced image saved to {debug_path}")

            print("✨ Using enhanced image")
            return enhanced, False

    except Exception as e:
        print(f"❌ Error in preprocessing: {e}")
        import traceback
        traceback.print_exc()
        return image, False


# --- NEW: robust warp-based board detection + slicing -------------------------
def _order_corners(pts: np.ndarray) -> np.ndarray:
    # pts: (4,2) -> TL, TR, BR, BL
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).ravel()
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    tr = pts[np.argmin(d)]
    bl = pts[np.argmax(d)]
    return np.array([tl, tr, br, bl], dtype=np.float32)

def _warp(bgr: np.ndarray, corners4: np.ndarray, out_size: int = 800) -> np.ndarray:
    dst = np.array([[0,0],[out_size-1,0],[out_size-1,out_size-1],[0,out_size-1]], dtype=np.float32)
    M = cv2.getPerspectiveTransform(corners4, dst)
    return cv2.warpPerspective(bgr, M, (out_size, out_size), flags=cv2.INTER_CUBIC)

def detect_and_warp_board(image: Image.Image, out_size: int = 800) -> Image.Image | None:
    """
    Tries (A) inner-corner grid detector → expand to outer corners → warp.
    Falls back to (B) your contour method.
    Returns a square, top-down PIL image of the board or None.
    """
    arr = np.array(image)
    if arr.ndim == 2:
        bgr = cv2.cvtColor(arr, cv2.COLOR_GRAY2BGR)
        gray = arr
    else:
        bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    # Light local contrast helps digital boards
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    g = clahe.apply(gray)

    # --- (A) SB inner-corner detector (7x7 inner corners for 8x8 squares)
    pattern_size = (7, 7)
    flags = (cv2.CALIB_CB_EXHAUSTIVE | cv2.CALIB_CB_ACCURACY)
    try:
        found, corners = cv2.findChessboardCornersSB(g, pattern_size, flags=flags)
    except Exception:
        found, corners = False, None

    if found and corners is not None and corners.shape[0] == pattern_size[0]*pattern_size[1]:
        corners = corners.squeeze(1).astype(np.float32)              # (49,2)
        grid = corners.reshape(pattern_size[1], pattern_size[0], 2)  # (7,7,2)

        # Fit lines to first/last rows & cols, intersect to get inner rectangle
        def fit_line(pts):
            [vx, vy, x0, y0] = cv2.fitLine(pts.astype(np.float32), cv2.DIST_L2, 0, 0.01, 0.01)
            p1 = np.array([x0 - vx*10000, y0 - vy*10000]).ravel()
            p2 = np.array([x0 + vx*10000, y0 + vy*10000]).ravel()
            return p1, p2

        def intersect(p1, p2, p3, p4):
            A = np.array([p2 - p1, p3 - p4]).T
            b = (p3 - p1)
            t = np.linalg.lstsq(A, b, rcond=None)[0][0]
            return p1 + t*(p2 - p1)

        top_row, bot_row = grid[0,:,:], grid[-1,:,:]
        left_col, right_col = grid[:,0,:], grid[:,-1,:]
        t1,t2 = fit_line(top_row)
        b1,b2 = fit_line(bot_row)
        l1,l2 = fit_line(left_col)
        r1,r2 = fit_line(right_col)

        TL_in = intersect(t1,t2,l1,l2)
        TR_in = intersect(t1,t2,r1,r2)
        BR_in = intersect(b1,b2,r1,r2)
        BL_in = intersect(b1,b2,l1,l2)

        # Expand inner rectangle by one square to reach true outer board
        step_h = (TR_in - TL_in) / 7.0
        step_v = (BL_in - TL_in) / 7.0
        TL = TL_in - step_h - step_v
        TR = TR_in + step_h - step_v
        BR = BR_in + step_h + step_v
        BL = BL_in - step_h + step_v

        corners4 = _order_corners(np.array([TL, TR, BR, BL], dtype=np.float32))
        warped = _warp(bgr, corners4, out_size=out_size)
        return Image.fromarray(cv2.cvtColor(warped, cv2.COLOR_BGR2RGB))

    # --- (B) Fallback: your contour method
    corners = detect_board_by_contours(bgr, g)  # reuses your existing function
    if corners is not None:
        corners4 = _order_corners(corners)
        warped = _warp(bgr, corners4, out_size=out_size)
        return Image.fromarray(cv2.cvtColor(warped, cv2.COLOR_BGR2RGB))

    return None

def extract_board_squares_warped(warped_img: Image.Image, padding: int = 2) -> list[Image.Image]:
    """
    Warped (square, top-down) → 64 equal tiles, row-major (top to bottom).
    """
    arr = np.array(warped_img)
    H, W = arr.shape[:2]
    step = H // 8
    out = []
    for r in range(8):
        for c in range(8):
            y1 = r*step + padding
            y2 = (r+1)*step - padding
            x1 = c*step + padding
            x2 = (c+1)*step - padding
            tile = arr[y1:y2, x1:x2]
            if tile.size > 0:
                out.append(Image.fromarray(tile))
    return out
# -------------------------------------------------------------------------------
