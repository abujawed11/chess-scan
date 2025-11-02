# Quick Start Guide - Chess Piece Detection ML

Get up and running in 5 minutes!

## 1. Setup (5 minutes)

```bash
# Navigate to ml directory
cd scan-back/ml

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## 2. Create Dataset Structure (30 seconds)

```bash
python create_dataset_structure.py
```

This creates:
```
dataset/
├── empty/
├── white_pawn/
├── white_knight/
... (13 folders total)
```

## 3. Add Your Data (manual step)

Place your labeled square images in the appropriate folders:
- Minimum: 200 images per class
- Recommended: 400+ images per class
- Format: JPG or PNG
- Size: Any (will be resized to 128×128)

**Example:**
```
dataset/white_pawn/img001.png
dataset/white_pawn/img002.png
dataset/black_knight/img001.jpg
...
```

## 4. Verify Setup (1 minute)

```bash
python test_setup.py
```

This checks:
- ✅ All packages installed
- ✅ PyTorch working (CPU/GPU)
- ✅ Config valid
- ✅ Model can be created
- ✅ Dataset structure exists
- ✅ Images found

## 5. Train the Model (10-30 minutes)

```bash
python train.py
```

**What happens:**
- Loads and augments your images
- Trains MobileNetV3 for 20 epochs
- Shows progress bar and metrics per epoch
- Saves best model to `models/chesspiece_mobilenet.pth`
- Creates training curves and confusion matrix

**Expected output:**
```
Epoch 1/20 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

Epoch 1
┌────────────┬─────────┬─────────┐
│ Metric     │ Train   │ Val     │
├────────────┼─────────┼─────────┤
│ Loss       │ 0.4521  │ 0.3124  │
│ Accuracy   │ 85.23%  │ 89.12%  │
└────────────┴─────────┴─────────┘

💎 New best model saved! (acc: 89.12%)
```

**Target:** >90% validation accuracy

## 6. Test Inference (30 seconds)

```bash
python predict.py --image dataset/white_knight/img001.png
```

**Output:**
```
✅ Top Prediction: white_knight
📊 Confidence: 0.9823 (98.23%)

📋 Top 3 Predictions:
1. white_knight    0.9823 ████████████████████████
2. black_knight    0.0142 ████
3. white_bishop    0.0021 █
```

## 7. Export to ONNX (1 minute)

```bash
python export_onnx.py
```

Creates `models/chesspiece_mobilenet.onnx` for production use.

## 8. Use in FastAPI (integration)

```python
from ml.export_onnx import ONNXPredictor
import numpy as np

# Load once at startup
predictor = ONNXPredictor("ml/models/chesspiece_mobilenet.onnx")

# In your endpoint
@router.post("/detect-dl")
async def detect_with_dl(image: UploadFile):
    img = Image.open(io.BytesIO(await image.read()))
    img_array = np.array(img)

    predicted_class, confidence = predictor.predict(img_array)

    return {
        "class": predicted_class,
        "confidence": confidence
    }
```

## That's It! 🎉

You now have a trained deep learning model for chess piece detection.

---

## Common Issues

### "No images found in dataset"
→ Add images to `dataset/*/` folders (min 200 per class)

### "Out of memory"
→ Edit `config.yaml`: reduce `batch_size` to 16 or 8

### "Accuracy stuck at 70%"
→ Need more data (400+ per class) or train longer (30 epochs)

### "CUDA out of memory"
→ Use CPU: set `device: "cpu"` in config.yaml

### "ImportError: No module named..."
→ Activate venv: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Linux/Mac)

---

## Full Documentation

See [README.md](README.md) for complete documentation.

## Performance Tips

- **GPU:** 10x faster training (NVIDIA GPU with CUDA)
- **Batch size:** Increase if you have more RAM/VRAM
- **More data:** 800+ samples per class = 95%+ accuracy
- **Augmentation:** Already optimized in config.yaml
- **Model:** MobileNetV3 is fast; use ResNet18 for +2% accuracy

## Next Steps

1. ✅ Train model
2. ✅ Export to ONNX
3. ✅ Integrate with FastAPI
4. 📊 Collect more data from real usage
5. 🔄 Retrain periodically with new data
6. 🚀 Deploy and enjoy 90%+ accuracy!
