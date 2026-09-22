"""Seed the database with clearly fictional demo data.

Run with:  python -m app.seed

Names/ages/avatars/fingerprint values deliberately match the existing
frontend's src/data/demoData.js so the two stay compatible during the
Phase 5 transition (per the spec's "Preserve Existing Demo Data" section).
This is DEMO data only — never real children's information.
"""
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal, engine, Base
from app.models import (
    User, UserRole, Student, Parent, Teacher, ClassModel,
    Activity, ActivityCategory, LearningSession, ReadingObservation, ObservationType,
    ReadingFingerprint, Recommendation, Achievement, Story,
)
from app.services.recommendation_service import persist_recommendations_for_student
from app.utils.security import hash_password

STUDENTS_DATA = [
    {"name": "Aarav", "age": 7, "avatar": "🦊", "fp": {"phonological_awareness": 62, "pronunciation": 71, "word_recognition": 55, "reading_fluency": 48, "comprehension": 82}},
    {"name": "Meera", "age": 6, "avatar": "🐼", "fp": {"phonological_awareness": 74, "pronunciation": 80, "word_recognition": 69, "reading_fluency": 66, "comprehension": 75}},
    {"name": "Kabir", "age": 9, "avatar": "🐯", "fp": {"phonological_awareness": 40, "pronunciation": 52, "word_recognition": 38, "reading_fluency": 33, "comprehension": 61}},
    {"name": "Priya", "age": 8, "avatar": "🐰", "fp": {"phonological_awareness": 70, "pronunciation": 85, "word_recognition": 68, "reading_fluency": 45, "comprehension": 72}},
    {"name": "Rohan", "age": 6, "avatar": "🐨", "fp": {"phonological_awareness": 68, "pronunciation": 66, "word_recognition": 72, "reading_fluency": 70, "comprehension": 45}},
]

ACTIVITIES_DATA = [
    ("Read With Me", ActivityCategory.reading, "Guided read-aloud with word-level feedback."),
    ("Speak & Shine", ActivityCategory.speaking, "Target-word pronunciation practice."),
    ("Sound Safari", ActivityCategory.sounds, "Match a spoken sound to a picture."),
    ("Word Builder", ActivityCategory.games, "Arrange letters to build a target word."),
    ("Letter Detective", ActivityCategory.sounds, "Find words containing a target sound."),
    ("Picture Match", ActivityCategory.games, "Match a picture to its written word."),
    ("Story Time", ActivityCategory.stories, "Read a story and answer comprehension questions."),
]

ACHIEVEMENTS_DATA = [
    ("first_reading", "First Reading Adventure", "Completed your first session", "🏆", True),
    ("speaking_star", "Speaking Star", "Recorded 10 read-alouds", "🎤", True),
    ("story_explorer", "Story Explorer", "Finished 5 stories", "📚", True),
    ("streak_5", "5-Day Learning Streak", "Practiced 5 days in a row", "🔥", True),
    ("sound_master", "Sound Master", "Mastered 3 tricky sounds", "⭐", False),
    ("puzzle_pro", "Puzzle Pro", "Completed 20 word puzzles", "🧩", False),
]


def _history_for(final: dict, days_back: int) -> dict:
    """Simple linear ramp toward the final value, same idea as the
    frontend's generateHistory() — used only to seed a few real historical
    snapshots so progress queries have genuine data to compute a trend from.
    """
    return {k: max(5, round(v - days_back * 1.8)) for k, v in final.items()}


def seed():
    Base.metadata.create_all(bind=engine)  # safety net if migrations weren't run
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already has data — skipping seed. Delete rows manually to reseed.")
            return

        # --- Users: 1 demo teacher, 1 demo parent ---
        teacher_user = User(name="Ms. Rao", email="teacher@readquest.demo", role=UserRole.teacher, password_hash=hash_password("demo1234"))
        parent_user = User(name="Demo Parent", email="parent@readquest.demo", role=UserRole.parent, password_hash=hash_password("demo1234"))
        db.add_all([teacher_user, parent_user])
        db.commit()
        db.refresh(teacher_user)
        db.refresh(parent_user)

        teacher = Teacher(user_id=teacher_user.id)
        parent = Parent(user_id=parent_user.id)
        db.add_all([teacher, parent])
        db.commit()
        db.refresh(teacher)
        db.refresh(parent)

        # --- Class ---
        class_row = ClassModel(teacher_id=teacher.id, name="Grade 2 — Section A", grade="2", section="A")
        db.add(class_row)
        db.commit()
        db.refresh(class_row)

        # --- Activities ---
        activities = {}
        for name, category, desc in ACTIVITIES_DATA:
            a = Activity(name=name, category=category, description=desc)
            db.add(a)
            activities[name] = a
        db.commit()
        for a in activities.values():
            db.refresh(a)

        # --- Students, fingerprint history, sessions, observations, achievements ---
        students = []
        for i, sd in enumerate(STUDENTS_DATA):
            student = Student(name=sd["name"], age=sd["age"], avatar=sd["avatar"])
            db.add(student)
            db.commit()
            db.refresh(student)
            students.append(student)
            class_row.students.append(student)

            # First student (Aarav) also gets a CHILD-role login, for
            # testing the child auth flow — the others intentionally don't,
            # since most child profiles in this demo are selected without
            # their own login (matches the existing Select Profile flow).
            if i == 0:
                child_user = User(name=sd["name"], email="child.aarav@readquest.demo", role=UserRole.child, password_hash=hash_password("demo1234"))
                db.add(child_user)
                db.commit()
                db.refresh(child_user)
                student.user_id = child_user.id
                db.commit()

            # First 3 students are linked to the demo parent (matches the
            # frontend's 3 CHILDREN available in Parent's "My Children").
            if i < 3:
                parent.children.append(student)

            # Fingerprint history: a few real snapshots trending toward the
            # target values, so progress endpoints have genuine data.
            base_time = datetime.now(timezone.utc) - timedelta(days=6)
            for day_offset, days_back in enumerate([6, 4, 2, 0]):
                snapshot = _history_for(sd["fp"], days_back) if days_back > 0 else sd["fp"]
                db.add(ReadingFingerprint(
                    student_id=student.id,
                    recorded_at=base_time + timedelta(days=day_offset * 2),
                    **snapshot,
                ))
            db.commit()

            # A couple of learning sessions with observations.
            session1 = LearningSession(
                student_id=student.id, activity_id=activities["Read With Me"].id, skill="readingFluency",
                completed_at=datetime.now(timezone.utc) - timedelta(days=1),
                outcome={"type": "reading", "accuracy": 72}, stars=3, xp=20,
            )
            session2 = LearningSession(
                student_id=student.id, activity_id=activities["Sound Safari"].id, skill="phonologicalAwareness",
                completed_at=datetime.now(timezone.utc) - timedelta(hours=5),
                outcome={"type": "game", "score": 75}, stars=2, xp=15,
            )
            db.add_all([session1, session2])
            db.commit()
            db.refresh(session1)

            db.add(ReadingObservation(session_id=session1.id, observation_type=ObservationType.hesitation, value="multisyllable words"))
            if sd["fp"]["phonological_awareness"] < 60:
                db.add(ReadingObservation(session_id=session1.id, observation_type=ObservationType.sound_difficulty, value="sh / ch"))
            db.commit()

            # Achievements — same demo set per student, matching the frontend.
            for key, title, desc, icon, earned in ACHIEVEMENTS_DATA:
                db.add(Achievement(
                    student_id=student.id, key=key, title=title, description=desc, icon=icon,
                    earned_at=datetime.now(timezone.utc) if earned else None,
                ))
            db.commit()

            # Recommendations, generated from the SAME adaptive engine.
            persist_recommendations_for_student(db, student.id, sd["fp"])

        db.commit()

        db.add_all([
            Story(title="The Curious Fox", difficulty="Easy", duration="3 min", cover_emoji="🦊",
                  passage="Once there was a curious fox named Sam. Sam loved to explore the green, quiet forest."),
            Story(title="A Trip to the Moon", difficulty="Medium", duration="4 min", cover_emoji="🚀",
                  passage="Priya dreamed of flying to the moon. She built a rocket from cardboard and paint."),
        ])
        db.commit()

        print(f"Seeded: 1 teacher, 1 parent, {len(students)} students, 1 class, {len(activities)} activities, 2 stories.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
