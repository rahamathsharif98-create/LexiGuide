/**
 * PictureMatchRound.jsx
 *
 * Dedicated interactive gameplay round for Picture Match:
 * - Round presentation: Displays high-contrast emoji picture clue, educational prompt, and 3 word options.
 * - User-Controlled Phonics Audio:
 *     1. "Hear Word" button speaks the target word at a child-friendly, paced rate.
 *     2. "Phonics Clue" button speaks and reveals the educational phonics clue.
 *     3. ZERO automatic playback on mount or round advance.
 *     4. Graceful fallback when SpeechSynthesis is unsupported or fails.
 *     5. Clean audio stop on unmount and round change.
 * - Input Safety:
 *     - Synchronous `isAnswerSubmittedRef` prevents rapid double-clicks and duplicate scoring.
 *     - All answer buttons disable immediately upon selection.
 * - Accessibility:
 *     - Clue has semantic `role="img"` and descriptive `aria-label`.
 *     - Answer choices use semantic `<button type="button">` with visible focus rings.
 *     - Distinct visual feedback for correct (`✓`) and incorrect (`✕`) selections.
 *     - Live region (`aria-live="polite"`) announces selection feedback.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Lightbulb, AlertCircle, Check, X } from 'lucide-react';
import pictureMatchAudio from '../engine/pictureMatchAudio';
import { audioAtmosphere } from '../../../services/audioAtmosphereService';

export default function PictureMatchRound({
  round,
  roundIdx = 0,
  onAnswer,
  isTransitioning = false,
  quietMode = false,
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null); // 'word' | 'hint' | null
  const [audioError, setAudioError] = useState(null);
  const [showPhonicsClue, setShowPhonicsClue] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const isAnswerSubmittedRef = useRef(false);
  const prevRoundRef = useRef(round?.id ?? roundIdx);

  // Synchronously reset submission lock and audio when round changes
  if (prevRoundRef.current !== (round?.id ?? roundIdx)) {
    prevRoundRef.current = round?.id ?? roundIdx;
    isAnswerSubmittedRef.current = false;
    setSelectedOption(null);
    setPlayingAudio(null);
    setAudioError(null);
    setShowPhonicsClue(false);
    setAnnouncement('');
    pictureMatchAudio.stopSpeech();
  }

  // Reset submission lock when round transition finishes
  useEffect(() => {
    if (!isTransitioning) {
      isAnswerSubmittedRef.current = false;
    }
  }, [isTransitioning]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      pictureMatchAudio.stopSpeech();
    };
  }, []);

  // User-initiated target word playback
  const handlePlayWord = (e) => {
    if (e) e.stopPropagation();
    if (isTransitioning || !round) return;

    setAudioError(null);
    setPlayingAudio('word');

    const spoken = pictureMatchAudio.speakWord(round.correct, {
      onStart: () => setPlayingAudio('word'),
      onEnd: () => setPlayingAudio(null),
      onError: () => {
        setPlayingAudio(null);
        setAudioError('Word audio unavailable. You can still play without sound!');
      },
    });

    if (!spoken && !pictureMatchAudio.isSupported()) {
      setPlayingAudio(null);
      setAudioError('Word audio unavailable. You can still play without sound!');
    }
  };

  // User-initiated phonics hint playback
  const handlePlayHint = (e) => {
    if (e) e.stopPropagation();
    if (isTransitioning || !round) return;

    setShowPhonicsClue(true);
    setAudioError(null);
    setPlayingAudio('hint');

    const hintText = round.phonicsHint || round.hint || `Look closely at the picture: ${round.label || round.correct}`;

    const spoken = pictureMatchAudio.speakPhonicsHint(hintText, {
      onStart: () => setPlayingAudio('hint'),
      onEnd: () => setPlayingAudio(null),
      onError: () => {
        setPlayingAudio(null);
        setAudioError('Phonics audio unavailable. You can still play without sound!');
      },
    });

    if (!spoken && !pictureMatchAudio.isSupported()) {
      setPlayingAudio(null);
      setAudioError('Phonics audio unavailable. You can still play without sound!');
    }
  };

  // Handle option selection with synchronous lock
  const handleSelectOption = (opt) => {
    if (isAnswerSubmittedRef.current || isTransitioning) return;
    isAnswerSubmittedRef.current = true;
    setSelectedOption(opt);

    const isCorrect = opt === round.correct;

    try {
      audioAtmosphere?.playChime?.(isCorrect ? 680 : 380, 0.08);
    } catch {}

    setAnnouncement(
      isCorrect
        ? `Correct! ${opt} matches the picture!`
        : `Let's try again! You picked ${opt}.`
    );

    onAnswer(isCorrect);
  };

  const isLocked = isAnswerSubmittedRef.current || isTransitioning;

  return (
    <div className="text-center w-full max-w-lg mx-auto" data-testid="picture-match-round">
      {/* Live region for accessibility announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Picture Clue Display */}
      <div className="mb-2 flex items-center justify-center min-h-[110px]">
        <div
          role="img"
          aria-label={round.label ? `Picture of ${round.label}` : 'Picture clue'}
          className="select-none animate-float inline-flex items-center justify-center"
          data-testid="picture-clue-display"
        >
          {round.image ? (
            <>
              <img
                src={round.image}
                alt={round.label ? `Picture of ${round.label}` : (round.correct || 'Picture clue')}
                className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-md select-none pointer-events-none"
                data-testid="picture-clue-image"
              />
              <span className="sr-only" data-testid="picture-clue-emoji">
                {round.emoji}
              </span>
            </>
          ) : (
            <span className="text-7xl sm:text-8xl select-none" data-testid="picture-clue-emoji">
              {round.emoji}
            </span>
          )}
        </div>
      </div>

      {/* Round Prompt */}
      <p className="text-xs sm:text-sm text-[#527080] font-bold mb-3" data-testid="round-prompt">
        Look at the picture and tap the matching word!
      </p>

      {/* Learning Support & Audio Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <button
          type="button"
          onClick={handlePlayWord}
          disabled={isLocked}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-display font-extrabold text-xs transition-all border shadow-xs cursor-pointer select-none active:scale-95 ${
            playingAudio === 'word'
              ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA] scale-105'
              : 'bg-white hover:bg-[#E6F8FA] text-[#08233A] border-[#D7EEF1] hover:border-[#13CFE3]'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
          aria-label={`Hear word for ${round.label || 'picture'}`}
          data-testid="hear-word-button"
        >
          <Volume2 size={16} className={playingAudio === 'word' ? 'animate-bounce' : 'text-[#0899AA]'} />
          <span>{playingAudio === 'word' ? 'Playing…' : 'Hear Word'}</span>
        </button>

        {round.phonicsHint && (
          <button
            type="button"
            onClick={handlePlayHint}
            disabled={isLocked}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-display font-extrabold text-xs transition-all border shadow-xs cursor-pointer select-none active:scale-95 ${
              playingAudio === 'hint' || showPhonicsClue
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
            aria-label="Hear phonics clue"
            data-testid="hear-hint-button"
          >
            <Lightbulb size={16} className={playingAudio === 'hint' ? 'animate-pulse text-amber-500' : 'text-amber-500'} />
            <span>Phonics Clue</span>
          </button>
        )}
      </div>

      {/* Audio Error Banner */}
      {audioError && (
        <div
          className="mb-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
          role="alert"
          data-testid="speech-unsupported-banner"
        >
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Phonics Clue Reveal Panel */}
      {showPhonicsClue && round.phonicsHint && (
        <div
          className="mb-4 p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs animate-pop max-w-sm mx-auto"
          data-testid="phonics-hint-text"
        >
          <span className="text-amber-600 font-extrabold mr-1">💡 Clue:</span>
          <span>{round.phonicsHint}</span>
        </div>
      )}

      {/* Three Answer Choice Buttons */}
      <div className="flex gap-3 justify-center flex-wrap" data-testid="picture-match-options">
        {round.options.map((opt) => {
          const isSelected = selectedOption === opt;
          const isCorrectChoice = opt === round.correct;

          // State-based classes
          let buttonStateClasses =
            'bg-[#F2FBFC] hover:bg-[#E6F8FA] border-[#D7EEF1] hover:border-[#13CFE3] text-[#08233A] hover:scale-102';

          if (isSelected) {
            if (isCorrectChoice) {
              buttonStateClasses =
                'bg-[#EBF9F2] border-[#39B87F] text-[#0A5C36] ring-4 ring-[#39B87F]/20 scale-105';
            } else {
              buttonStateClasses =
                'bg-[#FFF2ED] border-[#D95C5C] text-[#8C1D1D] ring-4 ring-[#D95C5C]/20 animate-shake';
            }
          } else if (selectedOption !== null) {
            buttonStateClasses = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
          }

          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelectOption(opt)}
              disabled={isLocked}
              aria-label={opt}
              aria-pressed={isSelected}
              data-testid={`word-choice-${opt}`}
              className={`relative min-h-[56px] min-w-[120px] sm:min-w-[140px] px-6 py-3.5 rounded-2xl border-2 font-display font-black text-base sm:text-lg transition-all shadow-xs active:scale-95 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/50 disabled:cursor-not-allowed ${buttonStateClasses}`}
            >
              <span>{opt}</span>

              {/* Status Icons on Selection */}
              {isSelected && isCorrectChoice && (
                <span
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#39B87F] text-white flex items-center justify-center text-xs font-black shadow-xs animate-pop"
                  data-testid="correct-selection-indicator"
                >
                  <Check size={14} strokeWidth={3} />
                </span>
              )}

              {isSelected && !isCorrectChoice && (
                <span
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#D95C5C] text-white flex items-center justify-center text-xs font-black shadow-xs animate-pop"
                  data-testid="wrong-selection-indicator"
                >
                  <X size={14} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
