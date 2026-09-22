from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models import Teacher, ClassModel, Student, LearningSession
from app.services.fingerprint_service import get_latest_fingerprint, SKILL_KEYS, DEFAULT_FINGERPRINT
from app.services.recommendation_service import generate_recommendations, THRESHOLDS

SKILL_LABELS = {
    "phonological_awareness": "Sound Awareness",
    "reading_fluency": "Reading Fluency",
    "pronunciation": "Pronunciation",
    "comprehension": "Story Comprehension",
    "word_recognition": "Word Recognition",
}

SKILL_EMOJIS = {
    "phonological_awareness": "🔤",
    "reading_fluency": "📖",
    "pronunciation": "🗣️",
    "comprehension": "🧠",
    "word_recognition": "🧩",
}

SKILL_COLORS = {
    "phonological_awareness": "#12aeef",
    "reading_fluency": "#2fd486",
    "pronunciation": "#ffb636",
    "comprehension": "#9a6aff",
    "word_recognition": "#ff8a4c",
}

CATEGORY_MAP = {
    "readingFluency": "Read With Me",
    "pronunciation": "Speak & Shine",
    "phonologicalAwareness": "Sound Safari",
    "wordRecognition": "Word Builder",
    "comprehension": "Story Time",
}


def get_class_for_teacher(db: Session, teacher_id: int) -> ClassModel | None:
    return db.query(ClassModel).filter(ClassModel.teacher_id == teacher_id).first()


def get_class_students(db: Session, class_id: int) -> list[Student]:
    cls = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    return cls.students if cls else []


def get_student_status_for_score(avg_score: float) -> str:
    if avg_score < 55:
        return "Needs Practice"
    elif avg_score >= 70:
        return "Strong Progress"
    return "Improving"


def get_dashboard(db: Session, class_id: int) -> dict:
    students = get_class_students(db, class_id)
    total = len(students)
    student_ids = [s.id for s in students]

    if not student_ids:
        return {
            "total_students": 0,
            "active_learners": 0,
            "activities_completed": 0,
            "students_needing_support": 0,
            "needing_support_list": [],
            "recent_activity": [],
            "strengths": [],
            "to_practice": [],
            "weekly": {"activitiesCompleted": 0, "averageStreak": 0, "studentsImproving": 0},
        }

    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    all_sessions = (
        db.query(LearningSession)
        .filter(LearningSession.student_id.in_(student_ids), LearningSession.completed_at.isnot(None))
        .order_by(LearningSession.completed_at.desc())
        .all()
    )

    activities_completed = len(all_sessions)
    recent_student_ids = {
        s.student_id for s in all_sessions
        if s.completed_at and (
            s.completed_at.replace(tzinfo=timezone.utc) if s.completed_at.tzinfo is None else s.completed_at
        ) >= seven_days_ago
    }
    active_learners = len(recent_student_ids)

    student_map = {s.id: s for s in students}
    student_scores = {}
    needing_support_list = []
    needing_support_count = 0
    improving_count = 0

    skill_totals = {k: 0.0 for k in SKILL_KEYS}

    for s in students:
        fp = get_latest_fingerprint(db, s.id)
        base = {k: getattr(fp, k) for k in SKILL_KEYS} if fp else DEFAULT_FINGERPRINT
        for k in SKILL_KEYS:
            skill_totals[k] += base[k]
        avg = sum(base.values()) / len(base)
        status = get_student_status_for_score(avg)
        student_scores[s.id] = (avg, status)

        if status == "Needs Practice":
            needing_support_count += 1
            weakest_key = min(base, key=base.get)
            needing_support_list.append({
                "student": {
                    "id": s.id,
                    "name": s.name,
                    "avatar": s.avatar or "👤",
                    "color": getattr(s, "color", "brand"),
                },
                "skillArea": {
                    "key": weakest_key,
                    "label": SKILL_LABELS.get(weakest_key, weakest_key),
                    "value": round(base[weakest_key]),
                },
                "observation": f"Needs more {SKILL_LABELS.get(weakest_key, weakest_key).lower()} practice",
                "suggestion": "Short, regular practice sessions",
            })
        elif status == "Improving":
            improving_count += 1

    # Class strengths & areas to practice
    sorted_skills = sorted(SKILL_KEYS, key=lambda k: skill_totals[k], reverse=True)
    strengths = [
        f"Class demonstrates solid performance in {SKILL_LABELS.get(sorted_skills[0], sorted_skills[0]).lower()}."
    ] if sorted_skills else []
    to_practice = [
        f"{SKILL_EMOJIS.get(sorted_skills[-1], '🎯')} {SKILL_LABELS.get(sorted_skills[-1], sorted_skills[-1])} — several students may benefit from extra practice here."
    ] if sorted_skills else []

    # Recent class activities
    recent_activity = []
    for sess in all_sessions[:6]:
        stud = student_map.get(sess.student_id)
        acc = (sess.outcome or {}).get("accuracy") or ((sess.outcome or {}).get("metrics") or {}).get("accuracy") or 80
        title = (sess.outcome or {}).get("title") or (sess.activity.name if sess.activity else None) or sess.skill or "Learning Practice"
        recent_activity.append({
            "id": sess.id,
            "student": {
                "id": stud.id if stud else sess.student_id,
                "name": stud.name if stud else f"Student #{sess.student_id}",
                "avatar": (stud.avatar if stud else None) or "👤",
                "color": getattr(stud, "color", "brand") if stud else "brand",
            },
            "label": title,
            "activity": title,
            "date": sess.completed_at.strftime("%b %d") if sess.completed_at else "Recently",
            "accuracy": int(acc),
        })

    return {
        "total_students": total,
        "active_learners": active_learners,
        "activities_completed": activities_completed,
        "students_needing_support": needing_support_count,
        "needing_support_list": needing_support_list,
        "recent_activity": recent_activity,
        "strengths": strengths,
        "to_practice": to_practice,
        "weekly": {
            "activitiesCompleted": activities_completed,
            "averageStreak": 1 if active_learners > 0 else 0,
            "studentsImproving": improving_count,
        },
    }


def get_class_progress(db: Session, class_id: int, range_key: str = "7d") -> dict:
    students = get_class_students(db, class_id)
    if not students:
        return {
            "skills": [],
            "distribution": {"Improving": 0, "Strong Progress": 0, "Needs Practice": 0},
            "participation": [],
            "sample_size": 0,
            "note": "No students found in this class.",
        }

    days = {"7d": 7, "30d": 30, "90d": 90}.get(range_key, 7)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    student_ids = [s.id for s in students]

    # Calculate real skill averages and student distribution from latest fingerprints
    totals = {k: 0.0 for k in SKILL_KEYS}
    distribution = {"Improving": 0, "Strong Progress": 0, "Needs Practice": 0}

    for s in students:
        fp = get_latest_fingerprint(db, s.id)
        base = {k: getattr(fp, k) for k in SKILL_KEYS} if fp else DEFAULT_FINGERPRINT
        for k in SKILL_KEYS:
            totals[k] += base[k]
        avg = sum(base.values()) / len(base)
        distribution[get_student_status_for_score(avg)] += 1

    skills_out = [
        {
            "key": k,
            "label": SKILL_LABELS.get(k, k),
            "emoji": SKILL_EMOJIS.get(k, "📚"),
            "color": SKILL_COLORS.get(k, "#12aeef"),
            "value": round(totals[k] / max(len(students), 1), 1),
        }
        for k in SKILL_KEYS
    ]

    # Query real sessions completed within the selected range — zero artificial multipliers!
    sessions_in_range = (
        db.query(LearningSession)
        .filter(
            LearningSession.student_id.in_(student_ids),
            LearningSession.completed_at.isnot(None),
            LearningSession.completed_at >= since,
        )
        .all()
    )

    activity_counts = {
        "Read With Me": 0,
        "Speak & Shine": 0,
        "Sound Safari": 0,
        "Word Builder": 0,
        "Story Time": 0,
    }

    for sess in sessions_in_range:
        sk = sess.skill or ""
        act_name = (sess.activity.name if sess.activity else "") or (sess.outcome or {}).get("title", "")
        cat = CATEGORY_MAP.get(sk)
        if not cat:
            if "read" in act_name.lower() or "fluency" in act_name.lower():
                cat = "Read With Me"
            elif "speak" in act_name.lower() or "shine" in act_name.lower():
                cat = "Speak & Shine"
            elif "sound" in act_name.lower() or "safari" in act_name.lower():
                cat = "Sound Safari"
            elif "word" in act_name.lower() or "build" in act_name.lower():
                cat = "Word Builder"
            elif "story" in act_name.lower():
                cat = "Story Time"
            else:
                cat = "Read With Me"
        activity_counts[cat] = activity_counts.get(cat, 0) + 1

    participation = [
        {"activity": label, "count": count}
        for label, count in activity_counts.items()
    ]

    sample_size = len(sessions_in_range)
    note = None if sample_size > 0 else f"No activity recorded during this {range_key} period."

    insights = [
        f"{skills_out[0]['label']} shows the strongest class average ({skills_out[0]['value']}%)."
        if skills_out else "Keep practicing daily.",
        f"{skills_out[-1]['label']} is an area where several learners would benefit from practice."
        if skills_out else "Regular practice helps build confidence.",
    ]

    return {
        "skills": skills_out,
        "distribution": distribution,
        "participation": participation,
        "insights": insights,
        "sample_size": sample_size,
        "range": range_key,
        "note": note,
    }


def get_class_recommendations(db: Session, class_id: int) -> list[dict]:
    students = get_class_students(db, class_id)
    by_skill: dict[str, dict] = {}
    for s in students:
        fp = get_latest_fingerprint(db, s.id)
        base = {k: getattr(fp, k) for k in SKILL_KEYS} if fp else DEFAULT_FINGERPRINT
        for rec in generate_recommendations(base):
            key = rec["skill"]
            if key not in by_skill:
                by_skill[key] = {
                    "skill": key,
                    "title": rec.get("title", "Practice Activity"),
                    "suggestedActivity": rec.get("title", "Practice Activity"),
                    "route": rec.get("route", "/child/learn"),
                    "reason": rec.get("reason", "Practice recommended based on recent assessments."),
                    "students": [],
                }
            by_skill[key]["students"].append({
                "id": s.id,
                "name": s.name,
                "avatar": s.avatar or "👤",
                "color": getattr(s, "color", "brand"),
            })

    recs_out = []
    for r in by_skill.values():
        cnt = len(r["students"])
        priority = "High attention" if cnt >= 2 else "Worth practicing" if cnt == 1 else "Going well"
        recs_out.append({**r, "priority": priority})

    return sorted(recs_out, key=lambda r: -len(r["students"]))
