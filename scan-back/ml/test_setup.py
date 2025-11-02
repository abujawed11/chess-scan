"""
Test script to verify ML setup is correct.
Run this to check if all dependencies are installed and working.
"""

import sys
from pathlib import Path

def test_imports():
    """Test if all required packages are installed."""
    print("\n" + "="*60)
    print("🧪 Testing Python Package Imports")
    print("="*60 + "\n")

    packages = [
        ("torch", "PyTorch"),
        ("torchvision", "TorchVision"),
        ("albumentations", "Albumentations"),
        ("cv2", "OpenCV"),
        ("PIL", "Pillow"),
        ("yaml", "PyYAML"),
        ("sklearn", "scikit-learn"),
        ("matplotlib", "Matplotlib"),
        ("seaborn", "Seaborn"),
        ("rich", "Rich"),
        ("numpy", "NumPy"),
        ("onnx", "ONNX"),
        ("onnxruntime", "ONNX Runtime")
    ]

    failed = []
    for module_name, display_name in packages:
        try:
            __import__(module_name)
            print(f"  ✅ {display_name:20s} - OK")
        except ImportError as e:
            print(f"  ❌ {display_name:20s} - MISSING")
            failed.append(display_name)

    if failed:
        print(f"\n⚠️  Missing packages: {', '.join(failed)}")
        print(f"   Install with: pip install -r requirements.txt")
        return False
    else:
        print(f"\n✅ All packages installed successfully!")
        return True


def test_torch_setup():
    """Test PyTorch setup and CUDA availability."""
    print("\n" + "="*60)
    print("🔧 Testing PyTorch Setup")
    print("="*60 + "\n")

    import torch

    print(f"  PyTorch version: {torch.__version__}")
    print(f"  CUDA available: {torch.cuda.is_available()}")

    if torch.cuda.is_available():
        print(f"  CUDA version: {torch.version.cuda}")
        print(f"  GPU count: {torch.cuda.device_count()}")
        for i in range(torch.cuda.device_count()):
            print(f"  GPU {i}: {torch.cuda.get_device_name(i)}")
    else:
        print("  ℹ️  CUDA not available - will use CPU")
        print("     (This is fine, but training will be slower)")

    # Test tensor operations
    try:
        x = torch.randn(3, 3)
        y = torch.randn(3, 3)
        z = torch.matmul(x, y)
        print(f"\n  ✅ Basic tensor operations work")
    except Exception as e:
        print(f"\n  ❌ Tensor operations failed: {e}")
        return False

    return True


def test_config():
    """Test if config file exists and is valid."""
    print("\n" + "="*60)
    print("📄 Testing Configuration")
    print("="*60 + "\n")

    config_path = Path("config.yaml")

    if not config_path.exists():
        print(f"  ❌ config.yaml not found!")
        print(f"     Expected at: {config_path.absolute()}")
        return False

    try:
        from dataset_loader import load_config
        config = load_config(str(config_path))
        print(f"  ✅ config.yaml loaded successfully")
        print(f"  ✅ Dataset root: {config['dataset']['root_dir']}")
        print(f"  ✅ Image size: {config['image']['size']}")
        print(f"  ✅ Batch size: {config['training']['batch_size']}")
        print(f"  ✅ Epochs: {config['training']['epochs']}")
        print(f"  ✅ Classes: {len(config['classes'])}")
        return True
    except Exception as e:
        print(f"  ❌ Failed to load config: {e}")
        return False


def test_model_creation():
    """Test if model can be created."""
    print("\n" + "="*60)
    print("🤖 Testing Model Creation")
    print("="*60 + "\n")

    try:
        from train import ChessPieceModel
        import torch

        model = ChessPieceModel(num_classes=13, pretrained=False)
        print(f"  ✅ Model created successfully")

        # Test forward pass
        x = torch.randn(1, 3, 128, 128)
        y = model(x)
        print(f"  ✅ Forward pass works")
        print(f"  ✅ Output shape: {y.shape}")

        # Count parameters
        params = sum(p.numel() for p in model.parameters())
        print(f"  ✅ Total parameters: {params:,}")

        return True
    except Exception as e:
        print(f"  ❌ Model creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_augmentations():
    """Test data augmentation pipeline."""
    print("\n" + "="*60)
    print("🎨 Testing Data Augmentation")
    print("="*60 + "\n")

    try:
        from dataset_loader import get_train_transforms, load_config
        import numpy as np

        config = load_config()
        transform = get_train_transforms(config)

        # Create dummy image
        dummy_image = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)

        # Apply transforms
        transformed = transform(image=dummy_image)
        tensor = transformed['image']

        print(f"  ✅ Augmentation pipeline created")
        print(f"  ✅ Input shape: {dummy_image.shape}")
        print(f"  ✅ Output shape: {tensor.shape}")
        print(f"  ✅ Output type: {tensor.dtype}")
        print(f"  ✅ Value range: [{tensor.min():.2f}, {tensor.max():.2f}]")

        return True
    except Exception as e:
        print(f"  ❌ Augmentation test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_dataset_structure():
    """Check if dataset directory exists."""
    print("\n" + "="*60)
    print("📁 Checking Dataset Structure")
    print("="*60 + "\n")

    try:
        from dataset_loader import load_config
        config = load_config()
        dataset_root = Path(config['dataset']['root_dir'])

        if not dataset_root.exists():
            print(f"  ⚠️  Dataset directory not found: {dataset_root.absolute()}")
            print(f"     Run: python create_dataset_structure.py")
            return False

        classes = config['classes']
        missing = []
        class_counts = {}

        for cls in classes:
            cls_dir = dataset_root / cls
            if not cls_dir.exists():
                missing.append(cls)
            else:
                # Count images
                count = len(list(cls_dir.glob("*.png"))) + len(list(cls_dir.glob("*.jpg")))
                class_counts[cls] = count

        if missing:
            print(f"  ⚠️  Missing class folders: {', '.join(missing)}")
            print(f"     Run: python create_dataset_structure.py")
            return False

        print(f"  ✅ All class folders exist")
        print(f"\n  📊 Image counts per class:")
        total = 0
        for cls in classes:
            count = class_counts.get(cls, 0)
            total += count
            status = "✅" if count >= 200 else "⚠️ " if count > 0 else "❌"
            print(f"     {status} {cls:20s}: {count:5d} images")

        print(f"\n  Total images: {total}")

        if total == 0:
            print(f"\n  ⚠️  No images found in dataset!")
            print(f"     Please add labeled images to {dataset_root.absolute()}")
            print(f"     See {dataset_root / 'README.txt'} for guidelines")
            return False

        if total < 2600:  # 13 classes × 200 samples
            print(f"\n  ⚠️  Dataset is small (< 200 samples per class)")
            print(f"     Training may not reach >90% accuracy")
            print(f"     Recommended: 400+ samples per class")

        return True

    except Exception as e:
        print(f"  ❌ Dataset check failed: {e}")
        return False


def main():
    """Run all tests."""
    print("\n" + "="*70)
    print(" "*15 + "🧪 ML Setup Verification")
    print("="*70)

    results = []

    results.append(("Imports", test_imports()))
    results.append(("PyTorch", test_torch_setup()))
    results.append(("Config", test_config()))
    results.append(("Model", test_model_creation()))
    results.append(("Augmentation", test_augmentations()))
    results.append(("Dataset", test_dataset_structure()))

    # Summary
    print("\n" + "="*70)
    print("📊 Test Summary")
    print("="*70 + "\n")

    all_passed = True
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} - {name}")
        if not passed:
            all_passed = False

    print("\n" + "="*70)

    if all_passed:
        print("✅ All tests passed! You're ready to train.")
        print("\n🚀 Next steps:")
        print("  1. Ensure you have enough training data (400+ per class)")
        print("  2. Run: python train.py")
        print("  3. Monitor training progress")
        print("  4. Export to ONNX: python export_onnx.py")
        print("="*70 + "\n")
        return 0
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        print("="*70 + "\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
