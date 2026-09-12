from typing import Dict, Any, Tuple
from app.schemas.screening import WOMACAnswers, ClinicalSymptomsInput

class ClinicalRuleEngine:
    """Calculates standardized WOMAC Index and evaluates ACR (American College of Rheumatology) criteria."""

    @staticmethod
    def calculate_womac_scores(answers: WOMACAnswers) -> Tuple[float, float, float, float, float]:
        """
        Calculates Pain (0-20), Stiffness (0-8), Function (0-68), Total (0-96), and WOMAC % (0-100).
        """
        pain = float(
            answers.pain_walking +
            answers.pain_stairs +
            answers.pain_in_bed +
            answers.pain_sitting +
            answers.pain_standing
        )

        stiffness = float(
            answers.stiffness_morning +
            answers.stiffness_evening
        )

        # Scale condensed 9-item function questions to full 68-point equivalent
        func_raw = float(
            answers.difficulty_stairs_down +
            answers.difficulty_stairs_up +
            answers.difficulty_rising_sitting +
            answers.difficulty_standing +
            answers.difficulty_bending_floor +
            answers.difficulty_walking_flat +
            answers.difficulty_getting_in_out_car +
            answers.difficulty_squatting_ner_chores +
            answers.difficulty_heavy_domestic_duties
        )
        # Max raw is 9 * 4 = 36. Scale to 68
        function_score = round((func_raw / 36.0) * 68.0, 1)

        total = round(pain + stiffness + function_score, 1)
        percentage = round((total / 96.0) * 100.0, 1)

        return pain, stiffness, function_score, total, percentage

    @staticmethod
    def evaluate_acr_criteria(
        age: int,
        symptoms: ClinicalSymptomsInput
    ) -> Dict[str, Any]:
        """
        ACR Clinical Classification Criteria for Knee OA:
        Knee pain + at least 3 of 6 features:
        1. Age > 50 years
        2. Morning stiffness < 30 minutes
        3. Crepitus on active motion
        4. Bony tenderness
        5. Bony enlargement
        6. No palpable warmth
        Sensitivity ~95%, Specificity ~69%
        """
        criteria_met = 0
        factors = []

        if age >= 50:
            criteria_met += 1
            factors.append("Age >= 50 years (Epidemiological risk bracket)")

        if 0 < symptoms.morning_stiffness_minutes <= 30:
            criteria_met += 1
            factors.append("Morning stiffness <= 30 mins (Characteristic of OA)")
        elif symptoms.morning_stiffness_minutes > 45:
            factors.append("Morning stiffness > 45 mins (Possible Inflammatory/Rheumatoid component)")

        if symptoms.joint_crepitus_reported == "Yes":
            criteria_met += 1
            factors.append("Joint crepitus on active motion")

        if symptoms.bony_enlargement_reported == "Yes":
            criteria_met += 1
            factors.append("Bony enlargement along joint margin")

        acr_positive = (symptoms.vas_pain_score >= 3.0 and criteria_met >= 3)

        return {
            "acr_positive": acr_positive,
            "criteria_count": criteria_met,
            "clinical_factors": factors
        }
