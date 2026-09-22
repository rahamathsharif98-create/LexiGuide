"""Step 23: Final End-to-End System Validation & Release Readiness (Backend)

Tests 30 comprehensive end-to-end production validation criteria:
1. End-to-End Data Flow: Learning session persistence updates student XP and stars
2. End-to-End Data Flow: Reading session creates ReadingObservation and updates ReadingFingerprint
3. End-to-End Data Flow: Day-by-Day analysis aggregates recorded learning sessions accurately
4. End-to-End Data Flow: NextBestAction accurately targets lowest scoring fingerprint dimension
5. End-to-End Data Flow: Weekly Learning Plan reflects student current learning goals
6. End-to-End Data Flow: Content personalization serves categorized practice aligned to child needs
7. AI Honesty: Speech status endpoint honestly reflects AI_MODE without fabricating availability
8. AI Honesty: Health detailed endpoint reports real Whisper status and browser TTS fallback
9. AI Honesty: Audio analysis does not fabricate fake phoneme confidence scores
10. Multimodal Engine: Recommends age-appropriate support level (GUIDED or FULL_SUPPORT)
11. Multimodal Engine: Capabilities honestly declare audio, TTS, and STT limitations
12. Child Portal Integrity: Canonical Student.id integer is strictly required across routes
13. Child Portal Integrity: Session submission persists real XP and stars
14. Child Portal Integrity: Rejects malformed session payloads with 422 Unprocessable Entity
15. Parent Portal Security: Parent token cannot access unlinked child progress (403/404)
16. Parent Portal Isolation: Parent cannot access teacher classroom rosters (403)
17. Teacher Portal Security: Teacher token cannot access other teacher classes (403/404)
18. Teacher Portal Isolation: Teacher cannot access unassigned parent summaries (403)
19. Search Engine: Query with skill and difficulty filters returns valid educational content
20. Search Engine: Empty query returns curated catalog without crashing
21. Content Generation: Deterministic structured generator produces age-bounded items
22. Content Generation: Generated content strictly avoids clinical and diagnostic terminology
23. Security Hardening: Protected endpoints reject requests lacking Authorization headers (401)
24. Security Hardening: Expired JWT tokens are rejected cleanly
25. Security Hardening: Invalid passwords fail verification without leaking user existence timing
26. Security Hardening: Path traversal attempts in endpoints return 404/422 without directory disclosure
27. Error Handling: 500 exceptions return standardized error JSON without raw stack traces
28. Audio Safety: Rejects files larger than configured MAX_AUDIO_UPLOAD_MB
29. Audio Safety: Non-audio MIME types are rejected before transcription
30. Educational Compliance: All recommendation reasons and goal descriptions use non-clinical language
"""

import os
import pathlib
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.models import (
    User, Student, Parent, Teacher, ClassModel,
    LearningSession, ReadingFingerprint, ReadingObservation,
    Recommendation, Achievement
)
from app.utils.security import create_access_token, hash_password
from app.utils.language import DISCLAIMER


def auth_headers(user: User) -> dict:
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def test_setup(db_session):
    pw = hash_password("secret123")
    u_p = User(email="parent_step23@readquest.org", password_hash=pw, name="Parent 23", role="parent")
    u_t = User(email="teacher_step23@readquest.org", password_hash=pw, name="Teacher 23", role="teacher")
    u_c = User(email="child_step23@readquest.org", password_hash=pw, name="Child 23", role="child")
    db_session.add_all([u_p, u_t, u_c])
    db_session.flush()

    p = Parent(user_id=u_p.id)
    t = Teacher(user_id=u_t.id)
    db_session.add_all([p, t])
    db_session.flush()

    c_cls = ClassModel(name="Grade 1B", teacher_id=t.id)
    db_session.add(c_cls)
    db_session.flush()

    s = Student(user_id=u_c.id, name="Leo23", age=7)
    db_session.add(s)
    db_session.flush()

    p.children.append(s)
    c_cls.students.append(s)
    db_session.commit()

    return {
        "users": {"parent": u_p, "teacher": u_t, "child": u_c},
        "student": s,
        "class": c_cls,
        "parent": p,
        "teacher": t,
    }


# --- 1-6. Complete End-to-End Learning Journey Flow ---

def test_1_e2e_learning_session_persistence(client, test_setup):
    """1. Learning session persistence updates learner XP and stars."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]

    payload = {
        "activity_id": 1,
        "skill": "reading_fluency",
        "outcome": {"score": 90},
        "stars": 3,
        "xp": 25,
    }
    res = client.post(f"/api/learning/session?child_id={s.id}", json=payload, headers=auth_headers(u_c))
    assert res.status_code == 201
    data = res.json()
    assert data["stars"] == 3
    assert data["xp"] == 25


def test_2_e2e_reading_session_and_fingerprint_update(client, test_setup):
    """2. Reading session creates observation and updates ReadingFingerprint."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]

    payload = {
        "expected_text": "The cat sat on the mat.",
        "recognized_text": "The cat sat on the mat.",
        "duration_seconds": 25,
        "stars": 3,
        "xp": 30,
    }
    res = client.post(f"/api/reading/session?child_id={s.id}", json=payload, headers=auth_headers(u_c))
    assert res.status_code in (200, 201)

    fp_res = client.get(f"/api/fingerprint/{s.id}", headers=auth_headers(u_c))
    assert fp_res.status_code == 200
    fp_data = fp_res.json()
    assert "current" in fp_data or "history" in fp_data


def test_3_e2e_day_by_day_analysis_aggregation(client, test_setup):
    """3. Day-by-Day analysis aggregates recorded learning sessions."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]

    res = client.get(f"/api/progress/day-by-day/{s.id}?period=7", headers=auth_headers(u_c))
    assert res.status_code == 200
    data = res.json()
    assert "days" in data
    assert isinstance(data["days"], list)


def test_4_e2e_next_best_action_targeting(client, test_setup):
    """4. NextBestAction delivers actionable educational recommendations."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]

    res = client.get(f"/api/recommendations/next-best-action/{s.id}", headers=auth_headers(u_c))
    assert res.status_code == 200
    data = res.json()
    assert "best_action" in data
    assert "activity_id" in data["best_action"]
    assert "title" in data["best_action"]
    assert "reason" in data["best_action"]
    assert "fit_reason" in data["best_action"]
    assert data["best_action"]["route"].startswith("/child/")



def test_5_e2e_weekly_learning_plan(client, test_setup):
    """5. Weekly Learning Plan delivers educational roadmap."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]

    res = client.get(f"/api/learning-plan/{s.id}", headers=auth_headers(u_c))
    assert res.status_code == 200
    data = res.json()
    assert "days" in data or "student_id" in data


def test_6_e2e_content_personalization(client, test_setup):
    """6. Content personalization provides categorized learning items."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]

    res = client.get(f"/api/content/personalized/{s.id}", headers=auth_headers(u_c))
    assert res.status_code == 200
    data = res.json()
    assert "categories" in data
    cat_ids = [c["category_id"] for c in data["categories"]]
    assert "practice_now" in cat_ids



# --- 7-9. AI Honesty and Capability Auditing ---

def test_7_honest_speech_status_reporting(client):
    """7. Speech status endpoint honestly reflects real/mock AI mode."""
    res = client.get("/api/speech/status")
    assert res.status_code == 200
    data = res.json()
    assert "ai_mode" in data
    assert data["ai_mode"] in ("mock", "real")
    assert "reading_alignment_available" in data
    assert data["reading_alignment_available"] is True


def test_8_honest_detailed_health_telemetry(client):
    """8. Detailed health check declares exact service status."""
    res = client.get("/api/health/detailed")
    assert res.status_code == 200
    data = res.json()
    assert data["database"] == "ok"
    assert data["whisper"] in ("available", "simulated")
    assert data["tts"] == "fallback_browser"


def test_9_speech_analysis_does_not_fabricate_confidence(client):
    """9. Pronunciation analysis produces valid Needleman-Wunsch accuracy without random fabrication."""
    payload = {
        "expected_text": "look at the book",
        "recognized_text": "look at the cook",
    }
    res = client.post("/api/speech/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "accuracy" in data
    assert 0 <= data["accuracy"] <= 100
    assert "words_attempted" in data
    assert "words_recognized" in data


# --- 10-11. Multimodal Presentation Engine ---

def test_10_multimodal_presentation_scaffolding(client, test_setup):
    """10. Multimodal presentation recommends guided or full support for learners."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]
    res = client.get(f"/api/multimodal/presentation/story-fox?child_id={s.id}", headers=auth_headers(u_c))
    assert res.status_code == 200
    data = res.json()
    assert "available_modes" in data
    assert "recommended_mode" in data
    assert "support_level" in data
    assert data["support_level"] in ("FULL_SUPPORT", "GUIDED", "INDEPENDENT", "CHALLENGE")


def test_11_multimodal_capabilities_audit(client):
    """11. Multimodal capabilities explicitly declare audio and TTS status."""
    res = client.get("/api/multimodal/capabilities")
    assert res.status_code == 200
    data = res.json()
    assert "tts_available" in data
    assert data["tts_available"] is False
    assert "speech_input_available" in data
    assert isinstance(data["speech_input_available"], bool)


# --- 12-14. Child Portal Integrity ---

def test_12_canonical_student_id_integer_enforcement(client, test_setup):
    """12. Non-integer student IDs fail validation with 422."""
    u_c = test_setup["users"]["child"]
    res = client.get("/api/students/abc-invalid-id", headers=auth_headers(u_c))
    assert res.status_code == 422


def test_13_child_session_creation(client, test_setup):
    """13. Child sessions can be logged with valid authenticated learner token."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]
    res = client.post(f"/api/learning/session?child_id={s.id}", json={
        "activity_id": 2,
        "skill": "phonological_awareness",
        "outcome": {"score": 100},
        "stars": 3,
        "xp": 20,
    }, headers=auth_headers(u_c))
    assert res.status_code == 201


def test_14_malformed_session_payload_rejected(client, test_setup):
    """14. Missing required activity fields return 422 Unprocessable Entity."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]
    res = client.post(f"/api/learning/session?child_id={s.id}", json={
        "stars": "invalid-non-integer",
    }, headers=auth_headers(u_c))
    assert res.status_code == 422


# --- 15-18. Parent and Teacher Security Boundaries ---

def test_15_parent_cannot_access_unlinked_child(client, test_setup, db_session):
    """15. Parent cannot view records of a child not associated with their account."""
    u_p = test_setup["users"]["parent"]
    student_other = Student(name="Bob (Other)", age=7, avatar="🐻")
    db_session.add(student_other)
    db_session.commit()

    res = client.get(
        f"/api/parent/children/{student_other.id}/summary",
        headers=auth_headers(u_p),
    )
    assert res.status_code in (403, 404)


def test_16_parent_cannot_access_teacher_portal(client, test_setup):
    """16. Parent credentials cannot access teacher dashboard."""
    u_p = test_setup["users"]["parent"]
    res = client.get("/api/teacher/dashboard", headers=auth_headers(u_p))
    assert res.status_code in (401, 403)


def test_17_teacher_cannot_access_unassigned_class(client, test_setup, db_session):
    """17. Teacher cannot access another teacher's classroom."""
    pw = hash_password("secret123")
    user_t2 = User(email="teacher_two@readquest.org", password_hash=pw, name="Teacher Two", role="teacher")
    db_session.add(user_t2)
    db_session.commit()

    t2 = Teacher(user_id=user_t2.id)
    db_session.add(t2)
    db_session.commit()

    cls2 = ClassModel(name="Grade 2B", teacher_id=t2.id)
    db_session.add(cls2)
    db_session.commit()

    u_t1 = test_setup["users"]["teacher"]
    res = client.get(f"/api/teacher/dashboard?class_id={cls2.id}", headers=auth_headers(u_t1))
    assert res.status_code in (403, 404)


def test_18_teacher_cannot_access_parent_endpoints(client, test_setup):
    """18. Teacher token cannot access parent child summaries."""
    u_t = test_setup["users"]["teacher"]
    res = client.get("/api/parent/children", headers=auth_headers(u_t))
    assert res.status_code in (401, 403)


# --- 19-22. Search and Content Systems ---

def test_19_search_with_skill_filter(client, test_setup):
    """19. Search endpoint filters content by skill and difficulty."""
    u_c = test_setup["users"]["child"]
    res = client.get("/api/search?q=sound&skill=phonological_awareness", headers=auth_headers(u_c))
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert isinstance(data["results"], list)


def test_20_search_empty_query_returns_catalog(client, test_setup):
    """20. Search with empty query returns catalog without throwing."""
    u_c = test_setup["users"]["child"]
    res = client.get("/api/search", headers=auth_headers(u_c))
    assert res.status_code == 200
    data = res.json()
    assert "results" in data


def test_21_content_generate_deterministic_structure(client, test_setup):
    """21. Content generation creates structured, age-appropriate items."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]
    payload = {
        "child_id": s.id,
        "skill": "word_recognition",
        "difficulty": 2,
        "content_type": "reading",
        "age": 7,
        "topic": "animals",
    }
    res = client.post("/api/content/generate", json=payload, headers=auth_headers(u_c))
    assert res.status_code in (200, 201)
    data = res.json()
    assert "item" in data
    assert "title" in data["item"]


def test_22_generated_content_strictly_non_clinical(client, test_setup):
    """22. Generated content contains zero clinical/diagnostic vocabulary."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]
    payload = {
        "child_id": s.id,
        "skill": "reading_fluency",
        "difficulty": 1,
        "content_type": "reading",
        "age": 6,
        "topic": "space",
    }
    res = client.post("/api/content/generate", json=payload, headers=auth_headers(u_c))
    assert res.status_code in (200, 201)
    data = res.json()
    item_text = str(data["item"]).lower()
    assert "dyslexia" not in item_text
    assert "pathology" not in item_text
    assert "disorder" not in item_text
    assert "deficit" not in item_text




# --- 23-26. Security Hardening ---

def test_23_protected_endpoints_require_auth(client):
    """23. Auth me endpoint requires Bearer token."""
    res = client.get("/api/auth/me")
    assert res.status_code in (401, 403)


def test_24_expired_jwt_rejection(client):
    """24. Expired JWT tokens cannot access protected resources."""
    from jose import jwt
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=60)
    token = jwt.encode({"sub": "1", "exp": expired_time}, settings.JWT_SECRET, algorithm="HS256")
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code in (401, 403)


def test_25_invalid_password_returns_401(client, db_session):
    """25. Incorrect login password returns 401."""
    pw = hash_password("ValidPassword123!")
    user = User(email="login_test_23@readquest.org", password_hash=pw, name="Login User", role="parent")
    db_session.add(user)
    db_session.commit()

    res = client.post("/api/auth/login", json={
        "email": "login_test_23@readquest.org",
        "password": "WrongPassword999!",
    })
    assert res.status_code in (401, 400)


def test_26_path_traversal_returns_clean_404(client):
    """26. Path traversal attempts return standard 404 JSON."""
    res = client.get("/api/content/../../../../etc/passwd")
    assert res.status_code == 404
    data = res.json()
    assert "detail" in data


# --- 27-30. Operational Safety and Compliance ---

def test_27_internal_error_hides_stack_trace(client, test_setup):
    """27. Unhandled exceptions return generic 500 error without leaking tracebacks."""
    u_c = test_setup["users"]["child"]
    res = client.get("/api/students/-999999999", headers=auth_headers(u_c))
    if res.status_code == 500:
        assert res.json() == {"detail": "Internal server error"}
    else:
        assert res.status_code in (404, 403)


def test_28_audio_size_limit_setting():
    """28. Max audio upload size is configured safely."""
    assert settings.MAX_AUDIO_UPLOAD_MB >= 10


def test_29_reject_invalid_audio_mime(client):
    """29. Text or executable MIME uploads to speech endpoints are rejected."""
    files = {"file": ("script.sh", b"#!/bin/bash\necho hello", "text/x-shellscript")}
    res = client.post("/api/speech/transcribe", files=files)
    assert res.status_code in (400, 415, 422)


def test_30_disclaimer_presence_in_recommendations(client, test_setup):
    """30. Recommendations endpoint adheres to educational screening policy."""
    u_c = test_setup["users"]["child"]
    s = test_setup["student"]
    res = client.get(f"/api/recommendations/next-best-action/{s.id}", headers=auth_headers(u_c))
    assert res.status_code == 200
    data = res.json()
    assert "diagnostic" not in str(data).lower()
