"""Pydantic schemas for Child Profile, Interests, Comfort, Language, and Learning profiles."""
from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


# --- Child Profile Base & Out ---
class ChildProfileBase(BaseModel):
    preferred_name: str
    age: Optional[int] = 7
    age_group: Optional[str] = "early-reader"
    grade: Optional[str] = None
    avatar: str = "🦊"
    mother_tongue: str = "en"
    learning_languages: List[str] = Field(default_factory=lambda: ["en"])
    interface_language: str = "en"


class ChildProfileCreate(ChildProfileBase):
    pass


class ChildProfileOut(ChildProfileBase):
    id: int
    student_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Interests & Favourites (Presentation only) ---
class ChildInterestBase(BaseModel):
    interest_categories: List[str] = Field(default_factory=list, description="e.g. ['space', 'animals', 'music']")
    favorite_color: Optional[str] = None
    favorite_animal: Optional[str] = None
    favorite_character: Optional[str] = None
    favorite_music_style: Optional[str] = None


class ChildInterestCreate(ChildInterestBase):
    pass


class ChildInterestOut(ChildInterestBase):
    id: int
    student_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Comfort & Accessibility Preferences ---
class ChildComfortPreferenceBase(BaseModel):
    font_family: str = "default"
    text_size: str = "large"
    letter_spacing: str = "wide"
    line_spacing: str = "relaxed"
    theme_contrast: str = "soft-pastel"
    motion_level: str = "gentle"

    music_enabled: bool = True
    music_volume: float = 0.6
    voice_volume: float = 1.0
    voice_speed: float = 0.85
    sfx_volume: float = 0.7
    quiet_mode: bool = False
    audio_ducking_enabled: bool = True


class ChildComfortPreferenceCreate(ChildComfortPreferenceBase):
    pass


class ChildComfortPreferenceOut(ChildComfortPreferenceBase):
    id: int
    student_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Language Profile ---
class LanguageProfileBase(BaseModel):
    mother_tongue: str = "en"
    support_language: str = "en"
    target_learning_language: str = "en"
    interface_language: str = "en"
    enabled_languages: List[str] = Field(default_factory=lambda: ["en"])


class LanguageProfileCreate(LanguageProfileBase):
    pass


class LanguageProfileOut(LanguageProfileBase):
    id: int
    student_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Evidence-Based Learning Profile (Strictly separate from interests) ---
class LearningProfileBase(BaseModel):
    phonological_accuracy: float = 70.0
    word_recognition_rate: float = 70.0
    reading_fluency_score: float = 65.0
    pronunciation_clarity: float = 75.0
    comprehension_index: float = 75.0

    repetition_need_level: str = "moderate"
    hint_dependency_rate: float = 0.2
    pacing_preference: str = "unhurried"
    total_sessions_completed: int = 0
    last_evidence_timestamp: Optional[datetime] = None


class LearningProfileOut(LearningProfileBase):
    id: int
    student_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Composite Setup Flow Payload ---
class CompleteChildSetupPayload(BaseModel):
    """Encapsulates the full parent-led setup flow sequence:
    Parent/Child Account -> Child Profile -> Mother Tongue -> Interests/Favourites -> Music/Comfort -> Profile Saved
    """
    preferred_name: str
    age: Optional[int] = 7
    age_group: Optional[str] = "early-reader"
    grade: Optional[str] = None
    avatar: Optional[str] = "🦊"
    mother_tongue: str = "en"
    support_language: Optional[str] = "en"
    target_learning_language: Optional[str] = "en"
    learning_languages: List[str] = Field(default_factory=lambda: ["en"])
    interest_categories: List[str] = Field(default_factory=list)
    favorite_color: Optional[str] = None
    favorite_animal: Optional[str] = None
    favorite_character: Optional[str] = None
    favorite_music_style: Optional[str] = None
    comfort_preference: Optional[ChildComfortPreferenceBase] = None
