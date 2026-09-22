"""Phoneme Analysis Interface & Status.

Step 8 Architectural Requirement (§8):
Acoustic forced-alignment and grapheme-to-phoneme (G2P) phoneme scoring
are NOT implemented in this system. This module establishes the formal
service boundary, making the NOT AVAILABLE status explicit so that
callers and downstream UI never invent, fabricate, or simulate phoneme
accuracy scores.
"""
from abc import ABC, abstractmethod


class PhonemeAnalysisService(ABC):
    "Abstract interface for phoneme-level acoustic pronunciation analysis."

    @property
    @abstractmethod
    def is_available(self) -> bool:
        "Whether a real acoustic phoneme alignment model is operational."
        raise NotImplementedError

    @abstractmethod
    def analyze_phonemes(self, expected_text: str, audio_bytes: bytes) -> dict:
        """Perform phoneme-level segmentation, alignment, and scoring.
        Must raise NotImplementedError if not available.
        """
        raise NotImplementedError


class UnavailablePhonemeAnalysisService(PhonemeAnalysisService):
    """Explicitly unavailable phoneme analysis service."""

    @property
    def is_available(self) -> bool:
        return False

    def analyze_phonemes(self, expected_text: str, audio_bytes: bytes) -> dict:
        return {
            "phoneme_analysis_available": False,
            "status": "not_implemented",
            "phonemes": [],
            "message": "Phoneme-level acoustic pronunciation analysis is not available in this environment.",
        }


def get_phoneme_analysis_service() -> PhonemeAnalysisService:
    return UnavailablePhonemeAnalysisService()
