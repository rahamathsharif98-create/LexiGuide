from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import LearningSession
from app.services.fingerprint_service import record_fingerprint_update, SKILL_KEYS
from app.services.recommendation_service import persist_recommendations_for_student


def list_sessions_for_student(db: Session, student_id: int) -> list[LearningSession]:
    return (
        db.query(LearningSession)
        .filter(LearningSession.student_id == student_id)
        .order_by(LearningSession.started_at.desc())
        .all()
    )


def create_session(db: Session, student_id: int, activity_id: int | None, skill: str | None, outcome: dict | None, stars: int, xp: int) -> LearningSession:
    """Persist a completed activity result. This is the write side of the
    Child Activity Persistence flow described in Phase 5 — the frontend's
    mock speech analysis is UNCHANGED; only the *result* gets stored here.
    """
    session_row = LearningSession(
        student_id=student_id,
        activity_id=activity_id,
        skill=skill,
        completed_at=datetime.now(timezone.utc),
        outcome=outcome,
        stars=stars,
        xp=xp,
    )
    db.add(session_row)
    db.commit()
    db.refresh(session_row)

    # Update the fingerprint from this session, same nudging logic the
    # frontend uses, now against real persisted history.
    outcome_type = (outcome or {}).get("type") or ("game" if skill else "activity")
    accuracy = (outcome or {}).get("accuracy") or ((outcome or {}).get("metrics") or {}).get("accuracy")
    if outcome_type or skill:
        fp_row = record_fingerprint_update(db, student_id, outcome_type, skill, accuracy)
        fp_dict = {k: getattr(fp_row, k) for k in SKILL_KEYS}
        persist_recommendations_for_student(db, student_id, fp_dict)

    return session_row
