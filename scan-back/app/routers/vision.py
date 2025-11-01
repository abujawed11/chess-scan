from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
from app.models.chess_models import VisionResponse, ExtractSquaresResponse, SquareData, ManualFENRequest
from app.services.vision_service import recognize_chess_position
import io
from PIL import Image
from typing import Optional
import base64

router = APIRouter()

@router.post("/recognize", response_model=VisionResponse)
async def recognize_board(
    image: UploadFile = File(...),
    rotation: Optional[int] = Form(None),
    use_template_matching: Optional[bool] = Form(True),
    is_starting_position: Optional[bool] = Form(False)
):
    """
    Recognize chess position from an image.
    Returns FEN notation and confidence score.

    Args:
        image: Chess board image file
        rotation: Board rotation in degrees (0, 90, 180, 270) or None for auto-detect
                  0 = white on bottom, 180 = black on bottom
        use_template_matching: Enable template matching (recommended for digital boards)
        is_starting_position: Mark this image as starting position to extract piece templates
    """
    try:
        # Read image
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))

        print(f"📥 Parameters: rotation={rotation}, template_matching={use_template_matching}, "
              f"is_starting={is_starting_position}")

        # Process image and recognize position
        result = await recognize_chess_position(
            img,
            rotation=rotation,
            use_template_matching=use_template_matching,
            is_starting_position=is_starting_position
        )

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")

@router.post("/extract-squares", response_model=ExtractSquaresResponse)
async def extract_squares(image: UploadFile = File(...)):
    """
    Extract 64 squares from chess board for manual identification.
    Returns base64-encoded images of each square.
    """
    try:
        from app.services.simple_chess_detector import detect_grid_lines, extract_board_squares, classify_square

        # Read image
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))

        print("🔍 Extracting squares for visual editor...")

        # Detect grid and extract squares
        h_lines, v_lines = detect_grid_lines(img)

        if h_lines is None or v_lines is None:
            return ExtractSquaresResponse(
                squares=[],
                boardDetected=False,
                message="Could not detect chess board grid"
            )

        squares = extract_board_squares(img, h_lines, v_lines)

        if not squares or len(squares) != 64:
            return ExtractSquaresResponse(
                squares=[],
                boardDetected=False,
                message="Could not extract 64 squares"
            )

        # Convert each square to base64
        square_data_list = []

        for i, square_img in enumerate(squares):
            # Get chess notation (a8, b8, ..., h1)
            rank = 8 - (i // 8)
            file = chr(ord('a') + (i % 8))
            position = f"{file}{rank}"

            # Detect if empty and color
            square_type, color = classify_square(square_img)
            is_empty = (square_type == 'empty')

            # Convert to base64
            buffered = io.BytesIO()
            square_img.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode()

            square_data = SquareData(
                position=position,
                index=i,
                imageData=img_base64,
                isEmpty=is_empty,
                detectedColor=color if not is_empty else None
            )
            square_data_list.append(square_data)

        print(f"✅ Extracted {len(square_data_list)} squares")

        return ExtractSquaresResponse(
            squares=square_data_list,
            boardDetected=True,
            message=f"Successfully extracted {len(square_data_list)} squares"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@router.post("/generate-fen-from-pieces", response_model=VisionResponse)
async def generate_fen_from_pieces(request: ManualFENRequest = Body(...)):
    """
    Generate FEN from manually identified pieces.
    """
    try:
        # Initialize empty board
        board = ['.' for _ in range(64)]

        # Place pieces
        for piece_data in request.pieces:
            position = piece_data['position']  # e.g., "a8"
            piece = piece_data['piece']  # e.g., "r", "N", "P"

            # Convert position to index
            file = ord(position[0]) - ord('a')
            rank = int(position[1])
            index = (8 - rank) * 8 + file

            board[index] = piece

        # Convert to FEN
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

        fen = '/'.join(fen_rows) + ' w KQkq - 0 1'

        return VisionResponse(
            fen=fen,
            confidence=1.0,  # 100% - manually verified
            detectedPieces=[]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FEN generation failed: {str(e)}")


@router.get("/health")
async def vision_health():
    return {"status": "ok", "service": "vision"}
