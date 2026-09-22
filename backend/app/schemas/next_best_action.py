from datetime import datetime
from pydantic import BaseModel, Field


class NextBestActivityItem(BaseModel):
    activity_id: str
    activity_type: str = "activity"  # "game", "reading", "speaking", "story", "sound", "activity"
    title: str
    skill: str
    difficulty: int = 1
    difficulty_label: str = "Easy"  # "Easy", "Medium", "Hard"
    route: str
    icon: str = "⭐"
    priority: int = 1  # 1 for primary best action, 2 for alternative, 3 for spaced practice / variety
    recommendation_type: str = "needs_practice"
    reason: str
    fit_reason: str
    recommended_action: str
    expected_learning_goal: str
    is_spaced_practice: bool = False
    is_variety_switch: bool = False


class LearnerSummary(BaseModel):
    student_id: int
    total_sessions: int = 0
    focus_skill: str | None = None
    strongest_skill: str | None = None
    current_streak: int = 0
    data_sufficiency: str = "insufficient"  # "insufficient", "developing", "sufficient"


class NextBestActionResponse(BaseModel):
    child_id: int
    learner_summary: LearnerSummary
    best_action: NextBestActivityItem
    alternatives: list[NextBestActivityItem] = Field(default_factory=list)
    explanation: str
    disclaimer: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
