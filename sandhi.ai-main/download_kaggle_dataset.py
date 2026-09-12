#!/usr/bin/env python3
"""
Dataset Downloader & Setup Utility for Sandhi-NER
Dataset: Knee Osteoarthritis Dataset with Severity (shashwatwork/knee-osteoarthritis-dataset-with-severity)
Kaggle URL: https://www.kaggle.com/datasets/shashwatwork/knee-osteoarthritis-dataset-with-severity
"""

import os
import sys
import zipfile
from pathlib import Path

DATASET_NAME = "shashwatwork/knee-osteoarthritis-dataset-with-severity"
TARGET_DIR = Path(__file__).resolve().parent / "dataset"

def setup_dataset():
    print("=" * 70)
    print("Sandhi-NER: Knee Osteoarthritis Dataset Setup")
    print(f"Target dataset: {DATASET_NAME}")
    print("=" * 70)

    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    # Check if kaggle package is available
    try:
        import kaggle
        print("\nAttempting automatic download via Kaggle API...")
        kaggle.api.authenticate()
        kaggle.api.dataset_download_files(DATASET_NAME, path=str(TARGET_DIR), unzip=True)
        print(f"\n[SUCCESS] Dataset successfully downloaded and extracted to {TARGET_DIR}")
        return True
    except Exception as e:
        print(f"\n[NOTE] Automated Kaggle API download note: {e}")
        print("\nTo download the dataset automatically:")
        print("1. Place your 'kaggle.json' API token in ~/.kaggle/kaggle.json")
        print("2. Run: kaggle datasets download -d shashwatwork/knee-osteoarthritis-dataset-with-severity -p ./dataset --unzip")
        print("\nOr manual setup:")
        print(f"1. Download ZIP from https://www.kaggle.com/datasets/shashwatwork/knee-osteoarthritis-dataset-with-severity")
        print(f"2. Extract folders (train, val, test, auto_test) into: {TARGET_DIR}/")
        
        # Verify directory structure
        create_sample_structure(TARGET_DIR)
        return False

def create_sample_structure(base_path: Path):
    """Creates expected folder layout for 5 KL severity grades (0, 1, 2, 3, 4)."""
    splits = ["train", "val", "test", "auto_test"]
    classes = ["0", "1", "2", "3", "4"]
    for split in splits:
        for cls in classes:
            (base_path / split / cls).mkdir(parents=True, exist_ok=True)
    print(f"\nCreated dataset directory scaffolding at: {base_path}")
    print("Classes mapped to Kellgren-Lawrence (KL) grading:")
    print("  0 -> Normal (No OA)")
    print("  1 -> Doubtful (Possible osteophytic lipping)")
    print("  2 -> Mild (Definite osteophytes, possible JSN)")
    print("  3 -> Moderate (Multiple moderate osteophytes, definite JSN, sclerosis)")
    print("  4 -> Severe (Large osteophytes, marked JSN, bone-on-bone deformity)")

if __name__ == "__main__":
    setup_dataset()
