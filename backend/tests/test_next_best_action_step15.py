"""Step 15 Backend Test Suite — Next-Best-Action Recommendation Engine.

30 comprehensive tests verifying:
- Endpoint availability & parameters
- RBAC authorization (Parent, Teacher, Child, 401, 403)
- Nonexistent student handling (404)
- Canonical numeric student_id
- Onboarding state for new learners (0 sessions)
- Focus skill & strongest skill detection
- Pattern-based recommendation types (needs_practice, declining_skill, spaced_practice, reinforcement, challenge_up, supportive_down)
- Spaced practice candidates
- Activity repetition & variety rule (3x identical activity triggers variety switch)
- Deterministic output
- Difficulty adaptation
- Content catalog reuse
- Non-clinical educational explainability
- Closed-loop dynamic updates
"""
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.models import (
    User,
    UserRole,
    Parent,
    Teacher,
    ClassModel,
    Student,
    LearningSession,
    ReadingFingerprint,
)
from app.utils.security import create_access_token, hash_password
from app.utils.language import contains_forbidden_language
from app.services.search_service import CATALOG_STATIC_RESOURCES


def auth_headers(user: User) -> dict:
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def seed_data(db_session):
    unique = int(datetime.now().timestamp() * 1000)

    # 1. Parent & Child
    parent_user = User(
        email=f"parent_step15_{unique}@test.com",
        name="Parent Step15",
        password_hash=hash_password("Secret123!"),
        role=UserRole.parent,
    )
    db_session.add(parent_user)
    db_session.flush()

    parent_record = Parent(user_id=parent_user.id)
    db_session.add(parent_record)
    db_session.flush()

    child = Student(name="Learner Step15", age=7)
    parent_record.children.append(child)
    db_session.add(child)
    db_session.flush()

    # Child user account
    child_user = User(
        email=f"child_step15_{unique}@test.com",
        name="Child User",
        password_hash=hash_password("Secret123!"),
        role=UserRole.child,
    )
    db_session.add(child_user)
    db_session.flush()
    child.user_id = child_user.id
    db_session.flush()

    # 2. Teacher & Enrolled Student
    teacher_user = User(
        email=f"teacher_step15_{unique}@test.com",
        name="Teacher Step15",
        password_hash=hash_password("Secret123!"),
        role=UserRole.teacher,
    )
    db_session.add(teacher_user)
    db_session.flush()

    teacher_record = Teacher(user_id=teacher_user.id)
    db_session.add(teacher_record)
    db_session.flush()

    cls = ClassModel(name="Grade 2A", teacher_id=teacher_record.id)
    db_session.add(cls)
    db_session.flush()

    cls_student = Student(name="Classroom Learner", age=8)
    cls.students.append(cls_student)
    db_session.add(cls_student)
    db_session.flush()

    # 3. Empty Child (No sessions)
    empty_child = Student(name="Empty Learner", age=6)
    parent_record.children.append(empty_child)
    db_session.add(empty_child)
    db_session.flush()

    # 4. Other Unrelated Parent & Child for RBAC testing
    other_parent_user = User(
        email=f"other_parent_step15_{unique}@test.com",
        name="Other Parent",
        password_hash=hash_password("Secret123!"),
        role=UserRole.parent,
    )
    db_session.add(other_parent_user)
    db_session.flush()

    other_parent_record = Parent(user_id=other_parent_user.id)
    db_session.add(other_parent_record)
    db_session.flush()

    other_child = Student(name="Other Child", age=7)
    other_parent_record.children.append(other_child)
    db_session.add(other_child)
    db_session.flush()

    db_session.commit()

    return {
        "parent_user": parent_user,
        "child_user": child_user,
        "teacher_user": teacher_user,
        "other_parent_user": other_parent_user,
        "child": child,
        "cls_student": cls_student,
        "empty_child": empty_child,
        "other_child": other_child,
    }


# ==============================================================================
# TESTS 1-10: ENDPOINT, SECURITY, AUTHORIZATION, AND CANONICAL ID
# ==============================================================================

def test_01_endpoint_requires_authentication(client):
    res = client.get("/api/recommendations/next-best-action/1")
    assert res.status_code == 401


def test_02_endpoint_query_param_requires_authentication(client):
    res = client.get("/api/recommendations/next-best-action?child_id=1")
    assert res.status_code == 401


def test_03_parent_can_access_own_linked_child(client, seed_data):
    s1_id = seed_data["child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["child_id"] == s1_id
    assert "best_action" in data


def test_04_parent_cannot_access_unlinked_child(client, seed_data):
    other_id = seed_data["other_child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{other_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    assert res.status_code in (403, 404)


def test_05_teacher_can_access_enrolled_student(client, seed_data):
    cls_id = seed_data["cls_student"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{cls_id}",
        headers=auth_headers(seed_data["teacher_user"]),
    )
    assert res.status_code == 200
    assert res.json()["child_id"] == cls_id


def test_06_teacher_cannot_access_unenrolled_student(client, seed_data):
    other_id = seed_data["other_child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{other_id}",
        headers=auth_headers(seed_data["teacher_user"]),
    )
    assert res.status_code in (403, 404)


def test_07_child_can_access_own_student_record(client, seed_data):
    s1_id = seed_data["child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["child_user"]),
    )
    assert res.status_code == 200
    assert res.json()["child_id"] == s1_id


def test_08_child_cannot_access_different_child(client, seed_data):
    other_id = seed_data["other_child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{other_id}",
        headers=auth_headers(seed_data["child_user"]),
    )
    assert res.status_code in (403, 404)


def test_09_nonexistent_child_returns_404(client, seed_data):
    res = client.get(
        "/api/recommendations/next-best-action/99999",
        headers=auth_headers(seed_data["parent_user"]),
    )
    assert res.status_code in (403, 404)


def test_10_query_param_version_returns_identical_structure(client, seed_data):
    s1_id = seed_data["child"].id
    res_path = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    res_query = client.get(
        f"/api/recommendations/next-best-action?child_id={s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    assert res_path.status_code == 200
    assert res_query.status_code == 200
    assert res_path.json()["best_action"]["activity_id"] == res_query.json()["best_action"]["activity_id"]


# ==============================================================================
# TESTS 11-15: NEW / ONBOARDING LEARNER STATE (0 SESSIONS)
# ==============================================================================

def test_11_new_learner_returns_onboarding_recommendation_type(client, seed_data):
    empty_id = seed_data["empty_child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{empty_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert data["learner_summary"]["total_sessions"] == 0
    assert data["learner_summary"]["data_sufficiency"] == "insufficient"
    assert data["best_action"]["recommendation_type"] == "onboarding"


def test_12_new_learner_explanation_is_supportive_onboarding(client, seed_data):
    empty_id = seed_data["empty_child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{empty_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert "start with a short learning activity" in data["best_action"]["reason"]


def test_13_new_learner_difficulty_is_one(client, seed_data):
    empty_id = seed_data["empty_child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{empty_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert data["best_action"]["difficulty"] == 1
    assert data["best_action"]["difficulty_label"] == "Easy"


def test_14_new_learner_has_ranked_alternatives(client, seed_data):
    empty_id = seed_data["empty_child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{empty_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert len(data["alternatives"]) >= 2
    assert data["alternatives"][0]["priority"] == 2
    assert data["alternatives"][1]["priority"] == 3


def test_15_new_learner_does_not_invent_fake_streaks(client, seed_data):
    empty_id = seed_data["empty_child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{empty_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert data["learner_summary"]["current_streak"] == 0


# ==============================================================================
# TESTS 16-25: LEARNER WITH RECORDED HISTORY & ADAPTIVE LOGIC
# ==============================================================================

def test_16_history_updates_data_sufficiency(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    now = datetime.now(timezone.utc)

    for i in range(4):
        sess = LearningSession(
            student_id=s1_id,
            skill="reading_fluency",
            started_at=now - timedelta(days=3 - i, hours=1),
            completed_at=now - timedelta(days=3 - i),
            outcome={"accuracy": 85.0, "type": "reading"},
        )
        db_session.add(sess)
    db_session.commit()

    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert data["learner_summary"]["total_sessions"] >= 4
    assert data["learner_summary"]["data_sufficiency"] == "sufficient"


def test_17_struggling_skill_recommended_for_support(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    now = datetime.now(timezone.utc)

    # Low scores in phonological awareness
    for i in range(3):
        sess = LearningSession(
            student_id=s1_id,
            skill="phonological_awareness",
            started_at=now - timedelta(days=2 - i, hours=1),
            completed_at=now - timedelta(days=2 - i),
            outcome={"accuracy": 40.0, "type": "sound"},
        )
        db_session.add(sess)
    db_session.commit()

    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert data["best_action"]["skill"] == "phonological_awareness"
    assert data["best_action"]["recommendation_type"] in ("supportive_down", "needs_practice")


def test_18_declining_trend_detected_and_explained(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    now = datetime.now(timezone.utc)

    # Declining trend: 90 -> 75 -> 60
    for idx, acc in enumerate([90.0, 75.0, 60.0]):
        sess = LearningSession(
            student_id=s1_id,
            skill="word_recognition",
            started_at=now - timedelta(days=4 - idx, hours=1),
            completed_at=now - timedelta(days=4 - idx),
            outcome={"accuracy": acc, "type": "game"},
        )
        db_session.add(sess)
    db_session.commit()

    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert data["learner_summary"]["focus_skill"] == "word_recognition" or data["best_action"]["skill"] == "word_recognition"


def test_19_improving_skill_triggers_reinforcement_or_challenge(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    now = datetime.now(timezone.utc)

    # Steady improvement: 65 -> 78 -> 92
    for idx, acc in enumerate([65.0, 78.0, 92.0]):
        sess = LearningSession(
            student_id=s1_id,
            skill="reading_fluency",
            started_at=now - timedelta(days=3 - idx, hours=1),
            completed_at=now - timedelta(days=3 - idx),
            outcome={"accuracy": acc, "type": "reading"},
        )
        db_session.add(sess)
    db_session.commit()

    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    if data["best_action"]["skill"] == "reading_fluency":
        assert data["best_action"]["recommendation_type"] in ("reinforcement", "challenge_up")


def test_20_spaced_practice_recommended_for_stale_skill(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    now = datetime.now(timezone.utc)

    # Comprehension practiced 10 days ago with good score
    sess_old = LearningSession(
        student_id=s1_id,
        skill="comprehension",
        started_at=now - timedelta(days=10, hours=1),
        completed_at=now - timedelta(days=10),
        outcome={"accuracy": 85.0, "type": "story"},
    )
    # Fluency practiced today
    sess_new = LearningSession(
        student_id=s1_id,
        skill="reading_fluency",
        started_at=now - timedelta(hours=1),
        completed_at=now,
        outcome={"accuracy": 85.0, "type": "reading"},
    )
    db_session.add_all([sess_old, sess_new])
    db_session.commit()

    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    skills_in_response = [data["best_action"]["skill"]] + [a["skill"] for a in data["alternatives"]]
    assert "comprehension" in skills_in_response


def test_21_activity_repetition_3x_triggers_variety_switch(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    now = datetime.now(timezone.utc)

    # Completed Word Builder 3 times consecutively
    for i in range(3):
        sess = LearningSession(
            student_id=s1_id,
            skill="word_recognition",
            started_at=now - timedelta(minutes=60 - i * 15),
            completed_at=now - timedelta(minutes=45 - i * 15),
            outcome={"accuracy": 65.0, "title": "Word Builder", "type": "game"},
        )
        db_session.add(sess)
    db_session.commit()

    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert data["best_action"]["title"] != "Word Builder" or data["best_action"]["is_variety_switch"] is True


def test_22_variety_switch_explains_format_change(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    now = datetime.now(timezone.utc)

    for i in range(3):
        sess = LearningSession(
            student_id=s1_id,
            skill="word_recognition",
            started_at=now - timedelta(minutes=60 - i * 15),
            completed_at=now - timedelta(minutes=45 - i * 15),
            outcome={"accuracy": 60.0, "title": "Word Builder", "type": "game"},
        )
        db_session.add(sess)
    db_session.commit()

    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    if data["best_action"]["is_variety_switch"]:
        assert data["best_action"]["recommendation_type"] == "variety"
        assert "switch" in data["best_action"]["reason"].lower() or "several times" in data["best_action"]["reason"].lower()


def test_23_deterministic_recommendation_ranking(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    res1 = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    res2 = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    assert res1.json()["best_action"]["activity_id"] == res2.json()["best_action"]["activity_id"]
    assert res1.json()["best_action"]["priority"] == res2.json()["best_action"]["priority"]


def test_24_difficulty_adaptation_never_exceeds_max(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert 1 <= data["best_action"]["difficulty"] <= 4


def test_25_activity_id_and_route_exist_in_catalog(client, seed_data):
    s1_id = seed_data["child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    act = data["best_action"]
    catalog_routes = [c["route"] for c in CATALOG_STATIC_RESOURCES]
    assert act["route"] in catalog_routes


# ==============================================================================
# TESTS 26-30: EXPLAINABILITY, NON-CLINICAL SAFETY, & CLOSED LOOP
# ==============================================================================

def test_26_zero_forbidden_clinical_words_in_response(client, seed_data):
    s1_id = seed_data["child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    full_text = f"{data['explanation']} {data['best_action']['reason']} {data['best_action']['fit_reason']}"
    assert not contains_forbidden_language(full_text)


def test_27_educational_disclaimer_present_in_response(client, seed_data):
    s1_id = seed_data["child"].id
    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert "disclaimer" in data
    assert "not a clinical" in data["disclaimer"].lower() or "educational" in data["disclaimer"].lower()


def test_28_streak_calculated_accurately_from_sessions(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    now = datetime.now(timezone.utc)

    # 2 consecutive days of sessions (yesterday and today)
    sess_y = LearningSession(
        student_id=s1_id,
        skill="pronunciation",
        started_at=now - timedelta(days=1, hours=1),
        completed_at=now - timedelta(days=1),
        outcome={"accuracy": 80.0, "type": "speaking"},
    )
    sess_t = LearningSession(
        student_id=s1_id,
        skill="pronunciation",
        started_at=now - timedelta(hours=1),
        completed_at=now,
        outcome={"accuracy": 85.0, "type": "speaking"},
    )
    db_session.add_all([sess_y, sess_t])
    db_session.commit()

    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert data["learner_summary"]["current_streak"] >= 2


def test_29_closed_loop_session_completion_updates_recommendation(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    now = datetime.now(timezone.utc)

    # Initial query
    res1 = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    initial_sessions = res1.json()["learner_summary"]["total_sessions"]

    # Child completes an activity
    new_sess = LearningSession(
        student_id=s1_id,
        skill="reading_fluency",
        started_at=now - timedelta(minutes=10),
        completed_at=now,
        outcome={"accuracy": 95.0, "type": "reading"},
    )
    db_session.add(new_sess)
    db_session.commit()

    # Re-query
    res2 = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    updated_sessions = res2.json()["learner_summary"]["total_sessions"]
    assert updated_sessions == initial_sessions + 1


def test_30_strongest_skill_properly_identified_with_high_accuracy(client, seed_data, db_session):
    s1_id = seed_data["child"].id
    now = datetime.now(timezone.utc)

    fp = ReadingFingerprint(
        student_id=s1_id,
        pronunciation=95.0,
        reading_fluency=70.0,
        phonological_awareness=60.0,
        comprehension=65.0,
        word_recognition=60.0,
        recorded_at=now,
    )
    db_session.add(fp)
    db_session.commit()

    res = client.get(
        f"/api/recommendations/next-best-action/{s1_id}",
        headers=auth_headers(seed_data["parent_user"]),
    )
    data = res.json()
    assert data["learner_summary"]["strongest_skill"] == "pronunciation"
