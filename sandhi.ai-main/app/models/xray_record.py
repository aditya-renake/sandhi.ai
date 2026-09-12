from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class XrayRecord(Base):
    __tablename__ = "xray_records"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), nullable=False, unique=True)
    
    # Radiographic Analysis
    image_filename = Column(String(255), nullable=True)
    gradcam_filename = Column(String(255), nullable=True)
    
    # Kellgren-Lawrence Grading (KL 0 to 4)
    # Grade 0: None, Grade 1: Doubtful, Grade 2: Minimal, Grade 3: Moderate, Grade 4: Severe
    kl_grade = Column(Integer, default=0) # 0, 1, 2, 3, 4
    kl_grade_confidence = Column(Float, default=0.95) # 0.0 to 1.0
    
    # Joint Space Narrowing (JSN)
    medial_jsn_mm = Column(Float, default=4.8) # Normal: 4.5 - 6.0 mm, OA: < 3.0 mm
    lateral_jsn_mm = Column(Float, default=5.2)
    jsn_severity = Column(String(50), default="None") # None, Mild, Moderate, Severe
    
    # Structural Markers
    osteophytes_detected = Column(String(50), default="None") # None, Marginal/Doubtful, Definite Small, Moderate/Large
    subchondral_sclerosis = Column(String(20), default="Absent") # Absent, Present
    subchondral_cysts = Column(String(20), default="Absent")
    
    analysis_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    screening = relationship("Screening", back_populates="xray_record")
