"""
Training script for chess piece detection using PyTorch.
"""

import os
import sys
from pathlib import Path
from typing import Tuple, Dict
import argparse

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import numpy as np
from sklearn.metrics import confusion_matrix, classification_report
import matplotlib.pyplot as plt
import seaborn as sns
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeRemainingColumn
from rich.table import Table
from rich.panel import Panel
from rich import box

from dataset_loader import (
    ChessPieceDataset,
    get_train_transforms,
    get_val_transforms,
    create_data_loaders,
    split_dataset,
    load_config
)

console = Console()


class ChessPieceModel(nn.Module):
    """Chess piece classifier based on MobileNetV3."""

    def __init__(self, num_classes: int = 13, dropout: float = 0.3, pretrained: bool = True):
        super().__init__()

        from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights

        # Load pretrained MobileNetV3
        if pretrained:
            weights = MobileNet_V3_Small_Weights.IMAGENET1K_V1
            self.backbone = mobilenet_v3_small(weights=weights)
        else:
            self.backbone = mobilenet_v3_small(weights=None)

        # Replace classifier
        in_features = self.backbone.classifier[0].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Linear(in_features, 1024),
            nn.Hardswish(),
            nn.Dropout(p=dropout),
            nn.Linear(1024, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)


class Trainer:
    """Training manager for chess piece detection."""

    def __init__(self, config: dict):
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        console.print(f"\n🔧 Using device: [bold cyan]{self.device}[/bold cyan]\n")

        # Create output directories
        self.model_dir = Path(config['output']['model_dir'])
        self.checkpoint_dir = Path(config['output']['checkpoint_dir'])
        self.log_dir = Path(config['output']['log_dir'])

        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.log_dir.mkdir(parents=True, exist_ok=True)

        # Model
        self.model = ChessPieceModel(
            num_classes=config['model']['num_classes'],
            dropout=config['model']['dropout'],
            pretrained=config['model']['pretrained']
        ).to(self.device)

        # Loss and optimizer
        self.criterion = nn.CrossEntropyLoss()
        self.optimizer = self._create_optimizer()
        self.scheduler = self._create_scheduler()

        # Training state
        self.best_val_acc = 0.0
        self.current_epoch = 0
        self.train_losses = []
        self.val_losses = []
        self.train_accs = []
        self.val_accs = []

    def _create_optimizer(self):
        """Create optimizer."""
        opt_config = self.config['optimizer']
        lr = self.config['training']['learning_rate']
        wd = self.config['training']['weight_decay']

        if opt_config['name'] == 'adam':
            return optim.Adam(
                self.model.parameters(),
                lr=lr,
                betas=opt_config['betas'],
                weight_decay=wd
            )
        elif opt_config['name'] == 'adamw':
            return optim.AdamW(self.model.parameters(), lr=lr, weight_decay=wd)
        elif opt_config['name'] == 'sgd':
            return optim.SGD(self.model.parameters(), lr=lr, momentum=0.9, weight_decay=wd)
        else:
            raise ValueError(f"Unknown optimizer: {opt_config['name']}")

    def _create_scheduler(self):
        """Create learning rate scheduler."""
        sched_config = self.config['scheduler']

        if not sched_config['use_scheduler']:
            return None

        if sched_config['name'] == 'cosine':
            return optim.lr_scheduler.CosineAnnealingLR(
                self.optimizer,
                T_max=self.config['training']['epochs'],
                eta_min=sched_config['min_lr']
            )
        elif sched_config['name'] == 'step':
            return optim.lr_scheduler.StepLR(self.optimizer, step_size=5, gamma=0.1)
        elif sched_config['name'] == 'reduce_on_plateau':
            return optim.lr_scheduler.ReduceLROnPlateau(
                self.optimizer, mode='max', patience=3, factor=0.5
            )

        return None

    def train_epoch(self, train_loader: DataLoader, epoch: int) -> Tuple[float, float]:
        """Train for one epoch."""
        self.model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeRemainingColumn(),
            console=console
        ) as progress:

            task = progress.add_task(
                f"[cyan]Epoch {epoch}/{self.config['training']['epochs']}",
                total=len(train_loader)
            )

            for batch_idx, (images, labels) in enumerate(train_loader):
                images, labels = images.to(self.device), labels.to(self.device)

                # Forward
                self.optimizer.zero_grad()
                outputs = self.model(images)
                loss = self.criterion(outputs, labels)

                # Backward
                loss.backward()
                self.optimizer.step()

                # Statistics
                running_loss += loss.item()
                _, predicted = outputs.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()

                progress.update(task, advance=1)

        epoch_loss = running_loss / len(train_loader)
        epoch_acc = 100. * correct / total

        return epoch_loss, epoch_acc

    def validate(self, val_loader: DataLoader) -> Tuple[float, float]:
        """Validate the model."""
        self.model.eval()
        running_loss = 0.0
        correct = 0
        total = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(self.device), labels.to(self.device)

                outputs = self.model(images)
                loss = self.criterion(outputs, labels)

                running_loss += loss.item()
                _, predicted = outputs.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()

        val_loss = running_loss / len(val_loader)
        val_acc = 100. * correct / total

        return val_loss, val_acc

    def evaluate(self, val_loader: DataLoader, class_names: list):
        """Full evaluation with confusion matrix and per-class metrics."""
        self.model.eval()
        all_preds = []
        all_labels = []

        console.print("\n[cyan]Running full evaluation...[/cyan]")

        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(self.device)
                outputs = self.model(images)
                _, predicted = outputs.max(1)

                all_preds.extend(predicted.cpu().numpy())
                all_labels.extend(labels.numpy())

        # Confusion matrix
        cm = confusion_matrix(all_labels, all_preds)
        self._plot_confusion_matrix(cm, class_names)

        # Classification report
        report = classification_report(
            all_labels,
            all_preds,
            target_names=class_names,
            digits=3
        )

        console.print(Panel(
            f"[white]{report}[/white]",
            title="[bold green]Classification Report[/bold green]",
            border_style="green"
        ))

        # Per-class accuracy table
        self._print_per_class_accuracy(cm, class_names)

    def _plot_confusion_matrix(self, cm: np.ndarray, class_names: list):
        """Plot and save confusion matrix."""
        plt.figure(figsize=(12, 10))
        sns.heatmap(
            cm,
            annot=True,
            fmt='d',
            cmap='Blues',
            xticklabels=class_names,
            yticklabels=class_names
        )
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        plt.tight_layout()

        save_path = self.log_dir / 'confusion_matrix.png'
        plt.savefig(save_path, dpi=150)
        console.print(f"\n💾 Confusion matrix saved to: [cyan]{save_path}[/cyan]")
        plt.close()

    def _print_per_class_accuracy(self, cm: np.ndarray, class_names: list):
        """Print per-class accuracy in a table."""
        table = Table(title="Per-Class Accuracy", box=box.ROUNDED)
        table.add_column("Class", style="cyan", no_wrap=True)
        table.add_column("Correct", style="green", justify="right")
        table.add_column("Total", style="blue", justify="right")
        table.add_column("Accuracy", style="magenta", justify="right")

        for i, class_name in enumerate(class_names):
            correct = cm[i, i]
            total = cm[i, :].sum()
            acc = 100. * correct / total if total > 0 else 0.0

            table.add_row(
                class_name,
                str(correct),
                str(total),
                f"{acc:.2f}%"
            )

        console.print(table)

    def save_checkpoint(self, epoch: int, val_acc: float, is_best: bool = False):
        """Save model checkpoint."""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'val_acc': val_acc,
            'config': self.config
        }

        # Save regular checkpoint
        checkpoint_path = self.checkpoint_dir / f'checkpoint_epoch_{epoch}.pth'
        torch.save(checkpoint, checkpoint_path)

        # Save best model
        if is_best:
            best_path = self.model_dir / 'chesspiece_mobilenet.pth'
            torch.save(checkpoint, best_path)
            console.print(f"💎 [bold green]New best model saved![/bold green] (acc: {val_acc:.2f}%)")

    def train(self, train_loader: DataLoader, val_loader: DataLoader):
        """Full training loop."""
        console.print(Panel.fit(
            "[bold cyan]Starting Training[/bold cyan]\n"
            f"Epochs: {self.config['training']['epochs']}\n"
            f"Batch size: {self.config['training']['batch_size']}\n"
            f"Learning rate: {self.config['training']['learning_rate']}\n"
            f"Device: {self.device}",
            border_style="cyan"
        ))

        patience_counter = 0
        max_patience = self.config['training']['early_stopping_patience']

        for epoch in range(1, self.config['training']['epochs'] + 1):
            self.current_epoch = epoch

            # Train
            train_loss, train_acc = self.train_epoch(train_loader, epoch)

            # Validate
            val_loss, val_acc = self.validate(val_loader)

            # Store metrics
            self.train_losses.append(train_loss)
            self.val_losses.append(val_loss)
            self.train_accs.append(train_acc)
            self.val_accs.append(val_acc)

            # Print epoch summary
            self._print_epoch_summary(epoch, train_loss, train_acc, val_loss, val_acc)

            # Learning rate scheduler
            if self.scheduler:
                if isinstance(self.scheduler, optim.lr_scheduler.ReduceLROnPlateau):
                    self.scheduler.step(val_acc)
                else:
                    self.scheduler.step()

            # Save checkpoint
            is_best = val_acc > self.best_val_acc
            if is_best:
                self.best_val_acc = val_acc
                patience_counter = 0
            else:
                patience_counter += 1

            if epoch % self.config['output']['save_frequency'] == 0 or is_best:
                self.save_checkpoint(epoch, val_acc, is_best)

            # Early stopping
            if patience_counter >= max_patience:
                console.print(f"\n⚠️  [yellow]Early stopping triggered after {epoch} epochs[/yellow]")
                break

        # Plot training curves
        self._plot_training_curves()

        console.print(Panel.fit(
            f"[bold green]Training Complete![/bold green]\n"
            f"Best validation accuracy: {self.best_val_acc:.2f}%",
            border_style="green"
        ))

    def _print_epoch_summary(self, epoch: int, train_loss: float, train_acc: float,
                            val_loss: float, val_acc: float):
        """Print epoch summary table."""
        table = Table(box=box.SIMPLE)
        table.add_column("Metric", style="cyan")
        table.add_column("Train", style="green", justify="right")
        table.add_column("Val", style="magenta", justify="right")

        table.add_row("Loss", f"{train_loss:.4f}", f"{val_loss:.4f}")
        table.add_row("Accuracy", f"{train_acc:.2f}%", f"{val_acc:.2f}%")

        if self.scheduler:
            lr = self.optimizer.param_groups[0]['lr']
            table.add_row("Learning Rate", f"{lr:.6f}", "—")

        console.print(f"\n[bold]Epoch {epoch}[/bold]")
        console.print(table)

    def _plot_training_curves(self):
        """Plot and save training curves."""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

        # Loss curve
        epochs = range(1, len(self.train_losses) + 1)
        ax1.plot(epochs, self.train_losses, 'b-', label='Train Loss')
        ax1.plot(epochs, self.val_losses, 'r-', label='Val Loss')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Loss')
        ax1.set_title('Training and Validation Loss')
        ax1.legend()
        ax1.grid(True, alpha=0.3)

        # Accuracy curve
        ax2.plot(epochs, self.train_accs, 'b-', label='Train Acc')
        ax2.plot(epochs, self.val_accs, 'r-', label='Val Acc')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('Accuracy (%)')
        ax2.set_title('Training and Validation Accuracy')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()
        save_path = self.log_dir / 'training_curves.png'
        plt.savefig(save_path, dpi=150)
        console.print(f"📊 Training curves saved to: [cyan]{save_path}[/cyan]")
        plt.close()


def main():
    parser = argparse.ArgumentParser(description='Chess Piece Detection Training')
    parser.add_argument('--config', type=str, default='config.yaml', help='Path to config file')
    parser.add_argument('--eval-only', action='store_true', help='Only run evaluation')
    parser.add_argument('--checkpoint', type=str, help='Path to checkpoint to resume from')
    args = parser.parse_args()

    # Load config
    config = load_config(args.config)

    console.print(Panel.fit(
        "[bold magenta]Chess Piece Detection - Deep Learning Training[/bold magenta]\n"
        "Using MobileNetV3 + Transfer Learning",
        border_style="magenta"
    ))

    # Prepare dataset
    console.print("\n[cyan]Loading dataset...[/cyan]")

    # Create full dataset
    full_dataset = ChessPieceDataset(
        root_dir=config['dataset']['root_dir'],
        class_names=config['classes'],
        transform=None,  # We'll apply transforms after split
        is_train=True
    )

    # Split dataset
    train_indices, val_indices = torch.utils.data.random_split(
        range(len(full_dataset)),
        [
            int(config['dataset']['train_split'] * len(full_dataset)),
            len(full_dataset) - int(config['dataset']['train_split'] * len(full_dataset))
        ],
        generator=torch.Generator().manual_seed(42)
    )

    # Create train dataset with augmentation
    train_dataset = torch.utils.data.Subset(full_dataset, train_indices.indices)
    train_dataset.dataset.transform = get_train_transforms(config)

    # Create val dataset without augmentation
    val_dataset = torch.utils.data.Subset(full_dataset, val_indices.indices)
    val_dataset.dataset.transform = get_val_transforms(config)

    # Create data loaders
    train_loader, val_loader = create_data_loaders(config, train_dataset, val_dataset)

    console.print(f"✅ Train samples: [green]{len(train_dataset)}[/green]")
    console.print(f"✅ Val samples: [green]{len(val_dataset)}[/green]")

    # Create trainer
    trainer = Trainer(config)

    # Load checkpoint if provided
    if args.checkpoint:
        checkpoint = torch.load(args.checkpoint)
        trainer.model.load_state_dict(checkpoint['model_state_dict'])
        trainer.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        console.print(f"✅ Loaded checkpoint from epoch {checkpoint['epoch']}")

    if args.eval_only:
        # Evaluation only
        trainer.evaluate(val_loader, config['classes'])
    else:
        # Full training
        trainer.train(train_loader, val_loader)

        # Final evaluation
        console.print("\n" + "="*60)
        console.print("[bold cyan]Running final evaluation on validation set...[/bold cyan]")
        console.print("="*60 + "\n")
        trainer.evaluate(val_loader, config['classes'])


if __name__ == "__main__":
    main()
