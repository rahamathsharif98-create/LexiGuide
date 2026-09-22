"""Abstract interface for speech-to-text. A REAL implementation (Whisper or
a Whisper-compatible model) subclasses this with the exact same method
signature as the mock — no caller (app/routers/speech.py,
app/routers/reading.py) needs to change when swapping; only which class
app/ai/factory.py instantiates, controlled by the AI_MODE env var.
"""
from abc import ABC, abstractmethod


class SpeechToTextService(ABC):
    @property
    @abstractmethod
    def ai_mode(self) -> str:
        """Return the STT AI mode: 'real' or 'mock'."""
        raise NotImplementedError

    @abstractmethod
    def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        language: str | None = None,
        expected_text_hint: str | None = None,
    ) -> dict:
        """Transcribe raw audio bytes to text.

        Args:
            audio_bytes: raw audio file content (already read into memory
                by the caller — this method must not assume a filesystem
                path; if an implementation needs one, it is responsible
                for creating and deleting its OWN temporary file).
            filename: original filename, used only to infer format
                (extension) — never treated as a trusted path.
            language: optional BCP-47-ish language hint (e.g. "en", "hi").
                Preserves the multilingual architecture — implementations
                must not hard-code English. None means "auto-detect" where
                supported.
            expected_text_hint: OPTIONAL, mock-only convenience. A real
                implementation MUST ignore this parameter — it exists so
                MockSpeechToTextService can simulate a plausible
                transcription for development/testing without pretending
                to understand arbitrary audio content (see mock.py).

        Returns a dict with:
            transcription: str — the recognized text (may be empty).
            language: str | None — detected/used language.
            confidence: float | None — MUST be None if the underlying
                implementation doesn't provide a reliable confidence
                value. Never invent one.
            duration_seconds: float | None — audio duration, if the
                implementation can determine it; otherwise None.
            is_mock: bool — True for MockSpeechToTextService, False for
                any real implementation.
            status: str — "ok", or a short machine-readable failure/notice
                code (e.g. "mock_no_hint_provided").
        """
        raise NotImplementedError
