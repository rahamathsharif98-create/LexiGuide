"""Import every model here so `Base.metadata` (used by Alembic autogenerate
and by tests that create tables directly) always sees the full schema.
"""
from app.models.user import User, UserRole
from app.models.student import Student, class_students, parent_child
from app.models.parent import Parent
from app.models.teacher import Teacher
from app.models.class_model import ClassModel
from app.models.activity import Activity, ActivityCategory
from app.models.session import LearningSession
from app.models.observation import ReadingObservation, ObservationType
from app.models.fingerprint import ReadingFingerprint
from app.models.recommendation import Recommendation
from app.models.achievement import Achievement
from app.models.story import Story
from app.models.reading_detail import ReadingSessionDetail
from app.models.child_profile import ChildProfile, ChildInterest, ChildComfortPreference, LanguageProfile, LearningProfile

__all__ = [
    "User", "UserRole",
    "Student", "class_students", "parent_child",
    "Parent", "Teacher", "ClassModel",
    "Activity", "ActivityCategory",
    "LearningSession",
    "ReadingObservation", "ObservationType",
    "ReadingFingerprint",
    "Recommendation",
    "Achievement",
    "Story",
    "ReadingSessionDetail",
    "ChildProfile",
    "ChildInterest",
    "ChildComfortPreference",
    "LanguageProfile",
    "LearningProfile",
]
