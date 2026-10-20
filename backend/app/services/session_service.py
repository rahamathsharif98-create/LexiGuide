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
    """Persist an activity result. Incomplete sessions or sessions with 0
    attempts do not award stars/XP or nudge the student's reading fingerprint.
    """
    outcome_dict = dict(outcome) if outcome else {}

    # Check completion flags
    is_completed = outcome_dict.get("is_completed", True)
    if outcome_dict.get("completion_status") == "incomplete":
        is_completed = False

    rounds_attempted = outcome_dict.get("roundsAttempted")
    if rounds_attempted == 0 and not outcome_dict.get("score") and not (outcome_dict.get("details") or {}).get("distance"):
        is_completed = False

    effective_stars = stars if is_completed else 0
    effective_xp = xp if is_completed else 0
    completed_at = datetime.now(timezone.utc) if is_completed else None

    if "is_completed" not in outcome_dict:
        outcome_dict["is_completed"] = is_completed
    if "completion_status" not in outcome_dict:
        outcome_dict["completion_status"] = "completed" if is_completed else "incomplete"

    session_row = LearningSession(
        student_id=student_id,
        activity_id=activity_id,
        skill=skill,
        completed_at=completed_at,
        outcome=outcome_dict,
        stars=effective_stars,
        xp=effective_xp,
    )
    db.add(session_row)
    db.commit()
    db.refresh(session_row)

    # Update the fingerprint and recommendations only from genuine, completed sessions
    if is_completed:
        outcome_type = outcome_dict.get("type") or ("game" if skill else "activity")
        accuracy = outcome_dict.get("accuracy")
        if accuracy is None and isinstance(outcome_dict.get("metrics"), dict):
            accuracy = outcome_dict["metrics"].get("accuracy")

        if outcome_type or skill:
            fp_row = record_fingerprint_update(db, student_id, outcome_type, skill, accuracy)
            fp_dict = {k: getattr(fp_row, k) for k in SKILL_KEYS}
            persist_recommendations_for_student(db, student_id, fp_dict)

    return session_row
