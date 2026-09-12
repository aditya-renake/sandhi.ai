from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.core.database import init_db
from app.api.v1 import api_v1_router
from app.data.seed_data import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database tables and sample NER seed data
    await init_db()
    try:
        await seed_database()
    except Exception as e:
        print(f"Seed data notice: {e}")
    yield
    # Shutdown logic

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration — allow Vercel frontend + local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to your Vercel domain in production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount ephemeral upload/report directories (writable /tmp on Vercel)
try:
    app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
except Exception:
    pass  # Directory may not exist yet on cold start

try:
    app.mount("/reports", StaticFiles(directory=str(settings.REPORTS_DIR)), name="reports")
except Exception:
    pass  # Directory may not exist yet on cold start

# Include API V1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health & System"])
async def root_health_check():
    return {
        "system": "Sandhi-NER: AI-Assisted Early Detection System for Osteoarthritis Risk Markers",
        "organization": "Ministry of Development of North Eastern Region (MDoNER)",
        "problem_statement_id": "26004",
        "status": "OPERATIONAL",
        "version": settings.VERSION,
        "supported_ner_states": settings.NER_STATES,
        "supported_languages": [l["name"] for l in settings.SUPPORTED_LANGUAGES],
        "api_documentation": "/docs",
        "redoc_documentation": "/redoc"
    }

@app.get("/health", tags=["Health & System"])
async def health_check():
    return {"status": "healthy", "service": "sandhi-ner-backend-cv-api"}
