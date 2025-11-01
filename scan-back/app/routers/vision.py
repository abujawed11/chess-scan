from __future__ import annotations

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
from typing import Optional
from PIL import Image
import io, base64, traceback

from app.models.chess_models import (
    VisionResponse,
    ExtractSquaresResponse,
    SquareData,
    ManualFENRequest,
)
from app.services.vision_service import recognize_chess_position

router = APIRouter()


@router.post("/recognize", response_model=VisionResponse)
async def recognize_board(
    image: UploadFile = File(...),
    rotation: Optional[int] = Form(None),
    use_template_matching: Optional[bool] = Form(True),
    is_starting_position: Optional[bool] = Form(False),
):
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")

        print(f"📥 rotation={rotation}, template={use_template_matching}, starting={is_starting_position}")

        result = await recognize_chess_position(
            img,
            rotation=rotation,
            use_template_matching=use_template_matching,
            is_starting_position=is_starting_position,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")


@router.post("/extract-squares", response_model=ExtractSquaresResponse)
async def extract_squares(image: UploadFile = File(...)):
    """
    Extract 64 tiles using warp+slice; also return the warped board image so
    the UI can overlay the grid correctly.
    """
    try:
        from app.services.board_detector import detect_and_warp_board, extract_board_squares_warped
        from app.services.simple_chess_detector import classify_square

        contents = await image.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")

        print("🔍 Extracting squares for visual editor (warp-based)…")

        warped_pil, corners = detect_and_warp_board(img, out_size=800)
        if warped_pil is None:
            return ExtractSquaresResponse(
                squares=[],
                boardDetected=False,
                message="Could not detect the chessboard (warp returned None)",
            )

        squares = extract_board_squares_warped(warped_pil, padding=2)
        if not squares or len(squares) != 64:
            return ExtractSquaresResponse(
                squares=[],
                boardDetected=False,
                message=f"Could not extract 64 squares (got {len(squares) if squares else 0})",
            )

        # pack warped image
        buf = io.BytesIO()
        warped_pil.save(buf, format="PNG")
        warped_b64 = base64.b64encode(buf.getvalue()).decode()
        w, h = warped_pil.size

        # squares metadata
        square_data_list = []
        for i, square_img in enumerate(squares):
            rank = 8 - (i // 8)
            file = chr(ord('a') + (i % 8))
            position = f"{file}{rank}"

            square_type, color = classify_square(square_img)
            is_empty = (square_type == 'empty')

            b = io.BytesIO()
            square_img.save(b, format="PNG")
            img64 = base64.b64encode(b.getvalue()).decode()

            square_data_list.append(SquareData(
                position=position,
                index=i,
                imageData=img64,
                isEmpty=is_empty,
                detectedColor=color if not is_empty else None
            ))

        print(f"✅ Extracted {len(square_data_list)} squares")
        return ExtractSquaresResponse(
            squares=square_data_list,
            boardDetected=True,
            message="ok",
            boardImageData=warped_b64,
            warpedWidth=w,
            warpedHeight=h,
            corners=corners,
        )
    except Exception:
        print("❌ /extract-squares crashed:\n" + traceback.format_exc())
        return ExtractSquaresResponse(
            squares=[],
            boardDetected=False,
            message="Extraction failed (see server logs for traceback).",
        )


@router.post("/generate-fen-from-pieces", response_model=VisionResponse)
async def generate_fen_from_pieces(request: ManualFENRequest = Body(...)):
    """
    Generate FEN from manually identified pieces.
    """
    try:
        board = ['.' for _ in range(64)]
        for piece_data in request.pieces:
            position = piece_data['position']  # e.g., "a8"
            piece = piece_data['piece']        # e.g., "r", "N", "P"
            file = ord(position[0]) - ord('a')
            rank = int(position[1])
            index = (8 - rank) * 8 + file
            board[index] = piece

        fen_rows = []
        for row in range(8):
            fen_row = ""
            empty = 0
            for col in range(8):
                idx = row * 8 + col
                p = board[idx]
                if p == '.':
                    empty += 1
                else:
                    if empty:
                        fen_row += str(empty)
                        empty = 0
                    fen_row += p
            if empty:
                fen_row += str(empty)
            fen_rows.append(fen_row)

        fen = '/'.join(fen_rows) + ' w KQkq - 0 1'
        return VisionResponse(fen=fen, confidence=1.0, detectedPieces=[])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FEN generation failed: {str(e)}")


@router.get("/health")
async def vision_health():
    return {"status": "ok", "service": "vision"}
