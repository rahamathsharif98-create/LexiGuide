"""Non-diagnostic language guardrails.

Every observation/recommendation surfaced by this API must be educational,
never diagnostic. This module is the single place that maps technical
observation types to safe, friendly phrasing — mirroring the frontend's
own approach (src/services/mockAiService.js's FRIENDLY_OBSERVATION map and
the disclaimer text used throughout the Parent/Teacher portals).
"""

FRIENDLY_OBSERVATION = {
    "omission": "May benefit from practice reading every word carefully.",
    "substitution": "May benefit from practice looking closely at each word.",
    "repetition": "May benefit from practice reading smoothly, one word at a time.",
    "hesitation": "Learning support recommended for building reading confidence.",
    "sound_difficulty": "Observed reading pattern: may benefit from additional sound-awareness practice.",
    "fluency_difficulty": "Observed reading pattern: may benefit from additional guided reading practice.",
}

DISCLAIMER = (
    "This is an educational screening tool. It provides learning observations "
    "and practice suggestions — it does not provide a clinical diagnosis."
)

# Terms that must never appear in any API response body. Used by tests and
# can be used defensively in response construction.
FORBIDDEN_PHRASES = [
    "has dyslexia",
    "diagnosed with dyslexia",
    "confirmed dyslexia",
    "medical diagnosis",
    "learning disability confirmed",
]


def friendly_text_for(observation_type: str) -> str:
    return FRIENDLY_OBSERVATION.get(observation_type, "Observed learning pattern — an area to practice together.")


def contains_forbidden_language(text: str) -> bool:
    lowered = text.lower()
    return any(phrase in lowered for phrase in FORBIDDEN_PHRASES)
