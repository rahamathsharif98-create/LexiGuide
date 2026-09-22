from datetime import datetime
from pydantic import BaseModel


class SkillProfileOut(BaseModel):
    skill: str
    label: str
    current_level: float
    attempts: int
    recent_performance: float | None = None
    historical_performance: float | None = None
    trend: str
    consistency: str
    pattern: str
    pattern_explanation: str
    difficulty: int
    last_practiced_at: datetime | None = None
    days_since_practice: int | None = None
    recommended_practice: bool
    mastery_state: str = "Needs Practice"
    status_badge: str | None = None


class LearningProfileOut(BaseModel):
    student_id: int
    skills: list[SkillProfileOut]
    disclaimer: str
    data_sufficiency: str = "sufficient"
    total_sessions: int = 0
    priority_skill: str | None = None
    strongest_skill: str | None = None


class NextActivityOut(BaseModel):
    activity: str
    route: str
    icon: str
    skill: str
    difficulty: int
    reason: str
    goal: str
    pattern: str
    child_id: int | None = None
    activity_id: int | None = None
    activity_type: str | None = None
    title: str | None = None
    priority: str | None = "normal"
    is_adaptive: bool = True


class LearningPathStepOut(BaseModel):
    skill: str
    label: str
    activity: str
    route: str
    icon: str
    difficulty: int
    pattern: str
    reason: str


class LearningPathOut(BaseModel):
    student_id: int
    path: list[LearningPathStepOut]
    disclaimer: str


class SpacedPracticeItemOut(BaseModel):
    skill: str
    label: str
    days_since_practice: int | None = None
    reason: str
