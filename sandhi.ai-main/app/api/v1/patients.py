from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.patient import PatientCreate, PatientResponse, PatientSearchQuery
from app.services.patient_service import PatientService

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.post("/", response_model=PatientResponse)
async def create_patient(patient_in: PatientCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new patient with NER demographics, terrain, and occupational risk factors."""
    patient = await PatientService.create_patient(db, patient_in)
    return patient

@router.get("/", response_model=List[PatientResponse])
async def search_patients(
    query: Optional[str] = Query(None, description="Search by name, ABHA ID, village or phone"),
    state: Optional[str] = Query(None, description="Filter by NER State"),
    district: Optional[str] = Query(None, description="Filter by District"),
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Searches and filters registered patients across North Eastern districts."""
    params = PatientSearchQuery(query=query, state=state, district=district, limit=limit, offset=offset)
    patients = await PatientService.search_patients(db, params)
    
    # Enrich with latest risk scores
    res = []
    for p in patients:
        total_sc = len(p.screenings) if p.screenings else 0
        latest_sc = sorted(p.screenings, key=lambda s: s.created_at, reverse=True)[0] if total_sc > 0 else None
        
        p_dict = {
            "id": p.id,
            "patient_uuid": p.patient_uuid,
            "abha_id": p.abha_id,
            "full_name": p.full_name,
            "age": p.age,
            "gender": p.gender,
            "contact_number": p.contact_number,
            "state": p.state,
            "district": p.district,
            "village_town": p.village_town,
            "terrain_type": p.terrain_type,
            "occupation": p.occupation,
            "daily_heavy_load_hours": p.daily_heavy_load_hours,
            "squatting_kneeling_hours": p.squatting_kneeling_hours,
            "height_cm": p.height_cm,
            "weight_kg": p.weight_kg,
            "bmi": p.bmi,
            "prior_joint_injury": p.prior_joint_injury,
            "family_history_oa": p.family_history_oa,
            "primary_symptom_side": p.primary_symptom_side,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "total_screenings": total_sc,
            "latest_risk_score": latest_sc.composite_risk_score if latest_sc else None,
            "latest_risk_tier": latest_sc.risk_tier if latest_sc else None
        }
        res.append(PatientResponse(**p_dict))
    return res

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieves patient details with full screening history."""
    patient = await PatientService.get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    
    total_sc = len(patient.screenings) if patient.screenings else 0
    latest_sc = sorted(patient.screenings, key=lambda s: s.created_at, reverse=True)[0] if total_sc > 0 else None
    
    p_dict = {
        "id": patient.id,
        "patient_uuid": patient.patient_uuid,
        "abha_id": patient.abha_id,
        "full_name": patient.full_name,
        "age": patient.age,
        "gender": patient.gender,
        "contact_number": patient.contact_number,
        "state": patient.state,
        "district": patient.district,
        "village_town": patient.village_town,
        "terrain_type": patient.terrain_type,
        "occupation": patient.occupation,
        "daily_heavy_load_hours": patient.daily_heavy_load_hours,
        "squatting_kneeling_hours": patient.squatting_kneeling_hours,
        "height_cm": patient.height_cm,
        "weight_kg": patient.weight_kg,
        "bmi": patient.bmi,
        "prior_joint_injury": patient.prior_joint_injury,
        "family_history_oa": patient.family_history_oa,
        "primary_symptom_side": patient.primary_symptom_side,
        "created_at": patient.created_at,
        "updated_at": patient.updated_at,
        "total_screenings": total_sc,
        "latest_risk_score": latest_sc.composite_risk_score if latest_sc else None,
        "latest_risk_tier": latest_sc.risk_tier if latest_sc else None
    }
    return PatientResponse(**p_dict)

@router.get("/{patient_id}/progression")
async def get_patient_progression(patient_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieves longitudinal progression timeline of OA risk scores and joint metrics over time."""
    return await PatientService.get_patient_progression(db, patient_id)
