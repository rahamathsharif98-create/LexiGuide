from tests.factories import make_student, make_parent, make_teacher_with_class
from app.models import User, UserRole
from app.utils.security import hash_password


def test_register_creates_user_and_returns_token(client):
    r = client.post("/api/auth/register", json={"name": "Test User", "email": "reg@test.demo", "password": "secret123", "role": "parent"})
    assert r.status_code == 201
    body = r.json()
    assert body["role"] == "parent"
    assert "access_token" in body


def test_register_duplicate_email_rejected(client, db_session):
    db_session.add(User(name="Existing", email="dup@test.demo", role=UserRole.parent, password_hash=hash_password("x")))
    db_session.commit()
    r = client.post("/api/auth/register", json={"name": "New", "email": "dup@test.demo", "password": "secret123", "role": "parent"})
    assert r.status_code == 400


def test_login_success(client, db_session):
    db_session.add(User(name="Logger", email="login@test.demo", role=UserRole.teacher, password_hash=hash_password("mypassword")))
    db_session.commit()
    r = client.post("/api/auth/login", json={"email": "login@test.demo", "password": "mypassword"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password_fails(client, db_session):
    db_session.add(User(name="Logger2", email="login2@test.demo", role=UserRole.teacher, password_hash=hash_password("correct")))
    db_session.commit()
    r = client.post("/api/auth/login", json={"email": "login2@test.demo", "password": "wrong"})
    assert r.status_code == 401


def test_login_nonexistent_user_fails_same_as_wrong_password(client):
    r = client.post("/api/auth/login", json={"email": "nobody@test.demo", "password": "whatever"})
    assert r.status_code == 401
    assert r.json()["detail"] == "Incorrect email or password"


def test_me_requires_valid_token(client, db_session):
    user = User(name="MeUser", email="me@test.demo", role=UserRole.parent, password_hash=hash_password("pw"))
    db_session.add(user)
    db_session.commit()
    login = client.post("/api/auth/login", json={"email": "me@test.demo", "password": "pw"}).json()
    token = login["access_token"]

    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "me@test.demo"

    # no token at all
    r2 = client.get("/api/auth/me")
    assert r2.status_code == 401

    # garbage token
    r3 = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert r3.status_code == 401


def test_unauthorized_access_to_children_endpoint(client):
    r = client.get("/api/children")
    assert r.status_code == 401


def test_parent_only_sees_own_children(client, db_session):
    parent = make_parent(db_session, email="ownerparent@test.demo")
    parent_user = db_session.query(User).filter(User.id == parent.user_id).first()
    parent_user.password_hash = hash_password("pw")
    db_session.commit()

    owned_child = make_student(db_session, name="OwnedChild")
    other_child = make_student(db_session, name="OtherChild")
    parent.children.append(owned_child)
    db_session.commit()

    login = client.post("/api/auth/login", json={"email": "ownerparent@test.demo", "password": "pw"}).json()
    token = login["access_token"]

    r = client.get("/api/children", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert [c["name"] for c in r.json()] == ["OwnedChild"]

    # explicitly requesting a child that ISN'T theirs -> 403, not silently allowed
    r2 = client.get(f"/api/children/{other_child.id}", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 403

    r3 = client.get(f"/api/children/{owned_child.id}", headers={"Authorization": f"Bearer {token}"})
    assert r3.status_code == 200


def test_teacher_only_sees_students_in_own_class(client, db_session):
    teacher, cls = make_teacher_with_class(db_session, "OwnerClass")
    teacher_user = db_session.query(User).filter(User.id == teacher.user_id).first()
    teacher_user.password_hash = hash_password("pw")
    db_session.commit()

    roster_student = make_student(db_session, name="RosterStudent")
    outside_student = make_student(db_session, name="OutsideStudent")
    cls.students.append(roster_student)
    db_session.commit()

    login = client.post("/api/auth/login", json={"email": teacher_user.email, "password": "pw"}).json()
    token = login["access_token"]

    r = client.get("/api/children", headers={"Authorization": f"Bearer {token}"})
    assert [c["name"] for c in r.json()] == ["RosterStudent"]

    r2 = client.get(f"/api/children/{outside_student.id}", headers={"Authorization": f"Bearer {token}"})
    assert r2.status_code == 403
