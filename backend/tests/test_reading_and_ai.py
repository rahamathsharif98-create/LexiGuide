from tests.factories import make_student
from app.models import User, UserRole
from app.utils.security import hash_password
from app.ai.mock import MockAIAnalysisService
from app.ai.base import AIAnalysisService


def test_mock_ai_service_implements_the_interface():
    assert issubclass(MockAIAnalysisService, AIAnalysisService)


def test_mock_ai_service_detects_a_perfect_reading():
    svc = MockAIAnalysisService()
    result = svc.analyze_speech("The cat sat", "The cat sat")
    assert result["is_mock"] is True
    assert result["accuracy"] == 100.0
    assert result["words_correct"] == 3
    assert result["substitutions"] == 0
    assert result["omissions"] == 0


def test_mock_ai_service_detects_omissions_and_substitutions():
    svc = MockAIAnalysisService()
    result = svc.analyze_speech("The big brown fox jumps", "The big fox")
    assert result["substitutions"] >= 1 or result["omissions"] >= 1
    assert result["accuracy"] < 100.0


def _login_child(client, db_session):
    student = make_student(db_session, name="ReadingKid", fp={
        "phonological_awareness": 60, "pronunciation": 60, "word_recognition": 60,
        "reading_fluency": 60, "comprehension": 60,
    })
    user = User(name="ReadingKid", email="readingkid@test.demo", role=UserRole.child, password_hash=hash_password("pw"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    student.user_id = user.id
    db_session.commit()
    token = client.post("/api/auth/login", json={"email": "readingkid@test.demo", "password": "pw"}).json()["access_token"]
    return student, token


def test_speech_analyze_endpoint_is_stateless(client):
    r = client.post("/api/speech/analyze", json={"expected_text": "The dog runs", "recognized_text": "The dog runs"})
    assert r.status_code == 200
    assert r.json()["is_mock"] is True


def test_full_reading_session_closed_loop(client, db_session):
    student, token = _login_child(client, db_session)
    headers = {"Authorization": f"Bearer {token}"}

    before = client.get(f"/api/fingerprint/{student.id}", headers=headers).json()
    before_history_len = len(before["history"])

    r = client.post(f"/api/reading/session?child_id={student.id}", json={
        "expected_text": "The little fox runs fast",
        "recognized_text": "The little fox runs fast",
        "duration_seconds": 10, "stars": 3, "xp": 20,
    }, headers=headers)
    assert r.status_code == 201
    detail = r.json()
    assert detail["words_correct"] == 5

    after = client.get(f"/api/fingerprint/{student.id}", headers=headers).json()
    assert len(after["history"]) == before_history_len + 1  # exactly one new snapshot recorded

    hist = client.get(f"/api/reading/history/{student.id}", headers=headers).json()
    assert len(hist) == 1

    recs = client.get(f"/api/recommendations/{student.id}", headers=headers).json()
    assert isinstance(recs, list)
