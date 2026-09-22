from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ReadingSessionCreate(BaseModel):
    activity_id: int | None = None
    expected_text: str
    recognized_text: str
    duration_seconds: int | None = None
    stars: int = 0
    xp: int = 0


class ComprehensionQuestionSubmit(BaseModel):
    question: str
    correct_answer: str
    child_answer: str


class ComprehensionSubmit(BaseModel):
    activity_id: int | None = None
    story_id: int | None = None
    duration_seconds: int | None = None
    stars: int = 0
    xp: int = 0
    questions: list[ComprehensionQuestionSubmit]


class ReadingSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    expected_text: str | None
    recognized_text: str | None
    words_attempted: int | None
    words_correct: int | None
    omissions: int
    substitutions: int
    repetitions: int
    hesitations: int
    pronunciation_score: float | None
    fluency_score: float | None
    comprehension_score: float | None
    created_at: datetime
