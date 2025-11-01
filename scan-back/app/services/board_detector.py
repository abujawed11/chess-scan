"""
Automatic chessboard detection and extraction using OpenCV.
Provides robust SB-corner + contour fallback warp, inner-trim,
and uniform 8x8 slicing.
"""
from __future__ import annotations

import cv2
import numpy as np
from PIL import Image


# --------------------------------------------------------------------------------------
# Existing helpers (kept for compatibility)
# --------------------------------------------------------------------------------------
def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Order points in clockwise order starting from top-left.
    Returns: [top-left, top-right, bottom-right, bottom-left]
    """
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]      # Top-left (smallest sum)
    rect[2] = pts[np.argmax(s)]      # Bottom-right (largest sum)
    rect[1] = pts[np.argmin(diff)]   # Top-right (smallest diff)
    rect[3] = pts[np.argmax(diff)]   # Bottom-left (largest diff)
    return rect


def detect_chessboard_corners(image: Image.Image):
    """
    Try to detect chessboard corners using classic 7x7 inner corners.
    (Kept for reference; our robust flow uses SB + fallback below.)
    """
    img_array = np.array(image)
    if img_array.ndim == 2:
        img_cv = img_array
        gray = img_cv
    else:
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

    print("🔍 Detecting chessboard corners (classic)...")
    ret, corners = cv2.findChessboardCorners(gray, (7, 7), None)
    if ret:
        print("✅ Found chessboard using classic corner detection")
        top_left = corners[0][0]
        top_right = corners[6][0]
        bottom_left = corners[42][0]
        bottom_right = corners[48][0]
        return np.array([top_left, top_right, bottom_right, bottom_left], dtype=np.float32)

    print("⚠️ Classic corner detection failed, trying contour fallback…")
    return detect_board_by_contours(img_cv, gray)


def detect_board_by_contours(img_cv, gray):
    """
    Detect chessboard by finding the largest square-like contour.
    Used by both the legacy path and the robust fallback below.
    """
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # multiple edge stacks
    edges1 = cv2.Canny(blurred, 30, 100)
    edges2 = cv2.Canny(blurred, 50, 150)
    edges3 = cv2.Canny(blurred, 100, 200)
    edges = cv2.bitwise_or(edges1, edges2)
    edges = cv2.bitwise_or(edges, edges3)

    # connect edges
    kernel = np.ones((3, 3), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        print("❌ No contours found")
        return None

    print(f"📊 Found {len(contours)} contours total")

    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:20]
    img_area = gray.shape[0] * gray.shape[1]

    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)
        peri = cv2.arcLength(contour, True)

        for epsilon_factor in [0.02, 0.03, 0.04, 0.05]:
            approx = cv2.approxPolyDP(contour, epsilon_factor * peri, True)
            if len(approx) == 4:
                if 0.05 * img_area < area < 0.95 * img_area:
                    print(f"✅ Quadrilateral contour #{i} area {area} ({area/img_area*100:.1f}%)")
                    corners = approx.reshape(4, 2).astype(np.float32)
                    return order_points(corners)

    print(f"❌ No suitable board contour found. Largest area: {cv2.contourArea(contours[0]) if contours else 0}")
    return None


def extract_and_transform_board(image: Image.Image, corners=None):
    """
    Legacy: extract the chessboard quadrilateral and warp to square.
    """
    if corners is None:
        corners = detect_chessboard_corners(image)
    if corners is None:
        print("❌ Could not detect chessboard")
        return None

    print(f"📐 Board corners detected at: {corners}")

    img_array = np.array(image)
    if img_array.ndim == 2:
        img_cv = img_array
    else:
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

    width_a = np.linalg.norm(corners[0] - corners[1])
    width_b = np.linalg.norm(corners[2] - corners[3])
    height_a = np.linalg.norm(corners[0] - corners[3])
    height_b = np.linalg.norm(corners[1] - corners[2])

    max_width = max(int(width_a), int(width_b))
    max_height = max(int(height_a), int(height_b))
    size = max(max_width, max_height)

    dst = np.array([[0, 0], [size - 1, 0], [size - 1, size - 1], [0, size - 1]], dtype=np.float32)
    M = cv2.getPerspectiveTransform(corners, dst)
    warped = cv2.warpPerspective(img_cv, M, (size, size))
    print(f"✅ Board extracted and transformed to {size}x{size} square")

    if warped.ndim == 2:
        return Image.fromarray(warped, mode="L")
    return Image.fromarray(cv2.cvtColor(warped, cv2.COLOR_BGR2RGB))


def enhance_for_digital_board(image: Image.Image):
    """
    Enhancement for photos of screens (legacy fallback).
    """
    img_array = np.array(image)
    if img_array.ndim == 2:
        img_cv = img_array
    else:
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

    print("🎨 Enhancing image for digital board recognition...")
    h0, w0 = img_cv.shape[:2]
    target = 800
    if max(w0, h0) > target:
        scale = target / max(w0, h0)
        img_cv = cv2.resize(img_cv, (int(w0*scale), int(h0*scale)), interpolation=cv2.INTER_LANCZOS4)
        print(f"  📏 Resized {w0}x{h0} → {img_cv.shape[1]}x{img_cv.shape[0]}")

    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY) if img_cv.ndim == 3 else img_cv.copy()
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    denoised = cv2.fastNlMeansDenoising(enhanced, h=10)
    kernel = np.array([[-1,-1,-1],[-1,9,-1],[-1,-1,-1]])
    sharpened = cv2.filter2D(denoised, -1, kernel)
    h, w = sharpened.shape
    size = min(h, w)
    y0 = (h - size)//2
    x0 = (w - size)//2
    squared = sharpened[y0:y0+size, x0:x0+size]
    print(f"  ✂️  Center-cropped to square {size}x{size}")
    return Image.fromarray(squared)


def preprocess_for_recognition(image: Image.Image, debug=True):
    """
    Legacy: try detect+warp, else enhance. Returns (image, success).
    """
    try:
        print("🎯 Starting automatic board detection (legacy)…")
        if debug:
            import tempfile, os
            p = os.path.join(tempfile.gettempdir(), "chess_input.jpg")
            image.save(p); print(f"💾 Debug input → {p}")

        extracted = extract_and_transform_board(image)
        if extracted is not None:
            if debug:
                import tempfile, os
                p = os.path.join(tempfile.gettempdir(), "chess_extracted.jpg")
                extracted.save(p); print(f"💾 Debug extracted → {p}")
            return extracted, True

        print("⚠️ Auto-detection failed, trying enhancement…")
        enhanced = enhance_for_digital_board(image)
        if debug:
            import tempfile, os
            p = os.path.join(tempfile.gettempdir(), "chess_enhanced.jpg")
            enhanced.save(p); print(f"💾 Debug enhanced → {p}")
        return enhanced, False
    except Exception as e:
        import traceback
        print(f"❌ Error in preprocessing: {e}")
        traceback.print_exc()
        return image, False


# --------------------------------------------------------------------------------------
# NEW robust warp + trimming + 8x8 slicing
# --------------------------------------------------------------------------------------
def _order_corners(pts: np.ndarray) -> np.ndarray:
    return order_points(pts)


def _warp(bgr: np.ndarray, corners4: np.ndarray, out_size: int = 800) -> np.ndarray:
    dst = np.array([[0,0],[out_size-1,0],[out_size-1,out_size-1],[0,out_size-1]], dtype=np.float32)
    M = cv2.getPerspectiveTransform(corners4, dst)
    return cv2.warpPerspective(bgr, M, (out_size, out_size), flags=cv2.INTER_CUBIC)


def _trim_inner_board(warped_bgr: np.ndarray, trim_ratio: float = 0.03) -> np.ndarray:
    """
    Trim a small border (e.g., red/wooden frame) so the tiles align perfectly.
    """
    H, W = warped_bgr.shape[:2]
    m = int(min(H, W) * trim_ratio)
    m = max(0, min(m, min(H, W)//10))
    return warped_bgr[m:H-m, m:W-m]


def detect_and_warp_board(image: Image.Image, out_size: int = 800):
    """
    Multi-strategy board detection:
      (A) SB inner-corner detector at several scales
      (B) Robust contour fallback with minAreaRect rescue
    Returns: (PIL warped image WITH inner trim, corners4 list) or (None, None)
    """
    import tempfile, os, traceback

    arr = np.array(image)
    if arr.ndim == 2:
        bgr = cv2.cvtColor(arr, cv2.COLOR_GRAY2BGR)
        gray = arr
    else:
        bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    dbg_dir = tempfile.gettempdir()
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    g = clahe.apply(gray)

    # ---------- (A) SB inner-corner detector ----------
    def sb_try(gray_in, bgr_in):
        pattern = (7,7)
        flags = (cv2.CALIB_CB_EXHAUSTIVE | cv2.CALIB_CB_ACCURACY)
        try:
            ok, corners = cv2.findChessboardCornersSB(gray_in, pattern, flags=flags)
        except Exception:
            return None
        if not ok or corners is None or corners.shape[0] != 49:
            return None
        corners = corners.squeeze(1).astype(np.float32)
        grid = corners.reshape(7,7,2)

        def fit_line(pts):
            vx, vy, x0, y0 = cv2.fitLine(pts.astype(np.float32), cv2.DIST_L2, 0, 0.01, 0.01)
            p1 = np.array([x0 - vx*10000, y0 - vy*10000]).ravel()
            p2 = np.array([x0 + vx*10000, y0 + vy*10000]).ravel()
            return p1, p2

        def intersect(p1, p2, p3, p4):
            A = np.array([p2 - p1, p3 - p4]).T
            b = (p3 - p1)
            t = np.linalg.lstsq(A, b, rcond=None)[0][0]
            return p1 + t*(p2 - p1)

        top, bot = grid[0,:,:], grid[-1,:,:]
        left, right = grid[:,0,:], grid[:,-1,:]
        t1,t2 = fit_line(top); b1,b2 = fit_line(bot)
        l1,l2 = fit_line(left); r1,r2 = fit_line(right)

        TL_in = intersect(t1,t2,l1,l2)
        TR_in = intersect(t1,t2,r1,r2)
        BR_in = intersect(b1,b2,r1,r2)
        BL_in = intersect(b1,b2,l1,l2)

        step_h = (TR_in - TL_in)/7.0
        step_v = (BL_in - TL_in)/7.0
        TL = TL_in - step_h - step_v
        TR = TR_in + step_h - step_v
        BR = BR_in + step_h + step_v
        BL = BL_in - step_h + step_v
        return _order_corners(np.array([TL,TR,BR,BL], dtype=np.float32))

    try:
        for scale in (1.0, 0.75, 1.25):
            if abs(scale-1.0) < 1e-6:
                g2, bgr2 = g, bgr
            else:
                bgr2 = cv2.resize(bgr, (int(bgr.shape[1]*scale), int(bgr.shape[0]*scale)), interpolation=cv2.INTER_CUBIC)
                g2 = cv2.resize(g, (bgr2.shape[1], bgr2.shape[0]), interpolation=cv2.INTER_CUBIC)
            c4 = sb_try(g2, bgr2)
            if c4 is not None:
                warped = _warp(bgr2, c4, out_size=out_size)
                warped = _trim_inner_board(warped, 0.03)
                cv2.imwrite(os.path.join(dbg_dir, "dbg_warp_sb.jpg"), warped)
                pil = Image.fromarray(cv2.cvtColor(warped, cv2.COLOR_BGR2RGB))
                return pil, c4.tolist()
    except Exception:
        print("⚠️ SB detector failed:\n" + traceback.format_exc())

    # ---------- (B) Contour fallback ----------
    try:
        den = cv2.bilateralFilter(g, 9, 50, 50)
        sharp = cv2.filter2D(den, -1, np.array([[-1,-1,-1],[-1,9,-1],[-1,-1,-1]]))
        thr = cv2.adaptiveThreshold(sharp, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY_INV, 31, 5)
        thr = cv2.morphologyEx(thr, cv2.MORPH_CLOSE, np.ones((5,5),np.uint8), iterations=2)

        cv2.imwrite(os.path.join(dbg_dir, "dbg_fallback_thr.png"), thr)
        contours,_ = cv2.findContours(thr, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None, None
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:30]
        H, W = g.shape[:2]
        area_img = H*W

        def quad_score(pts4):
            pts = pts4.reshape(-1,2).astype(np.float32)
            rect = _order_corners(pts)
            sides = [
                np.linalg.norm(rect[0]-rect[1]),
                np.linalg.norm(rect[1]-rect[2]),
                np.linalg.norm(rect[2]-rect[3]),
                np.linalg.norm(rect[3]-rect[0]),
            ]
            w = (sides[0] + sides[2]) / 2.0
            h = (sides[1] + sides[3]) / 2.0
            area = w*h
            area_score = min(area / (area_img*0.9), 1.0)
            ratio = max(w,h)/max(1.0,min(w,h))
            square_score = max(0.0, 1.0 - abs(ratio - 1.0))

            def angle(a,b,c):
                v1 = a-b; v2 = c-b
                cos = np.dot(v1,v2) / (np.linalg.norm(v1)*np.linalg.norm(v2)+1e-6)
                ang = np.degrees(np.arccos(np.clip(cos,-1,1)))
                return ang
            angs = [
                angle(rect[3],rect[0],rect[1]),
                angle(rect[0],rect[1],rect[2]),
                angle(rect[1],rect[2],rect[3]),
                angle(rect[2],rect[3],rect[0]),
            ]
            angle_score = 1.0 - min(np.mean([abs(a-90) for a in angs]) / 30.0, 1.0)
            return 0.5*area_score + 0.3*square_score + 0.2*angle_score, rect

        best = None
        best_score = -1
        for c in contours:
            if cv2.contourArea(c) < 0.02*area_img:
                continue
            peri = cv2.arcLength(c, True)
            for eps in (0.01, 0.015, 0.02, 0.03, 0.05):
                approx = cv2.approxPolyDP(c, eps*peri, True)
                if len(approx) == 4 and cv2.isContourConvex(approx):
                    score, rect = quad_score(approx)
                    if score > best_score:
                        best_score, best = score, rect

        if best is None:
            # rescue: minAreaRect on largest
            rect = cv2.minAreaRect(contours[0])
            box = cv2.boxPoints(rect).astype(np.float32)
            best = _order_corners(box)

        warped = _warp(bgr, best, out_size=out_size)
        warped = _trim_inner_board(warped, 0.03)
        cv2.imwrite(os.path.join(dbg_dir, "dbg_warp_fallback.jpg"), warped)
        pil = Image.fromarray(cv2.cvtColor(warped, cv2.COLOR_BGR2RGB))
        return pil, best.tolist()
    except Exception:
        import traceback
        print("⚠️ Contour fallback failed:\n" + traceback.format_exc())
        return None, None


def extract_board_squares_warped(warped_img: Image.Image, padding: int = 2) -> list[Image.Image]:
    """
    Slice the warped (square, top-down) board into 64 tiles.
    """
    arr = np.array(warped_img)
    H, W = arr.shape[:2]
    step = H // 8
    tiles = []
    for r in range(8):
        for c in range(8):
            y1 = max(0, r*step + padding)
            y2 = min(H, (r+1)*step - padding)
            x1 = max(0, c*step + padding)
            x2 = min(W, (c+1)*step - padding)
            if y2 > y1 and x2 > x1:
                tiles.append(Image.fromarray(arr[y1:y2, x1:x2]))
    return tiles
