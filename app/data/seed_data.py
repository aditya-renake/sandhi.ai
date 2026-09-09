import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, init_db
from app.core.security import get_password_hash
from app.models.user import User
from app.models.patient import Patient
from app.models.screening import Screening
from app.models.biomechanics import BiomechanicsRecord
from app.models.xray_record import XrayRecord
from app.schemas.screening import FullScreeningSubmission, ClinicalSymptomsInput, WOMACAnswers, BiomechanicsInput, XrayInput
from app.services.screening_service import ScreeningService

SAMPLE_USERS = [
    {
        "username": "asha_assam",
        "full_name": "Minoti Das (ASHA)",
        "email": "minoti.das@assamhealth.gov.in",
        "password": "password123",
        "role": "asha_worker",
        "state": "Assam",
        "district": "Dibrugarh",
        "phc_name": "Chabua Tea Estate PHC"
    },
    {
        "username": "asha_mizoram",
        "full_name": "Lalremruati Sailo (ASHA)",
        "email": "lalremruati@mizohealth.gov.in",
        "password": "password123",
        "role": "asha_worker",
        "state": "Mizoram",
        "district": "Aizawl",
        "phc_name": "Durtlang Sub-Centre"
    },
    {
        "username": "ortho_mdoner",
        "full_name": "Dr. Subhasish Barua (MS Ortho)",
        "email": "s.barua@gmch.gov.in",
        "password": "password123",
        "role": "district_ortho",
        "state": "Assam",
        "district": "Kamrup Metropolitan",
        "phc_name": "Gauhati Medical College Hospital"
    }
]

SAMPLE_PATIENTS = [
    {
        "patient_uuid": "p_assam_001",
        "abha_id": "14-5829-1029-4821",
        "full_name": "Bimla Karmakar",
        "age": 54,
        "gender": "Female",
        "contact_number": "+91 94351 28941",
        "state": "Assam",
        "district": "Dibrugarh",
        "village_town": "Tinkhong Tea Estate",
        "terrain_type": "Foothills",
        "occupation": "Tea Garden Worker",
        "daily_heavy_load_hours": 6.5,
        "squatting_kneeling_hours": 4.0,
        "height_cm": 152.0,
        "weight_kg": 64.0,
        "bmi": 27.7,
        "prior_joint_injury": "Right Knee (Sprain 2021)",
        "family_history_oa": "Yes",
        "primary_symptom_side": "Right Knee"
    },
    {
        "patient_uuid": "p_mizoram_002",
        "abha_id": "91-4921-3910-8472",
        "full_name": "Lalmuanpuia",
        "age": 49,
        "gender": "Male",
        "contact_number": "+91 98623 44102",
        "state": "Mizoram",
        "district": "Champhai",
        "village_town": "Zokhawthar",
        "terrain_type": "Hilly/Steep",
        "occupation": "Terrace Farmer",
        "daily_heavy_load_hours": 5.0,
        "squatting_kneeling_hours": 5.5,
        "height_cm": 165.0,
        "weight_kg": 68.0,
        "bmi": 25.0,
        "prior_joint_injury": "None",
        "family_history_oa": "No",
        "primary_symptom_side": "Bilateral Knee"
    },
    {
        "patient_uuid": "p_arunachal_003",
        "abha_id": "32-8419-7721-9941",
        "full_name": "Dorjee Tsering",
        "age": 62,
        "gender": "Male",
        "contact_number": "+91 94024 11983",
        "state": "Arunachal Pradesh",
        "district": "Tawang",
        "village_town": "Lumla",
        "terrain_type": "High Altitude Mountain",
        "occupation": "Hill Porter",
        "daily_heavy_load_hours": 7.0,
        "squatting_kneeling_hours": 3.0,
        "height_cm": 160.0,
        "weight_kg": 62.0,
        "bmi": 24.2,
        "prior_joint_injury": "Left Knee (Fall 2019)",
        "family_history_oa": "Yes",
        "primary_symptom_side": "Left Knee"
    },
    {
        "patient_uuid": "p_manipur_004",
        "abha_id": "78-1934-6629-3310",
        "full_name": "Thoibi Devi",
        "age": 45,
        "gender": "Female",
        "contact_number": "+91 97741 88320",
        "state": "Manipur",
        "district": "Imphal East",
        "village_town": "Yairipok",
        "terrain_type": "Valley/Plains",
        "occupation": "Handloom Weaver",
        "daily_heavy_load_hours": 1.5,
        "squatting_kneeling_hours": 6.0,
        "height_cm": 150.0,
        "weight_kg": 52.0,
        "bmi": 23.1,
        "prior_joint_injury": "None",
        "family_history_oa": "No",
        "primary_symptom_side": "Right Knee"
    }
]

async def seed_database():
    await init_db()
    async with AsyncSessionLocal() as db:
        # 1. Seed Users
        for u in SAMPLE_USERS:
            existing = await db.execute(select(User).where(User.username == u["username"]))
            if not existing.scalar_one_or_none():
                user_obj = User(
                    username=u["username"],
                    full_name=u["full_name"],
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    role=u["role"],
                    state=u["state"],
                    district=u["district"],
                    phc_name=u["phc_name"]
                )
                db.add(user_obj)
        await db.commit()

        # 2. Seed Patients & Screenings
        for p_data in SAMPLE_PATIENTS:
            existing = await db.execute(select(Patient).where(Patient.patient_uuid == p_data["patient_uuid"]))
            p_obj = existing.scalar_one_or_none()
            if not p_obj:
                p_obj = Patient(**p_data)
                db.add(p_obj)
                await db.flush()

                # Add realistic screening for Bimla Karmakar (Moderate OA Tea Worker)
                if p_data["full_name"] == "Bimla Karmakar":
                    submission = FullScreeningSubmission(
                        screening_uuid=f"sc_{uuid.uuid4().hex[:12]}",
                        patient_id=p_obj.id,
                        symptoms=ClinicalSymptomsInput(
                            womac_answers=WOMACAnswers(
                                pain_walking=3, pain_stairs=3, pain_in_bed=1, pain_sitting=1, pain_standing=3,
                                stiffness_morning=2, stiffness_evening=2,
                                difficulty_stairs_down=3, difficulty_stairs_up=3, difficulty_rising_sitting=2,
                                difficulty_standing=3, difficulty_bending_floor=3, difficulty_walking_flat=2,
                                difficulty_getting_in_out_car=2, difficulty_squatting_ner_chores=3, difficulty_heavy_domestic_duties=3
                            ),
                            vas_pain_score=6.0,
                            morning_stiffness_minutes=20.0,
                            joint_crepitus_reported="Yes",
                            bony_enlargement_reported="Yes"
                        ),
                        biomechanics=BiomechanicsInput(
                            left_knee_flexion_max=128.0,
                            left_knee_extension_deficit=2.0,
                            right_knee_flexion_max=108.0, # Restriction on affected right side
                            right_knee_extension_deficit=6.0,
                            left_knee_alignment_angle=179.0,
                            right_knee_alignment_angle=172.0, # Genu Varum
                            cadence_steps_per_min=88.0,
                            step_time_asymmetry_index=14.5,
                            stance_phase_ratio_affected_side=0.49,
                            antalgic_limp_detected="Moderate",
                            cst_30s_rep_count=8,
                            tug_duration_seconds=13.2
                        ),
                        xray=XrayInput(
                            kl_grade=2,
                            kl_grade_confidence=0.92,
                            medial_jsn_mm=2.9,
                            lateral_jsn_mm=4.8,
                            jsn_severity="Mild to Moderate",
                            osteophytes_detected="Definite Small Osteophytes",
                            subchondral_sclerosis="Present",
                            subchondral_cysts="Absent"
                        )
                    )
                    await ScreeningService.process_and_save_screening(db, submission)

                # Add early-stage screening for Lalmuanpuia (Mild OA Terrace Farmer)
                elif p_data["full_name"] == "Lalmuanpuia":
                    submission = FullScreeningSubmission(
                        screening_uuid=f"sc_{uuid.uuid4().hex[:12]}",
                        patient_id=p_obj.id,
                        symptoms=ClinicalSymptomsInput(
                            womac_answers=WOMACAnswers(
                                pain_walking=2, pain_stairs=2, pain_in_bed=0, pain_sitting=0, pain_standing=1,
                                stiffness_morning=1, stiffness_evening=1,
                                difficulty_stairs_down=2, difficulty_stairs_up=2, difficulty_rising_sitting=1,
                                difficulty_standing=1, difficulty_bending_floor=2, difficulty_walking_flat=1,
                                difficulty_getting_in_out_car=1, difficulty_squatting_ner_chores=2, difficulty_heavy_domestic_duties=2
                            ),
                            vas_pain_score=3.5,
                            morning_stiffness_minutes=15.0,
                            joint_crepitus_reported="Yes",
                            bony_enlargement_reported="No"
                        ),
                        biomechanics=BiomechanicsInput(
                            left_knee_flexion_max=124.0,
                            left_knee_extension_deficit=2.0,
                            right_knee_flexion_max=122.0,
                            right_knee_extension_deficit=3.0,
                            left_knee_alignment_angle=177.0,
                            right_knee_alignment_angle=176.0,
                            cadence_steps_per_min=102.0,
                            step_time_asymmetry_index=6.2,
                            stance_phase_ratio_affected_side=0.56,
                            antalgic_limp_detected="Mild",
                            cst_30s_rep_count=12,
                            tug_duration_seconds=10.5
                        )
                    )
                    await ScreeningService.process_and_save_screening(db, submission)

        await db.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_database())
