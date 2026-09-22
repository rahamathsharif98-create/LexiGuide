"""Step 19: Multimodal Learning and Child Adaptive Experience Schemas."""
from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class LearningPresentationMode(str, Enum):
    TEXT = "TEXT"
    AUDIO = "AUDIO"
    READ_ALONG = "READ_ALONG"
    SPEAK = "SPEAK"
    VISUAL = "VISUAL"
    INTERACTIVE = "INTERACTIVE"
    GAME = "GAME"


class PresentationSupportLevel(str, Enum):
    FULL_SUPPORT = "FULL_SUPPORT"
    GUIDED = "GUIDED"
    INDEPENDENT = "INDEPENDENT"
    CHALLENGE = "CHALLENGE"


class MultimodalScaffolding(BaseModel):
    show_word_cards: bool = False
    show_image_cues: bool = True
    audio_prompt_enabled: bool = False
    reduced_hints: bool = False
    guided_step_by_step: bool = False
    visual_phoneme_cues: bool = False
    pace: str = "normal"  # "relaxed" | "normal" | "brisk"


class MultimodalCapabilityStatus(BaseModel):
    audio_available: bool = False
    tts_available: bool = False
    tts_status: str = "UNAVAILABLE"  # "AVAILABLE" | "MOCK" | "UNAVAILABLE"
    speech_input_available: bool = True
    whisper_status: str = "MOCK"  # "REAL" | "MOCK" | "UNAVAILABLE"
    reading_alignment_available: bool = True
    visual_support_available: bool = True
    interactive_activities_available: bool = True
    content_generation_status: str = "MOCK"
    multimodal_modes_supported: List[str] = [
        "TEXT",
        "AUDIO",
        "READ_ALONG",
        "SPEAK",
        "VISUAL",
        "INTERACTIVE",
        "GAME",
    ]
    support_levels_supported: List[str] = [
        "FULL_SUPPORT",
        "GUIDED",
        "INDEPENDENT",
        "CHALLENGE",
    ]


class MultimodalPresentationResponse(BaseModel):
    content_id: str
    child_id: Optional[int] = None
    target_skill: str = "reading_fluency"
    available_modes: List[str] = Field(default_factory=list)
    recommended_mode: str = "READ_ALONG"
    support_level: str = "GUIDED"
    support_fading_trajectory: str
    reason: str
    scaffolds: MultimodalScaffolding
    disclaimer: str
