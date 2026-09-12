from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.screening import Screening
from app.schemas.screening import MultimodalRiskEvaluationResponse, RiskComponentBreakdown
from app.services.pdf_report_service import PDFReportService

router = APIRouter(prefix="/reports", tags=["Reports & QR Verification"])

@router.get("/{screening_id}/download")
async def download_clinical_pdf_report(screening_id: int, db: AsyncSession = Depends(get_db)):
    """Generates and downloads a comprehensive bilingual clinical screening report with embedded QR code."""
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

    p = sc.patient
    eval_resp = MultimodalRiskEvaluationResponse(
        screening_uuid=sc.screening_uuid,
        patient_id=p.id,
        patient_name=p.full_name,
        patient_age=p.age,
        patient_state=p.state,
        patient_district=p.district,
        patient_occupation=p.occupation,
        composite_risk_score=sc.composite_risk_score,
        risk_tier=sc.risk_tier,
        predicted_phenotype=sc.predicted_phenotype,
        risk_components=RiskComponentBreakdown(
            biomechanics_score=sc.composite_risk_score * 0.9,
            symptom_womac_score=(sc.womac_total_score / 96.0) * 100.0,
            occupational_terrain_score=50.0,
            xray_structural_score=sc.xray_record.kl_grade * 25.0 if sc.xray_record else None,
            demographic_bmi_score=40.0
        ),
        womac_total_score=sc.womac_total_score,
        womac_percentage=round((sc.womac_total_score / 96.0) * 100.0, 1),
        primary_contributing_factors=[
            f"WOMAC Symptom Index: {sc.womac_total_score}/96",
            f"Risk Category: {sc.risk_tier}",
            f"Occupational strain: {p.occupation} in {p.terrain_type} terrain."
        ],
        recommended_physiotherapy=sc.recommended_physiotherapy.split("\n") if sc.recommended_physiotherapy else [],
        ergonomic_terrain_advice=sc.ergonomic_terrain_advice.split("\n") if sc.ergonomic_terrain_advice else [],
        lifestyle_nutrition_guidance=sc.lifestyle_nutrition_guidance.split("\n") if sc.lifestyle_nutrition_guidance else [],
        referral_urgency=sc.referral_urgency,
        referred_to_hospital=sc.referred_to_hospital
    )

    filename = f"Sandhi_NER_Report_{p.full_name.replace(' ', '_')}_{sc.id}.pdf"
    pdf_path = PDFReportService.create_clinical_report_pdf(
        evaluation=eval_resp,
        abha_id=p.abha_id or "Pending Registration",
        output_filename=filename
    )

    return FileResponse(
        path=str(pdf_path),
        filename=filename,
        media_type="application/pdf"
    )

@router.get("/{screening_id}/qr")
async def get_screening_qr_data(screening_id: int, db: AsyncSession = Depends(get_db)):
    """Returns QR code image and validation string for tele-consultation handshake."""
    stmt = (
        select(Screening)
        .where(Screening.id == screening_id)
        .options(selectinload(Screening.patient))
    )
    res = await db.execute(stmt)
    sc = res.scalar_one_or_none()
    if not sc:
        raise HTTPException(status_code=404, detail="Screening not found.")

    qr_payload = (
        f"SANDHI-NER|ID:{sc.patient.id}|NAME:{sc.patient.full_name}|AGE:{sc.patient.age}|"
        f"STATE:{sc.patient.state}|RISK:{sc.risk_tier}|SCORE:{sc.composite_risk_score}|"
        f"WOMAC:{sc.womac_total_score}|REFERRAL:{sc.referral_urgency}"
    )
    b64, _ = PDFReportService.generate_qr_code(qr_payload)
    return {
        "screening_id": sc.id,
        "qr_payload_text": qr_payload,
        "qr_image_base64": b64
    }
