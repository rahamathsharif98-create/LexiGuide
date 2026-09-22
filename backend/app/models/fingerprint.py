from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class ReadingFingerprint(Base):
    """An append-only history of fingerprint snapshots per student — never a
    single mutable row. This is what lets 7/30/90-day progress views be
    computed from real historical data instead of simulated/repeated data
    (see app/services/progress_service.py).
    """
    __tablename__ = "reading_fingerprints"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    phonological_awareness = Column(Float, nullable=False)
    pronunciation = Column(Float, nullable=False)
    word_recognition = Column(Float, nullable=False)
    reading_fluency = Column(Float, nullable=False)
    comprehension = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    student = relationship("Student", back_populates="fingerprints")
