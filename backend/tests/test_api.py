from tests.factories import make_student, make_teacher_with_class, make_parent, make_activity
from app.utils.language import contains_forbidden_language
from app.utils.security import create_access_token


def _auth_headers(user):
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


def _make_parent_with_student(db, name="Test Student", age=7, avatar="🦊", fp=None):
    parent = make_parent(db)
    student = make_student(db, name=name, age=age, avatar=avatar, fp=fp)
    parent.children.append(student)
    db.commit()
    db.refresh(parent)
    db.refresh(student)
    return parent, student, _auth_headers(parent.user)


def test_1_health_endpoint(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_2_student_list(client, db_session):
    parent = make_parent(db_session)
    s1 = make_student(db_session, name="Aarav")
    s2 = make_student(db_session, name="Meera")
    parent.children.extend([s1, s2])
    db_session.commit()
    headers = _auth_headers(parent.user)

    # Unauthenticated request rejected
    assert client.get("/api/students").status_code == 401

    r = client.get("/api/students", headers=headers)
    assert r.status_code == 200
    names = [s["name"] for s in r.json()]
    assert names == ["Aarav", "Meera"]


def test_3_student_detail(client, db_session):
    parent, s, headers = _make_parent_with_student(db_session, name="Kabir", age=9, avatar="🐯")

    # Unauthenticated request rejected
    assert client.get(f"/api/students/{s.id}").status_code == 401

    r = client.get(f"/api/students/{s.id}", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Kabir"
    assert body["age"] == 9
    assert body["avatar"] == "🐯"


def test_4_student_not_found(client, db_session):
    parent = make_parent(db_session)
    headers = _auth_headers(parent.user)

    # Unauthenticated -> 401
    assert client.get("/api/students/99999").status_code == 401

    # Authenticated user querying unowned/non-existent student returns 403 (anti-enumeration)
    r = client.get("/api/students/99999", headers=headers)
    assert r.status_code == 403


def test_5_class_list(client, db_session):
    teacher, cls = make_teacher_with_class(db_session, "Grade 2A")
    headers = _auth_headers(teacher.user)

    # Unauthenticated -> 401
    assert client.get("/api/classes").status_code == 401

    r = client.get("/api/classes", headers=headers)
    assert r.status_code == 200
    assert any(c["name"] == "Grade 2A" for c in r.json())


def test_6_class_students(client, db_session):
    teacher, cls = make_teacher_with_class(db_session)
    s1 = make_student(db_session, name="Priya")
    s2 = make_student(db_session, name="Rohan")
    cls.students.extend([s1, s2])
    db_session.commit()
    headers = _auth_headers(teacher.user)

    # Unauthenticated -> 401
    assert client.get(f"/api/classes/{cls.id}/students").status_code == 401

    r = client.get(f"/api/classes/{cls.id}/students", headers=headers)
    assert r.status_code == 200
    names = {s["name"] for s in r.json()}
    assert names == {"Priya", "Rohan"}


def test_7_activity_list(client, db_session):
    make_activity(db_session, "Read With Me")
    make_activity(db_session, "Speak & Shine")
    r = client.get("/api/activities")
    assert r.status_code == 200
    names = {a["name"] for a in r.json()}
    assert {"Read With Me", "Speak & Shine"} <= names


def test_8_session_creation(client, db_session):
    parent, s, headers = _make_parent_with_student(db_session)
    a = make_activity(db_session)

    # Unauthenticated -> 401
    assert client.post(f"/api/students/{s.id}/sessions", json={
        "activity_id": a.id, "skill": "readingFluency",
        "outcome": {"type": "reading", "accuracy": 80}, "stars": 3, "xp": 20,
    }).status_code == 401

    r = client.post(f"/api/students/{s.id}/sessions", headers=headers, json={
        "activity_id": a.id, "skill": "readingFluency",
        "outcome": {"type": "reading", "accuracy": 80}, "stars": 3, "xp": 20,
    })
    assert r.status_code == 201
    body = r.json()
    assert body["student_id"] == s.id
    assert body["stars"] == 3
    assert body["xp"] == 20

    # session creation must also produce a new fingerprint snapshot
    fp = client.get(f"/api/students/{s.id}/fingerprint", headers=headers).json()
    assert len(fp["history"]) == 1


def test_9_session_retrieval(client, db_session):
    parent, s, headers = _make_parent_with_student(db_session)
    a = make_activity(db_session)
    client.post(f"/api/students/{s.id}/sessions", headers=headers, json={"activity_id": a.id, "outcome": {"type": "reading", "accuracy": 70}, "stars": 2, "xp": 10})
    client.post(f"/api/students/{s.id}/sessions", headers=headers, json={"activity_id": a.id, "outcome": {"type": "reading", "accuracy": 90}, "stars": 3, "xp": 25})

    # Unauthenticated -> 401
    assert client.get(f"/api/students/{s.id}/sessions").status_code == 401

    r = client.get(f"/api/students/{s.id}/sessions", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_10_progress_retrieval(client, db_session):
    parent, s, headers = _make_parent_with_student(db_session, fp={
        "phonological_awareness": 60, "pronunciation": 60, "word_recognition": 60,
        "reading_fluency": 60, "comprehension": 60,
    })

    # Unauthenticated -> 401
    assert client.get(f"/api/students/{s.id}/progress?range=7d").status_code == 401

    r = client.get(f"/api/students/{s.id}/progress?range=7d", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["range"] == "7d"
    assert isinstance(body["skills"], list)

    # invalid range -> 400, not a silent fallback
    bad = client.get(f"/api/students/{s.id}/progress?range=nonsense", headers=headers)
    assert bad.status_code == 400


def test_11_fingerprint_retrieval(client, db_session):
    parent, s, headers = _make_parent_with_student(db_session, fp={
        "phonological_awareness": 62, "pronunciation": 71, "word_recognition": 55,
        "reading_fluency": 48, "comprehension": 82,
    })

    # Unauthenticated -> 401
    assert client.get(f"/api/students/{s.id}/fingerprint").status_code == 401

    r = client.get(f"/api/students/{s.id}/fingerprint", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["current"]["phonological_awareness"] == 62
    assert "does not provide a clinical diagnosis" in body["disclaimer"]


def test_12_recommendations_retrieval(client, db_session):
    parent, s, headers = _make_parent_with_student(db_session, fp={
        "phonological_awareness": 40, "pronunciation": 40, "word_recognition": 40,
        "reading_fluency": 40, "comprehension": 40,
    })
    from app.services.recommendation_service import persist_recommendations_for_student
    persist_recommendations_for_student(db_session, s.id, {
        "phonological_awareness": 40, "pronunciation": 40, "word_recognition": 40,
        "reading_fluency": 40, "comprehension": 40,
    })

    # Unauthenticated -> 401
    assert client.get(f"/api/students/{s.id}/recommendations").status_code == 401

    r = client.get(f"/api/students/{s.id}/recommendations", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) > 0
    for rec in r.json():
        assert not contains_forbidden_language(rec["reason"])


def test_13_parent_child_relationship(client, db_session):
    parent = make_parent(db_session)
    s = make_student(db_session, name="LinkedChild")
    parent.children.append(s)
    db_session.commit()
    headers = _auth_headers(parent.user)

    # Unauthenticated -> 401
    assert client.get("/api/parent/children").status_code == 401

    # Authenticated parent receives own children
    r = client.get("/api/parent/children", headers=headers)
    assert r.status_code == 200
    names = [c["name"] for c in r.json()]
    assert names == ["LinkedChild"]


def test_14_teacher_class_student_relationship(client, db_session):
    teacher, cls = make_teacher_with_class(db_session)
    s = make_student(db_session, name="RosterKid", fp={
        "phonological_awareness": 70, "pronunciation": 70, "word_recognition": 70,
        "reading_fluency": 70, "comprehension": 70,
    })
    cls.students.append(s)
    db_session.commit()
    headers = _auth_headers(teacher.user)

    # Unauthenticated -> 401
    assert client.get("/api/teacher/students").status_code == 401

    r = client.get("/api/teacher/students", headers=headers)
    assert r.status_code == 200
    assert [x["name"] for x in r.json()] == ["RosterKid"]

    dash = client.get("/api/teacher/dashboard", headers=headers)
    assert dash.status_code == 200
    assert dash.json()["total_students"] == 1


def test_15_invalid_input_handling(client, db_session):
    parent, s, headers = _make_parent_with_student(db_session)

    # negative stars should be rejected by Pydantic validation (ge=0)
    r = client.post(f"/api/students/{s.id}/sessions", headers=headers, json={"stars": -5, "xp": 10})
    assert r.status_code == 422

    # posting a session to an unowned/nonexistent student -> 403 (anti-enumeration)
    r2 = client.post("/api/students/99999/sessions", headers=headers, json={"stars": 1, "xp": 1})
    assert r2.status_code == 403


def test_no_diagnostic_language_in_class_recommendations(client, db_session):
    teacher, cls = make_teacher_with_class(db_session)
    s = make_student(db_session, fp={
        "phonological_awareness": 35, "pronunciation": 35, "word_recognition": 35,
        "reading_fluency": 35, "comprehension": 35,
    })
    cls.students.append(s)
    db_session.commit()
    headers = _auth_headers(teacher.user)

    # Unauthenticated -> 401
    assert client.get("/api/teacher/recommendations").status_code == 401

    r = client.get("/api/teacher/recommendations", headers=headers)
    assert r.status_code == 200
    for rec in r.json():
        assert not contains_forbidden_language(rec["reason"])
