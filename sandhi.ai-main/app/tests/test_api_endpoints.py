import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db

@pytest.fixture(autouse=True)
async def initialize_test_database():
    await init_db()

@pytest.mark.asyncio
async def test_root_and_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/")
        assert res.status_code == 200
        data = res.json()
        assert data["problem_statement_id"] == "26004"
        assert "Assam" in data["supported_ner_states"]

        health_res = await ac.get("/health")
        assert health_res.status_code == 200
        assert health_res.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_auth_and_patient_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        rand_suffix = uuid.uuid4().hex[:6]
        # 1. Register ASHA worker
        reg_res = await ac.post("/api/v1/auth/register", json={
            "username": f"asha_{rand_suffix}",
            "full_name": "Rita Saikia (ANM)",
            "email": f"rita_{rand_suffix}@test.gov.in",
            "password": "securepassword123",
            "role": "asha_worker",
            "state": "Assam",
            "district": "Jorhat",
            "phc_name": "Titabar PHC"
        })
        assert reg_res.status_code in [200, 400]

        # 2. Login
        login_res = await ac.post("/api/v1/auth/login", data={
            "username": f"asha_{rand_suffix}",
            "password": "securepassword123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        assert token is not None

        # 3. Create Patient
        p_res = await ac.post("/api/v1/patients/", json={
            "patient_uuid": f"test_uuid_{rand_suffix}",
            "abha_id": f"99-{rand_suffix}-3344-5566",
            "full_name": "Kalyani Gogoi",
            "age": 52,
            "gender": "Female",
            "contact_number": "+91 94350 12345",
            "state": "Assam",
            "district": "Jorhat",
            "village_town": "Titabar",
            "terrain_type": "Foothills",
            "occupation": "Tea Garden Worker",
            "daily_heavy_load_hours": 5.0,
            "squatting_kneeling_hours": 3.5,
            "height_cm": 155.0,
            "weight_kg": 60.0,
            "bmi": 25.0,
            "prior_joint_injury": "None",
            "family_history_oa": "Yes",
            "primary_symptom_side": "Right Knee"
        })
        assert p_res.status_code == 200
        patient = p_res.json()
        patient_id = patient["id"]

        # 4. Search Patients
        search_res = await ac.get("/api/v1/patients/?query=Kalyani")
        assert search_res.status_code == 200
        assert len(search_res.json()) >= 1

        # 5. Submit Full Screening
        screening_res = await ac.post("/api/v1/screening/submit", json={
            "screening_uuid": f"sc_test_{rand_suffix}",
            "patient_id": patient_id,
            "symptoms": {
                "womac_answers": {
                    "pain_walking": 2, "pain_stairs": 2, "pain_in_bed": 0, "pain_sitting": 0, "pain_standing": 2,
                    "stiffness_morning": 1, "stiffness_evening": 1,
                    "difficulty_stairs_down": 2, "difficulty_stairs_up": 2, "difficulty_rising_sitting": 1,
                    "difficulty_standing": 1, "difficulty_bending_floor": 2, "difficulty_walking_flat": 1,
                    "difficulty_getting_in_out_car": 1, "difficulty_squatting_ner_chores": 2, "difficulty_heavy_domestic_duties": 2
                },
                "vas_pain_score": 4.0,
                "morning_stiffness_minutes": 15.0,
                "joint_crepitus_reported": "Yes",
                "bony_enlargement_reported": "No"
            },
            "biomechanics": {
                "left_knee_flexion_max": 130.0,
                "left_knee_extension_deficit": 1.0,
                "right_knee_flexion_max": 118.0,
                "right_knee_extension_deficit": 4.0,
                "left_knee_alignment_angle": 178.0,
                "right_knee_alignment_angle": 174.0,
                "cadence_steps_per_min": 98.0,
                "step_time_asymmetry_index": 7.5,
                "stance_phase_ratio_affected_side": 0.54,
                "antalgic_limp_detected": "Mild",
                "cst_30s_rep_count": 11,
                "tug_duration_seconds": 11.0
            }
        })
        assert screening_res.status_code == 200
        sc_data = screening_res.json()
        assert sc_data["composite_risk_score"] > 0
        assert sc_data["risk_tier"] in ["Low Risk", "Mild / Early OA", "Moderate OA", "Severe OA"]
        assert sc_data["qr_code_base64"] is not None

        # 6. Regional Analytics
        analytics_res = await ac.get("/api/v1/analytics/ner-overview")
        assert analytics_res.status_code == 200
        assert len(analytics_res.json()["state_breakdown"]) == 8

        # 7. Guidance
        guidance_res = await ac.get("/api/v1/guidance/exercises?lang=as")
        assert guidance_res.status_code == 200
        assert guidance_res.json()["total_exercises"] >= 4
