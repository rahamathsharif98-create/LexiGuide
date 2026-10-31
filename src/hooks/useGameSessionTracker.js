import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

function useSafeApp() {
  try {
    return useApp();
  } catch {
    return {
      activeChild: null,
      saveLearningSession: async () => {},
      applySessionOutcome: () => {},
      showToast: () => {},
      isRealBackend: false,
    };
  }
}

/**
 * useGameSessionTracker
 * Connects any educational game (2D or 3D) to LexiGuide's Learning Analysis Pipeline.
 * 
 * Captures:
 * - Accuracy & Score
 * - Stars & XP gains
 * - Duration & Attempts
 * - Skill normalization & Reading Fingerprint updating
 * - Seamless backend persistence via saveLearningSession()
 */
export function useGameSessionTracker({ gameId, gameTitle, skill, initialTarget = 5 }) {
  const { saveLearningSession, applySessionOutcome, showToast, isRealBackend } = useSafeApp();

  const startTimeRef = useRef(Date.now());
  const [roundsAttempted, setRoundsAttempted] = useState(0);
  const [roundsCorrect, setRoundsCorrect] = useState(0);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [accumulatedStars, setAccumulatedStars] = useState(0);
  const [accumulatedXp, setAccumulatedXp] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [retriesCount, setRetriesCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  const recordAttempt = useCallback((isCorrect, options = {}) => {
    const { roundScore = 100, starsEarned = 1, xpEarned = 15, hintUsed = false, retry = false } = options;
    setRoundsAttempted((prev) => prev + 1);
    if (hintUsed) setHintsUsed((prev) => prev + 1);
    if (retry) setRetriesCount((prev) => prev + 1);
    if (isCorrect) {
      setRoundsCorrect((prev) => prev + 1);
      setAccumulatedScore((prev) => prev + roundScore);
      setAccumulatedStars((prev) => prev + starsEarned);
      setAccumulatedXp((prev) => prev + xpEarned);
    }
  }, []);

  const saveCompletedSession = useCallback(async (overrides = {}) => {
    // Synchronous ref guard — prevents duplicate saves across rapid calls in the same render
    if (isSaving || isSavingRef.current) return null;
    isSavingRef.current = true;
    setIsSaving(true);

    const totalAttempted = overrides.roundsAttempted ?? roundsAttempted;
    const totalCorrect = overrides.roundsCorrect ?? roundsCorrect;

    // Check if there is an explicit completion or explicit reward/accuracy override
    const hasExplicitCompletion = (
      overrides.isCompleted === true ||
      overrides.completed === true ||
      (overrides.stars != null && overrides.stars > 0) ||
      overrides.accuracy != null
    );

    // SCENARIO D: If user navigated away with 0 attempts made and no explicit completion,
    // do NOT record false completed activity or inflate progress.
    if (totalAttempted === 0 && !hasExplicitCompletion) {
      isSavingRef.current = false;
      setIsSaving(false);
      return null;
    }

    const durationSeconds = Math.max(5, Math.round((Date.now() - startTimeRef.current) / 1000));
    const isCompleted = overrides.isCompleted ?? (
      overrides.completed === true ||
      (overrides.stars != null && overrides.stars > 0) ||
      totalAttempted >= initialTarget
    );

    // Calculate real empirical accuracy percentage
    let accuracy = 0;
    if (totalAttempted > 0) {
      accuracy = Math.round((totalCorrect / totalAttempted) * 100);
    } else if (overrides.accuracy != null) {
      accuracy = Math.round(overrides.accuracy);
    }

    const totalHints = overrides.hintsUsed ?? hintsUsed;
    const totalRetries = overrides.retriesCount ?? retriesCount;
    const supportLevel = totalHints > 0 ? 'assisted' : 'independent';

    const stars = isCompleted ? (overrides.stars ?? Math.max(1, accumulatedStars)) : 0;
    const xp = isCompleted ? (overrides.xp ?? Math.max(15, accumulatedXp)) : Math.min(accumulatedXp, 10);
    const score = overrides.score ?? accumulatedScore;

    const outcome = {
      type: 'game',
      gameId,
      title: gameTitle,
      skill,
      score,
      accuracy,
      duration: durationSeconds,
      roundsAttempted: totalAttempted,
      roundsCorrect: totalCorrect,
      hintsUsed: totalHints,
      retriesCount: totalRetries,
      is_completed: isCompleted,
      completion_status: isCompleted ? 'completed' : 'incomplete',
      support_level: supportLevel,
      starsGain: stars,
      xpGain: xp,
      metrics: {
        accuracy,
        roundsAttempted: totalAttempted,
        roundsCorrect: totalCorrect,
        hintsUsed: totalHints,
        retriesCount: totalRetries,
        supportLevel,
        durationSeconds,
        isCompleted,
      },
      details: overrides.details || {},
      _savedToBackend: isRealBackend,
    };

    try {
      if (typeof saveLearningSession === 'function') {
        await saveLearningSession({
          activity_id: gameId,
          skill,
          outcome,
          stars,
          xp,
        });
      } else if (typeof applySessionOutcome === 'function') {
        applySessionOutcome(outcome);
      }

      if (isCompleted && typeof showToast === 'function') {
        showToast(`Great practice in ${gameTitle}! +${stars} Stars & +${xp} XP!`, 'success');
      }
      return outcome;
    } catch (err) {
      console.error('[useGameSessionTracker] Failed to save session for ' + gameId + ':', err);
      return null;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [
    isSaving,
    roundsAttempted,
    roundsCorrect,
    accumulatedStars,
    accumulatedXp,
    accumulatedScore,
    hintsUsed,
    retriesCount,
    initialTarget,
    gameId,
    gameTitle,
    skill,
    isRealBackend,
    saveLearningSession,
    applySessionOutcome,
    showToast,
  ]);

  return {
    recordAttempt,
    saveCompletedSession,
    isSaving,
    stats: {
      roundsAttempted,
      roundsCorrect,
      score: accumulatedScore,
      stars: accumulatedStars,
      xp: accumulatedXp,
      hintsUsed,
      retriesCount,
    },
  };
}
