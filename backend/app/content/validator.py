"""Educational and safety validation engine for LexiGuide Content System."""
import re
from typing import List, Optional
from pydantic import BaseModel

from app.content.base import ContentItemModel, SUPPORTED_SKILLS, SUPPORTED_LANGUAGES
from app.utils.language import contains_forbidden_language

INAPPROPRIATE_WORDS = [
    "blood",
    "die",
    "death",
    "kill",
    "killing",
    "knife",
    "gun",
    "weapon",
    "fight",
    "violence",
    "monster",
    "scary",
    "demon",
    "hurt",
    "pain",
    "danger",
    "terror",
]


class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = []


def validate_content_item(item: ContentItemModel) -> ValidationResult:
    errors: List[str] = []

    # 1. Required fields check
    if not item.id or not item.id.strip():
        errors.append("Content item missing ID.")
    if not item.title or not item.title.strip():
        errors.append("Content item missing title.")
    if not item.description or not item.description.strip():
        errors.append("Content item missing description.")
    if not item.learning_objective or not item.learning_objective.strip():
        errors.append("Content item missing learning objective.")

    # 2. Canonical Skill check
    if item.skill not in SUPPORTED_SKILLS:
        errors.append(f"Skill '{item.skill}' is not a canonical skill.")

    # 3. Difficulty bounds
    if not (1 <= item.difficulty <= 4):
        errors.append(f"Difficulty {item.difficulty} is out of valid bounds [1, 4].")

    # 4. Age suitability bounds
    if item.age_min < 4 or item.age_max > 10 or item.age_min > item.age_max:
        errors.append(f"Age range [{item.age_min}, {item.age_max}] is out of supported child range [4, 10].")

    # 5. Language check
    if item.language not in SUPPORTED_LANGUAGES:
        errors.append(f"Language '{item.language}' is not supported.")

    # 6. Safety & Non-clinical Language check
    full_text = f"{item.title} {item.description} {item.learning_objective} "
    if item.passage:
        if isinstance(item.passage, list):
            full_text += " ".join(item.passage) + " "
        else:
            full_text += str(item.passage) + " "
    if item.expected_text:
        full_text += str(item.expected_text) + " "
    if item.vocabulary_words:
        full_text += " ".join(item.vocabulary_words) + " "

    lower_text = full_text.lower()

    FORBIDDEN_CLINICAL_WORDS = [
        "dyslexia",
        "disorder",
        "deficit",
        "abnormal",
        "pathology",
        "pathological",
        "retarded",
        "medical diagnosis",
        "clinical diagnosis",
        "learning disability",
    ]

    if contains_forbidden_language(full_text) or any(re.search(rf"\b{re.escape(w)}\b", lower_text) for w in FORBIDDEN_CLINICAL_WORDS):
        errors.append("Content contains forbidden clinical or diagnostic terminology.")

    for bad_word in INAPPROPRIATE_WORDS:
        # Match whole word
        if re.search(rf"\b{re.escape(bad_word)}\b", lower_text):
            errors.append(f"Content contains inappropriate or frightening theme: '{bad_word}'.")

    # 7. Passage length validation (for reading & stories)
    if item.content_type in ("reading", "story"):
        if not item.passage:
            errors.append(f"Content type '{item.content_type}' requires a passage.")
        else:
            passage_str = " ".join(item.passage) if isinstance(item.passage, list) else str(item.passage)
            word_count = len(passage_str.split())
            if word_count < 8:
                errors.append(f"Passage too short ({word_count} words). Minimum is 8 words.")
            elif word_count > 250:
                errors.append(f"Passage too long ({word_count} words). Maximum is 250 words for young learners.")

    # 8. Comprehension Consistency Check
    if item.questions:
        passage_str = ""
        if item.passage:
            passage_str = (" ".join(item.passage) if isinstance(item.passage, list) else str(item.passage)).lower()

        for idx, q in enumerate(item.questions):
            if not q.q or not q.q.strip():
                errors.append(f"Question {idx + 1} has empty question text.")
            if len(q.options) < 2:
                errors.append(f"Question {idx + 1} must have at least 2 selectable options.")
            
            opt_texts = [o.text.strip().lower() for o in q.options]
            ans_clean = q.answer.strip().lower()

            # Answer must be in options
            if ans_clean not in opt_texts:
                errors.append(f"Question {idx + 1} answer '{q.answer}' is not among option choices.")

            # Answer or key tokens must be substantiated in passage if passage is present
            if passage_str:
                ans_tokens = [tok for tok in re.findall(r"\w+", ans_clean) if len(tok) > 2]
                if ans_tokens and not any(tok in passage_str for tok in ans_tokens):
                    errors.append(
                        f"Question {idx + 1} answer '{q.answer}' is not supported by passage evidence."
                    )

    # 9. Speaking / Vocabulary Check
    if item.content_type in ("speaking", "vocabulary", "spelling", "sound"):
        if not item.vocabulary_words and not item.expected_text and not item.passage:
            errors.append(f"Content type '{item.content_type}' requires vocabulary_words or passage.")

    return ValidationResult(is_valid=len(errors) == 0, errors=errors)
