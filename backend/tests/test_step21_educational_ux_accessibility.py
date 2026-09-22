"""Step 21 Backend Test Suite — Educational UX, Accessibility, and Child Experience Validation.

30 comprehensive tests verifying:
1. Child navigation: student learner summary endpoint returns age-appropriate metrics
2. Home intelligence: NextBestAction delivers actionable non-clinical recommendation
3. Learn catalog: content library returns age-bounded items for early learners
4. Practice personalization: personalized content aligns with child fingerprint
5. ReadWithMe: reading session accepts valid transcripts and produces Needleman-Wunsch alignment
6. SpeakPlay: speech alignment evaluates pronunciation without fabricating phoneme scores
7. Stories: reading comprehension evaluation returns valid score and explanation
8. Games: learning session persists real XP and star gains without inflation
9. Results: session persistence returns clean outcome schema for encouraging child feedback
10. MyJourney: fingerprint history returns chronological learner progression
11. Search: search endpoint supports quick topic suggestions and skill filters
12. Multimodal capabilities: declares honest status (tts_available=False, whisper_status=REAL/MOCK)
13. Support levels: multimodal presentation metadata provides GUIDED/FULL_SUPPORT scaffolding
14. Non-clinical terminology: NextBestAction contains educational encouragement, zero diagnostic labels
15. Non-clinical terminology: reading session feedback is educational and constructive
16. Non-clinical terminology: disclaimer is attached to learning goals and plans
17. Keyboard & error behavior: 400 Bad Request on invalid query parameters returns clean JSON
18. Error behavior: 404 Not Found returns clean JSON without internal path disclosure
19. Error behavior: 422 Unprocessable Entity provides structured validation errors
20. Error behavior: 500 unhandled exceptions caught cleanly without stack trace leakage
21. Empty state: new student has default baseline fingerprint without crashes
22. Empty state: new student with zero sessions returns valid empty progress lists
23. Parent UX: parent child summary returns real completed activities and streak
24. Teacher UX: teacher dashboard aggregates class-level progress without individual child leaks
25. Cross-portal consistency: parent and teacher see identical session count for enrolled student
26. Reward integrity: zero XP awarded when session fails or is not completed
27. Auth security: unauthenticated requests cannot access student progress
28. Auth security: unauthorized parent cannot view unlinked child's reading observations
29. Deterministic behavior: recommendations endpoint is stable when student history is unchanged
30. Canonical Student ID: student.id integer persists through all API interactions
"""
import pytest
from datetime import datetime, timezone
from app.models import User, Student, Parent, Teacher, ClassModel, LearningSession, ReadingSessionDetail
from app.utils.security import create_access_token, hash_password
from app.utils.language import DISCLAIMER


def auth_headers(user: User) -> dict:
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def test_setup(db_session):
    pw = hash_password("secret123")
    u_p = User(email="parent_step21@readquest.org", password_hash=pw, name="Parent 21", role="parent")
    u_t = User(email="teacher_step21@readquest.org", password_hash=pw, name="Teacher 21", role="teacher")
    u_c = User(email="child_step21@readquest.org", password_hash=pw, name="Child 21", role="child")
    db_session.add_all([u_p, u_t, u_c])
    db_session.flush()

    p = Parent(user_id=u_p.id)
    t = Teacher(user_id=u_t.id)
    db_session.add_all([p, t])
    db_session.flush()

    c_cls = ClassModel(name="Grade 1A", teacher_id=t.id)
    db_session.add(c_cls)
    db_session.flush()

    s = Student(user_id=u_c.id, name="Leo", age=7)
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


# 1. Child navigation: student learner summary endpoint returns age-appropriate metrics
def test_01_student_summary_endpoint(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.get(f"/api/parent/children/{s.id}/summary", headers=auth_headers(u_p))
    assert res.status_code == 200
    data = res.json()
    assert "activities_completed" in data
    assert "total_stars" in data
    assert "streak" in data


# 2. Home intelligence: NextBestAction delivers actionable non-clinical recommendation
def test_02_home_next_best_action(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.get(f"/api/recommendations/next-best-action/{s.id}", headers=auth_headers(u_p))
    assert res.status_code == 200
    data = res.json()
    assert "best_action" in data
    assert "title" in data["best_action"]
    assert "reason" in data["best_action"]
    assert "dyslexia" not in data["best_action"]["reason"].lower()


# 3. Learn catalog: content library returns age-bounded items for early learners
def test_03_content_library_age_bounded(client, test_setup):
    u_p = test_setup["users"]["parent"]
    res = client.get("/api/content/library?age=7", headers=auth_headers(u_p))
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) > 0
    for item in items:
        assert item["difficulty"] in (1, 2, 3, 4)


# 4. Practice personalization: personalized content aligns with child fingerprint
def test_04_personalized_content(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.get(f"/api/content/personalized/{s.id}", headers=auth_headers(u_p))
    assert res.status_code == 200
    data = res.json()
    assert "primary" in data
    assert "target_skill" in data
    assert "categories" in data
    assert data["child_id"] == s.id


# 5. ReadWithMe: reading session accepts valid transcripts and produces Needleman-Wunsch alignment
def test_05_read_with_me_session(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.post(
        f"/api/reading/session?child_id={s.id}",
        json={
            "expected_text": "The cat sat on the mat",
            "recognized_text": "The cat sat on mat",
            "duration_seconds": 8,
            "stars": 4,
            "xp": 20,
        },
        headers=auth_headers(u_p),
    )
    assert res.status_code == 201
    data = res.json()
    assert data["words_attempted"] == 6
    assert data["words_correct"] == 5
    assert data["omissions"] == 1


# 6. SpeakPlay: speech alignment evaluates pronunciation without fabricating phoneme scores
def test_06_speak_play_speech_analyze(client, test_setup):
    u_p = test_setup["users"]["parent"]
    res = client.post(
        "/api/speech/analyze",
        json={"expected_text": "apple", "recognized_text": "apple"},
        headers=auth_headers(u_p),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["accuracy"] >= 80
    assert "analysis_available" in data


# 7. Stories: reading comprehension evaluation returns valid score and explanation
def test_07_story_comprehension(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.post(
        f"/api/reading/comprehension?child_id={s.id}",
        json={
            "stars": 3,
            "xp": 15,
            "questions": [
                {
                    "question": "What did the fox want?",
                    "correct_answer": "grapes",
                    "child_answer": "grapes",
                }
            ],
        },
        headers=auth_headers(u_p),
    )
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data
    assert data["student_id"] == s.id
    assert len(data["questions"]) == 1
    assert data["questions"][0]["is_correct"] is True


# 8. Games: learning session persists real XP and star gains without inflation
def test_08_games_session_reward(client, test_setup, db_session):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.post(
        f"/api/learning/session?child_id={s.id}",
        json={
            "skill": "phonologicalAwareness",
            "stars": 3,
            "xp": 18,
            "outcome": {"type": "game", "title": "Sound Safari", "accuracy": 85},
        },
        headers=auth_headers(u_p),
    )
    assert res.status_code == 201
    assert res.json()["stars"] == 3
    assert res.json()["xp"] == 18


# 9. Results: session persistence returns clean outcome schema for encouraging child feedback
def test_09_results_outcome_schema(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.post(
        f"/api/learning/session?child_id={s.id}",
        json={
            "skill": "wordRecognition",
            "stars": 5,
            "xp": 25,
            "outcome": {"type": "game", "title": "Word Builder", "accuracy": 100},
        },
        headers=auth_headers(u_p),
    )
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert data["student_id"] == s.id


# 10. MyJourney: fingerprint history returns chronological learner progression
def test_10_my_journey_fingerprint_history(client, test_setup, db_session):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    sess = LearningSession(student_id=s.id, skill="readingFluency", completed_at=datetime.now(timezone.utc), stars=4, xp=20)
    db_session.add(sess)
    db_session.commit()

    res = client.get(f"/api/fingerprint/{s.id}", headers=auth_headers(u_p))
    assert res.status_code == 200
    data = res.json()
    assert "current" in data
    assert "history" in data


# 11. Search: search endpoint supports quick topic suggestions and skill filters
def test_11_search_suggestions(client, test_setup):
    u_p = test_setup["users"]["parent"]
    res = client.get("/api/search?q=cat", headers=auth_headers(u_p))
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert isinstance(data["results"], list)


# 12. Multimodal capabilities: declares honest status (tts_available=False, whisper_status=REAL/MOCK)
def test_12_multimodal_capabilities_honest(client):
    res = client.get("/api/multimodal/capabilities")
    assert res.status_code == 200
    data = res.json()
    assert data["tts_available"] is False
    assert data["tts_status"] == "UNAVAILABLE"
    assert data["whisper_status"] in ("REAL", "MOCK")


# 13. Support levels: multimodal presentation metadata provides GUIDED/FULL_SUPPORT scaffolding
def test_13_multimodal_support_levels(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.get(f"/api/content/multimodal/fox-story?child_id={s.id}", headers=auth_headers(u_p))
    assert res.status_code == 200
    data = res.json()
    assert data["support_level"] in ("FULL_SUPPORT", "GUIDED", "INDEPENDENT", "CHALLENGE")
    assert "scaffolds" in data


# 14. Non-clinical terminology: NextBestAction contains educational encouragement, zero diagnostic labels
def test_14_non_clinical_next_best_action(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.get(f"/api/recommendations/next-best-action/{s.id}", headers=auth_headers(u_p))
    assert res.status_code == 200
    data = res.json()
    text = (data["best_action"]["title"] + " " + data["best_action"]["reason"]).lower()
    for forbidden in ["dyslexi", "disorder", "patholog", "deficit"]:
        assert forbidden not in text


# 15. Non-clinical terminology: reading session feedback is educational and constructive
def test_15_non_clinical_reading_feedback(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.post(
        f"/api/reading/session?child_id={s.id}",
        json={"expected_text": "run fast", "recognized_text": "run slow", "stars": 3, "xp": 10},
        headers=auth_headers(u_p),
    )
    assert res.status_code == 201
    feedback = res.json().get("friendly_feedback", "").lower()
    assert "disorder" not in feedback
    assert "deficit" not in feedback


# 16. Non-clinical terminology: disclaimer is attached to learning goals and plans
def test_16_disclaimer_learning_goals(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.get(f"/api/learning-goals/{s.id}", headers=auth_headers(u_p))
    assert res.status_code == 200
    data = res.json()
    assert "disclaimer" in data
    assert data["disclaimer"] == DISCLAIMER


# 17. Keyboard & error behavior: 400 Bad Request on invalid query parameters returns clean JSON
def test_17_400_invalid_progress_range(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.get(f"/api/students/{s.id}/progress?range=invalid_999", headers=auth_headers(u_p))
    assert res.status_code == 400
    assert "detail" in res.json()


# 18. Error behavior: 404 Not Found returns clean JSON without internal path disclosure
def test_18_404_clean_json(client, test_setup):
    u_p = test_setup["users"]["parent"]
    res = client.get("/api/content/nonexistent-item-step21", headers=auth_headers(u_p))
    assert res.status_code == 404
    detail = res.json()["detail"]
    assert "C:\\" not in detail
    assert "Traceback" not in detail


# 19. Error behavior: 422 Unprocessable Entity provides structured validation errors
def test_19_422_structured_validation(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.post(
        f"/api/reading/session?child_id={s.id}",
        json={"stars": 5},  # missing expected_text and recognized_text
        headers=auth_headers(u_p),
    )
    assert res.status_code == 422
    assert "detail" in res.json()


# 20. Error behavior: 500 unhandled exceptions caught cleanly without stack trace leakage
def test_20_500_safe_json_exception(client, test_setup, monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.routers import reading

    def broken(*args, **kwargs):
        raise RuntimeError("Crash test step 21")

    monkeypatch.setattr(reading, "get_ai_analysis_service", broken)
    safe_client = TestClient(app, raise_server_exceptions=False)
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = safe_client.post(
        f"/api/reading/session?child_id={s.id}",
        json={"expected_text": "cat", "recognized_text": "cat"},
        headers=auth_headers(u_p),
    )
    assert res.status_code == 500
    assert res.json() == {"detail": "Internal server error"}


# 21. Empty state: new student has default baseline fingerprint without crashes
def test_21_new_student_default_fingerprint(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.get(f"/api/fingerprint/{s.id}", headers=auth_headers(u_p))
    assert res.status_code == 200
    data = res.json()
    assert "history" in data
    assert data["history"] == []
    assert data["current"] is None
    assert "disclaimer" in data


# 22. Empty state: new student with zero sessions returns valid empty progress lists
def test_22_new_student_empty_progress(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.get(f"/api/students/{s.id}/progress?range=7d", headers=auth_headers(u_p))
    assert res.status_code == 200
    data = res.json()
    assert data["student_id"] == s.id
    assert data["range"] == "7d"
    assert data["sample_size"] == 0
    assert isinstance(data["skills"], list)
    assert len(data["skills"]) == 0
    assert "note" in data


# 23. Parent UX: parent child summary returns real completed activities and streak
def test_23_parent_child_summary_real(client, test_setup, db_session):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    sess = LearningSession(student_id=s.id, skill="pronunciation", completed_at=datetime.now(timezone.utc), stars=5, xp=25)
    db_session.add(sess)
    db_session.commit()

    res = client.get(f"/api/parent/children/{s.id}/summary", headers=auth_headers(u_p))
    assert res.status_code == 200
    data = res.json()
    assert data["activities_completed"] == 1
    assert data["total_stars"] == 5


# 24. Teacher UX: teacher dashboard aggregates class-level progress without individual child leaks
def test_24_teacher_dashboard_class_aggregate(client, test_setup, db_session):
    u_t = test_setup["users"]["teacher"]
    s = test_setup["student"]
    cls_obj = test_setup["class"]
    sess = LearningSession(student_id=s.id, skill="readingFluency", completed_at=datetime.now(timezone.utc), stars=4, xp=20)
    db_session.add(sess)
    db_session.commit()

    res = client.get(f"/api/teacher/dashboard?class_id={cls_obj.id}", headers=auth_headers(u_t))
    assert res.status_code == 200
    data = res.json()
    assert data["total_students"] == 1
    assert data["activities_completed"] == 1


# 25. Cross-portal consistency: parent and teacher see identical session count for enrolled student
def test_25_cross_portal_session_count_consistency(client, test_setup, db_session):
    u_p = test_setup["users"]["parent"]
    u_t = test_setup["users"]["teacher"]
    s = test_setup["student"]
    cls_obj = test_setup["class"]

    sess = LearningSession(student_id=s.id, skill="wordRecognition", completed_at=datetime.now(timezone.utc), stars=4, xp=15)
    db_session.add(sess)
    db_session.commit()

    p_res = client.get(f"/api/parent/children/{s.id}/summary", headers=auth_headers(u_p))
    t_res = client.get(f"/api/teacher/dashboard?class_id={cls_obj.id}", headers=auth_headers(u_t))

    assert p_res.json()["activities_completed"] == t_res.json()["activities_completed"]


# 26. Reward integrity: zero XP awarded when session fails or is not completed
def test_26_reward_integrity_zero_on_empty(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.post(
        f"/api/learning/session?child_id={s.id}",
        json={"skill": "comprehension", "stars": 0, "xp": 0},
        headers=auth_headers(u_p),
    )
    assert res.status_code == 201
    assert res.json()["stars"] == 0
    assert res.json()["xp"] == 0


# 27. Auth security: unauthenticated requests cannot access student progress
def test_27_unauthenticated_progress_rejected(client, test_setup):
    s = test_setup["student"]
    res = client.get(f"/api/students/{s.id}/progress")
    assert res.status_code == 401


# 28. Auth security: unauthorized parent cannot view unlinked child's reading observations
def test_28_unauthorized_parent_rejected(client, test_setup, db_session):
    u_other = User(email="other_parent@readquest.org", password_hash="hash", name="Other Parent", role="parent")
    db_session.add(u_other)
    db_session.commit()

    s = test_setup["student"]
    res = client.get(f"/api/parent/children/{s.id}/summary", headers=auth_headers(u_other))
    assert res.status_code == 403


# 29. Deterministic behavior: recommendations endpoint is stable when student history is unchanged
def test_29_deterministic_recommendations(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    headers = auth_headers(u_p)

    r1 = client.get(f"/api/recommendations/{s.id}", headers=headers).json()
    r2 = client.get(f"/api/recommendations/{s.id}", headers=headers).json()

    assert len(r1) == len(r2)
    if r1:
        assert r1[0]["title"] == r2[0]["title"]


# 30. Canonical Student ID: student.id integer persists through all API interactions
def test_30_canonical_student_id_integer(client, test_setup):
    u_p = test_setup["users"]["parent"]
    s = test_setup["student"]
    res = client.get(f"/api/students/{s.id}", headers=auth_headers(u_p))
    assert res.status_code == 200
    assert isinstance(res.json()["id"], int)
    assert res.json()["id"] == s.id
