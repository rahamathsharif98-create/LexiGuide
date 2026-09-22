import enum
from sqlalchemy import Column, Integer, String, Enum, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ActivityCategory(str, enum.Enum):
    reading = "Reading"
    speaking = "Speaking"
    games = "Games"
    stories = "Stories"
    sounds = "Sounds"
    understanding = "Understanding"


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    category = Column(Enum(ActivityCategory), nullable=False, index=True)
    description = Column(Text, nullable=True)

    sessions = relationship("LearningSession", back_populates="activity")
    recommendations = relationship("Recommendation", back_populates="activity")
