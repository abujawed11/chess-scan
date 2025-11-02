"""
Dataset loader with augmentations for chess piece detection.
"""

import os
from typing import Tuple, List, Optional
from pathlib import Path

import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import numpy as np
import albumentations as A
from albumentations.pytorch import ToTensorV2
import yaml


class ChessPieceDataset(Dataset):
    """Dataset for chess piece square images."""

    def __init__(
        self,
        root_dir: str,
        class_names: List[str],
        transform=None,
        is_train: bool = True
    ):
        """
        Args:
            root_dir: Root directory containing class folders
            class_names: List of class names
            transform: Albumentations transform pipeline
            is_train: Whether this is training data (for augmentation)
        """
        self.root_dir = Path(root_dir)
        self.class_names = class_names
        self.class_to_idx = {cls: idx for idx, cls in enumerate(class_names)}
        self.transform = transform
        self.is_train = is_train

        # Scan all images
        self.samples = []
        self._load_samples()

        print(f"📊 Loaded {len(self.samples)} samples from {len(class_names)} classes")
        self._print_class_distribution()

    def _load_samples(self):
        """Scan directory for all images."""
        for class_name in self.class_names:
            class_dir = self.root_dir / class_name

            if not class_dir.exists():
                print(f"⚠️  Warning: Class directory not found: {class_dir}")
                continue

            class_idx = self.class_to_idx[class_name]

            # Find all images in class folder
            for img_path in class_dir.glob("*"):
                if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                    self.samples.append((str(img_path), class_idx))

    def _print_class_distribution(self):
        """Print number of samples per class."""
        class_counts = {}
        for _, class_idx in self.samples:
            class_name = self.class_names[class_idx]
            class_counts[class_name] = class_counts.get(class_name, 0) + 1

        print("\n📈 Class distribution:")
        for class_name in self.class_names:
            count = class_counts.get(class_name, 0)
            print(f"  {class_name:20s}: {count:5d} samples")
        print()

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int]:
        img_path, label = self.samples[idx]

        # Load image
        image = Image.open(img_path).convert('RGB')
        image = np.array(image)

        # Apply transforms
        if self.transform:
            transformed = self.transform(image=image)
            image = transformed['image']

        return image, label


def get_train_transforms(config: dict) -> A.Compose:
    """Get training augmentation pipeline."""
    img_size = config['image']['size']
    aug_cfg = config['augmentation']
    norm_cfg = config['image']['normalize']

    return A.Compose([
        # Resize
        A.Resize(img_size, img_size),

        # Geometric augmentations
        A.Rotate(
            limit=aug_cfg['rotation_limit'],
            p=0.5,
            border_mode=0
        ),
        A.HorizontalFlip(p=aug_cfg['p_flip']),

        # Color augmentations
        A.RandomBrightnessContrast(
            brightness_limit=aug_cfg['brightness_limit'],
            contrast_limit=aug_cfg['contrast_limit'],
            p=0.5
        ),

        # Quality augmentations
        A.CLAHE(p=aug_cfg['p_clahe']),
        A.MotionBlur(
            blur_limit=aug_cfg['blur_limit'],
            p=aug_cfg['p_blur']
        ),
        A.GaussNoise(p=0.2),

        # Normalization
        A.Normalize(
            mean=norm_cfg['mean'],
            std=norm_cfg['std']
        ),
        ToTensorV2()
    ])


def get_val_transforms(config: dict) -> A.Compose:
    """Get validation/test transforms (no augmentation)."""
    img_size = config['image']['size']
    norm_cfg = config['image']['normalize']

    return A.Compose([
        A.Resize(img_size, img_size),
        A.Normalize(
            mean=norm_cfg['mean'],
            std=norm_cfg['std']
        ),
        ToTensorV2()
    ])


def create_data_loaders(
    config: dict,
    train_dataset: Dataset,
    val_dataset: Dataset
) -> Tuple[DataLoader, DataLoader]:
    """Create train and validation data loaders."""

    train_loader = DataLoader(
        train_dataset,
        batch_size=config['training']['batch_size'],
        shuffle=config['dataset']['shuffle'],
        num_workers=config['dataset']['num_workers'],
        pin_memory=True
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=config['training']['batch_size'],
        shuffle=False,
        num_workers=config['dataset']['num_workers'],
        pin_memory=True
    )

    return train_loader, val_loader


def split_dataset(
    dataset: ChessPieceDataset,
    train_split: float = 0.8
) -> Tuple[Dataset, Dataset]:
    """Split dataset into train and validation sets."""

    total_size = len(dataset)
    train_size = int(train_split * total_size)
    val_size = total_size - train_size

    train_dataset, val_dataset = torch.utils.data.random_split(
        dataset,
        [train_size, val_size],
        generator=torch.Generator().manual_seed(42)  # Reproducibility
    )

    return train_dataset, val_dataset


def load_config(config_path: str = "config.yaml") -> dict:
    """Load configuration from YAML file."""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config


if __name__ == "__main__":
    # Test dataset loader
    config = load_config()

    print("🧪 Testing dataset loader...")

    # Create full dataset with training transforms
    full_dataset = ChessPieceDataset(
        root_dir=config['dataset']['root_dir'],
        class_names=config['classes'],
        transform=get_train_transforms(config),
        is_train=True
    )

    # Split into train/val
    train_dataset, val_dataset = split_dataset(
        full_dataset,
        train_split=config['dataset']['train_split']
    )

    print(f"✅ Train size: {len(train_dataset)}")
    print(f"✅ Val size: {len(val_dataset)}")

    # Test data loader
    train_loader, val_loader = create_data_loaders(config, train_dataset, val_dataset)

    # Get a batch
    images, labels = next(iter(train_loader))
    print(f"\n📦 Batch shape: {images.shape}")
    print(f"📦 Labels shape: {labels.shape}")
    print(f"📦 Image range: [{images.min():.2f}, {images.max():.2f}]")
    print("\n✅ Dataset loader test passed!")
