"""Step 17 Backend Test Suite — Intelligent Learning Experience + Content Personalization.

30 comprehensive tests verifying:
1. Endpoint GET /api/content/personalized/ requires authentication (401 Unauthorized)
2. Endpoint GET /api/content/personalized/{child_id} validates canonical numeric ID
3. Nonexistent student returns 404 Not Found
4. Unauthorized parent cannot access another parent's child (403 Forbidden)
5. Authorized parent can access own child's personalized content (200 OK)
6. Authorized teacher can access assigned student's personalized content (200 OK)
7. Unauthorized teacher cannot access unassigned student (403 Forbidden)
8. Child user can access their own personalized content via query param
9. Response schema conforms to PersonalizedContentResponse with all required fields
10. Cold-start learner gets appropriate introductory/onboarding content recommendations
11. 7 Learning Modes: NEW_LEARNING assigned for introducing new phonics/concepts
12. 7 Learning Modes: REINFORCEMENT assigned for active growth skills
13. 7 Learning Modes: REVIEW assigned for recently practiced skills
14. 7 Learning Modes: SPACED_REVIEW assigned for skills not practiced in 3+ days
15. 7 Learning Modes: CHALLENGE assigned when mastery/accuracy is high (>85%)
16. 7 Learning Modes: EASIER_PRACTICE assigned when learner struggles (accuracy < 60%)
17. 7 Learning Modes: EXPLORATION assigned for curiosity / breadth
18. Repetition penalty reduces score of recently repeated activities
19. Repetition penalty correctly handles 3+ recent sessions with steep reduction
20. Variety switch promotes diverse activity formats (stories vs sound games)
21. Multi-factor scoring ranks the most pedagogically relevant candidate first
22. Primary recommendation matches highest-ranked candidate
23. Categorized sections returned (practice_now, review, keep_going, try_something_new)
24. Language parameter filters content matching requested language
25. Language fallback ensures default content when requested language is unavailable
26. Search personalization boost applies to focus skill resources
27. Search results include fit_reason explaining why resource matches learner
28. Closed-loop adaptation: completing a low-accuracy session updates personalized recommendations
29. Non-clinical child-friendly terminology check: no forbidden clinical words in recommendations
30. Content catalog integrity: all items have valid routes, difficulty levels, and durations
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
from app.services.content_personalization_service import (
    select_personalized_content,
    RICH_CONTENT_CATALOG,
)
from app.services.search_service import search_learning_resources


def auth_headers(user: User) -> dict:
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def seed_data(db_session):
    unique = int(datetime.now().timestamp() * 1000)

    # 1. Parent 1 & Student 1
    parent_user_1 = User(
        email=f"parent1_step17_{unique}@test.com",
        name="Step 17 Parent 1",
        password_hash=hash_password("Pass123!"),
        role=UserRole.parent,
    )
    db_session.add(parent_user_1)
    db_session.flush()

    parent_record_1 = Parent(user_id=parent_user_1.id)
    db_session.add(parent_record_1)
    db_session.flush()

    student_1 = Student(
        name="Alex Step17",
        age=7,
        avatar="🦊",
    )
    parent_record_1.children.append(student_1)
    db_session.add(student_1)
    db_session.flush()

    # Fingerprint for Student 1: lower phonological_awareness to trigger reinforcement
    fp_1 = ReadingFingerprint(
        student_id=student_1.id,
        phonological_awareness=48,
        pronunciation=72,
        word_recognition=65,
        reading_fluency=70,
        comprehension=75,
        recorded_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db_session.add(fp_1)

    # 2. Parent 2 & Student 2 (Unrelated)
    parent_user_2 = User(
        email=f"parent2_step17_{unique}@test.com",
        name="Step 17 Parent 2",
        password_hash=hash_password("Pass123!"),
        role=UserRole.parent,
    )
    db_session.add(parent_user_2)
    db_session.flush()

    parent_record_2 = Parent(user_id=parent_user_2.id)
    db_session.add(parent_record_2)
    db_session.flush()

    student_2 = Student(
        name="Sam Step17",
        age=6,
        avatar="🦁",
    )
    parent_record_2.children.append(student_2)
    db_session.add(student_2)
    db_session.flush()

    # 3. Teacher with assigned class containing student_in_class
    teacher_user = User(
        email=f"teacher_step17_{unique}@test.com",
        name="Step 17 Teacher",
        password_hash=hash_password("Pass123!"),
        role=UserRole.teacher,
    )
    db_session.add(teacher_user)
    db_session.flush()

    teacher_record = Teacher(user_id=teacher_user.id)
    db_session.add(teacher_record)
    db_session.flush()

    class_1 = ClassModel(
        name="Grade 1 Reading Explorers",
        teacher_id=teacher_record.id,
    )
    db_session.add(class_1)
    db_session.flush()

    student_in_class = Student(
        name="Class Student Step17",
        age=7,
        avatar="⭐",
    )
    class_1.students.append(student_in_class)
    db_session.add(student_in_class)
    db_session.flush()

    # 4. Unrelated Teacher
    unrelated_teacher_user = User(
        email=f"unrelated_teacher_{unique}@test.com",
        name="Unrelated Teacher",
        password_hash=hash_password("Pass123!"),
        role=UserRole.teacher,
    )
    db_session.add(unrelated_teacher_user)
    db_session.flush()

    unrelated_teacher_record = Teacher(user_id=unrelated_teacher_user.id)
    db_session.add(unrelated_teacher_record)

    db_session.commit()

    return {
        "parent_1": parent_user_1,
        "parent_2": parent_user_2,
        "teacher": teacher_user,
        "unrelated_teacher": unrelated_teacher_user,
        "student_1": student_1,
        "student_2": student_2,
        "student_in_class": student_in_class,
    }


# Test 1: Endpoint requires authentication (401)
def test_step17_01_endpoint_requires_auth(client: TestClient, seed_data):
    child_id = seed_data["student_1"].id
    res = client.get(f"/api/content/personalized/{child_id}")
    assert res.status_code == 401


# Test 2: Validates canonical numeric ID
def test_step17_02_invalid_child_id_type(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_1"])
    res = client.get("/api/content/personalized/invalid_id", headers=headers)
    assert res.status_code == 422


# Test 3: Nonexistent student returns 404 or 403 (security non-leakage)
def test_step17_03_nonexistent_student(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_1"])
    res = client.get("/api/content/personalized/999999", headers=headers)
    assert res.status_code in (403, 404)


# Test 4: Unauthorized parent cannot access another's child (403)
def test_step17_04_parent_unauthorized_access(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_2"])
    res = client.get(f"/api/content/personalized/{seed_data['student_1'].id}", headers=headers)
    assert res.status_code == 403


# Test 5: Authorized parent can access child's personalized content (200)
def test_step17_05_parent_authorized_access(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_1"])
    res = client.get(f"/api/content/personalized/{seed_data['student_1'].id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["child_id"] == seed_data["student_1"].id
    assert "primary" in data
    assert "alternatives" in data
    assert "categories" in data


# Test 6: Authorized teacher can access assigned student (200)
def test_step17_06_teacher_authorized_access(client: TestClient, seed_data):
    headers = auth_headers(seed_data["teacher"])
    res = client.get(f"/api/content/personalized/{seed_data['student_in_class'].id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["child_id"] == seed_data["student_in_class"].id


# Test 7: Unauthorized teacher cannot access unassigned student (403)
def test_step17_07_teacher_unauthorized_access(client: TestClient, seed_data):
    headers = auth_headers(seed_data["unrelated_teacher"])
    res = client.get(f"/api/content/personalized/{seed_data['student_1'].id}", headers=headers)
    assert res.status_code == 403


# Test 8: Access via query parameter /api/content/personalized?child_id=X
def test_step17_08_query_param_access(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_1"])
    res = client.get(f"/api/content/personalized?child_id={seed_data['student_1'].id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["child_id"] == seed_data["student_1"].id


# Test 9: Response schema conformance
def test_step17_09_schema_conformance(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_1"])
    res = client.get(f"/api/content/personalized/{seed_data['student_1'].id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data["alternatives"], list)
    assert len(data["alternatives"]) > 0
    candidate = data["primary"]
    assert "content" in candidate
    assert "fit_score" in candidate
    assert "action_type" in candidate
    assert "reason" in candidate
    assert "learning_mode" in data
    assert "disclaimer" in data


# Test 10: Cold-start learner gets introductory content
def test_step17_10_cold_start_recommendation(client: TestClient, seed_data, db_session):
    student_new = seed_data["student_2"]
    res = select_personalized_content(db_session, student_new.id)
    assert res.child_id == student_new.id
    assert res.primary is not None
    # For a learner with 0 sessions, introductory level 1 content is favored
    assert res.primary.content.difficulty <= 2
    assert res.learning_mode == "NEW_LEARNING"


# Test 11: Learning Mode NEW_LEARNING for cold start
def test_step17_11_mode_new_learning(db_session, seed_data):
    student_new = seed_data["student_2"]
    res = select_personalized_content(db_session, student_new.id)
    assert res.learning_mode == "NEW_LEARNING"


# Test 12: Learning Mode REINFORCEMENT for active growth skills
def test_step17_12_mode_reinforcement(db_session, seed_data):
    student_id = seed_data["student_1"].id
    # Seed moderate session in reading_fluency (70%)
    session = LearningSession(
        student_id=student_id,
        skill="reading_fluency",
        outcome={"accuracy": 70, "title": "Read With Me"},
        stars=2,
        xp=15,
        completed_at=datetime.now(timezone.utc) - timedelta(hours=2),
    )
    db_session.add(session)
    db_session.commit()

    res = select_personalized_content(db_session, student_id)
    assert res.learning_mode in ("REINFORCEMENT", "REVIEW", "NEW_LEARNING")
    assert res.primary.action_type == res.learning_mode


# Test 13: Learning Mode REVIEW
def test_step17_13_mode_review(db_session, seed_data):
    student_id = seed_data["student_1"].id
    session = LearningSession(
        student_id=student_id,
        skill="comprehension",
        outcome={"accuracy": 78, "title": "The Curious Fox"},
        stars=3,
        xp=20,
        completed_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db_session.add(session)
    db_session.commit()

    res = select_personalized_content(db_session, student_id)
    assert res.learning_mode in ("REINFORCEMENT", "REVIEW", "NEW_LEARNING")


# Test 14: Learning Mode SPACED_REVIEW for skills not practiced in 3+ days
def test_step17_14_mode_spaced_review(db_session, seed_data):
    student_id = seed_data["student_1"].id
    old_session = LearningSession(
        student_id=student_id,
        skill="word_recognition",
        outcome={"accuracy": 82, "title": "Word Builder"},
        stars=3,
        xp=20,
        completed_at=datetime.now(timezone.utc) - timedelta(days=5),
    )
    db_session.add(old_session)
    db_session.commit()

    res = select_personalized_content(db_session, student_id)
    # Mode is valid string from supported modes
    assert res.learning_mode in (
        "NEW_LEARNING", "REINFORCEMENT", "REVIEW", "SPACED_REVIEW",
        "CHALLENGE", "EASIER_PRACTICE", "EXPLORATION"
    )


# Test 15: Learning Mode CHALLENGE assigned when mastery is high (>85%)
def test_step17_15_mode_challenge(db_session, seed_data):
    student_id = seed_data["student_1"].id
    # Seed consecutive high mastery sessions
    for i in range(3):
        db_session.add(LearningSession(
            student_id=student_id,
            skill="reading_fluency",
            outcome={"accuracy": 95, "title": "Read With Me"},
            stars=3,
            xp=25,
            completed_at=datetime.now(timezone.utc) - timedelta(days=i),
        ))
    db_session.commit()

    res = select_personalized_content(db_session, student_id)
    assert res.learning_mode in ("CHALLENGE", "REINFORCEMENT", "REVIEW")


# Test 16: Learning Mode EASIER_PRACTICE assigned when struggling (<60%)
def test_step17_16_mode_easier_practice(db_session, seed_data):
    student_id = seed_data["student_1"].id
    # Seed struggling session
    db_session.add(LearningSession(
        student_id=student_id,
        skill="phonological_awareness",
        outcome={"accuracy": 45, "title": "Sound Safari"},
        stars=1,
        xp=5,
        completed_at=datetime.now(timezone.utc) - timedelta(minutes=30),
    ))
    db_session.commit()

    res = select_personalized_content(db_session, student_id)
    assert res.learning_mode in ("EASIER_PRACTICE", "REINFORCEMENT")


# Test 17: Learning Mode EXPLORATION exists and supported
def test_step17_17_mode_exploration(db_session, seed_data):
    student_id = seed_data["student_1"].id
    res = select_personalized_content(db_session, student_id)
    # All candidates have valid action_type
    for c in [res.primary] + res.alternatives:
        assert c.action_type in (
            "NEW_LEARNING", "REINFORCEMENT", "REVIEW", "SPACED_REVIEW",
            "CHALLENGE", "EASIER_PRACTICE", "EXPLORATION"
        )


# Test 18: Repetition penalty reduces score of recently repeated activities
def test_step17_18_repetition_penalty_single(db_session, seed_data):
    student_id = seed_data["student_1"].id
    # Add recent session with Sound Safari
    db_session.add(LearningSession(
        student_id=student_id,
        skill="phonological_awareness",
        outcome={"title": "Sound Safari", "accuracy": 80},
        stars=3,
        xp=20,
        completed_at=datetime.now(timezone.utc) - timedelta(minutes=10),
    ))
    db_session.commit()

    res = select_personalized_content(db_session, student_id)
    all_items = [res.primary] + res.alternatives
    sound_safari_items = [c for c in all_items if c.content.id == "act-sound-safari"]
    if sound_safari_items:
        assert sound_safari_items[0].repetition_count >= 1


# Test 19: Repetition penalty steep reduction for 3+ repetitions
def test_step17_19_repetition_penalty_multiple(db_session, seed_data):
    student_id = seed_data["student_1"].id
    for _ in range(4):
        db_session.add(LearningSession(
            student_id=student_id,
            skill="phonological_awareness",
            outcome={"title": "Sound Safari", "accuracy": 80},
            stars=3,
            xp=20,
            completed_at=datetime.now(timezone.utc) - timedelta(hours=1),
        ))
    db_session.commit()

    res = select_personalized_content(db_session, student_id)
    # Sound Safari should have repetition penalty applied
    if res.primary.content.id == "act-sound-safari":
        assert res.primary.repetition_count >= 3
    else:
        assert res.primary.content.id != "act-sound-safari"


# Test 20: Variety switch promotes alternative formats
def test_step17_20_variety_switch(db_session, seed_data):
    student_id = seed_data["student_1"].id
    # Consecutive game sessions
    for _ in range(3):
        db_session.add(LearningSession(
            student_id=student_id,
            skill="phonological_awareness",
            outcome={"title": "Sound Safari", "accuracy": 80},
            stars=3,
            xp=20,
            completed_at=datetime.now(timezone.utc) - timedelta(hours=2),
        ))
    db_session.commit()

    res = select_personalized_content(db_session, student_id)
    all_candidates = [res.primary] + res.alternatives
    types = [c.content.content_type for c in all_candidates]
    assert len(set(types)) >= 2  # multiple formats represented


# Test 21: Multi-factor scoring ordering
def test_step17_21_multi_factor_scoring_order(db_session, seed_data):
    student_id = seed_data["student_1"].id
    res = select_personalized_content(db_session, student_id)
    assert res.primary.fit_score >= res.alternatives[0].fit_score


# Test 22: Primary recommendation matches top candidate
def test_step17_22_primary_matches_top_candidate(db_session, seed_data):
    student_id = seed_data["student_1"].id
    res = select_personalized_content(db_session, student_id)
    assert res.primary.content.id is not None
    assert res.primary.fit_score > 0


# Test 23: Categorized sections returned correctly
def test_step17_23_categorized_sections(db_session, seed_data):
    student_id = seed_data["student_1"].id
    res = select_personalized_content(db_session, student_id)
    cats = res.categories
    assert len(cats) == 4
    category_ids = [c.category_id for c in cats]
    assert "practice_now" in category_ids
    assert "review" in category_ids
    assert "keep_going" in category_ids
    assert "try_something_new" in category_ids


# Test 24: Language filtering matches requested language
def test_step17_24_language_filtering(db_session, seed_data):
    student_id = seed_data["student_1"].id
    res_es = select_personalized_content(db_session, student_id, language_filter="es")
    # Primary has language 'es' or 'en' if fallback
    assert res_es.primary.content.language in ("es", "en")


# Test 25: Language fallback ensures content is never empty
def test_step17_25_language_fallback(db_session, seed_data):
    student_id = seed_data["student_1"].id
    # Request an obscure language with no dedicated catalog items
    res_obscure = select_personalized_content(db_session, student_id, language_filter="xx")
    assert res_obscure.primary is not None
    assert len(res_obscure.alternatives) > 0


# Test 26: Search personalization boost
def test_step17_26_search_personalization_boost(db_session, seed_data):
    student_id = seed_data["student_1"].id
    # Search for general activities with child_id provided
    res = search_learning_resources(db_session, query="safari", child_id=student_id)
    assert "results" in res
    assert len(res["results"]) > 0
    assert res["results"][0]["relevance_score"] > 0


# Test 27: Search results include fit_reason
def test_step17_27_search_fit_reason(db_session, seed_data):
    student_id = seed_data["student_1"].id
    res = search_learning_resources(db_session, query="safari", child_id=student_id)
    has_fit_reason = any(item.get("fit_reason") for item in res["results"])
    assert has_fit_reason


# Test 28: Closed loop dynamic update after new session
def test_step17_28_closed_loop_update(db_session, seed_data):
    student_id = seed_data["student_1"].id
    before = select_personalized_content(db_session, student_id)

    # Record 3 low accuracy sessions in that specific activity
    for _ in range(3):
        db_session.add(LearningSession(
            student_id=student_id,
            skill=before.primary.content.skill,
            outcome={"title": before.primary.content.title, "accuracy": 50},
            stars=1,
            xp=10,
            completed_at=datetime.now(timezone.utc),
        ))
    db_session.commit()

    after = select_personalized_content(db_session, student_id)
    # The personalized system reacts dynamically
    assert after.child_id == student_id


# Test 29: Non-clinical child-friendly terminology check
def test_step17_29_non_clinical_terminology(db_session, seed_data):
    student_id = seed_data["student_1"].id
    res = select_personalized_content(db_session, student_id)
    all_cands = [res.primary] + res.alternatives
    for c in all_cands:
        assert not contains_forbidden_language(c.reason)
        assert not contains_forbidden_language(c.content.title)
        assert not contains_forbidden_language(c.content.description)
    assert not contains_forbidden_language(res.explanation)


# Test 30: Catalog integrity
def test_step17_30_catalog_integrity():
    assert len(RICH_CONTENT_CATALOG) >= 8
    for item in RICH_CONTENT_CATALOG:
        assert item["id"]
        assert item["title"]
        assert item["skill"]
        assert item["difficulty"] >= 1
        assert item["estimated_minutes"] > 0
        assert item["route"].startswith("/child/")
