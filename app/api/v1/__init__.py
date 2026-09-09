from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.patients import router as patients_router
from app.api.v1.cv import router as cv_router
from app.api.v1.screening import router as screening_router
from app.api.v1.reports import router as reports_router
from app.api.v1.sync import router as sync_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.guidance import router as guidance_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(patients_router)
api_v1_router.include_router(cv_router)
api_v1_router.include_router(screening_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(sync_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(guidance_router)
