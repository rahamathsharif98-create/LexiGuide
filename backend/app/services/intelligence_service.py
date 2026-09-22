from collections import Counter
from datetime import datetime, timezone
from statistics import mean

from sqlalchemy.orm import Session

from app.models import LearningSession, ReadingSessionDetail, ReadingObservation, ObservationType
from app.utils.language import DISCLAIMER


def _classify_wcpm(wcpm: float) -> str:
    if wcpm < 35.0:
        return "Developing Pace"
    elif wcpm < 60.0:
        return "Steady Pace"
    elif wcpm < 90.0:
        return "Fluent Pace"
    return "Advanced Pace"


def _diagnose_confusion_pair(expected: str, recognized: str) -> tuple[str, str]:
    exp = expected.lower().strip()
    rec = recognized.lower().strip()

    # Initial letter / blend comparison
    if exp and rec and exp[0] != rec[0]:
        return (
            f"Initial sound contrast ({exp[0]} vs {rec[0]})",
            f"Practice isolating initial sounds when reading '{exp}'."
        )
    elif exp and rec and exp[-1] != rec[-1]:
        return (
            f"Ending sound contrast ({exp[-1]} vs {rec[-1]})",
            f"Focus on finishing word endings carefully for '{exp}'."
        )
    elif len(exp) == len(rec):
        return (
            "Vowel / medial substitution",
            f"Practice blending vowel sounds in '{exp}'."
        )
    return (
        "Word recognition variance",
        f"Reinforce sight-word recognition for '{exp}'."
    )


class LearningIntelligenceEngine:
    def __init__(self, db: Session, student_id: int):
        self.db = db
        self.student_id = student_id

    def get_reading_details(self) -> list[tuple[LearningSession, ReadingSessionDetail]]:
        rows = (
            self.db.query(LearningSession, ReadingSessionDetail)
            .join(ReadingSessionDetail, ReadingSessionDetail.session_id == LearningSession.id)
            .filter(
                LearningSession.student_id == self.student_id,
                LearningSession.completed_at.isnot(None),
            )
            .order_by(LearningSession.completed_at.asc())
            .all()
        )
        return rows

    def get_error_distribution(self, reading_data: list[tuple[LearningSession, ReadingSessionDetail]]) -> dict:
        omissions = sum(d.omissions or 0 for _, d in reading_data)
        substitutions = sum(d.substitutions or 0 for _, d in reading_data)
        repetitions = sum(d.repetitions or 0 for _, d in reading_data)
        hesitations = sum(d.hesitations or 0 for _, d in reading_data)

        # Count insertions from outcomes if stored
        insertions = 0
        for s, _ in reading_data:
            outcome = s.outcome or {}
            metrics = outcome.get("metrics") or {}
            insertions += outcome.get("insertions") or metrics.get("insertions") or 0

        total_errors = omissions + substitutions + repetitions + insertions + hesitations

        omission_pct = round((omissions / total_errors * 100), 1) if total_errors > 0 else 0.0
        substitution_pct = round((substitutions / total_errors * 100), 1) if total_errors > 0 else 0.0
        repetition_pct = round((repetitions / total_errors * 100), 1) if total_errors > 0 else 0.0

        counts = {
            "omission": omissions,
            "substitution": substitutions,
            "repetition": repetitions,
            "hesitation": hesitations,
        }
        primary_type = None
        if total_errors > 0:
            primary_type = max(counts, key=counts.get)

        return {
            "omissions": omissions,
            "substitutions": substitutions,
            "repetitions": repetitions,
            "insertions": insertions,
            "hesitations": hesitations,
            "total_errors": total_errors,
            "omission_pct": omission_pct,
            "substitution_pct": substitution_pct,
            "repetition_pct": repetition_pct,
            "primary_error_type": primary_type,
        }

    def get_fluency_overview(self, reading_data: list[tuple[LearningSession, ReadingSessionDetail]]) -> dict:
        timeline = []
        wcpms = []

        for s, d in reading_data:
            duration = d.duration_seconds or 1
            words_correct = d.words_correct or 0
            words_attempted = d.words_attempted or 0
            accuracy = round((words_correct / max(words_attempted, 1)) * 100, 1)

            wcpm = round((words_correct / max(duration, 1)) * 60.0, 1)
            wcpms.append(wcpm)

            timeline.append({
                "session_id": s.id,
                "recorded_at": s.completed_at,
                "duration_seconds": duration,
                "words_attempted": words_attempted,
                "words_correct": words_correct,
                "wcpm": wcpm,
                "accuracy": accuracy,
                "pace_label": _classify_wcpm(wcpm),
            })

        avg_wcpm = round(mean(wcpms), 1) if wcpms else 0.0
        highest_wcpm = round(max(wcpms), 1) if wcpms else 0.0
        reading_pace = _classify_wcpm(avg_wcpm) if avg_wcpm > 0 else "Developing"

        # Stability check
        if len(wcpms) < 2:
            stability = "Initial Baseline"
        else:
            diffs = [abs(wcpms[i] - wcpms[i - 1]) for i in range(1, len(wcpms))]
            max_diff = max(diffs) if diffs else 0.0
            stability = "Variable" if max_diff > 18.0 else "Consistent"

        return {
            "average_wcpm": avg_wcpm,
            "highest_wcpm": highest_wcpm,
            "reading_pace": reading_pace,
            "fluency_stability": stability,
            "sessions_analyzed": len(reading_data),
            "timeline": timeline,
        }

    def get_top_confusions(self, limit: int = 5) -> list[dict]:
        session_ids = [
            s.id for s in self.db.query(LearningSession.id)
            .filter(LearningSession.student_id == self.student_id)
            .all()
        ]
        if not session_ids:
            return []

        observations = (
            self.db.query(ReadingObservation)
            .filter(
                ReadingObservation.session_id.in_(session_ids),
                ReadingObservation.observation_type == ObservationType.substitution,
            )
            .all()
        )

        pairs = Counter()
        for obs in observations:
            val = obs.value or ""
            if " -> " in val:
                parts = val.split(" -> ", 1)
                pairs[(parts[0].strip(), parts[1].strip())] += 1
            elif val:
                pairs[(val.strip(), "unrecognized")] += 1

        results = []
        for (expected, recognized), count in pairs.most_common(limit):
            pattern, note = _diagnose_confusion_pair(expected, recognized)
            results.append({
                "expected": expected,
                "recognized": recognized,
                "count": count,
                "focus_pattern": pattern,
                "pedagogical_note": note,
            })
        return results

    def generate_guidance(
        self,
        error_dist: dict,
        fluency: dict,
        confusions: list[dict],
        total_sessions: int,
    ) -> dict:
        if total_sessions == 0:
            return {
                "summary": "No reading session data recorded yet. Begin with Read With Me to establish reading intelligence metrics.",
                "observed_strengths": ["Eager to start learning"],
                "recommended_focus_areas": ["Begin foundational read-aloud practice"],
                "educator_tips": ["Provide encouraging, bite-sized reading opportunities."],
            }

        strengths = []
        focus_areas = []
        tips = []

        # Fluency evaluation
        if fluency["average_wcpm"] >= 50:
            strengths.append(f"Strong reading pace maintaining an average of {fluency['average_wcpm']} words per minute.")
        elif fluency["average_wcpm"] > 0:
            focus_areas.append("Pace & rhythm building: practice with repetitive, rhythmic passages.")

        # Error patterns
        primary = error_dist.get("primary_error_type")
        if primary == "omission":
            focus_areas.append("Word tracking: child occasionally skips words. Guided finger-tracking or highlighting helps.")
            tips.append("Encourage the child to point to words while reading aloud.")
        elif primary == "substitution":
            focus_areas.append("Sound-symbol matching: child substitutes visually or phonetically similar words.")
            tips.append("Use multi-sensory letter-sound contrast cards for frequent substitutions.")
        elif primary == "repetition":
            strengths.append("Self-monitoring awareness: repeats words to confirm meaning and accuracy.")
            tips.append("Acknowledge self-corrections positively; encourage smooth phrasing.")
        elif primary == "hesitation":
            focus_areas.append("Decoding confidence: hesitations observed before unfamiliar words.")
            tips.append("Review unfamiliar vocabulary together before starting reading passages.")

        if not strengths:
            strengths.append("Demonstrating persistence across multiple reading exercises.")
        if not focus_areas:
            focus_areas.append("Continue current guided reading progression.")
        if not tips:
            tips.append("Pair reading practice with sound-matching games for balanced reinforcement.")

        summary = (
            f"Observed reading profile shows a {fluency['reading_pace'].lower()} with "
            f"{error_dist['total_errors']} recorded error patterns across {total_sessions} sessions. "
            f"Primary area of focus: {focus_areas[0]}."
        )

        return {
            "summary": summary,
            "observed_strengths": strengths,
            "recommended_focus_areas": focus_areas,
            "educator_tips": tips,
        }

    def generate_full_intelligence(self) -> dict:
        reading_data = self.get_reading_details()
        total_sessions = len(reading_data)

        if total_sessions == 0:
            sufficiency = "insufficient_data"
        elif total_sessions < 3:
            sufficiency = "developing_data"
        else:
            sufficiency = "sufficient"

        error_dist = self.get_error_distribution(reading_data)
        fluency = self.get_fluency_overview(reading_data)
        confusions = self.get_top_confusions(limit=5)
        guidance = self.generate_guidance(error_dist, fluency, confusions, total_sessions)

        return {
            "student_id": self.student_id,
            "disclaimer": DISCLAIMER,
            "data_sufficiency": sufficiency,
            "total_reading_sessions": total_sessions,
            "error_distribution": error_dist,
            "fluency": fluency,
            "top_confusions": confusions,
            "guidance": guidance,
        }
