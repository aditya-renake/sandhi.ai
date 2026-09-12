from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.patient import PatientCreate
from app.schemas.screening import FullScreeningSubmission

class BatchSyncItem(BaseModel):
    patient: PatientCreate
    screenings: List[FullScreeningSubmission] = []

class BatchSyncRequest(BaseModel):
    batch_id: str
    device_id: str
    asha_username: str
    sync_timestamp: datetime
    items: List[BatchSyncItem]

class SyncRecordStatus(BaseModel):
    client_uuid: str
    server_id: int
    status: str # CREATED, UPDATED, CONFLICT_RESOLVED, ERROR
    message: Optional[str] = None

class BatchSyncResponse(BaseModel):
    batch_id: str
    status: str # SUCCESS, PARTIAL_SUCCESS, FAILED
    total_received: int
    total_processed: int
    patients_synced: List[SyncRecordStatus]
    screenings_synced: List[SyncRecordStatus]
    server_time: datetime
