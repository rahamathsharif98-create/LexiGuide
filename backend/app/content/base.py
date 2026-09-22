"""Base schemas, enums, and data models for LexiGuide Content System."""
from enum import Enum
from typing import List, Dict, Optional, Union, Any
from pydantic import BaseModel, Field, field_validator


class ContentSourceType(str, Enum):
    CURATED = "curated"
    ASSEMBLED = "assembled"
    GENERATED = "generated"


class ContentType(str, Enum):
    READING = "reading"
    STORY = "story"
    WORD_ACTIVITY = "word_activity"
    SPELLING = "spelling"
    PHONICS = "phonics"
    VOCABULARY = "vocabulary"
    COMPREHENSION = "comprehension"
    SPEAKING = "speaking"
    SOUND = "sound"


SUPPORTED_SKILLS = [
    "phonological_awareness",
    "pronunciation",
    "word_recognition",
    "reading_fluency",
    "comprehension",
]

SUPPORTED_LANGUAGES = ["en", "es", "fr", "hi", "te"]

ALLOWED_TOPICS = [
    "animals",
    "space",
    "adventure",
    "nature",
    "school",
    "sports",
    "science",
    "friendship",
    "everyday",
]


class QuestionOption(BaseModel):
    text: str
    emoji: Optional[str] = None


class ComprehensionQuestion(BaseModel):
    id: Optional[str] = None
    q: str
    options: List[QuestionOption]
    answer: str


class ContentItemModel(BaseModel):
    id: str
    title: str
    description: str
    content_type: str
    category: str
    skill: str
    secondary_skills: List[str] = Field(default_factory=list)
    difficulty: int = Field(ge=1, le=4, default=2)
    difficulty_label: str = "Easy"
    age_range: str = "5-8"
    age_min: int = 4
    age_max: int = 10
    estimated_minutes: int = Field(ge=1, le=30, default=5)
    prerequisites: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    language: str = "en"
    activity_type: str = "game"
    learning_objective: str
    reinforcement_target: Optional[str] = None
    prerequisite_skill: Optional[str] = None
    challenge_level: str = "standard"
    route: str
    icon: str = "✨"
    source_type: str = ContentSourceType.CURATED.value
    passage: Optional[Union[str, List[str]]] = None
    expected_text: Optional[str] = None
    questions: Optional[List[ComprehensionQuestion]] = None
    vocabulary_words: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class ContentGenerationRequest(BaseModel):
    child_id: int
    skill: str
    difficulty: int = Field(default=2, ge=1, le=4)
    language: str = Field(default="en", max_length=10)
    content_type: str = Field(default="reading")
    age: int = Field(default=7, ge=4, le=10)
    topic: Optional[str] = Field(default="animals", max_length=50)

    @field_validator("skill")
    @classmethod
    def validate_skill(cls, v: str) -> str:
        s = v.strip().lower()
        if s not in SUPPORTED_SKILLS:
            raise ValueError(f"Skill '{v}' is not supported. Must be one of {SUPPORTED_SKILLS}")
        return s

    @field_validator("topic")
    @classmethod
    def sanitize_topic(cls, v: Optional[str]) -> str:
        if not v:
            return "animals"
        cleaned = "".join(ch for ch in v if ch.isalnum() or ch in (" ", "_", "-")).strip().lower()
        return cleaned[:30] if cleaned else "animals"


class ContentGenerationResponse(BaseModel):
    item: ContentItemModel
    source_type: str
    validation_passed: bool
    fit_reason: str
    disclaimer: str


class ContentCapabilitiesResponse(BaseModel):
    content_generation_available: bool = False
    structured_assembly_available: bool = True
    curated_content_available: bool = True
    supported_content_types: List[str]
    supported_skills: List[str]
    supported_languages: List[str]
    difficulty_range: List[int] = [1, 4]
    age_range: List[int] = [4, 10]
    model_mode: str = "mock"
