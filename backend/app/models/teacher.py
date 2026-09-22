from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    user = relationship("User", back_populates="teacher")
    classes = relationship("ClassModel", back_populates="teacher", cascade="all, delete-orphan")
