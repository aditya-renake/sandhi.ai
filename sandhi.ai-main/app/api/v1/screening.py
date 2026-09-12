from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.patient import Patient
from app.models.screening import Screening
from app.schemas.screening import (
    FullScreeningSubmission,
    MultimodalRiskEvaluationResponse,
    ClinicalSymptomsInput,
    BiomechanicsInput,
    XrayInput
)
from app.ai_engine.multimodal_risk import MultimodalOARiskEngine
from app.services.screening_service import ScreeningService

router = APIRouter(prefix="/screening", tags=["Screening & Risk Assessment"])

@router.post("/evaluate-risk", response_model=MultimodalRiskEvaluationResponse)
async def evaluate_risk_preview(
    patient_id: int,
    symptoms: ClinicalSymptomsInput,
    biomechanics: BiomechanicsInput = None,
    xray: XrayInput = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Computes real-time multimodal Early OA Risk score for interactive preview without saving.
    """
    p_res = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = p_res.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient ID {patient_id} not found.")

    return MultimodalOARiskEngine.evaluate_risk(
        patient_id=patient.id,
        patient_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        state=patient.state,
        district=patient.district,
        occupation=patient.occupation,
        terrain_type=patient.terrain_type,
        daily_heavy_load_hours=patient.daily_heavy_load_hours,
        squatting_hours=patient.squatting_kneeling_hours,
        bmi=patient.bmi,
        prior_injury=patient.prior_joint_injury,
        symptoms=symptoms,
        biomechanics=biomechanics,
        xray=xray
    )

@router.post("/submit", response_model=MultimodalRiskEvaluationResponse)
async def submit_screening_session(
    submission: FullScreeningSubmission,
    db: AsyncSession = Depends(get_db)
):
    """
    Submits and records complete field screening:
    - Stores clinical symptoms (WOMAC/VAS)
    - Stores CV biomechanics (ROM, Alignment, Gait)
    - Stores radiographic findings (if available)
    - Calculates Multimodal Risk Tier and triggers referral recommendations
    - Returns instant QR code and PDF report generation handle
    """
    return await ScreeningService.process_and_save_screening(db, submission)

@router.get("/{screening_id}")
async def get_screening_record(screening_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieves full details of a previously conducted screening."""
    stmt = (
        select(Screening)
        .where(Screening.id == screening_id)
        .options(
            selectinload(Screening.patient),
            selectinload(Screening.biomechanics),
            selectinload(Screening.xray_record)
        )
    )
    res = await db.execute(stmt)
    sc = res.scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="Screening record not found.")

    return {
        "screening_id": sc.id,
        "screening_uuid": sc.screening_uuid,
        "patient": {
            "id": sc.patient.id,
            "name": sc.patient.full_name,
            "age": sc.patient.age,
            "state": sc.patient.state,
            "district": sc.patient.district,
            "occupation": sc.patient.occupation,
            "abha_id": sc.patient.abha_id
        },
        "composite_risk_score": sc.composite_risk_score,
        "risk_tier": sc.risk_tier,
        "predicted_phenotype": sc.predicted_phenotype,
        "womac_total_score": sc.womac_total_score,
        "vas_pain_score": sc.vas_pain_score,
        "recommended_physiotherapy": sc.recommended_physiotherapy.split("\n") if sc.recommended_physiotherapy else [],
        "ergonomic_terrain_advice": sc.ergonomic_terrain_advice.split("\n") if sc.ergonomic_terrain_advice else [],
        "lifestyle_nutrition_guidance": sc.lifestyle_nutrition_guidance.split("\n") if sc.lifestyle_nutrition_guidance else [],
        "referral_urgency": sc.referral_urgency,
        "referred_to_hospital": sc.referred_to_hospital,
        "created_at": sc.created_at.isoformat(),
        "biomechanics": {
            "left_flexion": sc.biomechanics.left_knee_flexion_max if sc.biomechanics else None,
            "right_flexion": sc.biomechanics.right_knee_flexion_max if sc.biomechanics else None,
            "step_asymmetry_pct": sc.biomechanics.step_time_asymmetry_index if sc.biomechanics else None,
            "antalgic_limp": sc.biomechanics.antalgic_limp_detected if sc.biomechanics else None,
            "cst_30s_reps": sc.biomechanics.cst_30s_rep_count if sc.biomechanics else None
        } if sc.biomechanics else None,
        "xray": {
            "kl_grade": sc.xray_record.kl_grade if sc.xray_record else None,
            "medial_jsn_mm": sc.xray_record.medial_jsn_mm if sc.xray_record else None,
            "osteophytes": sc.xray_record.osteophytes_detected if sc.xray_record else None
        } if sc.xray_record else None
    }
