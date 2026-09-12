import pytest
import cv2
import numpy as np
from app.cv_engine.xray_classifier import XrayOAClassifier
from app.cv_engine.gradcam import GradCAMGenerator

def test_synthetic_knee_xray_generation():
    img = GradCAMGenerator._generate_synthetic_knee_xray()
    assert img is not None
    assert img.shape == (512, 512, 3)

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
