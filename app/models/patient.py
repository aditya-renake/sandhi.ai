from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_uuid = Column(String(64), unique=True, index=True, nullable=False) # UUID for offline client sync
    abha_id = Column(String(50), unique=True, index=True, nullable=True) # Ayushman Bharat Health Account ID
    full_name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False) # Male, Female, Other
    contact_number = Column(String(20), nullable=True)
    
    # NER Location & Terrain
    state = Column(String(50), nullable=False, index=True) # Assam, Mizoram, Nagaland, Meghalaya, etc.
    district = Column(String(50), nullable=False, index=True)
    village_town = Column(String(100), nullable=True)
    terrain_type = Column(String(50), default="Hilly/Steep") # Hilly/Steep, Foothills, Valley/Plains, High Altitude Mountain
    
    # NER Occupational Risk Factors
    occupation = Column(String(100), default="Tea Garden Worker") # Tea Plucker, Terrace Farmer, Hill Porter, Handloom Weaver, Domestic Worker, Elderly Dependent
    daily_heavy_load_hours = Column(Float, default=4.0) # Hours spent carrying head baskets / heavy loads on slopes
    squatting_kneeling_hours = Column(Float, default=3.0) # Hours spent deep squatting/kneeling per day
    
    # Biometric Profile
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    
    # Medical History
    prior_joint_injury = Column(String(100), default="None") # Left Knee, Right Knee, Both, None
    family_history_oa = Column(String(20), default="No") # Yes, No, Unknown
    primary_symptom_side = Column(String(20), default="Right Knee") # Left Knee, Right Knee, Both, Hip, Spine
    
    registered_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    screenings = relationship("Screening", back_populates="patient", cascade="all, delete-orphan")
