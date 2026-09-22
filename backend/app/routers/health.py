import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health():
    return {"status": "ok"}


@router.get("/api/health/detailed")
def health_detailed(db: Session = Depends(get_db)):
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Health check database connectivity error: {e}")
        db_status = "error"

    whisper_status = "available" if settings.AI_MODE == "real" else "simulated"
    tts_status = "fallback_browser"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "ai_mode": settings.AI_MODE,
        "whisper": whisper_status,
        "tts": tts_status,
    }

