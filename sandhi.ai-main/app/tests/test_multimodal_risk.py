import pytest
from app.ai_engine.multimodal_risk import MultimodalOARiskEngine
from app.ai_engine.clinical_rules import ClinicalRuleEngine
from app.ai_engine.occupational_factors import NEROccupationalRiskModel
from app.schemas.screening import ClinicalSymptomsInput, WOMACAnswers, BiomechanicsInput, XrayInput

def test_womac_calculation():
    ans = WOMACAnswers(
        pain_walking=2, pain_stairs=2, pain_in_bed=1, pain_sitting=1, pain_standing=2, # Pain = 8
        stiffness_morning=2, stiffness_evening=1, # Stiffness = 3
        difficulty_stairs_down=2, difficulty_stairs_up=2, difficulty_rising_sitting=1,
        difficulty_standing=2, difficulty_bending_floor=2, difficulty_walking_flat=1,
        difficulty_getting_in_out_car=1, difficulty_squatting_ner_chores=2, difficulty_heavy_domestic_duties=2
    )
    pain, stiff, func, total, pct = ClinicalRuleEngine.calculate_womac_scores(ans)
    assert pain == 8.0
    assert stiff == 3.0
    assert total > 0.0
    assert 0.0 <= pct <= 100.0

def test_occupational_risk_multipliers():
    # Tea garden worker carrying heavy loads on hills
    score_tea, _ = NEROccupationalRiskModel.calculate_occupational_score(
        occupation="Tea Garden Worker",
        terrain_type="Hilly/Steep",
        daily_heavy_load_hours=6.0,
        squatting_hours=4.0
    )

    # General worker on flat valley
    score_general, _ = NEROccupationalRiskModel.calculate_occupational_score(
        occupation="Other / General",
        terrain_type="Valley/Plains",
        daily_heavy_load_hours=1.0,
        squatting_hours=1.0
    )

    assert score_tea > score_general

def test_multimodal_risk_stratification():
    # High risk case: Elderly tea worker with severe symptoms and ROM deficit
    res = MultimodalOARiskEngine.evaluate_risk(
        patient_id=1,
        patient_name="Bimla Karmakar",
        age=58,
        gender="Female",
        state="Assam",
        district="Dibrugarh",
        occupation="Tea Garden Worker",
        terrain_type="Foothills",
        daily_heavy_load_hours=6.0,
        squatting_hours=4.0,
        bmi=28.4,
        prior_injury="Right Knee",
        symptoms=ClinicalSymptomsInput(
            womac_answers=WOMACAnswers(
                pain_walking=3, pain_stairs=4, pain_in_bed=2, pain_sitting=2, pain_standing=3,
                stiffness_morning=3, stiffness_evening=2,
                difficulty_stairs_down=4, difficulty_stairs_up=4, difficulty_rising_sitting=3,
                difficulty_standing=3, difficulty_bending_floor=3, difficulty_walking_flat=3,
                difficulty_getting_in_out_car=3, difficulty_squatting_ner_chores=4, difficulty_heavy_domestic_duties=3
            ),
            vas_pain_score=7.0,
            morning_stiffness_minutes=25.0,
            joint_crepitus_reported="Yes",
            bony_enlargement_reported="Yes"
        ),
        biomechanics=BiomechanicsInput(
            right_knee_flexion_max=100.0, # Severe restriction
            right_knee_extension_deficit=8.0,
            right_knee_alignment_angle=170.0, # Severe varus
            step_time_asymmetry_index=18.0,
            cst_30s_rep_count=7
        )
    )

    assert res.composite_risk_score >= 55.0
    assert res.risk_tier in ["Moderate OA", "Severe OA"]
    assert len(res.recommended_physiotherapy) > 0
    assert len(res.ergonomic_terrain_advice) > 0
