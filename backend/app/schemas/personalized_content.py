"""Step 17: Pydantic schemas for Intelligent Learning Experience & Content Personalization.
"""
from typing import List, Optional
from pydantic import BaseModel


class ContentItem(BaseModel):
    id: str
    title: str
    description: str
    content_type: str  # "reading" | "speaking" | "game" | "story" | "activity" | "word" | "sound"
    category: str      # "Reading" | "Speaking" | "Games" | "Stories" | "Sounds"
    skill: str         # "phonological_awareness" | "reading_fluency" | "pronunciation" | "comprehension" | "word_recognition"
    secondary_skills: List[str] = []
    difficulty: int    # 1 to 4
    difficulty_label: str  # "Easy" | "Medium" | "Hard"
    age_range: str     # "5-8"
    estimated_minutes: int
    prerequisites: List[str] = []
    tags: List[str] = []
    language: str = "en"
    activity_type: str
    learning_objective: str
    reinforcement_target: Optional[str] = None
    prerequisite_skill: Optional[str] = None
    challenge_level: str  # "supportive" | "standard" | "stretch"
    route: str
    icon: str


class PersonalizedContentCandidate(BaseModel):
    content: ContentItem
    action_type: str  # "NEW_LEARNING" | "REINFORCEMENT" | "REVIEW" | "SPACED_REVIEW" | "CHALLENGE" | "EASIER_PRACTICE" | "EXPLORATION"
    reason: str
    fit_score: float
    repetition_count: int = 0
    goal_aligned: bool = False
    weekly_plan_aligned: bool = False


class PersonalizedCategorySection(BaseModel):
    category_id: str   # "practice_now" | "review" | "keep_going" | "try_something_new"
    title: str
    subtitle: str
    icon: str
    items: List[PersonalizedContentCandidate]


class PersonalizedContentResponse(BaseModel):
    child_id: int
    learning_mode: str  # "NEW_LEARNING" | "REINFORCEMENT" | "REVIEW" | "SPACED_REVIEW" | "CHALLENGE" | "EASIER_PRACTICE" | "EXPLORATION"
    target_skill: str
    adaptive_difficulty: int
    adaptive_difficulty_label: str
    primary: PersonalizedContentCandidate
    alternatives: List[PersonalizedContentCandidate]
    categories: List[PersonalizedCategorySection]
    explanation: str
    language: str
    disclaimer: str
