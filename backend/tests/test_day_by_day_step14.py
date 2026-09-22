import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.models import User, UserRole, Parent, Teacher, ClassModel, Student, LearningSession, ReadingFingerprint
from app.utils.security import create_access_token, hash_password


@pytest.fixture(scope="function")
def seed_data(db_session):
    unique = int(datetime.now().timestamp() * 1000)

    # 1. Parent & Child
    parent_user = User(
        email=f"parent_step14_{unique}@test.com",
        name="Parent Step14",
        password_hash=hash_password("Secret123!"),
        role=UserRole.parent,
    )
    db_session.add(parent_user)
    db_session.flush()

    parent_record = Parent(user_id=parent_user.id)
    db_session.add(parent_record)
    db_session.flush()

    child = Student(name="Learner Step14", age=7)
    parent_record.children.append(child)
    db_session.add(child)
    db_session.flush()

    # 2. Teacher & Student
    teacher_user = User(
        email=f"teacher_step14_{unique}@test.com",
        name="Teacher Step14",
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

    # 4. Another unrelated parent & child for unauthorized access testing
    other_parent_user = User(
        email=f"other_parent_step14_{unique}@test.com",
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

    # Add real historical reading sessions for child across multiple days
    now = datetime.now(timezone.utc)
    today = now.date()

    # Day 0 (today): 2 sessions (readingFluency & comprehension)
    s1 = LearningSession(
        student_id=child.id,
        skill="readingFluency",
        started_at=now - timedelta(minutes=10),
        completed_at=now - timedelta(minutes=5),
        outcome={"accuracy": 85, "title": "Read With Me"},
        stars=3,
        xp=20,
    )
    s2 = LearningSession(
        student_id=child.id,
        skill="comprehension",
        started_at=now - timedelta(minutes=4),
        completed_at=now - timedelta(minutes=1),
        outcome={"accuracy": 90, "title": "Story Time"},
        stars=3,
        xp=25,
    )

    # Day 1 (yesterday): 1 session (readingFluency with lower accuracy)
    yesterday = now - timedelta(days=1)
    s3 = LearningSession(
        student_id=child.id,
        skill="readingFluency",
        started_at=yesterday - timedelta(minutes=10),
        completed_at=yesterday,
        outcome={"accuracy": 75, "title": "Read With Me"},
        stars=2,
        xp=15,
    )

    # Day 2 (two days ago): 1 session (wordRecognition)
    two_days_ago = now - timedelta(days=2)
    s4 = LearningSession(
        student_id=child.id,
        skill="wordRecognition",
        started_at=two_days_ago - timedelta(minutes=8),
        completed_at=two_days_ago,
        outcome={"accuracy": 70, "title": "Word Builder"},
        stars=2,
        xp=15,
    )

    # Day 15 (15 days ago): 1 session (phonologicalAwareness)
    fifteen_days_ago = now - timedelta(days=15)
    s5 = LearningSession(
        student_id=child.id,
        skill="phonologicalAwareness",
        started_at=fifteen_days_ago - timedelta(minutes=10),
        completed_at=fifteen_days_ago,
        outcome={"accuracy": 80, "title": "Sound Safari"},
        stars=3,
        xp=20,
    )

    # Day 45 (45 days ago): 1 session (pronunciation)
    forty_five_days_ago = now - timedelta(days=45)
    s6 = LearningSession(
        student_id=child.id,
        skill="pronunciation",
        started_at=forty_five_days_ago - timedelta(minutes=10),
        completed_at=forty_five_days_ago,
        outcome={"accuracy": 65, "title": "Speak & Shine"},
        stars=2,
        xp=15,
    )

    # Sessions for cls_student (yesterday)
    s_cls = LearningSession(
        student_id=cls_student.id,
        skill="readingFluency",
        started_at=yesterday - timedelta(minutes=10),
        completed_at=yesterday,
        outcome={"accuracy": 88, "title": "Classroom Reading"},
        stars=3,
        xp=20,
    )

    db_session.add_all([s1, s2, s3, s4, s5, s6, s_cls])

    # ReadingFingerprint for child
    fp = ReadingFingerprint(
        student_id=child.id,
        phonological_awareness=65.0,
        pronunciation=60.0,
        word_recognition=70.0,
        reading_fluency=85.0,
        comprehension=88.0,
        recorded_at=now,
    )
    db_session.add(fp)

    db_session.commit()

    return {
        "parent_user": parent_user,
        "teacher_user": teacher_user,
        "other_parent_user": other_parent_user,
        "child": child,
        "cls_student": cls_student,
        "empty_child": empty_child,
        "other_child": other_child,
    }


def auth_headers(user: User) -> dict:
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    token = create_access_token(subject=str(user.id), role=role_val)
    return {"Authorization": f"Bearer {token}"}


# ==========================================
# 30 Comprehensive Pytest Tests for Step 14
# ==========================================

# 1. Empty history
def test_01_empty_history(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['empty_child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["child_id"] == seed_data["empty_child"].id
    assert len(data["days"]) == 0
    assert data["summary"]["active_days"] == 0
    assert data["summary"]["data_sufficiency"] == "insufficient"
    assert "No learning activity" in data["summary"]["note"]


# 2. One session (cls_student has exactly 1 session)
def test_02_one_session(client: TestClient, seed_data):
    headers = auth_headers(seed_data["teacher_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['cls_student'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["days"]) == 1
    assert data["summary"]["active_days"] == 1
    assert data["summary"]["total_activities"] == 1
    assert data["summary"]["data_sufficiency"] == "limited"


# 3. Multiple sessions
def test_03_multiple_sessions(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["total_activities"] == 4  # s1, s2 today + s3 yesterday + s4 2 days ago


# 4. Multiple activities same day
def test_04_multiple_activities_same_day(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    today_item = data["days"][0]
    assert today_item["activity_count"] == 2
    assert today_item["completed_count"] == 2


# 5. Date grouping
def test_05_date_grouping(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    dates = [d["date"] for d in data["days"]]
    assert len(dates) == len(set(dates)), "No duplicate dates in day-by-day response"
    assert len(dates) == 3  # today, yesterday, 2 days ago


# 6. 7-day range
def test_06_seven_day_range(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["period"] == 7
    assert data["summary"]["total_activities"] == 4


# 7. 30-day range
def test_07_thirty_day_range(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=30", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["period"] == 30
    assert data["summary"]["total_activities"] == 5  # includes 15 days ago


# 8. 90-day range
def test_08_ninety_day_range(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=90", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["period"] == 90
    assert data["summary"]["total_activities"] == 6  # includes 45 days ago


# 9. Actual timestamps
def test_09_actual_timestamps(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["days"][0]["date"] == datetime.now(timezone.utc).date().isoformat()


# 10. Activity count
def test_10_activity_count(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    total = sum(d["activity_count"] for d in data["days"])
    assert total == data["summary"]["total_activities"]


# 11. Learning time
def test_11_learning_time(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    today_item = data["days"][0]
    assert today_item["learning_minutes"] >= 1


# 12. Skill aggregation
def test_12_skill_aggregation(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    today_item = data["days"][0]
    assert "reading_fluency" in today_item["skills"]
    assert "comprehension" in today_item["skills"]


# 13. Reading performance
def test_13_reading_performance(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    today_item = data["days"][0]
    assert today_item["reading_performance"] == 85.0


# 14. Comprehension performance
def test_14_comprehension_performance(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    today_item = data["days"][0]
    assert today_item["comprehension_performance"] == 90.0


# 15. Word recognition performance
def test_15_word_recognition_performance(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    two_days_item = data["days"][2]
    assert two_days_item["word_recognition"] == 70.0


# 16. Skill delta change calculation
def test_16_skill_change_calculation(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    # readingFluency was 75 yesterday, 85 today -> +10 change
    today_item = data["days"][0]
    fluency_change = next(c for c in today_item["changes"] if c["skill"] == "reading_fluency")
    assert fluency_change["change"] == 10.0


# 17. Improving skill pattern
def test_17_improving_skill_pattern(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    today_item = data["days"][0]
    assert any("improved compared with the previous session" in p for p in today_item["patterns"])


# 18. Declining skill pattern
def test_18_declining_skill_pattern(client: TestClient, seed_data, db_session):
    now = datetime.now(timezone.utc)
    declining_session = LearningSession(
        student_id=seed_data["cls_student"].id,
        skill="readingFluency",
        started_at=now - timedelta(minutes=5),
        completed_at=now,
        outcome={"accuracy": 50, "title": "Struggling Read"},
        stars=1,
        xp=10,
    )
    db_session.add(declining_session)
    db_session.commit()

    headers = auth_headers(seed_data["teacher_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['cls_student'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    today_item = data["days"][0]
    fluency_change = next(c for c in today_item["changes"] if c["skill"] == "reading_fluency")
    assert fluency_change["trend"] == "needs_practice"
    assert any("needs more practice" in p for p in today_item["patterns"])


# 19. Insufficient history handling
def test_19_insufficient_history(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['empty_child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["data_sufficiency"] == "insufficient"


# 20. Active learning days count
def test_20_active_learning_days(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    # 3 active days in the last 7 days: today, yesterday, 2 days ago
    assert data["summary"]["active_days"] == 3


# 21. Current streak calculation
def test_21_current_streak(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    # today, yesterday, 2 days ago consecutive -> 3 days streak
    assert data["summary"]["current_streak"] == 3


# 22. Longest streak calculation
def test_22_longest_streak(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=90", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["longest_streak"] >= 3


# 23. Authorization protection (Missing token)
def test_23_authorization_required(client: TestClient, seed_data):
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7")
    assert res.status_code in (401, 403)


# 24. Parent child access allowed
def test_24_parent_child_access(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200


# 25. Teacher student access allowed
def test_25_teacher_student_access(client: TestClient, seed_data):
    headers = auth_headers(seed_data["teacher_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['cls_student'].id}?period=7", headers=headers)
    assert res.status_code == 200


# 26. Unauthorized child access blocked
def test_26_unauthorized_child_blocked(client: TestClient, seed_data):
    # parent_user tries to access other_child owned by other_parent_user
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['other_child'].id}?period=7", headers=headers)
    assert res.status_code == 403


# 27. Deterministic results
def test_27_deterministic_results(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res1 = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers).json()
    res2 = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers).json()
    assert res1 == res2


# 28. No fabricated metrics (null when unpracticed)
def test_28_no_fabricated_metrics(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    today_item = data["days"][0]
    # In today's session, word_recognition was NOT practiced -> must be null, not 0 or fake score
    assert today_item["word_recognition"] is None
    assert today_item["phonological_awareness"] is None


# 29. API response schema
def test_29_api_response_schema(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get(f"/api/progress/day-by-day/{seed_data['child'].id}?period=7", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "child_id" in data
    assert "period" in data
    assert "start_date" in data
    assert "end_date" in data
    assert "days" in data
    assert "summary" in data
    assert "disclaimer" in data
    assert "Not a clinical or medical diagnosis" in data["disclaimer"]


# 30. Non-existent child returns 404
def test_30_non_existent_child(client: TestClient, seed_data):
    headers = auth_headers(seed_data["parent_user"])
    res = client.get("/api/progress/day-by-day/999999?period=7", headers=headers)
    assert res.status_code in (403, 404)
