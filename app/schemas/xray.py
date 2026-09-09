from typing import List, Optional
from pydantic import BaseModel, Field

class XrayAnalysisRequest(BaseModel):
    patient_id: Optional[int] = None
    target_side: str = "Right Knee" # Right Knee, Left Knee, Bilateral
    view_type: str = "AP_Weight_Bearing" # AP_Weight_Bearing, Lateral, Skyline

class CompartmentMeasurement(BaseModel):
    joint_space_width_mm: float
    narrowing_severity: str # Normal, Mild (<4mm), Moderate (<3mm), Severe (<1.5mm / Bone-on-Bone)
    subchondral_sclerosis: bool
    osteophytes_observed: str # None, Definite Small, Moderate, Large

class XrayAnalysisResponse(BaseModel):
    kl_grade: int # 0 to 4
    kl_grade_label: str # KL 0: Normal, KL 1: Doubtful, KL 2: Minimal OA, KL 3: Moderate OA, KL 4: Severe OA
    confidence_score: float # 0.0 to 1.0
    medial_compartment: CompartmentMeasurement
    lateral_compartment: CompartmentMeasurement
    patellofemoral_compartment: Optional[CompartmentMeasurement] = None
    gradcam_heatmap_base64: Optional[str] = None
    gradcam_image_url: Optional[str] = None
    radiological_findings: List[str]
    structural_risk_contribution: float # 0 - 100
    surgical_consultation_indicated: bool
