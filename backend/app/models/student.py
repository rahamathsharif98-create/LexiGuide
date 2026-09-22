from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Table
from sqlalchemy.orm import relationship

from app.database import Base

# Many-to-many: a student can appear in one class here for simplicity in
# the demo (a class "roster"), modeled as a proper association table so it
# generalizes to multiple classes per student later without a migration.
class_students = Table(
    "class_students",
    Base.metadata,
    Column("class_id", Integer, ForeignKey("classes.id", ondelete="CASCADE"), primary_key=True),
    Column("student_id", Integer, ForeignKey("students.id", ondelete="CASCADE"), primary_key=True),
)

# Many-to-many: supports more than one parent/guardian per child, and a
# parent account with more than one child.
parent_child = Table(
    "parent_child",
    Base.metadata,
    Column("parent_id", Integer, ForeignKey("parents.id", ondelete="CASCADE"), primary_key=True),
    Column("student_id", Integer, ForeignKey("students.id", ondelete="CASCADE"), primary_key=True),
)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    # Nullable: in this demo phase a child profile doesn't necessarily have
    # its own login yet (no full auth until a later phase).
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)
    name = Column(String(120), nullable=False)
    age = Column(Integer, nullable=True)
    avatar = Column(String(16), nullable=True)  # emoji, matches the existing frontend demo data
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="student")
    classes = relationship("ClassModel", secondary=class_students, back_populates="students")
    parents = relationship("Parent", secondary=parent_child, back_populates="children")
    sessions = relationship("LearningSession", back_populates="student", cascade="all, delete-orphan")
    fingerprints = relationship("ReadingFingerprint", back_populates="student", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="student", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="student", cascade="all, delete-orphan")
    interests = relationship("ChildInterest", back_populates="student", uselist=False, cascade="all, delete-orphan")
    comfort_preference = relationship("ChildComfortPreference", back_populates="student", uselist=False, cascade="all, delete-orphan")
    language_profile = relationship("LanguageProfile", back_populates="student", uselist=False, cascade="all, delete-orphan")
    learning_profile = relationship("LearningProfile", back_populates="student", uselist=False, cascade="all, delete-orphan")
    child_profile = relationship("ChildProfile", back_populates="student", uselist=False, cascade="all, delete-orphan")
