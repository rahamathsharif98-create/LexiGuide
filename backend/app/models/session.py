from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import relationship

from app.database import Base


class LearningSession(Base):
    """A single completed (or in-progress) activity attempt by a student.
    This is the atomic unit everything else (fingerprint, progress,
    recommendations) is ultimately derived from.
    """
    __tablename__ = "learning_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="SET NULL"), nullable=True, index=True)
    skill = Column(String(60), nullable=True)  # e.g. "phonologicalAwareness" — matches the frontend's skill keys
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    outcome = Column(JSON, nullable=True)  # mirrors the frontend's session-outcome shape (accuracy, hesitations, etc.)
    stars = Column(Integer, default=0, nullable=False)
    xp = Column(Integer, default=0, nullable=False)

    student = relationship("Student", back_populates="sessions")
    activity = relationship("Activity", back_populates="sessions")
    observations = relationship("ReadingObservation", back_populates="session", cascade="all, delete-orphan")
