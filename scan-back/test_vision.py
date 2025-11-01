#!/usr/bin/env python
"""Test script to verify board-to-fen integration."""
from PIL import Image
import io
import asyncio

# Try importing the vision service
try:
    from app.services.vision_service import recognize_chess_position
    print("✓ Vision service imported successfully")
except Exception as e:
    print(f"✗ Failed to import vision service: {e}")
    exit(1)

# Try importing board-to-fen
try:
    from board_to_fen import get_fen_from_image
    print("✓ board-to-fen library available")
except ImportError:
    print("✗ board-to-fen library not available")

async def test_vision():
    """Test the vision recognition service."""
    # Create a simple test image (blank white image)
    img = Image.new('RGB', (800, 800), color='white')

    print("\nTesting vision recognition with blank image...")
    try:
        result = await recognize_chess_position(img)
        print(f"✓ Recognition completed")
        print(f"  FEN: {result.fen}")
        print(f"  Confidence: {result.confidence}")
    except Exception as e:
        print(f"✗ Recognition failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_vision())
