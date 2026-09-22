"""Phase 9 — Adaptive Learning Engine tests.

All fixture data is hand-built with explicit, fixed timestamps/accuracies
(tests/factories.make_session) — never randomized — so every assertion
here is fully deterministic and requires no external AI service.
"""
from datetime import datetime, timedelta, timezone

from app.models import User, UserRole
from app.services.adaptive_learning_service import AdaptiveLearningEngine
from app.services import recommendation_service
from app.utils.security import hash_password
from tests.factories import make_student, make_parent, make_teacher_with_class, make_session, make_activity

NOW = datetime(2026, 9, 10, 12, 0, 0, tzinfo=timezone.utc)


def _days_ago(n):
    return NOW - timedelta(days=n)


def _login(client, db_session, email, password="pw", role=UserRole.parent):
    user = db_session.query(User).filter(User.email == email).first()
    if user is None:
        user = User(name=email, email=email, role=role, password_hash=hash_password(password))
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    token = client.post("/api/auth/login", json={"email": email, "password": password}).json()["access_token"]
    return user, token


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- 1. Learning profile generation / 19. empty history -------------------

def test_empty_history_profile(db_session):
    student = make_student(db_session)
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()

    assert set(profile.keys()) == {
        "phonological_awareness", "pronunciation", "word_recognition",
        "reading_fluency", "comprehension",
    }
    for p in profile.values():
        assert p.attempts == 0
        assert p.pattern == "not_yet_practiced"
        assert p.recommended_practice is True
        assert p.difficulty == 1  # ADAPTIVE_MIN_DIFFICULTY


# ---- 20. single-session history --------------------------------------------

def test_single_session_history_not_enough_trend(db_session):
    student = make_student(db_session)
    make_session(db_session, student.id, skill="wordRecognition", accuracy=70, started_at=_days_ago(1))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()

    wr = profile["word_recognition"]
    assert wr.attempts == 1
    assert wr.trend == "not enough data"
    assert wr.recent_performance == 70.0


# ---- 2/3. historical performance + improving trend -------------------------

def test_improving_trend_detected(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([55, 60, 64, 72]):
        make_session(db_session, student.id, skill="wordRecognition", accuracy=acc, started_at=_days_ago(4 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()

    wr = profile["word_recognition"]
    assert wr.attempts == 4
    assert wr.trend == "improving"
    assert wr.pattern == "improving"


# ---- 5. inconsistent performance -------------------------------------------

def test_inconsistent_performance_detected(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([82, 48, 85, 50]):
        make_session(db_session, student.id, skill="comprehension", accuracy=acc, started_at=_days_ago(4 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()

    c = profile["comprehension"]
    assert c.consistency == "inconsistent"
    assert c.pattern == "inconsistent"
    # Must NOT be simply labeled "weak"/needs_practice per STEP 3.
    assert c.pattern != "needs_practice"


# ---- 6. strong skill detection ---------------------------------------------

def test_consistently_strong_skill(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([85, 88, 90, 92]):
        make_session(db_session, student.id, skill="pronunciation", accuracy=acc, started_at=_days_ago(4 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()

    assert profile["pronunciation"].pattern == "consistently_strong"


# ---- 7. skill needing practice ---------------------------------------------

def test_needs_practice_moderate_performance(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([60, 62, 58, 61]):
        make_session(db_session, student.id, skill="readingFluency", accuracy=acc, started_at=_days_ago(4 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()

    assert profile["reading_fluency"].pattern == "needs_practice"


def test_repeatedly_struggling_not_a_single_bad_result(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([40, 45, 42, 38]):
        make_session(db_session, student.id, skill="phonologicalAwareness", accuracy=acc, started_at=_days_ago(4 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()

    pa = profile["phonological_awareness"]
    assert pa.pattern == "repeatedly_struggling"
    assert pa.recommended_practice is True

    # A SINGLE unusual low result should not trigger the same conclusion.
    student2 = make_student(db_session, name="Other")
    make_session(db_session, student2.id, skill="phonologicalAwareness", accuracy=30, started_at=_days_ago(1))
    engine2 = AdaptiveLearningEngine(db_session, student2.id, now=NOW)
    profile2 = engine2.analyze_learning_profile()
    assert profile2["phonological_awareness"].pattern != "repeatedly_struggling"


# ---- not practiced recently -------------------------------------------------

def test_not_practiced_recently(db_session):
    student = make_student(db_session)
    # Decent performance, but a while ago.
    for i, acc in enumerate([70, 72, 68, 71]):
        make_session(db_session, student.id, skill="comprehension", accuracy=acc, started_at=_days_ago(20 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()

    assert profile["comprehension"].pattern == "not_practiced_recently"


# ---- 8/9. difficulty increase / decrease / stability -----------------------

def test_difficulty_increases_with_high_performance(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([85, 88, 90, 92]):
        make_session(db_session, student.id, skill="wordRecognition", accuracy=acc, started_at=_days_ago(4 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()
    assert profile["word_recognition"].difficulty == 2


def test_difficulty_decreases_after_prior_increase(db_session):
    student = make_student(db_session)
    accs = [85, 88, 90, 92, 40, 42, 38, 45]
    for i, acc in enumerate(accs):
        make_session(db_session, student.id, skill="wordRecognition", accuracy=acc, started_at=_days_ago(len(accs) - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()
    # Level went 1 -> 2 (first chunk high) -> 1 (second chunk low): net
    # change is gradual (one step at a time), never a jump straight from
    # Beginner to Advanced.
    assert profile["word_recognition"].difficulty == 1


def test_difficulty_stable_with_moderate_performance(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([60, 62, 58, 61]):
        make_session(db_session, student.id, skill="wordRecognition", accuracy=acc, started_at=_days_ago(4 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()
    assert profile["word_recognition"].difficulty == 1  # unchanged from the starting Beginner level


# ---- 11. next-best activity -------------------------------------------------

def test_next_best_activity_shape_and_explainability(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([40, 45, 42, 38]):
        make_session(db_session, student.id, skill="wordRecognition", accuracy=acc, started_at=_days_ago(4 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    result = engine.generate_next_activity()

    assert result["skill"] == "word_recognition"
    assert result["activity"] == "Word Builder"
    assert result["difficulty"] >= 1
    assert "reason" in result and len(result["reason"]) > 0
    assert "goal" in result and len(result["goal"]) > 0


# ---- 12. activity variety / avoid over-practice ----------------------------

def test_activity_variety_avoids_immediate_repeat(db_session):
    student = make_student(db_session)
    word_builder = make_activity(db_session, name="Word Builder")
    # Two skills both need practice; Word Builder was just played twice in
    # a row (the repetition limit), so the engine should not recommend it
    # a third time immediately — it should move to the next skill needing
    # practice instead.
    for i, acc in enumerate([40, 42]):
        make_session(db_session, student.id, skill="wordRecognition", accuracy=acc,
                     activity_id=word_builder.id, started_at=_days_ago(2 - i))
    for i, acc in enumerate([44, 46]):
        make_session(db_session, student.id, skill="phonologicalAwareness", accuracy=acc, started_at=_days_ago(4 - i))

    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    result = engine.generate_next_activity()
    assert result["activity"] != "Word Builder"


# ---- 13. spaced practice ----------------------------------------------------

def test_spaced_practice_resurfaces_stale_skill(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([75, 78, 74, 76]):
        make_session(db_session, student.id, skill="comprehension", accuracy=acc, started_at=_days_ago(30 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    candidates = engine.spaced_practice_candidates()
    assert any(c["skill"] == "comprehension" for c in candidates)


# ---- 14. personalized learning path -----------------------------------------

def test_learning_path_prioritizes_weak_skills_first(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([40, 42, 38, 41]):
        make_session(db_session, student.id, skill="wordRecognition", accuracy=acc, started_at=_days_ago(4 - i))
    for i, acc in enumerate([90, 92, 91, 93]):
        make_session(db_session, student.id, skill="comprehension", accuracy=acc, started_at=_days_ago(4 - i))

    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    # length=5 so every skill (including the 3 untouched ones, which rank
    # above an already-strong skill by design — see determine_skill_priority's
    # tier_rank: "not_yet_practiced" intentionally outranks
    # "consistently_strong", since introducing a new topic takes priority
    # over reinforcing one that's already solid) is represented, so this
    # assertion is actually comparing word_recognition vs. comprehension
    # rather than being silently truncated by the default length=4 cap.
    path = engine.generate_learning_path(length=5)
    skills_in_order = [step["skill"] for step in path]
    assert skills_in_order.index("word_recognition") < skills_in_order.index("comprehension")


# ---- 23. no duplicate recommendation logic ----------------------------------

def test_adaptive_engine_reuses_shared_activity_map(db_session):
    """Guards against Phase 9 accidentally introducing a second,
    independent skill -> activity mapping alongside recommendation_service.
    """
    from app.services import adaptive_learning_service
    assert adaptive_learning_service.ACTIVITY_MAP is recommendation_service.ACTIVITY_MAP


# ---- 16/17/18. authorization (child / parent / teacher) --------------------

def test_child_can_access_own_profile_and_next_activity(client, db_session):
    user = User(name="ChildUser", email="childuser@test.demo", role=UserRole.child,
                password_hash=hash_password("pw"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    student = make_student(db_session, name="ChildUser")
    student.user_id = user.id
    db_session.commit()

    token = client.post("/api/auth/login", json={"email": "childuser@test.demo", "password": "pw"}).json()["access_token"]
    r1 = client.get(f"/api/recommendations/profile/{student.id}", headers=_headers(token))
    assert r1.status_code == 200
    r2 = client.get(f"/api/recommendations/next/{student.id}", headers=_headers(token))
    assert r2.status_code == 200


def test_parent_can_access_own_childs_profile_not_others(client, db_session):
    parent_a = make_parent(db_session, email="pa9@test.demo")
    pa_user = db_session.query(User).filter(User.id == parent_a.user_id).first()
    pa_user.password_hash = hash_password("pw")
    db_session.commit()
    child_a = make_student(db_session, name="ChildA9")
    child_b = make_student(db_session, name="ChildB9")
    parent_a.children.append(child_a)
    db_session.commit()

    token = client.post("/api/auth/login", json={"email": "pa9@test.demo", "password": "pw"}).json()["access_token"]
    ok = client.get(f"/api/recommendations/profile/{child_a.id}", headers=_headers(token))
    assert ok.status_code == 200
    forbidden = client.get(f"/api/recommendations/profile/{child_b.id}", headers=_headers(token))
    assert forbidden.status_code == 403
    forbidden_next = client.get(f"/api/recommendations/next/{child_b.id}", headers=_headers(token))
    assert forbidden_next.status_code == 403


def test_teacher_can_access_own_students_path_not_others(client, db_session):
    teacher, cls = make_teacher_with_class(db_session, class_name="ClassX9")
    t_user = db_session.query(User).filter(User.id == teacher.user_id).first()
    t_user.password_hash = hash_password("pw")
    db_session.commit()

    student_in = make_student(db_session, name="InClass9")
    student_out = make_student(db_session, name="OutClass9")
    cls.students.append(student_in)
    db_session.commit()

    token = client.post("/api/auth/login", json={"email": t_user.email, "password": "pw"}).json()["access_token"]
    ok = client.get(f"/api/recommendations/path/{student_in.id}", headers=_headers(token))
    assert ok.status_code == 200
    forbidden = client.get(f"/api/recommendations/path/{student_out.id}", headers=_headers(token))
    assert forbidden.status_code == 403


# ---- multi-session / recommendation-after-events ----------------------------

def test_multiple_session_history_counts_attempts(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([50, 55, 60, 65, 70, 75]):
        make_session(db_session, student.id, skill="pronunciation", accuracy=acc, started_at=_days_ago(6 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile = engine.analyze_learning_profile()
    assert profile["pronunciation"].attempts == 6


def test_recommendation_reflects_new_session_after_improvement(db_session):
    student = make_student(db_session)
    for i, acc in enumerate([40, 42, 38, 41]):
        make_session(db_session, student.id, skill="wordRecognition", accuracy=acc, started_at=_days_ago(4 - i))
    engine = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    before = engine.generate_next_activity()
    assert before["skill"] == "word_recognition"

    # A run of strong recent sessions should change the picture.
    for i, acc in enumerate([90, 92, 91, 93]):
        make_session(db_session, student.id, skill="wordRecognition", accuracy=acc,
                     started_at=NOW - timedelta(hours=4 - i))
    engine2 = AdaptiveLearningEngine(db_session, student.id, now=NOW)
    profile_after = engine2.analyze_learning_profile()
    assert profile_after["word_recognition"].pattern in ("recently_improved", "improving", "consistently_strong")
