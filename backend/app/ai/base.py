"""Abstract interface for speech/reading analysis. A REAL implementation
(Whisper STT + Librosa acoustic features, etc.) can later subclass this as
RealAIAnalysisService with the exact same method signature — no caller
needs to change when that happens; only which class gets instantiated in
app/routers/speech.py.
"""
from abc import ABC, abstractmethod


class AIAnalysisService(ABC):
    @property
    @abstractmethod
    def ai_mode(self) -> str:
        """Return the AI mode: 'real' or 'mock'."""
        raise NotImplementedError

    @abstractmethod
    def analyze_speech(self, expected_text: str, recognized_text: str) -> dict:
        """Compare expected vs. recognized text and return a structured
        analysis: words_attempted, words_correct, omissions, substitutions,
        repetitions, hesitations, pronunciation_score, fluency_score,
        comprehension_score (comprehension is not derivable from text
        comparison alone and is left None here — see ai/mock.py for how
        the mock estimates it for now).

        MUST NOT claim or imply a clinical/diagnostic conclusion.
        """
        raise NotImplementedError
