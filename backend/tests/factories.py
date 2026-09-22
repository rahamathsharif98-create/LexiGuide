"""Small helpers for building test fixtures directly against the DB,
independent of the seed script (seed.py is for demo data, not test setup)."""
from app.models import Student, Teacher, User, UserRole, ClassModel, Activity, ActivityCategory, Parent


def make_student(db, name="Test Student", age=7, avatar="🦊", fp=None):
    student = Student(name=name, age=age, avatar=avatar)
    db.add(student)
    db.commit()
    db.refresh(student)
    if fp:
        from app.models import ReadingFingerprint
        db.add(ReadingFingerprint(student_id=student.id, **fp))
        db.commit()
    return student


def make_teacher_with_class(db, class_name="Test Class"):
    user = User(name="Test Teacher", email=f"t{class_name}@test.demo", role=UserRole.teacher)
    db.add(user)
    db.commit()
    db.refresh(user)
    teacher = Teacher(user_id=user.id)
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    cls = ClassModel(teacher_id=teacher.id, name=class_name)
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return teacher, cls


def make_parent(db, email="testparent@test.demo"):
    user = User(name="Test Parent", email=email, role=UserRole.parent)
    db.add(user)
    db.commit()
    db.refresh(user)
    parent = Parent(user_id=user.id)
    db.add(parent)
    db.commit()
    db.refresh(parent)
    return parent


def make_activity(db, name="Read With Me", category=ActivityCategory.reading):
    a = Activity(name=name, category=category)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def make_session(db, student_id, skill=None, accuracy=None, outcome_type="game",
                  activity_id=None, started_at=None, completed_at=None, stars=1, xp=10):
    """Phase 9 helper: persist a completed LearningSession with a given
    accuracy, used to build deterministic per-skill history for the
    adaptive-learning engine tests (never randomized — see conftest.py).
    """
    from app.models import LearningSession
    outcome = {"type": outcome_type}
    if accuracy is not None:
        outcome["accuracy"] = accuracy
    kwargs = dict(
        student_id=student_id,
        activity_id=activity_id,
        skill=skill,
        outcome=outcome,
        stars=stars,
        xp=xp,
    )
    # Only pass started_at/completed_at when given explicitly — leaving
    # started_at unset lets the column's server_default(now) apply,
    # instead of an explicit None violating the NOT NULL constraint.
    if started_at is not None:
        kwargs["started_at"] = started_at
    kwargs["completed_at"] = completed_at if completed_at is not None else started_at
    session_row = LearningSession(**kwargs)
    db.add(session_row)
    db.commit()
    db.refresh(session_row)
    return session_row
