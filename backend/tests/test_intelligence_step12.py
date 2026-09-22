from datetime import datetime, timezone
import pytest

from app.models import (
    User, UserRole, LearningSession, ReadingSessionDetail,
    ReadingObservation, ObservationType,
)
from app.services.intelligence_service import LearningIntelligenceEngine
from app.utils.language import contains_forbidden_language, FORBIDDEN_PHRASES
from app.utils.security import hash_password, create_access_token
from tests.factories import make_student, make_parent, make_teacher_with_class


def _auth_headers(user):
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


def _make_reading_session(
    db, student_id, words_attempted=20, words_correct=18,
    omissions=1, substitutions=1, repetitions=0, hesitations=0,
    duration=30, accuracy=90.0,
):
    session = LearningSession(
        student_id=student_id,
        skill="readingFluency",
        outcome={"type": "reading", "accuracy": accuracy},
        stars=3,
        xp=20,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    detail = ReadingSessionDetail(
        session_id=session.id,
        expected_text="The quick brown fox jumps over the lazy dog",
        recognized_text="The quick brown fox leaps over the lazy dog",
        duration_seconds=duration,
        words_attempted=words_attempted,
        words_correct=words_correct,
        omissions=omissions,
        substitutions=substitutions,
        repetitions=repetitions,
        hesitations=hesitations,
    )
    db.add(detail)
    db.commit()
    db.refresh(detail)
    return session, detail


def test_empty_reading_history_intelligence(db_session):
    student = make_student(db_session)
    engine = LearningIntelligenceEngine(db_session, student.id)
    res = engine.generate_full_intelligence()

    assert res["student_id"] == student.id
    assert res["data_sufficiency"] == "insufficient_data"
    assert res["total_reading_sessions"] == 0
    assert res["error_distribution"]["total_errors"] == 0
    assert res["fluency"]["average_wcpm"] == 0.0
    assert res["top_confusions"] == []
    assert "observed_strengths" in res["guidance"]


def test_error_distribution_and_wcpm_computation(db_session):
    student = make_student(db_session)
    # Session 1: 15 correct / 30s = 30 WCPM, 2 omissions, 1 substitution
    _make_reading_session(
        db_session, student.id,
        words_attempted=20, words_correct=15, duration=30,
        omissions=2, substitutions=1, repetitions=0, hesitations=1,
    )
    # Session 2: 24 correct / 24s = 60 WCPM, 0 omissions, 2 substitutions, 1 repetition
    _make_reading_session(
        db_session, student.id,
        words_attempted=25, words_correct=24, duration=24,
        omissions=0, substitutions=2, repetitions=1, hesitations=0,
    )

    engine = LearningIntelligenceEngine(db_session, student.id)
    res = engine.generate_full_intelligence()

    assert res["total_reading_sessions"] == 2
    assert res["data_sufficiency"] == "developing_data"

    errs = res["error_distribution"]
    assert errs["omissions"] == 2
    assert errs["substitutions"] == 3
    assert errs["repetitions"] == 1
    assert errs["hesitations"] == 1
    assert errs["total_errors"] == 7
    assert errs["primary_error_type"] == "substitution"

    fluency = res["fluency"]
    # (30.0 + 60.0) / 2 = 45.0 WCPM
    assert fluency["average_wcpm"] == 45.0
    assert fluency["highest_wcpm"] == 60.0
    assert len(fluency["timeline"]) == 2


def test_confusion_clustering(db_session):
    student = make_student(db_session)
    s1, _ = _make_reading_session(db_session, student.id)
    
    # Add substitution observations
    obs1 = ReadingObservation(
        session_id=s1.id,
        observation_type=ObservationType.substitution,
        value="cat -> bat",
    )
    obs2 = ReadingObservation(
        session_id=s1.id,
        observation_type=ObservationType.substitution,
        value="cat -> bat",
    )
    obs3 = ReadingObservation(
        session_id=s1.id,
        observation_type=ObservationType.substitution,
        value="ship -> chip",
    )
    db_session.add_all([obs1, obs2, obs3])
    db_session.commit()

    engine = LearningIntelligenceEngine(db_session, student.id)
    confusions = engine.get_top_confusions(limit=5)

    assert len(confusions) == 2
    top = confusions[0]
    assert top["expected"] == "cat"
    assert top["recognized"] == "bat"
    assert top["count"] == 2
    assert "Initial sound contrast" in top["focus_pattern"]

    second = confusions[1]
    assert second["expected"] == "ship"
    assert second["recognized"] == "chip"
    assert second["count"] == 1


def test_zero_clinical_language_guardrails(db_session):
    student = make_student(db_session)
    _make_reading_session(db_session, student.id, omissions=5, substitutions=5)

    engine = LearningIntelligenceEngine(db_session, student.id)
    res = engine.generate_full_intelligence()

    # Verify that no forbidden clinical diagnosis language is present anywhere in output
    text_corpus = (
        res["disclaimer"] + " " +
        res["guidance"]["summary"] + " " +
        " ".join(res["guidance"]["observed_strengths"]) + " " +
        " ".join(res["guidance"]["recommended_focus_areas"]) + " " +
        " ".join(res["guidance"]["educator_tips"])
    )
    assert not contains_forbidden_language(text_corpus)
    for forbidden in FORBIDDEN_PHRASES:
        assert forbidden not in text_corpus.lower()


def test_intelligence_endpoints_and_authorization(client, db_session):
    parent = make_parent(db_session, email="parent1_intel@test.demo")
    student = make_student(db_session)
    parent.children.append(student)
    db_session.commit()

    other_parent = make_parent(db_session, email="parent2_intel@test.demo")

    _make_reading_session(db_session, student.id, words_correct=10, duration=15)

    auth_headers = _auth_headers(parent.user)
    unauthorized_headers = _auth_headers(other_parent.user)

    # 1. Unauthenticated -> 401
    assert client.get(f"/api/intelligence/{student.id}").status_code == 401

    # 2. Unauthorized parent -> 403
    assert client.get(f"/api/intelligence/{student.id}", headers=unauthorized_headers).status_code == 403

    # 3. Authorized parent -> 200
    r = client.get(f"/api/intelligence/{student.id}", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["student_id"] == student.id
    assert "error_distribution" in body
    assert "fluency" in body
    assert "guidance" in body

    # 4. Fluency endpoint
    r_fluency = client.get(f"/api/intelligence/{student.id}/fluency", headers=auth_headers)
    assert r_fluency.status_code == 200
    assert r_fluency.json()["average_wcpm"] == 40.0

    # 5. Confusions endpoint
    r_confusions = client.get(f"/api/intelligence/{student.id}/confusions", headers=auth_headers)
    assert r_confusions.status_code == 200
    assert isinstance(r_confusions.json(), list)
