from fastapi import APIRouter, HTTPException
from app.models.chess_models import EngineRequest, EngineResponse
from app.services.engine_service import analyze_position

router = APIRouter()

@router.post("/analyze", response_model=EngineResponse)
async def analyze(request: EngineRequest):
    """
    Analyze a chess position using Stockfish engine.
    Returns best move and evaluation.
    """
    try:
        result = await analyze_position(request.fen, request.depth, request.multiPV)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/health")
async def engine_health():
    return {"status": "ok", "service": "engine"}
