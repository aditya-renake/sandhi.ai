from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class BiomechanicsRecord(Base):
    __tablename__ = "biomechanics_records"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), nullable=False, unique=True)
    
    # Knee Range of Motion (ROM)
    left_knee_flexion_max = Column(Float, default=135.0) # Normal: 135-145 deg, OA: <115 deg
    left_knee_extension_deficit = Column(Float, default=0.0) # Normal: 0 deg (flat), OA: >5 deg lag
    right_knee_flexion_max = Column(Float, default=135.0)
    right_knee_extension_deficit = Column(Float, default=0.0)
    
    # Frontal Plane Alignment (Varus / Valgus in degrees)
    # Normal Q-angle: 12-18 deg. Varus (Bowleg) < 175 deg, Valgus (Knock-knee) > 185 deg
    left_knee_alignment_angle = Column(Float, default=180.0)
    left_alignment_classification = Column(String(50), default="Neutral") # Neutral, Genu Varum (Bowleg), Genu Valgum (Knock-knee)
    right_knee_alignment_angle = Column(Float, default=180.0)
    right_alignment_classification = Column(String(50), default="Neutral")
    
    # Gait Kinematics
    cadence_steps_per_min = Column(Float, default=110.0) # Normal: 100-120, OA: <85
    step_time_asymmetry_index = Column(Float, default=2.5) # Percent asymmetry: Normal < 5%, Severe OA > 20%
    stance_phase_ratio_affected_side = Column(Float, default=0.60) # Normal: ~0.60 (60%), Antalgic OA: <0.52 (quick offloading)
    antalgic_limp_detected = Column(String(20), default="No") # No, Mild, Moderate, Severe
    trunk_lateral_sway_deg = Column(Float, default=3.0) # Compensatory Duchenne/Trendelenburg sway (Normal < 5 deg)
    
    # Functional Mobility Tests
    cst_30s_rep_count = Column(Integer, default=15) # 30s Chair Stand: <10 reps indicates severe quadriceps weakness / OA functional impairment
    cst_mean_velocity_m_s = Column(Float, default=0.45) # Ascent velocity in m/s
    tug_duration_seconds = Column(Float, default=8.5) # Timed Up and Go: >12s indicates fall risk & mobility limitation
    
    # Keypoint Telemetry Data (JSON coordinates for historical playback)
    telemetry_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    screening = relationship("Screening", back_populates="biomechanics")
