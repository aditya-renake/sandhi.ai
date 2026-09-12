import math
import numpy as np
from typing import Tuple, List, Dict, Any, Optional
from scipy.signal import butter, filtfilt

class PoseMathUtils:
    """Mathematical and filtering utilities for biomechanical pose landmarks."""

    @staticmethod
    def calculate_3point_angle(
        a: Tuple[float, float], 
        b: Tuple[float, float], 
        c: Tuple[float, float]
    ) -> float:
        """
        Calculate internal angle at vertex 'b' formed by points a, b, c.
        Points are (x, y) coordinates.
        Returns angle in degrees [0.0, 180.0].
        """
        ba = np.array([a[0] - b[0], a[1] - b[1]])
        bc = np.array([c[0] - b[0], c[1] - b[1]])

        norm_ba = np.linalg.norm(ba)
        norm_bc = np.linalg.norm(bc)

        if norm_ba == 0 or norm_bc == 0:
            return 180.0

        cosine_angle = np.dot(ba, bc) / (norm_ba * norm_bc)
        # Numerical stability clamp
        cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
        
        angle_rad = np.arccos(cosine_angle)
        return float(np.degrees(angle_rad))

    @staticmethod
    def calculate_frontal_alignment_angle(
        hip: Tuple[float, float],
        knee: Tuple[float, float],
        ankle: Tuple[float, float]
    ) -> float:
        """
        Calculate frontal plane alignment angle (Hip-Knee-Ankle mechanical axis).
        180 deg = straight neutral leg.
        < 175 deg = Genu Varum (bowlegs).
        > 182 deg = Genu Valgum (knock-knees).
        """
        angle = PoseMathUtils.calculate_3point_angle(hip, knee, ankle)
        # Determine orientation / cross product to detect medial vs lateral deviation
        cross_prod = (knee[0] - hip[0]) * (ankle[1] - hip[1]) - (knee[1] - hip[1]) * (ankle[0] - hip[0])
        
        # If knee drifts outwards (varus) or inwards (valgus)
        if cross_prod > 0:
            return 180.0 + (180.0 - angle)
        return angle

    @staticmethod
    def apply_butterworth_smoothing(
        signal: List[float], 
        sampling_rate: float = 30.0, 
        cutoff_freq: float = 4.0, 
        order: int = 2
    ) -> List[float]:
        """
        Apply a zero-phase low-pass Butterworth filter to eliminate high-frequency video jitter.
        """
        if len(signal) <= 9: # Needs minimum samples for filtfilt
            return signal
        
        nyquist = 0.5 * sampling_rate
        normal_cutoff = min(cutoff_freq / nyquist, 0.99)
        b, a = butter(order, normal_cutoff, btype='low', analog=False)
        
        try:
            smoothed = filtfilt(b, a, signal)
            return [float(x) for x in smoothed]
        except Exception:
            # Fallback to moving average if filtfilt fails
            return PoseMathUtils.apply_moving_average(signal, window_size=3)

    @staticmethod
    def apply_moving_average(signal: List[float], window_size: int = 3) -> List[float]:
        if len(signal) < window_size:
            return signal
        smoothed = []
        half_win = window_size // 2
        for i in range(len(signal)):
            start = max(0, i - half_win)
            end = min(len(signal), i + half_win + 1)
            smoothed.append(float(np.mean(signal[start:end])))
        return smoothed
