import pytest
from app.models import User, UserRole, Parent, Teacher, ClassModel, Student, LearningSession, ReadingFingerprint
from app.services.session_service import create_session
from app.services.fingerprint_service import get_latest_fingerprint, SKILL_KEYS
from app.services.progress_service import get_progress
from app.services.parent_service import get_child_summary
from app.services.teacher_service import get_dashboard
from app.utils.skills import normalize_skill, skill_key_from_session
from app.utils.authorization import assert_parent_owns_child
from fastapi import HTTPException

ALL_10_3D_GAMES = [
    ("learning-run", "phonicsWordCompletion", "word_recognition"),
    ("ancient-labyrinth", "phonicsDecodingIncantation", "word_recognition"),
    ("safari-photo", "auditoryPhonicsDiscrimination", "phonological_awareness"),
    ("voxel-crafter", "wordSpellingConstruction", "word_recognition"),
    ("cloud-bouncer", "sightWordRecognition", "word_recognition"),
    ("dino-fossil", "onsetRimeBlending", "phonological_awareness"),
    ("magic-bakery", "syllableStacking", "word_recognition"),
    ("coral-diver", "rhymeDiscrimination", "phonological_awareness"),
    ("cosmic-miner", "letterSequencing", "word_recognition"),
    ("sky-archer", "phonicsDiscrimination", "phonological_awareness"),
]

def test_all_game_skills_normalize_to_core_pillars():
    for game_id, skill, expected_pillar in ALL_10_3D_GAMES:
        normalized = normalize_skill(skill)
        assert normalized == expected_pillar, f"{skill} expected {expected_pillar} but got {normalized}"

    # Also test core camelCase mappings
    assert normalize_skill("readingFluency") == "reading_fluency"
    assert normalize_skill("pronunciation") == "pronunciation"
    assert normalize_skill("comprehension") == "comprehension"

def test_all_10_games_drive_evidence_and_progress(db_session):
    student = Student(name="Zara Space-Cadet", age=8)
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    # Play every single one of the 10 games
    for idx, (game_id, skill, pillar) in enumerate(ALL_10_3D_GAMES):
        session = create_session(
            db_session,
            student_id=student.id,
            activity_id=None,
            skill=skill,
            outcome={
                "type": "game",
                "accuracy": 88 + (idx % 10),
                "title": game_id.replace("-", " ").title(),
            },
            stars=3,
            xp=40,
        )
        assert session.id is not None

    # Check that ReadingFingerprint was updated
    fp = get_latest_fingerprint(db_session, student.id)
    assert fp is not None
    assert fp.word_recognition > 55.0
    assert fp.phonological_awareness > 55.0

    # Verify 7-day progress reports all 5 skills
    prog = get_progress(db_session, student.id, "7d")
    reported_skills = {s["key"]: s for s in prog["skills"]}
    for k in SKILL_KEYS:
        assert k in reported_skills, f"Missing skill key {k} in progress report"
        assert reported_skills[k]["value"] >= 55.0

    # Parent summary verification
    summary = get_child_summary(db_session, student.id)
    assert summary["activities_completed"] == 10
    assert summary["total_stars"] == 30
    assert summary["recent_comparison"] is not None

def test_teacher_dashboard_aggregates_class_with_game_evidence(db_session):
    teacher_user = User(name="Ms. Teacher", email="teacher_audit@school.org", password_hash="fake", role=UserRole.teacher)
    db_session.add(teacher_user)
    db_session.commit()
    teacher = Teacher(user_id=teacher_user.id)
    db_session.add(teacher)
    db_session.commit()
    cls = ClassModel(teacher_id=teacher.id, name="Class 2-B")
    db_session.add(cls)
    db_session.commit()

    s1 = Student(name="Learner One", age=7)
    s2 = Student(name="Learner Two", age=7)
    db_session.add_all([s1, s2])
    db_session.commit()
    cls.students.extend([s1, s2])
    db_session.commit()

    # Log game activity for s1
    create_session(db_session, s1.id, None, "wordSpellingConstruction", {"type": "game", "accuracy": 92}, 3, 40)
    create_session(db_session, s2.id, None, "rhymeDiscrimination", {"type": "game", "accuracy": 65}, 2, 25)

    dash = get_dashboard(db_session, cls.id)
    assert dash["total_students"] == 2
    assert dash["activities_completed"] == 2
    assert len(dash["recent_activity"]) == 2

def test_student_data_isolation_audit(db_session):
    u1 = User(name="Parent 1", email="parent1@home.org", password_hash="h1", role=UserRole.parent)
    u2 = User(name="Parent 2", email="parent2@home.org", password_hash="h2", role=UserRole.parent)
    db_session.add_all([u1, u2])
    db_session.commit()

    p1 = Parent(user_id=u1.id)
    p2 = Parent(user_id=u2.id)
    db_session.add_all([p1, p2])
    db_session.commit()

    child1 = Student(name="Child One", age=6)
    child2 = Student(name="Child Two", age=7)
    db_session.add_all([child1, child2])
    db_session.commit()

    p1.children.append(child1)
    p2.children.append(child2)
    db_session.commit()

    # Parent 1 can access child 1
    assert_parent_owns_child(db_session, u1, child1.id)
    # Parent 1 CANNOT access child 2
    with pytest.raises(HTTPException) as excinfo:
        assert_parent_owns_child(db_session, u1, child2.id)
    assert excinfo.value.status_code == 403

def test_detailed_game_to_report_summary(db_session, capsys):
    print("\n" + "=" * 70)
    print("LEXIGUIDE GAME-TO-REPORT LEARNING CYCLE EXECUTION TRACE")
    print("=" * 70)

    student = Student(name="Aria Explorer", age=8)
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    # Initial baseline fingerprint
    fp_init = ReadingFingerprint(
        student_id=student.id,
        phonological_awareness=50.0,
        pronunciation=50.0,
        reading_fluency=50.0,
        comprehension=50.0,
        word_recognition=50.0
    )
    db_session.add(fp_init)
    db_session.commit()
    print(f"Child Profile: {student.name} (Age {student.age}, ID={student.id})")
    print(f"Baseline Fingerprint -> Pronunciation: {fp_init.pronunciation}%, Word Rec: {fp_init.word_recognition}%\n")

    print("[GAME SESSIONS IN PROGRESS]")
    for game_id, skill, pillar in ALL_10_3D_GAMES:
        sess = create_session(
            db_session,
            student_id=student.id,
            activity_id=None,
            skill=skill,
            outcome={
                "type": "game",
                "accuracy": 92,
                "game_id": game_id,
            },
            stars=3,
            xp=50
        )
        print(f" -> Played '{game_id}' | Raw Skill: {skill} -> Mapped Pillar: [{pillar}] | Score: {sess.stars} stars")

    fp_after = get_latest_fingerprint(db_session, student.id)
    print("\n[UPDATED READING FINGERPRINT (5 PILLARS)]")
    print(f" * Pronunciation:           {fp_after.pronunciation:.1f}%")
    print(f" * Word Recognition:        {fp_after.word_recognition:.1f}%")
    print(f" * Phonological Awareness:  {fp_after.phonological_awareness:.1f}%")
    print(f" * Reading Fluency:         {fp_after.reading_fluency:.1f}%")
    print(f" * Comprehension:           {fp_after.comprehension:.1f}%")

    progress = get_progress(db_session, student.id, "7d")
    print("\n[PROGRESS REPORT (7-DAY TREND)]")
    for s in progress["skills"]:
        print(f" * {s['label']} ({s['key']}): Current={s['value']}% | Trend={s['trend']}")

    summary = get_child_summary(db_session, student.id)
    print(f"\n[PARENT DASHBOARD SUMMARY]")
    print(f" * Total Activities Completed: {summary['activities_completed']}")
    print(f" * Total Stars Earned:         {summary['total_stars']}")
    print(f" * Streak:                     {summary['streak']} days")
    print("=" * 70 + "\n")
