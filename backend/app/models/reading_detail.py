from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class ReadingSessionDetail(Base):
    """Rich, read-aloud-specific data for a LearningSession, capturing
    exactly the granular fields the Phase 7 spec calls for (expected vs.
    recognized text, word-level counts, per-skill scores). Deliberately a
    1:1 EXTENSION of LearningSession rather than a separate/duplicate
    session table — LearningSession already holds child/activity/stars/xp/
    timestamps; this holds the reading-specific detail only relevant to
    Read With Me sessions.
    """
    __tablename__ = "reading_session_details"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("learning_sessions.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    expected_text = Column(Text, nullable=True)
    recognized_text = Column(Text, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    words_attempted = Column(Integer, nullable=True)
    words_correct = Column(Integer, nullable=True)
    omissions = Column(Integer, default=0)
    substitutions = Column(Integer, default=0)
    repetitions = Column(Integer, default=0)
    hesitations = Column(Integer, default=0)
    pronunciation_score = Column(Float, nullable=True)
    fluency_score = Column(Float, nullable=True)
    comprehension_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("LearningSession", backref="reading_detail", uselist=False)
