/**
 * LetterDetectiveRound.jsx
 *
 * Dedicated interactive gameplay round for Letter Detective:
 * - Multi-select Word Detective: Children select all words containing the target sound/pattern.
 * - Exact-set Validation: Every correct word must be selected, and no distractors may be selected.
 * - User-Controlled Audio:
 *     1. Target sound audio button with phonics anchor pronunciation.
 *     2. Per-word pronunciation controls for beginning readers.
 *     3. ZERO automatic playback on mount or question advance.
 *     4. Speech failures do NOT lock answer choices or freeze UI.
 * - Rapid-Click Protection: Synchronous `isSubmittedRef` prevents duplicate submissions.
 * - Full Accessibility: Keyboard operable, `aria-pressed`, `aria-checked`, clear accessible labels.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui';
import letterDetectiveAudio from '../engine/letterDetectiveAudio';
import { getLetterDetectiveDisplayedWords } from '../engine/letterDetectiveCurriculum';

export default function LetterDetectiveRound({
  round,
  roundIdx = 0,
  selectedWords = [],
  setSelectedWords,
  onAnswer,
  isTransitioning = false,
  quietMode = false,
}) {
  const [internalSelected, setInternalSelected] = useState([]);
  const [playingTarget, setPlayingTarget] = useState(false);
  const [playingWord, setPlayingWord] = useState(null);
  const [audioError, setAudioError] = useState(null);

  // Fallback to internal selection state if parent didn't provide state setters (e.g. standalone tests)
  const currentSelected = setSelectedWords ? selectedWords : internalSelected;
  const updateSelected = setSelectedWords || setInternalSelected;

  const isSubmittedRef = useRef(false);
  const prevRoundRef = useRef(round?.id ?? roundIdx);

  const target = round?.target || round?.targetSound || '';
  const displayedWords = useMemo(
    () => getLetterDetectiveDisplayedWords(round),
    [round]
  );

  // Synchronously reset submission lock and audio when round changes
  if (prevRoundRef.current !== (round?.id ?? roundIdx)) {
    prevRoundRef.current = round?.id ?? roundIdx;
    isSubmittedRef.current = false;
    setPlayingTarget(false);
    setPlayingWord(null);
    setAudioError(null);
    letterDetectiveAudio.stopSpeech();
  }

  // Reset submission lock when round transition finishes
  useEffect(() => {
    if (!isTransitioning) {
      isSubmittedRef.current = false;
    }
  }, [isTransitioning]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      letterDetectiveAudio.stopSpeech();
    };
  }, []);

  // User-initiated target sound playback
  const handlePlayTargetSound = (e) => {
    if (e) e.stopPropagation();
    if (isTransitioning || !round) return;

    setAudioError(null);
    setPlayingTarget(true);
    setPlayingWord(null);

    letterDetectiveAudio.speakTargetSound(round, {
      onStart: () => {
        setPlayingTarget(true);
      },
      onEnd: () => {
        setPlayingTarget(false);
      },
      onError: (err) => {
        setPlayingTarget(false);
        setAudioError('Sound audio unavailable. You can still play!');
      },
    });
  };

  // User-initiated individual candidate word playback
  const handlePlayWord = (w, e) => {
    if (e) e.stopPropagation();
    if (isTransitioning || !w) return;

    setAudioError(null);
    setPlayingWord(w);
    setPlayingTarget(false);

    letterDetectiveAudio.speakWord(w, {
      onStart: () => {
        setPlayingWord(w);
      },
      onEnd: () => {
        setPlayingWord(null);
      },
      onError: (err) => {
        setPlayingWord(null);
        setAudioError('Word audio unavailable. You can still play!');
      },
    });
  };

  // Toggle selection for a candidate word
  const toggle = (w) => {
    if (isTransitioning || isSubmittedRef.current) return;
    updateSelected((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]
    );
  };

  // Submit selected words for answer evaluation
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isTransitioning || isSubmittedRef.current || currentSelected.length === 0) {
      return;
    }

    // Synchronous lock to prevent double-click / rapid repeated submissions
    isSubmittedRef.current = true;
    letterDetectiveAudio.stopSpeech();

    // Exact-set validation: all correct words must be selected, and NO distractors
    const answers = round?.answers || [];
    const hasOnlyCorrect = currentSelected.every((w) => answers.includes(w));
    const hasAllCorrect =
      answers.length > 0 && answers.every((a) => currentSelected.includes(a));
    const isCorrect =
      hasOnlyCorrect && hasAllCorrect && currentSelected.length === answers.length;

    onAnswer(isCorrect);
  };

  return (
    <div className="w-full max-w-lg mx-auto text-center select-none">
      {/* Target Sound Clue & Audio Control */}
      <div className="mb-6">
        <p className="font-display font-bold text-[#08233A] text-base sm:text-lg mb-3">
          Find words with{' '}
          <span className="text-[#0899AA] bg-[#DDF9FC] px-2.5 py-0.5 rounded-lg border border-[#D7EEF1] font-black inline-block">
            /{target}/
          </span>
        </p>

        {/* User-Controlled Listen to Sound Button */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handlePlayTargetSound}
            disabled={isTransitioning}
            data-testid="target-sound-audio-button"
            aria-label={`Listen to target sound /${target}/`}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer select-none ${
              playingTarget
                ? 'bg-[#0899AA] text-white border-[#0899AA] shadow-sm animate-pulse'
                : 'bg-white text-[#0899AA] border-[#D7EEF1] hover:bg-[#E6F8FA] hover:border-[#13CFE3] active:scale-95'
            }`}
          >
            <Volume2 className={`w-4 h-4 ${playingTarget ? 'animate-bounce' : ''}`} />
            <span>{playingTarget ? 'Playing Sound…' : 'Listen to Sound 🔊'}</span>
          </button>
        </div>

        {/* Friendly non-blocking audio error notification */}
        {audioError && (
          <div
            role="status"
            className="mt-2 text-xs font-semibold text-amber-600 flex items-center justify-center gap-1.5 animate-fadeIn"
          >
            <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
            <span>{audioError}</span>
          </div>
        )}
      </div>

      {/* Candidate Word Options */}
      <div className="flex gap-3 justify-center flex-wrap mb-6">
        {displayedWords.map((w) => {
          const isSelected = currentSelected.includes(w);
          const isWordAudioPlaying = playingWord === w;

          return (
            <div
              key={w}
              className={`inline-flex items-center rounded-xl overflow-hidden border-2 transition-all shadow-xs ${
                isSelected
                  ? 'border-[#08233A] shadow-md scale-105'
                  : 'border-[#D7EEF1]'
              }`}
            >
              {/* Word Toggle Selection Button */}
              <button
                type="button"
                role="button"
                aria-pressed={isSelected}
                aria-checked={isSelected}
                aria-label={isSelected ? `${w}, selected` : w}
                data-testid={`word-option-${w}`}
                onClick={() => toggle(w)}
                disabled={isTransitioning}
                className={`px-4 sm:px-5 py-3 font-display font-semibold font-black text-base transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#08233A] text-white'
                    : 'bg-[#F2FBFC] text-[#08233A] hover:bg-[#E6F8FA]'
                }`}
              >
                {w}
              </button>

              {/* Per-Word Audio Pronunciation Button */}
              <button
                type="button"
                onClick={(e) => handlePlayWord(w, e)}
                disabled={isTransitioning}
                data-testid={`word-audio-button-${w}`}
                aria-label={`Listen to word ${w}`}
                title={`Listen to "${w}"`}
                className={`px-2.5 py-3 border-l transition-all cursor-pointer flex items-center justify-center ${
                  isWordAudioPlaying
                    ? 'bg-[#13CFE3] text-[#08233A] border-[#13CFE3]'
                    : isSelected
                    ? 'bg-[#123652] text-[#DDF9FC] border-[#1f4a6e] hover:bg-[#1a4466]'
                    : 'bg-white text-[#527080] border-[#D7EEF1] hover:text-[#0899AA] hover:bg-[#E6F8FA]'
                }`}
              >
                <Volume2
                  className={`w-4 h-4 ${
                    isWordAudioPlaying ? 'animate-pulse text-[#08233A]' : ''
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Check Answer Button */}
      <div className="flex flex-col items-center">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={currentSelected.length === 0 || isTransitioning}
          data-testid="check-answer-button"
          className="min-h-[48px] px-8 rounded-2xl font-display font-black bg-[#13CFE3] text-[#08233A] hover:bg-[#0899AA] hover:text-white border-b-4 border-[#0899AA] active:border-b-0 active:translate-y-1 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answer
        </Button>
      </div>
    </div>
  );
}
