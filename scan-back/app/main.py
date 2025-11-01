from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import vision, engine
import asyncio
import sys

# Fix for Windows subprocess issue with asyncio
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

app = FastAPI(title="Chess Scan API", version="1.0.0")

# CORS - Allow React Native app to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(vision.router, prefix="/api/vision", tags=["vision"])
app.include_router(engine.router, prefix="/api/engine", tags=["engine"])

@app.get("/")
async def root():
    return {"message": "Chess Scan API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok"}
