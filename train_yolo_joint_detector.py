#!/usr/bin/env python3
"""
Fine-Tuning Pipeline for YOLOv8 Nano (yolov8n.pt)
STAGE 1: Anatomical Tibiofemoral Knee Joint ROI Detection
Detects the exact knee joint compartment [ymin, xmin, ymax, xmax]
across KL grades 0-4 for sub-millimeter clinical analysis.
"""

import os
import sys
import shutil
import random
import argparse
from pathlib import Path
from typing import List, Tuple, Dict, Any

import cv2
import numpy as np
import torch

WORKSPACE_ROOT = Path(__file__).resolve().parent
MODELS_DIR = WORKSPACE_ROOT / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
DATASET_DIR = WORKSPACE_ROOT / "dataset_yolo"
BASE_SAMPLES_DIR = WORKSPACE_ROOT / "frontend" / "public" / "samples"

# Ground-truth verified annotations for base radiographs: [ymin, xmin, ymax, xmax]
BASE_SAMPLES_BBOX = {
    "kl0_normal.jpg": [167, 143, 347, 381],
    "kl1_doubtful.jpg": [164, 139, 350, 386],
    "kl2_minimal.jpg": [159, 123, 361, 390],
    "kl3_moderate.jpg": [156, 123, 358, 390],
    "kl4_severe.jpg": [155, 123, 357, 391],
}

def generate_synthetic_knee_base(variation: int = 0) -> Tuple[np.ndarray, List[int]]:
    """Generates an anatomically structured synthetic knee radiograph with known joint box."""
    h, w = 512, 512
    img = np.full((h, w), random.randint(22, 35), dtype=np.uint8)

    # Vary condyle parameters
    shift_x = random.randint(-15, 15)
    joint_y = random.randint(245, 265)
    medial_jsn = variation * 3 # Narrowing with higher grade

    # Femur shaft and condyles
    cv2.ellipse(img, (256 + shift_x, 120), (60, 110), 0, 0, 360, 190, -1)
    # Medial condyle
    cv2.ellipse(img, (210 + shift_x, joint_y - 30 + (medial_jsn // 2)), (45, 35), 0, 0, 360, 220, -1)
    # Lateral condyle
    cv2.ellipse(img, (302 + shift_x, joint_y - 30), (45, 35), 0, 0, 360, 220, -1)

    # Tibial plateau and shaft
    cv2.ellipse(img, (256 + shift_x, joint_y + 30), (105, 30), 0, 0, 360, 230, -1)
    cv2.ellipse(img, (256 + shift_x, 400), (55, 110), 0, 0, 360, 190, -1)
    # Fibula head (lateral)
    cv2.ellipse(img, (360 + shift_x, joint_y + 60), (18, 35), 15, 0, 360, 170, -1)

    # Joint space radiolucent gap
    cv2.rectangle(img, (155 + shift_x, joint_y - 12), (355 + shift_x, joint_y + 12), random.randint(35, 55), -1)

    # Add realistic radiographic grain & gradient
    noise = np.random.normal(0, random.uniform(8, 14), (h, w)).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Ground-truth Joint ROI box
    ymin = max(0, joint_y - 95)
    ymax = min(h, joint_y + 95)
    xmin = max(0, 135 + shift_x)
    xmax = min(w, 375 + shift_x)

    return img, [ymin, xmin, ymax, xmax]


def apply_data_augmentation(
    img: np.ndarray,
    bbox: List[int],
    is_training: bool = True
) -> Tuple[np.ndarray, List[int]]:
    """
    Applies spatial affine & intensity augmentations while rigorously
    transforming bounding box coordinates via 2D transformation matrix.
    """
    h, w = img.shape[:2]
    ymin, xmin, ymax, xmax = bbox

    if is_training:
        # Spatial Affine Parameters
        angle = random.uniform(-10.0, 10.0)
        scale = random.uniform(0.90, 1.10)
        tx = random.uniform(-20.0, 20.0)
        ty = random.uniform(-15.0, 15.0)
    else:
        # Subtle variations for validation
        angle = random.uniform(-3.0, 3.0)
        scale = random.uniform(0.96, 1.04)
        tx = random.uniform(-8.0, 8.0)
        ty = random.uniform(-6.0, 6.0)

    # Compute Affine Matrix
    center = (w / 2.0, h / 2.0)
    M = cv2.getRotationMatrix2D(center, angle, scale)
    M[0, 2] += tx
    M[1, 2] += ty

    # Warp image
    warped_img = cv2.warpAffine(img, M, (w, h), borderMode=cv2.BORDER_REFLECT)

    # Transform BBox corners
    corners = np.array([
        [xmin, ymin, 1.0],
        [xmax, ymin, 1.0],
        [xmax, ymax, 1.0],
        [xmin, ymax, 1.0]
    ]).T  # Shape: (3, 4)

    new_corners = np.dot(M, corners)  # Shape: (2, 4)
    new_xs = new_corners[0, :]
    new_ys = new_corners[1, :]

    new_xmin = max(0, int(np.min(new_xs)))
    new_ymin = max(0, int(np.min(new_ys)))
    new_xmax = min(w, int(np.max(new_xs)))
    new_ymax = min(h, int(np.max(new_ys)))

    # Random Horizontal Flip (Left knee vs Right knee)
    if is_training and random.random() > 0.5:
        warped_img = cv2.flip(warped_img, 1)
        flipped_xmin = w - new_xmax
        flipped_xmax = w - new_xmin
        new_xmin, new_xmax = flipped_xmin, flipped_xmax

    # Intensity / Contrast Augmentation
    if is_training:
        contrast = random.uniform(0.85, 1.20)
        brightness = random.randint(-20, 20)
        aug_img = np.clip((warped_img.astype(np.float32) - 128.0) * contrast + 128.0 + brightness, 0, 255).astype(np.uint8)

        # Occasional slight blur or noise
        if random.random() > 0.6:
            aug_img = cv2.GaussianBlur(aug_img, (3, 3), 0)
    else:
        aug_img = warped_img

    # Ensure 3 channels for YOLO
    if len(aug_img.shape) == 2:
        aug_img = cv2.cvtColor(aug_img, cv2.COLOR_GRAY2BGR)

    return aug_img, [new_ymin, new_xmin, new_ymax, new_xmax]


def bbox_to_yolo_str(bbox: List[int], img_w: int, img_h: int) -> str:
    """Converts [ymin, xmin, ymax, xmax] to normalized YOLO string format: '0 xc yc w h'."""
    ymin, xmin, ymax, xmax = bbox
    xc = (xmin + xmax) / (2.0 * img_w)
    yc = (ymin + ymax) / (2.0 * img_h)
    bw = (xmax - xmin) / float(img_w)
    bh = (ymax - ymin) / float(img_h)

    # Clamp to [0, 1]
    xc = max(0.01, min(0.99, xc))
    yc = max(0.01, min(0.99, yc))
    bw = max(0.05, min(0.98, bw))
    bh = max(0.05, min(0.98, bh))

    return f"0 {xc:.6f} {yc:.6f} {bw:.6f} {bh:.6f}\n"


def prepare_yolo_dataset(
    output_dir: Path,
    num_train: int = 140,
    num_val: int = 35
) -> Path:
    """Builds full YOLOv8 formatted dataset with images and labels."""
    print("=" * 70)
    print("Preparing YOLOv8 Knee Joint ROI Dataset...")
    print(f"Target Directory: {output_dir}")
    print(f"Dataset Size: {num_train} train images, {num_val} val images")
    print("=" * 70)

    # Directory layout
    for split in ["train", "val"]:
        (output_dir / "images" / split).mkdir(parents=True, exist_ok=True)
        (output_dir / "labels" / split).mkdir(parents=True, exist_ok=True)

    # Collect source images
    base_images: List[Tuple[np.ndarray, List[int]]] = []

    # 1. Load clinical sample radiographs
    for filename, bbox in BASE_SAMPLES_BBOX.items():
        sample_path = BASE_SAMPLES_DIR / filename
        if sample_path.exists():
            img = cv2.imread(str(sample_path), cv2.IMREAD_GRAYSCALE)
            if img is not None:
                base_images.append((img, bbox))

    # 2. Add synthetic high-fidelity radiographs
    for var in range(5):
        synth_img, synth_bbox = generate_synthetic_knee_base(variation=var)
        base_images.append((synth_img, synth_bbox))

    print(f"Loaded {len(base_images)} base anchor radiographs for augmentation.")

    # Generate Train Split
    random.seed(42)
    np.random.seed(42)

    for i in range(num_train):
        base_img, base_bbox = random.choice(base_images)
        aug_img, aug_bbox = apply_data_augmentation(base_img, base_bbox, is_training=True)

        img_filename = f"knee_train_{i:04d}.jpg"
        lbl_filename = f"knee_train_{i:04d}.txt"

        img_path = output_dir / "images" / "train" / img_filename
        lbl_path = output_dir / "labels" / "train" / lbl_filename

        cv2.imwrite(str(img_path), aug_img)
        lbl_str = bbox_to_yolo_str(aug_bbox, aug_img.shape[1], aug_img.shape[0])
        with open(lbl_path, "w") as f:
            f.write(lbl_str)

    # Generate Validation Split
    for i in range(num_val):
        base_img, base_bbox = random.choice(base_images)
        val_img, val_bbox = apply_data_augmentation(base_img, base_bbox, is_training=False)

        img_filename = f"knee_val_{i:04d}.jpg"
        lbl_filename = f"knee_val_{i:04d}.txt"

        img_path = output_dir / "images" / "val" / img_filename
        lbl_path = output_dir / "labels" / "val" / lbl_filename

        cv2.imwrite(str(img_path), val_img)
        lbl_str = bbox_to_yolo_str(val_bbox, val_img.shape[1], val_img.shape[0])
        with open(lbl_path, "w") as f:
            f.write(lbl_str)

    # Write data.yaml
    yaml_content = f"""# YOLOv8 Knee Joint ROI Dataset
path: {output_dir.resolve()}
train: images/train
val: images/val

names:
  0: knee_joint
"""
    yaml_path = output_dir / "data.yaml"
    with open(yaml_path, "w") as f:
        f.write(yaml_content)

    print(f"[SUCCESS] Dataset successfully generated at {output_dir}")
    print(f"data.yaml written to: {yaml_path}")
    return yaml_path


def train_yolo_detector(args):
    """Executes fine-tuning of YOLOv8 Nano on knee joint dataset."""
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] 'ultralytics' package is required. Install via `pip install ultralytics`")
        sys.exit(1)

    # Prepare dataset
    dataset_dir = Path(args.data_dir)
    yaml_path = dataset_dir / "data.yaml"
    if args.regenerate or not yaml_path.exists():
        yaml_path = prepare_yolo_dataset(dataset_dir, num_train=args.num_train, num_val=args.num_val)

    # Determine Compute Device
    if args.device:
        device = args.device
    elif torch.backends.mps.is_available():
        device = "mps"
    elif torch.cuda.is_available():
        device = "cuda:0"
    else:
        device = "cpu"

    print("=" * 70)
    print("Starting YOLOv8 Nano Fine-Tuning for Knee Joint Detection")
    print(f"Base Weights: {args.base_weights}")
    print(f"Epochs: {args.epochs} | Batch Size: {args.batch_size} | Img Size: {args.imgsz}")
    print(f"Device: {device}")
    print("=" * 70)

    # Initialize YOLOv8 Nano
    base_model_path = Path(args.base_weights)
    if not base_model_path.exists():
        base_model_path = "yolov8n.pt"

    model = YOLO(str(base_model_path))

    # Train model
    results = model.train(
        data=str(yaml_path),
        epochs=args.epochs,
        batch=args.batch_size,
        imgsz=args.imgsz,
        device=device,
        project=str(WORKSPACE_ROOT / "runs" / "detect"),
        name="knee_joint",
        exist_ok=True,
        verbose=True,
        plots=False,
        save=True
    )

    # Locate best trained weights
    save_dir = Path(results.save_dir) if hasattr(results, "save_dir") else (WORKSPACE_ROOT / "runs" / "detect" / "knee_joint")
    best_weights_path = save_dir / "weights" / "best.pt"

    target_weights_path = Path(args.output_weights)
    target_weights_path.parent.mkdir(parents=True, exist_ok=True)

    if best_weights_path.exists():
        shutil.copy(best_weights_path, target_weights_path)
        print("=" * 70)
        print(f"[SUCCESS] Fine-tuned YOLOv8 Nano model saved to: {target_weights_path}")
        print(f"Model File Size: {target_weights_path.stat().st_size / (1024*1024):.2f} MB")
        print("=" * 70)
    else:
        # Fallback to last.pt or current weights
        last_weights_path = save_dir / "weights" / "last.pt"
        if last_weights_path.exists():
            shutil.copy(last_weights_path, target_weights_path)
            print(f"[SUCCESS] Saved checkpoint model to: {target_weights_path}")

    # Run quick clinical validation test on sample radiographs
    validate_model_on_samples(target_weights_path)


def validate_model_on_samples(weights_path: Path):
    """Evaluates the newly fine-tuned YOLO model on the clinical sample images."""
    if not weights_path.exists():
        print(f"[WARNING] Weights path not found for validation: {weights_path}")
        return

    from ultralytics import YOLO
    model = YOLO(str(weights_path))

    print("\n" + "=" * 70)
    print("CLINICAL INFERENCE VALIDATION on Patient Sample Radiographs")
    print("=" * 70)

    for p in sorted(BASE_SAMPLES_DIR.glob("kl*.jpg")):
        if "stage" in p.name:
            continue
        img = cv2.imread(str(p))
        if img is None:
            continue

        results = model.predict(img, conf=0.30, verbose=False)
        boxes = results[0].boxes
        if len(boxes) > 0:
            box = boxes[0]
            xyxy = box.xyxy[0].cpu().numpy().astype(int)
            conf = float(box.conf[0].cpu().numpy())
            cls_id = int(box.cls[0].cpu().numpy())
            cls_name = model.names.get(cls_id, str(cls_id))
            print(f"  {p.name:18s} -> Detected {cls_name} [conf: {conf:.3f}] | BBox: [xmin={xyxy[0]}, ymin={xyxy[1]}, xmax={xyxy[2]}, ymax={xyxy[3]}]")
        else:
            print(f"  {p.name:18s} -> No detection at 0.30 confidence threshold")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune YOLOv8 Nano for Knee Joint ROI Detection")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Training batch size")
    parser.add_argument("--imgsz", type=int, default=512, help="Image resolution for training")
    parser.add_argument("--data-dir", type=str, default="dataset_yolo", help="Directory for YOLO dataset")
    parser.add_argument("--num-train", type=int, default=140, help="Number of training images to synthesize")
    parser.add_argument("--num-val", type=int, default=35, help="Number of validation images to synthesize")
    parser.add_argument("--base-weights", type=str, default="yolov8n.pt", help="Initial weights file")
    parser.add_argument("--output-weights", type=str, default="models/knee_joint_yolov8n.pt", help="Target fine-tuned weights file")
    parser.add_argument("--device", type=str, default="", help="Device: 'mps', 'cuda:0', or 'cpu'")
    parser.add_argument("--regenerate", action="store_true", help="Force regenerate dataset")

    args = parser.parse_args()
    train_yolo_detector(args)
