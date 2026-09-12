import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

# On Vercel the filesystem is read-only except /tmp
TMP_DIR = Path("/tmp")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sandhi-NER: AI-Assisted Early Osteoarthritis Detection Platform"
    PROJECT_DESCRIPTION: str = (
        "AI-Assisted Early Detection System for Osteoarthritis (OA) Risk Markers "
        "tailored for the North Eastern Region (MDoNER PS 26004). "
        "Provides edge/cloud biomechanical joint ROM analysis, gait kinematics, "
        "radiographic Kellgren-Lawrence grading with Grad-CAM explainability, "
        "multimodal early risk scoring, and offline-first synchronization."
    )
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sandhi-ner-super-secret-m-doner-2026-key-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for field ASHA workers

    # Database — Supabase PostgreSQL (Transaction Pooler, port 6543)
    # Set DATABASE_URL in Vercel environment variables:
    # Format: postgresql+asyncpg://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://user:password@localhost:5432/sandhi_ner"
    )

    # File Storage — use /tmp on Vercel (ephemeral but writable)
    UPLOAD_DIR: Path = TMP_DIR / "uploads"
    REPORTS_DIR: Path = TMP_DIR / "reports"

    # North Eastern Region States
    NER_STATES: list[str] = [
        "Assam",
        "Arunachal Pradesh",
        "Manipur",
        "Meghalaya",
        "Mizoram",
        "Nagaland",
        "Sikkim",
        "Tripura"
    ]

    # Supported Languages in NER
    SUPPORTED_LANGUAGES: list[dict] = [
        {"code": "en", "name": "English", "native": "English"},
        {"code": "as", "name": "Assamese", "native": "অসমীয়া"},
        {"code": "bn", "name": "Bengali", "native": "বাংলা"},
        {"code": "mni", "name": "Manipuri / Meetei", "native": "মৈতৈলোন্"},
        {"code": "lus", "name": "Mizo", "native": "Mizo ṭawng"},
        {"code": "kha", "name": "Khasi", "native": "Ka Ktien Khasi"},
        {"code": "grt", "name": "Garo", "native": "A·chik"},
        {"code": "hi", "name": "Hindi", "native": "हिन्दी"}
    ]

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()

# Ensure directories exist (uses /tmp on Vercel, local path in dev)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
