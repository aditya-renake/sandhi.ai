#!/usr/bin/env python3
"""
Deep Learning Training Pipeline for Knee Osteoarthritis Kellgren-Lawrence (KL 0-4) Grading
Dataset: https://www.kaggle.com/datasets/shashwatwork/knee-osteoarthritis-dataset-with-severity
Model Architecture: ResNet-18 Transfer Learning + Grad-CAM explainability
"""

import argparse
import os
import sys
import time
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from app.cv_engine.pytorch_model import KneeOAResNet

MODELS_DIR = Path(__file__).resolve().parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

class OrdinalClassificationLoss(nn.Module):
    """
    Penalizes mistakes further from the true KL grade more heavily
    (e.g., misclassifying Grade 0 as Grade 4 is worse than Grade 0 as Grade 1).
    """
    def __init__(self, num_classes=5, alpha=0.7):
        super().__init__()
        self.ce = nn.CrossEntropyLoss()
        self.num_classes = num_classes
        self.alpha = alpha

    def forward(self, logits, targets):
        ce_loss = self.ce(logits, targets)
        
        # Expected value / soft prediction
        probs = torch.softmax(logits, dim=1)
        classes = torch.arange(self.num_classes, device=logits.device, dtype=torch.float)
        expected_grade = torch.sum(probs * classes, dim=1)
        
        distance_loss = torch.mean((expected_grade - targets.float()) ** 2)
        return self.alpha * ce_loss + (1 - self.alpha) * distance_loss

def get_data_loaders(data_dir: Path, batch_size: int = 32, num_workers: int = 2):
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_path = data_dir / "train"
    val_path = data_dir / "val" if (data_dir / "val").exists() else (data_dir / "test")

    if not train_path.exists():
        raise FileNotFoundError(f"Training directory not found at: {train_path}")

    train_dataset = datasets.ImageFolder(str(train_path), transform=train_transform)
    val_dataset = datasets.ImageFolder(str(val_path), transform=val_transform) if val_path.exists() else None

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers) if val_dataset else None

    return train_loader, val_loader, train_dataset.classes

def train_model(args):
    data_dir = Path(args.data_dir)
    print("=" * 70)
    print(f"Starting Training: Knee OA KL Grading on {data_dir}")
    print(f"Epochs: {args.epochs} | Batch Size: {args.batch_size} | Learning Rate: {args.lr}")
    print("=" * 70)

    device = torch.device("cuda" if torch.cuda.is_available() else ("mps" if hasattr(torch.backends, "mps") and torch.backends.mps.is_available() else "cpu"))
    print(f"Using Compute Device: {device}")

    try:
        train_loader, val_loader, class_names = get_data_loaders(data_dir, args.batch_size)
        print(f"Loaded {len(train_loader.dataset)} training images across classes: {class_names}")
    except Exception as e:
        print(f"[ERROR] Could not load dataset from {data_dir}: {e}")
        print("Please ensure the Kaggle dataset is downloaded to ./dataset via `python download_kaggle_dataset.py`")
        return

    model = KneeOAResNet(num_classes=5, pretrained=True).to(device)
    criterion = OrdinalClassificationLoss(num_classes=5)
    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_val_acc = 0.0
    best_model_path = MODELS_DIR / "knee_kl_model.pth"

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        start_t = time.time()
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()

            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        scheduler.step()
        epoch_loss = running_loss / total
        epoch_acc = (correct / total) * 100.0
        elapsed = time.time() - start_t

        val_loss, val_acc = 0.0, 0.0
        if val_loader:
            model.eval()
            val_correct = 0
            val_total = 0
            with torch.no_grad():
                for v_images, v_labels in val_loader:
                    v_images, v_labels = v_images.to(device), v_labels.to(device)
                    v_outputs = model(v_images)
                    _, v_preds = torch.max(v_outputs, 1)
                    val_correct += torch.sum(v_preds == v_labels.data).item()
                    val_total += v_labels.size(0)
            val_acc = (val_correct / val_total) * 100.0 if val_total > 0 else 0.0

        print(f"Epoch [{epoch:02d}/{args.epochs:02d}] ({elapsed:.1f}s) - Train Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc:.2f}% | Val Acc: {val_acc:.2f}%")

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), str(best_model_path))

    print(f"\n[SUCCESS] Training finished. Best model saved to: {best_model_path}")

    # Export to ONNX if requested
    if args.export_onnx:
        onnx_path = MODELS_DIR / "knee_kl_model.onnx"
        dummy_input = torch.randn(1, 3, 224, 224, device=device)
        torch.onnx.export(
            model,
            dummy_input,
            str(onnx_path),
            input_names=["input_radiograph"],
            output_names=["kl_grade_logits"],
            dynamic_axes={"input_radiograph": {0: "batch_size"}, "kl_grade_logits": {0: "batch_size"}},
            opset_version=14
        )
        print(f"[EXPORT] Exported lightweight ONNX model for edge/mobile to: {onnx_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Knee OA Kellgren-Lawrence Classifier")
    parser.add_argument("--data-dir", type=str, default="./dataset", help="Path to extracted Kaggle dataset")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=3e-4, help="Learning rate")
    parser.add_argument("--export-onnx", action="store_true", default=True, help="Export ONNX model")
    args = parser.parse_args()
    train_model(args)
