from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.student import class_students


class ClassModel(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(120), nullable=False)
    grade = Column(String(40), nullable=True)
    section = Column(String(40), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    teacher = relationship("Teacher", back_populates="classes")
    students = relationship("Student", secondary=class_students, back_populates="classes")
