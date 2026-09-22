"""MOCK speech-to-text. Does NOT pretend to understand arbitrary audio —
there is no real audio decoding here at all. For development/testing
convenience it can echo back an `expected_text_hint` (simulating "the
child read it perfectly") ONLY when the caller supplies one; a real
implementation must ignore that parameter entirely (see base.py). Every
response is labeled is_mock: True.
"""
from app.ai.stt.base import SpeechToTextService


class MockSpeechToTextService(SpeechToTextService):
    @property
    def ai_mode(self) -> str:
        return "mock"

    def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        language: str | None = None,
        expected_text_hint: str | None = None,
    ) -> dict:
        if not audio_bytes:
            raise ValueError("Audio data is empty")

        transcription = expected_text_hint.strip() if expected_text_hint else ""
        status = "ok" if transcription else "mock_no_hint_provided"

        return {
            "transcription": transcription,
            "language": language or "en",
            "confidence": None,  # mock has no real recognition confidence to report
            "duration_seconds": None,  # not derivable without real audio decoding
            "analysis_available": True,
            "ai_mode": "mock",
            "is_mock": True,
            "status": status,
        }
