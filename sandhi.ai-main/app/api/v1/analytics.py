from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.analytics import RegionalAnalyticsResponse
from app.services.analytics_service import RegionalAnalyticsService

router = APIRouter(prefix="/analytics", tags=["MDoNER Regional Analytics"])

@router.get("/ner-overview", response_model=RegionalAnalyticsResponse)
async def get_ner_regional_analytics(db: AsyncSession = Depends(get_db)):
    """
    Returns high-level epidemiological insights for MDoNER across all 8 North Eastern States:
    - OA high risk prevalence
    - State-by-state breakdowns (Assam, Arunachal, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura)
    - Occupational risk correlation (Tea garden, terrace farming, hill porters)
    - Terrain correlation and demographic heatmaps
    """
    return await RegionalAnalyticsService.get_ner_overview(db)
