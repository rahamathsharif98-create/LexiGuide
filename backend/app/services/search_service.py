import re
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import Activity, Story, User, LearningSession
from app.services.fingerprint_service import get_latest_fingerprint, SKILL_KEYS, DEFAULT_FINGERPRINT
from app.utils.authorization import assert_can_access_child
from app.utils.language import contains_forbidden_language

CATALOG_STATIC_RESOURCES = [
    {
        "id": "act-read-with-me",
        "title": "Read With Me",
        "type": "activity",
        "category": "Reading",
        "difficulty": "Medium",
        "route": "/child/read",
        "icon": "📖",
        "description": "Read aloud with real-time word tracking and feedback.",
        "skill": "reading_fluency",
        "tags": ["reading", "read", "fluency", "read aloud", "words", "speech", "passage"],
    },
    {
        "id": "act-speak-and-shine",
        "title": "Speak & Shine",
        "type": "activity",
        "category": "Speaking",
        "difficulty": "Easy",
        "route": "/child/speak",
        "icon": "🎤",
        "description": "Speak clear target words and practice your pronunciation.",
        "skill": "pronunciation",
        "tags": ["speak", "speech", "pronunciation", "talk", "words", "microphone", "voice"],
    },
    {
        "id": "act-sound-safari",
        "title": "Sound Safari",
        "type": "activity",
        "category": "Sounds",
        "difficulty": "Easy",
        "route": "/child/games/match-sound",
        "icon": "🦁",
        "description": "Listen to a wild animal sound and match the starting phoneme.",
        "skill": "phonological_awareness",
        "tags": ["sounds", "phonics", "safari", "animal", "lion", "phoneme", "listening"],
    },
    {
        "id": "act-word-builder",
        "title": "Word Builder",
        "type": "activity",
        "category": "Games",
        "difficulty": "Medium",
        "route": "/child/games/build-word",
        "icon": "🧩",
        "description": "Rearrange spelling blocks to build target words.",
        "skill": "word_recognition",
        "tags": ["puzzle", "builder", "spelling", "word", "letters", "anagram", "phonics"],
    },
    {
        "id": "act-letter-detective",
        "title": "Letter Detective",
        "type": "activity",
        "category": "Sounds",
        "difficulty": "Medium",
        "route": "/child/games/find-sound",
        "icon": "🔍",
        "description": "Hunt for mystery letters and hidden phonemes.",
        "skill": "phonological_awareness",
        "tags": ["detective", "search", "letter", "sound", "mystery", "phonics", "investigate"],
    },
    {
        "id": "act-picture-match",
        "title": "Picture Match",
        "type": "activity",
        "category": "Games",
        "difficulty": "Easy",
        "route": "/child/games/picture-word",
        "icon": "🖼️",
        "description": "Connect vibrant pictures with their matching written words.",
        "skill": "word_recognition",
        "tags": ["picture", "match", "cards", "sight words", "memory", "reading"],
    },
    {
        "id": "story-forest",
        "title": "The Curious Fox",
        "type": "story",
        "category": "Stories",
        "difficulty": "Easy",
        "route": "/child/stories/story-forest",
        "icon": "🦊",
        "description": "Sam the fox explores the green forest and finds a sparkling stone.",
        "skill": "comprehension",
        "tags": ["fox", "forest", "nature", "sam", "stone", "story", "animals", "animal"],
    },
    {
        "id": "story-space",
        "title": "A Trip to the Moon",
        "type": "story",
        "category": "Stories",
        "difficulty": "Medium",
        "route": "/child/stories/story-space",
        "icon": "🚀",
        "description": "Priya builds a cardboard rocket and travels past the stars.",
        "skill": "comprehension",
        "tags": ["space", "moon", "rocket", "stars", "priya", "dream", "adventure"],
    },
    {
        "id": "story-garden",
        "title": "The Tiny Seed",
        "type": "story",
        "category": "Stories",
        "difficulty": "Easy",
        "route": "/child/stories/story-garden",
        "icon": "🌱",
        "description": "A little seed receives rain and blossoms into a yellow flower.",
        "skill": "comprehension",
        "tags": ["seed", "garden", "flower", "rain", "nature", "yellow", "plant"],
    },
    {
        "id": "story-ocean",
        "title": "The Lost Starfish",
        "type": "story",
        "category": "Stories",
        "difficulty": "Easy",
        "route": "/child/stories/story-ocean",
        "icon": "⭐",
        "description": "Stella the starfish explores coral reefs with a helpful turtle.",
        "skill": "comprehension",
        "tags": ["ocean", "sea", "starfish", "stella", "turtle", "water", "reef", "animals", "animal"],
    },
    {
        "id": "story-farm",
        "title": "Bella the Baking Bear",
        "type": "story",
        "category": "Stories",
        "difficulty": "Medium",
        "route": "/child/stories/story-farm",
        "icon": "🐻",
        "description": "Bella bakes a golden honey cake for a forest gathering.",
        "skill": "comprehension",
        "tags": ["bear", "cake", "baking", "honey", "party", "forest", "bella", "animals", "animal"],
    },
    {
        "id": "passage-pet-cat",
        "title": "My Pet Cat",
        "type": "passage",
        "category": "Reading",
        "difficulty": "Easy",
        "route": "/child/read",
        "icon": "🐱",
        "description": "Read about a cute, playful cat chasing a red ball.",
        "skill": "reading_fluency",
        "tags": ["cat", "pet", "ball", "play", "kitten", "easy reading", "animals", "animal"],
    },
    {
        "id": "passage-rainy-day",
        "title": "The Rainy Day",
        "type": "passage",
        "category": "Reading",
        "difficulty": "Easy",
        "route": "/child/read",
        "icon": "🌧️",
        "description": "Staying indoors on a rainy afternoon with cozy books.",
        "skill": "reading_fluency",
        "tags": ["rain", "rainy", "books", "indoor", "weather", "reading"],
    },
    {
        "id": "passage-big-race",
        "title": "The Big Race",
        "type": "passage",
        "category": "Reading",
        "difficulty": "Medium",
        "route": "/child/read",
        "icon": "🐢",
        "description": "The determined turtle and the speedy rabbit compete in a race.",
        "skill": "reading_fluency",
        "tags": ["turtle", "rabbit", "race", "run", "fast", "slow", "fable", "animals", "animal"],
    },
    # Vocabulary items for Speaking & Pronunciation
    {
        "id": "word-sun",
        "title": "Sun (Pronunciation)",
        "type": "word",
        "category": "Speaking",
        "difficulty": "Easy",
        "route": "/child/speak",
        "icon": "☀️",
        "description": "Practice the initial 's' sound in Sun.",
        "skill": "pronunciation",
        "tags": ["sun", "speaking", "pronunciation", "sound", "voice", "letter s"],
    },
    {
        "id": "word-ship",
        "title": "Ship (Pronunciation)",
        "type": "word",
        "category": "Speaking",
        "difficulty": "Easy",
        "route": "/child/speak",
        "icon": "🚢",
        "description": "Practice the tricky 'sh' phoneme blend in Ship.",
        "skill": "pronunciation",
        "tags": ["ship", "speaking", "pronunciation", "sh", "sound", "boat"],
    },
    {
        "id": "word-star",
        "title": "Star (Pronunciation)",
        "type": "word",
        "category": "Speaking",
        "difficulty": "Easy",
        "route": "/child/speak",
        "icon": "⭐",
        "description": "Practice initial consonant blend 'st' in Star.",
        "skill": "pronunciation",
        "tags": ["star", "speaking", "pronunciation", "st", "space", "sky"],
    },
]

SUGGESTED_TOPICS = [
    "🦁 Animals",
    "🚀 Space",
    "📖 Stories",
    "🦁 Phonics",
    "🧩 Puzzles",
    "🎤 Speaking",
]

# Map level 1-4 to standard difficulty labels
LEVEL_DIFFICULTY_MAP = {
    "1": "easy",
    "2": "easy",
    "3": "medium",
    "4": "hard",
}


def search_learning_resources(
    db: Session,
    query: str = "",
    skill: str | None = None,
    difficulty: str | None = None,
    child_id: int | None = None,
    current_user: User | None = None,
) -> dict:
    q = (query or "").strip().lower()
    skill_filter = skill.lower().strip() if skill else None

    # Support difficulty normalization (e.g. "Level 1" or "1" -> "easy")
    diff_filter = difficulty.lower().strip() if difficulty else None
    if diff_filter and diff_filter in LEVEL_DIFFICULTY_MAP:
        diff_filter = LEVEL_DIFFICULTY_MAP[diff_filter]
    elif diff_filter and diff_filter.startswith("level "):
        lvl = diff_filter.replace("level ", "").strip()
        diff_filter = LEVEL_DIFFICULTY_MAP.get(lvl, diff_filter)

    # If child_id is requested, enforce security authorization if a user is logged in
    weakest_skill = None
    focus_skill = None
    if child_id:
        if current_user:
            assert_can_access_child(db, current_user, child_id)
        fp = get_latest_fingerprint(db, child_id)
        if fp:
            levels = {k: getattr(fp, k) for k in SKILL_KEYS}
            weakest_skill = min(levels, key=levels.get)
            focus_skill = weakest_skill

    results = []
    # Strip special regex chars for safety
    safe_q = re.sub(r"[^\w\s]", " ", q)
    tokens = [t for t in safe_q.split() if t]

    # For default catalog view (empty query), preserve canonical CATALOG_STATIC_RESOURCES
    # When search keyword tokens are present, search combined catalog (including Step 18 items)
    if not tokens:
        search_catalog = CATALOG_STATIC_RESOURCES
    else:
        from app.content.service import content_service
        seen_ids = set()
        search_catalog = []
        for item in CATALOG_STATIC_RESOURCES:
            seen_ids.add(item["id"])
            search_catalog.append(item)
        for item in content_service.get_all_searchable_items():
            if item["id"] not in seen_ids:
                seen_ids.add(item["id"])
                search_catalog.append(item)

    for item in search_catalog:
        # 1. Skill filter
        item_skill = item.get("skill") or ""
        if skill_filter and skill_filter not in item_skill and item_skill not in skill_filter:
            continue

        # 2. Difficulty filter
        if diff_filter and diff_filter != item["difficulty"].lower():
            continue

        # 3. Text relevance matching (exact match prioritized)
        score = 0.0
        title_lower = item["title"].lower()
        desc_lower = (item.get("description") or "").lower()
        tags = [t.lower() for t in item.get("tags", [])]

        if not tokens:
            score = 1.0  # Default catalog view
        else:
            if safe_q == title_lower:
                score += 15.0  # Exact full title match
            elif safe_q in title_lower:
                score += 10.0  # Full query substring in title

            for token in tokens:
                if token == title_lower:
                    score += 8.0
                elif token in title_lower:
                    score += 5.0
                elif any(token == t for t in tags):
                    score += 4.0
                elif any(token in t for t in tags):
                    score += 3.0
                elif token in desc_lower:
                    score += 2.0
                elif token in item_skill:
                    score += 2.0

        if tokens and score <= 0.0:
            continue

        # 4. Adaptive learner boost (Step 17 Personalized Search integration)
        fit_reason = None
        if focus_skill and item_skill == focus_skill:
            score += 4.5
            readable_skill = focus_skill.replace("_", " ")
            if focus_skill == "word_recognition":
                fit_reason = "Great for practicing word recognition."
            elif focus_skill == "reading_fluency":
                fit_reason = "Good practice for reading fluency."
            elif focus_skill == "pronunciation":
                fit_reason = "Helps practice target pronunciation sounds."
            elif focus_skill == "phonological_awareness":
                fit_reason = "Matched to your sound awareness practice."
            else:
                fit_reason = f"Matched to your current {readable_skill} practice."

        results.append({
            "id": item["id"],
            "title": item["title"],
            "type": item["type"],
            "category": item["category"],
            "difficulty": item["difficulty"],
            "route": item["route"],
            "icon": item["icon"],
            "description": item.get("description"),
            "skill": item.get("skill"),
            "relevance_score": round(score, 2),
            "fit_reason": fit_reason,
        })

    # Sort descending by relevance score, tie-break by title
    results.sort(key=lambda r: (r["relevance_score"], r["title"]), reverse=True)

    return {
        "query": query,
        "total_results": len(results),
        "results": results,
        "suggested_filters": SUGGESTED_TOPICS,
    }
