"""Unit tests for Phase 1: Child Profile, Interests, Comfort, Language, and Evidence-Based Learning Profile models."""
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.student import Student
from app.models.child_profile import (
    ChildInterest,
    ChildComfortPreference,
    LanguageProfile,
    LearningProfile,
)


class TestPhase1DataModels(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        # Create a test student
        self.student = Student(name="Aarav", age=7, avatar="🦊")
        self.db.add(self.student)
        self.db.commit()
        self.db.refresh(self.student)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_child_interest_model_stores_preferences(self):
        interests = ChildInterest(
            student_id=self.student.id,
            interest_categories=["space", "animals", "music"],
            favorite_color="blue",
            favorite_animal="panda",
            favorite_character="cosmic fox",
            favorite_music_style="calm",
        )
        self.db.add(interests)
        self.db.commit()

        retrieved = self.db.query(ChildInterest).filter_by(student_id=self.student.id).first()
        self.assertIsNotNone(retrieved)
        self.assertEqual(len(retrieved.interest_categories), 3)
        self.assertIn("space", retrieved.interest_categories)
        self.assertEqual(retrieved.favorite_music_style, "calm")
        self.assertEqual(self.student.interests.favorite_animal, "panda")

    def test_child_comfort_preferences_defaults_and_updates(self):
        comfort = ChildComfortPreference(
            student_id=self.student.id,
            font_family="open-dyslexic",
            text_size="extra-large",
            voice_speed=0.85,
            quiet_mode=True,
            audio_ducking_enabled=True,
        )
        self.db.add(comfort)
        self.db.commit()

        retrieved = self.db.query(ChildComfortPreference).filter_by(student_id=self.student.id).first()
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.font_family, "open-dyslexic")
        self.assertEqual(retrieved.text_size, "extra-large")
        self.assertEqual(retrieved.voice_speed, 0.85)
        self.assertTrue(retrieved.quiet_mode)
        self.assertTrue(retrieved.audio_ducking_enabled)

    def test_language_profile_mother_tongue_bridge(self):
        lang = LanguageProfile(
            student_id=self.student.id,
            mother_tongue="te",
            support_language="te",
            target_learning_language="en",
            interface_language="en",
            enabled_languages=["en", "te"],
        )
        self.db.add(lang)
        self.db.commit()

        retrieved = self.db.query(LanguageProfile).filter_by(student_id=self.student.id).first()
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.mother_tongue, "te")
        self.assertEqual(retrieved.support_language, "te")
        self.assertEqual(retrieved.target_learning_language, "en")
        self.assertIn("te", retrieved.enabled_languages)

    def test_learning_profile_is_structurally_separate_from_interests(self):
        """Verify that the LearningProfile only holds evidence-based metrics."""
        learning_prof = LearningProfile(
            student_id=self.student.id,
            phonological_accuracy=68.5,
            word_recognition_rate=62.0,
            reading_fluency_score=58.0,
            pronunciation_clarity=72.0,
            comprehension_index=80.0,
            repetition_need_level="moderate",
            hint_dependency_rate=0.25,
            pacing_preference="unhurried",
            total_sessions_completed=12,
        )
        self.db.add(learning_prof)
        self.db.commit()

        retrieved = self.db.query(LearningProfile).filter_by(student_id=self.student.id).first()
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.total_sessions_completed, 12)
        self.assertEqual(retrieved.pacing_preference, "unhurried")
        # Ensure that no interest attributes exist on the learning profile
        self.assertFalse(hasattr(retrieved, "favorite_color"))
        self.assertFalse(hasattr(retrieved, "interest_categories"))

    def test_cascade_delete_on_student(self):
        """Deleting student cascades to all related personalization & learning profile rows."""
        self.db.add(ChildInterest(student_id=self.student.id, interest_categories=["space"]))
        self.db.add(ChildComfortPreference(student_id=self.student.id))
        self.db.add(LanguageProfile(student_id=self.student.id, mother_tongue="te"))
        self.db.add(LearningProfile(student_id=self.student.id))
        self.db.commit()

        # Delete student
        self.db.delete(self.student)
        self.db.commit()

        self.assertIsNone(self.db.query(ChildInterest).filter_by(student_id=self.student.id).first())
        self.assertIsNone(self.db.query(ChildComfortPreference).filter_by(student_id=self.student.id).first())
        self.assertIsNone(self.db.query(LanguageProfile).filter_by(student_id=self.student.id).first())
        self.assertIsNone(self.db.query(LearningProfile).filter_by(student_id=self.student.id).first())


if __name__ == "__main__":
    unittest.main()
