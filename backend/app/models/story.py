from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class Story(Base):
    """Content catalog for the Story Time activity — matches the frontend's
    STORIES demo data shape (title/difficulty/duration/cover), so it's a
    genuinely new, non-duplicative table (Activity already models the
    generic "Story Time" activity type; this models individual story
    content items within it).
    """
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(120), nullable=False)
    difficulty = Column(String(40), nullable=True)
    duration = Column(String(20), nullable=True)
    cover_emoji = Column(String(16), nullable=True)
    passage = Column(Text, nullable=True)
