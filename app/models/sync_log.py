from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from app.core.database import Base

class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(64), unique=True, index=True, nullable=False)
    device_id = Column(String(100), nullable=False, index=True)
    asha_username = Column(String(50), nullable=False)
    records_count = Column(Integer, default=0)
    status = Column(String(50), default="SUCCESS") # SUCCESS, PARTIAL_CONFLICT, FAILED
    conflict_details = Column(JSON, nullable=True)
    synced_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
