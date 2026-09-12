from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import uuid

class WOMACAnswers(BaseModel):
    # Pain subscale (5 questions, each 0-4) -> Max 20
    pain_walking: int = Field(0, ge=0, le=4)
    pain_stairs: int = Field(0, ge=0, le=4)
    pain_in_bed: int = Field(0, ge=0, le=4)
    pain_sitting: int = Field(0, ge=0, le=4)
    pain_standing: int = Field(0, ge=0, le=4)
    
    # Stiffness subscale (2 questions, each 0-4) -> Max 8
    stiffness_morning: int = Field(0, ge=0, le=4)
    stiffness_evening: int = Field(0, ge=0, le=4)
    
    # Physical Function subscale (17 questions condensed / 0-4) -> Max 68
    difficulty_stairs_down: int = Field(0, ge=0, le=4)
    difficulty_stairs_up: int = Field(0, ge=0, le=4)
    difficulty_rising_sitting: int = Field(0, ge=0, le=4)
    difficulty_standing: int = Field(0, ge=0, le=4)
    difficulty_bending_floor: int = Field(0, ge=0, le=4)
    difficulty_walking_flat: int = Field(0, ge=0, le=4)
    difficulty_getting_in_out_car: int = Field(0, ge=0, le=4)
    difficulty_squatting_ner_chores: int = Field(0, ge=0, le=4) # Tailored for rural tea/hill chores
    difficulty_heavy_domestic_duties: int = Field(0, ge=0, le=4)

class ClinicalSymptomsInput(BaseModel):
    womac_answers: Optional[WOMACAnswers] = None
    vas_pain_score: float = Field(0.0, ge=0.0, le=10.0)
    morning_stiffness_minutes: float = Field(0.0, ge=0.0)
    joint_crepitus_reported: str = "No" # Yes, No
    bony_enlargement_reported: str = "No" # Yes, No
    joint_locking_reported: str = "No"

class BiomechanicsInput(BaseModel):
    left_knee_flexion_max: float = 135.0
    left_knee_extension_deficit: float = 0.0
    right_knee_flexion_max: float = 135.0
    right_knee_extension_deficit: float = 0.0
    left_knee_alignment_angle: float = 180.0
    right_knee_alignment_angle: float = 180.0
    cadence_steps_per_min: float = 110.0
    step_time_asymmetry_index: float = 2.5
    stance_phase_ratio_affected_side: float = 0.60
    antalgic_limp_detected: str = "No"
    trunk_lateral_sway_deg: float = 3.0
    cst_30s_rep_count: int = 15
    tug_duration_seconds: float = 8.5
    telemetry_json: Optional[Dict[str, Any]] = None

class XrayInput(BaseModel):
    kl_grade: int = 0
    kl_grade_confidence: float = 0.95
    medial_jsn_mm: float = 4.8
    lateral_jsn_mm: float = 5.2
    jsn_severity: str = "None"
    osteophytes_detected: str = "None"
    subchondral_sclerosis: str = "Absent"
    subchondral_cysts: str = "Absent"
    image_filename: Optional[str] = None
    gradcam_filename: Optional[str] = None

class FullScreeningSubmission(BaseModel):
    screening_uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: int
    symptoms: ClinicalSymptomsInput
    biomechanics: Optional[BiomechanicsInput] = None
    xray: Optional[XrayInput] = None
    client_created_at: Optional[datetime] = None

class RiskComponentBreakdown(BaseModel):
    biomechanics_score: float
    symptom_womac_score: float
    occupational_terrain_score: float
    xray_structural_score: Optional[float] = None
    demographic_bmi_score: float

class MultimodalRiskEvaluationResponse(BaseModel):
    screening_uuid: str
    patient_id: int
    patient_name: str
    patient_age: int
    patient_state: str
    patient_district: str
    patient_occupation: str
    composite_risk_score: float # 0 to 100
    risk_tier: str # Low Risk, Mild / Early OA, Moderate OA, Severe OA
    predicted_phenotype: str # Biomechanical Strain, Inflammatory, Radiographic-Dominant, Metabolic
    risk_components: RiskComponentBreakdown
    womac_total_score: float
    womac_percentage: float
    primary_contributing_factors: List[str]
    recommended_physiotherapy: List[str]
    ergonomic_terrain_advice: List[str]
    lifestyle_nutrition_guidance: List[str]
    referral_urgency: str
    referred_to_hospital: Optional[str] = None
    qr_code_base64: Optional[str] = None
    report_download_url: Optional[str] = None
