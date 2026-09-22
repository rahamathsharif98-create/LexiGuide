"""Read-aloud specific endpoints. Runs AI reading analysis (mock or real,
per AI_MODE), persists a LearningSession + its ReadingSessionDetail,
updates the Reading Fingerprint from the result, and regenerates
recommendations from the updated fingerprint — the closed loop described
in the Phase 7 spec's core concept, now also reachable via a real audio
upload (Phase 8 Step 2) as well as the original typed-text path.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, LearningSession, ReadingSessionDetail, ReadingObservation, ObservationType
from app.schemas.reading import (
    ReadingSessionCreate, ReadingSessionOut, ComprehensionSubmit,
)
from app.services import student_service, session_service
from app.services.fingerprint_service import record_fingerprint_update, get_latest_fingerprint, SKILL_KEYS
from app.services.recommendation_service import persist_recommendations_for_student
from app.ai.factory import get_ai_analysis_service, get_stt_service
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child
from app.utils.audio import read_and_validate_audio
from app.utils.language import DISCLAIMER

router = APIRouter(prefix="/api/reading", tags=["reading"])

# Reading-error op -> ReadingObservation.observation_type. "insertion" has
# no matching enum value (see app/models/observation.py) — adding one
# would mean an Alembic migration to alter the Postgres enum type, which
# Phase 8 Step 2 avoids per "do not change the schema unless absolutely
# necessary". Insertions are still counted and returned in the API
# response's error_words/insertions fields; they're just not persisted as
# a row in reading_observations. Worth a migration later if per-word
# insertion history turns out to matter for the fingerprint/teacher views.
_OBSERVATION_TYPE_FOR_OP = {
    "omission": ObservationType.omission,
    "substitution": ObservationType.substitution,
    "repetition": ObservationType.repetition,
}


def _create_observations(db: Session, session_id: int, error_words: list[dict]) -> None:
    for op in error_words:
        obs_type = _OBSERVATION_TYPE_FOR_OP.get(op["op"])
        if not obs_type:
            continue
        value = op["expected"] if op["expected"] else op["recognized"]
        db.add(ReadingObservation(session_id=session_id, observation_type=obs_type, value=value))
    if error_words:
        db.commit()


def _persist_reading_result(
    db: Session, child_id: int, activity_id: int | None, expected_text: str, recognized_text: str,
    analysis: dict, duration_seconds: int | None, stars: int, xp: int, extra_outcome: dict | None = None,
) -> ReadingSessionDetail:
    outcome = {"type": "reading", "accuracy": analysis["accuracy"], "is_mock": analysis["is_mock"]}
    if extra_outcome:
        outcome.update(extra_outcome)

    session_row = LearningSession(
        student_id=child_id,
        activity_id=activity_id,
        skill="readingFluency",
        outcome=outcome,
        stars=stars,
        xp=xp,
    )
    session_row.completed_at = datetime.now(timezone.utc)
    db.add(session_row)
    db.commit()
    db.refresh(session_row)

    detail = ReadingSessionDetail(
        session_id=session_row.id,
        expected_text=expected_text,
        recognized_text=recognized_text,
        duration_seconds=duration_seconds,
        words_attempted=analysis["words_attempted"],
        words_correct=analysis["words_correct"],
        omissions=analysis["omissions"],
        substitutions=analysis["substitutions"],
        repetitions=analysis["repetitions"],
        hesitations=analysis["hesitations"],
        pronunciation_score=analysis["pronunciation_score"],
        fluency_score=analysis["fluency_score"],
        comprehension_score=analysis["comprehension_score"],
    )
    db.add(detail)
    db.commit()
    db.refresh(detail)

    _create_observations(db, session_row.id, analysis.get("error_words", []))

    fp_row = record_fingerprint_update(db, child_id, "reading", "readingFluency", analysis["accuracy"])
    fp_dict = {k: getattr(fp_row, k) for k in SKILL_KEYS}
    persist_recommendations_for_student(db, child_id, fp_dict)

    return detail


@router.post("/session", response_model=ReadingSessionOut, status_code=201)
def create_reading_session(child_id: int, payload: ReadingSessionCreate,
                            current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Ownership BEFORE existence: never let a 404-vs-403 split reveal
    # whether a child ID that isn't the caller's actually exists.
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)

    ai_service = get_ai_analysis_service()
    analysis = ai_service.analyze_speech(payload.expected_text, payload.recognized_text)

    return _persist_reading_result(
        db, child_id, payload.activity_id, payload.expected_text, payload.recognized_text,
        analysis, payload.duration_seconds, payload.stars, payload.xp,
    )


@router.post("/session-audio")
async def create_reading_session_from_audio(
    child_id: int,
    audio: UploadFile = File(...),
    expected_text: str = Form(...),
    activity_id: int | None = Form(default=None),
    duration_seconds: int | None = Form(default=None),
    stars: int = Form(default=0),
    xp: int = Form(default=0),
    language: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Audio-upload version of /session: Reading Session -> Speech-to-Text
    -> Reading Error Analysis -> Educational Metrics -> Skill Scores ->
    existing Reading Fingerprint -> Historical Pattern Update ->
    Recommendation, all in one call. Persists to the SAME tables as
    /session (LearningSession + ReadingSessionDetail) — this is not a
    second/parallel reading-session system.
    """
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)

    if not expected_text or not expected_text.strip():
        raise HTTPException(status_code=400, detail="expected_text must not be empty")

    audio_bytes = await read_and_validate_audio(audio, settings.MAX_AUDIO_UPLOAD_MB)

    stt_service = get_stt_service()
    try:
        # expected_text is passed as a hint ONLY so MockSpeechToTextService
        # can simulate a "read it correctly" transcript for demo/dev
        # continuity (task requirement: mock experience must keep working
        # end-to-end when AI_MODE=mock). RealSpeechToTextService ignores
        # this parameter entirely and transcribes the actual audio — see
        # app/ai/stt/base.py and app/ai/stt/real.py.
        stt_result = stt_service.transcribe(audio_bytes, audio.filename, language=language, expected_text_hint=expected_text)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="Speech-to-text service is currently unavailable") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Could not transcribe the provided audio") from exc

    recognized_text = stt_result["transcription"]

    ai_service = get_ai_analysis_service()
    analysis = ai_service.analyze_speech(expected_text, recognized_text)

    # Approximate words-per-minute — only computed when we actually have a
    # duration; never guessed. Clearly labeled "approximate" wherever it's
    # surfaced (see the response dict below).
    words_per_minute = None
    if duration_seconds and duration_seconds > 0:
        words_per_minute = round(analysis["words_recognized"] / (duration_seconds / 60), 1)

    extra_outcome = {
        "language": stt_result.get("language"),
        "stt_is_mock": stt_result.get("is_mock"),
        "stt_confidence": stt_result.get("confidence"),
        "insertions": analysis.get("insertions"),
        "word_order_mismatch": analysis.get("word_order_mismatch"),
    }

    detail = _persist_reading_result(
        db, child_id, activity_id, expected_text, recognized_text,
        analysis, duration_seconds, stars, xp, extra_outcome=extra_outcome,
    )

    return {
        "id": detail.id,
        "session_id": detail.session_id,
        "expected_text": detail.expected_text,
        "recognized_text": detail.recognized_text,
        "words_attempted": detail.words_attempted,
        "words_correct": detail.words_correct,
        "omissions": detail.omissions,
        "substitutions": detail.substitutions,
        "insertions": analysis.get("insertions"),
        "repetitions": detail.repetitions,
        "hesitations": detail.hesitations,
        "hesitations_available": analysis.get("hesitations_available"),
        "word_order_mismatch": analysis.get("word_order_mismatch"),
        "pronunciation_score": detail.pronunciation_score,
        "pronunciation_analysis_available": analysis.get("pronunciation_analysis_available", False),
        "phoneme_analysis_available": False,
        "fluency_score": detail.fluency_score,
        "comprehension_score": detail.comprehension_score,
        "duration_seconds": detail.duration_seconds,
        "words_per_minute": words_per_minute,
        "words_per_minute_is_approximate": words_per_minute is not None,
        "transcription": recognized_text,
        "transcription_language": stt_result.get("language"),
        "transcription_confidence": stt_result.get("confidence"),
        "ai_mode": analysis.get("ai_mode", "mock" if analysis.get("is_mock") else "real"),
        "analysis_available": True,
        "stt_is_mock": stt_result.get("is_mock"),
        "analysis_is_mock": analysis.get("is_mock"),
        "created_at": detail.created_at,
        "disclaimer": DISCLAIMER,
    }


@router.post("/comprehension")
def submit_comprehension(child_id: int, payload: ComprehensionSubmit,
                          current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Server-computed comprehension scoring (Phase 8 Step 2 §9). Reuses the
    existing generic LearningSession.outcome JSON column and the existing
    "story" fingerprint-nudge branch in fingerprint_service — no new
    database table for this, since the existing schema already supports
    storing arbitrary question/answer/score data in `outcome`.
    """
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)

    if not payload.questions:
        raise HTTPException(status_code=400, detail="At least one question is required")

    def _normalize(s: str) -> str:
        return s.strip().lower()

    graded = []
    correct_count = 0
    for q in payload.questions:
        is_correct = _normalize(q.child_answer) == _normalize(q.correct_answer)
        correct_count += int(is_correct)
        graded.append({
            "question": q.question,
            "correct_answer": q.correct_answer,
            "child_answer": q.child_answer,
            "is_correct": is_correct,
        })

    total = len(payload.questions)
    percentage = round((correct_count / total) * 100, 1) if total else 0.0

    session_row = session_service.create_session(
        db, child_id, payload.activity_id, "comprehension",
        outcome={
            "type": "story", "accuracy": percentage,
            "score": correct_count, "total": total, "questions": graded,
        },
        stars=payload.stars, xp=payload.xp,
    )

    latest_fp = get_latest_fingerprint(db, child_id)
    if latest_fp:
        fp_dict = {k: getattr(latest_fp, k) for k in SKILL_KEYS}
        persist_recommendations_for_student(db, child_id, fp_dict)

    return {
        "session_id": session_row.id,
        "student_id": child_id,
        "questions": graded,
        "score": correct_count,
        "total": total,
        "percentage": percentage,
        "disclaimer": DISCLAIMER,
    }


@router.get("/history/{child_id}", response_model=list[ReadingSessionOut])
def get_reading_history(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    session_ids = [s.id for s in db.query(LearningSession).filter(LearningSession.student_id == child_id).all()]
    return db.query(ReadingSessionDetail).filter(ReadingSessionDetail.session_id.in_(session_ids)).order_by(ReadingSessionDetail.created_at.desc()).all()
