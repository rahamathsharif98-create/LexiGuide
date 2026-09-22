from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models import Parent, Student, LearningSession
from app.services.fingerprint_service import fingerprint_history_payload, get_latest_fingerprint, SKILL_KEYS
from app.services.session_service import list_sessions_for_student
from app.services.recommendation_service import list_recommendations_for_student, generate_recommendations, persist_recommendations_for_student
from app.services.progress_service import get_progress


def get_children_for_parent(db: Session, parent_id: int) -> list[Student]:
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    return parent.children if parent else []


def get_child_progress(db: Session, child_id: int, range_key: str = "7d"):
    return get_progress(db, child_id, range_key)


def get_child_fingerprint(db: Session, child_id: int):
    return fingerprint_history_payload(db, child_id)


def get_child_activities(db: Session, child_id: int):
    return list_sessions_for_student(db, child_id)


def get_child_recommendations(db: Session, child_id: int):
    rows = list_recommendations_for_student(db, child_id)
    if not rows:
        fp = get_latest_fingerprint(db, child_id)
        if fp:
            base = {k: getattr(fp, k) for k in SKILL_KEYS}
            rows = persist_recommendations_for_student(db, child_id, base)
    return rows


def get_child_summary(db: Session, child_id: int) -> dict:
    sessions = (
        db.query(LearningSession)
        .filter(LearningSession.student_id == child_id, LearningSession.completed_at.isnot(None))
        .order_by(LearningSession.completed_at.desc())
        .all()
    )

    total_stars = sum(s.stars or 0 for s in sessions)
    activities_completed = len(sessions)

    total_seconds = 0
    for s in sessions:
        if s.started_at and s.completed_at and s.completed_at > s.started_at:
            total_seconds += (s.completed_at - s.started_at).total_seconds()
        else:
            total_seconds += 180  # Default baseline ~3 min per completed activity
    learning_time_min = round(total_seconds / 60)

    streak = 0
    if sessions:
        now_date = datetime.now(timezone.utc).date()
        session_dates = {s.completed_at.date() for s in sessions if s.completed_at}
        curr_check = now_date
        if curr_check not in session_dates:
            curr_check = now_date - timedelta(days=1)
        while curr_check in session_dates:
            streak += 1
            curr_check -= timedelta(days=1)

    prog = get_progress(db, child_id, "7d")
    recent_comparison = prog.get("recent_comparison")

    return {
        "child_id": child_id,
        "total_stars": total_stars,
        "streak": streak,
        "activities_completed": activities_completed,
        "learning_time_min": learning_time_min,
        "recent_comparison": recent_comparison,
    }
