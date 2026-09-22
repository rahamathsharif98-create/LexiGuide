from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FingerprintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    phonological_awareness: float
    pronunciation: float
    word_recognition: float
    reading_fluency: float
    comprehension: float
    recorded_at: datetime


class FingerprintHistoryOut(BaseModel):
    current: FingerprintOut | None
    history: list[FingerprintOut]
    disclaimer: str
