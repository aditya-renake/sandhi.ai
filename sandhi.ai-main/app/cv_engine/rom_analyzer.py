from typing import List, Dict, Any, Optional
import numpy as np
from app.cv_engine.pose_detector import PoseMathUtils
from app.schemas.cv_requests import (
    PoseFrame, 
    ROMAnalysisResponse, 
    JointAngleResult, 
    AlignmentResult
)

class KneeROMAnalyzer:
    """Analyzes sagittal Range of Motion (flexion/extension) and frontal alignment from pose landmarks."""

    @staticmethod
    def analyze_pose_sequence(
        frames: List[PoseFrame], 
        target_leg: str = "both"
    ) -> ROMAnalysisResponse:
        """
        Calculates maximum flexion, extension deficit, alignment, and biomechanical OA risk.
        """
        if not frames:
            # Return baseline standard values if no frames provided
            return KneeROMAnalyzer._generate_default_rom_response()

        left_knee_angles: List[float] = []
        right_knee_angles: List[float] = []
        left_alignments: List[float] = []
        right_alignments: List[float] = []

        for frame in frames:
            lm = frame.landmarks

            # Left leg landmarks: LEFT_HIP, LEFT_KNEE, LEFT_ANKLE
            if "LEFT_HIP" in lm and "LEFT_KNEE" in lm and "LEFT_ANKLE" in lm:
                hip = (lm["LEFT_HIP"].x, lm["LEFT_HIP"].y)
                knee = (lm["LEFT_KNEE"].x, lm["LEFT_KNEE"].y)
                ankle = (lm["LEFT_ANKLE"].x, lm["LEFT_ANKLE"].y)

                angle = PoseMathUtils.calculate_3point_angle(hip, knee, ankle)
                left_knee_angles.append(angle)

                align_ang = PoseMathUtils.calculate_frontal_alignment_angle(hip, knee, ankle)
                left_alignments.append(align_ang)

            # Right leg landmarks: RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE
            if "RIGHT_HIP" in lm and "RIGHT_KNEE" in lm and "RIGHT_ANKLE" in lm:
                hip = (lm["RIGHT_HIP"].x, lm["RIGHT_HIP"].y)
                knee = (lm["RIGHT_KNEE"].x, lm["RIGHT_KNEE"].y)
                ankle = (lm["RIGHT_ANKLE"].x, lm["RIGHT_ANKLE"].y)

                angle = PoseMathUtils.calculate_3point_angle(hip, knee, ankle)
                right_knee_angles.append(angle)

                align_ang = PoseMathUtils.calculate_frontal_alignment_angle(hip, knee, ankle)
                right_alignments.append(align_ang)

        # Apply temporal Butterworth smoothing to eliminate camera flutter
        left_angles_clean = PoseMathUtils.apply_butterworth_smoothing(left_knee_angles) if left_knee_angles else []
        right_angles_clean = PoseMathUtils.apply_butterworth_smoothing(right_knee_angles) if right_knee_angles else []

        left_rom = KneeROMAnalyzer._evaluate_knee_rom(left_angles_clean) if left_angles_clean else None
        right_rom = KneeROMAnalyzer._evaluate_knee_rom(right_angles_clean) if right_angles_clean else None

        left_align = KneeROMAnalyzer._evaluate_alignment(left_alignments) if left_alignments else None
        right_align = KneeROMAnalyzer._evaluate_alignment(right_alignments) if right_alignments else None

        # Biomechanical Risk Synthesis
        risk_score, risk_tier, recommendations = KneeROMAnalyzer._compute_biomechanical_risk(
            left_rom, right_rom, left_align, right_align
        )

        asymmetry = 0.0
        if left_rom and right_rom:
            asymmetry = round(abs(left_rom.flexion_max_deg - right_rom.flexion_max_deg), 1)

        return ROMAnalysisResponse(
            target_side=target_leg,
            left_knee_rom=left_rom,
            right_knee_rom=right_rom,
            left_alignment=left_align,
            right_alignment=right_align,
            asymmetry_deg=asymmetry,
            overall_biomechanical_risk=risk_tier,
            biomechanical_risk_score=risk_score,
            recommendations=recommendations,
            processed_frames_count=len(frames)
        )

    @staticmethod
    def _evaluate_knee_rom(angles: List[float]) -> JointAngleResult:
        if not angles:
            return JointAngleResult(
                flexion_max_deg=135.0,
                extension_deficit_deg=0.0,
                rom_arc_deg=135.0,
                rom_status="Normal",
                flexion_deficit_from_normal_deg=0.0
            )

        # Minimum angle in sagittal plane corresponds to maximal flexion (deep bend)
        # In standard anatomical definitions: 180 = full straight extension, 45 = deep bend
        # Flexion range from full extension: 180 - min_angle
        min_angle = min(angles)
        max_angle = max(angles)

        flexion_max = round(180.0 - min_angle, 1)
        extension_deficit = round(max(0.0, 180.0 - max_angle), 1)
        rom_arc = round(max_angle - min_angle, 1)

        # Normal knee flexion is typically 135-145 degrees
        flexion_deficit = max(0.0, round(135.0 - flexion_max, 1))

        if flexion_max >= 130 and extension_deficit <= 3:
            status = "Normal Range of Motion"
        elif flexion_max >= 115:
            status = "Mild ROM Restriction"
        elif flexion_max >= 95:
            status = "Moderate ROM Restriction"
        else:
            status = "Severe ROM Restriction"

        return JointAngleResult(
            flexion_max_deg=flexion_max,
            extension_deficit_deg=extension_deficit,
            rom_arc_deg=rom_arc,
            rom_status=status,
            flexion_deficit_from_normal_deg=flexion_deficit
        )

    @staticmethod
    def _evaluate_alignment(alignments: List[float]) -> AlignmentResult:
        if not alignments:
            return AlignmentResult(
                alignment_angle_deg=180.0,
                classification="Neutral",
                q_angle_estimate_deg=14.0,
                clinical_implication="Balanced medial-lateral joint load distribution."
            )

        median_angle = round(float(np.median(alignments)), 1)
        q_angle = round(abs(180.0 - median_angle) + 12.0, 1)

        if 176.0 <= median_angle <= 182.0:
            classification = "Neutral Alignment"
            implication = "Normal mechanical axis. Balanced compartment load."
        elif median_angle < 176.0:
            classification = "Genu Varum (Bowleg)"
            implication = (
                "Increased compressive load on the medial tibiofemoral compartment. "
                "High correlation with medial joint space narrowing in hill walkers."
            )
        else:
            classification = "Genu Valgum (Knock-knee)"
            implication = (
                "Increased lateral compartment compressive load and patellofemoral tracking stress."
            )

        return AlignmentResult(
            alignment_angle_deg=median_angle,
            classification=classification,
            q_angle_estimate_deg=q_angle,
            clinical_implication=implication
        )

    @staticmethod
    def _compute_biomechanical_risk(
        left_rom: Optional[JointAngleResult],
        right_rom: Optional[JointAngleResult],
        left_align: Optional[AlignmentResult],
        right_align: Optional[AlignmentResult]
    ) -> tuple[float, str, List[str]]:
        score = 10.0
        recommendations = []

        # Check ROM deficits
        max_flexion_deficit = 0.0
        max_ext_deficit = 0.0

        for rom in [left_rom, right_rom]:
            if rom:
                max_flexion_deficit = max(max_flexion_deficit, rom.flexion_deficit_from_normal_deg)
                max_ext_deficit = max(max_ext_deficit, rom.extension_deficit_deg)

        # Flexion restriction adds up to 35 points
        score += min(35.0, (max_flexion_deficit / 45.0) * 35.0)
        # Extension lag adds up to 20 points
        score += min(20.0, (max_ext_deficit / 15.0) * 20.0)

        # Alignment penalties (Varus / Valgus adds up to 25 points)
        for align in [left_align, right_align]:
            if align and "Neutral" not in align.classification:
                score += 12.5
                if "Varus" in align.classification:
                    recommendations.append("Lateral wedge insole offloading recommended for medial compartment relief.")
                elif "Valgus" in align.classification:
                    recommendations.append("Medial arch support recommended for lateral compartment relief.")

        score = min(100.0, round(score, 1))

        if score < 25.0:
            tier = "Low Risk"
            recommendations.append("Maintain active joint mobility and quadriceps conditioning.")
        elif score < 50.0:
            tier = "Mild Risk"
            recommendations.append("Initiate daily closed-chain knee flexion stretches and hamstring elongation.")
        elif score < 75.0:
            tier = "Moderate Risk"
            recommendations.append("Prescribe structured physical therapy and reduce steep hill descent load.")
        else:
            tier = "High Risk"
            recommendations.append("Urgent physiotherapy consultation and biomechanical offloader knee brace evaluation.")

        return score, tier, recommendations

    @staticmethod
    def _generate_default_rom_response() -> ROMAnalysisResponse:
        return ROMAnalysisResponse(
            target_side="both",
            left_knee_rom=JointAngleResult(
                flexion_max_deg=135.0,
                extension_deficit_deg=0.0,
                rom_arc_deg=135.0,
                rom_status="Normal",
                flexion_deficit_from_normal_deg=0.0
            ),
            right_knee_rom=JointAngleResult(
                flexion_max_deg=135.0,
                extension_deficit_deg=0.0,
                rom_arc_deg=135.0,
                rom_status="Normal",
                flexion_deficit_from_normal_deg=0.0
            ),
            left_alignment=AlignmentResult(
                alignment_angle_deg=180.0,
                classification="Neutral",
                q_angle_estimate_deg=14.0,
                clinical_implication="Normal biomechanical axis."
            ),
            right_alignment=AlignmentResult(
                alignment_angle_deg=180.0,
                classification="Neutral",
                q_angle_estimate_deg=14.0,
                clinical_implication="Normal biomechanical axis."
            ),
            asymmetry_deg=0.0,
            overall_biomechanical_risk="Low Risk",
            biomechanical_risk_score=15.0,
            recommendations=["Maintain regular physical activity and joint stretching."],
            processed_frames_count=0
        )
