"""REAL reading-error analysis. Implements the exact same AIAnalysisService
interface as MockAIAnalysisService (see app/ai/base.py) so routers never
change when swapping between them — only which class the AI factory
(app/ai/factory.py) instantiates, controlled by the AI_MODE env var.

This class is "real" in the sense the Phase 7 architecture meant: it's the
implementation meant to sit downstream of a REAL transcription (produced
by RealSpeechToTextService from actual child audio), not a hand-typed
recognized_text. The word-error-detection ALGORITHM itself
(app/ai/alignment.py) is identical to the mock's — alignment is
deterministic text comparison, not something that becomes more "real" by
switching services; what changes is the trustworthiness of the
recognized_text this compares against, and therefore whether the result
is labeled is_mock: False.

Two things this class does NOT do, honestly, per the Phase 8 Step 2 spec:
  - No phoneme-level pronunciation analysis. `pronunciation_score` here is
    still a coarse proxy derived from word-level substitution counts, not
    a phoneme-accuracy measurement. `pronunciation_analysis_available` is
    explicitly False so callers/UI don't overstate it.
  - No hesitation/pause detection. That requires audio timing data
    (e.g. Whisper word-level timestamps) that isn't plumbed into this
    text-only interface. `hesitations` is 0 with
    `hesitations_available: False` rather than a fabricated number.
"""
from app.ai.base import AIAnalysisService
from app.ai.alignment import analyze_reading


class RealAIAnalysisService(AIAnalysisService):
    @property
    def ai_mode(self) -> str:
        return "real"

    def analyze_speech(self, expected_text: str, recognized_text: str) -> dict:
        result = analyze_reading(expected_text, recognized_text)
        accuracy = result["accuracy"]

        pronunciation_score = max(5.0, min(98.0, accuracy - result["substitutions"] * 3))
        fluency_score = max(5.0, min(98.0, accuracy - result["repetitions"] * 4))

        return {
            "ai_mode": "real",
            "is_mock": False,
            "analysis_available": True,
            "words_attempted": result["words_attempted"],
            "words_recognized": result["words_recognized"],
            "words_correct": result["words_correct"],
            "omissions": result["omissions"],
            "substitutions": result["substitutions"],
            "insertions": result["insertions"],
            "repetitions": result["repetitions"],
            "hesitations": 0,
            "hesitations_available": False,  # requires audio pause timing — not implemented in this pass
            "accuracy": accuracy,
            "word_order_mismatch": result["word_order_mismatch"],
            "error_words": result["error_words"],
            "pronunciation_score": round(pronunciation_score, 1),
            "fluency_score": round(fluency_score, 1),
            "comprehension_score": None,  # not derivable from a read-aloud comparison
            "pronunciation_analysis_available": False,  # no phoneme-level model wired in — see docstring
            "phoneme_analysis_available": False,  # acoustic forced-alignment not available
            "disclaimer": "Automated educational reading analysis from real speech-to-text — not a clinical assessment.",
        }
