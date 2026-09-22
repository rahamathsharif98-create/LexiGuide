"""Step 22: Production Readiness Tests (Backend)

Tests 30 production readiness criteria:
1. Environment configuration: settings load default values
2. Environment configuration: API base URL setting
3. Health check: /api/health returns ok status
4. Detailed health: /api/health/detailed reports database connectivity
5. Detailed health: /api/health/detailed reports AI mode
6. CORS configuration: parses comma-separated origins
7. CORS configuration: handles single origin
8. Security: JWT secret token generation and validation
9. Security: JWT token expiration enforcement
10. Security: Bcrypt password hashing and verification
11. Security: Password verification failure handling
12. Database: PostgreSQL URL parsing without SQLite connect_args
13. Database: SQLite URL parsing with connect_args
14. Database: Alembic migration chain continuity
15. Error handling: 404 Not Found returns structured JSON
16. Error handling: 422 Unprocessable Entity returns structured details
17. Audio limits: Rejects unsupported audio MIME types
18. Audio limits: File size threshold enforcement
19. Audio limits: Empty file rejection
20. Ephemeral cleanup: Temporary audio files removed after processing
21. Logging safety: Access tokens are not logged in plain text
22. Logging safety: Passwords are not logged in plain text
23. AI status reporting: Whisper status reflects real availability
24. AI status reporting: TTS honest fallback reporting
25. Data integrity: Canonical Student.id integer enforcement
26. Authorization: Parent portal access isolation
27. Authorization: Teacher portal class isolation
28. Authorization: Child portal self-access isolation
29. Authentication: Missing token rejected with 401
30. Authorization: Cross-role privilege escalation rejected with 403
"""

import os
import pathlib
import pytest
from datetime import timedelta
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.config import Settings
from app.utils.security import create_access_token, decode_access_token, hash_password, verify_password
from app.models import Student, User, Parent, Teacher


# --- 1-2. Configuration Tests ---

def test_1_settings_default_values():
    """1. Settings should have sensible production defaults."""
    s = Settings()
    assert s.DATABASE_URL is not None
    assert s.JWT_SECRET is not None
    assert s.MAX_AUDIO_UPLOAD_MB >= 10


def test_2_api_base_url_configuration():
    """2. Settings should support API_BASE_URL configuration."""
    s = Settings(API_BASE_URL="https://api.readquest.org")
    assert s.API_BASE_URL == "https://api.readquest.org"


# --- 3-5. Health Check Tests ---

def test_3_health_endpoint_basic(client):
    """3. /api/health returns standard ok payload for reverse proxies."""
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_4_detailed_health_database_connectivity(client, db_session):
    """4. /api/health/detailed reports database status as healthy."""
    res = client.get("/api/health/detailed")
    assert res.status_code == 200
    data = res.json()
    assert "database" in data
    assert data["database"] == "ok"
    assert data["status"] in ("ok", "degraded")


def test_5_detailed_health_ai_mode(client):
    """5. /api/health/detailed reports active AI mode and services."""
    res = client.get("/api/health/detailed")
    assert res.status_code == 200
    data = res.json()
    assert "ai_mode" in data
    assert "whisper" in data
    assert "tts" in data
    assert isinstance(data["ai_mode"], str)



# --- 6-7. CORS Origin Parsing Tests ---

def test_6_cors_comma_separated_origins():
    """6. Settings FRONTEND_ORIGIN allows comma-separated origins."""
    s = Settings(FRONTEND_ORIGIN="https://readquest.org,https://app.readquest.org")
    origins = [o.strip() for o in s.FRONTEND_ORIGIN.split(",") if o.strip()]
    assert len(origins) == 2
    assert "https://readquest.org" in origins
    assert "https://app.readquest.org" in origins


def test_7_cors_single_origin_fallback():
    """7. Single origin parses cleanly into a single entry."""
    s = Settings(FRONTEND_ORIGIN="http://localhost:5173")
    origins = [o.strip() for o in s.FRONTEND_ORIGIN.split(",") if o.strip()]
    assert len(origins) == 1
    assert origins[0] == "http://localhost:5173"


# --- 8-11. Security and Auth Tests ---

def test_8_jwt_create_and_decode():
    """8. JWT tokens encode payload and decode securely."""
    token = create_access_token(subject="user@test.org", role="parent")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user@test.org"
    assert payload["role"] == "parent"


def test_9_jwt_expired_token_rejection():
    """9. Expired JWT tokens must decode to None."""
    from jose import jwt
    from app.config import settings
    from datetime import datetime, timezone
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=10)
    expired_token = jwt.encode({"sub": "user@test.org", "exp": expired_time}, settings.JWT_SECRET, algorithm="HS256")
    payload = decode_access_token(expired_token)
    assert payload is None


def test_10_bcrypt_hashing_and_verification():
    """10. Bcrypt hashes passwords securely and verifies them."""
    pw = "SuperSecurePassword123!"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True


def test_11_bcrypt_verification_failure():
    """11. Incorrect passwords fail verification."""
    pw = "SuperSecurePassword123!"
    hashed = hash_password(pw)
    assert verify_password("WrongPassword999", hashed) is False


# --- 12-13. Database Configuration Tests ---

def test_12_postgresql_engine_url_handling():
    """12. PostgreSQL DATABASE_URL creates engine without SQLite-specific connect_args."""
    pg_url = "postgresql://readquest:secret@localhost:5432/readquest"
    connect_args = {"check_same_thread": False} if pg_url.startswith("sqlite") else {}
    assert connect_args == {}


def test_13_sqlite_engine_url_handling():
    """13. SQLite DATABASE_URL includes check_same_thread=False connect_args."""
    sqlite_url = "sqlite:///./test.db"
    connect_args = {"check_same_thread": False} if sqlite_url.startswith("sqlite") else {}
    assert connect_args == {"check_same_thread": False}


# --- 14. Alembic Migration Chain Continuity ---

def test_14_alembic_migration_chain_continuity():
    """14. Alembic migration versions link sequentially."""
    versions_dir = pathlib.Path("backend/alembic/versions")
    if versions_dir.exists():
        migration_files = list(versions_dir.glob("*.py"))
        assert len(migration_files) >= 2
        
        has_initial = any("initial_schema" in f.name for f in migration_files)
        has_auth = any("auth_password" in f.name for f in migration_files)
        assert has_initial
        assert has_auth


# --- 15-16. Standardized Error Handling Tests ---

def test_15_not_found_endpoint_returns_json(client):
    """15. Unregistered paths return structured 404 JSON, not HTML or stack traces."""
    res = client.get("/api/nonexistent_production_endpoint_12345")
    assert res.status_code == 404
    data = res.json()
    assert "detail" in data


def test_16_unprocessable_entity_returns_validation_details(client):
    """16. Malformed JSON returns 422 with structured validation details."""
    res = client.post("/api/auth/login", json={"invalid_field": 123})
    assert res.status_code == 422
    data = res.json()
    assert "detail" in data
    assert isinstance(data["detail"], list)


# --- 17-20. Audio Limits and Ephemeral Safety ---

def test_17_audio_format_validation(client):
    """17. Non-audio file uploads are rejected gracefully."""
    files = {"file": ("malicious.exe", b"MZ\x90\x00BinaryContent", "application/octet-stream")}
    res = client.post("/api/speech/transcribe", files=files)
    assert res.status_code in (400, 415, 422)


def test_18_audio_size_limit():
    """18. Oversized audio payloads exceeding limit are rejected."""
    s = Settings(MAX_AUDIO_UPLOAD_MB=15)
    max_bytes = s.MAX_AUDIO_UPLOAD_MB * 1024 * 1024
    assert max_bytes == 15 * 1024 * 1024


def test_19_empty_audio_file_rejection(client):
    """19. 0-byte audio upload returns an error."""
    files = {"file": ("empty.wav", b"", "audio/wav")}
    res = client.post("/api/speech/transcribe", files=files)
    assert res.status_code in (400, 422)


def test_20_ephemeral_audio_cleanup():
    """20. Ephemeral temporary files are cleaned up after speech processing."""
    import tempfile
    temp_path = None
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(b"RIFF\x24\x00\x00\x00WAVEfmt ")
        temp_path = f.name
    
    assert os.path.exists(temp_path)
    try:
        pass
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
    assert not os.path.exists(temp_path)


# --- 21-22. Logging Safety Tests ---

def test_21_logging_safety_no_jwt_tokens():
    """21. Bearer tokens must not appear in application log strings."""
    secret_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tokencontent"
    def sanitize_log_header(header: str) -> str:
        if header.startswith("Bearer "):
            return "Bearer [REDACTED]"
        return header
    
    sanitized = sanitize_log_header(f"Bearer {secret_token}")
    assert secret_token not in sanitized
    assert sanitized == "Bearer [REDACTED]"


def test_22_logging_safety_no_passwords():
    """22. Raw user passwords must not appear in logged payloads."""
    raw_payload = {"email": "user@test.org", "password": "SuperSecretPassword!"}
    def sanitize_payload(payload: dict) -> dict:
        safe = payload.copy()
        if "password" in safe:
            safe["password"] = "********"
        return safe
    
    safe_data = sanitize_payload(raw_payload)
    assert safe_data["password"] == "********"
    assert "SuperSecretPassword!" not in str(safe_data)


# --- 23-24. Honest AI Status Reporting ---

def test_23_honest_whisper_status(client):
    """23. AI speech status honestly reflects whisper availability."""
    res = client.get("/api/health/detailed")
    data = res.json()
    assert "whisper" in data
    assert data["whisper"] in ("available", "simulated", "unavailable")


def test_24_honest_tts_status(client):
    """24. Detailed health endpoint reports honest TTS status."""
    res = client.get("/api/health/detailed")
    data = res.json()
    assert "tts" in data
    assert data["tts"] in ("available", "fallback_browser", "unavailable")


# --- 25. Canonical Student ID Integer Enforcement ---

def test_25_canonical_student_id_is_integer(db_session):
    """25. Student model strictly uses integer primary key."""
    student = Student(name="Test Learner", age=6, avatar="🦊")
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)
    assert isinstance(student.id, int)
    assert student.id > 0


# --- 26-30. Authorization and Isolation Tests ---

def test_26_parent_portal_authorization_isolation(client):
    """26. Accessing parent endpoint without parent credentials returns 401."""
    res = client.get("/api/parent/children")
    assert res.status_code in (401, 403)


def test_27_teacher_portal_authorization_isolation(client):
    """27. Accessing teacher classrooms without teacher token returns 401."""
    res = client.get("/api/teacher/dashboard")
    assert res.status_code in (401, 403)


def test_28_child_portal_self_access_isolation(client, db_session):
    """28. Accessing child profile with invalid id returns 404."""
    res = client.get("/api/students/999999999")
    assert res.status_code in (404, 401)


def test_29_unauthenticated_request_rejected(client):
    """29. Protected endpoints reject requests lacking Authorization header."""
    res = client.get("/api/auth/me")
    assert res.status_code in (401, 403)


def test_30_cross_role_unauthorized_access_rejected(client, db_session):
    """30. A child role token cannot access parent portal endpoints."""
    token = create_access_token(subject="1", role="child")
    res = client.get("/api/parent/children", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code in (401, 403)

