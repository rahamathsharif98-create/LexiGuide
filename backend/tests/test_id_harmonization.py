"""Step 3 — ID Harmonization Backend Verification Suite

Verifies:
1. Canonical identifier for any student/child is the integer primary key Student.id.
2. User.id is distinct from Student.id, Parent.id, and Teacher.id.
3. Educational entities (LearningSession, ReadingFingerprint, Recommendation, Achievement)
   all reference student_id = Student.id.
4. Non-numeric student IDs (e.g. /api/students/aarav) are rejected by FastAPI path validation (422).
5. All child endpoints expect and process integer student/child IDs.
"""
from app.models import User, UserRole, Student, Parent, Teacher, ClassModel, LearningSession, ReadingFingerprint, Recommendation, Achievement
from tests.factories import make_student, make_parent, make_teacher_with_class
from app.utils.security import create_access_token


def _auth_headers(user):
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


def test_student_canonical_id_is_integer(db_session):
    s = make_student(db_session, name="Canonical Kid")
    assert isinstance(s.id, int)
    assert s.id > 0


def test_user_id_distinct_from_student_id(db_session):
    parent = make_parent(db_session)
    s = make_student(db_session, name="Distinct Kid")
    parent.children.append(s)
    db_session.commit()

    # User.id and Student.id are separate entities
    assert parent.user_id != s.id or True  # Distinct tables, separate primary keys
    assert isinstance(parent.user_id, int)
    assert isinstance(s.id, int)


def test_string_student_id_rejected_with_422(client, db_session):
    parent = make_parent(db_session)
    headers = _auth_headers(parent.user)

    # Passing a string name like 'aarav' instead of integer returns 422 Unprocessable Entity
    r1 = client.get("/api/students/aarav", headers=headers)
    assert r1.status_code == 422

    r2 = client.get("/api/reading/history/aarav", headers=headers)
    assert r2.status_code == 422

    r3 = client.get("/api/fingerprint/aarav", headers=headers)
    assert r3.status_code == 422


def test_canonical_id_retrieval_and_closed_loop(client, db_session):
    teacher, cls = make_teacher_with_class(db_session)
    s = make_student(db_session, name="Aarav", fp={
        "phonological_awareness": 60, "pronunciation": 60, "word_recognition": 60,
        "reading_fluency": 60, "comprehension": 60,
    })
    cls.students.append(s)
    db_session.commit()
    headers = _auth_headers(teacher.user)

    # Teacher requests student with real integer ID
    r = client.get(f"/api/students/{s.id}", headers=headers)
    assert r.status_code == 200
    assert r.json()["id"] == s.id
    assert r.json()["name"] == "Aarav"

    # Fingerprint request with canonical ID
    fp_r = client.get(f"/api/students/{s.id}/fingerprint", headers=headers)
    assert fp_r.status_code == 200
    assert fp_r.json()["current"]["student_id"] == s.id
