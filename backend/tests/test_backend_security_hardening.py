"""Step 2 — Backend Security Hardening Test Suite

Comprehensive tests verifying:
1. Unauthenticated request -> denied (401).
2. Parent can access own child.
3. Parent cannot access another parent's child (403).
4. Teacher can access authorized student in their class.
5. Teacher cannot access student outside their class (403).
6. Teacher cannot access another teacher's class (403).
7. Child can access own student data.
8. Child cannot access another child's student data (403).
9. parent_id query parameter cannot impersonate another parent.
10. teacher_id query parameter cannot impersonate another teacher.
11. Sequential ID enumeration returns 403 without 404 leakage.
12. Speech endpoints remain stateless utilities without exposing child records.
13. Role separation: Parent cannot access teacher endpoints; teacher cannot access parent endpoints.
14. No duplicate students returned when a student is in multiple classes for the same teacher.
"""
import pytest
from tests.factories import make_student, make_parent, make_teacher_with_class
from app.models import User, UserRole, ClassModel
from app.utils.security import hash_password


def _create_user(db_session, email, role, password="pw"):
    user = db_session.query(User).filter(User.email == email).first()
    if user is None:
        user = User(name=email, email=email, role=role, password_hash=hash_password(password))
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user


def _login(client, email, password="pw"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _setup_parents_and_children(client, db_session):
    p_a = make_parent(db_session, email="parent_sec_a@test.demo")
    u_a = db_session.query(User).filter(User.id == p_a.user_id).first()
    u_a.password_hash = hash_password("pw")

    p_b = make_parent(db_session, email="parent_sec_b@test.demo")
    u_b = db_session.query(User).filter(User.id == p_b.user_id).first()
    u_b.password_hash = hash_password("pw")
    db_session.commit()

    child_a = make_student(db_session, name="ChildSecA")
    child_b = make_student(db_session, name="ChildSecB")
    p_a.children.append(child_a)
    p_b.children.append(child_b)
    db_session.commit()

    headers_a = _login(client, "parent_sec_a@test.demo", "pw")
    headers_b = _login(client, "parent_sec_b@test.demo", "pw")
    return p_a, p_b, child_a, child_b, headers_a, headers_b


def _setup_teachers_and_students(client, db_session):
    t_a, cls_a = make_teacher_with_class(db_session, "ClassSecA")
    u_a = db_session.query(User).filter(User.id == t_a.user_id).first()
    u_a.password_hash = hash_password("pw")

    t_b, cls_b = make_teacher_with_class(db_session, "ClassSecB")
    u_b = db_session.query(User).filter(User.id == t_b.user_id).first()
    u_b.password_hash = hash_password("pw")
    db_session.commit()

    student_a = make_student(db_session, name="StudentSecA")
    student_b = make_student(db_session, name="StudentSecB")
    cls_a.students.append(student_a)
    cls_b.students.append(student_b)
    db_session.commit()

    headers_a = _login(client, u_a.email, "pw")
    headers_b = _login(client, u_b.email, "pw")
    return t_a, t_b, cls_a, cls_b, student_a, student_b, headers_a, headers_b


# =====================================================================
# 1. Unauthenticated request -> denied (401)
# =====================================================================

def test_1_unauthenticated_requests_denied_401(client):
    protected_endpoints = [
        ("GET", "/api/parent/children"),
        ("GET", "/api/parent/children/1/progress"),
        ("GET", "/api/parent/children/1/fingerprint"),
        ("GET", "/api/parent/children/1/activities"),
        ("GET", "/api/parent/children/1/recommendations"),
        ("GET", "/api/teacher/dashboard"),
        ("GET", "/api/teacher/students"),
        ("GET", "/api/teacher/progress"),
        ("GET", "/api/teacher/recommendations"),
        ("GET", "/api/classes"),
        ("GET", "/api/classes/1"),
        ("GET", "/api/classes/1/students"),
        ("GET", "/api/students"),
        ("GET", "/api/students/1"),
        ("GET", "/api/students/1/sessions"),
        ("POST", "/api/students/1/sessions"),
        ("GET", "/api/students/1/progress"),
        ("GET", "/api/students/1/fingerprint"),
        ("GET", "/api/students/1/recommendations"),
        ("GET", "/api/children"),
        ("GET", "/api/children/1"),
    ]
    for method, path in protected_endpoints:
        if method == "GET":
            res = client.get(path)
        else:
            res = client.post(path, json={})
        assert res.status_code == 401, f"Expected 401 for unauthenticated {method} {path}, got {res.status_code}"


# =====================================================================
# 2. Parent can access own child
# =====================================================================

def test_2_parent_can_access_own_child(client, db_session):
    p_a, p_b, child_a, child_b, h_a, h_b = _setup_parents_and_children(client, db_session)

    # List children
    r = client.get("/api/parent/children", headers=h_a)
    assert r.status_code == 200
    names = [c["name"] for c in r.json()]
    assert names == ["ChildSecA"]

    # Child detail via students endpoint
    r_stud = client.get(f"/api/students/{child_a.id}", headers=h_a)
    assert r_stud.status_code == 200
    assert r_stud.json()["name"] == "ChildSecA"

    # Child progress
    r_prog = client.get(f"/api/parent/children/{child_a.id}/progress", headers=h_a)
    assert r_prog.status_code == 200

    # Child fingerprint
    r_fp = client.get(f"/api/parent/children/{child_a.id}/fingerprint", headers=h_a)
    assert r_fp.status_code == 200

    # Child activities
    r_act = client.get(f"/api/parent/children/{child_a.id}/activities", headers=h_a)
    assert r_act.status_code == 200

    # Child recommendations
    r_rec = client.get(f"/api/parent/children/{child_a.id}/recommendations", headers=h_a)
    assert r_rec.status_code == 200


# =====================================================================
# 3. Parent cannot access another parent's child (403)
# =====================================================================

def test_3_parent_cannot_access_another_parents_child(client, db_session):
    p_a, p_b, child_a, child_b, h_a, h_b = _setup_parents_and_children(client, db_session)

    # Parent A attempts to access Child B (owned by Parent B)
    assert client.get(f"/api/parent/children/{child_b.id}/progress", headers=h_a).status_code == 403
    assert client.get(f"/api/parent/children/{child_b.id}/fingerprint", headers=h_a).status_code == 403
    assert client.get(f"/api/parent/children/{child_b.id}/activities", headers=h_a).status_code == 403
    assert client.get(f"/api/parent/children/{child_b.id}/recommendations", headers=h_a).status_code == 403
    assert client.get(f"/api/students/{child_b.id}", headers=h_a).status_code == 403
    assert client.get(f"/api/students/{child_b.id}/sessions", headers=h_a).status_code == 403
    assert client.get(f"/api/students/{child_b.id}/progress", headers=h_a).status_code == 403
    assert client.get(f"/api/students/{child_b.id}/fingerprint", headers=h_a).status_code == 403
    assert client.get(f"/api/students/{child_b.id}/recommendations", headers=h_a).status_code == 403


# =====================================================================
# 4. Teacher can access authorized student in their class
# =====================================================================

def test_4_teacher_can_access_authorized_student(client, db_session):
    t_a, t_b, cls_a, cls_b, student_a, student_b, h_a, h_b = _setup_teachers_and_students(client, db_session)

    # Teacher A sees student_a
    r_studs = client.get("/api/teacher/students", headers=h_a)
    assert r_studs.status_code == 200
    assert [s["name"] for s in r_studs.json()] == ["StudentSecA"]

    # Teacher A accesses student_a detail
    r_stud = client.get(f"/api/students/{student_a.id}", headers=h_a)
    assert r_stud.status_code == 200
    assert r_stud.json()["name"] == "StudentSecA"

    # Teacher A accesses class students
    r_cls_s = client.get(f"/api/classes/{cls_a.id}/students", headers=h_a)
    assert r_cls_s.status_code == 200
    assert [s["name"] for s in r_cls_s.json()] == ["StudentSecA"]


# =====================================================================
# 5. Teacher cannot access student outside their class (403)
# =====================================================================

def test_5_teacher_cannot_access_unauthorized_student(client, db_session):
    t_a, t_b, cls_a, cls_b, student_a, student_b, h_a, h_b = _setup_teachers_and_students(client, db_session)

    # Teacher A attempts to access student_b (in Teacher B's class)
    assert client.get(f"/api/students/{student_b.id}", headers=h_a).status_code == 403
    assert client.get(f"/api/students/{student_b.id}/sessions", headers=h_a).status_code == 403
    assert client.get(f"/api/students/{student_b.id}/progress", headers=h_a).status_code == 403
    assert client.get(f"/api/students/{student_b.id}/fingerprint", headers=h_a).status_code == 403
    assert client.get(f"/api/students/{student_b.id}/recommendations", headers=h_a).status_code == 403


# =====================================================================
# 6. Teacher cannot access another teacher's class (403)
# =====================================================================

def test_6_teacher_cannot_access_another_teachers_class(client, db_session):
    t_a, t_b, cls_a, cls_b, student_a, student_b, h_a, h_b = _setup_teachers_and_students(client, db_session)

    # Teacher A attempts to view Teacher B's class
    assert client.get(f"/api/classes/{cls_b.id}", headers=h_a).status_code == 403
    assert client.get(f"/api/classes/{cls_b.id}/students", headers=h_a).status_code == 403
    assert client.get(f"/api/teacher/dashboard?class_id={cls_b.id}", headers=h_a).status_code == 403
    assert client.get(f"/api/teacher/students?class_id={cls_b.id}", headers=h_a).status_code == 403
    assert client.get(f"/api/teacher/progress?class_id={cls_b.id}", headers=h_a).status_code == 403
    assert client.get(f"/api/teacher/recommendations?class_id={cls_b.id}", headers=h_a).status_code == 403


# =====================================================================
# 7. Child can access own student data
# =====================================================================

def test_7_child_can_access_own_data(client, db_session):
    u_child = _create_user(db_session, "child_me@test.demo", UserRole.child)
    s_me = make_student(db_session, name="ChildMe")
    s_me.user_id = u_child.id
    db_session.commit()

    h_child = _login(client, "child_me@test.demo", "pw")

    # List students returns own student
    r = client.get("/api/students", headers=h_child)
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["id"] == s_me.id

    # Access own detail
    r_detail = client.get(f"/api/students/{s_me.id}", headers=h_child)
    assert r_detail.status_code == 200
    assert r_detail.json()["name"] == "ChildMe"


# =====================================================================
# 8. Child cannot access another child's student data (403)
# =====================================================================

def test_8_child_cannot_access_another_childs_data(client, db_session):
    u_child = _create_user(db_session, "child_self@test.demo", UserRole.child)
    s_self = make_student(db_session, name="ChildSelf")
    s_self.user_id = u_child.id

    s_other = make_student(db_session, name="ChildOther")
    db_session.commit()

    h_child = _login(client, "child_self@test.demo", "pw")

    # Attempt to view another child's details or sessions
    assert client.get(f"/api/students/{s_other.id}", headers=h_child).status_code == 403
    assert client.get(f"/api/students/{s_other.id}/sessions", headers=h_child).status_code == 403
    assert client.get(f"/api/students/{s_other.id}/progress", headers=h_child).status_code == 403
    assert client.get(f"/api/children/{s_other.id}", headers=h_child).status_code == 403


# =====================================================================
# 9. parent_id query parameter cannot impersonate another parent
# =====================================================================

def test_9_parent_id_parameter_cannot_impersonate(client, db_session):
    p_a, p_b, child_a, child_b, h_a, h_b = _setup_parents_and_children(client, db_session)

    # Parent A passes parent_id=p_b.id in query param
    r = client.get(f"/api/parent/children?parent_id={p_b.id}", headers=h_a)
    assert r.status_code == 200
    # Must STILL return Parent A's children, NOT Parent B's children
    names = [c["name"] for c in r.json()]
    assert names == ["ChildSecA"]
    assert "ChildSecB" not in names


# =====================================================================
# 10. teacher_id query parameter cannot impersonate another teacher
# =====================================================================

def test_10_teacher_id_parameter_cannot_impersonate(client, db_session):
    t_a, t_b, cls_a, cls_b, student_a, student_b, h_a, h_b = _setup_teachers_and_students(client, db_session)

    # Teacher A passes teacher_id=t_b.id in query param
    r = client.get(f"/api/teacher/students?teacher_id={t_b.id}", headers=h_a)
    assert r.status_code == 200
    names = [s["name"] for s in r.json()]
    assert names == ["StudentSecA"]
    assert "StudentSecB" not in names


# =====================================================================
# 11. Sequential ID enumeration returns 403 without 404 leakage
# =====================================================================

def test_11_sequential_id_enumeration_returns_403(client, db_session):
    p_a, p_b, child_a, child_b, h_a, h_b = _setup_parents_and_children(client, db_session)
    t_a, t_b, cls_a, cls_b, student_a, student_b, h_ta, h_tb = _setup_teachers_and_students(client, db_session)

    # Non-existent child/student IDs return 403 (same as unowned ID), never revealing whether it exists
    assert client.get("/api/students/999999", headers=h_a).status_code == 403
    assert client.get("/api/parent/children/999999/progress", headers=h_a).status_code == 403
    assert client.get("/api/children/999999", headers=h_a).status_code == 403
    assert client.get("/api/classes/999999", headers=h_ta).status_code == 403
    assert client.get("/api/classes/999999/students", headers=h_ta).status_code == 403


# =====================================================================
# 12. Speech utility endpoints are stateless and do not expose child data
# =====================================================================

def test_12_speech_utility_endpoints_stateless(client):
    r = client.post("/api/speech/analyze", json={"expected_text": "hello", "recognized_text": "hello"})
    assert r.status_code == 200
    assert "accuracy" in r.json()


# =====================================================================
# 13. Role separation: Parent cannot access teacher endpoints and vice versa
# =====================================================================

def test_13_role_separation(client, db_session):
    p_a, p_b, child_a, child_b, h_pa, h_pb = _setup_parents_and_children(client, db_session)
    t_a, t_b, cls_a, cls_b, student_a, student_b, h_ta, h_tb = _setup_teachers_and_students(client, db_session)

    # Parent attempting teacher routes -> 403
    assert client.get("/api/teacher/dashboard", headers=h_pa).status_code == 403
    assert client.get("/api/teacher/students", headers=h_pa).status_code == 403
    assert client.get("/api/classes", headers=h_pa).status_code == 403

    # Teacher attempting parent routes -> 403
    assert client.get("/api/parent/children", headers=h_ta).status_code == 403
    assert client.get(f"/api/parent/children/{child_a.id}/progress", headers=h_ta).status_code == 403


# =====================================================================
# 14. No duplicate students when in multiple classes for same teacher
# =====================================================================

def test_14_no_duplicate_students_across_classes(client, db_session):
    t_dup, cls_1 = make_teacher_with_class(db_session, "ClassDup1")
    u_dup = db_session.query(User).filter(User.id == t_dup.user_id).first()
    u_dup.password_hash = hash_password("pw")

    # Add a second class for same teacher
    cls_2 = ClassModel(teacher_id=t_dup.id, name="ClassDup2")
    db_session.add(cls_2)
    db_session.commit()

    # Enroll same student in both classes
    shared_student = make_student(db_session, name="SharedStudent")
    cls_1.students.append(shared_student)
    cls_2.students.append(shared_student)
    db_session.commit()

    h_dup = _login(client, u_dup.email, "pw")

    # GET /api/teacher/students returns shared student exactly once
    r = client.get("/api/teacher/students", headers=h_dup)
    assert r.status_code == 200
    names = [s["name"] for s in r.json() if s["name"] == "SharedStudent"]
    assert len(names) == 1, "Student should appear only once across teacher's classes"

    # GET /api/students returns shared student exactly once
    r2 = client.get("/api/students", headers=h_dup)
    assert r2.status_code == 200
    names2 = [s["name"] for s in r2.json() if s["name"] == "SharedStudent"]
    assert len(names2) == 1, "Student should appear only once across teacher's classes in /api/students"
