"""
Inference script for chess piece detection.
Single-square classification with confidence scores.
"""

import os
from pathlib import Path
from typing import Tuple, Union
import argparse

import torch
import torch.nn.functional as F
from PIL import Image
import numpy as np
import albumentations as A
from albumentations.pytorch import ToTensorV2

from train import ChessPieceModel
from dataset_loader import load_config


class ChessPiecePredictor:
    """Predictor for chess piece classification."""

    def __init__(
        self,
        model_path: str = "./models/chesspiece_mobilenet.pth",
        config_path: str = "./config.yaml",
        device: str = None
    ):
        """
        Initialize predictor.

        Args:
            model_path: Path to trained model checkpoint
            config_path: Path to config file
            device: Device to use ('cpu' or 'cuda'). Auto-detect if None.
        """
        self.config = load_config(config_path)
        self.class_names = self.config['classes']

        # Device
        if device is None:
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.device = torch.device(device)

        # Load model
        self.model = ChessPieceModel(
            num_classes=self.config['model']['num_classes'],
            dropout=0.0,  # No dropout for inference
            pretrained=False
        ).to(self.device)

        # Load checkpoint
        checkpoint = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()

        print(f"✅ Model loaded from: {model_path}")
        print(f"✅ Using device: {self.device}")

        # Preprocessing transforms
        self.transform = self._get_inference_transforms()

    def _get_inference_transforms(self) -> A.Compose:
        """Get inference preprocessing pipeline."""
        img_size = self.config['image']['size']
        norm_cfg = self.config['image']['normalize']

        return A.Compose([
            A.Resize(img_size, img_size),
            A.Normalize(
                mean=norm_cfg['mean'],
                std=norm_cfg['std']
            ),
            ToTensorV2()
        ])

    def preprocess(self, image: Union[str, Path, Image.Image, np.ndarray]) -> torch.Tensor:
        """
        Preprocess input image.

        Args:
            image: Can be:
                - str/Path: path to image file
                - PIL.Image: PIL image object
                - np.ndarray: numpy array (H, W, C)

        Returns:
            Preprocessed tensor ready for model
        """
        # Load image if path
        if isinstance(image, (str, Path)):
            image = Image.open(image).convert('RGB')

        # Convert PIL to numpy if needed
        if isinstance(image, Image.Image):
            image = np.array(image)

        # Apply transforms
        transformed = self.transform(image=image)
        tensor = transformed['image']

        # Add batch dimension
        tensor = tensor.unsqueeze(0)

        return tensor

    @torch.no_grad()
    def predict(
        self,
        image: Union[str, Path, Image.Image, np.ndarray],
        return_top_k: int = 3
    ) -> Tuple[str, float, dict]:
        """
        Predict chess piece class for a square image.

        Args:
            image: Input image (path, PIL, or numpy array)
            return_top_k: Return top K predictions

        Returns:
            Tuple of:
                - predicted_class (str): Top prediction class name
                - confidence (float): Confidence score [0-1]
                - top_k_probs (dict): Top K predictions {class: prob}
        """
        # Preprocess
        tensor = self.preprocess(image).to(self.device)

        # Forward pass
        logits = self.model(tensor)
        probs = F.softmax(logits, dim=1)

        # Get top-k predictions
        top_k_probs, top_k_indices = torch.topk(probs, k=min(return_top_k, len(self.class_names)), dim=1)

        top_k_probs = top_k_probs.squeeze().cpu().numpy()
        top_k_indices = top_k_indices.squeeze().cpu().numpy()

        # Build results
        predicted_class = self.class_names[top_k_indices[0]]
        confidence = float(top_k_probs[0])

        top_k_dict = {
            self.class_names[idx]: float(prob)
            for idx, prob in zip(top_k_indices, top_k_probs)
        }

        return predicted_class, confidence, top_k_dict

    def predict_batch(
        self,
        images: list,
        batch_size: int = 32
    ) -> list:
        """
        Predict on a batch of images (e.g., all 64 squares).

        Args:
            images: List of images (paths, PIL, or numpy arrays)
            batch_size: Batch size for processing

        Returns:
            List of (predicted_class, confidence) tuples
        """
        results = []

        for i in range(0, len(images), batch_size):
            batch_images = images[i:i + batch_size]

            # Preprocess batch
            tensors = [self.preprocess(img) for img in batch_images]
            batch_tensor = torch.cat(tensors, dim=0).to(self.device)

            # Forward pass
            logits = self.model(batch_tensor)
            probs = F.softmax(logits, dim=1)

            # Get top predictions
            confidences, predicted_indices = torch.max(probs, dim=1)

            # Convert to results
            for idx, conf in zip(predicted_indices.cpu().numpy(), confidences.cpu().numpy()):
                predicted_class = self.class_names[idx]
                results.append((predicted_class, float(conf)))

        return results

    def classify_square(self, image: Union[str, Path, Image.Image, np.ndarray]) -> Tuple[str, float]:
        """
        Simplified interface matching the template matcher API.

        Args:
            image: Input square image

        Returns:
            (predicted_class, confidence)
        """
        predicted_class, confidence, _ = self.predict(image, return_top_k=1)
        return predicted_class, confidence


def main():
    parser = argparse.ArgumentParser(description='Chess Piece Detection Inference')
    parser.add_argument('--image', type=str, required=True, help='Path to square image')
    parser.add_argument('--model', type=str, default='./models/chesspiece_mobilenet.pth',
                       help='Path to model checkpoint')
    parser.add_argument('--config', type=str, default='./config.yaml',
                       help='Path to config file')
    parser.add_argument('--top-k', type=int, default=3, help='Show top K predictions')
    parser.add_argument('--device', type=str, choices=['cpu', 'cuda'], default=None,
                       help='Device to use (auto-detect if not specified)')
    args = parser.parse_args()

    # Create predictor
    predictor = ChessPiecePredictor(
        model_path=args.model,
        config_path=args.config,
        device=args.device
    )

    # Predict
    predicted_class, confidence, top_k_probs = predictor.predict(
        args.image,
        return_top_k=args.top_k
    )

    # Print results
    print("\n" + "="*50)
    print(f"🎯 Prediction Results")
    print("="*50)
    print(f"\n✅ Top Prediction: {predicted_class}")
    print(f"📊 Confidence: {confidence:.4f} ({confidence*100:.2f}%)")

    print(f"\n📋 Top {args.top_k} Predictions:")
    print("-"*50)
    for i, (cls, prob) in enumerate(top_k_probs.items(), 1):
        bar = "█" * int(prob * 30)
        print(f"{i}. {cls:20s} {prob:.4f} {bar}")
    print("="*50 + "\n")


if __name__ == "__main__":
    main()
