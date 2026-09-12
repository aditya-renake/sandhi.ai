from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
import uuid

class PatientBase(BaseModel):
    patient_uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    abha_id: Optional[str] = None
    full_name: str
    age: int = Field(..., ge=1, le=120)
    gender: str # Male, Female, Other
    contact_number: Optional[str] = None
    
    # NER Location
    state: str = Field(..., description="North Eastern State: Assam, Mizoram, Nagaland, etc.")
    district: str
    village_town: Optional[str] = None
    terrain_type: str = "Hilly/Steep" # Hilly/Steep, Foothills, Valley/Plains, High Altitude Mountain
    
    # NER Occupational Risk
    occupation: str = "Tea Garden Worker" # Tea Plucker, Terrace Farmer, Hill Porter, Handloom Weaver, Domestic Worker
    daily_heavy_load_hours: float = 4.0
    squatting_kneeling_hours: float = 3.0
    
    # Biometric Profile
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    bmi: Optional[float] = None
    
    # Medical History
    prior_joint_injury: str = "None"
    family_history_oa: str = "No"
    primary_symptom_side: str = "Right Knee"

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    contact_number: Optional[str] = None
    daily_heavy_load_hours: Optional[float] = None
    squatting_kneeling_hours: Optional[float] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    bmi: Optional[float] = None
    prior_joint_injury: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    updated_at: datetime
    latest_risk_score: Optional[float] = None
    latest_risk_tier: Optional[str] = None
    total_screenings: int = 0

    model_config = ConfigDict(from_attributes=True)

class PatientSearchQuery(BaseModel):
    query: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    risk_tier: Optional[str] = None
    limit: int = 50
    offset: int = 0
