# Chess Piece Detection - Deep Learning Module

Complete deep learning pipeline for training a CNN-based chess piece classifier using PyTorch and MobileNetV3.

## Overview

This module provides:
- **Transfer learning** with MobileNetV3-Small (pretrained on ImageNet)
- **Data augmentation** with albumentations
- **Training pipeline** with progress tracking, early stopping, and model checkpointing
- **Inference scripts** for single-square and batch prediction
- **ONNX export** for production deployment in FastAPI

**Target accuracy:** >90% on validation set after ~10 epochs

## Dataset Structure

Organize your dataset as follows:

```
dataset/
├── empty/
│   ├── img001.png
│   ├── img002.png
│   └── ...
├── white_pawn/
│   ├── img001.png
│   └── ...
├── white_knight/
├── white_bishop/
├── white_rook/
├── white_queen/
├── white_king/
├── black_pawn/
├── black_knight/
├── black_bishop/
├── black_rook/
├── black_queen/
└── black_king/
```

Each folder should contain square crop images (JPG/PNG) around 64×64 to 128×128 pixels.

## Installation

### 1. Create a virtual environment (recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. GPU Support (optional but recommended)

For CUDA 11.8:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

For CUDA 12.1:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

## Configuration

Edit `config.yaml` to customize:
- Dataset paths and split ratios
- Image size and augmentation parameters
- Model architecture (MobileNetV3, ResNet18, etc.)
- Training hyperparameters (epochs, batch size, learning rate)
- Output directories

Key parameters:
```yaml
dataset:
  root_dir: "./dataset"
  train_split: 0.8

training:
  epochs: 20
  batch_size: 32
  learning_rate: 0.0001

model:
  name: "mobilenet_v3_small"
  num_classes: 13
```

## Usage

### 1. Train the Model

**Basic training:**
```bash
python train.py
```

**With custom config:**
```bash
python train.py --config my_config.yaml
```

**Resume from checkpoint:**
```bash
python train.py --checkpoint checkpoints/checkpoint_epoch_10.pth
```

**Expected output:**
```
🔧 Using device: cuda

📊 Loaded 5200 samples from 13 classes

📈 Class distribution:
  empty               : 800 samples
  white_pawn          : 400 samples
  white_knight        : 320 samples
  ...

✅ Train samples: 4160
✅ Val samples: 1040

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Epoch 1/20 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

Epoch 1
┌────────────────┬───────────┬───────────┐
│ Metric         │ Train     │ Val       │
├────────────────┼───────────┼───────────┤
│ Loss           │ 0.4521    │ 0.3124    │
│ Accuracy       │ 85.23%    │ 89.12%    │
│ Learning Rate  │ 0.000100  │ —         │
└────────────────┴───────────┴───────────┘

💎 New best model saved! (acc: 89.12%)
...
```

Training outputs:
- `models/chesspiece_mobilenet.pth` - Best model checkpoint
- `checkpoints/checkpoint_epoch_N.pth` - Periodic checkpoints
- `logs/training_curves.png` - Loss and accuracy plots
- `logs/confusion_matrix.png` - Confusion matrix visualization

### 2. Evaluate Only

```bash
python train.py --eval-only --checkpoint models/chesspiece_mobilenet.pth
```

### 3. Single Image Inference

```bash
python predict.py --image path/to/square.png
```

**Example output:**
```
==================================================
🎯 Prediction Results
==================================================

✅ Top Prediction: white_knight
📊 Confidence: 0.9823 (98.23%)

📋 Top 3 Predictions:
--------------------------------------------------
1. white_knight        0.9823 █████████████████████████████
2. black_knight        0.0142 ████
3. white_bishop        0.0021 █
==================================================
```

**Programmatic usage:**
```python
from predict import ChessPiecePredictor

predictor = ChessPiecePredictor(
    model_path="./models/chesspiece_mobilenet.pth"
)

# Single prediction
predicted_class, confidence = predictor.classify_square("square.png")
print(f"Predicted: {predicted_class} ({confidence:.2%})")

# Batch prediction (all 64 squares)
results = predictor.predict_batch(square_images, batch_size=32)
for i, (cls, conf) in enumerate(results):
    print(f"Square {i}: {cls} ({conf:.2%})")
```

### 4. Export to ONNX

```bash
python export_onnx.py
```

**With custom paths:**
```bash
python export_onnx.py \
    --model models/chesspiece_mobilenet.pth \
    --output models/chesspiece_mobilenet.onnx \
    --opset 14
```

**Expected output:**
```
============================================================
🔧 Exporting PyTorch model to ONNX
============================================================

📥 Loading model from: models/chesspiece_mobilenet.pth
✅ Model loaded successfully

📤 Exporting to ONNX (opset version 14)...
✅ ONNX model exported to: models/chesspiece_mobilenet.onnx

🔧 Simplifying ONNX model...
✅ ONNX model simplified successfully

🔍 Verifying ONNX model...
✅ ONNX model is valid

📊 ONNX Model Info:
------------------------------------------------------------
  Input: input
    Shape: ['dynamic', 3, 128, 128]
    Type: 1
  Output: output
    Shape: ['dynamic', 13]
    Type: 1
  File size: 5.82 MB
------------------------------------------------------------
```

**ONNX inference:**
```python
from export_onnx import ONNXPredictor
import numpy as np

predictor = ONNXPredictor("models/chesspiece_mobilenet.onnx")

# Predict from numpy array (RGB image)
image = np.array(...)  # Shape: (H, W, 3)
predicted_class, confidence = predictor.predict(image)
```

## Integration with FastAPI

Add to your `vision.py` router:

```python
from ml.export_onnx import ONNXPredictor

# Load model once at startup
onnx_predictor = ONNXPredictor("ml/models/chesspiece_mobilenet.onnx")

@router.post("/detect-pieces-dl")
async def detect_pieces_with_dl(request: dict = Body(...)):
    """Detect pieces using deep learning model."""
    squares = request.get('squares', [])

    results = []
    for sq in squares:
        img_b64 = sq['imageData']
        img_bytes = base64.b64decode(img_b64)
        img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        img_array = np.array(img)

        predicted_class, confidence = onnx_predictor.predict(img_array)

        # Map class to FEN notation
        if predicted_class == 'empty':
            piece = None
        else:
            color, piece_type = predicted_class.split('_')
            # white_pawn -> 'P', black_knight -> 'n', etc.
            piece_letter = piece_type[0].upper()  # P, N, B, R, Q, K
            piece = piece_letter if color == 'white' else piece_letter.lower()

        results.append({
            'position': sq['position'],
            'detectedPiece': piece,
            'confidence': confidence
        })

    return {'squares': results}
```

## Performance

**Expected results on a well-balanced dataset:**

| Metric | Value |
|--------|-------|
| Validation Accuracy | >90% |
| Inference Time (CPU, single square) | <15ms |
| Inference Time (CPU, 64 squares) | <200ms |
| Inference Time (GPU, 64 squares) | <50ms |
| Model Size (PyTorch) | ~6 MB |
| Model Size (ONNX) | ~6 MB |

**Per-class accuracy** (typical):
- Empty squares: 95-98%
- Pawns: 92-95%
- Rooks: 94-97%
- Knights: 88-93% (hardest due to complex shape)
- Bishops: 90-94%
- Queens: 91-95%
- Kings: 93-96%

## Improving Accuracy

If accuracy is below 90%:

1. **Collect more data**: Aim for 500+ samples per class
2. **Balance dataset**: Ensure similar samples per class
3. **Increase augmentation**: Add more rotation, brightness variations
4. **Train longer**: Try 30-50 epochs with early stopping
5. **Adjust learning rate**: Try 5e-5 or 2e-4
6. **Use a larger model**: Try `mobilenet_v3_large` or `resnet18`
7. **Fine-tune more layers**: Unfreeze earlier layers in the backbone

## Troubleshooting

### Out of Memory (OOM)
- Reduce `batch_size` in config (try 16 or 8)
- Use `mobilenet_v3_small` instead of larger models
- Reduce `num_workers` to 0 or 2

### Low accuracy
- Check class distribution (run `python dataset_loader.py`)
- Visualize augmentations to ensure they're not too aggressive
- Verify dataset labels are correct
- Try training for more epochs

### Slow training
- Use GPU (CUDA) if available
- Increase `batch_size` (if memory allows)
- Set `num_workers=4` or higher

### ONNX export fails
- Update PyTorch: `pip install --upgrade torch`
- Use `--opset 11` instead of 14
- Skip simplification: `--no-simplify`

## File Structure

```
ml/
├── config.yaml              # Training configuration
├── dataset_loader.py        # Dataset and augmentation
├── train.py                 # Training script
├── predict.py               # Inference script
├── export_onnx.py           # ONNX export
├── requirements.txt         # Dependencies
├── README.md               # This file
├── dataset/                # Your training data
│   ├── empty/
│   ├── white_pawn/
│   └── ...
├── models/                 # Saved models
│   ├── chesspiece_mobilenet.pth
│   └── chesspiece_mobilenet.onnx
├── checkpoints/           # Training checkpoints
│   └── checkpoint_epoch_10.pth
└── logs/                  # Training logs and plots
    ├── training_curves.png
    └── confusion_matrix.png
```

## Advanced: Custom Model Architecture

To use a different backbone, edit `train.py`:

```python
from torchvision.models import resnet18, ResNet18_Weights

# In ChessPieceModel.__init__:
weights = ResNet18_Weights.IMAGENET1K_V1
self.backbone = resnet18(weights=weights)

# Replace final layer
in_features = self.backbone.fc.in_features
self.backbone.fc = nn.Linear(in_features, num_classes)
```

Then update `config.yaml`:
```yaml
model:
  name: "resnet18"
```

## License

This ML module is part of the chess-scan project.

## Next Steps

1. **Train the model** on your dataset
2. **Evaluate** on validation set
3. **Export to ONNX** for production
4. **Integrate** with FastAPI backend
5. **Deploy** and monitor performance
6. **Iterate**: Collect edge cases and retrain

For questions or issues, please check the main project documentation.
