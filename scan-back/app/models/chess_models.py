from pydantic import BaseModel
from typing import List, Optional

class VisionResponse(BaseModel):
    fen: str
    confidence: float
    detectedPieces: Optional[List[dict]] = None

class SquareData(BaseModel):
    position: str  # e.g., "a8", "b7"
    index: int  # 0-63
    imageData: str  # base64 encoded image
    isEmpty: bool
    detectedColor: Optional[str] = None  # 'w' or 'b' if piece detected

class ExtractSquaresResponse(BaseModel):
    squares: List[SquareData]
    boardDetected: bool
    message: str

class ManualFENRequest(BaseModel):
    pieces: List[dict]  # [{"position": "a8", "piece": "r"}, ...]

class EngineRequest(BaseModel):
    fen: str
    depth: int = 15
    multiPV: int = 1

class EngineResponse(BaseModel):
    bestMove: str
    evaluation: float
    depth: int
    pv: Optional[List[str]] = None
