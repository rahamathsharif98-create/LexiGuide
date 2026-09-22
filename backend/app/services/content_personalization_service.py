"""Step 17: Intelligent Learning Experience + Content Personalization Service.

Synthesizes:
- Learner state (ReadingFingerprint & AdaptiveLearningEngine)
- Step 15 Next-Best-Action recommendation
- Step 16 Personalized Learning Goals & Weekly Learning Plan
- Structured Content Catalog (rich metadata: skill, age, time, prerequisites, tags, language)
- 7 Learning Modes: NEW_LEARNING, REINFORCEMENT, REVIEW, SPACED_REVIEW, CHALLENGE, EASIER_PRACTICE, EXPLORATION
- Deterministic multi-factor scoring (skill match, difficulty fit, repetition penalty, variety, goal/plan alignment)
- Multilingual filtering & fallback
- Search personalization booster
- Strictly non-clinical, encouraging child-friendly educational language.
- Zero fabrication, canonical numeric Student.id.
"""
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app.models import LearningSession, Student
from app.schemas.personalized_content import (
    ContentItem,
    PersonalizedContentCandidate,
    PersonalizedCategorySection,
    PersonalizedContentResponse,
)
from app.services.adaptive_learning_service import (
    AdaptiveLearningEngine,
    SkillProfile,
)
from app.services.fingerprint_service import (
    SKILL_KEYS,
    get_latest_fingerprint,
    DEFAULT_FINGERPRINT,
)
from app.services.next_best_action_service import (
    determine_next_best_action,
    DIFFICULTY_LABELS,
)
from app.services.learning_plan_service import (
    generate_learning_goals,
    generate_weekly_learning_plan,
)
from app.utils.language import DISCLAIMER, contains_forbidden_language

# ==============================================================================
# STRUCTURED RICH CONTENT CATALOG (Reusing & Extending Platform Activities)
# ==============================================================================

RICH_CONTENT_CATALOG: List[dict] = [
    {
        "id": "act-sound-safari",
        "title": "Sound Safari",
        "description": "Listen to a wild animal sound and match the starting phoneme sound.",
        "content_type": "game",
        "category": "Sounds",
        "skill": "phonological_awareness",
        "secondary_skills": ["pronunciation"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-8",
        "estimated_minutes": 5,
        "prerequisites": [],
        "tags": ["sounds", "phonics", "safari", "animals", "lion", "phoneme", "listening"],
        "language": "en",
        "activity_type": "game",
        "learning_objective": "Identify initial phonemes in common animal names.",
        "reinforcement_target": "Initial phoneme discrimination",
        "prerequisite_skill": None,
        "challenge_level": "standard",
        "route": "/child/games/match-sound",
        "icon": "🦁",
    },
    {
        "id": "act-letter-detective",
        "title": "Letter Detective",
        "description": "Hunt for mystery letters and identify sounds hiding inside words.",
        "content_type": "game",
        "category": "Sounds",
        "skill": "phonological_awareness",
        "secondary_skills": ["word_recognition"],
        "difficulty": 2,
        "difficulty_label": "Easy",
        "age_range": "6-9",
        "estimated_minutes": 6,
        "prerequisites": ["act-sound-safari"],
        "tags": ["detective", "letters", "sounds", "phonics", "mystery", "investigate"],
        "language": "en",
        "activity_type": "game",
        "learning_objective": "Distinguish medial and ending consonant sounds in words.",
        "reinforcement_target": "Medial phoneme blending",
        "prerequisite_skill": "phonological_awareness",
        "challenge_level": "standard",
        "route": "/child/games/find-sound",
        "icon": "🔍",
    },
    {
        "id": "act-word-builder",
        "title": "Word Builder",
        "description": "Rearrange spelling blocks to build target sight words and syllables.",
        "content_type": "game",
        "category": "Games",
        "skill": "word_recognition",
        "secondary_skills": ["phonological_awareness"],
        "difficulty": 2,
        "difficulty_label": "Easy",
        "age_range": "6-9",
        "estimated_minutes": 7,
        "prerequisites": [],
        "tags": ["puzzle", "spelling", "words", "letters", "blocks", "phonics"],
        "language": "en",
        "activity_type": "game",
        "learning_objective": "Assemble 3 to 4 letter words from consonant-vowel-consonant blocks.",
        "reinforcement_target": "CVC word construction",
        "prerequisite_skill": "phonological_awareness",
        "challenge_level": "standard",
        "route": "/child/games/build-word",
        "icon": "🧩",
    },
    {
        "id": "act-picture-match",
        "title": "Picture Match",
        "description": "Connect vibrant pictures with their matching written vocabulary words.",
        "content_type": "game",
        "category": "Games",
        "skill": "word_recognition",
        "secondary_skills": ["comprehension"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-8",
        "estimated_minutes": 5,
        "prerequisites": [],
        "tags": ["picture", "match", "cards", "sight words", "memory", "reading"],
        "language": "en",
        "activity_type": "game",
        "learning_objective": "Recognize high-frequency sight words with visual picture cues.",
        "reinforcement_target": "Sight word visual association",
        "prerequisite_skill": None,
        "challenge_level": "supportive",
        "route": "/child/games/picture-word",
        "icon": "🖼️",
    },
    {
        "id": "act-read-with-me",
        "title": "Read With Me",
        "description": "Read aloud with real-time word tracking, speech guidance, and encouragement.",
        "content_type": "reading",
        "category": "Reading",
        "skill": "reading_fluency",
        "secondary_skills": ["pronunciation", "word_recognition"],
        "difficulty": 2,
        "difficulty_label": "Easy",
        "age_range": "6-10",
        "estimated_minutes": 8,
        "prerequisites": ["act-picture-match"],
        "tags": ["reading", "read aloud", "fluency", "words", "speech", "passage"],
        "language": "en",
        "activity_type": "reading",
        "learning_objective": "Maintain steady oral reading pace and word recognition accuracy.",
        "reinforcement_target": "Sentence-level reading cadence",
        "prerequisite_skill": "word_recognition",
        "challenge_level": "standard",
        "route": "/child/read",
        "icon": "📖",
    },
    {
        "id": "passage-pet-cat",
        "title": "My Pet Cat",
        "description": "Read a cheerful story about a playful kitten chasing a red ball.",
        "content_type": "reading",
        "category": "Reading",
        "skill": "reading_fluency",
        "secondary_skills": ["comprehension"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-7",
        "estimated_minutes": 4,
        "prerequisites": [],
        "tags": ["cat", "pet", "animals", "ball", "kitten", "easy reading", "play"],
        "language": "en",
        "activity_type": "reading",
        "learning_objective": "Read simple 3-word to 5-word sentences with confidence.",
        "reinforcement_target": "Early sentence flow",
        "prerequisite_skill": None,
        "challenge_level": "supportive",
        "route": "/child/read",
        "icon": "🐱",
    },
    {
        "id": "passage-big-race",
        "title": "The Big Race",
        "description": "Read about the determined turtle and the speedy rabbit in a friendly race.",
        "content_type": "reading",
        "category": "Reading",
        "skill": "reading_fluency",
        "secondary_skills": ["comprehension"],
        "difficulty": 3,
        "difficulty_label": "Medium",
        "age_range": "7-10",
        "estimated_minutes": 7,
        "prerequisites": ["passage-pet-cat"],
        "tags": ["turtle", "rabbit", "race", "animals", "fast", "fable", "challenge"],
        "language": "en",
        "activity_type": "reading",
        "learning_objective": "Read multi-syllable narrative sentences smoothly.",
        "reinforcement_target": "Multi-clause sentence fluency",
        "prerequisite_skill": "reading_fluency",
        "challenge_level": "stretch",
        "route": "/child/read",
        "icon": "🐢",
    },
    {
        "id": "act-speak-and-shine",
        "title": "Speak & Shine",
        "description": "Speak clear target words aloud and receive instant friendly pronunciation guidance.",
        "content_type": "speaking",
        "category": "Speaking",
        "skill": "pronunciation",
        "secondary_skills": ["phonological_awareness"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-9",
        "estimated_minutes": 5,
        "prerequisites": [],
        "tags": ["speak", "speech", "pronunciation", "talk", "voice", "microphone", "words"],
        "language": "en",
        "activity_type": "speaking",
        "learning_objective": "Articulate clear consonant and vowel phonemes in key vocabulary words.",
        "reinforcement_target": "Phoneme clarity & articulation",
        "prerequisite_skill": None,
        "challenge_level": "standard",
        "route": "/child/speak",
        "icon": "🎤",
    },
    {
        "id": "story-forest",
        "title": "The Curious Fox",
        "description": "Explore the forest with Sam the fox and answer questions about his shiny stone.",
        "content_type": "story",
        "category": "Stories",
        "skill": "comprehension",
        "secondary_skills": ["reading_fluency"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-8",
        "estimated_minutes": 6,
        "prerequisites": [],
        "tags": ["fox", "forest", "animals", "stone", "story", "nature", "sam"],
        "language": "en",
        "activity_type": "story",
        "learning_objective": "Answer literal questions about main characters and setting.",
        "reinforcement_target": "Literal recall and character identification",
        "prerequisite_skill": None,
        "challenge_level": "supportive",
        "route": "/child/stories/story-forest",
        "icon": "🦊",
    },
    {
        "id": "story-space",
        "title": "A Trip to the Moon",
        "description": "Travel to the stars with Priya and answer questions about her imaginative journey.",
        "content_type": "story",
        "category": "Stories",
        "skill": "comprehension",
        "secondary_skills": ["reading_fluency"],
        "difficulty": 2,
        "difficulty_label": "Easy",
        "age_range": "6-9",
        "estimated_minutes": 8,
        "prerequisites": ["story-forest"],
        "tags": ["space", "moon", "rocket", "priya", "stars", "adventure", "story"],
        "language": "en",
        "activity_type": "story",
        "learning_objective": "Answer sequencing and inference questions from narrative text.",
        "reinforcement_target": "Inferential comprehension and story sequence",
        "prerequisite_skill": "comprehension",
        "challenge_level": "standard",
        "route": "/child/stories/story-space",
        "icon": "🚀",
    },
    {
        "id": "story-farm",
        "title": "Bella the Baking Bear",
        "description": "Join Bella the bear as she bakes a golden honey cake for her forest party.",
        "content_type": "story",
        "category": "Stories",
        "skill": "comprehension",
        "secondary_skills": ["reading_fluency", "word_recognition"],
        "difficulty": 3,
        "difficulty_label": "Medium",
        "age_range": "7-10",
        "estimated_minutes": 9,
        "prerequisites": ["story-space"],
        "tags": ["bear", "cake", "baking", "honey", "animals", "party", "forest", "bella"],
        "language": "en",
        "activity_type": "story",
        "learning_objective": "Explain character motivations and key cause-and-effect relationships.",
        "reinforcement_target": "Cause-and-effect comprehension",
        "prerequisite_skill": "comprehension",
        "challenge_level": "stretch",
        "route": "/child/stories/story-farm",
        "icon": "🐻",
    },
    # Multilingual Content Items (Hindi & Telugu support where established)
    {
        "id": "act-sound-safari-hi",
        "title": "Sound Safari (Hindi Sounds)",
        "description": "Listen to animal sounds and match starting Hindi varnamala letters.",
        "content_type": "game",
        "category": "Sounds",
        "skill": "phonological_awareness",
        "secondary_skills": ["pronunciation"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-8",
        "estimated_minutes": 5,
        "prerequisites": [],
        "tags": ["sounds", "hindi", "safari", "animals", "varnamala", "listening"],
        "language": "hi",
        "activity_type": "game",
        "learning_objective": "Identify beginning Hindi phonemes with animal prompts.",
        "reinforcement_target": "Hindi letter sound matching",
        "prerequisite_skill": None,
        "challenge_level": "standard",
        "route": "/child/games/match-sound?lang=hi",
        "icon": "🦁",
    },
    {
        "id": "act-sound-safari-te",
        "title": "Sound Safari (Telugu Sounds)",
        "description": "Listen to animal sounds and match starting Telugu aksharamulu letters.",
        "content_type": "game",
        "category": "Sounds",
        "skill": "phonological_awareness",
        "secondary_skills": ["pronunciation"],
        "difficulty": 1,
        "difficulty_label": "Easy",
        "age_range": "5-8",
        "estimated_minutes": 5,
        "prerequisites": [],
        "tags": ["sounds", "telugu", "safari", "animals", "aksharamulu", "listening"],
        "language": "te",
        "activity_type": "game",
        "learning_objective": "Identify beginning Telugu phonemes with animal prompts.",
        "reinforcement_target": "Telugu letter sound matching",
        "prerequisite_skill": None,
        "challenge_level": "standard",
        "route": "/child/games/match-sound?lang=te",
        "icon": "🦁",
    },
]


def _dict_to_content_item(d: dict) -> ContentItem:
    return ContentItem(
        id=d["id"],
        title=d["title"],
        description=d["description"],
        content_type=d.get("content_type", d.get("type", "activity")),
        category=d["category"],
        skill=d["skill"],
        secondary_skills=d.get("secondary_skills", []),
        difficulty=d.get("difficulty", 2),
        difficulty_label=d.get("difficulty_label", "Easy"),
        age_range=d.get("age_range", "5-8"),
        estimated_minutes=d.get("estimated_minutes", 6),
        prerequisites=d.get("prerequisites", []),
        tags=d.get("tags", []),
        language=d.get("language", "en"),
        activity_type=d.get("activity_type", "game"),
        learning_objective=d.get("learning_objective", "Literacy practice"),
        reinforcement_target=d.get("reinforcement_target"),
        prerequisite_skill=d.get("prerequisite_skill"),
        challenge_level=d.get("challenge_level", "standard"),
        route=d["route"],
        icon=d["icon"],
    )


# ==============================================================================
# AUTHORITATIVE CONTENT PERSONALIZATION ENGINE
# ==============================================================================

def select_personalized_content(
    db: Session,
    student_id: int,
    now: datetime | None = None,
    language_filter: str | None = None,
) -> PersonalizedContentResponse:
    """Authoritatively ranks and personalizes learning content for a student.

    Synthesizes:
    - Step 15 Next-Best-Action recommendation
    - Step 16 Learning Goals and Weekly Plan
    - AdaptiveLearningEngine profile (skill trends, accuracy, stagnation, spaced decay)
    - Repetition penalty (frequency of each activity in recent sessions)
    - Multi-factor deterministic scoring
    """
    current_time = now or datetime.now(timezone.utc)
    engine = AdaptiveLearningEngine(db, student_id, now=current_time)
    profile = engine.analyze_learning_profile()
    ordered_skills = engine.determine_skill_priority(profile)

    # 1. Fetch recent sessions to calculate repetition counts and recent performance
    recent_sessions = (
        db.query(LearningSession)
        .filter(LearningSession.student_id == student_id, LearningSession.completed_at.isnot(None))
        .order_by(LearningSession.completed_at.desc())
        .limit(20)
        .all()
    )

    total_sessions = len(recent_sessions)
    activity_repetition: Dict[str, int] = {}
    for s in recent_sessions[:8]:
        out = s.outcome or {}
        t = out.get("title") or getattr(s.activity, "name", None) or s.skill
        if t:
            activity_repetition[t] = activity_repetition.get(t, 0) + 1

    # 2. Get authoritative Next-Best-Action and Goals
    nba_resp = determine_next_best_action(db, student_id, now=current_time)
    best_action = nba_resp.best_action
    goals_resp = generate_learning_goals(db, student_id, now=current_time)
    target_goals = goals_resp.goals
    primary_goal = target_goals[0] if target_goals else None
    goal_skills = {g.skill for g in target_goals}

    # Weekly plan alignment
    plan_resp = generate_weekly_learning_plan(db, student_id, now=current_time)
    today_plan_days = [d for d in plan_resp.days if d.is_today]
    today_plan = today_plan_days[0] if today_plan_days else None

    # 3. Determine Learning Mode
    # NEW_LEARNING, REINFORCEMENT, REVIEW, SPACED_REVIEW, CHALLENGE, EASIER_PRACTICE, EXPLORATION
    if total_sessions == 0:
        learning_mode = "NEW_LEARNING"
    elif best_action.recommendation_type == "spaced_practice":
        learning_mode = "SPACED_REVIEW"
    elif best_action.recommendation_type == "challenge_up":
        learning_mode = "CHALLENGE"
    elif best_action.recommendation_type == "supportive_down":
        learning_mode = "EASIER_PRACTICE"
    elif best_action.recommendation_type in ("declining_skill", "needs_practice"):
        learning_mode = "REINFORCEMENT"
    elif best_action.recommendation_type == "reinforcement":
        learning_mode = "REVIEW"
    else:
        learning_mode = "REINFORCEMENT"

    target_skill = best_action.skill
    adaptive_diff = best_action.difficulty

    # 4. Filter Catalog by requested language (default to "en", fallback gracefully if empty)
    preferred_lang = language_filter or "en"
    available_catalog = [c for c in RICH_CONTENT_CATALOG if c.get("language", "en") == preferred_lang]
    if not available_catalog:
        # Graceful fallback: return English content rather than empty crash
        available_catalog = [c for c in RICH_CONTENT_CATALOG if c.get("language", "en") == "en"]

    # 5. Deterministic Scoring Algorithm
    ranked_candidates: List[PersonalizedContentCandidate] = []

    for item_dict in available_catalog:
        item = _dict_to_content_item(item_dict)
        score = 0.0
        reasons: List[str] = []

        # A. Target Skill Match
        if item.skill == target_skill:
            score += 40.0
            reasons.append(f"Focus skill match for {target_skill.replace('_', ' ')}.")
        elif target_skill in item.secondary_skills:
            score += 25.0
            reasons.append(f"Secondary practice for {target_skill.replace('_', ' ')}.")
        elif item.skill in goal_skills:
            score += 18.0
            reasons.append("Aligns with target learning goals.")
        else:
            score += 5.0

        # B. Adaptive Difficulty Fit
        diff_gap = abs(item.difficulty - adaptive_diff)
        if diff_gap == 0:
            score += 25.0
            reasons.append(f"Optimal difficulty match (Level {item.difficulty}).")
        elif diff_gap == 1:
            score += 15.0
        else:
            score += 5.0

        # C. Learning Mode Match
        if learning_mode == "CHALLENGE" and item.challenge_level == "stretch":
            score += 15.0
            reasons.append("Presents an engaging skill challenge.")
        elif learning_mode == "EASIER_PRACTICE" and item.challenge_level == "supportive":
            score += 15.0
            reasons.append("Provides gentle confidence-building practice.")
        elif learning_mode in ("NEW_LEARNING", "EXPLORATION") and item.difficulty <= 2:
            score += 12.0
            reasons.append("Accessible introductory exploration.")
        elif learning_mode in ("REINFORCEMENT", "REVIEW") and item.skill == target_skill:
            score += 10.0

        # D. Next-Best-Action & Plan Alignment
        is_plan_aligned = False
        if today_plan and today_plan.activity and today_plan.activity.title == item.title:
            score += 20.0
            is_plan_aligned = True
            reasons.append("Scheduled on today's adaptive learning roadmap.")
        elif best_action and best_action.title == item.title:
            score += 18.0
            reasons.append("Matches your primary next-best-action.")

        # E. Goal Alignment
        is_goal_aligned = False
        if primary_goal and primary_goal.skill == item.skill:
            score += 10.0
            is_goal_aligned = True
            reasons.append("Directly advances top learning priority.")

        # F. Repetition Penalty & Variety Adjustment
        rep_count = activity_repetition.get(item.title, 0)
        if rep_count >= 3:
            score -= 30.0  # Strong variety switch penalty
            reasons.append(f"Practiced {rep_count} times recently — variety switch applied.")
        elif rep_count >= 1:
            score -= (rep_count * 8.0)

        # Build clear child-friendly reason sentence
        reason_text = " ".join(reasons[:2]) if reasons else "Recommended practice adventure."

        candidate = PersonalizedContentCandidate(
            content=item,
            action_type=learning_mode,
            reason=reason_text,
            fit_score=round(score, 2),
            repetition_count=rep_count,
            goal_aligned=is_goal_aligned,
            weekly_plan_aligned=is_plan_aligned,
        )
        ranked_candidates.append(candidate)

    # 6. Sort by fit_score descending (tie-break by title for determinism)
    ranked_candidates.sort(key=lambda c: (c.fit_score, c.content.title), reverse=True)

    primary = ranked_candidates[0]
    alternatives = ranked_candidates[1:4]

    # 7. Build Categorized Sections for "My Practice" page
    # Categories: "practice_now", "review", "keep_going", "try_something_new"
    practice_now_items = [c for c in ranked_candidates if c.content.skill == target_skill][:3]
    review_items = [
        c for c in ranked_candidates
        if c.content.skill in goal_skills and c.content.id != primary.content.id
    ][:3]
    if not review_items:
        review_items = ranked_candidates[2:5]

    keep_going_items = [
        c for c in ranked_candidates
        if c.content.category in ("Reading", "Stories") and c.content.id != primary.content.id
    ][:3]
    if not keep_going_items:
        keep_going_items = ranked_candidates[1:4]

    try_new_items = [
        c for c in ranked_candidates
        if c.repetition_count == 0 and c.content.id != primary.content.id
    ][:3]
    if not try_new_items:
        try_new_items = ranked_candidates[3:6]

    categories = [
        PersonalizedCategorySection(
            category_id="practice_now",
            title="Practice Now 🎯",
            subtitle="Targeted activities matching your current focus skill.",
            icon="🎯",
            items=practice_now_items,
        ),
        PersonalizedCategorySection(
            category_id="review",
            title="Review & Memory Refresh 🔄",
            subtitle="Spaced review practice to keep earlier skills strong.",
            icon="🔄",
            items=review_items,
        ),
        PersonalizedCategorySection(
            category_id="keep_going",
            title="Keep Going 🚀",
            subtitle="Step forward with engaging reading adventures.",
            icon="🚀",
            items=keep_going_items,
        ),
        PersonalizedCategorySection(
            category_id="try_something_new",
            title="Try Something New ✨",
            subtitle="Fresh formats and games you haven't played recently.",
            icon="✨",
            items=try_new_items,
        ),
    ]

    mode_explanations = {
        "NEW_LEARNING": f"Starting fresh with {primary.content.title} at an introductory level.",
        "REINFORCEMENT": f"Reinforcing {target_skill.replace('_', ' ')} with targeted {primary.content.title}.",
        "REVIEW": f"Refreshing memory with {primary.content.title}.",
        "SPACED_REVIEW": f"Spaced practice review with {primary.content.title} to maintain mastery.",
        "CHALLENGE": f"Ready for a rewarding next step with {primary.content.title}.",
        "EASIER_PRACTICE": f"Building confidence through comfortable practice with {primary.content.title}.",
        "EXPLORATION": f"Exploring exciting literacy adventures with {primary.content.title}.",
    }
    explanation_text = mode_explanations.get(
        learning_mode,
        f"Personalized practice with {primary.content.title} selected for your learning journey."
    )

    return PersonalizedContentResponse(
        child_id=student_id,
        learning_mode=learning_mode,
        target_skill=target_skill,
        adaptive_difficulty=adaptive_diff,
        adaptive_difficulty_label=DIFFICULTY_LABELS.get(adaptive_diff, "Easy"),
        primary=primary,
        alternatives=alternatives,
        categories=categories,
        explanation=explanation_text,
        language=preferred_lang,
        disclaimer=DISCLAIMER,
    )
