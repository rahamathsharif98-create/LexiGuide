"""Step 19: Multimodal Learning & Child Adaptive Experience Service.

Authoritative multimodal presentation mode and support level determination.
Integrates:
- AdaptiveLearningEngine & SkillProfile
- ReadingFingerprint
- Content catalog (curated & assembled)
- Transparent AI and audio/speech capability declarations
- Gradual support fading mechanics
- Strictly non-clinical, encouraging child-friendly educational language.
"""
import importlib.util
import shutil
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Student
from app.content.service import content_service
from app.content.base import ContentItemModel
from app.services.adaptive_learning_service import AdaptiveLearningEngine, SkillProfile
from app.services.fingerprint_service import get_latest_fingerprint, DEFAULT_FINGERPRINT
from app.schemas.multimodal import (
    LearningPresentationMode,
    PresentationSupportLevel,
    MultimodalScaffolding,
    MultimodalCapabilityStatus,
    MultimodalPresentationResponse,
)
from app.utils.language import DISCLAIMER


class MultimodalService:
    def get_capabilities(self) -> MultimodalCapabilityStatus:
        """Declares transparent multimodal capabilities without fabricating TTS,
        acoustic scores, or phoneme accuracy.
        """
        whisper_installed = importlib.util.find_spec("whisper") is not None
        ffmpeg_available = shutil.which("ffmpeg") is not None

        # Honest Audio/TTS evaluation: No cloud TTS provider or local espeak is guaranteed in local dev
        tts_available = False
        tts_status = "UNAVAILABLE"

        whisper_status = "REAL" if (settings.AI_MODE == "real" and whisper_installed and ffmpeg_available) else "MOCK"

        return MultimodalCapabilityStatus(
            audio_available=tts_available,
            tts_available=tts_available,
            tts_status=tts_status,
            speech_input_available=True,
            whisper_status=whisper_status,
            reading_alignment_available=True,
            visual_support_available=True,
            interactive_activities_available=True,
            content_generation_status="MOCK" if settings.AI_MODE == "mock" else "AVAILABLE",
            multimodal_modes_supported=[m.value for m in LearningPresentationMode],
            support_levels_supported=[s.value for s in PresentationSupportLevel],
        )

    def determine_presentation(
        self,
        db: Session,
        content_id: str,
        child_id: Optional[int] = None,
    ) -> MultimodalPresentationResponse:
        """Deterministically decides available modes, recommended mode, support level,
        and scaffolding based on real learner state and content characteristics.
        """
        # 1. Resolve content item metadata
        content_item: Optional[ContentItemModel] = content_service.get_content_by_id(content_id)
        
        # Fallback metadata if content_id is not in catalog (e.g. legacy activity routes)
        if content_item:
            target_skill = content_item.skill
            content_type = content_item.content_type
            title = content_item.title
        else:
            cid_lower = content_id.lower()
            if "read" in cid_lower or "story" in cid_lower:
                target_skill = "reading_fluency"
                content_type = "reading"
            elif "speak" in cid_lower:
                target_skill = "pronunciation"
                content_type = "speaking"
            elif "sound" in cid_lower or "phon" in cid_lower:
                target_skill = "phonological_awareness"
                content_type = "sound"
            elif "word" in cid_lower or "spell" in cid_lower:
                target_skill = "word_recognition"
                content_type = "spelling"
            elif "game" in cid_lower:
                target_skill = "reading_fluency"
                content_type = "game"
            else:
                target_skill = "reading_fluency"
                content_type = "reading"
            title = content_id.replace("-", " ").title()

        # 2. Determine learner profile and adaptive support level
        support_level = PresentationSupportLevel.GUIDED.value
        support_trajectory = "Baseline guided support active for initial learning step."

        if child_id is not None:
            engine = AdaptiveLearningEngine(db, child_id)
            profile_dict = engine.analyze_learning_profile()
            skill_profile: Optional[SkillProfile] = profile_dict.get(target_skill)

            if skill_profile and skill_profile.attempts > 0:
                pattern = skill_profile.pattern
                recent_perf = skill_profile.recent_performance
                diff = skill_profile.difficulty

                # Gradual support level rules based on real evidence:
                if pattern == "repeatedly_struggling" or (recent_perf is not None and recent_perf < 65):
                    support_level = PresentationSupportLevel.FULL_SUPPORT.value
                    support_trajectory = (
                        "Scaffolding increased: visual cards and guided step-by-step assistance "
                        "activated to support recent practice."
                    )
                elif pattern in ("needs_practice", "inconsistent") or (recent_perf is not None and recent_perf < 80):
                    support_level = PresentationSupportLevel.GUIDED.value
                    support_trajectory = (
                        "Guided support maintained: structured hints and steady pacing "
                        "reinforce confidence."
                    )
                elif pattern in ("improving", "recently_improved") or (recent_perf is not None and recent_perf < 92):
                    support_level = PresentationSupportLevel.INDEPENDENT.value
                    support_trajectory = (
                        "Support fading: transitioning to independent practice as learner shows "
                        "upward progress."
                    )
                elif pattern == "consistently_strong" or (recent_perf is not None and recent_perf >= 92 and diff >= 3):
                    support_level = PresentationSupportLevel.CHALLENGE.value
                    support_trajectory = (
                        "Challenge mode: scaffolding faded and pace brisk to stretch mastery."
                    )
                else:
                    support_level = PresentationSupportLevel.GUIDED.value
                    support_trajectory = (
                        "Guided baseline active: steady support calibrated to current learning progress."
                    )
            else:
                # Cold start: zero recorded sessions
                support_level = PresentationSupportLevel.GUIDED.value
                support_trajectory = (
                    "Initial guided support: introducing new exercises with clear visual prompts."
                )

        # 3. Determine available and recommended presentation modes
        available_modes: List[str] = []
        recommended_mode: str = LearningPresentationMode.READ_ALONG.value
        reason = f"Personalized presentation matched to {title} and {target_skill.replace('_', ' ')}."

        caps = self.get_capabilities()

        if target_skill == "pronunciation" or content_type == "speaking":
            available_modes = [
                LearningPresentationMode.SPEAK.value,
                LearningPresentationMode.VISUAL.value,
            ]
            if caps.audio_available:
                available_modes.append(LearningPresentationMode.AUDIO.value)
            recommended_mode = LearningPresentationMode.SPEAK.value
            reason = "Speaking mode prompts clear spoken responses and builds verbal reading confidence."

        elif target_skill == "phonological_awareness" or content_type in ("sound", "phonics"):
            available_modes = [
                LearningPresentationMode.VISUAL.value,
                LearningPresentationMode.INTERACTIVE.value,
                LearningPresentationMode.GAME.value,
            ]
            if caps.audio_available:
                available_modes.insert(0, LearningPresentationMode.AUDIO.value)
                recommended_mode = LearningPresentationMode.AUDIO.value
            else:
                recommended_mode = LearningPresentationMode.VISUAL.value
            reason = "Visual and sound cues isolate phonemes and letter-sound connections."

        elif target_skill == "word_recognition" or content_type in ("word_activity", "spelling", "vocabulary"):
            available_modes = [
                LearningPresentationMode.VISUAL.value,
                LearningPresentationMode.INTERACTIVE.value,
                LearningPresentationMode.TEXT.value,
            ]
            if caps.audio_available:
                available_modes.append(LearningPresentationMode.AUDIO.value)
            recommended_mode = LearningPresentationMode.INTERACTIVE.value
            reason = "Interactive letter arrangement and word cards build sight word recognition."

        elif content_type in ("game", "comprehension"):
            available_modes = [
                LearningPresentationMode.GAME.value,
                LearningPresentationMode.INTERACTIVE.value,
                LearningPresentationMode.VISUAL.value,
            ]
            recommended_mode = LearningPresentationMode.GAME.value
            reason = "Game-like interaction provides active problem solving and keeps engagement high."

        else:
            # Default Reading / Story flow
            available_modes = [
                LearningPresentationMode.READ_ALONG.value,
                LearningPresentationMode.TEXT.value,
                LearningPresentationMode.VISUAL.value,
            ]
            if caps.audio_available:
                available_modes.append(LearningPresentationMode.AUDIO.value)
            recommended_mode = LearningPresentationMode.READ_ALONG.value
            reason = "Read-along presentation pairs visual text highlighting with real microphone speech recording."

        # 4. Generate concrete scaffolding flags based on support level
        if support_level == PresentationSupportLevel.FULL_SUPPORT.value:
            scaffolds = MultimodalScaffolding(
                show_word_cards=True,
                show_image_cues=True,
                audio_prompt_enabled=caps.audio_available,
                reduced_hints=False,
                guided_step_by_step=True,
                visual_phoneme_cues=True,
                pace="relaxed",
            )
        elif support_level == PresentationSupportLevel.GUIDED.value:
            scaffolds = MultimodalScaffolding(
                show_word_cards=True,
                show_image_cues=True,
                audio_prompt_enabled=False,
                reduced_hints=False,
                guided_step_by_step=True,
                visual_phoneme_cues=False,
                pace="normal",
            )
        elif support_level == PresentationSupportLevel.INDEPENDENT.value:
            scaffolds = MultimodalScaffolding(
                show_word_cards=False,
                show_image_cues=True,
                audio_prompt_enabled=False,
                reduced_hints=True,
                guided_step_by_step=False,
                visual_phoneme_cues=False,
                pace="normal",
            )
        else:  # CHALLENGE
            scaffolds = MultimodalScaffolding(
                show_word_cards=False,
                show_image_cues=False,
                audio_prompt_enabled=False,
                reduced_hints=True,
                guided_step_by_step=False,
                visual_phoneme_cues=False,
                pace="brisk",
            )

        return MultimodalPresentationResponse(
            content_id=content_id,
            child_id=child_id,
            target_skill=target_skill,
            available_modes=available_modes,
            recommended_mode=recommended_mode,
            support_level=support_level,
            support_fading_trajectory=support_trajectory,
            reason=reason,
            scaffolds=scaffolds,
            disclaimer=DISCLAIMER,
        )


multimodal_service = MultimodalService()
