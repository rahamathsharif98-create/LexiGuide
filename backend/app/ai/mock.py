"""MOCK speech/reading analysis. Phase 8 Step 2: now uses the same
word-alignment algorithm (app/ai/alignment.py) as RealAIAnalysisService, so
"mock" only ever means "the recognized_text didn't come from real audio
transcription" — the error-detection logic itself is identical between
mock and real, and the two are not compared against different standards.

Still NOT real speech recognition or acoustic analysis: there is no audio
processing in this class. In the audio-upload flow (POST
/api/reading/session-audio), recognized_text comes from a
SpeechToTextService (mock or real, selected independently via AI_MODE) —
this class only ever compares two strings. Every response is labeled
`is_mock: True`, and the frontend must never present it as validated or
diagnostic.
"""
import random

from app.ai.base import AIAnalysisService
from app.ai.alignment import analyze_reading


class MockAIAnalysisService(AIAnalysisService):
    @property
    def ai_mode(self) -> str:
        return "mock"

    def analyze_speech(self, expected_text: str, recognized_text: str) -> dict:
        result = analyze_reading(expected_text, recognized_text)
        accuracy = result["accuracy"]

        # Hesitations aren't derivable from text alone (that needs real
        # audio timing) — simulated here with a small random count,
        # clearly labeled as such rather than presented as measured.
        hesitations = random.randint(0, 2) if accuracy < 90 else 0

        pronunciation_score = max(5.0, min(98.0, accuracy - result["substitutions"] * 3))
        fluency_score = max(5.0, min(98.0, accuracy - hesitations * 5 - result["repetitions"] * 4))

        return {
            "ai_mode": "mock",
            "is_mock": True,
            "analysis_available": True,
            "words_attempted": result["words_attempted"],
            "words_recognized": result["words_recognized"],
            "words_correct": result["words_correct"],
            "omissions": result["omissions"],
            "substitutions": result["substitutions"],
            "insertions": result["insertions"],
            "repetitions": result["repetitions"],
            "hesitations": hesitations,
            "hesitations_available": False,  # simulated, not measured — see docstring
            "accuracy": accuracy,
            "word_order_mismatch": result["word_order_mismatch"],
            "error_words": result["error_words"],
            "pronunciation_score": round(pronunciation_score, 1),
            "fluency_score": round(fluency_score, 1),
            "comprehension_score": None,  # not derivable from a read-aloud comparison
            "pronunciation_analysis_available": False,  # no phoneme-level analysis in this service
            "phoneme_analysis_available": False,  # acoustic forced-alignment not available
            "disclaimer": "This is a mock/demo text-comparison analysis, not real speech recognition or a clinical assessment.",
        }
