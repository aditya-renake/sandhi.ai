from typing import List, Optional
from sqlalchemy import select, or_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from app.models.patient import Patient
from app.models.screening import Screening
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientSearchQuery

class PatientService:
    @staticmethod
    async def create_patient(db: AsyncSession, patient_in: PatientCreate, user_id: Optional[int] = None) -> Patient:
        # Check if abha_id already exists if provided
        if patient_in.abha_id:
            existing = await db.execute(select(Patient).where(Patient.abha_id == patient_in.abha_id))
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient with this ABHA ID already exists.")

        # Calculate BMI if height and weight are provided
        bmi = None
        if patient_in.height_cm and patient_in.weight_kg and patient_in.height_cm > 0:
            height_m = patient_in.height_cm / 100.0
            bmi = round(patient_in.weight_kg / (height_m * height_m), 1)

        db_patient = Patient(
            patient_uuid=patient_in.patient_uuid,
            abha_id=patient_in.abha_id,
            full_name=patient_in.full_name,
            age=patient_in.age,
            gender=patient_in.gender,
            contact_number=patient_in.contact_number,
            state=patient_in.state,
            district=patient_in.district,
            village_town=patient_in.village_town,
            terrain_type=patient_in.terrain_type,
            occupation=patient_in.occupation,
            daily_heavy_load_hours=patient_in.daily_heavy_load_hours,
            squatting_kneeling_hours=patient_in.squatting_kneeling_hours,
            height_cm=patient_in.height_cm,
            weight_kg=patient_in.weight_kg,
            bmi=bmi if bmi is not None else patient_in.bmi,
            prior_joint_injury=patient_in.prior_joint_injury,
            family_history_oa=patient_in.family_history_oa,
            primary_symptom_side=patient_in.primary_symptom_side,
            registered_by_user_id=user_id
        )

        db.add(db_patient)
        await db.commit()
        await db.refresh(db_patient)
        return db_patient

    @staticmethod
    async def get_patient_by_id(db: AsyncSession, patient_id: int) -> Optional[Patient]:
        stmt = (
            select(Patient)
            .where(Patient.id == patient_id)
            .options(
                selectinload(Patient.screenings)
                .selectinload(Screening.biomechanics),
                selectinload(Patient.screenings)
                .selectinload(Screening.xray_record)
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def search_patients(db: AsyncSession, params: PatientSearchQuery) -> List[Patient]:
        stmt = select(Patient).options(selectinload(Patient.screenings))

        if params.query:
            q = f"%{params.query}%"
            stmt = stmt.where(or_(
                Patient.full_name.ilike(q),
                Patient.abha_id.ilike(q),
                Patient.village_town.ilike(q),
                Patient.contact_number.ilike(q)
            ))

        if params.state:
            stmt = stmt.where(Patient.state == params.state)

        if params.district:
            stmt = stmt.where(Patient.district == params.district)

        stmt = stmt.order_by(desc(Patient.created_at)).offset(params.offset).limit(params.limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_patient_progression(db: AsyncSession, patient_id: int) -> dict:
        patient = await PatientService.get_patient_by_id(db, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        screenings = sorted(patient.screenings, key=lambda s: s.created_at)
        history = []
        for s in screenings:
            history.append({
                "screening_id": s.id,
                "date": s.created_at.isoformat(),
                "composite_risk_score": s.composite_risk_score,
                "risk_tier": s.risk_tier,
                "womac_total": s.womac_total_score,
                "vas_pain": s.vas_pain_score,
                "left_flexion": s.biomechanics.left_knee_flexion_max if s.biomechanics else None,
                "right_flexion": s.biomechanics.right_knee_flexion_max if s.biomechanics else None,
                "kl_grade": s.xray_record.kl_grade if s.xray_record else None
            })

        return {
            "patient_id": patient.id,
            "full_name": patient.full_name,
            "age": patient.age,
            "occupation": patient.occupation,
            "total_screenings": len(screenings),
            "longitudinal_history": history
        }
