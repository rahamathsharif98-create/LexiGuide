/**
 * MissingLetterRound.jsx
 *
 * Dedicated interactive gameplay round for Missing Letter:
 * - Round presentation: Displays clue image, missing-letter word (e.g., C _ T), prompt, and 3 letter options.
 * - User-Controlled Phonics Audio:
 *     1. "Hear the word" audio button for spoken word pronunciation.
 *     2. "Hear the phonics hint" audio button for educational phonics clues.
 *     3. Individual letter sound playback controls.
 *     4. ZERO automatic playback on round mount or advance.
 *     5. Graceful fallback when SpeechSynthesis is unsupported or interrupted.
 * - Input Safety:
 *     - Synchronous `isSubmittedRef` locks rapid double-clicks or repeated keyboard activations.
 *     - All answer buttons disable immediately after selection.
 * - Accessibility:
 *     - Semantic `<button type="button">` with descriptive accessible names.
 *     - ARIA attributes: `aria-pressed`, `aria-disabled`, `aria-label`.
 *     - Live region (`aria-live="polite"`) announcing selection feedback.
 *     - Visible focus rings (`focus-visible:ring-4`).
 *     - High-contrast and distinguishable disabled button states.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, Lightbulb, AlertCircle } from 'lucide-react';
import missingLetterAudio from '../engine/missingLetterAudio';
import { getMissingLetterDisplayedOptions } from '../engine/missingLetterCurriculum';
import { audioAtmosphere } from '../../../services/audioAtmosphereService';

export default function MissingLetterRound({
  round,
  roundIdx = 0,
  onAnswer,
  isTransitioning = false,
  quietMode = false,
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null); // 'word' | 'hint' | letter (e.g. 'A') | null
  const [audioError, setAudioError] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  const isSubmittedRef = useRef(false);
  const prevRoundRef = useRef(round?.id ?? roundIdx);

  const displayedOptions = useMemo(
    () => getMissingLetterDisplayedOptions(round),
    [round]
  );

  // Synchronously reset submission lock and audio when round changes
  if (prevRoundRef.current !== (round?.id ?? roundIdx)) {
    prevRoundRef.current = round?.id ?? roundIdx;
    isSubmittedRef.current = false;
    setSelectedOption(null);
    setPlayingAudio(null);
    setAudioError(null);
    setAnnouncement('');
    missingLetterAudio.stopSpeech();
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
      missingLetterAudio.stopSpeech();
    };
  }, []);

  // User-initiated target word playback
  const handlePlayWord = (e) => {
    if (e) e.stopPropagation();
    if (isTransitioning || !round) return;

    setAudioError(null);
    setPlayingAudio('word');

    const spoken = missingLetterAudio.speakWord(round.fullWord, {
      onStart: () => setPlayingAudio('word'),
      onEnd: () => setPlayingAudio(null),
      onError: () => {
        setPlayingAudio(null);
        setAudioError('Word audio unavailable. You can still play!');
      },
    });

    if (!spoken && !missingLetterAudio.isSupported()) {
      setPlayingAudio(null);
      setAudioError('Word audio unavailable. You can still play!');
    }
  };

  // User-initiated phonics hint playback
  const handlePlayHint = (e) => {
    if (e) e.stopPropagation();
    if (isTransitioning || !round) return;

    setAudioError(null);
    setPlayingAudio('hint');

    const spoken = missingLetterAudio.speakPhonicsHint(round, {
      onStart: () => setPlayingAudio('hint'),
      onEnd: () => setPlayingAudio(null),
      onError: () => {
        setPlayingAudio(null);
        setAudioError('Phonics audio unavailable. You can still play!');
      },
    });

    if (!spoken && !missingLetterAudio.isSupported()) {
      setPlayingAudio(null);
      setAudioError('Phonics audio unavailable. You can still play!');
    }
  };

  // User-initiated candidate letter sound playback
  const handlePlayLetterSound = (opt, e) => {
    if (e) e.stopPropagation();
    if (isTransitioning || !opt) return;

    setAudioError(null);
    setPlayingAudio(opt);

    const spoken = missingLetterAudio.speakLetterSound(opt, round?.fullWord, {
      onStart: () => setPlayingAudio(opt),
      onEnd: () => setPlayingAudio(null),
      onError: () => {
        setPlayingAudio(null);
        setAudioError('Letter audio unavailable. You can still play!');
      },
    });

    if (!spoken && !missingLetterAudio.isSupported()) {
      setPlayingAudio(null);
      setAudioError('Letter audio unavailable. You can still play!');
    }
  };

  // Answer selection handler with synchronous rapid-click guard
  const handleSelectAnswer = (opt) => {
    if (isTransitioning || isSubmittedRef.current || !opt) {
      return;
    }

    // Synchronous guard against double-clicks and rapid repeated keypresses
    isSubmittedRef.current = true;
    setSelectedOption(opt);
    missingLetterAudio.stopSpeech();

    try {
      audioAtmosphere?.playChime?.(640, 0.08);
    } catch {}

    const targetAnswer = round?.missing || round?.answer;
    const isCorrect = opt === targetAnswer;

    setAnnouncement(
      isCorrect ? `Great job! ${opt} completes ${round?.fullWord || 'the word'}.` : `Let's try again!`
    );

    onAnswer(isCorrect);
  };

  const isSelectionDisabled = isTransitioning || isSubmittedRef.current;

  return (
    <div className="w-full max-w-lg mx-auto text-center select-none">
      {/* Live region for screen readers */}
      <div role="status" aria-live="polite" className="sr-only" data-testid="live-announcement">
        {announcement}
      </div>

      {/* Clue Image / Emoji */}
      <div
        className="text-6xl mb-3 select-none animate-float"
        data-testid="missing-letter-image"
        aria-hidden="true"
      >
        {round?.image || '🧩'}
      </div>

      {/* Missing-Letter Word Display */}
      <div className="mb-4">
        <div
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-2xl bg-[#F2FBFC] border-2 border-[#D7EEF1] text-2xl font-display font-black text-[#08233A] tracking-widest shadow-inner select-none"
          data-testid="missing-letter-word-display"
          aria-label={`Word to complete: ${round?.wordDisplay || ''}`}
        >
          {round?.wordDisplay || 'C _ T'}
        </div>
      </div>

      {/* User-Controlled Audio Controls: Hear Word & Hear Phonics Hint */}
      <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
        <button
          type="button"
          onClick={handlePlayWord}
          disabled={isTransitioning}
          data-testid="listen-word-button"
          aria-label="Hear the word"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/50 disabled:opacity-60 disabled:cursor-not-allowed ${
            playingAudio === 'word'
              ? 'bg-[#0899AA] text-white border-[#0899AA] shadow-xs animate-pulse'
              : 'bg-white text-[#0899AA] border-[#D7EEF1] hover:bg-[#E6F8FA] hover:border-[#13CFE3] active:scale-95'
          }`}
        >
          <Volume2 className={`w-3.5 h-3.5 ${playingAudio === 'word' ? 'animate-bounce' : ''}`} />
          <span>{playingAudio === 'word' ? 'Speaking…' : 'Hear Word 🔊'}</span>
        </button>

        <button
          type="button"
          onClick={handlePlayHint}
          disabled={isTransitioning}
          data-testid="listen-hint-button"
          aria-label="Hear the phonics hint"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/50 disabled:opacity-60 disabled:cursor-not-allowed ${
            playingAudio === 'hint'
              ? 'bg-[#D49300] text-white border-[#D49300] shadow-xs animate-pulse'
              : 'bg-white text-[#B37400] border-[#D7EEF1] hover:bg-[#FEF9E6] hover:border-[#FFC857] active:scale-95'
          }`}
        >
          <Lightbulb className={`w-3.5 h-3.5 ${playingAudio === 'hint' ? 'animate-bounce text-white' : 'text-[#D49300]'}`} />
          <span>{playingAudio === 'hint' ? 'Listening…' : 'Hear Hint 💡'}</span>
        </button>
      </div>

      {/* Non-blocking friendly audio error message */}
      {audioError && (
        <div
          role="status"
          className="mb-3 text-xs font-semibold text-amber-600 flex items-center justify-center gap-1.5 animate-fadeIn"
        >
          <AlertCircle className="w-3.5 h-3.5 inline shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Question Prompt */}
      <p
        className="text-xs text-[#527080] font-semibold mb-4"
        data-testid="missing-letter-prompt"
      >
        Which letter is missing? Tap to complete!
      </p>

      {/* Candidate Letter Options */}
      <div className="flex gap-4 justify-center flex-wrap mb-4" role="group" aria-label="Letter choices">
        {displayedOptions.map((opt, optIndex) => {
          const isSelected = selectedOption === opt;
          const isLetterAudioPlaying = playingAudio === opt;

          return (
            <div key={`${opt}-${optIndex}`} className="flex flex-col items-center gap-1.5">
              {/* Primary Letter Selection Button */}
              <button
                type="button"
                onClick={() => handleSelectAnswer(opt)}
                disabled={isSelectionDisabled}
                aria-disabled={isSelectionDisabled}
                aria-pressed={isSelected}
                aria-label={opt}
                data-testid={`letter-option-${opt}`}
                className={`w-14 h-14 bg-white border-2 rounded-2xl font-display font-black text-2xl text-[#08233A] transition-all shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#13CFE3]/50 select-none ${
                  isSelected
                    ? 'border-[#08233A] bg-[#E6F8FA] scale-95 shadow-inner ring-2 ring-[#08233A]'
                    : isSelectionDisabled
                    ? 'opacity-60 cursor-not-allowed border-[#D7EEF1]'
                    : 'border-[#D7EEF1] hover:border-[#13CFE3] hover:bg-[#E6F8FA] hover:scale-105 active:scale-95 cursor-pointer'
                }`}
              >
                {opt}
              </button>

              {/* Per-Letter Sound Listen Control */}
              <button
                type="button"
                onClick={(e) => handlePlayLetterSound(opt, e)}
                disabled={isTransitioning}
                data-testid={`letter-audio-button-${opt}`}
                aria-label={`Listen to letter sound ${opt}`}
                title={`Listen to letter sound "${opt}"`}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#13CFE3] disabled:opacity-60 disabled:cursor-not-allowed ${
                  isLetterAudioPlaying
                    ? 'bg-[#13CFE3] text-[#08233A] border-[#13CFE3]'
                    : 'bg-white text-[#527080] border-[#D7EEF1] hover:text-[#0899AA] hover:bg-[#E6F8FA]'
                }`}
              >
                <Volume2 className={`w-3 h-3 ${isLetterAudioPlaying ? 'animate-pulse text-[#08233A]' : ''}`} />
                <span>Sound</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
