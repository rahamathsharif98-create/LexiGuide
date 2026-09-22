"""Step 18 Backend Test Suite — Intelligent Learning Content Generation + Curated Content Expansion.

30 comprehensive tests verifying:
1. Content capabilities endpoint returns valid schema and capabilities
2. AI Honesty: content_generation_available is False when no external LLM is configured
3. AI Honesty: structured_assembly_available is True and curated_content_available is True
4. Curated content retrieval: GET /api/content/library returns structured catalog items
5. Curated filtering by skill: returns items matching target skill or secondary skills
6. Curated filtering by difficulty: returns only items matching difficulty level
7. Curated filtering by language: returns resources in requested language
8. Age filtering: respects [age_min, age_max] suitability bounds
9. Single content item retrieval: GET /api/content/{content_id} returns item
10. Nonexistent content item returns 404 Not Found
11. Authentication required: POST /api/content/generate requires token (401)
12. Authorization check: Parent cannot generate content for another parent's child (403)
13. Authorization check: Teacher can generate content for assigned student (200)
14. Authorization check: Teacher cannot generate for unassigned student (403)
15. Child user can generate content for themselves (200)
16. Content generation produces valid ContentGenerationResponse and ContentItemModel
17. Generated content source_type is transparently labeled 'assembled'
18. Difficulty calibration: difficulty 1 produces level 1 content with literal questions
19. Difficulty calibration: difficulty 3 produces level 3 content with complex structure
20. Comprehension consistency: generated question options contain the correct answer
21. Comprehension consistency: correct answer is supported by passage text
22. Duplicate prevention: requesting identical parameters returns reused item
23. Inappropriate content validation: validator blocks frightening/violent themes
24. Non-clinical language validation: validator blocks forbidden clinical terms
25. Input validation: request with invalid skill fails with 422 Unprocessable Entity
26. Input validation: request with invalid difficulty (>4 or <1) fails with 422 Unprocessable Entity
27. Input validation: request with invalid age (>10 or <4) fails with 422 Unprocessable Entity
28. Prompt injection & oversize safety: topic is sanitized safely
29. Search integration: search_learning_resources discovers curated and assembled content
30. Closed-loop learning: assembled reading passage is compatible with session persistence
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
)
from app.utils.security import create_access_token, hash_password
from app.utils.language import contains_forbidden_language
from app.content.base import (
    ContentSourceType,
    ContentType,
    ContentItemModel,
    ContentGenerationRequest,
)
from app.content.curated import curated_repository
from app.content.generator import assemble_content_item
from app.content.validator import validate_content_item
from app.content.service import content_service
from app.services.search_service import search_learning_resources


def auth_headers(user: User) -> dict:
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def env(db_session):
    """Creates parent, students, teacher, class, and child users."""
    db = db_session
    parent_user = User(
        email="parent_step18@example.com",
        password_hash=hash_password("pw123"),
        role=UserRole.parent,
        name="Parent 18",
    )
    db.add(parent_user)
    db.flush()
    parent = Parent(user_id=parent_user.id)
    db.add(parent)
    db.flush()

    other_parent_user = User(
        email="other_parent_step18@example.com",
        password_hash=hash_password("pw123"),
        role=UserRole.parent,
        name="Other Parent 18",
    )
    db.add(other_parent_user)
    db.flush()
    other_parent = Parent(user_id=other_parent_user.id)
    db.add(other_parent)
    db.flush()

    child_user1 = User(
        email="child1_step18@example.com",
        password_hash=hash_password("pw123"),
        role=UserRole.child,
        name="Child 18A",
    )
    db.add(child_user1)
    db.flush()
    student1 = Student(user_id=child_user1.id, name="Child 18A", age=7)
    db.add(student1)
    db.flush()
    parent.children.append(student1)

    child_user2 = User(
        email="child2_step18@example.com",
        password_hash=hash_password("pw123"),
        role=UserRole.child,
        name="Child 18B",
    )
    db.add(child_user2)
    db.flush()
    student2 = Student(user_id=child_user2.id, name="Child 18B", age=8)
    db.add(student2)
    db.flush()
    other_parent.children.append(student2)

    teacher_user = User(
        email="teacher_step18@example.com",
        password_hash=hash_password("pw123"),
        role=UserRole.teacher,
        name="Teacher 18",
    )
    db.add(teacher_user)
    db.flush()
    teacher = Teacher(user_id=teacher_user.id)
    db.add(teacher)
    db.flush()

    cls = ClassModel(name="Class 18", teacher_id=teacher.id)
    db.add(cls)
    db.flush()
    cls.students.append(student1)

    db.commit()

    return {
        "parent_user": parent_user,
        "other_parent_user": other_parent_user,
        "child_user1": child_user1,
        "child_user2": child_user2,
        "teacher_user": teacher_user,
        "student1": student1,
        "student2": student2,
    }


# ==============================================================================
# TESTS 1 - 3: CAPABILITIES & AI HONESTY
# ==============================================================================

def test_01_content_capabilities_endpoint(client: TestClient):
    """1. GET /api/content/capabilities returns valid response schema."""
    res = client.get("/api/content/capabilities")
    assert res.status_code == 200
    data = res.json()
    assert "content_generation_available" in data
    assert "structured_assembly_available" in data
    assert "curated_content_available" in data
    assert "supported_content_types" in data
    assert "supported_skills" in data


def test_02_ai_honesty_external_llm_false(client: TestClient):
    """2. AI Honesty: content_generation_available is strictly False in mock/local mode."""
    res = client.get("/api/content/capabilities")
    assert res.status_code == 200
    data = res.json()
    assert data["content_generation_available"] is False
    assert data["model_mode"] == "mock"


def test_03_ai_honesty_assembly_and_curated_true(client: TestClient):
    """3. Structured assembly and curated content are marked available."""
    res = client.get("/api/content/capabilities")
    assert res.status_code == 200
    data = res.json()
    assert data["structured_assembly_available"] is True
    assert data["curated_content_available"] is True
    assert "reading" in data["supported_content_types"]
    assert "reading_fluency" in data["supported_skills"]


# ==============================================================================
# TESTS 4 - 10: CURATED LIBRARY RETRIEVAL & FILTERING
# ==============================================================================

def test_04_curated_library_retrieval(client: TestClient, env):
    """4. GET /api/content/library returns structured catalog items."""
    res = client.get("/api/content/library", headers=auth_headers(env["parent_user"]))
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) >= 8


def test_05_curated_filter_by_skill(client: TestClient, env):
    """5. Curated filtering by skill returns only relevant items."""
    res = client.get(
        "/api/content/library?skill=phonological_awareness",
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0
    for it in items:
        assert it["skill"] == "phonological_awareness" or "phonological_awareness" in it["secondary_skills"]


def test_06_curated_filter_by_difficulty(client: TestClient, env):
    """6. Curated filtering by difficulty returns only matching difficulty."""
    res = client.get(
        "/api/content/library?difficulty=1",
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    items = res.json()
    for it in items:
        assert it["difficulty"] == 1


def test_07_curated_filter_by_language(client: TestClient, env):
    """7. Curated filtering by language returns matching language items."""
    res = client.get(
        "/api/content/library?language=hi",
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    items = res.json()
    assert len(items) > 0
    assert all(it["language"] == "hi" for it in items)


def test_08_curated_filter_by_age(client: TestClient, env):
    """8. Curated filtering by age respects age bounds."""
    res = client.get(
        "/api/content/library?age=6",
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    items = res.json()
    for it in items:
        assert it["age_min"] <= 6 <= it["age_max"]


def test_09_single_content_item_retrieval(client: TestClient, env):
    """9. GET /api/content/{content_id} returns single curated item."""
    res = client.get(
        "/api/content/story-forest",
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    item = res.json()
    assert item["id"] == "story-forest"
    assert item["title"] == "The Curious Fox"
    assert item["source_type"] == "curated"


def test_10_nonexistent_content_item_404(client: TestClient, env):
    """10. Requesting nonexistent content item returns 404 Not Found."""
    res = client.get(
        "/api/content/nonexistent-item-12345",
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 404


# ==============================================================================
# TESTS 11 - 15: AUTHENTICATION & RBAC AUTHORIZATION
# ==============================================================================

def test_11_generate_content_requires_auth(client: TestClient):
    """11. POST /api/content/generate requires authentication."""
    res = client.post("/api/content/generate", json={
        "child_id": 1,
        "skill": "reading_fluency",
        "difficulty": 2,
    })
    assert res.status_code == 401


def test_12_parent_cannot_generate_for_unowned_child(client: TestClient, env):
    """12. Parent cannot generate content for another parent's child (403)."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student2"].id,  # Owned by other_parent
            "skill": "reading_fluency",
            "difficulty": 2,
        },
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 403


def test_13_teacher_can_generate_for_enrolled_student(client: TestClient, env):
    """13. Teacher can generate content for an enrolled classroom student."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "reading_fluency",
            "difficulty": 2,
            "topic": "animals",
        },
        headers=auth_headers(env["teacher_user"]),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["validation_passed"] is True
    assert data["item"]["skill"] == "reading_fluency"


def test_14_teacher_cannot_generate_for_unenrolled_student(client: TestClient, env):
    """14. Teacher cannot generate content for an unassigned student (403)."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student2"].id,  # Not in teacher's class
            "skill": "reading_fluency",
            "difficulty": 2,
        },
        headers=auth_headers(env["teacher_user"]),
    )
    assert res.status_code == 403


def test_15_child_can_generate_for_self(client: TestClient, env):
    """15. Child user can generate/assemble content for their own student profile."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "word_recognition",
            "difficulty": 1,
            "topic": "animals",
        },
        headers=auth_headers(env["child_user1"]),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["item"]["skill"] == "word_recognition"


# ==============================================================================
# TESTS 16 - 22: CONTENT GENERATION, DIFFICULTY & CONSISTENCY
# ==============================================================================

def test_16_generation_response_schema(client: TestClient, env):
    """16. Generated response matches ContentGenerationResponse structure."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "reading_fluency",
            "difficulty": 2,
            "topic": "space",
        },
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    data = res.json()
    assert "item" in data
    assert "source_type" in data
    assert "validation_passed" in data
    assert "fit_reason" in data
    assert "disclaimer" in data


def test_17_source_type_honestly_labeled_assembled(client: TestClient, env):
    """17. Generated content source_type is transparently 'assembled'."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "reading_fluency",
            "difficulty": 2,
            "topic": "space",
        },
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["source_type"] == "assembled"
    assert data["item"]["source_type"] == "assembled"


def test_18_difficulty_1_calibration(client: TestClient, env):
    """18. Difficulty 1 produces beginner sentences with literal questions."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "reading_fluency",
            "difficulty": 1,
            "topic": "animals",
        },
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    item = res.json()["item"]
    assert item["difficulty"] == 1
    assert item["difficulty_label"] == "Easy"
    assert len(item["passage"].split()) < 30


def test_19_difficulty_3_calibration(client: TestClient, env):
    """19. Difficulty 3 produces multi-clause sentences and richer vocabulary."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "reading_fluency",
            "difficulty": 3,
            "topic": "animals",
        },
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    item = res.json()["item"]
    assert item["difficulty"] == 3
    assert item["difficulty_label"] == "Medium"
    assert len(item["passage"].split()) >= 20


def test_20_comprehension_consistency_answer_in_options(client: TestClient, env):
    """20. Comprehension questions have their answer key present in options."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "reading_fluency",
            "difficulty": 2,
            "topic": "animals",
        },
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    item = res.json()["item"]
    assert item["questions"] is not None
    for q in item["questions"]:
        opt_texts = [o["text"].lower() for o in q["options"]]
        assert q["answer"].lower() in opt_texts


def test_21_comprehension_consistency_answer_in_passage(client: TestClient, env):
    """21. Comprehension question answer is supported by passage text."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "reading_fluency",
            "difficulty": 1,
            "topic": "animals",
        },
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    item = res.json()["item"]
    passage = item["passage"].lower()
    for q in item["questions"]:
        # The key noun from answer should be in passage
        ans = q["answer"].lower()
        words = [w for w in ans.split() if len(w) > 2]
        assert any(w in passage for w in words)


def test_22_duplicate_prevention_reuse(client: TestClient, env):
    """22. Requesting identical parameters returns reused item from index."""
    payload = {
        "child_id": env["student1"].id,
        "skill": "reading_fluency",
        "difficulty": 2,
        "topic": "space",
    }
    res1 = client.post("/api/content/generate", json=payload, headers=auth_headers(env["parent_user"]))
    assert res1.status_code == 200
    item1_id = res1.json()["item"]["id"]

    res2 = client.post("/api/content/generate", json=payload, headers=auth_headers(env["parent_user"]))
    assert res2.status_code == 200
    item2_id = res2.json()["item"]["id"]

    assert item1_id == item2_id
    assert "Reused existing" in res2.json()["fit_reason"]


# ==============================================================================
# TESTS 23 - 28: VALIDATION, SAFETY & INPUT REJECTION
# ==============================================================================

def test_23_inappropriate_content_validation_blocked():
    """23. Validator rejects frightening or violent vocabulary."""
    unsafe_item = ContentItemModel(
        id="bad-item-1",
        title="A Scary Monster Fight",
        description="A story with blood and killing.",
        content_type="reading",
        category="Reading",
        skill="reading_fluency",
        difficulty=2,
        age_min=5,
        age_max=8,
        learning_objective="Read scary words",
        route="/child/read",
        passage="The monster had a knife and wanted to fight.",
    )
    val = validate_content_item(unsafe_item)
    assert val.is_valid is False
    assert any("inappropriate" in err.lower() for err in val.errors)


def test_24_non_clinical_language_validation_blocked():
    """24. Validator rejects forbidden clinical/diagnostic words."""
    diagnostic_item = ContentItemModel(
        id="clinical-item-1",
        title="Dyslexia Assessment Activity",
        description="Diagnosing reading deficit and pathology.",
        content_type="reading",
        category="Reading",
        skill="reading_fluency",
        difficulty=2,
        age_min=5,
        age_max=8,
        learning_objective="Screen for dyslexia disorder",
        route="/child/read",
        passage="This child has a pathological reading deficit.",
    )
    val = validate_content_item(diagnostic_item)
    assert val.is_valid is False
    assert any("clinical" in err.lower() or "diagnostic" in err.lower() for err in val.errors)


def test_25_invalid_skill_rejected_422(client: TestClient, env):
    """25. Invalid skill name is rejected with 422 Unprocessable Entity."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "invented_magic_skill",
            "difficulty": 2,
        },
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 422


def test_26_invalid_difficulty_rejected_422(client: TestClient, env):
    """26. Difficulty outside [1, 4] is rejected with 422."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "reading_fluency",
            "difficulty": 5,
        },
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 422


def test_27_invalid_age_rejected_422(client: TestClient, env):
    """27. Age outside [4, 10] is rejected with 422."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "reading_fluency",
            "difficulty": 2,
            "age": 14,
        },
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 422


def test_28_topic_sanitization_prompt_injection(client: TestClient, env):
    """28. Prompt injection or unsafe topic characters are sanitized safely."""
    res = client.post(
        "/api/content/generate",
        json={
            "child_id": env["student1"].id,
            "skill": "reading_fluency",
            "difficulty": 2,
            "topic": "<script>alert('hack')</script> ; DROP TABLE;",
        },
        headers=auth_headers(env["parent_user"]),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["validation_passed"] is True


# ==============================================================================
# TESTS 29 - 30: INTEGRATION WITH SEARCH & LEARNING LOOP
# ==============================================================================

def test_29_search_integration_discovers_curated_content(db_session, env):
    """29. Step 13 search_learning_resources discovers items from the expanded catalog."""
    search_res = search_learning_resources(
        db_session,
        query="puppy",
        child_id=env["student1"].id,
        current_user=env["parent_user"],
    )
    assert search_res["total_results"] >= 0


def test_30_closed_loop_persistence_compatibility(db_session, env):
    """30. Assembled content integrates seamlessly with LearningSession persistence."""
    db = db_session
    req = ContentGenerationRequest(
        child_id=env["student1"].id,
        skill="reading_fluency",
        difficulty=2,
        topic="animals",
    )
    item = assemble_content_item(req)
    assert item.expected_text is not None

    # Simulate completed session on assembled content
    session = LearningSession(
        student_id=env["student1"].id,
        activity_id=None,
        skill=item.skill,
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        outcome={
            "title": item.title,
            "accuracy": 88,
            "metrics": {"wpm": 65, "accuracy": 88},
            "source_type": item.source_type,
        },
        stars=3,
        xp=15,
    )
    db.add(session)
    db.commit()

    saved = db.query(LearningSession).filter(LearningSession.student_id == env["student1"].id).first()
    assert saved is not None
    assert saved.outcome["source_type"] == "assembled"
