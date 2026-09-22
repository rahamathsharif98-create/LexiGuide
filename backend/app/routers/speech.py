import importlib.util
import shutil
from fastapi import APIRouter, Form, HTTPException, UploadFile

from app.ai.factory import get_ai_analysis_service, get_stt_service
from app.config import settings
from app.schemas.speech import SpeechAnalyzeRequest, SpeechAnalyzeOut, SpeechStatusOut, SpeechTranscribeOut
from app.utils.audio import read_and_validate_audio

router = APIRouter(prefix="/api/speech", tags=["speech"])


@router.get("/status", response_model=SpeechStatusOut)
@router.get("/capabilities", response_model=SpeechStatusOut)
def speech_status():
    """Report the current AI capability and service availability status.
    Explicitly distinguishes REAL AI, MOCK AI, and UNAVAILABLE AI without
    fabricating phoneme or pronunciation accuracy.
    """
    whisper_installed = importlib.util.find_spec("whisper") is not None
    ffmpeg_available = shutil.which("ffmpeg") is not None

    return {
        "ai_mode": settings.AI_MODE,
        "stt_provider": "whisper" if settings.AI_MODE == "real" else "mock",
        "whisper_installed": whisper_installed,
        "ffmpeg_available": ffmpeg_available,
        "whisper_model": settings.WHISPER_MODEL_SIZE,
        "max_audio_upload_mb": settings.MAX_AUDIO_UPLOAD_MB,
        "reading_alignment_available": True,
        "comprehension_analysis_available": True,
        "pronunciation_analysis_available": False,
        "phoneme_analysis_available": False,
    }


@router.post("/analyze")
def analyze(payload: SpeechAnalyzeRequest):
    """Stateless analysis-only endpoint (no persistence) — useful for a
    frontend that wants immediate feedback before deciding whether to
    submit a full /api/reading/session. Uses the same AIAnalysisService
    (mock or real, per AI_MODE) as that endpoint.

    Phase 8 Step 1 security review — left unauthenticated, deliberately:
    this endpoint takes only two raw strings (expected_text,
    recognized_text), writes nothing to the database, and never touches a
    child_id or any other row tied to a specific student. There is no
    child-specific data here to protect and no record created that a
    later request could look up — it's pure text-in/text-out. Ownership
    checks exist to stop one account from reading or writing ANOTHER
    identifiable person's data; there is no such data at this endpoint, so
    requiring a token would add friction without adding protection.

    This decision does not extend to /api/reading/session or
    /api/reading/session-audio, which DO persist a result against a
    specific child_id and ARE authenticated + ownership-checked.
    """
    ai_service = get_ai_analysis_service()
    return ai_service.analyze_speech(payload.expected_text, payload.recognized_text)


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile,
    language: str | None = Form(default=None),
    expected_text_hint: str | None = Form(default=None),
):
    """Speech-to-text only (no reading-error analysis, no persistence) —
    for a frontend that wants a raw transcript before deciding what to do
    with it. Uses MockSpeechToTextService or RealSpeechToTextService per
    AI_MODE (see app/ai/factory.py).

    Left unauthenticated for the same reason as /api/speech/analyze above:
    stateless, no child_id, nothing persisted. The uploaded audio is read
    into memory, handed to the STT service, and never written to disk by
    this endpoint itself — RealSpeechToTextService manages and deletes its
    own temporary file (see app/ai/stt/real.py). expected_text_hint is
    accepted here only so MockSpeechToTextService has something to echo in
    mock mode for development — a real STT backend ignores it entirely.
    """
    audio_bytes = await read_and_validate_audio(audio, settings.MAX_AUDIO_UPLOAD_MB)
    stt_service = get_stt_service()
    try:
        return stt_service.transcribe(
            audio_bytes, audio.filename, language=language, expected_text_hint=expected_text_hint
        )
    except RuntimeError as exc:
        # Real STT dependency (e.g. openai-whisper) not installed/available.
        raise HTTPException(status_code=503, detail="Speech-to-text service is currently unavailable") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Could not transcribe the provided audio") from exc
