from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.sync import BatchSyncRequest, BatchSyncResponse
from app.services.sync_service import OfflineSyncService

router = APIRouter(prefix="/sync", tags=["Offline Synchronization"])

@router.post("/batch", response_model=BatchSyncResponse)
async def sync_offline_batch(
    payload: BatchSyncRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Synchronizes offline screening batches uploaded by ASHA workers from remote hill areas.
    Performs conflict resolution, deduplication, and database ingestion.
    """
    return await OfflineSyncService.process_batch_sync(db, payload)
