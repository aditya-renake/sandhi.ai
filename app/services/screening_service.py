import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.patient import Patient
from app.models.screening import Screening
from app.models.biomechanics import BiomechanicsRecord
from app.models.xray_record import XrayRecord
from app.schemas.screening import FullScreeningSubmission, MultimodalRiskEvaluationResponse
from app.ai_engine.multimodal_risk import MultimodalOARiskEngine
from app.services.pdf_report_service import PDFReportService

class ScreeningService:
    @staticmethod
    async def process_and_save_screening(
        db: AsyncSession,
        submission: FullScreeningSubmission,
        user_id: Optional[int] = None
    ) -> MultimodalRiskEvaluationResponse:
        # 1. Fetch patient
        patient_res = await db.execute(select(Patient).where(Patient.id == submission.patient_id))
        patient = patient_res.scalar_one_or_none()
        if not patient:
            raise HTTPException(status_code=404, detail=f"Patient ID {submission.patient_id} not found.")

        # 2. Evaluate multimodal risk score
        evaluation = MultimodalOARiskEngine.evaluate_risk(
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
            symptoms=submission.symptoms,
            biomechanics=submission.biomechanics,
            xray=submission.xray,
            screening_uuid=submission.screening_uuid
        )

        # 3. Create database records
        db_screening = Screening(
            screening_uuid=submission.screening_uuid,
            patient_id=patient.id,
            screened_by_user_id=user_id,
            womac_pain_score=evaluation.risk_components.symptom_womac_score * 0.20,
            womac_stiffness_score=evaluation.risk_components.symptom_womac_score * 0.08,
            womac_function_score=evaluation.risk_components.symptom_womac_score * 0.68,
            womac_total_score=evaluation.womac_total_score,
            vas_pain_score=submission.symptoms.vas_pain_score,
            morning_stiffness_minutes=submission.symptoms.morning_stiffness_minutes,
            joint_crepitus_reported=submission.symptoms.joint_crepitus_reported,
            bony_enlargement_reported=submission.symptoms.bony_enlargement_reported,
            composite_risk_score=evaluation.composite_risk_score,
            risk_tier=evaluation.risk_tier,
            predicted_phenotype=evaluation.predicted_phenotype,
            recommended_physiotherapy="\n".join(evaluation.recommended_physiotherapy),
            ergonomic_terrain_advice="\n".join(evaluation.ergonomic_terrain_advice),
            lifestyle_nutrition_guidance="\n".join(evaluation.lifestyle_nutrition_guidance),
            referral_urgency=evaluation.referral_urgency,
            referred_to_hospital=evaluation.referred_to_hospital,
            client_created_at=submission.client_created_at
        )
        db.add(db_screening)
        await db.flush()

        # 4. Save Biomechanics Record if provided
        if submission.biomechanics:
            bio = submission.biomechanics
            db_bio = BiomechanicsRecord(
                screening_id=db_screening.id,
                left_knee_flexion_max=bio.left_knee_flexion_max,
                left_knee_extension_deficit=bio.left_knee_extension_deficit,
                right_knee_flexion_max=bio.right_knee_flexion_max,
                right_knee_extension_deficit=bio.right_knee_extension_deficit,
                left_knee_alignment_angle=bio.left_knee_alignment_angle,
                right_knee_alignment_angle=bio.right_knee_alignment_angle,
                cadence_steps_per_min=bio.cadence_steps_per_min,
                step_time_asymmetry_index=bio.step_time_asymmetry_index,
                stance_phase_ratio_affected_side=bio.stance_phase_ratio_affected_side,
                antalgic_limp_detected=bio.antalgic_limp_detected,
                trunk_lateral_sway_deg=bio.trunk_lateral_sway_deg,
                cst_30s_rep_count=bio.cst_30s_rep_count,
                tug_duration_seconds=bio.tug_duration_seconds,
                telemetry_json=bio.telemetry_json
            )
            db.add(db_bio)

        # 5. Save Xray Record if provided
        if submission.xray:
            xr = submission.xray
            db_xr = XrayRecord(
                screening_id=db_screening.id,
                kl_grade=xr.kl_grade,
                kl_grade_confidence=xr.kl_grade_confidence,
                medial_jsn_mm=xr.medial_jsn_mm,
                lateral_jsn_mm=xr.lateral_jsn_mm,
                jsn_severity=xr.jsn_severity,
                osteophytes_detected=xr.osteophytes_detected,
                subchondral_sclerosis=xr.subchondral_sclerosis,
                subchondral_cysts=xr.subchondral_cysts,
                image_filename=xr.image_filename,
                gradcam_filename=xr.gradcam_filename
            )
            db.add(db_xr)

        await db.commit()

        # 6. Generate QR code for instant client report
        qr_data = f"SANDHI-NER|PATIENT:{patient.id}|RISK:{evaluation.risk_tier}|SCORE:{evaluation.composite_risk_score}|UUID:{submission.screening_uuid[:8]}"
        qr_b64, _ = PDFReportService.generate_qr_code(qr_data)
        evaluation.qr_code_base64 = qr_b64
        evaluation.report_download_url = f"/api/v1/reports/{db_screening.id}/download"

        return evaluation
