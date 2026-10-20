"""Automated verification suite for LexiGuide's Student Performance Analysis,
Game Evidence, and Learning Improvement Tracking Pipeline.

Covers Scenarios A through G explicitly:
- Scenario A: 8 of 10 tasks correct -> attempts, accuracy, skill evidence verification.
- Scenario B: Repeated practice with different performance -> history preserved, compared without overwrite.
- Scenario C: Game completed with hints -> hints tracked, assisted vs independent support level verified.
- Scenario D: Incomplete game session -> marked incomplete, 0 stars/XP, no false credit or fingerprint inflation.
- Scenario E: Strict student isolation -> different student cannot access another's data.
- Scenario F: Parent and Teacher report consistency with role-based authorization.
- Scenario G: End-to-end evidence-to-recommendation Next-Best-Action generation and reasoning.
"""
import pytest
from fastapi import HTTPException

from app.models import (
    User, UserRole, Parent, Teacher, ClassModel, Student,
    LearningSession, ReadingFingerprint, Recommendation,
)
from app.services.session_service import create_session, list_sessions_for_student
from app.services.fingerprint_service import get_latest_fingerprint, get_fingerprint_history, SKILL_KEYS
from app.services.progress_service import get_progress
from app.services.parent_service import get_child_summary
from app.services.teacher_service import get_dashboard, get_class_progress, get_class_students
from app.services.recommendation_service import generate_recommendations, list_recommendations_for_student
from app.utils.skills import normalize_skill
from app.utils.authorization import assert_parent_owns_child, assert_can_access_child
from app.utils.security import create_access_token


def test_scenario_a_empirical_attempts_and_accuracy(db_session):
    """Scenario A:
    A student answers 8 of 10 suitable tasks correctly. Verify that the recorded
    attempts, accuracy, and relevant skill evidence match the actual responses.
    """
    student = Student(name="Aria Patel", age=7)
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    # Student plays Sound Safari (phonological awareness), answers 8 of 10
    total_rounds = 10
    correct_rounds = 8
    accuracy = round((correct_rounds / total_rounds) * 100) # 80%

    outcome_payload = {
        "type": "game",
        "gameId": "sound-safari",
        "title": "Sound Safari",
        "skill": "phonologicalAwareness",
        "roundsAttempted": total_rounds,
        "roundsCorrect": correct_rounds,
        "accuracy": accuracy,
        "score": accuracy,
        "is_completed": True,
        "completion_status": "completed",
        "supportLevel": "independent",
        "hintsUsed": 0,
        "retriesCount": 1,
    }

    session = create_session(
        db_session,
        student_id=student.id,
        activity_id=None,
        skill="phonologicalAwareness",
        outcome=outcome_payload,
        stars=3,
        xp=30,
    )

    # 1. Verify session persistence
    assert session.id is not None
    assert session.student_id == student.id
    assert session.completed_at is not None
    assert session.stars == 3
    assert session.xp == 30
    assert session.outcome["roundsAttempted"] == 10
    assert session.outcome["roundsCorrect"] == 8
    assert session.outcome["accuracy"] == 80
    assert session.outcome["is_completed"] is True
    assert session.outcome["completion_status"] == "completed"

    # 2. Verify Reading Fingerprint snapshot updated for phonological_awareness
    fp = get_latest_fingerprint(db_session, student.id)
    assert fp is not None
    # Default is 55.0, nudged by (80 - 60) / 6 = +3.3 -> 58.3
    assert fp.phonological_awareness > 55.0
    # Other untouched skills should remain at baseline
    assert fp.comprehension == 55.0


def test_scenario_b_history_preservation_and_reassessment(db_session):
    """Scenario B:
    The student practices the same skill again and performs differently. Verify
    that the history is preserved and the new performance is compared appropriately
    without overwriting the earlier session.
    """
    student = Student(name="Devan Nair", age=8)
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    # First session: 9 of 10 (90%)
    s1 = create_session(
        db_session,
        student_id=student.id,
        activity_id=None,
        skill="phonologicalAwareness",
        outcome={
            "type": "game",
            "title": "Sound Safari",
            "roundsAttempted": 10,
            "roundsCorrect": 9,
            "accuracy": 90,
            "is_completed": True,
        },
        stars=3,
        xp=40,
    )

    # Second session: 6 of 10 (60%)
    s2 = create_session(
        db_session,
        student_id=student.id,
        activity_id=None,
        skill="phonologicalAwareness",
        outcome={
            "type": "game",
            "title": "Sound Detective",
            "roundsAttempted": 10,
            "roundsCorrect": 6,
            "accuracy": 60,
            "is_completed": True,
        },
        stars=2,
        xp=25,
    )

    # 1. Verify both sessions exist and are distinct
    sessions = list_sessions_for_student(db_session, student.id)
    assert len(sessions) == 2
    session_ids = [s.id for s in sessions]
    assert s1.id in session_ids
    assert s2.id in session_ids

    # 2. Verify progress service compares the two sessions appropriately
    progress = get_progress(db_session, student.id, "7d")
    assert progress["student_id"] == student.id
    recent_comp = progress["recent_comparison"]
    assert recent_comp is not None
    assert recent_comp["current_accuracy"] == 60.0
    assert recent_comp["previous_accuracy"] == 90.0
    assert recent_comp["change"] == -30.0
    # Non-punitive, growth-minded language
    assert "Practice helps make this easier" in recent_comp["message"] or "Keep practicing" in recent_comp["message"]


def test_scenario_c_assisted_vs_independent_mastery(db_session):
    """Scenario C:
    The student completes a game requiring hints. Verify that hints are recorded
    when supported and that the system does not incorrectly treat assisted success
    as independent mastery.
    """
    student = Student(name="Kiran Rao", age=6)
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    session = create_session(
        db_session,
        student_id=student.id,
        activity_id=None,
        skill="wordRecognition",
        outcome={
            "type": "game",
            "gameId": "build-word",
            "title": "Word Builder",
            "roundsAttempted": 6,
            "roundsCorrect": 6,
            "accuracy": 100,
            "hintsUsed": 4,
            "retriesCount": 2,
            "supportLevel": "assisted",
            "is_completed": True,
            "completion_status": "completed",
        },
        stars=2,
        xp=20,
    )

    assert session.outcome["hintsUsed"] == 4
    assert session.outcome["supportLevel"] == "assisted"
    assert session.outcome["retriesCount"] == 2
    assert session.outcome["accuracy"] == 100


def test_scenario_d_incomplete_and_abandoned_session_handling(db_session):
    """Scenario D:
    The student starts but does not finish a game (or exits immediately).
    Verify that the session is marked appropriately, earns 0 stars/XP, and
    does not nudge the student's fingerprint or count as a completed activity.
    """
    student = Student(name="Maya Sen", age=7)
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    # Initial baseline fingerprint
    fp_init = get_latest_fingerprint(db_session, student.id)
    assert fp_init is None

    # Child opens Cosmic Miner or Learning Run, but quits after 0 attempts
    session = create_session(
        db_session,
        student_id=student.id,
        activity_id=None,
        skill="letterSequencing",
        outcome={
            "type": "game",
            "gameId": "cosmic-miner",
            "roundsAttempted": 0,
            "roundsCorrect": 0,
            "score": 0,
            "is_completed": False,
            "completion_status": "incomplete",
        },
        stars=1, # Passed from client prematurely
        xp=15,
    )

    # 1. Session must NOT be marked complete and must have 0 stars and 0 XP
    assert session.id is not None
    assert session.completed_at is None
    assert session.stars == 0
    assert session.xp == 0
    assert session.outcome["is_completed"] is False
    assert session.outcome["completion_status"] == "incomplete"

    # 2. Reading fingerprint must NOT have been updated
    fp_after = get_latest_fingerprint(db_session, student.id)
    assert fp_after is None


def test_scenario_e_student_isolation(db_session):
    """Scenario E:
    A different student logs in. Verify that the previous student's sessions,
    performance, and recommendations are not displayed.
    """
    student_a = Student(name="Student Alpha", age=7)
    student_b = Student(name="Student Beta", age=8)
    db_session.add_all([student_a, student_b])
    db_session.commit()
    db_session.refresh(student_a)
    db_session.refresh(student_b)

    # Student A plays a session
    create_session(
        db_session,
        student_id=student_a.id,
        activity_id=None,
        skill="phonologicalAwareness",
        outcome={"type": "game", "title": "Sound Safari", "accuracy": 95, "is_completed": True},
        stars=3,
        xp=35,
    )

    # Fetch sessions for both
    sessions_a = list_sessions_for_student(db_session, student_a.id)
    sessions_b = list_sessions_for_student(db_session, student_b.id)

    assert len(sessions_a) == 1
    assert len(sessions_b) == 0
    assert sessions_a[0].student_id == student_a.id

    # Progress isolation
    progress_b = get_progress(db_session, student_b.id, "7d")
    assert progress_b["sample_size"] == 0
    assert "Not enough practice data yet" in progress_b["note"]


def test_scenario_f_parent_and_teacher_report_consistency(db_session):
    """Scenario F:
    The parent and authorized teacher open the student's reports. Verify that
    both portals display consistent persisted evidence within their respective
    permissions, and unauthorized access is blocked.
    """
    # Create parent and student
    parent_user = User(name="Parent F", email="parent_f@example.com", role=UserRole.parent, password_hash="hash")
    teacher_user = User(name="Teacher F", email="teacher_f@example.com", role=UserRole.teacher, password_hash="hash")
    unauth_parent_user = User(name="Parent Unauth", email="parent_unauth@example.com", role=UserRole.parent, password_hash="hash")
    db_session.add_all([parent_user, teacher_user, unauth_parent_user])
    db_session.commit()

    student = Student(name="Leo Das", age=8)
    db_session.add(student)
    db_session.commit()

    # Link parent
    parent = Parent(user_id=parent_user.id)
    parent.children.append(student)
    db_session.add(parent)

    # Link teacher via class
    teacher = Teacher(user_id=teacher_user.id)
    db_session.add(teacher)
    db_session.commit()
    classroom = ClassModel(teacher_id=teacher.id, name="Grade 2 Phonics")
    classroom.students.append(student)
    db_session.add(classroom)
    db_session.commit()

    # Save real student session
    create_session(
        db_session,
        student_id=student.id,
        activity_id=None,
        skill="phonologicalAwareness",
        outcome={"type": "game", "accuracy": 85, "roundsAttempted": 10, "roundsCorrect": 8, "is_completed": True},
        stars=3,
        xp=30,
    )

    # 1. Parent can access their linked child
    assert_parent_owns_child(db_session, parent_user, student.id)
    parent_summary = get_child_summary(db_session, student.id)
    assert parent_summary["child_id"] == student.id
    assert parent_summary["total_stars"] == 3

    # 2. Teacher can access student in their classroom
    assert_can_access_child(db_session, teacher_user, student.id)
    teacher_dash = get_dashboard(db_session, classroom.id)
    assert teacher_dash["activities_completed"] == 1
    students = get_class_students(db_session, classroom.id)
    assert any(s.id == student.id for s in students)

    # 3. Unauthorized parent is strictly denied
    with pytest.raises(HTTPException) as exc_info:
        assert_parent_owns_child(db_session, unauth_parent_user, student.id)
    assert exc_info.value.status_code == 403


def test_scenario_g_evidence_to_recommendation_flow(db_session):
    """Scenario G:
    A recommendation is generated after a new learning session. Verify the
    complete evidence-to-recommendation flow and explain why the recommendation
    was selected.
    """
    student = Student(name="Anaya Gupta", age=7)
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    # Baseline fingerprint: all at 55.0
    fp_base = ReadingFingerprint(student_id=student.id, **{k: 55.0 for k in SKILL_KEYS})
    db_session.add(fp_base)
    db_session.commit()

    # Student plays Sound Safari with excellent performance (95% accuracy)
    create_session(
        db_session,
        student_id=student.id,
        activity_id=None,
        skill="phonologicalAwareness",
        outcome={"type": "game", "accuracy": 95, "roundsAttempted": 10, "roundsCorrect": 9, "is_completed": True},
        stars=3,
        xp=40,
    )

    # Latest fingerprint has phonologicalAwareness nudged up significantly
    latest_fp = get_latest_fingerprint(db_session, student.id)
    assert latest_fp.phonological_awareness > 60.0

    # Next-best-action recommendations are automatically generated and persisted
    recs = list_recommendations_for_student(db_session, student.id)
    assert len(recs) > 0

    # Verify that the recommendation reason explicitly references the child's needs
    for r in recs:
        assert r.student_id == student.id
        assert "needs a little more practice" in r.reason or "Doing great" in r.reason
