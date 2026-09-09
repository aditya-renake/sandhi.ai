from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.cv_requests import PoseFrame

class GaitAnalysisRequest(BaseModel):
    frames: Optional[List[PoseFrame]] = None
    sampling_fps: float = 30.0
    affected_side: str = "right" # left, right, bilateral

class AsymmetryMetrics(BaseModel):
    step_time_asymmetry_pct: float # STAI %: Normal < 5%, Mild 5-12%, Moderate 12-20%, Severe > 20%
    step_length_asymmetry_pct: float
    stance_phase_left_pct: float # Normal ~60%
    stance_phase_right_pct: float
    single_limb_support_ratio: float

class GaitKinematics(BaseModel):
    cadence_steps_per_min: float # Normal: 100-120 steps/min
    estimated_speed_m_s: float
    stride_duration_seconds: float
    knee_flexion_during_stance_deg: float # Normal 15-20 deg shock absorption; OA often has stiff knee gait < 10 deg
    trunk_lateral_sway_deg: float # Compensatory lean over painful knee (Duchenne sign)

class GaitAnalysisResponse(BaseModel):
    cadence: float
    gait_speed_m_s: float
    asymmetry_index_pct: float
    antalgic_limp_detected: str # None, Mild Antalgic, Moderate Antalgic, Severe Antalgic
    stiff_knee_gait_detected: bool
    trunk_lean_compensation_detected: bool
    gait_risk_score: float # 0 - 100
    risk_level: str # Low Risk, Moderate Risk, High Risk
    clinical_observations: List[str]
    gait_kinematics: GaitKinematics
    asymmetry_metrics: AsymmetryMetrics
    total_gait_cycles_analyzed: int
