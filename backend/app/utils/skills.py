"""Single source of truth for translating the frontend's camelCase skill
identifiers (as stored on LearningSession.skill, e.g. "wordRecognition")
into the snake_case keys used by ReadingFingerprint / recommendation_service
(e.g. "word_recognition").

This does NOT redefine the list of skills or their thresholds/labels —
those already live in app.services.fingerprint_service (SKILL_KEYS,
DEFAULT_FINGERPRINT) and app.services.recommendation_service (THRESHOLDS,
ACTIVITY_MAP, LABEL). This module only adds the camelCase<->snake_case
translation that Phase 9's adaptive-learning engine needs to read
per-session history (LearningSession.skill) using the same vocabulary the
rest of the app already uses.
"""

# LearningSession.skill (camelCase, matches the frontend) -> fingerprint
# column name (snake_case). Mirrors the equivalent inline mapping already
# used for "game" outcomes in fingerprint_service.record_fingerprint_update.
# Canonical mappings from all educational game and activity skills
# to the 5 core literacy pillars in ReadingFingerprint (snake_case).
SKILL_NORMALIZATION_MAP = {
    # 1. Phonological Awareness
    "phonologicalAwareness": "phonological_awareness",
    "phonological_awareness": "phonological_awareness",
    "auditoryPhonicsDiscrimination": "phonological_awareness",
    "phonicsDiscrimination": "phonological_awareness",
    "rhymeDiscrimination": "phonological_awareness",
    "rhymeMatch": "phonological_awareness",
    "rhyme": "phonological_awareness",
    "onsetRimeBlending": "phonological_awareness",
    "soundDifferentiation": "phonological_awareness",
    "phonemeTargetArchery": "phonological_awareness",
    "soundSafari": "phonological_awareness",
    "matchSound": "phonological_awareness",
    "findSound": "phonological_awareness",
    "soundHunt": "phonological_awareness",

    # 2. Word Recognition
    "wordRecognition": "word_recognition",
    "word_recognition": "word_recognition",
    "wordSpellingConstruction": "word_recognition",
    "sightWordRecognition": "word_recognition",
    "syllableStacking": "word_recognition",
    "letterSequencing": "word_recognition",
    "phonicsWordCompletion": "word_recognition",
    "phonicsDecodingIncantation": "word_recognition",
    "letterTracing": "word_recognition",
    "letterRecognition": "word_recognition",
    "missingLetter": "word_recognition",
    "spelling": "word_recognition",
    "vocabulary": "word_recognition",
    "wordBuilder": "word_recognition",
    "rimeBlending": "word_recognition",
    "spiderWebWeaving": "word_recognition",
    "webWeavingConstruction": "word_recognition",

    # 3. Reading Fluency
    "readingFluency": "reading_fluency",
    "reading_fluency": "reading_fluency",
    "rhythmTiming": "reading_fluency",
    "soundRhythm": "reading_fluency",
    "fluency": "reading_fluency",
    "readWithMe": "reading_fluency",

    # 4. Pronunciation
    "pronunciation": "pronunciation",
    "speech": "pronunciation",
    "speaking": "pronunciation",
    "traceAndSpeak": "pronunciation",
    "articulation": "pronunciation",
    "speakPlay": "pronunciation",

    # 5. Comprehension
    "comprehension": "comprehension",
    "storyPuzzle": "comprehension",
    "story_puzzle": "comprehension",
    "story": "comprehension",
    "readingComprehension": "comprehension",
    "storyReader": "comprehension",
}

CAMEL_TO_SNAKE = SKILL_NORMALIZATION_MAP

CORE_SNAKE_TO_CAMEL = {
    "phonological_awareness": "phonologicalAwareness",
    "pronunciation": "pronunciation",
    "word_recognition": "wordRecognition",
    "reading_fluency": "readingFluency",
    "comprehension": "comprehension",
}

SNAKE_TO_CAMEL = CORE_SNAKE_TO_CAMEL

# Which snake_case skills a session contributes evidence toward when the
# session has no explicit `skill` set but does have an outcome `type`.
OUTCOME_TYPE_SKILLS = {
    "reading": ["pronunciation", "reading_fluency", "word_recognition"],
    "story": ["comprehension"],
}


def normalize_skill(skill: str | None) -> str | None:
    """Return the canonical snake_case literacy pillar for any activity or game skill."""
    if not skill:
        return None
    if skill in SKILL_NORMALIZATION_MAP:
        return SKILL_NORMALIZATION_MAP[skill]
    # Check lowercase / trimmed variations
    clean = skill.strip()
    return SKILL_NORMALIZATION_MAP.get(clean)


def skill_key_from_session(skill: str | None, outcome_type: str | None) -> list[str]:
    """Given a LearningSession's `skill` and outcome `type`, return the list
    of snake_case fingerprint skill keys this session provides evidence
    for. Never guesses beyond what fingerprint_service already infers.
    """
    if skill:
        norm = normalize_skill(skill)
        if norm:
            return [norm]
    if outcome_type:
        return OUTCOME_TYPE_SKILLS.get(outcome_type, [])
    return []

