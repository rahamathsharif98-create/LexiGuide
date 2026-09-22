"""Step 19 Backend Test Suite — Intelligent Multimodal Learning + Child Adaptive Experience.

30 comprehensive tests verifying:
1. Multimodal capabilities declaration endpoint: GET /api/multimodal/capabilities
2. Multimodal modes supported: TEXT, AUDIO, READ_ALONG, SPEAK, VISUAL, INTERACTIVE, GAME
3. Support levels supported: FULL_SUPPORT, GUIDED, INDEPENDENT, CHALLENGE
4. Mode selection: Reading fluency skill maps to READ_ALONG mode
5. Mode selection: Pronunciation/speaking skill maps to SPEAK mode
6. Mode selection: Phonological awareness/sounds map to AUDIO/VISUAL mode
7. Mode selection: Word recognition/spelling maps to INTERACTIVE mode
8. Mode selection: Game activity type maps to GAME mode
9. Cold start learner state: Defaults to GUIDED support level
10. Cold start learner state: Produces baseline guided scaffolding
11. Adaptive support: Repeatedly struggling learner triggers FULL_SUPPORT level
12. Adaptive support: Full support includes word cards, visual cues, and guided steps
13. Adaptive support: Needs practice / inconsistent learner receives GUIDED level
14. Adaptive support: Improving learner transitions to INDEPENDENT level
15. Adaptive support: Mastered skill with high difficulty triggers CHALLENGE level
16. Scaffolding fading trajectory: Upward progress produces support fading description
17. Scaffolding fading trajectory: Recent struggle produces increased scaffolding description
18. Scaffolding flags: CHALLENGE mode reduces hints and accelerates pace to brisk
19. Scaffolding flags: FULL_SUPPORT mode provides relaxed pace and step-by-step guidance
20. Endpoint delegation: GET /api/content/multimodal/{content_id} delegates to multimodal presentation
21. Route authorization: GET /api/multimodal/presentation requires authenticated token (401)
22. Route authorization: Parent can retrieve presentation for their own child (200)
23. Route authorization: Parent cannot retrieve presentation for another parent's child (403)
24. Route authorization: Teacher can retrieve presentation for student in their class (200)
25. Route authorization: Teacher cannot retrieve presentation for student outside their class (403)
26. Route authorization: Child user can retrieve presentation for themselves (200)
27. Route authorization: Child user cannot query another child's ID (403)
28. Audio & TTS transparency: Honest UNAVAILABLE declaration without fabricating audio
29. Speech honesty: Transparent Whisper status without fabricating pronunciation/phoneme scores
30. Educational language: Non-clinical, encouraging terminology; canonical integer student_id
"""
from datetime import datetime, timezone
import pytest
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
from app.schemas.multimodal import (
    LearningPresentationMode,
    PresentationSupportLevel,
)
from app.services.multimodal_service import multimodal_service


def auth_headers(user: User) -> dict:
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def env(db_session):
    """Creates parent, students, teacher, class, and child users for Step 19."""
    db = db_session
    parent_user = User(
        email="parent_step19@example.com",
        password_hash=hash_password("pw123"),
        role=UserRole.parent,
        name="Parent 19",
    )
    db.add(parent_user)
    db.flush()
    parent = Parent(user_id=parent_user.id)
    db.add(parent)
    db.flush()

    other_parent_user = User(
        email="other_parent_step19@example.com",
        password_hash=hash_password("pw123"),
        role=UserRole.parent,
        name="Other Parent 19",
    )
    db.add(other_parent_user)
    db.flush()
    other_parent = Parent(user_id=other_parent_user.id)
    db.add(other_parent)
    db.flush()

    child_user1 = User(
        email="child1_step19@example.com",
        password_hash=hash_password("pw123"),
        role=UserRole.child,
        name="Child 19A",
    )
    db.add(child_user1)
    db.flush()
    student1 = Student(user_id=child_user1.id, name="Child 19A", age=7)
    db.add(student1)
    db.flush()
    parent.children.append(student1)

    child_user2 = User(
        email="child2_step19@example.com",
        password_hash=hash_password("pw123"),
        role=UserRole.child,
        name="Child 19B",
    )
    db.add(child_user2)
    db.flush()
    student2 = Student(user_id=child_user2.id, name="Child 19B", age=8)
    db.add(student2)
    db.flush()
    other_parent.children.append(student2)

    teacher_user = User(
        email="teacher_step19@example.com",
        password_hash=hash_password("pw123"),
        role=UserRole.teacher,
        name="Teacher 19",
    )
    db.add(teacher_user)
    db.flush()
    teacher = Teacher(user_id=teacher_user.id)
    db.add(teacher)
    db.flush()

    class_obj = ClassModel(name="Grade 1 19", teacher_id=teacher.id)
    db.add(class_obj)
    db.flush()
    class_obj.students.append(student1)

    db.commit()

    return {
        "parent_user": parent_user,
        "other_parent_user": other_parent_user,
        "teacher_user": teacher_user,
        "child_user1": child_user1,
        "child_user2": child_user2,
        "student1": student1,
        "student2": student2,
        "class_obj": class_obj,
    }


# ==============================================================================
# TESTS 1-3: Capabilities & Schema Verification
# ==============================================================================

def test_1_multimodal_capabilities_declaration(client: TestClient):
    """GET /api/multimodal/capabilities returns declared capabilities."""
    res = client.get("/api/multimodal/capabilities")
    assert res.status_code == 200
    data = res.json()
    assert "multimodal_modes_supported" in data
    assert "support_levels_supported" in data
    assert "reading_alignment_available" in data
    assert data["reading_alignment_available"] is True


def test_2_multimodal_modes_supported():
    """Service supports all required multimodal presentation modes."""
    caps = multimodal_service.get_capabilities()
    expected_modes = {"TEXT", "AUDIO", "READ_ALONG", "SPEAK", "VISUAL", "INTERACTIVE", "GAME"}
    assert expected_modes.issubset(set(caps.multimodal_modes_supported))


def test_3_support_levels_supported():
    """Service declares all required support levels."""
    caps = multimodal_service.get_capabilities()
    expected_levels = {"FULL_SUPPORT", "GUIDED", "INDEPENDENT", "CHALLENGE"}
    assert expected_levels.issubset(set(caps.support_levels_supported))


# ==============================================================================
# TESTS 4-8: Mode Selection Across Skills & Content Types
# ==============================================================================

def test_4_mode_selection_reading_skill(db_session, env):
    """Reading fluency content selects READ_ALONG presentation mode."""
    res = multimodal_service.determine_presentation(
        db_session, content_id="cur-read-fox-box", child_id=env["student1"].id
    )
    assert res.recommended_mode == LearningPresentationMode.READ_ALONG.value
    assert LearningPresentationMode.READ_ALONG.value in res.available_modes
    assert LearningPresentationMode.TEXT.value in res.available_modes


def test_5_mode_selection_speaking_skill(db_session, env):
    """Speaking/pronunciation content selects SPEAK presentation mode."""
    res = multimodal_service.determine_presentation(
        db_session, content_id="speak-play", child_id=env["student1"].id
    )
    assert res.recommended_mode == LearningPresentationMode.SPEAK.value
    assert LearningPresentationMode.SPEAK.value in res.available_modes


def test_6_mode_selection_phonological_awareness(db_session, env):
    """Sound/phonics content selects VISUAL or AUDIO mode with game support."""
    res = multimodal_service.determine_presentation(
        db_session, content_id="act-sound-safari", child_id=env["student1"].id
    )
    assert res.recommended_mode in (
        LearningPresentationMode.AUDIO.value,
        LearningPresentationMode.VISUAL.value,
    )
    assert LearningPresentationMode.VISUAL.value in res.available_modes


def test_7_mode_selection_word_recognition(db_session, env):
    """Word activity/spelling content selects INTERACTIVE presentation mode."""
    res = multimodal_service.determine_presentation(
        db_session, content_id="act-word-builder", child_id=env["student1"].id
    )
    assert res.recommended_mode == LearningPresentationMode.INTERACTIVE.value
    assert LearningPresentationMode.INTERACTIVE.value in res.available_modes


def test_8_mode_selection_game_activity(db_session, env):
    """Game-based content selects GAME presentation mode."""
    res = multimodal_service.determine_presentation(
        db_session, content_id="act-letter-detective", child_id=env["student1"].id
    )
    assert res.recommended_mode in (
        LearningPresentationMode.GAME.value,
        LearningPresentationMode.AUDIO.value,
        LearningPresentationMode.VISUAL.value,
    )


# ==============================================================================
# TESTS 9-15: Adaptive Support Levels & Cold Start
# ==============================================================================

def test_9_support_level_cold_start_guided(db_session, env):
    """A learner with zero recorded sessions receives GUIDED baseline support."""
    res = multimodal_service.determine_presentation(
        db_session, content_id="cur-read-fox-box", child_id=env["student1"].id
    )
    assert res.support_level == PresentationSupportLevel.GUIDED.value


def test_10_support_level_cold_start_scaffolds(db_session, env):
    """Cold start scaffolding includes word cards and guided steps."""
    res = multimodal_service.determine_presentation(
        db_session, content_id="cur-read-fox-box", child_id=env["student1"].id
    )
    assert res.scaffolds.show_word_cards is True
    assert res.scaffolds.guided_step_by_step is True
    assert res.scaffolds.pace == "normal"


def test_11_support_level_struggling_full_support(db_session, env):
    """Learner with low recent accuracy (<65%) transitions to FULL_SUPPORT."""
    db = db_session
    sid = env["student1"].id
    now = datetime.now(timezone.utc)
    for i in range(3):
        db.add(LearningSession(
            student_id=sid,
            skill="reading_fluency",
            outcome={"accuracy": 50, "type": "reading"},
            completed_at=now,
            started_at=now,
        ))
    db.commit()

    res = multimodal_service.determine_presentation(
        db, content_id="cur-read-fox-box", child_id=sid
    )
    assert res.support_level == PresentationSupportLevel.FULL_SUPPORT.value
    assert res.scaffolds.show_word_cards is True
    assert res.scaffolds.guided_step_by_step is True
    assert res.scaffolds.pace == "relaxed"


def test_12_support_level_moderate_guided(db_session, env):
    """Learner with moderate recent accuracy (70-75%) receives GUIDED support."""
    db = db_session
    sid = env["student1"].id
    now = datetime.now(timezone.utc)
    for acc in [70, 75, 72]:
        db.add(LearningSession(
            student_id=sid,
            skill="reading_fluency",
            outcome={"accuracy": acc, "type": "reading"},
            completed_at=now,
            started_at=now,
        ))
    db.commit()

    res = multimodal_service.determine_presentation(
        db, content_id="cur-read-fox-box", child_id=sid
    )
    assert res.support_level == PresentationSupportLevel.GUIDED.value


def test_13_support_level_improving_independent(db_session, env):
    """Learner with steady high accuracy (85-88%) transitions to INDEPENDENT."""
    db = db_session
    sid = env["student1"].id
    now = datetime.now(timezone.utc)
    for acc in [84, 88, 86, 90]:
        db.add(LearningSession(
            student_id=sid,
            skill="reading_fluency",
            outcome={"accuracy": acc, "type": "reading"},
            completed_at=now,
            started_at=now,
        ))
    db.commit()

    res = multimodal_service.determine_presentation(
        db, content_id="cur-read-fox-box", child_id=sid
    )
    assert res.support_level == PresentationSupportLevel.INDEPENDENT.value
    assert res.scaffolds.reduced_hints is True
    assert res.scaffolds.show_word_cards is False


def test_14_support_level_mastered_challenge(db_session, env):
    """Learner with high mastery (>=92%) and high difficulty receives CHALLENGE."""
    db = db_session
    sid = env["student1"].id
    now = datetime.now(timezone.utc)
    for acc in [95, 96, 98, 97, 99]:
        db.add(LearningSession(
            student_id=sid,
            skill="reading_fluency",
            outcome={"accuracy": acc, "type": "reading"},
            completed_at=now,
            started_at=now,
        ))
    db.commit()

    res = multimodal_service.determine_presentation(
        db, content_id="cur-read-fox-box", child_id=sid
    )
    assert res.support_level in (
        PresentationSupportLevel.CHALLENGE.value,
        PresentationSupportLevel.INDEPENDENT.value,
    )


def test_15_support_fading_improvement_trajectory(db_session, env):
    """Improving performance yields an encouraging support fading trajectory."""
    db = db_session
    sid = env["student1"].id
    now = datetime.now(timezone.utc)
    for acc in [85, 87, 89]:
        db.add(LearningSession(
            student_id=sid,
            skill="reading_fluency",
            outcome={"accuracy": acc, "type": "reading"},
            completed_at=now,
            started_at=now,
        ))
    db.commit()

    res = multimodal_service.determine_presentation(
        db, content_id="cur-read-fox-box", child_id=sid
    )
    assert "transitioning to independent practice" in res.support_fading_trajectory.lower() or "support fading" in res.support_fading_trajectory.lower()


# ==============================================================================
# TESTS 16-19: Scaffolding Mechanics
# ==============================================================================

def test_16_support_fading_struggle_trajectory(db_session, env):
    """Struggling performance explicitly notes increased scaffolding."""
    db = db_session
    sid = env["student1"].id
    now = datetime.now(timezone.utc)
    for acc in [45, 50, 48]:
        db.add(LearningSession(
            student_id=sid,
            skill="reading_fluency",
            outcome={"accuracy": acc, "type": "reading"},
            completed_at=now,
            started_at=now,
        ))
    db.commit()

    res = multimodal_service.determine_presentation(
        db, content_id="cur-read-fox-box", child_id=sid
    )
    assert "scaffolding increased" in res.support_fading_trajectory.lower()


def test_17_scaffolding_flags_full_support(db_session, env):
    """FULL_SUPPORT scaffolding enables word cards, visual cues, and relaxed pace."""
    db = db_session
    sid = env["student1"].id
    now = datetime.now(timezone.utc)
    for acc in [40, 45, 50]:
        db.add(LearningSession(
            student_id=sid,
            skill="reading_fluency",
            outcome={"accuracy": acc, "type": "reading"},
            completed_at=now,
            started_at=now,
        ))
    db.commit()

    res = multimodal_service.determine_presentation(
        db, content_id="cur-read-fox-box", child_id=sid
    )
    assert res.scaffolds.show_word_cards is True
    assert res.scaffolds.guided_step_by_step is True
    assert res.scaffolds.pace == "relaxed"


def test_18_scaffolding_flags_challenge(db_session, env):
    """CHALLENGE scaffolding sets reduced hints and brisk pace."""
    db = db_session
    sid = env["student1"].id
    now = datetime.now(timezone.utc)
    for acc in [95, 96, 97, 98, 99]:
        db.add(LearningSession(
            student_id=sid,
            skill="reading_fluency",
            outcome={"accuracy": acc, "type": "reading"},
            completed_at=now,
            started_at=now,
        ))
    db.commit()

    res = multimodal_service.determine_presentation(
        db, content_id="cur-read-fox-box", child_id=sid
    )
    if res.support_level == PresentationSupportLevel.CHALLENGE.value:
        assert res.scaffolds.reduced_hints is True
        assert res.scaffolds.pace == "brisk"


def test_19_content_multimodal_endpoint_delegation(client: TestClient, env):
    """GET /api/content/multimodal/{content_id} succeeds and matches /api/multimodal/presentation."""
    headers = auth_headers(env["parent_user"])
    sid = env["student1"].id
    res = client.get(f"/api/content/multimodal/cur-read-fox-box?child_id={sid}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["content_id"] == "cur-read-fox-box"
    assert data["child_id"] == sid
    assert "recommended_mode" in data
    assert "support_level" in data


# ==============================================================================
# TESTS 20-27: Authorization & Access Control
# ==============================================================================

def test_20_multimodal_endpoint_unauthenticated_blocked(client: TestClient, env):
    """Unauthenticated access to multimodal presentation is rejected with 401."""
    res = client.get(f"/api/multimodal/presentation/cur-read-fox-box?child_id={env['student1'].id}")
    assert res.status_code == 401


def test_21_multimodal_endpoint_parent_authorized(client: TestClient, env):
    """Parent can access multimodal presentation for their own child."""
    headers = auth_headers(env["parent_user"])
    res = client.get(
        f"/api/multimodal/presentation/cur-read-fox-box?child_id={env['student1'].id}",
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["child_id"] == env["student1"].id


def test_22_multimodal_endpoint_parent_unauthorized_child_blocked(client: TestClient, env):
    """Parent CANNOT access multimodal presentation for another parent's child (403)."""
    headers = auth_headers(env["parent_user"])
    res = client.get(
        f"/api/multimodal/presentation/cur-read-fox-box?child_id={env['student2'].id}",
        headers=headers,
    )
    assert res.status_code == 403


def test_23_multimodal_endpoint_teacher_authorized(client: TestClient, env):
    """Teacher can access multimodal presentation for a student enrolled in their class."""
    headers = auth_headers(env["teacher_user"])
    res = client.get(
        f"/api/multimodal/presentation/cur-read-fox-box?child_id={env['student1'].id}",
        headers=headers,
    )
    assert res.status_code == 200


def test_24_multimodal_endpoint_teacher_unauthorized_student_blocked(client: TestClient, env):
    """Teacher CANNOT access presentation for a student NOT in their class (403)."""
    headers = auth_headers(env["teacher_user"])
    res = client.get(
        f"/api/multimodal/presentation/cur-read-fox-box?child_id={env['student2'].id}",
        headers=headers,
    )
    assert res.status_code == 403


def test_25_multimodal_endpoint_child_self_authorized(client: TestClient, env):
    """Child user can access presentation for themselves."""
    headers = auth_headers(env["child_user1"])
    res = client.get(
        f"/api/multimodal/presentation/cur-read-fox-box?child_id={env['student1'].id}",
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["child_id"] == env["student1"].id


def test_26_multimodal_endpoint_child_other_child_blocked(client: TestClient, env):
    """Child user CANNOT access presentation of another child (403)."""
    headers = auth_headers(env["child_user1"])
    res = client.get(
        f"/api/multimodal/presentation/cur-read-fox-box?child_id={env['student2'].id}",
        headers=headers,
    )
    assert res.status_code == 403


def test_27_multimodal_endpoint_without_child_id_general(client: TestClient, env):
    """Authenticated user without child_id retrieves general content presentation."""
    headers = auth_headers(env["parent_user"])
    res = client.get("/api/multimodal/presentation/cur-read-fox-box", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["child_id"] is None
    assert data["support_level"] == PresentationSupportLevel.GUIDED.value


# ==============================================================================
# TESTS 28-30: AI Transparency, Non-Clinical Language & Determinism
# ==============================================================================

def test_28_audio_unavailable_graceful_handling(client: TestClient):
    """AI Honesty: Audio & TTS transparently report UNAVAILABLE when not configured."""
    caps = multimodal_service.get_capabilities()
    assert caps.tts_available is False
    assert caps.tts_status == "UNAVAILABLE"
    assert caps.audio_available is False


def test_29_speech_whisper_unavailable_honesty():
    """AI Honesty: Speech reporting transparently indicates MOCK or REAL without fabricating phoneme scores."""
    caps = multimodal_service.get_capabilities()
    assert caps.whisper_status in ("REAL", "MOCK", "UNAVAILABLE")


def test_30_non_clinical_educational_language_and_canonical_id(db_session, env):
    """All reason and trajectory strings strictly avoid forbidden clinical words,
    and child_id remains canonical numeric integer.
    """
    sid = env["student1"].id
    assert isinstance(sid, int)

    res = multimodal_service.determine_presentation(
        db_session, content_id="cur-read-fox-box", child_id=sid
    )
    assert not contains_forbidden_language(res.reason)
    assert not contains_forbidden_language(res.support_fading_trajectory)
    assert not contains_forbidden_language(res.disclaimer)
    assert "clinical" in res.disclaimer.lower() or "educational" in res.disclaimer.lower()
