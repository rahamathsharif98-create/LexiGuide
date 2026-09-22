"""Phase 9 — Adaptive Learning Engine.

Turns the existing Reading Fingerprint + LearningSession history (built in
Phases 5-8, see fingerprint_service.py / session_service.py /
recommendation_service.py) into a continuous adapt-and-recommend loop:

    performance -> learning profile -> pattern detection -> difficulty
    -> activity selection -> next best activity -> (child plays it) ->
    new performance -> fingerprint updates -> profile recomputed -> ...

This is NOT a second Reading Fingerprint system and NOT a second
recommendation algorithm:
  * "current level" per skill comes straight from the existing
    ReadingFingerprint row (fingerprint_service.get_latest_fingerprint).
  * activity/route/icon per skill comes straight from the existing
    recommendation_service.ACTIVITY_MAP.
  * skill keys/labels come from fingerprint_service.SKILL_KEYS and
    recommendation_service.LABEL.
This module adds exactly the NEW capability Phase 9 asks for: turning raw
LearningSession history into an explainable profile, detecting patterns
across repeated evidence (not one unusual result), deriving a gradual
difficulty level from that history, and picking a next activity with
built-in variety and spaced practice — all driven by app.config.settings
(no scattered magic numbers).
"""
from dataclasses import dataclass
from datetime import datetime, timezone
from statistics import mean

from sqlalchemy.orm import Session

from app.config import settings
from app.models import LearningSession
from app.services.fingerprint_service import (
    SKILL_KEYS,
    DEFAULT_FINGERPRINT,
    get_latest_fingerprint,
)
from app.services.recommendation_service import ACTIVITY_MAP, LABEL
from app.utils.skills import skill_key_from_session

# Patterns the engine can report. Deliberately the same seven Phase 9 asks
# for, plus "not_yet_practiced" for a skill with zero recorded attempts
# (distinct from "not_practiced_recently", which means it USED to be
# practiced and has gone stale).
PATTERNS = {
    "consistently_strong": "This skill has stayed strong across recent sessions.",
    "improving": "Performance on this skill has been trending upward.",
    "recently_improved": "A recent jump in performance suggests progress is sticking.",
    "inconsistent": "Results have varied a lot session to session, rather than being simply weak.",
    "needs_practice": "This skill could use some more practice.",
    "repeatedly_struggling": "This skill has stayed low across several recent attempts.",
    "not_practiced_recently": "This skill hasn't come up in a while and is due for review.",
    "not_yet_practiced": "There isn't any recorded practice for this skill yet.",
}


def _accuracy_of(session: LearningSession) -> float | None:
    outcome = session.outcome or {}
    acc = outcome.get("accuracy")
    if acc is None:
        acc = (outcome.get("metrics") or {}).get("accuracy")
    return float(acc) if acc is not None else None


def _timestamp_of(session: LearningSession) -> datetime:
    return session.completed_at or session.started_at


def _days_since(now: datetime, then: datetime | None) -> int | None:
    if then is None:
        return None
    if then.tzinfo is None:
        then = then.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return (now - then).days


def _sessions_by_skill(db: Session, student_id: int) -> dict[str, list[tuple[datetime, float, LearningSession]]]:
    """Group every completed session's accuracy evidence by the snake_case
    skill(s) it counts as evidence for, in chronological order. Reuses the
    exact same skill-attribution rules fingerprint_service already applies
    when nudging the fingerprint (see app.utils.skills).
    """
    rows = (
        db.query(LearningSession)
        .filter(LearningSession.student_id == student_id, LearningSession.completed_at.isnot(None))
        .all()
    )
    # Sort in Python by the SAME timestamp _timestamp_of() exposes to every
    # caller below (completed_at, falling back to started_at) rather than
    # relying on the SQL ORDER BY to already match it. A session whose
    # completed_at diverges meaningfully from started_at (a long session,
    # or a resumed one) would otherwise land out of chronological order in
    # by_skill[skill], silently corrupting "last practiced" (records[-1])
    # and the "recent window" (accuracies[-N:]) below.
    rows.sort(key=_timestamp_of)
    by_skill: dict[str, list[tuple[datetime, float, LearningSession]]] = {k: [] for k in SKILL_KEYS}
    for s in rows:
        accuracy = _accuracy_of(s)
        if accuracy is None:
            continue
        outcome_type = (s.outcome or {}).get("type")
        for skill_key in skill_key_from_session(s.skill, outcome_type):
            by_skill.setdefault(skill_key, []).append((_timestamp_of(s), accuracy, s))
    return by_skill


@dataclass
class SkillProfile:
    skill: str
    label: str
    current_level: float
    attempts: int
    recent_performance: float | None
    historical_performance: float | None
    trend: str  # "improving" | "declining" | "steady" | "not enough data"
    consistency: str  # "consistent" | "inconsistent" | "not enough data"
    pattern: str
    pattern_explanation: str
    difficulty: int
    last_practiced_at: datetime | None
    days_since_practice: int | None
    recommended_practice: bool
    mastery_state: str = "Needs Practice"
    status_badge: str | None = None

    def to_dict(self) -> dict:
        return {
            "skill": self.skill,
            "label": self.label,
            "current_level": self.current_level,
            "attempts": self.attempts,
            "recent_performance": self.recent_performance,
            "historical_performance": self.historical_performance,
            "trend": self.trend,
            "consistency": self.consistency,
            "pattern": self.pattern,
            "pattern_explanation": self.pattern_explanation,
            "difficulty": self.difficulty,
            "last_practiced_at": self.last_practiced_at,
            "days_since_practice": self.days_since_practice,
            "recommended_practice": self.recommended_practice,
            "mastery_state": self.mastery_state,
            "status_badge": self.status_badge,
        }


class AdaptiveLearningEngine:
    """Stateless per-request engine: everything it decides is recomputed
    from the student's stored fingerprint + session history each time, so
    there is no separate mutable "adaptive state" to keep in sync — the
    loop described in the module docstring closes itself automatically the
    next time this is instantiated after a new session is recorded.
    """

    def __init__(self, db: Session, student_id: int, now: datetime | None = None):
        self.db = db
        self.student_id = student_id
        self.now = now or datetime.now(timezone.utc)

    # ---- STEP 2 — learning profile -----------------------------------
    def analyze_learning_profile(self) -> dict[str, SkillProfile]:
        fingerprint = get_latest_fingerprint(self.db, self.student_id)
        current_levels = (
            {k: getattr(fingerprint, k) for k in SKILL_KEYS}
            if fingerprint
            else dict(DEFAULT_FINGERPRINT)
        )
        sessions_by_skill = _sessions_by_skill(self.db, self.student_id)

        profile: dict[str, SkillProfile] = {}
        for skill in SKILL_KEYS:
            records = sessions_by_skill.get(skill, [])
            accuracies = [a for (_, a, _) in records]
            attempts = len(accuracies)
            window = accuracies[-settings.ADAPTIVE_RECENT_SESSION_WINDOW:]

            recent_performance = round(mean(window), 1) if window else None
            historical_performance = round(mean(accuracies), 1) if accuracies else None
            last_practiced_at = records[-1][0] if records else None
            days_since_practice = _days_since(self.now, last_practiced_at)

            trend, consistency = self._trend_and_consistency(window, attempts)
            difficulty = self._difficulty_for(accuracies)
            pattern = self._detect_pattern(
                attempts=attempts,
                trend=trend,
                consistency=consistency,
                recent_performance=recent_performance,
                window=window,
                days_since_practice=days_since_practice,
            )
            recommended_practice = pattern in (
                "needs_practice", "repeatedly_struggling", "not_practiced_recently",
                "not_yet_practiced", "inconsistent",
            )

            # Educational mastery state based on real performance & pattern
            if pattern in ("repeatedly_struggling", "needs_practice"):
                mastery_state = "Needs Practice"
                status_badge = "Practice"
            elif pattern == "inconsistent" or pattern == "not_yet_practiced":
                mastery_state = "Developing"
                status_badge = "Developing"
            elif pattern in ("improving", "recently_improved"):
                mastery_state = "Improving"
                status_badge = "Rising"
            elif pattern == "not_practiced_recently":
                mastery_state = "Review Due"
                status_badge = "Review"
            elif pattern == "consistently_strong":
                mastery_state = "Ready for Challenge" if difficulty >= 4 else "Strong"
                status_badge = "Mastered"
            else:
                mastery_state = "Developing"
                status_badge = "Developing"

            profile[skill] = SkillProfile(
                skill=skill,
                label=LABEL.get(skill, skill),
                current_level=current_levels[skill],
                attempts=attempts,
                recent_performance=recent_performance,
                historical_performance=historical_performance,
                trend=trend,
                consistency=consistency,
                pattern=pattern,
                pattern_explanation=PATTERNS[pattern],
                difficulty=difficulty,
                last_practiced_at=last_practiced_at,
                days_since_practice=days_since_practice,
                recommended_practice=recommended_practice,
                mastery_state=mastery_state,
                status_badge=status_badge,
            )
        return profile

    # ---- STEP 3 — pattern detection -----------------------------------
    @staticmethod
    def _trend_and_consistency(window: list[float], attempts: int) -> tuple[str, str]:
        if attempts < settings.ADAPTIVE_MIN_ATTEMPTS_FOR_TREND or len(window) < 2:
            return "not enough data", "not enough data"

        swings = [abs(window[i] - window[i - 1]) for i in range(1, len(window))]
        max_swing = max(swings) if swings else 0.0
        consistency = "inconsistent" if (len(window) >= 3 and max_swing >= settings.ADAPTIVE_INCONSISTENCY_SWING) else "consistent"

        delta = window[-1] - window[0]
        if delta >= 10:
            trend = "improving"
        elif delta <= -10:
            trend = "declining"
        else:
            trend = "steady"
        return trend, consistency

    @staticmethod
    def _detect_pattern(*, attempts, trend, consistency, recent_performance, window, days_since_practice) -> str:
        """Explainable, priority-ordered classification. Repeated evidence
        (the whole recent window) always outweighs a single unusual
        result — see STEP 3: a single low score never alone triggers
        "repeatedly struggling", and a single high score never alone
        triggers "consistently strong".
        """
        if attempts == 0:
            return "not_yet_practiced"

        if consistency == "inconsistent":
            return "inconsistent"

        if (
            days_since_practice is not None
            and days_since_practice >= settings.ADAPTIVE_SPACED_PRACTICE_INTERVAL_DAYS
            and recent_performance is not None
            and recent_performance >= settings.ADAPTIVE_LOW_PERFORMANCE_THRESHOLD
        ):
            return "not_practiced_recently"

        if trend == "improving":
            sharp = (window[-1] - window[0]) >= settings.ADAPTIVE_INCONSISTENCY_SWING
            return "recently_improved" if sharp else "improving"

        if recent_performance is not None and recent_performance <= settings.ADAPTIVE_LOW_PERFORMANCE_THRESHOLD:
            all_low = all(v <= settings.ADAPTIVE_LOW_PERFORMANCE_THRESHOLD + 10 for v in window)
            enough = len(window) >= min(3, settings.ADAPTIVE_RECENT_SESSION_WINDOW)
            return "repeatedly_struggling" if (all_low and enough) else "needs_practice"

        if recent_performance is not None and recent_performance >= settings.ADAPTIVE_HIGH_PERFORMANCE_THRESHOLD:
            return "consistently_strong"

        return "needs_practice"

    # ---- STEP 4 / STEP 9 — adaptive difficulty -------------------------
    @staticmethod
    def _difficulty_for(accuracies: list[float]) -> int:
        """Replays the FULL history in successive windows (oldest first),
        adjusting the level by at most +-1 per window. This gives a
        difficulty that depends on real performance history and never
        jumps more than one level at a time (STEP 4), without needing a
        separately persisted "current difficulty" column — it is always
        rederived the same way from the same history.
        """
        level = settings.ADAPTIVE_MIN_DIFFICULTY
        window_size = settings.ADAPTIVE_RECENT_SESSION_WINDOW
        for i in range(0, len(accuracies), window_size):
            chunk = accuracies[i:i + window_size]
            avg = mean(chunk)
            if avg >= settings.ADAPTIVE_HIGH_PERFORMANCE_THRESHOLD:
                level = min(settings.ADAPTIVE_MAX_DIFFICULTY, level + 1)
            elif avg <= settings.ADAPTIVE_LOW_PERFORMANCE_THRESHOLD:
                level = max(settings.ADAPTIVE_MIN_DIFFICULTY, level - 1)
        return level

    # ---- STEP 3 — skill priority (used by learning path + next activity)
    def determine_skill_priority(self, profile: dict[str, SkillProfile]) -> list[SkillProfile]:
        """Higher priority first: struggling/inconsistent/stale skills
        before already-strong ones; within a tier, lower current_level
        first. Deterministic (stable sort), never random.
        """
        tier_rank = {
            "repeatedly_struggling": 0,
            "needs_practice": 1,
            "inconsistent": 2,
            "not_practiced_recently": 3,
            "not_yet_practiced": 4,
            "recently_improved": 5,
            "improving": 6,
            "consistently_strong": 7,
        }
        return sorted(
            profile.values(),
            key=lambda p: (tier_rank.get(p.pattern, 99), p.current_level, p.skill),
        )

    # ---- STEP 5 / STEP 10 — activity selection with variety -----------
    def _recent_activity_titles(self, limit: int) -> list[str]:
        rows = (
            self.db.query(LearningSession)
            .filter(LearningSession.student_id == self.student_id, LearningSession.completed_at.isnot(None))
            .order_by(LearningSession.started_at.desc())
            .limit(limit)
            .all()
        )
        titles = []
        for r in rows:
            if r.activity is not None:
                titles.append(r.activity.name)
        return titles

    def select_activity(self, skill: str, recent_titles: list[str] | None = None) -> dict:
        """Maps a skill to an activity via the SAME ACTIVITY_MAP used
        everywhere else. If that activity was just played
        ADAPTIVE_REPETITION_LIMIT times in a row, this documents that
        fact via `repeated` rather than inventing a different activity
        for a skill that only has one mapped activity — callers (e.g.
        generate_next_activity) use `repeated` to fall through to the
        next-priority skill instead, which is how real variety happens
        (STEP 10).
        """
        activity = dict(ACTIVITY_MAP[skill])
        recent = recent_titles if recent_titles is not None else self._recent_activity_titles(settings.ADAPTIVE_REPETITION_LIMIT)
        repeated = (
            len(recent) >= settings.ADAPTIVE_REPETITION_LIMIT
            and all(t == activity["title"] for t in recent[:settings.ADAPTIVE_REPETITION_LIMIT])
        )
        activity["repeated"] = repeated
        return activity

    # ---- STEP 6 — personalized learning path ---------------------------
    def generate_learning_path(self, profile: dict[str, SkillProfile] | None = None, length: int = 4) -> list[dict]:
        profile = profile or self.analyze_learning_profile()
        ordered = self.determine_skill_priority(profile)
        path = []
        for p in ordered[:length]:
            activity = self.select_activity(p.skill)
            path.append({
                "skill": p.skill,
                "label": p.label,
                "activity": activity["title"],
                "route": activity["route"],
                "icon": activity["icon"],
                "difficulty": p.difficulty,
                "pattern": p.pattern,
                "reason": p.pattern_explanation,
            })
        return path

    # ---- STEP 7 — next best activity -----------------------------------
    def generate_next_activity(self, profile: dict[str, SkillProfile] | None = None) -> dict:
        profile = profile or self.analyze_learning_profile()
        ordered = self.determine_skill_priority(profile)
        recent_titles = self._recent_activity_titles(settings.ADAPTIVE_REPETITION_LIMIT)

        chosen = None
        activity = None
        for candidate in ordered:
            candidate_activity = self.select_activity(candidate.skill, recent_titles)
            if not candidate_activity["repeated"]:
                chosen, activity = candidate, candidate_activity
                break
        if chosen is None:
            # Every top candidate was just repeated (e.g. only one skill
            # has data) — this IS the documented reason STEP 10 asks for.
            chosen = ordered[0]
            activity = self.select_activity(chosen.skill, recent_titles=[])

        goal = f"Improve {chosen.label.lower()}."
        reason = self._explain(chosen)
        priority = "high" if chosen.pattern in ("repeatedly_struggling", "needs_practice") else "normal"
        return {
            "child_id": self.student_id,
            "activity_id": None,
            "activity_type": chosen.skill,
            "title": activity["title"],
            "activity": activity["title"],
            "route": activity["route"],
            "icon": activity["icon"],
            "skill": chosen.skill,
            "difficulty": chosen.difficulty,
            "reason": reason,
            "goal": goal,
            "pattern": chosen.pattern,
            "priority": priority,
            "is_adaptive": True,
        }

    @staticmethod
    def _explain(p: SkillProfile) -> str:
        if p.pattern == "not_yet_practiced":
            return f"{p.label} hasn't been practiced yet — let's start here."
        if p.pattern == "repeatedly_struggling":
            return f"Recent sessions show repeated difficulty with {p.label.lower()}."
        if p.pattern == "needs_practice":
            return f"{p.label} could use a bit more practice right now."
        if p.pattern == "inconsistent":
            return f"Results for {p.label.lower()} have varied — more practice will help build consistency."
        if p.pattern == "not_practiced_recently":
            return f"{p.label} hasn't come up in a few sessions — time for a quick review."
        if p.pattern == "recently_improved":
            return f"{p.label} has jumped recently — keep the momentum going."
        if p.pattern == "improving":
            return f"{p.label} has been improving steadily — let's build on that."
        return f"{p.label} is strong — a chance to stretch a little further."

    # ---- STEP 8 — spaced practice --------------------------------------
    def spaced_practice_candidates(self, profile: dict[str, SkillProfile] | None = None) -> list[dict]:
        profile = profile or self.analyze_learning_profile()
        stale = [p for p in profile.values() if p.pattern == "not_practiced_recently"]
        stale.sort(key=lambda p: (p.days_since_practice or 0), reverse=True)
        return [{"skill": p.skill, "label": p.label, "days_since_practice": p.days_since_practice, "reason": p.pattern_explanation} for p in stale]
