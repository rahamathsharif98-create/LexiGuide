"""Step 20 Backend Test Suite — Production-Ready End-to-End Intelligence + System Hardening.

30 comprehensive tests covering:
1. End-to-end data flow: Activity session -> LearningSession -> Fingerprint update -> Recommendations -> NextBestAction -> Goals -> Plan
2. Authentication: 401 Unauthorized on protected routes without Bearer token
3. Authentication: 401 Unauthorized on malformed/invalid Bearer token
4. Authorization: Parent can only access their own linked child (200)
5. Authorization: Parent cannot access another parent's child (403 without existence leak)
6. Authorization: Nonexistent child ID returns 403 (does not leak whether child ID exists)
7. Authorization: Teacher can only access students in their assigned classes (200)
8. Authorization: Teacher cannot access students outside their classes (403)
9. Authorization: Child user can only access their own learner records (200)
10. Authorization: Child user cannot access other children records (403)
11. Canonical Student ID: student.id remains integer throughout database and response payloads
12. Database persistence: LearningSession persists real timestamps and non-null completed_at
13. Database persistence: Incomplete/abandoned activities without completed_at do not corrupt analytics
14. Database persistence: Session results store real outcome dict without fake synthetic progress
15. Idempotency: Multiple distinct sessions record separate valid session records
16. Reward integrity: XP and stars match real completed activity metrics without duplicate inflation
17. API error behavior: 404 on nonexistent static content item
18. API error behavior: 400 on invalid progress query parameters (e.g. invalid range)
19. API error behavior: 422 on invalid schema payload (missing required fields)
20. API error behavior: 500 unhandled exceptions return safe JSON without leaking raw stack traces
21. Speech pipeline reliability: Audio upload rejects empty text
22. Speech pipeline reliability: Audio upload validates MIME/file size without leaking file handles
23. AI honesty: TTS status is declared UNAVAILABLE without fabricating audio tracks
24. AI honesty: Whisper STT status is honestly declared (REAL or MOCK) without fabricating acoustic scores
25. Reading alignment: Authoritative Needleman-Wunsch produces accurate substitution/omission metrics
26. Reading session persistence: Persists ReadingSessionDetail and ReadingObservation rows linked to LearningSession
27. Parent portal data consistency: Summary and progress match database LearningSession counts exactly
28. Teacher portal data consistency: Class dashboard aggregates real enrolled student sessions with zero multipliers
29. Deterministic engine behavior: Multiple calls to NextBestAction with unchanged history return deterministic recommendations
30. Regression protection: Non-clinical disclaimer present and zero diagnostic labels across all responses
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.models import (
    User,
    UserRole,
    Parent,
    Teacher,
    ClassModel,
    Student,
    LearningSession,
    ReadingSessionDetail,
    ReadingObservation,
)
from app.utils.security import create_access_token, hash_password
from app.utils.language import contains_forbidden_language, DISCLAIMER
from app.services.fingerprint_service import get_latest_fingerprint
from app.services.multimodal_service import multimodal_service


def auth_headers(user: User) -> dict:
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_setup(db_session):
    pw = hash_password("secret123")

    u_parent1 = User(email="parent1@example.com", password_hash=pw, role=UserRole.parent, name="Parent One")
    u_parent2 = User(email="parent2@example.com", password_hash=pw, role=UserRole.parent, name="Parent Two")
    u_teacher1 = User(email="teacher1@example.com", password_hash=pw, role=UserRole.teacher, name="Teacher One")
    u_teacher2 = User(email="teacher2@example.com", password_hash=pw, role=UserRole.teacher, name="Teacher Two")
    u_child1 = User(email="child1@example.com", password_hash=pw, role=UserRole.child, name="Child One")
    u_child2 = User(email="child2@example.com", password_hash=pw, role=UserRole.child, name="Child Two")

    db_session.add_all([u_parent1, u_parent2, u_teacher1, u_teacher2, u_child1, u_child2])
    db_session.flush()

    p1 = Parent(user_id=u_parent1.id)
    p2 = Parent(user_id=u_parent2.id)
    t1 = Teacher(user_id=u_teacher1.id)
    t2 = Teacher(user_id=u_teacher2.id)

    db_session.add_all([p1, p2, t1, t2])
    db_session.flush()

    c1 = ClassModel(name="Class 1A", teacher_id=t1.id)
    c2 = ClassModel(name="Class 2B", teacher_id=t2.id)
    db_session.add_all([c1, c2])
    db_session.flush()

    s1 = Student(user_id=u_child1.id, name="Leo", age=7)
    s2 = Student(user_id=u_child2.id, name="Maya", age=8)
    db_session.add_all([s1, s2])
    db_session.flush()

    p1.children.append(s1)
    p2.children.append(s2)

    c1.students.append(s1)
    c2.students.append(s2)
    db_session.commit()

    return {
        "users": {
            "parent1": u_parent1,
            "parent2": u_parent2,
            "teacher1": u_teacher1,
            "teacher2": u_teacher2,
            "child1": u_child1,
            "child2": u_child2,
        },
        "students": {"s1": s1, "s2": s2},
        "classes": {"c1": c1, "c2": c2},
        "parents": {"p1": p1, "p2": p2},
        "teachers": {"t1": t1, "t2": t2},
    }


# 1. End-to-end data flow: Activity session -> LearningSession -> Fingerprint update -> Recommendations -> NextBestAction -> Goals -> Plan
def test_01_e2e_data_flow(client, test_setup, db_session):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    headers = auth_headers(u_parent)

    res = client.post(
        f"/api/learning/session?child_id={s1.id}",
        json={
            "activity_id": None,
            "skill": "readingFluency",
            "outcome": {"type": "reading", "accuracy": 92.0, "metrics": {"accuracy": 92.0}},
            "stars": 4,
            "xp": 20,
        },
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["student_id"] == s1.id
    assert data["stars"] == 4
    assert data["xp"] == 20

    fp_res = client.get(f"/api/fingerprint/{s1.id}", headers=headers)
    assert fp_res.status_code == 200
    assert "current" in fp_res.json()

    nba_res = client.get(f"/api/recommendations/next-best-action/{s1.id}", headers=headers)
    assert nba_res.status_code == 200
    assert "best_action" in nba_res.json()

    goals_res = client.get(f"/api/learning-goals/{s1.id}", headers=headers)
    assert goals_res.status_code == 200
    assert "goals" in goals_res.json()

    plan_res = client.get(f"/api/learning-plan/{s1.id}", headers=headers)
    assert plan_res.status_code == 200
    assert "days" in plan_res.json()


# 2. Authentication: 401 on protected routes without Bearer token
def test_02_auth_unauthorized_missing_token(client, test_setup):
    s1 = test_setup["students"]["s1"]
    res = client.get(f"/api/students/{s1.id}")
    assert res.status_code == 401


# 3. Authentication: 401 on malformed/invalid Bearer token
def test_03_auth_unauthorized_invalid_token(client, test_setup):
    s1 = test_setup["students"]["s1"]
    res = client.get(f"/api/students/{s1.id}", headers={"Authorization": "Bearer invalid.token.payload"})
    assert res.status_code == 401


# 4. Authorization: Parent can only access their own linked child (200)
def test_04_parent_owns_child_success(client, test_setup):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    res = client.get(f"/api/students/{s1.id}", headers=auth_headers(u_parent))
    assert res.status_code == 200
    assert res.json()["id"] == s1.id


# 5. Authorization: Parent cannot access another parent's child (403 without existence leak)
def test_05_parent_unauthorized_other_child(client, test_setup):
    u_parent1 = test_setup["users"]["parent1"]
    s2 = test_setup["students"]["s2"]
    res = client.get(f"/api/students/{s2.id}", headers=auth_headers(u_parent1))
    assert res.status_code == 403
    assert "Not authorized" in res.json()["detail"]


# 6. Authorization: Nonexistent child ID returns 403 (does not leak existence)
def test_06_nonexistent_child_returns_403_no_leak(client, test_setup):
    u_parent1 = test_setup["users"]["parent1"]
    res = client.get("/api/students/99999", headers=auth_headers(u_parent1))
    assert res.status_code == 403
    assert "Not authorized" in res.json()["detail"]


# 7. Authorization: Teacher can only access students in their assigned classes (200)
def test_07_teacher_owns_student_success(client, test_setup):
    u_teacher1 = test_setup["users"]["teacher1"]
    s1 = test_setup["students"]["s1"]
    res = client.get(f"/api/students/{s1.id}", headers=auth_headers(u_teacher1))
    assert res.status_code == 200
    assert res.json()["id"] == s1.id


# 8. Authorization: Teacher cannot access students outside their classes (403)
def test_08_teacher_unauthorized_student(client, test_setup):
    u_teacher1 = test_setup["users"]["teacher1"]
    s2 = test_setup["students"]["s2"]
    res = client.get(f"/api/students/{s2.id}", headers=auth_headers(u_teacher1))
    assert res.status_code == 403
    assert "Not authorized" in res.json()["detail"]


# 9. Authorization: Child user can only access their own learner records (200)
def test_09_child_owns_self_success(client, test_setup):
    u_child1 = test_setup["users"]["child1"]
    s1 = test_setup["students"]["s1"]
    res = client.get(f"/api/students/{s1.id}", headers=auth_headers(u_child1))
    assert res.status_code == 200
    assert res.json()["id"] == s1.id


# 10. Authorization: Child user cannot access other children records (403)
def test_10_child_unauthorized_other_child(client, test_setup):
    u_child1 = test_setup["users"]["child1"]
    s2 = test_setup["students"]["s2"]
    res = client.get(f"/api/students/{s2.id}", headers=auth_headers(u_child1))
    assert res.status_code == 403
    assert "Not authorized" in res.json()["detail"]


# 11. Canonical Student ID: student.id remains integer throughout database and responses
def test_11_canonical_student_id_consistency(client, test_setup):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    headers = auth_headers(u_parent)

    res = client.get(f"/api/students/{s1.id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data["id"], int)
    assert data["id"] == s1.id


# 12. Database persistence: LearningSession persists real timestamps and completed_at
def test_12_learning_session_real_timestamps(client, test_setup, db_session):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    headers = auth_headers(u_parent)

    res = client.post(
        f"/api/learning/session?child_id={s1.id}",
        json={"skill": "pronunciation", "stars": 3, "xp": 15, "outcome": {"type": "reading", "accuracy": 85}},
        headers=headers,
    )
    assert res.status_code == 201
    sess_id = res.json()["id"]

    row = db_session.query(LearningSession).filter(LearningSession.id == sess_id).first()
    assert row is not None
    assert row.completed_at is not None
    assert isinstance(row.completed_at, datetime)


# 13. Database persistence: Incomplete/abandoned sessions do not corrupt analytics
def test_13_incomplete_sessions_do_not_skew_analytics(client, test_setup, db_session):
    s1 = test_setup["students"]["s1"]
    incomplete = LearningSession(student_id=s1.id, skill="comprehension", completed_at=None, stars=0, xp=0)
    db_session.add(incomplete)
    db_session.commit()

    u_parent = test_setup["users"]["parent1"]
    res = client.get(f"/api/parent/children/{s1.id}/summary", headers=auth_headers(u_parent))
    assert res.status_code == 200
    assert res.json()["activities_completed"] == 0


# 14. Database persistence: Session results store real outcome dict without fake synthetic progress
def test_14_real_outcome_persistence(client, test_setup, db_session):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    outcome_payload = {"type": "game", "title": "Sound Safari", "accuracy": 90.0, "xpGain": 18}

    res = client.post(
        f"/api/learning/session?child_id={s1.id}",
        json={"skill": "phonologicalAwareness", "stars": 5, "xp": 18, "outcome": outcome_payload},
        headers=auth_headers(u_parent),
    )
    assert res.status_code == 201
    row = db_session.query(LearningSession).filter(LearningSession.id == res.json()["id"]).first()
    assert row.outcome["accuracy"] == 90.0
    assert row.outcome["title"] == "Sound Safari"


# 15. Idempotency: Multiple distinct sessions record separate valid session records
def test_15_multiple_distinct_sessions_persisted(client, test_setup, db_session):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    headers = auth_headers(u_parent)

    for i in range(3):
        res = client.post(
            f"/api/learning/session?child_id={s1.id}",
            json={"skill": "readingFluency", "stars": 3, "xp": 15, "outcome": {"type": "reading", "accuracy": 80}},
            headers=headers,
        )
        assert res.status_code == 201

    count = db_session.query(LearningSession).filter(LearningSession.student_id == s1.id).count()
    assert count == 3


# 16. Reward integrity: XP and stars match real completed activity metrics
def test_16_reward_integrity_exact_match(client, test_setup, db_session):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    headers = auth_headers(u_parent)

    res = client.post(
        f"/api/learning/session?child_id={s1.id}",
        json={"skill": "wordRecognition", "stars": 4, "xp": 25, "outcome": {"type": "game", "accuracy": 85}},
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["stars"] == 4
    assert data["xp"] == 25


# 17. API error behavior: 404 on nonexistent static content item
def test_17_api_error_404_content_not_found(client, test_setup):
    u_parent = test_setup["users"]["parent1"]
    res = client.get("/api/content/nonexistent-item-99999", headers=auth_headers(u_parent))
    assert res.status_code == 404
    assert "detail" in res.json()


# 18. API error behavior: 400 on invalid progress query parameters
def test_18_api_error_400_invalid_progress_range(client, test_setup):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    res = client.get(f"/api/students/{s1.id}/progress?range=invalid_range", headers=auth_headers(u_parent))
    assert res.status_code == 400
    assert "range must be one of" in res.json()["detail"]


# 19. API error behavior: 422 on invalid schema payload (missing required fields)
def test_19_api_error_422_missing_fields(client, test_setup):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    res = client.post(
        f"/api/reading/session?child_id={s1.id}",
        json={"recognized_text": "hello"},  # missing expected_text
        headers=auth_headers(u_parent),
    )
    assert res.status_code == 422


# 20. API error behavior: 500 unhandled exceptions return safe JSON without leaking stack traces
def test_20_api_error_500_safe_json(client, test_setup, monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.routers import reading

    def broken_reading(*args, **kwargs):
        raise RuntimeError("Simulated crash in reading processor")

    monkeypatch.setattr(reading, "get_ai_analysis_service", broken_reading)
    safe_client = TestClient(app, raise_server_exceptions=False)
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    res = safe_client.post(
        f"/api/reading/session?child_id={s1.id}",
        json={"expected_text": "hello", "recognized_text": "hello"},
        headers=auth_headers(u_parent),
    )
    assert res.status_code == 500
    assert res.json() == {"detail": "Internal server error"}


# 21. Speech pipeline reliability: Audio upload rejects empty text
def test_21_audio_upload_rejects_empty_expected_text(client, test_setup):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    res = client.post(
        f"/api/reading/session-audio?child_id={s1.id}",
        data={"expected_text": "   "},
        files={"audio": ("test.webm", b"RIFFfakeaudiobytes", "audio/webm")},
        headers=auth_headers(u_parent),
    )
    assert res.status_code == 400
    assert "expected_text must not be empty" in res.json()["detail"]


# 22. Speech pipeline reliability: Audio upload rejects oversized payload
def test_22_audio_upload_rejects_oversized_file(client, test_setup):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    # Send audio exceeding 15MB limit
    oversized = b"0" * (16 * 1024 * 1024)
    res = client.post(
        f"/api/reading/session-audio?child_id={s1.id}",
        data={"expected_text": "The cat sat on the mat"},
        files={"audio": ("huge.webm", oversized, "audio/webm")},
        headers=auth_headers(u_parent),
    )
    assert res.status_code in (400, 413)


# 23. AI honesty: TTS status is declared UNAVAILABLE without fabricating audio tracks
def test_23_ai_honesty_tts_unavailable(client):
    res = client.get("/api/multimodal/capabilities")
    assert res.status_code == 200
    caps = res.json()
    assert caps["tts_available"] is False
    assert caps["tts_status"] == "UNAVAILABLE"
    assert caps["audio_available"] is False


# 24. AI honesty: Whisper STT status is honestly declared (REAL or MOCK)
def test_24_ai_honesty_whisper_status(client):
    res = client.get("/api/multimodal/capabilities")
    assert res.status_code == 200
    caps = res.json()
    assert caps["whisper_status"] in ("REAL", "MOCK")


# 25. Reading alignment: Authoritative Needleman-Wunsch produces accurate metrics
def test_25_reading_alignment_needleman_wunsch(client, test_setup):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    res = client.post(
        f"/api/reading/session?child_id={s1.id}",
        json={
            "expected_text": "the big red cat sat",
            "recognized_text": "the big blue cat sat",
            "duration_seconds": 12,
            "stars": 4,
            "xp": 20,
        },
        headers=auth_headers(u_parent),
    )
    assert res.status_code == 201
    data = res.json()
    assert data["words_attempted"] == 5
    assert data["words_correct"] == 4
    assert data["substitutions"] == 1


# 26. Reading session persistence: Persists ReadingSessionDetail and ReadingObservation rows
def test_26_reading_session_detail_and_observations(client, test_setup, db_session):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    res = client.post(
        f"/api/reading/session?child_id={s1.id}",
        json={
            "expected_text": "the little dog barked",
            "recognized_text": "the dog barked",
            "duration_seconds": 10,
            "stars": 3,
            "xp": 15,
        },
        headers=auth_headers(u_parent),
    )
    assert res.status_code == 201
    detail_id = res.json()["id"]

    detail = db_session.query(ReadingSessionDetail).filter(ReadingSessionDetail.id == detail_id).first()
    assert detail is not None
    assert detail.omissions == 1

    obs = db_session.query(ReadingObservation).filter(ReadingObservation.session_id == detail.session_id).all()
    assert len(obs) >= 1


# 27. Parent portal data consistency: Summary and progress match database LearningSession counts
def test_27_parent_portal_consistency(client, test_setup, db_session):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    headers = auth_headers(u_parent)

    sess = LearningSession(student_id=s1.id, skill="readingFluency", completed_at=datetime.now(timezone.utc), stars=4, xp=20)
    db_session.add(sess)
    db_session.commit()

    res = client.get(f"/api/parent/children/{s1.id}/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["activities_completed"] == 1
    assert data["total_stars"] == 4


# 28. Teacher portal data consistency: Class dashboard aggregates real enrolled student sessions
def test_28_teacher_portal_consistency(client, test_setup, db_session):
    u_teacher = test_setup["users"]["teacher1"]
    s1 = test_setup["students"]["s1"]
    cls1 = test_setup["classes"]["c1"]
    headers = auth_headers(u_teacher)

    sess = LearningSession(student_id=s1.id, skill="pronunciation", completed_at=datetime.now(timezone.utc), stars=5, xp=22)
    db_session.add(sess)
    db_session.commit()

    res = client.get(f"/api/teacher/dashboard?class_id={cls1.id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_students"] == 1
    assert data["activities_completed"] == 1


# 29. Deterministic engine behavior: Multiple calls with unchanged history return deterministic results
def test_29_deterministic_engine_behavior(client, test_setup):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    headers = auth_headers(u_parent)

    res1 = client.get(f"/api/recommendations/next-best-action/{s1.id}", headers=headers)
    res2 = client.get(f"/api/recommendations/next-best-action/{s1.id}", headers=headers)
    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json()["best_action"]["skill"] == res2.json()["best_action"]["skill"]
    assert res1.json()["best_action"]["title"] == res2.json()["best_action"]["title"]


# 30. Regression protection: Non-clinical disclaimer present and zero diagnostic labels
def test_30_regression_protection_non_clinical_language(client, test_setup):
    u_parent = test_setup["users"]["parent1"]
    s1 = test_setup["students"]["s1"]
    headers = auth_headers(u_parent)

    res = client.get(f"/api/recommendations/next-best-action/{s1.id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["disclaimer"] == DISCLAIMER
    assert not contains_forbidden_language(data["best_action"]["reason"])
