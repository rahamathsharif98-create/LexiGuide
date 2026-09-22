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
  const [isSaving, setIsSaving] = useState(false);

  const recordAttempt = useCallback((isCorrect, options = {}) => {
    const { roundScore = 100, starsEarned = 1, xpEarned = 15 } = options;
    setRoundsAttempted((prev) => prev + 1);
    if (isCorrect) {
      setRoundsCorrect((prev) => prev + 1);
      setAccumulatedScore((prev) => prev + roundScore);
      setAccumulatedStars((prev) => prev + starsEarned);
      setAccumulatedXp((prev) => prev + xpEarned);
    }
  }, []);

  const saveCompletedSession = useCallback(async (overrides = {}) => {
    if (isSaving) return;
    setIsSaving(true);

    const durationSeconds = Math.max(15, Math.round((Date.now() - startTimeRef.current) / 1000));
    const totalAttempted = overrides.roundsAttempted ?? roundsAttempted;
    const totalCorrect = overrides.roundsCorrect ?? roundsCorrect;

    // Calculate real empirical accuracy percentage
    let accuracy = 90;
    if (totalAttempted > 0) {
      accuracy = Math.round((totalCorrect / totalAttempted) * 100);
    } else if (overrides.accuracy != null) {
      accuracy = Math.round(overrides.accuracy);
    }

    const stars = overrides.stars ?? Math.max(1, accumulatedStars);
    const xp = overrides.xp ?? Math.max(15, accumulatedXp);
    const score = overrides.score ?? Math.max(100, accumulatedScore);

    const outcome = {
      type: 'game',
      gameId,
      title: gameTitle,
      skill,
      score,
      accuracy,
      duration: durationSeconds,
      starsGain: stars,
      xpGain: xp,
      metrics: {
        accuracy,
        roundsAttempted: totalAttempted,
        roundsCorrect: totalCorrect,
        durationSeconds,
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

      if (typeof showToast === 'function') {
        showToast('Great practice in ' + gameTitle + '! +' + stars + ' Stars & +' + xp + ' XP!', 'success');
      }
    } catch (err) {
      console.error('[useGameSessionTracker] Failed to save session for ' + gameId + ':', err);
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    roundsAttempted,
    roundsCorrect,
    accumulatedStars,
    accumulatedXp,
    accumulatedScore,
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
    },
  };
}
