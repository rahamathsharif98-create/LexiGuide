"""Part 1: Child Profile Personalization, Comfort, Language, and Evidence-Based Learning Models.

Guiding Principles:
- Setup happens before device reaches the child.
- Interest Profile != Learning Profile: Interests only change presentation themes, never difficulty.
- LearningProfile contains strictly evidence-based fields, populated solely by activity outcomes.
"""
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Float,
    ForeignKey,
    DateTime,
    JSON,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ChildProfile(Base):
    """Explicit child profile entity capturing identity, mother tongue, and learning languages."""
    __tablename__ = "child_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    preferred_name = Column(String(120), nullable=False)
    age = Column(Integer, nullable=True)
    age_group = Column(String(20), nullable=True)  # e.g. "early-reader"
    grade = Column(String(20), nullable=True)      # optional
    avatar = Column(String(20), nullable=False, default="🦊")
    mother_tongue = Column(String(10), nullable=False, default="en")
    learning_languages = Column(JSON, nullable=False, default=lambda: ["en"])
    interface_language = Column(String(10), nullable=False, default="en")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    student = relationship("Student", back_populates="child_profile")


class ChildInterest(Base):
    """Stores the child's interest selections and favourites.
    
    Used EXCLUSIVELY by the Personalization Engine to generate visual themes,
    story contexts, avatars, and reward aesthetics.
    Never used to determine learning difficulty, pacing, or diagnostic metrics.
    """
    __tablename__ = "child_interests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    interest_categories = Column(JSON, nullable=False, default=list)

    favorite_color = Column(String(50), nullable=True)
    favorite_animal = Column(String(50), nullable=True)
    favorite_character = Column(String(50), nullable=True)
    favorite_music_style = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    student = relationship("Student", back_populates="interests")


class ChildComfortPreference(Base):
    """Sensory and accessibility comfort preferences for the child.
    
    Configured by parents/guardians during setup or adjusted dynamically in 'My Comfort'.
    Governs text rendering, typography, motion, and audio-ducking levels.
    """
    __tablename__ = "child_comfort_preferences"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    font_family = Column(String(50), nullable=False, default="default")
    text_size = Column(String(20), nullable=False, default="large")
    letter_spacing = Column(String(20), nullable=False, default="wide")
    line_spacing = Column(String(20), nullable=False, default="relaxed")
    theme_contrast = Column(String(30), nullable=False, default="soft-pastel")
    motion_level = Column(String(20), nullable=False, default="gentle")

    music_enabled = Column(Boolean, nullable=False, default=True)
    music_volume = Column(Float, nullable=False, default=0.6)
    voice_volume = Column(Float, nullable=False, default=1.0)
    voice_speed = Column(Float, nullable=False, default=0.85)
    sfx_volume = Column(Float, nullable=False, default=0.7)
    quiet_mode = Column(Boolean, nullable=False, default=False)
    audio_ducking_enabled = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    student = relationship("Student", back_populates="comfort_preference")


class LanguageProfile(Base):
    """Defines the child's multilingual learning bridge configuration.
    
    Establishes mother tongue as a first-class learning foundation rather than a simple translation toggle.
    """
    __tablename__ = "child_language_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    mother_tongue = Column(String(10), nullable=False, default="en")
    support_language = Column(String(10), nullable=False, default="en")
    target_learning_language = Column(String(10), nullable=False, default="en")
    interface_language = Column(String(10), nullable=False, default="en")
    enabled_languages = Column(JSON, nullable=False, default=lambda: ["en"])

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    student = relationship("Student", back_populates="language_profile")


class LearningProfile(Base):
    """Evidence-based learning progression profile.
    
    STRUCTURALLY DECOUPLED FROM CHILD INTERESTS.
    Populated ONLY by observed activity performance, speech assessments, reading attempts,
    repetition requirements, and response latencies.
    """
    __tablename__ = "child_learning_profiles"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    phonological_accuracy = Column(Float, nullable=False, default=70.0)
    word_recognition_rate = Column(Float, nullable=False, default=70.0)
    reading_fluency_score = Column(Float, nullable=False, default=65.0)
    pronunciation_clarity = Column(Float, nullable=False, default=75.0)
    comprehension_index = Column(Float, nullable=False, default=75.0)

    repetition_need_level = Column(String(20), nullable=False, default="moderate")
    hint_dependency_rate = Column(Float, nullable=False, default=0.2)
    pacing_preference = Column(String(20), nullable=False, default="unhurried")
    total_sessions_completed = Column(Integer, nullable=False, default=0)
    last_evidence_timestamp = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    student = relationship("Student", back_populates="learning_profile")
