from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.database import Base


class Achievement(Base):
    """Matches the frontend's ACHIEVEMENTS shape (icon/title/desc/earned).
    `earned_at` is NULL for a locked achievement.
    """
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    key = Column(String(60), nullable=False)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(16), nullable=True)
    earned_at = Column(DateTime(timezone=True), nullable=True)

    student = relationship("Student", back_populates="achievements")
