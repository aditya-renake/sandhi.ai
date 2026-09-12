import pytest
from app.cv_engine.gait_analyzer import GaitKinematicsAnalyzer
from app.schemas.gait import GaitAnalysisRequest
from app.schemas.cv_requests import PoseFrame, Keypoint

def test_gait_analyzer_default():
    req = GaitAnalysisRequest(frames=None)
    res = GaitKinematicsAnalyzer.analyze_gait_stream(req)
    assert res.cadence > 0
    assert res.antalgic_limp_detected in ["None", "Mild Antalgic", "Moderate Antalgic", "Severe Antalgic"]
    assert res.gait_risk_score >= 0.0

def test_gait_asymmetry_detection():
    # Construct simulated walking frames with asymmetrical step intervals
    frames = []
    for i in range(40):
        # Sine wave vertical displacement for left and right ankles
        import math
        l_y = 0.8 + 0.05 * math.sin(i * 0.4)
        r_y = 0.8 + 0.05 * math.sin(i * 0.25) # Different frequency
        frames.append(PoseFrame(
            timestamp_ms=float(i * 33.3),
            landmarks={
                "LEFT_ANKLE": Keypoint(x=0.45, y=l_y),
                "RIGHT_ANKLE": Keypoint(x=0.55, y=r_y),
                "LEFT_HIP": Keypoint(x=0.48, y=0.4),
                "RIGHT_HIP": Keypoint(x=0.52, y=0.4),
                "LEFT_SHOULDER": Keypoint(x=0.48, y=0.2),
                "RIGHT_SHOULDER": Keypoint(x=0.52, y=0.2),
            }
        ))

    req = GaitAnalysisRequest(frames=frames, sampling_fps=30.0)
    res = GaitKinematicsAnalyzer.analyze_gait_stream(req)
    assert res.total_gait_cycles_analyzed >= 1
    assert res.asymmetry_index_pct >= 0.0
