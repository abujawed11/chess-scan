from pydantic import BaseModel
from typing import List, Optional, Tuple, Dict

class VisionResponse(BaseModel):
    fen: str
    confidence: float
    # default to [] so clients don't get `null`
    detectedPieces: List[Dict] = []

class SquareData(BaseModel):
    position: str           # e.g., "a8"
    index: int              # 0..63
    imageData: str          # base64 tile PNG
    isEmpty: bool
    detectedColor: Optional[str] = None  # 'w' | 'b' | None

class ExtractSquaresResponse(BaseModel):
    squares: List[SquareData]
    boardDetected: bool
    # make message optional (success may not need a message)
    message: Optional[str] = None

    # NEW: all optional → backward compatible
    boardImageData: Optional[str] = None   # base64 PNG of warped, trimmed board
    warpedWidth: Optional[int] = None
    warpedHeight: Optional[int] = None
    corners: Optional[List[Tuple[float, float]]] = None  # original 4 source points

class ManualFENRequest(BaseModel):
    pieces: List[Dict]  # [{"position": "a8", "piece": "r"}, ...]

class EngineRequest(BaseModel):
    fen: str
    depth: int = 15
    multiPV: int = 1

class EngineResponse(BaseModel):
    bestMove: str
    evaluation: float
    depth: int
    pv: Optional[List[str]] = None

