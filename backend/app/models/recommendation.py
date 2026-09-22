from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class Recommendation(Base):
    """A persisted recommendation for a student. The REASONING here always
    comes from the shared adaptive engine logic (ported to Python in
    app/services/recommendation_service.py, mirroring the frontend's
    src/services/adaptiveEngine.js) — this table is a record of what was
    recommended and why, not a second recommendation algorithm.
    """
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="SET NULL"), nullable=True)
    reason = Column(Text, nullable=False)
    priority = Column(String(40), nullable=False, default="Worth practicing")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("Student", back_populates="recommendations")
    activity = relationship("Activity", back_populates="recommendations")
