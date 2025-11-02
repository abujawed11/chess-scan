"""
Helper script to create dataset directory structure.
Run this to set up the folder structure for training data.
"""

import os
from pathlib import Path

CLASSES = [
    "empty",
    "white_pawn",
    "white_knight",
    "white_bishop",
    "white_rook",
    "white_queen",
    "white_king",
    "black_pawn",
    "black_knight",
    "black_bishop",
    "black_rook",
    "black_queen",
    "black_king"
]

def create_dataset_structure(root_dir: str = "./dataset"):
    """Create empty dataset folders."""
    root_path = Path(root_dir)
    root_path.mkdir(parents=True, exist_ok=True)

    print(f"\n📁 Creating dataset structure in: {root_path.absolute()}\n")

    for class_name in CLASSES:
        class_dir = root_path / class_name
        class_dir.mkdir(exist_ok=True)
        print(f"  ✅ Created: {class_dir}")

    print(f"\n✅ Dataset structure created successfully!")
    print(f"\n📝 Next steps:")
    print(f"  1. Place your labeled square images in the appropriate folders")
    print(f"  2. Each folder should contain at least 200+ images for good training")
    print(f"  3. Images should be JPG or PNG format")
    print(f"  4. Image size can vary (will be resized to 128x128 during training)")
    print(f"\n💡 Example:")
    print(f"  dataset/white_pawn/img001.png")
    print(f"  dataset/white_pawn/img002.png")
    print(f"  dataset/black_knight/img001.jpg")
    print(f"  ...")
    print()


def create_sample_readme(root_dir: str = "./dataset"):
    """Create a README in the dataset folder."""
    readme_path = Path(root_dir) / "README.txt"

    content = """Chess Piece Dataset

This directory should contain labeled square images organized by class.

Folder Structure:
-----------------
Each folder represents one class:
  - empty: Empty squares (no piece)
  - white_pawn, white_knight, white_bishop, white_rook, white_queen, white_king
  - black_pawn, black_knight, black_bishop, black_rook, black_queen, black_king

Guidelines:
-----------
1. Image format: JPG or PNG
2. Image size: Any size (will be resized to 128x128 during training)
3. Minimum samples per class: 200+ (more is better)
4. Recommended: 400-800 samples per class for best results
5. Images should be square crops of individual chess squares
6. Include variety: different lighting, board styles, angles

Data Collection Tips:
---------------------
1. Take photos of physical chess boards from different angles
2. Use different chess sets (wooden, plastic, digital)
3. Vary lighting conditions (natural light, indoor, evening)
4. Include slight rotations (±15 degrees)
5. Capture both starting position and mid-game positions

After collecting data:
----------------------
1. Run: python train.py
2. Wait for training to complete (~10-20 epochs)
3. Check validation accuracy (target: >90%)
4. Export to ONNX: python export_onnx.py
5. Use in production!
"""

    with open(readme_path, 'w') as f:
        f.write(content)

    print(f"📄 Created: {readme_path}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Create dataset directory structure')
    parser.add_argument('--root', type=str, default='./dataset',
                       help='Root directory for dataset (default: ./dataset)')
    args = parser.parse_args()

    create_dataset_structure(args.root)
    create_sample_readme(args.root)
