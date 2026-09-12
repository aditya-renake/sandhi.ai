from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Screening(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True)
    screening_uuid = Column(String(64), unique=True, index=True, nullable=False) # For offline sync matching
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    screened_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Clinical Symptom Scores (WOMAC / VAS / Stiffness)
    # WOMAC Pain (0-20), Stiffness (0-8), Physical Function (0-68) -> Total WOMAC (0-96)
    womac_pain_score = Column(Float, default=0.0)
    womac_stiffness_score = Column(Float, default=0.0)
    womac_function_score = Column(Float, default=0.0)
    womac_total_score = Column(Float, default=0.0)
    
    vas_pain_score = Column(Float, default=0.0) # 0 to 10 Visual Analog Scale
    morning_stiffness_minutes = Column(Float, default=0.0) # < 30 mins indicates OA, > 45 mins indicates Inflammatory Arthritis
    joint_crepitus_reported = Column(String(20), default="No") # Yes, No, Grating sound on movement
    bony_enlargement_reported = Column(String(20), default="No") # Heberden / Bouchard nodes or knee bony margin
    
    # Multimodal Early OA Risk Engine Output
    composite_risk_score = Column(Float, nullable=False) # 0.0 to 100.0
    risk_tier = Column(String(50), nullable=False) # Low Risk, Mild / Early OA, Moderate OA, Severe OA
    predicted_phenotype = Column(String(100), default="Biomechanical Strain") # Biomechanical Strain, Chronic Inflammatory, Radiographic Structural, Post-Traumatic
    
    # Recommendations & Clinical Actions
    recommended_physiotherapy = Column(Text, nullable=True)
    ergonomic_terrain_advice = Column(Text, nullable=True)
    lifestyle_nutrition_guidance = Column(Text, nullable=True)
    referral_urgency = Column(String(50), default="Routine / No Referral Needed") # Routine / No Referral, Sub-Centre Follow-up, District Orthopaedic Referral, Urgent Surgical Consultation
    referred_to_hospital = Column(String(100), nullable=True)
    
    # Offline Sync & Status Flags
    synced_from_offline_device = Column(Boolean, default=False)
    client_created_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="screenings")
    biomechanics = relationship("BiomechanicsRecord", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    xray_record = relationship("XrayRecord", back_populates="screening", uselist=False, cascade="all, delete-orphan")
