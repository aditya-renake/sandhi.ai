import pytest
import cv2
import numpy as np
from pathlib import Path
from app.cv_engine.xray_classifier import (
    XrayOAClassifier,
    KneeJointDetector,
    KneeBoneSegmenter,
    OpenCVDistanceTransform
)
from app.cv_engine.gradcam import GradCAMGenerator

def test_synthetic_knee_xray_generation():
    img = GradCAMGenerator._generate_synthetic_knee_xray()
    assert img is not None
    assert img.shape == (512, 512, 3)

def test_yolo_joint_detector():
    img_bgr = GradCAMGenerator._generate_synthetic_knee_xray()
    img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    roi, bbox, stage1_b64 = KneeJointDetector.detect_and_crop(img_gray)
    assert len(bbox) == 4
    ymin, xmin, ymax, xmax = bbox
    assert ymax > ymin
    assert xmax > xmin
    assert roi.shape == (ymax - ymin, xmax - xmin)
    assert stage1_b64.startswith("data:image/jpeg;base64,")

def test_bone_segmenter_and_distance_transform():
    img_bgr = GradCAMGenerator._generate_synthetic_knee_xray()
    img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    roi, bbox, _ = KneeJointDetector.detect_and_crop(img_gray)
    
    femur_mask, tibia_mask, stage2_b64 = KneeBoneSegmenter.segment_bones(roi)
    assert femur_mask.shape == roi.shape
    assert tibia_mask.shape == roi.shape
    assert stage2_b64.startswith("data:image/jpeg;base64,")

    dt_res = OpenCVDistanceTransform.calculate_submillimeter_jsw(femur_mask, tibia_mask, roi)
    assert "medial_jsw_mm" in dt_res
    assert "lateral_jsw_mm" in dt_res
    assert dt_res["medial_jsw_mm"] > 0
    assert dt_res["lateral_jsw_mm"] > 0
    assert dt_res["distance_map_b64"].startswith("data:image/jpeg;base64,")
    assert len(dt_res["submillimeter_profile"]) > 0

def test_xray_classifier_analysis():
    synthetic_img = GradCAMGenerator._generate_synthetic_knee_xray()
    _, encoded = cv2.imencode('.jpg', synthetic_img)
    image_bytes = encoded.tobytes()

    res = XrayOAClassifier.analyze_radiograph(image_bytes)
    assert 0 <= res.kl_grade <= 4
    assert res.confidence_score > 0.0
    assert res.medial_compartment.joint_space_width_mm > 0
    assert res.gradcam_heatmap_base64 is not None
    assert len(res.radiological_findings) > 0
    
    # Verify 4-stage pipeline outputs
    assert res.stage1_roi_box is not None
    assert len(res.stage1_roi_box) == 4
    assert res.stage1_roi_image_base64 is not None
    assert res.stage2_segmentation_overlay_base64 is not None
    assert res.stage3_distance_map_base64 is not None
    assert len(res.submillimeter_jsw_profile) > 0
    assert len(res.pipeline_stages_completed) == 4
