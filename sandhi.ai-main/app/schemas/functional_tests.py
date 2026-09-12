from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.cv_requests import PoseFrame

class FunctionalTestRequest(BaseModel):
    test_type: str = "chair_stand_30s" # chair_stand_30s, timed_up_and_go
    frames: Optional[List[PoseFrame]] = None
    sampling_fps: float = 30.0

class ChairStandResult(BaseModel):
    completed_repetitions: int
    mean_rep_duration_seconds: float
    ascent_velocity_m_s: float
    fatigue_index_pct: float # Slowdown from first 3 reps to last 3 reps
    normative_status: str # Below Average (< 11 reps), Average (11-16), Above Average (> 16)
    quadriceps_weakness_indicator: str # Normal, Mild Weakness, Significant Sarcopenia/OA Weakness

class TUGResult(BaseModel):
    total_duration_seconds: float
    sit_to_stand_duration_sec: float
    walk_speed_m_s: float
    turn_duration_sec: float
    stand_to_sit_duration_sec: float
    fall_risk_category: str # Low Fall Risk (< 10s), Moderate Fall Risk (10-14s), High Fall Risk (> 14s)

class FunctionalTestResponse(BaseModel):
    test_type: str
    chair_stand_result: Optional[ChairStandResult] = None
    tug_result: Optional[TUGResult] = None
    functional_impairment_score: float # 0 to 100
    clinical_summary: str
    exercise_prescriptions: List[str]
