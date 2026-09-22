import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    child = "child"
    parent = "parent"
    teacher = "teacher"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # nullable: demo users seeded before auth existed
    role = Column(Enum(UserRole), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("Student", back_populates="user", uselist=False)
    parent = relationship("Parent", back_populates="user", uselist=False)
    teacher = relationship("Teacher", back_populates="user", uselist=False)
