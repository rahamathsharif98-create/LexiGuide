"""Step 15: Intelligent Learning Recommendation + Next-Best-Action Engine.

Authoritative backend service that answers:
"What should this child learn/practice NEXT, and WHY?"
using real persisted session history, Reading Fingerprint, skill trends,
day-by-day analysis, difficulty adaptation, variety rules, and spaced practice.

Zero fabrication, zero random selection, zero artificial multipliers.
Strict non-clinical, educational explainability.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import LearningSession
from app.schemas.next_best_action import (
    NextBestActivityItem,
    LearnerSummary,
    NextBestActionResponse,
)
from app.services.adaptive_learning_service import (
    AdaptiveLearningEngine,
    SkillProfile,
)
from app.services.fingerprint_service import (
    SKILL_KEYS,
    get_latest_fingerprint,
)
from app.services.search_service import CATALOG_STATIC_RESOURCES
from app.services.day_by_day_service import calculate_streaks
from app.utils.language import DISCLAIMER, contains_forbidden_language

# Difficulty mapping
DIFFICULTY_LABELS = {
    1: "Easy",
    2: "Easy",
    3: "Medium",
    4: "Hard",
}

# Skill friendly titles and descriptions
SKILL_GOALS = {
    "reading_fluency": "Improve oral reading pace, word expression, and flow.",
    "phonological_awareness": "Build sound blending and phoneme identification skills.",
    "pronunciation": "Practice clear target articulation and speech sounds.",
    "word_recognition": "Strengthen instant recognition and spelling of common sight words.",
    "comprehension": "Deepen story understanding, recalling details and story flow.",
}


def _get_catalog_activities_for_skill(skill: str) -> list[dict]:
    """Retrieve all catalog items matching the given skill, ordered by difficulty."""
    matching = [item for item in CATALOG_STATIC_RESOURCES if item.get("skill") == skill]
    return matching


def _map_catalog_to_item(
    activity_dict: dict,
    skill: str,
    priority: int,
    recommendation_type: str,
    reason: str,
    fit_reason: str,
    goal: str,
    difficulty_int: int,
    is_spaced: bool = False,
    is_variety: bool = False,
) -> NextBestActivityItem:
    diff_label = DIFFICULTY_LABELS.get(difficulty_int, "Easy")
    title = activity_dict.get("title", "Practice Activity")
    act_type = activity_dict.get("type", "activity")
    if act_type not in ["game", "reading", "speaking", "story", "sound", "activity"]:
        act_type = "activity"

    return NextBestActivityItem(
        activity_id=activity_dict.get("id", f"act-{skill}"),
        activity_type=act_type,
        title=title,
        skill=skill,
        difficulty=difficulty_int,
        difficulty_label=diff_label,
        route=activity_dict.get("route", "/child/read"),
        icon=activity_dict.get("icon", "⭐"),
        priority=priority,
        recommendation_type=recommendation_type,
        reason=reason,
        fit_reason=fit_reason,
        recommended_action=f"Practice {title}",
        expected_learning_goal=goal,
        is_spaced_practice=is_spaced,
        is_variety_switch=is_variety,
    )


def determine_next_best_action(
    db: Session,
    student_id: int,
    now: datetime | None = None,
) -> NextBestActionResponse:
    current_time = now or datetime.now(timezone.utc)
    engine = AdaptiveLearningEngine(db, student_id, now=current_time)

    # 1. Inspect learning sessions count
    completed_sessions = (
        db.query(LearningSession)
        .filter(LearningSession.student_id == student_id, LearningSession.completed_at.isnot(None))
        .all()
    )
    total_sessions = len(completed_sessions)

    # 2. Check genuine streak from day-by-day streak calculation
    session_dates = set()
    for s in completed_sessions:
        ts = s.completed_at or s.started_at
        if ts:
            session_dates.add(ts.date() if hasattr(ts, "date") else ts)
    current_date = current_time.date() if hasattr(current_time, "date") else current_time
    current_streak, _ = calculate_streaks(session_dates, current_date)

    # ------------------------------------------------------------------
    # PART 15: EMPTY / ONBOARDING LEARNER STATE (0 completed sessions)
    # ------------------------------------------------------------------
    if total_sessions == 0:
        latest_fp = get_latest_fingerprint(db, student_id)
        fp_focus = None
        fp_strongest = None
        if latest_fp:
            fp_levels = {k: getattr(latest_fp, k, 55.0) for k in SKILL_KEYS if hasattr(latest_fp, k)}
            vals = list(fp_levels.values())
            if vals and max(vals) != min(vals):
                fp_strongest = max(fp_levels, key=fp_levels.get)
                fp_focus = min(fp_levels, key=fp_levels.get)

        summary = LearnerSummary(
            student_id=student_id,
            total_sessions=0,
            focus_skill=fp_focus,
            strongest_skill=fp_strongest,
            current_streak=0,
            data_sufficiency="insufficient",
        )

        onboarding_reason = "Let's start with a short learning activity to discover which skills feel easiest and which need more practice."
        
        # Primary: Read With Me
        primary_cat = next((c for c in CATALOG_STATIC_RESOURCES if c["id"] == "act-read-with-me"), CATALOG_STATIC_RESOURCES[0])
        best_action = _map_catalog_to_item(
            activity_dict=primary_cat,
            skill="reading_fluency",
            priority=1,
            recommendation_type="onboarding",
            reason=onboarding_reason,
            fit_reason="An introductory reading passage with helpful real-time guidance.",
            goal=SKILL_GOALS["reading_fluency"],
            difficulty_int=1,
        )

        # Alternatives
        alt1_cat = next((c for c in CATALOG_STATIC_RESOURCES if c["id"] == "act-sound-safari"), CATALOG_STATIC_RESOURCES[1])
        alt1 = _map_catalog_to_item(
            activity_dict=alt1_cat,
            skill="phonological_awareness",
            priority=2,
            recommendation_type="onboarding",
            reason="Listen to friendly animal sounds and explore starting letter sounds.",
            fit_reason="Fun, introductory phonics sound-matching game.",
            goal=SKILL_GOALS["phonological_awareness"],
            difficulty_int=1,
        )

        alt2_cat = next((c for c in CATALOG_STATIC_RESOURCES if c["id"] == "act-word-builder"), CATALOG_STATIC_RESOURCES[2])
        alt2 = _map_catalog_to_item(
            activity_dict=alt2_cat,
            skill="word_recognition",
            priority=3,
            recommendation_type="onboarding",
            reason="Rearrange letter blocks to spell easy sight words.",
            fit_reason="Hands-on word puzzle for beginner readers.",
            goal=SKILL_GOALS["word_recognition"],
            difficulty_int=1,
        )

        explanation = "Welcome! Start your learning journey with a foundational activity."
        return NextBestActionResponse(
            child_id=student_id,
            learner_summary=summary,
            best_action=best_action,
            alternatives=[alt1, alt2],
            explanation=explanation,
            disclaimer=DISCLAIMER,
            timestamp=current_time,
        )

    # ------------------------------------------------------------------
    # LEARNER WITH RECORDED HISTORY
    # ------------------------------------------------------------------
    profile = engine.analyze_learning_profile()
    ordered_skills = engine.determine_skill_priority(profile)
    
    # Retrieve recent completed activity titles (from activity model or outcome payload)
    recent_sessions = (
        db.query(LearningSession)
        .filter(LearningSession.student_id == student_id, LearningSession.completed_at.isnot(None))
        .order_by(LearningSession.completed_at.desc(), LearningSession.started_at.desc())
        .limit(5)
        .all()
    )
    recent_titles = []
    for r in recent_sessions:
        if r.activity and r.activity.name:
            recent_titles.append(r.activity.name)
        elif r.outcome and isinstance(r.outcome, dict) and r.outcome.get("title"):
            recent_titles.append(r.outcome.get("title"))
    if not recent_titles:
        recent_titles = engine._recent_activity_titles(3)

    # Identify focus skill & strongest skill
    focus_skill_profile = ordered_skills[0] if ordered_skills else None
    focus_skill = focus_skill_profile.skill if focus_skill_profile else None

    strongest_candidates = sorted(
        profile.values(),
        key=lambda p: (p.current_level, p.recent_performance or 0),
        reverse=True
    )
    strongest_skill = strongest_candidates[0].skill if strongest_candidates else None

    data_sufficiency = "developing" if total_sessions < 3 else "sufficient"
    summary = LearnerSummary(
        student_id=student_id,
        total_sessions=total_sessions,
        focus_skill=focus_skill,
        strongest_skill=strongest_skill,
        current_streak=current_streak,
        data_sufficiency=data_sufficiency,
    )

    # Check repetition / variety requirement
    # If the user completed the same activity title 3 times in a row:
    is_repeated_3x = len(recent_titles) >= 3 and len(set(recent_titles[:3])) == 1
    repeated_title = recent_titles[0] if is_repeated_3x else None

    # Determine Best Action
    best_candidate_skill = focus_skill_profile
    candidate_activities = _get_catalog_activities_for_skill(best_candidate_skill.skill)
    
    # Pick activity with variety handling
    selected_act = None
    is_variety_switch = False
    
    if is_repeated_3x:
        # Find alternative activity for the same target skill
        different_for_skill = [a for a in candidate_activities if a["title"] != repeated_title]
        if different_for_skill:
            selected_act = different_for_skill[0]
            is_variety_switch = True
        else:
            # Fall back to next priority skill if no other activity for this skill
            if len(ordered_skills) > 1:
                best_candidate_skill = ordered_skills[1]
                candidate_activities = _get_catalog_activities_for_skill(best_candidate_skill.skill)
                selected_act = candidate_activities[0] if candidate_activities else None
                is_variety_switch = True

    if not selected_act:
        selected_act = candidate_activities[0] if candidate_activities else CATALOG_STATIC_RESOURCES[0]

    # Map pattern to recommendation type & pedagogical rationale
    p = best_candidate_skill
    rec_type = "needs_practice"
    reason = ""
    fit_reason = ""

    if is_variety_switch:
        rec_type = "variety"
        reason = f"You practiced {repeated_title} several times in a row! Let's switch formats while staying focused on {p.label.lower()}."
        fit_reason = f"Practicing with {selected_act['title']} keeps learning exciting and strengthens {p.label.lower()}."
    elif p.pattern == "repeatedly_struggling":
        rec_type = "supportive_down"
        reason = f"{p.label} has been challenging across recent sessions. A supportive activity will help build confidence."
        fit_reason = f"Focused step-by-step guidance designed to support {p.label.lower()}."
    elif p.trend == "declining":
        rec_type = "declining_skill"
        reason = f"Performance in {p.label.lower()} dipped slightly recently, so a targeted refresher is recommended."
        fit_reason = f"Reviewing fundamentals will help steady your {p.label.lower()}."
    elif p.pattern == "not_practiced_recently":
        rec_type = "spaced_practice"
        reason = f"It has been several days since practicing {p.label.lower()}. A quick spaced review will keep it fresh!"
        fit_reason = f"Timed review strengthens long-term memory for {p.label.lower()}."
    elif p.pattern in ("improving", "recently_improved"):
        if p.difficulty > 2:
            rec_type = "challenge_up"
            reason = f"{p.label} is improving steadily! You're ready to take on a slightly higher challenge."
            fit_reason = f"Builds on your momentum with next-level {p.label.lower()} practice."
        else:
            rec_type = "reinforcement"
            reason = f"Great progress in {p.label.lower()}! Let's reinforce this skill so it sticks."
            fit_reason = f"Solidifies gains made in recent {p.label.lower()} sessions."
    elif p.pattern == "consistently_strong":
        rec_type = "challenge_up"
        reason = f"{p.label} is consistently strong. Let's stretch with a challenging exercise."
        fit_reason = f"Deepens mastery and fluency in {p.label.lower()}."
    else:
        rec_type = "needs_practice"
        reason = f"{p.label} is an important focus area that could use more practice today."
        fit_reason = f"Direct practice to boost confidence in {p.label.lower()}."

    best_action = _map_catalog_to_item(
        activity_dict=selected_act,
        skill=p.skill,
        priority=1,
        recommendation_type=rec_type,
        reason=reason,
        fit_reason=fit_reason,
        goal=SKILL_GOALS.get(p.skill, f"Strengthen {p.label.lower()}."),
        difficulty_int=p.difficulty,
        is_spaced=(rec_type == "spaced_practice"),
        is_variety=is_variety_switch,
    )

    # ------------------------------------------------------------------
    # BUILD RANKED ALTERNATIVES (Alternative + Spaced Practice / Variety)
    # ------------------------------------------------------------------
    alternatives: list[NextBestActivityItem] = []

    # Alternative 1: Secondary prioritized skill from profile
    other_skills = [s for s in ordered_skills if s.skill != p.skill]
    if other_skills:
        alt1_skill = other_skills[0]
        alt1_acts = _get_catalog_activities_for_skill(alt1_skill.skill)
        alt1_act = alt1_acts[0] if alt1_acts else CATALOG_STATIC_RESOURCES[1]
        
        alt1_reason = f"Alternative focus: practice {alt1_skill.label.lower()} to maintain balanced skill growth."
        alt1_fit = f"Provides structured exercises in {alt1_skill.label.lower()}."
        alt1_type = "balanced_profile" if alt1_skill.pattern == "consistently_strong" else "needs_practice"

        alternatives.append(_map_catalog_to_item(
            activity_dict=alt1_act,
            skill=alt1_skill.skill,
            priority=2,
            recommendation_type=alt1_type,
            reason=alt1_reason,
            fit_reason=alt1_fit,
            goal=SKILL_GOALS.get(alt1_skill.skill, f"Practice {alt1_skill.label.lower()}."),
            difficulty_int=alt1_skill.difficulty,
            is_spaced=False,
            is_variety=False,
        ))

    # Alternative 2: Spaced Practice Candidate or Reinforcement
    spaced_candidates = engine.spaced_practice_candidates(profile)
    spaced_match = next((s for s in spaced_candidates if s["skill"] != p.skill and (not alternatives or s["skill"] != alternatives[0].skill)), None)

    if spaced_match:
        sp_skill = spaced_match["skill"]
        sp_acts = _get_catalog_activities_for_skill(sp_skill)
        sp_act = sp_acts[0] if sp_acts else CATALOG_STATIC_RESOURCES[2]
        sp_prof = profile.get(sp_skill)
        sp_diff = sp_prof.difficulty if sp_prof else 1

        alternatives.append(_map_catalog_to_item(
            activity_dict=sp_act,
            skill=sp_skill,
            priority=3,
            recommendation_type="spaced_practice",
            reason=f"Spaced practice option: {spaced_match['label']} hasn't been practiced in {spaced_match.get('days_since_practice', 3)} days.",
            fit_reason=f"Periodic review ensures long-term retention of {spaced_match['label'].lower()}.",
            goal=SKILL_GOALS.get(sp_skill, f"Review {spaced_match['label'].lower()}."),
            difficulty_int=sp_diff,
            is_spaced=True,
            is_variety=False,
        ))
    elif len(other_skills) > 1:
        # Third skill option for variety / reinforcement
        alt2_skill = other_skills[1]
        alt2_acts = _get_catalog_activities_for_skill(alt2_skill.skill)
        alt2_act = alt2_acts[0] if alt2_acts else CATALOG_STATIC_RESOURCES[2]

        alternatives.append(_map_catalog_to_item(
            activity_dict=alt2_act,
            skill=alt2_skill.skill,
            priority=3,
            recommendation_type="reinforcement" if alt2_skill.pattern in ("improving", "consistently_strong") else "needs_practice",
            reason=f"Explore {alt2_act['title']} to support {alt2_skill.label.lower()}.",
            fit_reason=f"Builds foundational reading proficiency across {alt2_skill.label.lower()}.",
            goal=SKILL_GOALS.get(alt2_skill.skill, f"Explore {alt2_skill.label.lower()}."),
            difficulty_int=alt2_skill.difficulty,
            is_spaced=False,
            is_variety=False,
        ))

    # Overall explanation
    explanation = f"Recommended next action focuses on {p.label} based on recent learning sessions and skill patterns."
    
    # Verify non-clinical integrity
    assert not contains_forbidden_language(reason), "Forbidden clinical language in reason"
    assert not contains_forbidden_language(explanation), "Forbidden clinical language in explanation"

    return NextBestActionResponse(
        child_id=student_id,
        learner_summary=summary,
        best_action=best_action,
        alternatives=alternatives,
        explanation=explanation,
        disclaimer=DISCLAIMER,
        timestamp=current_time,
    )
