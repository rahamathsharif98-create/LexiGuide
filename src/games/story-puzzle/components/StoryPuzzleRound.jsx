/**
 * StoryPuzzleRound.jsx
 *
 * Dedicated interactive gameplay round for Story Puzzle:
 * - Runtime Shuffling:
 *     - Guaranteed to display cards in an order that differs from round.correctOrder.
 *     - Card order remains stable during active attempts (memorized per round).
 * - Multi-Step Selection:
 *     - Numbered step badges: Step 1, Step 2, Step 3.
 *     - Direct Deselect: Clicking the most recently selected card deselects it.
 *     - Explicit "Undo Last" button removes the latest card placed.
 *     - Explicit "Start Over" button resets all cards on the current attempt.
 * - Input Safety & Duplicate Protection:
 *     - Synchronous ref locks prevent rapid double-clicks from duplicating selections or submissions.
 *     - All cards disable immediately once submission is triggered or during transition.
 * - Accessibility:
 *     - ARIA attributes: aria-pressed, aria-label with step placement context, aria-live region.
 *     - Visible focus indicators (focus-visible:ring-4).
 *     - Responsive layout supporting both mobile touch targets and desktop keyboards.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { shuffleStoryCards, validateStoryOrder } from '../engine/storyPuzzleCurriculum';
import { audioAtmosphere } from '../../../services/audioAtmosphereService';

export default function StoryPuzzleRound({
  round,
  roundIdx = 0,
  onAnswer,
  isTransitioning = false,
  quietMode = false,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [announcement, setAnnouncement] = useState('');

  const isSubmittedRef = useRef(false);
  const prevRoundIdRef = useRef(round?.id ?? roundIdx);

  // Runtime shuffle: recomputed only when the round actually changes
  const displayedCards = useMemo(() => {
    return shuffleStoryCards(round);
  }, [round?.id ?? roundIdx]);

  // Reset state synchronously when advancing to a new round
  if (prevRoundIdRef.current !== (round?.id ?? roundIdx)) {
    prevRoundIdRef.current = round?.id ?? roundIdx;
    isSubmittedRef.current = false;
    setSelectedIds([]);
    setAnnouncement('');
  }

  // When transition completes (e.g. after incorrect retry), unlock submission and reset selection
  useEffect(() => {
    if (!isTransitioning) {
      isSubmittedRef.current = false;
      setSelectedIds([]);
    }
  }, [isTransitioning]);

  const handleCardClick = (item) => {
    if (isSubmittedRef.current || isTransitioning) return;

    const isAlreadySelected = selectedIds.includes(item.id);

    if (isAlreadySelected) {
      // If clicking the most recently selected card, deselect it
      if (selectedIds[selectedIds.length - 1] === item.id) {
        setSelectedIds((prev) => prev.slice(0, -1));
        setAnnouncement(`Deselected ${item.label}.`);
        try {
          if (!quietMode) audioAtmosphere?.playChime?.(520, 0.05);
        } catch {}
      }
      return;
    }

    try {
      if (!quietMode) audioAtmosphere?.playChime?.(640, 0.08);
    } catch {}

    const nextSelected = [...selectedIds, item.id];
    setSelectedIds(nextSelected);
    setAnnouncement(`Selected ${item.label} as Step ${nextSelected.length}.`);

    const expectedLength = round?.correctOrder?.length ?? 3;
    if (nextSelected.length === expectedLength) {
      isSubmittedRef.current = true;
      const isMatch = validateStoryOrder(round, nextSelected).isCorrect;
      setAnnouncement(
        isMatch
          ? `Great job! You placed all ${expectedLength} steps in the correct order!`
          : `That was a good try! Let's review the steps and try again.`
      );
      onAnswer(isMatch);
    }
  };

  const handleUndo = () => {
    if (isSubmittedRef.current || isTransitioning || selectedIds.length === 0) return;
    const removedId = selectedIds[selectedIds.length - 1];
    const removedItem = displayedCards.find((c) => c.id === removedId);
    setSelectedIds((prev) => prev.slice(0, -1));
    setAnnouncement(`Undid step ${selectedIds.length}: ${removedItem?.label || 'card'}.`);
    try {
      if (!quietMode) audioAtmosphere?.playChime?.(480, 0.06);
    } catch {}
  };

  const handleReset = () => {
    if (isSubmittedRef.current || isTransitioning || selectedIds.length === 0) return;
    setSelectedIds([]);
    setAnnouncement('Cleared card selections. Tap your first card again.');
    try {
      if (!quietMode) audioAtmosphere?.playChime?.(440, 0.06);
    } catch {}
  };

  return (
    <div className="text-center" data-testid="story-puzzle-round">
      {/* Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>

      <h3 className="font-display font-black text-lg text-[#08233A] mb-1">
        {round?.title}
      </h3>
      <p className="text-xs text-[#527080] font-semibold mb-2">
        {round?.prompt}
      </p>
      <p className="text-[11px] text-[#0899AA] font-bold mb-4 bg-[#E6F8FA] inline-block px-3 py-1 rounded-full border border-[#BCEBF2]">
        Tap cards in order: 1st, 2nd, and 3rd!
      </p>

      {/* 3 Story Cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5 max-w-lg mx-auto"
        role="group"
        aria-label="Story sequence cards"
      >
        {displayedCards.map((item) => {
          const isPicked = selectedIds.includes(item.id);
          const stepIndex = isPicked ? selectedIds.indexOf(item.id) + 1 : null;
          const isLastPicked = isPicked && selectedIds[selectedIds.length - 1] === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCardClick(item)}
              disabled={isSubmittedRef.current || isTransitioning}
              aria-pressed={isPicked}
              aria-label={
                isPicked
                  ? isLastPicked
                    ? `${item.label} — placed as Step ${stepIndex}. Tap to deselect.`
                    : `${item.label} — placed as Step ${stepIndex}.`
                  : `Card: ${item.label}. Tap to place as Step ${selectedIds.length + 1}`
              }
              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all min-h-[110px] select-none focus-visible:ring-4 focus-visible:ring-[#13CFE3] focus-visible:outline-none ${
                isPicked
                  ? 'bg-[#DDF9FC] border-[#13CFE3] shadow-inner scale-[0.98]'
                  : 'bg-white border-[#D7EEF1] hover:border-[#13CFE3] hover:shadow-md hover:scale-[1.02] cursor-pointer'
              } ${isSubmittedRef.current || isTransitioning ? 'opacity-80' : ''}`}
              data-testid={`story-card-${item.id}`}
            >
              <span className="text-4xl mb-1.5" role="img" aria-hidden="true">
                {item.emoji}
              </span>
              <span className="text-xs font-bold text-[#08233A] leading-tight text-center">
                {item.label}
              </span>
              {isPicked ? (
                <span
                  className="mt-2 text-[11px] font-black bg-[#13CFE3] text-[#08233A] px-2.5 py-0.5 rounded-full shadow-2xs"
                  data-testid={`step-badge-${item.id}`}
                >
                  Step {stepIndex}
                </span>
              ) : (
                <span className="mt-2 text-[10px] font-bold text-[#8FA5B0]">
                  Tap to place
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Interactive Controls: Undo & Reset */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleUndo}
          disabled={isSubmittedRef.current || isTransitioning || selectedIds.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#D7EEF1] hover:border-[#13CFE3] text-[#08233A] font-display font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F2FCFD] min-h-[44px] focus-visible:ring-4 focus-visible:ring-[#13CFE3] focus-visible:outline-none"
          aria-label="Undo last card"
          data-testid="story-undo-button"
        >
          <RotateCcw size={14} className="text-[#0899AA]" />
          <span>Undo Last</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmittedRef.current || isTransitioning || selectedIds.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#D7EEF1] hover:border-slate-300 text-slate-600 font-display font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 min-h-[44px] focus-visible:ring-4 focus-visible:ring-slate-300 focus-visible:outline-none"
          aria-label="Reset all selected cards"
          data-testid="story-reset-button"
        >
          <X size={14} className="text-slate-400" />
          <span>Start Over</span>
        </button>
      </div>
    </div>
  );
}
