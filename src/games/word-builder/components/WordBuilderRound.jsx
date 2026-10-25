/**
 * WordBuilderRound.jsx
 *
 * Dedicated interactive gameplay round component for Word Builder:
 * - Round presentation: Clue image emoji, prompt, empty answer slots, scrambled letter tiles, and audio controls.
 * - Unique Tile Identity & Duplicate Letter Safety:
 *     - Tracks selections by tile array index (`selectedTileIndices`), ensuring duplicate letters (BELL, TREE, MOON, BOOK) operate as independent tiles.
 *     - Selected tiles are disabled immediately to prevent reusing the same physical tile.
 * - Undo & Deselect:
 *     - Explicit "Undo Letter" button removes the most recently placed letter.
 *     - Tapping any filled answer slot removes that specific letter.
 * - Submission & Transition Guards:
 *     - Synchronous `isAnswerSubmittedRef` ref lock prevents duplicate submissions from rapid taps.
 *     - Locks interaction during round feedback transitions (`isTransitioning`).
 * - Phonics & Word Audio:
 *     - Child-controlled "Hear Word" and "Phonics Clue" buttons via `wordBuilderAudio`.
 *     - ZERO autoplay on render. Graceful fallback on unsupported speech environments.
 * - Accessibility:
 *     - High-contrast states, descriptive aria-labels, semantic buttons, focus rings, and an ARIA live region (`aria-live="polite"`).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, Volume2, Lightbulb, AlertCircle } from 'lucide-react';
import wordBuilderAudio from '../engine/wordBuilderAudio';
import { getWordBuilderDisplayedLetters } from '../engine/wordBuilderCurriculum';
import { audioAtmosphere } from '../../../services/audioAtmosphereService';

export default function WordBuilderRound({
  round,
  roundIdx = 0,
  builtWord = [],
  setBuiltWord,
  onAnswer,
  isTransitioning = false,
  quietMode = false,
  theme = {},
}) {
  const target = round?.word || '';
  const [selectedTileIndices, setSelectedTileIndices] = useState([]);
  const [playingAudio, setPlayingAudio] = useState(null); // 'word' | 'hint' | null
  const [audioError, setAudioError] = useState(null);
  const [announcement, setAnnouncement] = useState('');

  const isAnswerSubmittedRef = useRef(false);
  const prevRoundRef = useRef(round?.id ?? roundIdx);

  // Stable, level-specific letters array: preserves exact multiset and doesn't change on re-render
  const displayedLetters = useMemo(
    () => getWordBuilderDisplayedLetters(round),
    [round?.id, round?.level, round?.letters, round?.word]
  );

  // Synchronously reset submission lock and audio when round changes
  if (prevRoundRef.current !== (round?.id ?? roundIdx)) {
    prevRoundRef.current = round?.id ?? roundIdx;
    isAnswerSubmittedRef.current = false;
    setSelectedTileIndices([]);
    setPlayingAudio(null);
    setAudioError(null);
    setAnnouncement('');
    wordBuilderAudio.stopSpeech();
    if (setBuiltWord) {
      setBuiltWord([]);
    }
  }

  // Synchronize when builtWord is reset externally (e.g. on round restart)
  useEffect(() => {
    if (builtWord.length === 0 && selectedTileIndices.length > 0) {
      setSelectedTileIndices([]);
      isAnswerSubmittedRef.current = false;
    }
  }, [builtWord.length]);

  // Reset submission lock when round transition finishes
  useEffect(() => {
    if (!isTransitioning) {
      isAnswerSubmittedRef.current = false;
    }
  }, [isTransitioning]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      wordBuilderAudio.stopSpeech();
    };
  }, []);

  // Handle placing a letter tile
  const handleLetter = (letter, tileIdx) => {
    if (isAnswerSubmittedRef.current || isTransitioning) return;
    if (selectedTileIndices.includes(tileIdx)) return;
    if (selectedTileIndices.length >= target.length) return;

    try {
      audioAtmosphere?.playChime?.(580 + selectedTileIndices.length * 50, 0.08);
    } catch {}

    const nextIndices = [...selectedTileIndices, tileIdx];
    setSelectedTileIndices(nextIndices);

    const nextLetters = nextIndices.map((i) => displayedLetters[i]);
    if (setBuiltWord) {
      setBuiltWord(nextLetters);
    }

    setAnnouncement(`Letter ${letter} placed. Slot ${nextIndices.length} of ${target.length}.`);

    if (nextLetters.length === target.length) {
      isAnswerSubmittedRef.current = true;
      const isCorrect = nextLetters.join('') === target;
      if (isCorrect) {
        setAnnouncement(`Spelled ${target} correctly!`);
      } else {
        setAnnouncement(`Spelled ${nextLetters.join('')}. Trying again.`);
      }
      onAnswer(isCorrect);
    }
  };

  // Handle undoing a letter (from slot tap or explicit undo button)
  const handleUndo = (slotIdx) => {
    if (isAnswerSubmittedRef.current || isTransitioning) return;
    if (selectedTileIndices.length === 0) return;

    const targetSlot = typeof slotIdx === 'number' ? slotIdx : selectedTileIndices.length - 1;
    if (targetSlot < 0 || targetSlot >= selectedTileIndices.length) return;

    try {
      audioAtmosphere?.playChime?.(440, 0.06);
    } catch {}

    const removedIndex = selectedTileIndices[targetSlot];
    const removedLetter = displayedLetters[removedIndex];

    const nextIndices = selectedTileIndices.filter((_, idx) => idx !== targetSlot);
    setSelectedTileIndices(nextIndices);

    const nextLetters = nextIndices.map((i) => displayedLetters[i]);
    if (setBuiltWord) {
      setBuiltWord(nextLetters);
    }

    setAnnouncement(`Removed letter ${removedLetter}. ${nextIndices.length} of ${target.length} letters placed.`);
  };

  // User-initiated target word playback
  const handlePlayWord = (e) => {
    if (e) e.stopPropagation();
    if (isTransitioning || !target) return;

    setAudioError(null);
    setPlayingAudio('word');

    const spoken = wordBuilderAudio.speakWord(target, {
      onStart: () => setPlayingAudio('word'),
      onEnd: () => setPlayingAudio(null),
      onError: () => {
        setPlayingAudio(null);
        setAudioError('Word audio unavailable. You can still play!');
      },
    });

    if (!spoken && !wordBuilderAudio.isSupported()) {
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

    const spoken = wordBuilderAudio.speakPhonicsHint(round, {
      onStart: () => setPlayingAudio('hint'),
      onEnd: () => setPlayingAudio(null),
      onError: () => {
        setPlayingAudio(null);
        setAudioError('Phonics audio unavailable. You can still play!');
      },
    });

    if (!spoken && !wordBuilderAudio.isSupported()) {
      setPlayingAudio(null);
      setAudioError('Phonics audio unavailable. You can still play!');
    }
  };

  const isComplete = selectedTileIndices.length === target.length;
  const isLongWord = target.length > 5;
  const slotSizeClass = isLongWord
    ? 'w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-xl'
    : 'w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl';

  return (
    <div className="text-center w-full max-w-lg mx-auto" data-testid="word-builder-round">
      {/* Screen reader live announcement */}
      <div className="sr-only" role="status" aria-live="polite" data-testid="aria-live-status">
        {announcement}
      </div>

      {/* Word Clue Emoji */}
      <div
        className="text-7xl mb-2 select-none animate-float"
        aria-label={`Clue picture: ${target}`}
        role="img"
        data-testid="word-clue-emoji"
      >
        {round?.image}
      </div>

      {/* Prompt */}
      <p className="text-xs sm:text-sm text-[#527080] font-bold mb-3 px-2">
        {round?.prompt || 'Look at the picture and tap the letters in the right order to build the word.'}
      </p>

      {/* User-Controlled Audio Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <button
          type="button"
          onClick={handlePlayWord}
          disabled={isTransitioning}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-display font-extrabold text-xs transition-all border shadow-2xs select-none cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#13CFE3] ${
            playingAudio === 'word'
              ? 'bg-[#13CFE3] text-[#08233A] border-[#0899AA] scale-105'
              : 'bg-white hover:bg-[#E6F8FA] text-[#08233A] border-[#D7EEF1] hover:border-[#13CFE3]'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label={`Hear word ${target}`}
          data-testid="word-builder-hear-word-btn"
        >
          <Volume2 size={15} className={playingAudio === 'word' ? 'animate-bounce text-[#08233A]' : 'text-[#0899AA]'} />
          <span>{playingAudio === 'word' ? 'Speaking…' : 'Hear Word'}</span>
        </button>

        <button
          type="button"
          onClick={handlePlayHint}
          disabled={isTransitioning}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-display font-extrabold text-xs transition-all border shadow-2xs select-none cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-400 ${
            playingAudio === 'hint'
              ? 'bg-[#FFF9E6] text-[#B87D00] border-[#FFC857] scale-105'
              : 'bg-white hover:bg-[#FFF9E6] text-slate-700 border-slate-200 hover:border-amber-300'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          aria-label="Hear phonics clue"
          data-testid="word-builder-hear-hint-btn"
        >
          <Lightbulb size={15} className={playingAudio === 'hint' ? 'animate-bounce text-[#FFC857]' : 'text-amber-500'} />
          <span>{playingAudio === 'hint' ? 'Playing Clue…' : 'Phonics Clue'}</span>
        </button>
      </div>

      {audioError && (
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3 shadow-2xs"
          role="status"
          data-testid="audio-error-banner"
        >
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Answer Slots Track (Responsive Slots, Tappable for Undo) */}
      <div
        className="flex justify-center items-center gap-2 mb-4 flex-wrap max-w-full px-1 min-h-[3.5rem]"
        data-testid="word-builder-slots-track"
        role="region"
        aria-label="Word answer slots"
      >
        {target.split('').map((_, i) => {
          const tileIndex = selectedTileIndices[i];
          const hasLetter = tileIndex !== undefined;
          const letter = hasLetter ? displayedLetters[tileIndex] : '';

          return (
            <button
              key={`slot-${i}`}
              type="button"
              onClick={() => hasLetter && handleUndo(i)}
              disabled={!hasLetter || isAnswerSubmittedRef.current || isTransitioning}
              className={`${slotSizeClass} rounded-2xl border-2 flex items-center justify-center font-display font-black transition-all shadow-2xs shrink-0 select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#13CFE3] ${
                hasLetter
                  ? 'bg-[#DDF9FC] border-[#13CFE3] text-[#08233A] hover:border-rose-400 hover:bg-rose-50 cursor-pointer active:scale-95'
                  : 'bg-[#F2FBFC] border-[#D7EEF1] text-[#08233A]/40 cursor-default'
              } disabled:cursor-not-allowed`}
              aria-label={
                hasLetter
                  ? `Letter slot ${i + 1}: ${letter}. Tap to remove.`
                  : `Empty letter slot ${i + 1} of ${target.length}`
              }
              data-testid={`slot-${i}`}
            >
              {letter || '—'}
            </button>
          );
        })}
      </div>

      {/* Scrambled Letter Tiles Dock */}
      <div
        className="flex gap-2.5 sm:gap-3 justify-center flex-wrap mb-4 max-w-full px-2"
        data-testid="scrambled-tiles-dock"
        role="group"
        aria-label="Available letter tiles"
      >
        {displayedLetters.map((l, i) => {
          const isUsed = selectedTileIndices.includes(i);
          return (
            <button
              key={`tile-${l}-${i}`}
              type="button"
              onClick={() => handleLetter(l, i)}
              disabled={isUsed || isComplete || isAnswerSubmittedRef.current || isTransitioning}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl font-display font-black text-2xl transition-all shadow-xs select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#13CFE3] ${
                isUsed
                  ? 'bg-slate-100 border-2 border-slate-200 text-slate-300 opacity-40 cursor-not-allowed scale-95'
                  : 'bg-white hover:bg-[#E6F8FA] border-2 border-[#D7EEF1] hover:border-[#13CFE3] text-[#08233A] hover:scale-105 active:scale-95 cursor-pointer'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              aria-label={`Letter ${l}`}
              aria-disabled={isUsed || isComplete || isAnswerSubmittedRef.current || isTransitioning}
              data-testid={`tile-${l}-${i}`}
            >
              {l}
            </button>
          );
        })}
      </div>

      {/* Action Row: Child-Friendly Undo Button */}
      <div className="flex justify-center items-center gap-2">
        <button
          type="button"
          onClick={() => handleUndo()}
          disabled={selectedTileIndices.length === 0 || isAnswerSubmittedRef.current || isTransitioning}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-300 font-display font-bold text-xs transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer active:scale-95 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-400"
          aria-label="Undo letter"
          data-testid="undo-letter-button"
        >
          <RotateCcw size={14} className="text-slate-500" />
          <span>Undo Letter</span>
        </button>
      </div>
    </div>
  );
}
