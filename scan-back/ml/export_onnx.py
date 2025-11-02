"""
Export trained PyTorch model to ONNX format for production inference.
ONNX provides faster inference and cross-platform compatibility.
"""

import argparse
from pathlib import Path

import torch
import onnx
import onnxruntime as ort
from PIL import Image
import numpy as np

from train import ChessPieceModel
from dataset_loader import load_config
from predict import ChessPiecePredictor


def export_to_onnx(
    model_path: str,
    output_path: str,
    config_path: str = "./config.yaml",
    opset_version: int = 14,
    simplify: bool = True
):
    """
    Export PyTorch model to ONNX format.

    Args:
        model_path: Path to trained PyTorch model (.pth)
        output_path: Path to save ONNX model (.onnx)
        config_path: Path to config file
        opset_version: ONNX opset version
        simplify: Whether to simplify the ONNX model
    """
    config = load_config(config_path)

    print(f"\n{'='*60}")
    print("🔧 Exporting PyTorch model to ONNX")
    print(f"{'='*60}\n")

    # Load model
    print(f"📥 Loading model from: {model_path}")
    device = torch.device('cpu')  # Always export on CPU

    model = ChessPieceModel(
        num_classes=config['model']['num_classes'],
        dropout=0.0,  # No dropout for inference
        pretrained=False
    ).to(device)

    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    print("✅ Model loaded successfully")

    # Create dummy input
    img_size = config['image']['size']
    dummy_input = torch.randn(1, 3, img_size, img_size).to(device)

    # Export to ONNX
    print(f"\n📤 Exporting to ONNX (opset version {opset_version})...")

    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=opset_version,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )

    print(f"✅ ONNX model exported to: {output_path}")

    # Simplify ONNX model (optional but recommended)
    if simplify:
        try:
            import onnxsim
            print("\n🔧 Simplifying ONNX model...")

            onnx_model = onnx.load(output_path)
            simplified_model, check = onnxsim.simplify(onnx_model)

            if check:
                onnx.save(simplified_model, output_path)
                print("✅ ONNX model simplified successfully")
            else:
                print("⚠️  Simplification check failed, using original model")
        except ImportError:
            print("⚠️  onnx-simplifier not installed, skipping simplification")
            print("   Install with: pip install onnx-simplifier")

    # Verify ONNX model
    print("\n🔍 Verifying ONNX model...")
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    print("✅ ONNX model is valid")

    # Print model info
    print_onnx_info(output_path)

    # Test inference
    test_onnx_inference(output_path, config)

    print(f"\n{'='*60}")
    print("✅ Export completed successfully!")
    print(f"{'='*60}\n")


def print_onnx_info(onnx_path: str):
    """Print ONNX model information."""
    onnx_model = onnx.load(onnx_path)

    print("\n📊 ONNX Model Info:")
    print("-" * 60)

    # Input info
    for inp in onnx_model.graph.input:
        shape = [dim.dim_value if dim.dim_value > 0 else 'dynamic' for dim in inp.type.tensor_type.shape.dim]
        print(f"  Input: {inp.name}")
        print(f"    Shape: {shape}")
        print(f"    Type: {inp.type.tensor_type.elem_type}")

    # Output info
    for out in onnx_model.graph.output:
        shape = [dim.dim_value if dim.dim_value > 0 else 'dynamic' for dim in out.type.tensor_type.shape.dim]
        print(f"  Output: {out.name}")
        print(f"    Shape: {shape}")
        print(f"    Type: {out.type.tensor_type.elem_type}")

    # Model size
    file_size = Path(onnx_path).stat().st_size / (1024 * 1024)
    print(f"  File size: {file_size:.2f} MB")
    print("-" * 60)


def test_onnx_inference(onnx_path: str, config: dict):
    """Test ONNX inference with dummy input."""
    print("\n🧪 Testing ONNX inference...")

    # Create ONNX Runtime session
    session = ort.InferenceSession(onnx_path)

    # Create dummy input
    img_size = config['image']['size']
    dummy_input = np.random.randn(1, 3, img_size, img_size).astype(np.float32)

    # Run inference
    outputs = session.run(None, {'input': dummy_input})

    print(f"  Input shape: {dummy_input.shape}")
    print(f"  Output shape: {outputs[0].shape}")
    print(f"  Output sum: {outputs[0].sum():.4f}")

    # Test with softmax
    from scipy.special import softmax
    probs = softmax(outputs[0], axis=1)
    top_idx = probs.argmax()
    top_prob = probs[0, top_idx]

    print(f"  Top prediction index: {top_idx}")
    print(f"  Top prediction probability: {top_prob:.4f}")
    print("✅ ONNX inference test passed")


class ONNXPredictor:
    """ONNX-based predictor for production use."""

    def __init__(self, onnx_path: str, config_path: str = "./config.yaml"):
        """
        Initialize ONNX predictor.

        Args:
            onnx_path: Path to ONNX model
            config_path: Path to config file
        """
        self.config = load_config(config_path)
        self.class_names = self.config['classes']

        # Create ONNX Runtime session
        self.session = ort.InferenceSession(onnx_path)

        # Get input name
        self.input_name = self.session.get_inputs()[0].name

        print(f"✅ ONNX model loaded: {onnx_path}")

    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for ONNX inference.

        Args:
            image: RGB image as numpy array (H, W, 3)

        Returns:
            Preprocessed tensor (1, 3, H, W)
        """
        from albumentations import Resize, Normalize
        from albumentations.pytorch import ToTensorV2
        import albumentations as A

        img_size = self.config['image']['size']
        norm_cfg = self.config['image']['normalize']

        transform = A.Compose([
            Resize(img_size, img_size),
            Normalize(mean=norm_cfg['mean'], std=norm_cfg['std']),
            ToTensorV2()
        ])

        transformed = transform(image=image)
        tensor = transformed['image'].numpy()

        # Add batch dimension
        tensor = np.expand_dims(tensor, axis=0)

        return tensor.astype(np.float32)

    def predict(self, image: np.ndarray) -> tuple:
        """
        Predict chess piece class.

        Args:
            image: RGB image as numpy array

        Returns:
            (predicted_class, confidence)
        """
        # Preprocess
        input_tensor = self.preprocess(image)

        # Run inference
        outputs = self.session.run(None, {self.input_name: input_tensor})
        logits = outputs[0]

        # Softmax
        from scipy.special import softmax
        probs = softmax(logits, axis=1)[0]

        # Get top prediction
        top_idx = probs.argmax()
        predicted_class = self.class_names[top_idx]
        confidence = float(probs[top_idx])

        return predicted_class, confidence


def main():
    parser = argparse.ArgumentParser(description='Export PyTorch model to ONNX')
    parser.add_argument(
        '--model',
        type=str,
        default='./models/chesspiece_mobilenet.pth',
        help='Path to PyTorch model checkpoint'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='./models/chesspiece_mobilenet.onnx',
        help='Output path for ONNX model'
    )
    parser.add_argument(
        '--config',
        type=str,
        default='./config.yaml',
        help='Path to config file'
    )
    parser.add_argument(
        '--opset',
        type=int,
        default=14,
        help='ONNX opset version'
    )
    parser.add_argument(
        '--no-simplify',
        action='store_true',
        help='Skip ONNX simplification'
    )
    args = parser.parse_args()

    # Export
    export_to_onnx(
        model_path=args.model,
        output_path=args.output,
        config_path=args.config,
        opset_version=args.opset,
        simplify=not args.no_simplify
    )

    print("\n💡 Usage in FastAPI:")
    print(f"   from export_onnx import ONNXPredictor")
    print(f"   predictor = ONNXPredictor('{args.output}')")
    print(f"   predicted_class, confidence = predictor.predict(image_array)")


if __name__ == "__main__":
    main()
