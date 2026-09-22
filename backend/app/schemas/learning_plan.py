"""Step 16: Pydantic schemas for Personalized Learning Goals and Adaptive Weekly Learning Plan.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from app.schemas.next_best_action import NextBestActivityItem


class LearningGoalItem(BaseModel):
    goal_id: str
    child_id: int
    skill: str
    skill_name: str
    title: str
    description: str
    priority: int  # 1 = highest, 2 = medium, 3 = secondary
    target_score: int
    current_score: int
    status: str  # "active" | "in_progress" | "achieved" | "needs_attention"
    reason: str
    progress_percentage: int
    recommended_activity_types: List[str]
    created_at: datetime
    updated_at: datetime


class PlannedDayActivity(BaseModel):
    date: str  # YYYY-MM-DD
    day_name: str  # "Monday", "Tuesday", etc.
    is_today: bool
    status: str  # "completed" | "today" | "planned" | "missed"
    activity: Optional[NextBestActivityItem] = None
    goal_id: Optional[str] = None
    reason: str
    plan_type: str  # "New Learning" | "Reinforcement" | "Review" | "Spaced Practice" | "Challenge" | "Easier Practice" | "Exploration"
    completed_session_id: Optional[int] = None
    accuracy_achieved: Optional[float] = None


class LearningGoalsResponse(BaseModel):
    child_id: int
    goals: List[LearningGoalItem]
    active_focus_skill: str
    disclaimer: str


class WeeklyLearningPlanResponse(BaseModel):
    child_id: int
    week_start: str  # YYYY-MM-DD
    week_end: str    # YYYY-MM-DD
    goals: List[LearningGoalItem]
    days: List[PlannedDayActivity]
    total_planned: int
    total_completed: int
    completion_rate: int
    active_focus_skill: str
    disclaimer: str
