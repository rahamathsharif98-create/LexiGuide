import enum
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class ObservationType(str, enum.Enum):
    omission = "omission"
    substitution = "substitution"
    repetition = "repetition"
    hesitation = "hesitation"
    sound_difficulty = "sound_difficulty"
    fluency_difficulty = "fluency_difficulty"


class ReadingObservation(Base):
    """A single observed reading pattern within a session. Deliberately
    educational, never diagnostic — see app/utils/language.py for the
    friendly-language guardrails applied wherever this is surfaced to users.
    """
    __tablename__ = "reading_observations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("learning_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    observation_type = Column(Enum(ObservationType), nullable=False)
    value = Column(String(255), nullable=True)  # e.g. the specific word, or a severity note
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("LearningSession", back_populates="observations")
