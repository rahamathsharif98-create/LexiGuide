import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2 } from 'lucide-react';
import { audioAtmosphere } from '../../../services/audioAtmosphereService';
import { gameSound } from '../../../services/gameSoundService';
import {
  getSoundMatchDisplayedOptions,
  SOUND_MATCH_STAGES,
  getSoundMatchMilestone,
} from '../engine/soundMatchCurriculum';

/**
 * SoundMatchRound
 *
 * Renders an active Sound Match round:
 * - Prominent, accessible audio playback button for the target spoken word.
 * - Auto-plays voice prompt on mount (unless quiet mode is enabled).
 * - High-contrast spoken word display.
 * - Responsive 3-option visual picture cards with tactile press feedback.
 * - Synchronous ref guards and disabled state to prevent duplicate answers or points from rapid clicking.
 */
export default function SoundMatchRound({ round, roundIdx = 0, onAnswer, isTransitioning = false }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const isSubmittedRef = useRef(false);
  const prevRoundRef = useRef(round?.id ?? roundIdx);

  // Synchronously reset submission lock whenever round changes
  if (prevRoundRef.current !== (round?.id ?? roundIdx)) {
    prevRoundRef.current = round?.id ?? roundIdx;
    isSubmittedRef.current = false;
    setSelectedOption(null);
  }

  // Reset state when transitioning ends
  useEffect(() => {
    if (!isTransitioning) {
      isSubmittedRef.current = false;
      setSelectedOption(null);
    }
  }, [isTransitioning]);

  // Audio playback handler
  const handlePlayAudio = (e) => {
    if (e) e.stopPropagation();
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);

    try {
      audioAtmosphere?.playChime?.(540, 0.1);
    } catch {
      /* audio error handled */
    }

    const wordToSpeak = round?.spoken || round?.word || '';
    const textToSpeak = `${wordToSpeak}. Find the picture for ${wordToSpeak}.`;

    try {
      gameSound?.speakCompanion?.(textToSpeak, {
        rate: 0.84,
        pitch: 1.05,
        onEnd: () => setIsPlayingAudio(false),
      });
    } catch {
      /* speech error handled */
    }

    // Safety fallback timer to clear active state in tests or non-speech browsers
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 1200);
  };

  // Auto-play on initial round mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!audioAtmosphere?.quietMode && gameSound?.soundMode === 'voice_and_sfx') {
        const wordToSpeak = round?.spoken || round?.word || '';
        try {
          gameSound?.speakCompanion?.(wordToSpeak, {
            rate: 0.85,
            pitch: 1.05,
            onEnd: () => setIsPlayingAudio(false),
          });
        } catch {
          /* handled */
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      gameSound?.stopSpeech?.();
    };
  }, [round?.id, round?.word]);

  const handleSelectOption = (opt) => {
    if (isSubmittedRef.current || isTransitioning) return;
    isSubmittedRef.current = true;
    setSelectedOption(opt);

    try {
      audioAtmosphere?.playChime?.(640, 0.08);
    } catch {
      /* chime error handled */
    }

    const isCorrect = opt === round?.correct;
    onAnswer?.(isCorrect);
  };

  // Shuffled displayed options: perfectly balanced across positions 0, 1, 2 across 100 levels.
  // Memoized so order is 100% stable during answering, audio playback, clicks, and re-renders.
  const displayedOptions = useMemo(() => {
    return getSoundMatchDisplayedOptions(round);
  }, [
    round?.id,
    round?.level,
    round?.word,
    round?.correct,
    round?.options,
    round?.shuffledOptions,
    round?.disableShuffle,
  ]);

  const stageNum = round?.stage ?? Math.floor(roundIdx / 10) + 1;
  const currentStageConfig = SOUND_MATCH_STAGES.find((s) => s.stage === stageNum) || {
    stage: stageNum,
    title: `Stage ${stageNum}`,
    icon: '🎧',
  };
  const currentLevelNum = round?.level ?? roundIdx + 1;
  const milestone = getSoundMatchMilestone(currentLevelNum);

  return (
    <div className="text-center w-full max-w-lg mx-auto select-none" data-testid="sound-match-round">
      {/* 10-Stage Progression & Adventure Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F8FA] border border-[#BCEBF2] text-[#0899AA] text-xs font-black uppercase tracking-wider shadow-2xs"
          data-testid="sound-match-stage-badge"
        >
          <span>{currentStageConfig.icon || '🎧'}</span>
          <span>Stage {stageNum} of 10: {currentStageConfig.title}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {milestone && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black uppercase shadow-2xs"
              data-testid="sound-match-milestone-indicator"
              title={`Level ${currentLevelNum} Reward: ${milestone.name}`}
            >
              <span>{milestone.icon}</span>
              <span>Reward Level</span>
            </span>
          )}
          <span
            className="text-xs font-black text-[#527080] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full"
            data-testid="sound-match-level-badge"
          >
            Level {currentLevelNum} of 100
          </span>
        </div>
      </div>

      {/* Stage 10-Step Progress Beads */}
      <div
        className="flex items-center justify-center gap-1.5 mb-4"
        data-testid="sound-match-stage-progress"
        aria-label={`Stage ${stageNum} Progress`}
      >
        {Array.from({ length: 10 }).map((_, stepIdx) => {
          const stepLevel = (stageNum - 1) * 10 + stepIdx + 1;
          const isCompletedStep = currentLevelNum > stepLevel;
          const isCurrentStep = currentLevelNum === stepLevel;
          const isRewardStep = stepLevel % 5 === 0;
          return (
            <div
              key={`step-${stepLevel}`}
              className={`h-2 rounded-full transition-all ${
                isCurrentStep
                  ? 'w-6 bg-[#13CFE3] ring-2 ring-[#13CFE3]/40'
                  : isCompletedStep
                  ? 'w-2 bg-emerald-400'
                  : isRewardStep
                  ? 'w-2.5 bg-amber-300 ring-1 ring-amber-400'
                  : 'w-2 bg-slate-200'
              }`}
              title={`Level ${stepLevel}${isRewardStep ? ' (Milestone Reward)' : ''}`}
            />
          );
        })}
      </div>

      {/* Target Word & Audio Playback Header */}
      <div className="mb-4 inline-flex items-center gap-3 bg-[#FEF8EC] border-2 border-[#FDE6BE] px-4 sm:px-6 py-2 sm:py-3 rounded-2xl shadow-xs transition-all">
        <button
          type="button"
          onClick={handlePlayAudio}
          disabled={isPlayingAudio || isTransitioning}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isPlayingAudio
              ? 'bg-amber-400 text-slate-950 scale-105 shadow-inner'
              : 'bg-white hover:bg-amber-100 text-amber-700 border border-amber-300 active:scale-95'
          }`}
          data-testid="sound-match-audio-btn"
          aria-label={`Listen to word ${round?.word || ''}`}
          title={`Hear word ${round?.word || ''}`}
        >
          <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isPlayingAudio ? 'animate-pulse text-slate-950' : 'text-amber-600'}`} />
        </button>

        <span
          className="font-display font-black text-2xl sm:text-3xl text-[#B45309] tracking-wider"
          data-testid="sound-match-target-word"
        >
          {round?.word}
        </span>
      </div>

      <p className="font-display font-bold text-xs sm:text-sm text-[#527080] mb-5">
        Listen to the word and tap the matching picture!
      </p>

      {/* Picture Options Grid */}
      <div className="flex gap-3 sm:gap-4 justify-center items-center flex-wrap px-2">
        {displayedOptions.map((opt, idx) => {
          const isSelected = selectedOption === opt;
          return (
            <button
              key={`opt-${opt}-${idx}`}
              type="button"
              onClick={() => handleSelectOption(opt)}
              disabled={isTransitioning || isSubmittedRef.current}
              data-testid={`sound-match-option-${opt}`}
              data-position={idx}
              className={`w-22 h-22 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl transition-all border-2 shadow-xs cursor-pointer select-none active:scale-95 ${
                isSelected
                  ? 'border-[#13CFE3] bg-[#E6F8FA] ring-4 ring-[#13CFE3]/30 scale-105'
                  : 'bg-[#F2FBFC] hover:bg-[#E6F8FA] border-[#D7EEF1] hover:border-[#13CFE3] hover:scale-105'
              } ${isTransitioning || isSubmittedRef.current ? 'cursor-not-allowed opacity-90' : ''}`}
              aria-label={`Option ${opt}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
