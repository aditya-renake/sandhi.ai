from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.patient import Patient
from app.models.screening import Screening
from app.models.sync_log import SyncLog
from app.schemas.sync import BatchSyncRequest, BatchSyncResponse, SyncRecordStatus
from app.services.patient_service import PatientService
from app.services.screening_service import ScreeningService

class OfflineSyncService:
    """Manages offline-to-online data synchronization for remote field workers."""

    @staticmethod
    async def process_batch_sync(
        db: AsyncSession,
        payload: BatchSyncRequest,
        user_id: Optional[int] = None
    ) -> BatchSyncResponse:
        patients_synced: List[SyncRecordStatus] = []
        screenings_synced: List[SyncRecordStatus] = []
        processed_count = 0

        for item in payload.items:
            try:
                # 1. Upsert Patient
                p_in = item.patient
                existing_p = await db.execute(
                    select(Patient).where(Patient.patient_uuid == p_in.patient_uuid)
                )
                patient_obj = existing_p.scalar_one_or_none()

                if not patient_obj:
                    # Create new patient
                    patient_obj = await PatientService.create_patient(db, p_in, user_id)
                    patients_synced.append(SyncRecordStatus(
                        client_uuid=p_in.patient_uuid,
                        server_id=patient_obj.id,
                        status="CREATED",
                        message="New patient registered from offline sync."
                    ))
                else:
                    patients_synced.append(SyncRecordStatus(
                        client_uuid=p_in.patient_uuid,
                        server_id=patient_obj.id,
                        status="EXISTING",
                        message="Patient already exists in central database."
                    ))

                # 2. Process screenings
                for sc_in in item.screenings:
                    existing_sc = await db.execute(
                        select(Screening).where(Screening.screening_uuid == sc_in.screening_uuid)
                    )
                    sc_obj = existing_sc.scalar_one_or_none()

                    if not sc_obj:
                        sc_in.patient_id = patient_obj.id
                        sc_eval = await ScreeningService.process_and_save_screening(db, sc_in, user_id)
                        screenings_synced.append(SyncRecordStatus(
                            client_uuid=sc_in.screening_uuid,
                            server_id=patient_obj.id,
                            status="CREATED",
                            message=f"Screening synced successfully. Risk Tier: {sc_eval.risk_tier}"
                        ))
                    else:
                        screenings_synced.append(SyncRecordStatus(
                            client_uuid=sc_in.screening_uuid,
                            server_id=sc_obj.id,
                            status="ALREADY_SYNCED",
                            message="Screening previously recorded."
                        ))
                processed_count += 1
            except Exception as e:
                patients_synced.append(SyncRecordStatus(
                    client_uuid=item.patient.patient_uuid,
                    server_id=-1,
                    status="ERROR",
                    message=str(e)
                ))

        # Record Sync Log
        log = SyncLog(
            batch_id=payload.batch_id,
            device_id=payload.device_id,
            asha_username=payload.asha_username,
            records_count=processed_count,
            status="SUCCESS" if processed_count == len(payload.items) else "PARTIAL_SUCCESS"
        )
        db.add(log)
        await db.commit()

        return BatchSyncResponse(
            batch_id=payload.batch_id,
            status="SUCCESS" if processed_count == len(payload.items) else "PARTIAL_SUCCESS",
            total_received=len(payload.items),
            total_processed=processed_count,
            patients_synced=patients_synced,
            screenings_synced=screenings_synced,
            server_time=datetime.now(timezone.utc)
        )
