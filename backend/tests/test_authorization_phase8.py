"""Phase 8 Step 1 — security/authorization hardening tests.

Covers the six routes that had a token-only (no ownership) gap before this
patch: reading, learning, fingerprint, recommendations, progress,
achievements. For each, verifies:
  - an unrelated parent/teacher is rejected (403), for both reads and the
    writes that exist on that route
  - the actual owner still succeeds

recommendations/progress/achievements only expose GET endpoints in this
codebase (no POST/PUT/DELETE exists to write to them directly — they're
populated as a side effect of /api/reading/session and
/api/learning/session), so only their GET ownership is exercised here;
the write-path coverage for those three lives in the reading/learning/
fingerprint write tests below, since that's what actually produces their
data.
"""
from tests.factories import make_student, make_parent, make_teacher_with_class
from app.models import User, UserRole
from app.utils.security import hash_password


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


def _setup_two_parents_two_children(client, db_session):
    """Parent A owns Child A. Child B belongs to Parent B (a different
    account) — i.e. genuinely someone else's data, not just an orphan row.
    """
    parent_a = make_parent(db_session, email="parentA@test.demo")
    pa_user = db_session.query(User).filter(User.id == parent_a.user_id).first()
    pa_user.password_hash = hash_password("pw")

    parent_b = make_parent(db_session, email="parentB@test.demo")
    pb_user = db_session.query(User).filter(User.id == parent_b.user_id).first()
    pb_user.password_hash = hash_password("pw")
    db_session.commit()

    child_a = make_student(db_session, name="ChildA")
    child_b = make_student(db_session, name="ChildB")
    parent_a.children.append(child_a)
    parent_b.children.append(child_b)
    db_session.commit()

    token_a = client.post("/api/auth/login", json={"email": "parentA@test.demo", "password": "pw"}).json()["access_token"]
    return child_a, child_b, token_a


def _setup_two_teachers_two_students(client, db_session):
    teacher_a, class_a = make_teacher_with_class(db_session, "ClassA")
    ta_user = db_session.query(User).filter(User.id == teacher_a.user_id).first()
    ta_user.password_hash = hash_password("pw")

    teacher_b, class_b = make_teacher_with_class(db_session, "ClassB")
    tb_user = db_session.query(User).filter(User.id == teacher_b.user_id).first()
    tb_user.password_hash = hash_password("pw")
    db_session.commit()

    student_a = make_student(db_session, name="StudentA")
    student_b = make_student(db_session, name="StudentB")
    class_a.students.append(student_a)
    class_b.students.append(student_b)
    db_session.commit()

    token_a = client.post("/api/auth/login", json={"email": ta_user.email, "password": "pw"}).json()["access_token"]
    return student_a, student_b, token_a


# ---------------------------------------------------------------------
# READING (GET history, POST session)
# ---------------------------------------------------------------------

def test_parent_cannot_read_another_parents_child_reading_history(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.get(f"/api/reading/history/{child_b.id}", headers=_headers(token_a))
    assert r.status_code == 403


def test_parent_cannot_create_reading_session_for_another_parents_child(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.post(f"/api/reading/session?child_id={child_b.id}", json={
        "expected_text": "The cat sat", "recognized_text": "The cat sat",
    }, headers=_headers(token_a))
    assert r.status_code == 403


def test_parent_can_create_reading_session_for_own_child(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.post(f"/api/reading/session?child_id={child_a.id}", json={
        "expected_text": "The cat sat", "recognized_text": "The cat sat",
    }, headers=_headers(token_a))
    assert r.status_code == 201


def test_teacher_cannot_read_unauthorized_students_reading_history(client, db_session):
    student_a, student_b, token_a = _setup_two_teachers_two_students(client, db_session)
    r = client.get(f"/api/reading/history/{student_b.id}", headers=_headers(token_a))
    assert r.status_code == 403


def test_teacher_can_create_reading_session_for_assigned_student(client, db_session):
    student_a, student_b, token_a = _setup_two_teachers_two_students(client, db_session)
    r = client.post(f"/api/reading/session?child_id={student_a.id}", json={
        "expected_text": "The cat sat", "recognized_text": "The cat sat",
    }, headers=_headers(token_a))
    assert r.status_code == 201


# ---------------------------------------------------------------------
# LEARNING (GET history, POST session/result)
# ---------------------------------------------------------------------

def test_parent_cannot_log_learning_session_for_another_parents_child(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.post(f"/api/learning/session?child_id={child_b.id}", json={"skill": "phonics"}, headers=_headers(token_a))
    assert r.status_code == 403


def test_parent_cannot_submit_result_for_another_parents_child(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.post(f"/api/learning/result?child_id={child_b.id}", json={"skill": "phonics"}, headers=_headers(token_a))
    assert r.status_code == 403


def test_parent_cannot_read_another_parents_child_learning_history(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.get(f"/api/learning/history/{child_b.id}", headers=_headers(token_a))
    assert r.status_code == 403


def test_teacher_cannot_log_learning_session_for_unauthorized_student(client, db_session):
    student_a, student_b, token_a = _setup_two_teachers_two_students(client, db_session)
    r = client.post(f"/api/learning/session?child_id={student_b.id}", json={"skill": "phonics"}, headers=_headers(token_a))
    assert r.status_code == 403


def test_parent_can_log_learning_session_for_own_child(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.post(f"/api/learning/session?child_id={child_a.id}", json={"skill": "phonics"}, headers=_headers(token_a))
    assert r.status_code == 201


# ---------------------------------------------------------------------
# FINGERPRINT (GET, POST update)
# ---------------------------------------------------------------------

def test_parent_cannot_read_another_parents_child_fingerprint(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.get(f"/api/fingerprint/{child_b.id}", headers=_headers(token_a))
    assert r.status_code == 403


def test_parent_cannot_update_another_parents_child_fingerprint(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.post("/api/fingerprint/update", json={
        "child_id": child_b.id, "outcome_type": "reading", "skill": "readingFluency", "accuracy": 80,
    }, headers=_headers(token_a))
    assert r.status_code == 403


def test_teacher_cannot_update_unauthorized_students_fingerprint(client, db_session):
    student_a, student_b, token_a = _setup_two_teachers_two_students(client, db_session)
    r = client.post("/api/fingerprint/update", json={
        "child_id": student_b.id, "outcome_type": "reading", "skill": "readingFluency", "accuracy": 80,
    }, headers=_headers(token_a))
    assert r.status_code == 403


def test_parent_can_read_and_update_own_childs_fingerprint(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.get(f"/api/fingerprint/{child_a.id}", headers=_headers(token_a))
    assert r.status_code == 200
    r2 = client.post("/api/fingerprint/update", json={
        "child_id": child_a.id, "outcome_type": "reading", "skill": "readingFluency", "accuracy": 80,
    }, headers=_headers(token_a))
    assert r2.status_code == 200


def test_teacher_can_read_assigned_students_fingerprint(client, db_session):
    student_a, student_b, token_a = _setup_two_teachers_two_students(client, db_session)
    r = client.get(f"/api/fingerprint/{student_a.id}", headers=_headers(token_a))
    assert r.status_code == 200


# ---------------------------------------------------------------------
# RECOMMENDATIONS (GET only in this API)
# ---------------------------------------------------------------------

def test_parent_cannot_read_another_parents_child_recommendations(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.get(f"/api/recommendations/{child_b.id}", headers=_headers(token_a))
    assert r.status_code == 403


def test_teacher_cannot_read_unauthorized_students_recommendations(client, db_session):
    student_a, student_b, token_a = _setup_two_teachers_two_students(client, db_session)
    r = client.get(f"/api/recommendations/{student_b.id}", headers=_headers(token_a))
    assert r.status_code == 403


def test_parent_can_read_own_childs_recommendations(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.get(f"/api/recommendations/{child_a.id}", headers=_headers(token_a))
    assert r.status_code == 200


# ---------------------------------------------------------------------
# PROGRESS (GET only in this API)
# ---------------------------------------------------------------------

def test_parent_cannot_read_another_parents_child_progress(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.get(f"/api/progress/{child_b.id}", headers=_headers(token_a))
    assert r.status_code == 403


def test_teacher_cannot_read_unauthorized_students_progress(client, db_session):
    student_a, student_b, token_a = _setup_two_teachers_two_students(client, db_session)
    r = client.get(f"/api/progress/{student_b.id}", headers=_headers(token_a))
    assert r.status_code == 403


def test_teacher_can_read_assigned_students_progress(client, db_session):
    student_a, student_b, token_a = _setup_two_teachers_two_students(client, db_session)
    r = client.get(f"/api/progress/{student_a.id}", headers=_headers(token_a))
    assert r.status_code == 200


# ---------------------------------------------------------------------
# ACHIEVEMENTS (GET only in this API)
# ---------------------------------------------------------------------

def test_parent_cannot_read_another_parents_child_achievements(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.get(f"/api/achievements/{child_b.id}", headers=_headers(token_a))
    assert r.status_code == 403


def test_teacher_cannot_read_unauthorized_students_achievements(client, db_session):
    student_a, student_b, token_a = _setup_two_teachers_two_students(client, db_session)
    r = client.get(f"/api/achievements/{student_b.id}", headers=_headers(token_a))
    assert r.status_code == 403


def test_parent_can_read_own_childs_achievements(client, db_session):
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r = client.get(f"/api/achievements/{child_a.id}", headers=_headers(token_a))
    assert r.status_code == 200


# ---------------------------------------------------------------------
# Non-existent child ID must not be distinguishable from "not yours"
# ---------------------------------------------------------------------

def test_unauthorized_access_returns_403_not_404_for_nonexistent_child(client, db_session):
    """A denied request must not leak whether the child_id exists at all —
    both a real child belonging to someone else and a made-up ID should
    come back as the same 403, not a 404 for one and 403 for the other.
    """
    child_a, child_b, token_a = _setup_two_parents_two_children(client, db_session)
    r_real_but_not_mine = client.get(f"/api/reading/history/{child_b.id}", headers=_headers(token_a))
    r_made_up = client.get("/api/reading/history/999999", headers=_headers(token_a))
    assert r_real_but_not_mine.status_code == 403
    assert r_made_up.status_code == 403
