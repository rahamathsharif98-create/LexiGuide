"""Real historical progress, computed from actual ReadingFingerprint rows —
NOT simulated/repeated data. If a student genuinely doesn't have enough
recorded history yet for a given range, this says so explicitly rather than
fabricating a longer trend (the frontend's Phase 3/4 30/90-day views openly
labeled themselves as simulated for exactly this reason — Phase 5 replaces
that with real data plus an honest note when there isn't enough of it yet).
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models import ReadingFingerprint, LearningSession
from app.utils.skills import normalize_skill

RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90}

FRIENDLY = {
    "phonological_awareness": ("Sounds", "🔤"),
    "word_recognition": ("Words", "🧩"),
    "reading_fluency": ("Reading", "📖"),
    "pronunciation": ("Speaking", "🗣️"),
    "comprehension": ("Understanding", "🧠"),
}


def get_progress(db: Session, student_id: int, range_key: str) -> dict:
    days = RANGE_DAYS.get(range_key, 7)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    rows = (
        db.query(ReadingFingerprint)
        .filter(ReadingFingerprint.student_id == student_id, ReadingFingerprint.recorded_at >= since)
        .order_by(ReadingFingerprint.recorded_at.asc())
        .all()
    )

    all_rows = (
        db.query(ReadingFingerprint)
        .filter(ReadingFingerprint.student_id == student_id)
        .order_by(ReadingFingerprint.recorded_at.asc())
        .all()
    )

    note = None
    basis_rows = rows
    if len(rows) < 2:
        note = f"Not enough recorded sessions in the last {days} days for a full trend yet — showing the most recent snapshot instead."
        basis_rows = all_rows[-2:] if len(all_rows) >= 2 else all_rows

    skills_out = []
    for db_key, (label, emoji) in FRIENDLY.items():
        if not basis_rows:
            continue
        first_val = getattr(basis_rows[0], db_key)
        last_val = getattr(basis_rows[-1], db_key)
        delta = last_val - first_val
        trend = "improving" if delta > 2 else "needs practice" if delta < -2 else "steady"
        skills_out.append({"key": db_key, "label": label, "value": last_val, "trend": trend})

    recent_comparison = None
    recent_sessions = (
        db.query(LearningSession)
        .filter(LearningSession.student_id == student_id, LearningSession.completed_at.isnot(None))
        .order_by(LearningSession.completed_at.desc())
        .limit(10)
        .all()
    )
    if recent_sessions:
        last_s = recent_sessions[0]
        curr_acc = (last_s.outcome or {}).get("accuracy") or ((last_s.outcome or {}).get("metrics") or {}).get("accuracy")
        if curr_acc is not None and 0.0 <= float(curr_acc) <= 1.0:
            curr_acc = float(curr_acc) * 100.0

        target_skill = last_s.skill or "readingFluency"
        norm_target = normalize_skill(target_skill)

        prior_s = next(
            (s for s in recent_sessions[1:] if s.skill == target_skill or (norm_target and normalize_skill(s.skill) == norm_target)),
            recent_sessions[1] if len(recent_sessions) > 1 else None
        )
        prev_acc = (
            ((prior_s.outcome or {}).get("accuracy") or ((prior_s.outcome or {}).get("metrics") or {}).get("accuracy"))
            if prior_s else None
        )
        if prev_acc is not None and 0.0 <= float(prev_acc) <= 1.0:
            prev_acc = float(prev_acc) * 100.0

        if curr_acc is not None and prev_acc is not None:
            delta = round(float(curr_acc) - float(prev_acc), 1)
            msg = (
                "Performance improved! Great progress on this skill."
                if delta > 0
                else "Consistent effort! Keep practicing to strengthen this skill."
                if delta == 0
                else "Good try! Practice helps make this easier."
            )
            recent_comparison = {
                "skill": target_skill,
                "previous_accuracy": float(prev_acc),
                "current_accuracy": float(curr_acc),
                "change": delta,
                "message": msg,
            }

    return {
        "student_id": student_id,
        "range": range_key,
        "skills": skills_out,
        "sample_size": len(rows),
        "note": note,
        "recent_comparison": recent_comparison,
    }
