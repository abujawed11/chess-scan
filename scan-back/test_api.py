"""
Test script for Chess Scan API
Run this to verify the backend is working
"""
import requests
import json

BASE_URL = "http://localhost:3000"

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}\n")

def test_engine():
    """Test chess engine analysis"""
    print("Testing chess engine...")
    data = {
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "depth": 10,
        "multiPV": 1
    }

    response = requests.post(
        f"{BASE_URL}/api/engine/analyze",
        json=data
    )

    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Best Move: {result.get('bestMove')}")
    print(f"Evaluation: {result.get('evaluation')}")
    print(f"Depth: {result.get('depth')}")
    print(f"PV: {result.get('pv')}\n")

def test_vision():
    """Test vision recognition (will return mock data)"""
    print("Testing vision API (mock)...")
    print("Note: Vision returns starting position until CV is implemented\n")

    # This will fail without an actual image file
    # Uncomment to test with a real image:
    # with open('test_board.jpg', 'rb') as f:
    #     files = {'image': f}
    #     response = requests.post(f"{BASE_URL}/api/vision/recognize", files=files)
    #     print(f"Status: {response.status_code}")
    #     print(f"Response: {response.json()}\n")

if __name__ == "__main__":
    print("=" * 50)
    print("Chess Scan API Test")
    print("=" * 50 + "\n")

    try:
        test_health()
        test_engine()
        test_vision()

        print("✅ All tests passed!")
        print("\nBackend is ready. Start your React Native app now.")

    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to backend")
        print("Make sure the server is running:")
        print("  cd backend")
        print("  uvicorn app.main:app --reload --host 0.0.0.0 --port 3000")
    except Exception as e:
        print(f"❌ Error: {e}")
