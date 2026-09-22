from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.student import parent_child


class Parent(Base):
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    user = relationship("User", back_populates="parent")
    children = relationship("Student", secondary=parent_child, back_populates="parents")
