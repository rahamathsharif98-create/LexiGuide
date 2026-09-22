"""REAL speech-to-text via Whisper (or a Whisper-compatible model).

Deliberately lazy-imports `whisper` and lazy-loads the model — this module
can be imported (and the rest of the app can start up) even when
`openai-whisper` isn't installed, which is the normal state when
AI_MODE=mock. The import/load only happens the first time this class's
transcribe() is actually called with AI_MODE=real.

Not exercised by the automated test suite in this environment: there is
no network access to `pip install openai-whisper` (plus its ffmpeg
dependency) here, so this class has been written and reviewed but not run
against real audio. See backend/README.md "Phase 8 Step 2" for exact
install/verification steps to run locally.
"""
import os
import tempfile

from app.ai.stt.base import SpeechToTextService
from app.config import settings

_ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac", ".mp4"}


class RealSpeechToTextService(SpeechToTextService):
    _model = None  # class-level cache: load the Whisper model once per process

    @property
    def ai_mode(self) -> str:
        return "real"

    def _load_model(self):
        if RealSpeechToTextService._model is None:
            try:
                import whisper  # noqa: local import — optional heavy dependency
            except ImportError as exc:
                raise RuntimeError(
                    "Real speech-to-text requires the 'openai-whisper' package "
                    "(pip install -U openai-whisper) and ffmpeg on PATH. "
                    "Set AI_MODE=mock to run without them."
                ) from exc
            RealSpeechToTextService._model = whisper.load_model(settings.WHISPER_MODEL_SIZE)
        return RealSpeechToTextService._model

    def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        language: str | None = None,
        expected_text_hint: str | None = None,  # ignored — real STT never uses this, per base.py
    ) -> dict:
        if not audio_bytes:
            raise ValueError("Audio data is empty")

        model = self._load_model()
        suffix = os.path.splitext(filename or "")[1].lower()
        if suffix not in _ALLOWED_EXTENSIONS:
            suffix = ".wav"

        tmp_path = None
        try:
            # A real temp file IS necessary here — whisper's transcribe()
            # needs a path (it shells out to ffmpeg internally). Created
            # with delete=False only so we control exactly when it's
            # removed (the `finally` below), then deleted unconditionally
            # — audio is never left on disk after this call returns.
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            result = model.transcribe(tmp_path, language=language)

            return {
                "transcription": (result.get("text") or "").strip(),
                "language": result.get("language", language),
                # Whisper does not expose a single reliable per-transcript
                # confidence score — report None rather than invent one.
                "confidence": None,
                "duration_seconds": _probe_duration(tmp_path),
                "analysis_available": True,
                "ai_mode": "real",
                "is_mock": False,
                "status": "ok",
            }
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)


def _probe_duration(path: str) -> float | None:
    """Best-effort audio duration in seconds. Only reliably works for WAV
    via the stdlib `wave` module without extra dependencies — returns None
    for any other format or on any failure rather than guessing.
    """
    try:
        import wave
        with wave.open(path, "rb") as w:
            frames = w.getnframes()
            rate = w.getframerate()
            return round(frames / float(rate), 2) if rate else None
    except Exception:
        return None
