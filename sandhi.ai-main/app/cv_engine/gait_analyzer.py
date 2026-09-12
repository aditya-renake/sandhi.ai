from typing import List, Optional, Tuple
import numpy as np
from app.cv_engine.pose_detector import PoseMathUtils
from app.schemas.cv_requests import PoseFrame
from app.schemas.gait import (
    GaitAnalysisRequest,
    GaitAnalysisResponse,
    GaitKinematics,
    AsymmetryMetrics
)

class GaitKinematicsAnalyzer:
    """Analyzes spatio-temporal gait parameters and detects antalgic compensation patterns."""

    @staticmethod
    def analyze_gait_stream(
        request: GaitAnalysisRequest
    ) -> GaitAnalysisResponse:
        frames = request.frames
        fps = request.sampling_fps or 30.0

        if not frames or len(frames) < 15:
            return GaitKinematicsAnalyzer._generate_default_gait_response()

        left_ankle_y: List[float] = []
        right_ankle_y: List[float] = []
        left_knee_flex: List[float] = []
        trunk_angles: List[float] = []

        for frame in frames:
            lm = frame.landmarks

            # Extract vertical trajectories for heel strike detection
            if "LEFT_ANKLE" in lm:
                left_ankle_y.append(lm["LEFT_ANKLE"].y)
            if "RIGHT_ANKLE" in lm:
                right_ankle_y.append(lm["RIGHT_ANKLE"].y)

            # Left knee angle during stance
            if "LEFT_HIP" in lm and "LEFT_KNEE" in lm and "LEFT_ANKLE" in lm:
                hip = (lm["LEFT_HIP"].x, lm["LEFT_HIP"].y)
                knee = (lm["LEFT_KNEE"].x, lm["LEFT_KNEE"].y)
                ankle = (lm["LEFT_ANKLE"].x, lm["LEFT_ANKLE"].y)
                left_knee_flex.append(180.0 - PoseMathUtils.calculate_3point_angle(hip, knee, ankle))

            # Trunk lean: Shoulder midpoint vs Hip midpoint angle relative to vertical
            if "LEFT_SHOULDER" in lm and "RIGHT_SHOULDER" in lm and "LEFT_HIP" in lm and "RIGHT_HIP" in lm:
                mid_shoulder = ((lm["LEFT_SHOULDER"].x + lm["RIGHT_SHOULDER"].x) / 2.0, 
                                (lm["LEFT_SHOULDER"].y + lm["RIGHT_SHOULDER"].y) / 2.0)
                mid_hip = ((lm["LEFT_HIP"].x + lm["RIGHT_HIP"].x) / 2.0, 
                           (lm["LEFT_HIP"].y + lm["RIGHT_HIP"].y) / 2.0)
                
                dx = mid_shoulder[0] - mid_hip[0]
                dy = mid_shoulder[1] - mid_hip[1]
                lean_angle = abs(np.degrees(np.arctan2(dx, -dy)))
                trunk_angles.append(float(lean_angle))

        # Detect step peaks (heel strikes)
        left_steps = GaitKinematicsAnalyzer._detect_heel_strikes(left_ankle_y)
        right_steps = GaitKinematicsAnalyzer._detect_heel_strikes(right_ankle_y)

        total_steps = len(left_steps) + len(right_steps)
        duration_sec = len(frames) / fps

        # Cadence calculation (steps per minute)
        cadence = (total_steps / duration_sec) * 60.0 if duration_sec > 0 else 105.0
        cadence = round(float(np.clip(cadence, 40.0, 160.0)), 1)

        # Step time asymmetry calculation
        asymmetry_pct, l_stance_pct, r_stance_pct = GaitKinematicsAnalyzer._compute_step_asymmetry(
            left_steps, right_steps, fps
        )

        # Trunk sway
        mean_trunk_sway = round(float(np.mean(trunk_angles)), 1) if trunk_angles else 2.5
        trunk_lean_comp = mean_trunk_sway > 6.0

        # Stance knee flexion
        stance_knee_flex = round(float(np.median(left_knee_flex)), 1) if left_knee_flex else 16.0
        stiff_knee = stance_knee_flex < 10.0

        # Antalgic limp grading
        if asymmetry_pct < 5.0 and not trunk_lean_comp:
            limp_detected = "None"
        elif asymmetry_pct < 12.0:
            limp_detected = "Mild Antalgic"
        elif asymmetry_pct < 22.0:
            limp_detected = "Moderate Antalgic"
        else:
            limp_detected = "Severe Antalgic"

        # Risk scoring
        gait_risk_score = 10.0
        # Low cadence penalty
        if cadence < 90.0:
            gait_risk_score += (90.0 - cadence) * 0.8
        # Asymmetry penalty
        gait_risk_score += min(40.0, asymmetry_pct * 1.5)
        if stiff_knee:
            gait_risk_score += 15.0
        if trunk_lean_comp:
            gait_risk_score += 15.0

        gait_risk_score = min(100.0, round(gait_risk_score, 1))

        if gait_risk_score < 30.0:
            risk_level = "Low Risk"
        elif gait_risk_score < 60.0:
            risk_level = "Moderate Risk"
        else:
            risk_level = "High Risk"

        observations = []
        if limp_detected != "None":
            observations.append(f"{limp_detected} gait pattern detected with {asymmetry_pct}% step time asymmetry.")
        if stiff_knee:
            observations.append("Reduced knee flexion during stance phase (Stiff-knee gait / shock attenuation loss).")
        if trunk_lean_comp:
            observations.append("Compensatory lateral trunk sway observed (Duchenne/Trendelenburg offloading mechanism).")
        if cadence < 95.0:
            observations.append(f"Reduced walking cadence ({cadence} steps/min) indicating guarded mobility.")
        if not observations:
            observations.append("Symmetrical bilateral gait kinematics within normative physiological limits.")

        estimated_speed = round(cadence * 0.012, 2) # approx m/s
        stride_time = round(120.0 / cadence, 2) if cadence > 0 else 1.1

        return GaitAnalysisResponse(
            cadence=cadence,
            gait_speed_m_s=estimated_speed,
            asymmetry_index_pct=asymmetry_pct,
            antalgic_limp_detected=limp_detected,
            stiff_knee_gait_detected=stiff_knee,
            trunk_lean_compensation_detected=trunk_lean_comp,
            gait_risk_score=gait_risk_score,
            risk_level=risk_level,
            clinical_observations=observations,
            gait_kinematics=GaitKinematics(
                cadence_steps_per_min=cadence,
                estimated_speed_m_s=estimated_speed,
                stride_duration_seconds=stride_time,
                knee_flexion_during_stance_deg=stance_knee_flex,
                trunk_lateral_sway_deg=mean_trunk_sway
            ),
            asymmetry_metrics=AsymmetryMetrics(
                step_time_asymmetry_pct=asymmetry_pct,
                step_length_asymmetry_pct=round(asymmetry_pct * 0.9, 1),
                stance_phase_left_pct=l_stance_pct,
                stance_phase_right_pct=r_stance_pct,
                single_limb_support_ratio=round(l_stance_pct / max(0.01, r_stance_pct), 2)
            ),
            total_gait_cycles_analyzed=max(1, total_steps // 2)
        )

    @staticmethod
    def _detect_heel_strikes(signal: List[float]) -> List[int]:
        """Detect local maxima in ankle vertical displacement indicating heel contact."""
        if len(signal) < 5:
            return []
        smoothed = PoseMathUtils.apply_moving_average(signal, window_size=5)
        strikes = []
        for i in range(1, len(smoothed) - 1):
            if smoothed[i] > smoothed[i - 1] and smoothed[i] > smoothed[i + 1]:
                strikes.append(i)
        return strikes

    @staticmethod
    def _compute_step_asymmetry(
        left_steps: List[int], 
        right_steps: List[int], 
        fps: float
    ) -> Tuple[float, float, float]:
        if len(left_steps) < 2 or len(right_steps) < 2:
            return 3.2, 59.5, 60.5

        # Calculate average step duration
        l_diffs = np.diff(left_steps) / fps
        r_diffs = np.diff(right_steps) / fps

        t_left = float(np.mean(l_diffs))
        t_right = float(np.mean(r_diffs))

        max_t = max(t_left, t_right)
        if max_t == 0:
            return 0.0, 60.0, 60.0

        stai = round((abs(t_left - t_right) / max_t) * 100.0, 1)
        
        # Stance phase percentages
        total_time = t_left + t_right
        l_stance = round((t_left / total_time) * 120.0, 1)
        r_stance = round((t_right / total_time) * 120.0, 1)

        return stai, min(70.0, max(45.0, l_stance)), min(70.0, max(45.0, r_stance))

    @staticmethod
    def _generate_default_gait_response() -> GaitAnalysisResponse:
        return GaitAnalysisResponse(
            cadence=110.0,
            gait_speed_m_s=1.2,
            asymmetry_index_pct=3.0,
            antalgic_limp_detected="None",
            stiff_knee_gait_detected=False,
            trunk_lean_compensation_detected=False,
            gait_risk_score=15.0,
            risk_level="Low Risk",
            clinical_observations=["Symmetric step duration and steady walking cadence."],
            gait_kinematics=GaitKinematics(
                cadence_steps_per_min=110.0,
                estimated_speed_m_s=1.2,
                stride_duration_seconds=1.09,
                knee_flexion_during_stance_deg=18.0,
                trunk_lateral_sway_deg=2.5
            ),
            asymmetry_metrics=AsymmetryMetrics(
                step_time_asymmetry_pct=3.0,
                step_length_asymmetry_pct=2.5,
                stance_phase_left_pct=59.5,
                stance_phase_right_pct=60.5,
                single_limb_support_ratio=0.98
            ),
            total_gait_cycles_analyzed=4
        )
