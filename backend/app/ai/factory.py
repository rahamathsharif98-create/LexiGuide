"""Single place that decides mock vs. real AI implementations, driven by
the AI_MODE environment variable (see app/config.py). Every router imports
these two functions instead of instantiating a service class directly, so
switching AI_MODE=mock <-> AI_MODE=real requires touching nothing else.
"""
from app.config import settings
from app.ai.base import AIAnalysisService
from app.ai.mock import MockAIAnalysisService
from app.ai.real import RealAIAnalysisService
from app.ai.stt.base import SpeechToTextService
from app.ai.stt.mock import MockSpeechToTextService
from app.ai.stt.real import RealSpeechToTextService


def get_ai_analysis_service() -> AIAnalysisService:
    if settings.AI_MODE == "real":
        return RealAIAnalysisService()
    return MockAIAnalysisService()


def get_stt_service() -> SpeechToTextService:
    if settings.AI_MODE == "real":
        return RealSpeechToTextService()
    return MockSpeechToTextService()
