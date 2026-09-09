import pytest
from app.cv_engine.pose_detector import PoseMathUtils
from app.cv_engine.rom_analyzer import KneeROMAnalyzer
from app.schemas.cv_requests import PoseFrame, Keypoint

def test_3point_angle_calculation():
    # 90-degree right angle: (0, 1) -> (0, 0) -> (1, 0)
    a = (0.0, 1.0)
    b = (0.0, 0.0)
    c = (1.0, 0.0)
    angle = PoseMathUtils.calculate_3point_angle(a, b, c)
    assert pytest.approx(angle, 0.1) == 90.0

    # 180-degree straight line: (0, -1) -> (0, 0) -> (0, 1)
    a_straight = (0.0, -1.0)
    c_straight = (0.0, 1.0)
    angle_straight = PoseMathUtils.calculate_3point_angle(a_straight, b, c_straight)
    assert pytest.approx(angle_straight, 0.1) == 180.0

def test_butterworth_smoothing():
    jittery_signal = [120.0, 128.0, 119.0, 131.0, 122.0, 129.0, 121.0, 130.0, 120.0, 128.0]
    smoothed = PoseMathUtils.apply_butterworth_smoothing(jittery_signal)
    assert len(smoothed) == len(jittery_signal)
    # Variance of smoothed signal should be lower than raw jittery signal
    import numpy as np
    assert np.std(smoothed) < np.std(jittery_signal)

def test_knee_rom_analyzer_flow():
    # Create sample pose frames representing a deep squat
    frames = []
    for i, flex_deg in enumerate([180.0, 160.0, 140.0, 100.0, 80.0, 100.0, 140.0, 180.0]):
        # Convert flex_deg to coordinates
        frames.append(PoseFrame(
            timestamp_ms=float(i * 100),
            landmarks={
                "LEFT_HIP": Keypoint(x=0.5, y=0.2),
                "LEFT_KNEE": Keypoint(x=0.5, y=0.5),
                "LEFT_ANKLE": Keypoint(x=0.5 + (180.0 - flex_deg) * 0.003, y=0.8),
                "RIGHT_HIP": Keypoint(x=0.6, y=0.2),
                "RIGHT_KNEE": Keypoint(x=0.6, y=0.5),
                "RIGHT_ANKLE": Keypoint(x=0.6, y=0.8)
            }
        ))

    result = KneeROMAnalyzer.analyze_pose_sequence(frames, target_leg="both")
    assert result.left_knee_rom is not None
    assert result.right_knee_rom is not None
    assert result.processed_frames_count == len(frames)
    assert result.biomechanical_risk_score >= 0.0
    assert result.biomechanical_risk_score <= 100.0
