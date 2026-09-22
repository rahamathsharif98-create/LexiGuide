from sqlalchemy.orm import Session

from app.models import ReadingFingerprint
from app.utils.language import DISCLAIMER
from app.utils.skills import normalize_skill

SKILL_KEYS = ["phonological_awareness", "pronunciation", "word_recognition", "reading_fluency", "comprehension"]

DEFAULT_FINGERPRINT = {
    "phonological_awareness": 55.0,
    "pronunciation": 55.0,
    "word_recognition": 55.0,
    "reading_fluency": 55.0,
    "comprehension": 55.0,
}


def get_latest_fingerprint(db: Session, student_id: int) -> ReadingFingerprint | None:
    return (
        db.query(ReadingFingerprint)
        .filter(ReadingFingerprint.student_id == student_id)
        .order_by(ReadingFingerprint.recorded_at.desc(), ReadingFingerprint.id.desc())
        .first()
    )


def get_fingerprint_history(db: Session, student_id: int) -> list[ReadingFingerprint]:
    return (
        db.query(ReadingFingerprint)
        .filter(ReadingFingerprint.student_id == student_id)
        .order_by(ReadingFingerprint.recorded_at.asc(), ReadingFingerprint.id.asc())
        .all()
    )


def _clamp(value: float) -> float:
    return max(5.0, min(98.0, round(value, 1)))


def record_fingerprint_update(db: Session, student_id: int, outcome_type: str, skill: str | None, accuracy: float | None) -> ReadingFingerprint:
    """Append a new fingerprint snapshot derived from a completed session —
    mirrors the frontend's updateFingerprint() nudging logic in
    src/services/mockAiService.js, applied here against real stored history
    instead of in-memory React state.
    """
    latest = get_latest_fingerprint(db, student_id)
    base = {k: getattr(latest, k) for k in SKILL_KEYS} if latest else dict(DEFAULT_FINGERPRINT)

    def nudge(key: str, delta: float):
        base[key] = _clamp(base[key] + delta)

    # Normalize ratio accuracy if passed between 0.0 and 1.0 (e.g. 0.85 -> 85.0)
    effective_acc = accuracy
    if effective_acc is not None and 0.0 <= effective_acc <= 1.0:
        effective_acc = effective_acc * 100.0

    target_pillar = normalize_skill(skill)

    if outcome_type == "reading" and effective_acc is not None:
        nudge("pronunciation", (effective_acc - 70) / 8)
        nudge("reading_fluency", (effective_acc - 70) / 10)
        nudge("word_recognition", (effective_acc - 70) / 10)
    elif target_pillar and effective_acc is not None:
        nudge(target_pillar, (effective_acc - 60) / 6)
    elif outcome_type == "story" and effective_acc is not None:
        nudge("comprehension", (effective_acc - 70) / 6)

    new_row = ReadingFingerprint(student_id=student_id, **base)
    db.add(new_row)
    db.commit()
    db.refresh(new_row)
    return new_row


def fingerprint_history_payload(db: Session, student_id: int) -> dict:
    history = get_fingerprint_history(db, student_id)
    current = history[-1] if history else None
    return {"current": current, "history": history, "disclaimer": DISCLAIMER}
