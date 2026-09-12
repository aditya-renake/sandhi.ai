"""
Composite 0-100 OA Risk Scoring Algorithm
MDoNER Problem Statement 26004
Combines:
1. Clinical Symptoms (WOMAC + VAS Pain)
2. Biomechanical Kinematics (Knee ROM + Varus/Valgus Alignment + Sit-to-Stand CST Reps)
3. Vibroarthrographic Acoustic Crepitus (Acoustic Burst Count)
4. Radiographic KL Grade Proxy
5. Occupational & Terrain Factors (Steep slopes, tea-garden load carrying)
"""

from typing import Optional, Dict, Any
from app.ai_engine.multimodal_risk import MultimodalOARiskEngine
from app.schemas.screening import FullScreeningSubmission, MultimodalRiskEvaluationResponse

def calculate_composite_oa_risk(
    womac_pain: int,
    womac_stiffness: int,
    womac_function: int,
    knee_rom_deg: float,
    sit_to_stand_reps: int,
    gait_asymmetry_pct: float,
    varus_valgus_alignment: str,
    acoustic_burst_count: int,
    steep_slope_walking: bool = False,
    heavy_load_carrying: bool = False,
    kl_grade_proxy: Optional[int] = None
) -> Dict[str, Any]:
    """
    Computes a normalized 0-100 Composite OA Risk Score.
    """
    # 1. WOMAC component (max 96 points -> weight 30%)
    womac_total = womac_pain + womac_stiffness + womac_function
    womac_pct = min(100.0, (womac_total / 96.0) * 100.0)
    
    # 2. Biomechanical ROM deficit (normal knee flexion: 135-145 deg, weight 20%)
    rom_deficit = max(0.0, 140.0 - knee_rom_deg)
    rom_score = min(100.0, (rom_deficit / 50.0) * 100.0)
    
    # 3. Functional Mobility CST (weight 15%)
    # Normal > 14 reps in 30s. < 8 reps indicates significant weakness
    cst_deficit = max(0.0, 15 - sit_to_stand_reps)
    cst_score = min(100.0, (cst_deficit / 10.0) * 100.0)
    
    # 4. Acoustic VAG Crepitus (weight 15%)
    # 0 bursts: normal, > 5 bursts: severe friction/crepitus
    acoustic_score = min(100.0, (acoustic_burst_count / 6.0) * 100.0)
    
    # 5. Alignment & Asymmetry (weight 10%)
    alignment_risk = 30.0 if "Varus" in varus_valgus_alignment or "Valgus" in varus_valgus_alignment else 0.0
    asymmetry_risk = min(70.0, gait_asymmetry_pct * 3.5)
    biomech_misc = alignment_risk + asymmetry_risk
    
    # 6. Environmental & Terrain (MDoNER specific: weight 10%)
    env_risk = 0.0
    if steep_slope_walking:
        env_risk += 50.0
    if heavy_load_carrying:
        env_risk += 50.0
        
    composite_score = (
        (womac_pct * 0.30) +
        (rom_score * 0.20) +
        (cst_score * 0.15) +
        (acoustic_score * 0.15) +
        (biomech_misc * 0.10) +
        (env_risk * 0.10)
    )
    
    # Adjust for KL Grade if radiographic proxy is present
    if kl_grade_proxy is not None and kl_grade_proxy > 0:
        kl_boost = kl_grade_proxy * 12.0
        composite_score = min(100.0, composite_score * 0.7 + kl_boost * 0.3)
        
    composite_score = round(min(100.0, max(0.0, composite_score)), 1)
    
    if composite_score >= 65.0:
        category = "HIGH"
        referral = "DISTRICT_ORTHOPEDIC_URGENT"
    elif composite_score >= 35.0:
        category = "MODERATE"
        referral = "PHC_PHYSIOTHERAPY_MONITORING"
    else:
        category = "LOW"
        referral = "COMMUNITY_LIFESTYLE_CARE"
        
    return {
        "composite_risk_score": composite_score,
        "risk_category": category,
        "referral_status": referral,
        "breakdown": {
            "womac_component": round(womac_pct, 1),
            "rom_deficit_component": round(rom_score, 1),
            "functional_cst_component": round(cst_score, 1),
            "acoustic_crepitus_component": round(acoustic_score, 1),
            "terrain_occupational_component": round(env_risk, 1)
        }
    }
