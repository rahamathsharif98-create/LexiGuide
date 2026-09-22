from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class DailySkillPerformance(BaseModel):
    skill: str
    label: str
    accuracy: Optional[float] = None
    previous_accuracy: Optional[float] = None
    change: Optional[float] = None
    trend: str = Field(..., description="improving | steady | needs_practice | first_session")


class DailyLearningItem(BaseModel):
    date: str = Field(..., description="YYYY-MM-DD")
    activity_count: int
    completed_count: int
    learning_minutes: int
    skills: List[str] = Field(default_factory=list)
    daily_performance: Dict[str, float] = Field(default_factory=dict)
    reading_performance: Optional[float] = None
    comprehension_performance: Optional[float] = None
    word_recognition: Optional[float] = None
    phonological_awareness: Optional[float] = None
    pronunciation: Optional[float] = None
    target_skill: Optional[str] = None
    changes: List[DailySkillPerformance] = Field(default_factory=list)
    patterns: List[str] = Field(default_factory=list)


class DayByDaySummary(BaseModel):
    total_activities: int
    active_days: int
    current_streak: int
    longest_streak: int
    weekly_consistency: float
    average_activities_per_active_day: float
    strongest_skill: Optional[str] = None
    focus_skill: Optional[str] = None
    overall_change: Optional[float] = None
    data_sufficiency: str = Field(..., description="insufficient | limited | sufficient")
    note: Optional[str] = None


class DayByDayResponse(BaseModel):
    child_id: int
    period: int
    start_date: str
    end_date: str
    days: List[DailyLearningItem] = Field(default_factory=list)
    summary: DayByDaySummary
    disclaimer: str = (
        "Educational day-by-day learning analysis provided for skill tracking and practice guidance. "
        "Not a clinical or medical diagnosis."
    )
