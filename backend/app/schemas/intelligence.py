from datetime import datetime
from pydantic import BaseModel


class ErrorDistribution(BaseModel):
    omissions: int = 0
    substitutions: int = 0
    repetitions: int = 0
    insertions: int = 0
    hesitations: int = 0
    total_errors: int = 0
    omission_pct: float = 0.0
    substitution_pct: float = 0.0
    repetition_pct: float = 0.0
    primary_error_type: str | None = None


class ConfusionItem(BaseModel):
    expected: str
    recognized: str
    count: int
    focus_pattern: str | None = None
    pedagogical_note: str | None = None


class FluencyMetric(BaseModel):
    session_id: int
    recorded_at: datetime | None = None
    duration_seconds: int | None = None
    words_attempted: int = 0
    words_correct: int = 0
    wcpm: float = 0.0
    accuracy: float = 0.0
    pace_label: str = "Steady"


class FluencyOverview(BaseModel):
    average_wcpm: float = 0.0
    highest_wcpm: float = 0.0
    reading_pace: str = "Developing"
    fluency_stability: str = "Consistent"
    sessions_analyzed: int = 0
    timeline: list[FluencyMetric] = []


class PedagogicalGuidance(BaseModel):
    summary: str
    observed_strengths: list[str] = []
    recommended_focus_areas: list[str] = []
    educator_tips: list[str] = []


class LearningIntelligenceOut(BaseModel):
    student_id: int
    disclaimer: str
    data_sufficiency: str  # "insufficient_data" | "developing_data" | "sufficient"
    total_reading_sessions: int = 0
    error_distribution: ErrorDistribution
    fluency: FluencyOverview
    top_confusions: list[ConfusionItem] = []
    guidance: PedagogicalGuidance
