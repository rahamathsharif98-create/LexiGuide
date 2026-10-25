import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, RotateCcw, Check, AlertCircle } from 'lucide-react';
import soundRhythmAudio from '../engine/soundRhythmAudio';
import { getSoundRhythmDisplayedOptions } from '../engine/soundRhythmCurriculum';
import { audioAtmosphere } from '../../../services/audioAtmosphereService';

/**
 * SoundRhythmRound
 *
 * Dedicated interactive gameplay round for Sound & Rhythm:
 * - Strictly User-Controlled: ZERO automatic rhythm playback on mount or question advance.
 * - Answer Lock: Answer cards remain safely disabled until the child listens to the rhythm at least once.
 * - Transparent Error Handling: Failed playback attempts display an encouraging retry message and do NOT unlock answers.
 * - Replay Control: Child can replay the pattern at any time via "Listen Again 🔁".
 * - Synchronous Ref Guard (`isSubmittedRef`): Completely prevents duplicate score, XP, or double-click bugs.
 * - Visual Beat Markers: Highlights syllables in real time synchronized with Web Audio playback.
 */
export default function SoundRhythmRound({
  round,
  roundIdx = 0,
  onAnswer,
  isTransitioning = false,
  quietMode = false,
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasListened, setHasListened] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [activeBeatIndex, setActiveBeatIndex] = useState(-1);
  const [selectedOption, setSelectedOption] = useState(null);

  const isSubmittedRef = useRef(false);
  const prevRoundRef = useRef(round?.id ?? roundIdx);

  // Synchronously reset submission lock, listening state, and audio when round changes
  if (prevRoundRef.current !== (round?.id ?? roundIdx)) {
    prevRoundRef.current = round?.id ?? roundIdx;
    isSubmittedRef.current = false;
    setHasListened(false);
    setAudioError(null);
    setSelectedOption(null);
    setActiveBeatIndex(-1);
    soundRhythmAudio.stopRhythm();
  }

  // Reset local state when transitioning concludes
  useEffect(() => {
    if (!isTransitioning) {
      isSubmittedRef.current = false;
      setSelectedOption(null);
      setActiveBeatIndex(-1);
    }
  }, [isTransitioning]);

  // Clean up audio playback when unmounting or changing rounds
  useEffect(() => {
    return () => {
      soundRhythmAudio.stopRhythm();
      try {
        audioAtmosphere?.restoreMusic?.();
      } catch {}
    };
  }, [round?.id]);

  // Note: NO automatic playback useEffect! Audio only plays when the child explicitly clicks the button.

  // Explicit user-initiated rhythm playback
  const handlePlayRhythm = async (e) => {
    if (e) e.stopPropagation();
    // Guard against double-clicks while audio is already actively playing
    if (isPlayingAudio || !round) return;

    setIsPlayingAudio(true);
    setAudioError(null);
    setActiveBeatIndex(0);

    // Duck background music smoothly during instructional rhythm
    try {
      audioAtmosphere?.duckMusic?.(0.15);
    } catch {
      /* atmosphere ducking handled */
    }

    await soundRhythmAudio.playRhythm(round, {
      onBeat: (beatIndex) => {
        setActiveBeatIndex(beatIndex);
      },
      onEnd: () => {
        setIsPlayingAudio(false);
        setHasListened(true); // Successfully heard rhythm! Unlocks answering.
        setAudioError(null);
        setActiveBeatIndex(-1);
        try {
          audioAtmosphere?.restoreMusic?.();
        } catch {}
      },
      onError: (err) => {
        setIsPlayingAudio(false);
        setActiveBeatIndex(-1);
        // Do NOT count failed playback as listened! Keep options disabled.
        setAudioError('Rhythm could not play. Please tap to try again!');
        try {
          audioAtmosphere?.restoreMusic?.();
        } catch {}
      },
    });
  };

  // Synchronous submission handler
  const handleSelectOption = (opt) => {
    // Only allow submission if the child has heard the rhythm and not already submitted
    if (isSubmittedRef.current || !hasListened || isPlayingAudio || isTransitioning) return;
    isSubmittedRef.current = true;
    setSelectedOption(opt);

    // Stop lingering audio immediately on user answer
    soundRhythmAudio.stopRhythm();
    setIsPlayingAudio(false);
    setActiveBeatIndex(-1);

    const wasCorrect = opt === round.correct;
    try {
      soundRhythmAudio.playFeedback(wasCorrect ? 'correct' : 'wrong');
    } catch {
      /* feedback audio handled */
    }

    if (onAnswer) {
      onAnswer(wasCorrect);
    }
  };

  // Stable, deterministic options list from curriculum
  const displayedOptions = useMemo(() => {
    return getSoundRhythmDisplayedOptions(round);
  }, [round]);

  const syllables = round?.syllables || (round?.pattern ? round.pattern.split(' ') : ['BA', 'BA', 'BA']);

  return (
    <div className="text-center w-full max-w-md mx-auto" data-testid="sound-rhythm-round">
      {/* 1. Rhythm Pattern & Syllable Beat Markers */}
      <div className="mb-4 flex flex-col items-center">
        <div
          className="inline-flex items-center gap-2 bg-[#F3F0FF] border border-[#DDD6FE] px-4 py-2 rounded-2xl text-[#6D28D9] mb-3 shadow-2xs"
          data-testid="rhythm-pattern-badge"
          aria-label={`Rhythm pattern: ${round?.pattern || ''}`}
        >
          <span className="text-2xl select-none">🥁</span>
          <span className="font-display font-black text-sm tracking-wide">
            {round?.pattern || 'RHYTHM'}
          </span>
        </div>

        {/* Visual Synchronized Beat Nodes */}
        <div
          className="flex items-center justify-center gap-2.5 my-2"
          data-testid="rhythm-beat-indicators"
          aria-label="Rhythm beat markers"
        >
          {syllables.map((syl, i) => {
            const isCurrentBeat = activeBeatIndex === i;
            return (
              <div
                key={`${syl}-${i}`}
                className={`min-w-[48px] h-11 px-3 rounded-xl flex items-center justify-center font-display font-black text-sm transition-all duration-150 select-none ${
                  isCurrentBeat
                    ? 'bg-[#13CFE3] text-[#08233A] scale-110 shadow-md ring-4 ring-[#13CFE3]/40'
                    : 'bg-[#F2FBFC] text-[#08233A] border-2 border-[#D7EEF1]'
                }`}
                data-testid={`beat-node-${i}`}
              >
                {syl}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Audio Playback Control */}
      <div className="mb-4 flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={handlePlayRhythm}
          disabled={isPlayingAudio || isTransitioning}
          data-testid="rhythm-audio-button"
          aria-label={
            isPlayingAudio
              ? `Playing rhythm: ${round?.pattern}`
              : hasListened
              ? `Listen to rhythm again: ${round?.pattern}`
              : `Listen to rhythm: ${round?.pattern}`
          }
          className={`inline-flex items-center justify-center gap-2 font-display font-black px-6 py-3.5 rounded-2xl border-2 border-b-4 transition-all select-none active:border-b-2 active:translate-y-0.5 outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/40 min-h-[52px] ${
            isPlayingAudio
              ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA] shadow-md shadow-[#13CFE3]/25 cursor-default'
              : hasListened
              ? 'bg-[#EBF9F2] text-[#08233A] border-[#39B87F] hover:bg-[#D5F3E4] cursor-pointer'
              : audioError
              ? 'bg-[#FFF5F5] text-[#C53030] border-[#E53E3E] hover:bg-[#FED7D7] cursor-pointer animate-pulse'
              : 'bg-[#DDF9FC] text-[#08233A] border-[#A8E6EE] hover:bg-[#CBF3F9] shadow-xs cursor-pointer'
          } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isPlayingAudio ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-[#08233A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-4.5 bg-[#08233A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-3 bg-[#08233A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-1 text-sm font-black">Playing rhythm…</span>
            </span>
          ) : hasListened ? (
            <>
              <RotateCcw size={18} className="text-[#39B87F]" />
              <span className="text-sm font-black">Listen Again 🔁</span>
            </>
          ) : audioError ? (
            <>
              <RotateCcw size={18} className="text-[#E53E3E]" />
              <span className="text-sm font-black">Tap to Retry Rhythm 🔁</span>
            </>
          ) : (
            <>
              <Volume2 size={18} className="text-[#0899AA]" />
              <span className="text-sm font-black">Listen to Rhythm 🔊</span>
            </>
          )}
        </button>

        {/* Audio Error Notification */}
        {audioError && (
          <p
            className="mt-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5"
            data-testid="audio-error-message"
          >
            <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
            <span>{audioError}</span>
          </p>
        )}

        {/* Encouraging helper guidance before listening */}
        {!hasListened && !isPlayingAudio && !audioError && (
          <p className="mt-2 text-xs font-bold text-[#527080] flex items-center gap-1">
            <span>🎧 Tap the button above to hear the rhythm!</span>
          </p>
        )}
      </div>

      {/* 3. Prompt text */}
      <p className="font-display font-bold text-sm text-[#08233A] mb-4">
        {round?.prompt || 'Tap the pattern that matches what you hear:'}
      </p>

      {/* 4. Three Distinct Answer Option Cards */}
      <div className="flex flex-col gap-2.5 max-w-xs mx-auto" role="radiogroup" aria-label="Rhythm answer options">
        {displayedOptions.map((opt, idx) => {
          const isSelected = selectedOption === opt;
          const isCorrect = opt === round?.correct;
          const isLocked = !hasListened || isPlayingAudio || isTransitioning || isSubmittedRef.current;

          let buttonStyle = 'bg-[#F2FBFC] hover:bg-[#E6F8FA] border-2 border-[#D7EEF1] hover:border-[#13CFE3] text-[#08233A]';

          if (isSelected) {
            buttonStyle = isCorrect
              ? 'bg-[#E8F8F0] border-2 border-[#10B981] text-[#065F46] shadow-sm scale-[0.99]'
              : 'bg-[#FEF3C7] border-2 border-[#F59E0B] text-[#92400E] shadow-sm scale-[0.99]';
          } else if (isLocked) {
            buttonStyle = 'bg-[#F8FAFC] border-2 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed';
          }

          return (
            <button
              key={`${opt}-${idx}`}
              type="button"
              disabled={isLocked}
              onClick={() => handleSelectOption(opt)}
              data-testid={`rhythm-option-${idx}`}
              aria-label={`Option ${idx + 1}: ${opt}`}
              aria-pressed={isSelected}
              className={`px-5 py-3.5 rounded-2xl font-display font-black text-sm transition-all duration-150 flex items-center justify-between min-h-[50px] shadow-2xs ${buttonStyle} ${
                !isLocked ? 'cursor-pointer active:scale-95' : ''
              }`}
            >
              <span className="flex-1 text-center">{opt}</span>
              {isSelected && (
                <span className="ml-2 flex items-center">
                  {isCorrect ? (
                    <Check size={18} className="text-[#10B981] animate-pop" />
                  ) : (
                    <span className="text-xs font-bold text-[#F59E0B]">Try again</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
