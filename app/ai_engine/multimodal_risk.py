from typing import Dict, Any, List, Optional
from app.schemas.screening import (
    ClinicalSymptomsInput,
    BiomechanicsInput,
    XrayInput,
    MultimodalRiskEvaluationResponse,
    RiskComponentBreakdown,
    WOMACAnswers
)
from app.ai_engine.clinical_rules import ClinicalRuleEngine
from app.ai_engine.occupational_factors import NEROccupationalRiskModel

class MultimodalOARiskEngine:
    """Fuses multi-source diagnostic signals to compute early OA risk index and actionable care plan."""

    @staticmethod
    def evaluate_risk(
        patient_id: int,
        patient_name: str,
        age: int,
        gender: str,
        state: str,
        district: str,
        occupation: str,
        terrain_type: str,
        daily_heavy_load_hours: float,
        squatting_hours: float,
        bmi: Optional[float],
        prior_injury: str,
        symptoms: ClinicalSymptomsInput,
        biomechanics: Optional[BiomechanicsInput] = None,
        xray: Optional[XrayInput] = None,
        screening_uuid: str = "temp-uuid"
    ) -> MultimodalRiskEvaluationResponse:
        factors: List[str] = []

        # 1. Clinical Symptom Scoring (WOMAC & VAS)
        womac_ans = symptoms.womac_answers or WOMACAnswers()
        pain_sc, stiff_sc, func_sc, womac_tot, womac_pct = ClinicalRuleEngine.calculate_womac_scores(womac_ans)
        
        symptom_score = (womac_pct * 0.70) + (symptoms.vas_pain_score * 10.0 * 0.30)
        symptom_score = min(100.0, symptom_score)

        if womac_tot > 30:
            factors.append(f"Elevated WOMAC symptom burden: {womac_tot}/96 ({womac_pct}%)")
        if symptoms.vas_pain_score >= 4.0:
            factors.append(f"Moderate-to-severe joint pain (VAS {symptoms.vas_pain_score}/10)")

        acr_eval = ClinicalRuleEngine.evaluate_acr_criteria(age, symptoms)
        if acr_eval["acr_positive"]:
            factors.append("Positive ACR clinical diagnostic criteria for knee osteoarthritis")

        # 2. Biomechanical Kinematic Scoring
        bio = biomechanics or BiomechanicsInput()
        bio_score = 10.0

        # ROM loss evaluation
        min_flex = min(bio.left_knee_flexion_max, bio.right_knee_flexion_max)
        max_ext_lag = max(bio.left_knee_extension_deficit, bio.right_knee_extension_deficit)

        if min_flex < 120.0:
            deficit = 135.0 - min_flex
            bio_score += min(35.0, deficit * 1.2)
            factors.append(f"Knee flexion restriction ({min_flex}° vs normal 135°)")

        if max_ext_lag > 4.0:
            bio_score += min(20.0, max_ext_lag * 2.5)
            factors.append(f"Knee extension lag deficit ({max_ext_lag}°)")

        # Alignment
        if bio.left_knee_alignment_angle < 175.0 or bio.right_knee_alignment_angle < 175.0:
            bio_score += 15.0
            factors.append("Genu Varum (Bowleg) mechanical axis overload on medial compartment")
        elif bio.left_knee_alignment_angle > 183.0 or bio.right_knee_alignment_angle > 183.0:
            bio_score += 12.0
            factors.append("Genu Valgum (Knock-knee) mechanical axis strain on lateral compartment")

        # Gait Asymmetry & Antalgic Limp
        if bio.step_time_asymmetry_index > 8.0:
            bio_score += min(25.0, bio.step_time_asymmetry_index * 1.5)
            factors.append(f"Gait step-time asymmetry index: {bio.step_time_asymmetry_index}%")

        if bio.antalgic_limp_detected in ["Moderate", "Severe"]:
            bio_score += 15.0
            factors.append(f"{bio.antalgic_limp_detected} antalgic limp pattern during walking")

        # Functional strength (30s CST)
        if bio.cst_30s_rep_count < 11:
            bio_score += 15.0
            factors.append(f"Reduced lower-limb functional power (30s Chair Stand: {bio.cst_30s_rep_count} reps)")

        bio_score = min(100.0, round(bio_score, 1))

        # 3. Demographic & Occupational/Terrain Strain
        occ_score, occ_info = NEROccupationalRiskModel.calculate_occupational_score(
            occupation, terrain_type, daily_heavy_load_hours, squatting_hours
        )
        if daily_heavy_load_hours >= 4.0:
            factors.append(f"High occupational joint load: {daily_heavy_load_hours} hrs/day load carrying in {terrain_type} terrain")

        # Demographic BMI & Age
        demo_score = 10.0
        if age >= 55:
            demo_score += min(35.0, (age - 50) * 1.5)
        if bmi and bmi > 25.0:
            demo_score += min(40.0, (bmi - 23.0) * 4.0)
            factors.append(f"Elevated BMI ({round(bmi, 1)} kg/m²) adding axial joint load")
        if prior_injury != "None":
            demo_score += 20.0
            factors.append(f"History of previous joint injury ({prior_injury})")
        demo_score = min(100.0, round(demo_score, 1))

        # 4. Radiographic X-ray findings (if available)
        xray_score: Optional[float] = None
        has_xray = (xray is not None and xray.kl_grade is not None)
        if has_xray:
            x_score = (xray.kl_grade * 22.0) + (5.0 - min(5.0, xray.medial_jsn_mm)) * 5.0
            xray_score = min(100.0, round(x_score, 1))
            if xray.kl_grade >= 2:
                factors.append(f"Radiographic Kellgren-Lawrence Grade {xray.kl_grade} with medial JSN ({xray.medial_jsn_mm}mm)")

        # 5. Composite Multimodal Fusion
        if has_xray and xray_score is not None:
            # 4-Pillar Fusion: CV Biomechanics (28%), Symptoms (28%), Occ/Demo (20%), X-ray (24%)
            composite_score = (
                bio_score * 0.28 +
                symptom_score * 0.28 +
                ((occ_score * 0.6) + (demo_score * 0.4)) * 0.20 +
                xray_score * 0.24
            )
        else:
            # 3-Pillar Field Fusion: CV Biomechanics (38%), Symptoms (38%), Occ/Demo (24%)
            composite_score = (
                bio_score * 0.38 +
                symptom_score * 0.38 +
                ((occ_score * 0.6) + (demo_score * 0.4)) * 0.24
            )

        composite_score = min(100.0, round(composite_score, 1))

        # 6. Risk Tier Stratification
        if composite_score < 30.0:
            risk_tier = "Low Risk"
            referral = "Routine / No Referral Needed"
            referred_hosp = None
        elif composite_score < 55.0:
            risk_tier = "Mild / Early OA"
            referral = "Sub-Centre / PHC Physiotherapy Follow-up"
            referred_hosp = f"{district} Primary Health Centre"
        elif composite_score < 75.0:
            risk_tier = "Moderate OA"
            referral = "District Orthopaedic Referral"
            referred_hosp = f"{district} Civil Hospital / District Ortho Unit"
        else:
            risk_tier = "Severe OA"
            referral = "Urgent Specialist Orthopaedic / Surgical Referral"
            referred_hosp = f"{state} State Medical College / Regional Orthopaedic Centre"

        # 7. Sub-Phenotype Classification
        if has_xray and xray.kl_grade >= 3:
            phenotype = "Radiographic Structural OA"
        elif bio_score > 60.0 or "Varus" in str(factors):
            phenotype = "Biomechanical Load & Malalignment Phenotype"
        elif symptom_score > 60.0:
            phenotype = "Inflammatory & Symptom-Dominant Phenotype"
        else:
            phenotype = "Occupational & Terrain Strain Phenotype"

        # 8. Clinical Recommendations
        physio_recs = MultimodalOARiskEngine._get_physiotherapy_plan(risk_tier, min_flex)
        ergo_recs = occ_info.get("ergonomic_advice", [])
        nutrition_recs = MultimodalOARiskEngine._get_nutrition_guidance(state)

        return MultimodalRiskEvaluationResponse(
            screening_uuid=screening_uuid,
            patient_id=patient_id,
            patient_name=patient_name,
            patient_age=age,
            patient_state=state,
            patient_district=district,
            patient_occupation=occupation,
            composite_risk_score=composite_score,
            risk_tier=risk_tier,
            predicted_phenotype=phenotype,
            risk_components=RiskComponentBreakdown(
                biomechanics_score=bio_score,
                symptom_womac_score=symptom_score,
                occupational_terrain_score=occ_score,
                xray_structural_score=xray_score,
                demographic_bmi_score=demo_score
            ),
            womac_total_score=womac_tot,
            womac_percentage=womac_pct,
            primary_contributing_factors=factors if factors else ["Normal joint kinematics and baseline mobility."],
            recommended_physiotherapy=physio_recs,
            ergonomic_terrain_advice=ergo_recs,
            lifestyle_nutrition_guidance=nutrition_recs,
            referral_urgency=referral,
            referred_to_hospital=referred_hosp
        )

    @staticmethod
    def _get_physiotherapy_plan(risk_tier: str, min_flex: float) -> List[str]:
        if risk_tier == "Low Risk":
            return [
                "Daily 20-30 min brisk walk on level paths.",
                "Standing quadriceps stretching (3 repetitions of 20-second holds each leg).",
                "Heel-toe raises to maintain ankle and calf shock-absorbing strength."
            ]
        elif risk_tier == "Mild / Early OA":
            return [
                "Isometric quadriceps sets (press back of knee into rolled towel, hold 6s, 15 reps).",
                "Straight leg raises (supine, 3 sets of 10 reps daily).",
                "Hamstring and calf stretching to relieve anterior knee compartment compression.",
                "Closed-chain seated heel slides to preserve knee flexion arc."
            ]
        elif risk_tier == "Moderate OA":
            return [
                "Supervised physical therapy for vastus medialis obliquus (VMO) re-education.",
                "Use unloader knee brace or neoprene sleeve during heavy field/hill walking.",
                "Seated terminal knee extensions with 1kg ankle weight.",
                "Avoid deep squatting (>90°) and high-impact hill jumping."
            ]
        else:
            return [
                "Non-weight bearing range-of-motion maintenance in seated/supine position.",
                "Use bilateral walking canes/bamboo poles for all ambulation.",
                "Urgent orthopaedic consultation for intra-articular therapies or surgical evaluation."
            ]

    @staticmethod
    def _get_nutrition_guidance(state: str) -> List[str]:
        return [
            "Incorporate locally available anti-inflammatory traditional greens (e.g. Dhekia saak, Mandukaparni/Centella asiatica, Lai saak).",
            "Ensure adequate dietary calcium and Vitamin D (fermented bamboo shoots, small fish with edible bones, local milk/curd).",
            "Maintain optimal daily hydration (2.5 - 3 liters) to support articular cartilage proteoglycan matrix hydration.",
            "Use natural turmeric (haldi) with black pepper in daily meals for curcumin-based joint inflammation reduction."
        ]
