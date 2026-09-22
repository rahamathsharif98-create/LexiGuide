"""Phase 8 Step 2 — real speech & reading analysis tests.

Uses MockSpeechToTextService/MockAIAnalysisService throughout (AI_MODE
defaults to "mock" — see app/config.py) so this suite needs no external AI
API, no network access, and no Whisper install, per the task's explicit
"do not require an external AI API for normal automated tests" rule.
RealSpeechToTextService/RealAIAnalysisService are exercised only by the
interface/config tests near the bottom (construction + mode selection),
not by transcribing real audio.
"""
import io
import wave

import pytest

from app.ai.alignment import align_words, analyze_reading
from app.ai.stt.mock import MockSpeechToTextService
from app.ai.factory import get_ai_analysis_service, get_stt_service
from tests.factories import make_student, make_parent, make_teacher_with_class
from app.models import User, UserRole
from app.utils.security import hash_password


def _tiny_wav_bytes(seconds: float = 0.5) -> bytes:
    """A minimal, valid, silent WAV file — enough to pass format/size
    validation and (for RealSpeechToTextService) be openable by the
    stdlib `wave` module for duration probing. No real speech content;
    MockSpeechToTextService never inspects audio content anyway.
    """
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(16000)
        n_frames = int(16000 * seconds)
        w.writeframes(b"\x00\x00" * n_frames)
    return buf.getvalue()


def _login_parent_with_child(client, db_session):
    parent = make_parent(db_session, email="stt_parent@test.demo")
    user = db_session.query(User).filter(User.id == parent.user_id).first()
    user.password_hash = hash_password("pw")
    db_session.commit()
    child = make_student(db_session, name="STTChild")
    parent.children.append(child)
    db_session.commit()
    token = client.post("/api/auth/login", json={"email": user.email, "password": "pw"}).json()["access_token"]
    return child, token


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------
# 1. Alignment algorithm (pure function, no DB/app needed)
# ---------------------------------------------------------------------

def test_alignment_perfect_reading():
    r = analyze_reading("The cat sat on the mat", "The cat sat on the mat")
    assert r["words_correct"] == 6
    assert r["omissions"] == 0 and r["substitutions"] == 0 and r["insertions"] == 0
    assert r["accuracy"] == 100.0


def test_alignment_detects_omission():
    # "is" is dropped — matches the spec's own worked example
    r = analyze_reading("The cat is on the mat", "The cat on the mat")
    assert r["omissions"] == 1
    ops = [o["op"] for o in r["error_words"]]
    assert "omission" in ops
    omitted = next(o for o in r["error_words"] if o["op"] == "omission")
    assert omitted["expected"] == "is"


def test_alignment_detects_substitution():
    r = analyze_reading("The big dog ran", "The big cat ran")
    assert r["substitutions"] == 1
    assert r["words_correct"] == 3


def test_alignment_detects_insertion():
    r = analyze_reading("The cat sat", "The little cat sat")
    assert r["insertions"] == 1
    inserted = next(o for o in r["error_words"] if o["op"] == "insertion")
    assert inserted["recognized"] == "little"


def test_alignment_detects_repetition():
    r = analyze_reading("The cat sat", "The the cat sat")
    assert r["repetitions"] == 1
    assert r["insertions"] == 0  # reclassified as repetition, not a generic insertion


def test_alignment_word_order_mismatch():
    r = analyze_reading("cat the sat", "the cat sat")
    assert r["word_order_mismatch"] is True


def test_alignment_no_false_word_order_mismatch_on_real_errors():
    # different word sets -> not a pure order issue, must not be flagged
    r = analyze_reading("The cat sat", "The dog sat")
    assert r["word_order_mismatch"] is False


def test_alignment_single_omission_does_not_cascade_into_false_substitutions():
    # Regression check for the exact Phase 7 naive-positional-compare bug:
    # dropping one early word must not misclassify every later word.
    r = analyze_reading("one two three four five", "one three four five")
    assert r["omissions"] == 1
    assert r["substitutions"] == 0
    assert r["words_correct"] == 4


# ---------------------------------------------------------------------
# 2. Mock speech-to-text
# ---------------------------------------------------------------------

def test_mock_stt_echoes_hint_and_flags_is_mock():
    svc = MockSpeechToTextService()
    result = svc.transcribe(_tiny_wav_bytes(), "reading.wav", language="en", expected_text_hint="The cat sat")
    assert result["transcription"] == "The cat sat"
    assert result["is_mock"] is True
    assert result["confidence"] is None
    assert result["status"] == "ok"


def test_mock_stt_without_hint_returns_empty_transcript_not_fabricated_text():
    svc = MockSpeechToTextService()
    result = svc.transcribe(_tiny_wav_bytes(), "reading.wav")
    assert result["transcription"] == ""
    assert result["status"] == "mock_no_hint_provided"


def test_mock_stt_rejects_empty_audio():
    svc = MockSpeechToTextService()
    with pytest.raises(ValueError):
        svc.transcribe(b"", "reading.wav")


def test_factory_returns_mock_services_by_default():
    assert get_ai_analysis_service().analyze_speech("a b", "a b")["is_mock"] is True
    assert get_stt_service().transcribe(_tiny_wav_bytes(), "x.wav")["is_mock"] is True


# ---------------------------------------------------------------------
# 3. Audio upload validation (POST /api/speech/transcribe)
# ---------------------------------------------------------------------

def test_transcribe_rejects_unsupported_format(client):
    r = client.post(
        "/api/speech/transcribe",
        files={"audio": ("reading.txt", b"not audio", "text/plain")},
    )
    assert r.status_code == 400


def test_transcribe_rejects_empty_file(client):
    r = client.post(
        "/api/speech/transcribe",
        files={"audio": ("reading.wav", b"", "audio/wav")},
    )
    assert r.status_code == 400


def test_transcribe_rejects_oversized_file(client, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "MAX_AUDIO_UPLOAD_MB", 0)  # anything is "too big"
    r = client.post(
        "/api/speech/transcribe",
        files={"audio": ("reading.wav", _tiny_wav_bytes(), "audio/wav")},
    )
    assert r.status_code == 400


def test_transcribe_succeeds_with_valid_wav_and_hint(client):
    r = client.post(
        "/api/speech/transcribe",
        files={"audio": ("reading.wav", _tiny_wav_bytes(), "audio/wav")},
        data={"language": "en", "expected_text_hint": "The dog runs fast"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["transcription"] == "The dog runs fast"
    assert body["is_mock"] is True


def test_transcribe_accepts_content_type_with_codec_parameter(client):
    # Real browser MediaRecorder blobs are typically
    # "audio/webm;codecs=opus", not bare "audio/webm" — must not be
    # rejected as an unsupported format (regression test for a bug found
    # and patched during the Phase 8 Step 2 review).
    r = client.post(
        "/api/speech/transcribe",
        files={"audio": ("reading.webm", _tiny_wav_bytes(), "audio/webm;codecs=opus")},
        data={"expected_text_hint": "hi"},
    )
    assert r.status_code == 200


def test_transcribe_is_unauthenticated_by_design(client):
    # No Authorization header sent — must still succeed (see speech.py docstring)
    r = client.post(
        "/api/speech/transcribe",
        files={"audio": ("reading.wav", _tiny_wav_bytes(), "audio/wav")},
        data={"expected_text_hint": "hello"},
    )
    assert r.status_code == 200


# ---------------------------------------------------------------------
# 4. Full closed-loop audio reading session
#    (Reading Session -> STT -> Analysis -> Fingerprint -> Recommendations)
# ---------------------------------------------------------------------

def test_audio_reading_session_closed_loop(client, db_session):
    child, token = _login_parent_with_child(client, db_session)

    r = client.post(
        f"/api/reading/session-audio?child_id={child.id}",
        files={"audio": ("reading.wav", _tiny_wav_bytes(), "audio/wav")},
        data={"expected_text": "The little fox runs fast", "duration_seconds": "10", "stars": "3", "xp": "20"},
        headers=_headers(token),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["transcription"] == "The little fox runs fast"
    assert body["words_correct"] == 5
    assert body["stt_is_mock"] is True
    assert body["analysis_is_mock"] is True
    assert body["words_per_minute"] is not None  # duration was supplied
    assert body["words_per_minute_is_approximate"] is True

    after = client.get(f"/api/fingerprint/{child.id}", headers=_headers(token)).json()
    # A perfect reading (100% accuracy) must nudge reading_fluency UP from
    # the documented 55.0 default (see fingerprint_service.DEFAULT_FINGERPRINT).
    assert after["current"] is not None
    assert after["current"]["reading_fluency"] > 55.0

    hist = client.get(f"/api/reading/history/{child.id}", headers=_headers(token)).json()
    assert len(hist) == 1

    recs = client.get(f"/api/recommendations/{child.id}", headers=_headers(token)).json()
    assert isinstance(recs, list) and len(recs) >= 1
    assert all("reason" in r_ for r_ in recs)  # explainable, not an unexplained AI decision


def test_audio_session_rejects_empty_expected_text(client, db_session):
    child, token = _login_parent_with_child(client, db_session)
    r = client.post(
        f"/api/reading/session-audio?child_id={child.id}",
        files={"audio": ("reading.wav", _tiny_wav_bytes(), "audio/wav")},
        data={"expected_text": "   "},
        headers=_headers(token),
    )
    assert r.status_code == 400


def test_audio_session_without_duration_has_no_wpm(client, db_session):
    child, token = _login_parent_with_child(client, db_session)
    r = client.post(
        f"/api/reading/session-audio?child_id={child.id}",
        files={"audio": ("reading.wav", _tiny_wav_bytes(), "audio/wav")},
        data={"expected_text": "Cats are nice"},
        headers=_headers(token),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["words_per_minute"] is None
    assert body["words_per_minute_is_approximate"] is False


# ---------------------------------------------------------------------
# 5. Unauthorized access to the two new endpoints
# ---------------------------------------------------------------------

def test_parent_cannot_create_audio_session_for_another_parents_child(client, db_session):
    _child_a, token_a = _login_parent_with_child(client, db_session)
    parent_b = make_parent(db_session, email="stt_parentB@test.demo")
    child_b = make_student(db_session, name="OtherChild")
    parent_b.children.append(child_b)
    db_session.commit()

    r = client.post(
        f"/api/reading/session-audio?child_id={child_b.id}",
        files={"audio": ("reading.wav", _tiny_wav_bytes(), "audio/wav")},
        data={"expected_text": "hello"},
        headers=_headers(token_a),
    )
    assert r.status_code == 403


def test_parent_cannot_submit_comprehension_for_another_parents_child(client, db_session):
    _child_a, token_a = _login_parent_with_child(client, db_session)
    parent_b = make_parent(db_session, email="stt_parentC@test.demo")
    child_b = make_student(db_session, name="OtherChild2")
    parent_b.children.append(child_b)
    db_session.commit()

    r = client.post(
        f"/api/reading/comprehension?child_id={child_b.id}",
        json={"questions": [{"question": "Q1", "correct_answer": "cat", "child_answer": "cat"}]},
        headers=_headers(token_a),
    )
    assert r.status_code == 403


# ---------------------------------------------------------------------
# 6. Comprehension scoring
# ---------------------------------------------------------------------

def test_comprehension_scoring_and_fingerprint_integration(client, db_session):
    child, token = _login_parent_with_child(client, db_session)

    r = client.post(
        f"/api/reading/comprehension?child_id={child.id}",
        json={
            "questions": [
                {"question": "What color was the cat?", "correct_answer": "orange", "child_answer": "orange"},
                {"question": "Where did it sleep?", "correct_answer": "the mat", "child_answer": "the couch"},
            ],
            "stars": 2, "xp": 10,
        },
        headers=_headers(token),
    )
    assert r.status_code == 200
    body = r.json()
    assert body["score"] == 1
    assert body["total"] == 2
    assert body["percentage"] == 50.0
    assert body["questions"][0]["is_correct"] is True
    assert body["questions"][1]["is_correct"] is False

    after = client.get(f"/api/fingerprint/{child.id}", headers=_headers(token)).json()
    # 50% comprehension nudges the comprehension skill DOWN from the 55.0
    # default (see fingerprint_service.DEFAULT_FINGERPRINT): (50-70)/6 < 0.
    assert after["current"] is not None
    assert after["current"]["comprehension"] < 55.0


def test_comprehension_requires_at_least_one_question(client, db_session):
    child, token = _login_parent_with_child(client, db_session)
    r = client.post(
        f"/api/reading/comprehension?child_id={child.id}",
        json={"questions": []},
        headers=_headers(token),
    )
    assert r.status_code == 400


# ---------------------------------------------------------------------
# 7. Non-diagnostic language guardrail (reused from Phase 5, still holds)
# ---------------------------------------------------------------------

def test_audio_session_response_contains_no_forbidden_diagnostic_language(client, db_session):
    from app.utils.language import contains_forbidden_language
    child, token = _login_parent_with_child(client, db_session)
    r = client.post(
        f"/api/reading/session-audio?child_id={child.id}",
        files={"audio": ("reading.wav", _tiny_wav_bytes(), "audio/wav")},
        data={"expected_text": "The cat sat"},
        headers=_headers(token),
    )
    assert not contains_forbidden_language(str(r.json()))


# ---------------------------------------------------------------------
# 8. Real-mode configuration (interface only — no network/model download)
# ---------------------------------------------------------------------

def test_real_ai_analysis_service_matches_mock_interface_and_labels_is_mock_false():
    from app.ai.real import RealAIAnalysisService
    result = RealAIAnalysisService().analyze_speech("The cat sat", "The cat sat")
    assert result["is_mock"] is False
    assert result["words_correct"] == 3
    # "confidence" is an STT-level concept, not produced by the analysis
    # service at all — never fabricated here.
    assert "confidence" not in result


def test_real_stt_raises_clear_runtime_error_without_whisper_installed():
    from app.ai.stt.real import RealSpeechToTextService
    svc = RealSpeechToTextService()
    with pytest.raises((RuntimeError, ImportError)):
        svc.transcribe(_tiny_wav_bytes(), "reading.wav")


def test_ai_mode_real_selects_real_services(monkeypatch):
    from app.config import settings
    from app.ai.real import RealAIAnalysisService
    from app.ai.stt.real import RealSpeechToTextService
    monkeypatch.setattr(settings, "AI_MODE", "real")
    assert isinstance(get_ai_analysis_service(), RealAIAnalysisService)
    assert isinstance(get_stt_service(), RealSpeechToTextService)
