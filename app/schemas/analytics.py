from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class StateAnalytics(BaseModel):
    state: str
    total_screened: int
    high_risk_count: int
    moderate_risk_count: int
    mild_risk_count: int
    low_risk_count: int
    high_risk_percentage: float
    top_occupation: str
    mean_womac_score: float
    mean_rom_deficit_deg: float

class OccupationCorrelation(BaseModel):
    occupation: str
    sample_size: int
    mean_risk_score: float
    high_risk_prevalence_pct: float
    prominent_symptoms: List[str]

class TerrainCorrelation(BaseModel):
    terrain_type: str
    screened_count: int
    mean_risk_score: float
    stair_hill_difficulty_pct: float

class RegionalAnalyticsResponse(BaseModel):
    total_patients_screened_ner: int
    total_screenings_conducted: int
    overall_high_risk_prevalence_pct: float
    active_districts_covered: int
    active_asha_workers: int
    state_breakdown: List[StateAnalytics]
    occupational_correlations: List[OccupationCorrelation]
    terrain_correlations: List[TerrainCorrelation]
    age_gender_distribution: Dict[str, Any]
    monthly_trend: List[Dict[str, Any]]
