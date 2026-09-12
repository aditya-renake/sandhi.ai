from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Keypoint(BaseModel):
    x: float
    y: float
    z: Optional[float] = 0.0
    visibility: Optional[float] = 1.0

class PoseFrame(BaseModel):
    timestamp_ms: float
    landmarks: Dict[str, Keypoint] # Keypoints such as LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, etc.

class KeypointStreamPayload(BaseModel):
    frames: List[PoseFrame]
    target_leg: str = "both" # left, right, both
    exercise_type: str = "knee_flexion_extension" # knee_flexion_extension, standing_alignment, gait, chair_stand

class JointAngleResult(BaseModel):
    flexion_max_deg: float
    extension_deficit_deg: float
    rom_arc_deg: float
    rom_status: str # Normal (>= 130 deg), Mild Restriction (110-129 deg), Moderate Restriction (90-109 deg), Severe Restriction (< 90 deg)
    flexion_deficit_from_normal_deg: float

class AlignmentResult(BaseModel):
    alignment_angle_deg: float
    classification: str # Neutral (175-182 deg), Genu Varum / Bowleg (< 175 deg), Genu Valgum / Knock-knee (> 182 deg)
    q_angle_estimate_deg: float
    clinical_implication: str

class ROMAnalysisResponse(BaseModel):
    target_side: str # left, right, both
    left_knee_rom: Optional[JointAngleResult] = None
    right_knee_rom: Optional[JointAngleResult] = None
    left_alignment: Optional[AlignmentResult] = None
    right_alignment: Optional[AlignmentResult] = None
    asymmetry_deg: float = 0.0
    overall_biomechanical_risk: str # Low, Moderate, High
    biomechanical_risk_score: float # 0 - 100
    recommendations: List[str]
    processed_frames_count: int
