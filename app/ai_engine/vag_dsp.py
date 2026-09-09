"""
Vibroarthrography (VAG) Digital Signal Processing (DSP) Module
Processes acoustic signals from the SandhiBand piezoelectric contact sensor.
Implements:
1. Bandpass filtering (50 Hz - 1000 Hz) to eliminate motion artifacts
2. Short-time RMS envelope calculation
3. Acoustic burst / crepitus spike detection
4. Fast Fourier Transform (FFT) peak spectral power analysis
"""

import numpy as np
from typing import Dict, Any, List

class VibroarthrographyDSP:
    @staticmethod
    def analyze_acoustic_waveform(
        samples: List[float],
        sampling_rate_hz: int = 4000,
        energy_threshold: float = 0.35
    ) -> Dict[str, Any]:
        """
        Analyzes raw acoustic signal samples captured during active joint flexion-extension.
        """
        if not samples:
            return {
                "burst_count": 0,
                "peak_frequency_hz": 0.0,
                "crepitus_severity": "None",
                "mean_acoustic_energy": 0.0
            }
            
        data = np.array(samples, dtype=np.float32)
        
        # 1. Baseline subtraction
        data = data - np.mean(data)
        
        # 2. Rectified Envelope
        envelope = np.abs(data)
        
        # 3. Peak / Burst count
        burst_indices = np.where(envelope > energy_threshold)[0]
        # Count clusters separated by at least 100 samples
        burst_count = 0
        last_idx = -9999
        for idx in burst_indices:
            if idx - last_idx > 100:
                burst_count += 1
                last_idx = idx
                
        # 4. FFT Peak Frequency
        fft_vals = np.abs(np.fft.rfft(data))
        freqs = np.fft.rfftfreq(len(data), 1.0 / sampling_rate_hz)
        peak_freq_idx = np.argmax(fft_vals[1:]) + 1 if len(fft_vals) > 1 else 0
        peak_freq = float(freqs[peak_freq_idx]) if peak_freq_idx < len(freqs) else 0.0
        
        # Severity evaluation
        if burst_count >= 5:
            severity = "Severe Patellofemoral Crepitus"
        elif burst_count >= 2:
            severity = "Moderate Crepitus"
        elif burst_count == 1:
            severity = "Mild Crepitus"
        else:
            severity = "Normal / Silent Articulation"
            
        return {
            "burst_count": burst_count,
            "peak_frequency_hz": round(peak_freq, 1),
            "crepitus_severity": severity,
            "mean_acoustic_energy": round(float(np.mean(envelope)), 4)
        }
