from fastapi import APIRouter
from pydantic import BaseModel, Field
import importlib.util
import shutil

from app.config import settings

router = APIRouter(prefix="/api/voice", tags=["voice"])


class PronunciationEvalRequest(BaseModel):
    target_text: str = Field(..., description="Expected letter or word")
    spoken_text: str = Field(..., description="Speech-recognized text")
    language: str = Field("te", description="Language code: te, hi, en")


class PronunciationEvalResponse(BaseModel):
    target_text: str
    spoken_text: str
    language: str
    accuracy_score: float
    is_match: bool
    feedback: str
    pipeline_mode: str


def _levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return _levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


@router.get("/status")
def voice_pipeline_status():
    """Honest reporting of multilingual voice pipeline capabilities.
    Distinguishes browser synthesis/recognition fallback from backend neural models.
    """
    whisper_installed = importlib.util.find_spec("whisper") is not None
    ffmpeg_available = shutil.which("ffmpeg") is not None

    return {
        "pipeline_mode": "backend_neural" if (settings.AI_MODE == "real" and whisper_installed) else "browser_native",
        "supported_languages": ["te", "hi", "en"],
        "languages": {
            "te": {
                "name": "Telugu",
                "native_name": "తెలుగు",
                "flag": "🇮🇳",
                "default_locale": "te-IN",
                "primary_script": "Telugu",
                "vowels_count": 16,
                "consonants_count": 36,
            },
            "hi": {
                "name": "Hindi",
                "native_name": "हिन्दी",
                "flag": "🇮🇳",
                "default_locale": "hi-IN",
                "primary_script": "Devanagari",
                "vowels_count": 13,
                "consonants_count": 33,
            },
            "en": {
                "name": "English",
                "native_name": "English",
                "flag": "🇬🇧",
                "default_locale": "en-US",
                "primary_script": "Latin",
                "phonemes_count": 44,
            },
        },
        "whisper_installed": whisper_installed,
        "ffmpeg_available": ffmpeg_available,
        "honest_disclosure": (
            "Voice output uses the browser's Web Speech API SpeechSynthesis with native "
            "Telugu (te-IN) and Hindi (hi-IN) voice packs when present on the host device. "
            "Microphone input uses Web Speech Recognition with phonetic Levenshtein alignment."
        ),
    }


@router.get("/phrases")
def get_multilingual_phrases(language: str = "te"):
    """Returns curated letter sounds, words, and encouraging praise for mother-tongue learning."""
    phrases = {
        "te": {
            "praise": ["చాలా బాగుంది! 🌟", "శభాష్! 👏", "అద్భుతం! 🎉", "మరింత ప్రయత్నించు! 💪"],
            "letters": [
                {"char": "అ", "translit": "a", "example_word": "అమ్మ", "meaning": "Mother"},
                {"char": "ఆ", "translit": "aa", "example_word": "ఆవు", "meaning": "Cow"},
                {"char": "ఇ", "translit": "i", "example_word": "ఇల్లు", "meaning": "House"},
                {"char": "ఈ", "translit": "ee", "example_word": "ఈగ", "meaning": "Fly"},
                {"char": "ఉ", "translit": "u", "example_word": "ఉడుత", "meaning": "Squirrel"},
                {"char": "క", "translit": "ka", "example_word": "కలం", "meaning": "Pen"},
                {"char": "గ", "translit": "ga", "example_word": "గడప", "meaning": "Threshold"},
            ],
        },
        "hi": {
            "praise": ["शाबाश! 🌟", "बहुत अच्छा! 👏", "कमाल कर दिया! 🎉", "बहुत बढ़िया! 💪"],
            "letters": [
                {"char": "अ", "translit": "a", "example_word": "अनार", "meaning": "Pomegranate"},
                {"char": "आ", "translit": "aa", "example_word": "आम", "meaning": "Mango"},
                {"char": "इ", "translit": "i", "example_word": "इमली", "meaning": "Tamarind"},
                {"char": "ई", "translit": "ee", "example_word": "ईख", "meaning": "Sugarcane"},
                {"char": "उ", "translit": "u", "example_word": "उल्लू", "meaning": "Owl"},
                {"char": "क", "translit": "ka", "example_word": "कमल", "meaning": "Lotus"},
                {"char": "ग", "translit": "ga", "example_word": "गमला", "meaning": "Flower pot"},
            ],
        },
        "en": {
            "praise": ["Awesome job! 🌟", "Super star! 👏", "Wonderful! 🎉", "Keep shining! 💪"],
            "letters": [
                {"char": "A", "translit": "a", "example_word": "Apple", "meaning": "Fruit"},
                {"char": "B", "translit": "b", "example_word": "Ball", "meaning": "Toy"},
                {"char": "C", "translit": "c", "example_word": "Cat", "meaning": "Pet"},
                {"char": "D", "translit": "d", "example_word": "Dog", "meaning": "Pet"},
                {"char": "S", "translit": "s", "example_word": "Sun", "meaning": "Star"},
            ],
        },
    }
    return phrases.get(language, phrases["te"])


@router.post("/evaluate-pronunciation", response_model=PronunciationEvalResponse)
def evaluate_pronunciation(payload: PronunciationEvalRequest):
    """Evaluates child speech recognition match against target letter/word.
    Computes Levenshtein similarity with lenient tolerances appropriate for young children.
    """
    target = payload.target_text.strip().lower()
    spoken = payload.spoken_text.strip().lower()

    if not target or not spoken:
        return PronunciationEvalResponse(
            target_text=payload.target_text,
            spoken_text=payload.spoken_text,
            language=payload.language,
            accuracy_score=0.0,
            is_match=False,
            feedback="No speech detected. Please speak clearly into the microphone.",
            pipeline_mode="heuristic_levenshtein",
        )

    if target == spoken or target in spoken or spoken in target:
        score = 100.0
        is_match = True
    else:
        dist = _levenshtein_distance(target, spoken)
        max_len = max(len(target), len(spoken))
        similarity = max(0.0, (1.0 - (dist / max_len))) * 100.0
        score = round(similarity, 1)
        is_match = score >= 65.0

    if is_match:
        praise_options = {
            "te": "చాలా బాగుంది! సరిగ్గా చెప్పారు!",
            "hi": "शाबाश! आपने बिल्कुल सही बोला!",
            "en": "Great job! That sounded spot on!",
        }
        feedback = praise_options.get(payload.language, praise_options["en"])
    else:
        encouragement_options = {
            "te": "మంచి ప్రయత్నం! మళ్ళీ ఒకసారి చెప్పండి.",
            "hi": "अच्छा प्रयास! एक बार फिर से बोलिए.",
            "en": "Good try! Let's say it one more time together.",
        }
        feedback = encouragement_options.get(payload.language, encouragement_options["en"])

    return PronunciationEvalResponse(
        target_text=payload.target_text,
        spoken_text=payload.spoken_text,
        language=payload.language,
        accuracy_score=score,
        is_match=is_match,
        feedback=feedback,
        pipeline_mode="heuristic_levenshtein",
    )
