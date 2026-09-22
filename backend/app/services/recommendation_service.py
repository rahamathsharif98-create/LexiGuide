"""Python port of the SAME adaptive recommendation logic used by the
frontend (src/services/adaptiveEngine.js). This is deliberately NOT a
second, independent recommendation algorithm — the thresholds, activity
mapping, and reasoning below are a direct mirror, so the backend and
frontend never disagree about what a given fingerprint should recommend.
"""
from sqlalchemy.orm import Session

from app.models import Recommendation, Activity

THRESHOLDS = {
    "pronunciation": 65,
    "phonological_awareness": 65,
    "reading_fluency": 60,
    "comprehension": 65,
    "word_recognition": 60,
}

ACTIVITY_MAP = {
    "pronunciation": {"title": "Speak & Shine", "route": "/child/speak", "icon": "🎤"},
    "phonological_awareness": {"title": "Sound Safari", "route": "/child/games/match-sound", "icon": "🦁"},
    "reading_fluency": {"title": "Read With Me", "route": "/child/read", "icon": "⏱️"},
    "comprehension": {"title": "Story Challenge", "route": "/child/stories", "icon": "📖"},
    "word_recognition": {"title": "Word Builder", "route": "/child/games/build-word", "icon": "🧩"},
}

LABEL = {
    "pronunciation": "Pronunciation",
    "phonological_awareness": "Phonological Awareness",
    "reading_fluency": "Reading Fluency",
    "comprehension": "Comprehension",
    "word_recognition": "Word Recognition",
}


def generate_recommendations(fingerprint: dict) -> list[dict]:
    """Pure function: fingerprint dict -> list of recommendation dicts.
    Mirrors generateRecommendations() in adaptiveEngine.js exactly (same
    thresholds, same activity mapping) — deterministic, never random.
    """
    recs = []
    for skill, threshold in THRESHOLDS.items():
        value = fingerprint.get(skill)
        if value is not None and value < threshold:
            activity = ACTIVITY_MAP[skill]
            recs.append({
                "skill": skill,
                "reason": f"Recommended because {LABEL[skill]} needs a little more practice.",
                **activity,
            })
    if not recs:
        recs.append({"skill": "story", "reason": "Doing great across the board — try a new story!", "title": "Story Time", "route": "/child/stories", "icon": "📚"})
    return recs[:5]


def persist_recommendations_for_student(db: Session, student_id: int, fingerprint: dict) -> list[Recommendation]:
    recs = generate_recommendations(fingerprint)
    rows = []
    for r in recs:
        activity = db.query(Activity).filter(Activity.name == r["title"]).first()
        row = Recommendation(
            student_id=student_id,
            activity_id=activity.id if activity else None,
            reason=r["reason"],
            priority="Worth practicing",
        )
        db.add(row)
        rows.append(row)
    db.commit()
    for row in rows:
        db.refresh(row)
    return rows


def list_recommendations_for_student(db: Session, student_id: int) -> list[Recommendation]:
    return (
        db.query(Recommendation)
        .filter(Recommendation.student_id == student_id)
        .order_by(Recommendation.created_at.desc())
        .all()
    )
