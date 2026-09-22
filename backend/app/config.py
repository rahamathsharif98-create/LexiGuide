"""Centralized application configuration, loaded from environment variables.

Never hard-code credentials here — everything comes from `.env` (local dev)
or real environment variables (deployed environments). See `.env.example`
for the variables this app expects.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+psycopg2://readquest:readquest_dev_pw@127.0.0.1:5432/readquest"
    TEST_DATABASE_URL: str = "postgresql+psycopg2://readquest:readquest_dev_pw@127.0.0.1:5432/readquest_test"
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    JWT_SECRET: str = "dev-only-secret-change-me"
    API_BASE_URL: str = "http://localhost:8000"

    # Phase 8 Step 2 — AI service selection. "mock" (default) uses
    # MockAIAnalysisService/MockSpeechToTextService (no external
    # dependencies, safe for CI/tests). "real" uses
    # RealAIAnalysisService/RealSpeechToTextService (requires the
    # openai-whisper package + ffmpeg — see backend/README.md).
    AI_MODE: str = "mock"
    # Whisper model size used only when AI_MODE=real. Larger = more
    # accurate but slower/more memory. See openai-whisper's docs for the
    # full list (tiny/base/small/medium/large).
    WHISPER_MODEL_SIZE: str = "base"
    # Reject audio uploads larger than this to POST /api/speech/transcribe
    # and /api/reading/session-audio before ever reading them into memory.
    MAX_AUDIO_UPLOAD_MB: int = 15

    # ------------------------------------------------------------------
    # Phase 9 — Adaptive Learning Engine configuration (Step 18). Every
    # threshold the engine uses lives here, NOT scattered through
    # adaptive_learning_service.py, so tuning the engine never means
    # hunting for magic numbers in business logic.
    # ------------------------------------------------------------------

    # Difficulty levels are 1 (Beginner) .. 4 (Advanced).
    ADAPTIVE_MIN_DIFFICULTY: int = 1
    ADAPTIVE_MAX_DIFFICULTY: int = 4

    # A skill's "recent performance" average at/above this raises
    # difficulty by one level (never more — see STEP 4: gradual only).
    ADAPTIVE_HIGH_PERFORMANCE_THRESHOLD: float = 80.0
    # A skill's "recent performance" average at/below this lowers
    # difficulty by one level and marks the skill as needing practice.
    ADAPTIVE_LOW_PERFORMANCE_THRESHOLD: float = 55.0

    # How many of a skill's most recent attempts count as "recent
    # performance" for trend/difficulty calculations.
    ADAPTIVE_RECENT_SESSION_WINDOW: int = 4
    # Minimum attempts required before the engine will call a trend
    # "improving"/"declining" rather than "not enough data yet".
    ADAPTIVE_MIN_ATTEMPTS_FOR_TREND: int = 2

    # A swing of at least this many points between consecutive recent
    # attempts marks the skill's performance as "inconsistent".
    ADAPTIVE_INCONSISTENCY_SWING: float = 20.0

    # How many times the same activity may be recommended back-to-back
    # before the engine forces variety (STEP 10 — avoid over-practice).
    ADAPTIVE_REPETITION_LIMIT: int = 2

    # A skill not practiced for at least this many days is eligible to be
    # resurfaced by spaced practice (STEP 8), even if it isn't currently
    # the weakest skill.
    ADAPTIVE_SPACED_PRACTICE_INTERVAL_DAYS: int = 3


settings = Settings()
