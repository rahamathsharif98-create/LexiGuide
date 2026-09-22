// gameBridge (gameIntegrationService): the single seam between this standalone
// game and a future host application (LexiGuide).
//
// In standalone mode every function below reads/writes local storage.
// When integrating into LexiGuide, replace the bodies of these functions with
// real API calls — the function signatures and return shapes should stay the
// same so the rest of the game never needs to change. See INTEGRATION_GUIDE.md.

import { storageService } from '../storage/storageService';
import { mergeNewlyUnlocked } from '../../learning/progress/achievements';

let currentSession = null;
let currentStudentId = null;
let hostSessionHandler = null;

export function setHostStudentId(studentId) {
  currentStudentId = studentId;
}

export function setHostSessionHandler(handler) {
  hostSessionHandler = handler;
}

/**
 * Call once when a game run begins.
 * @param {{ studentId?: string|null, worldId: string, characterId: string, difficulty: number }} params
 */
export function startGameSession({ studentId = null, worldId, characterId, difficulty }) {
  currentSession = {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    studentId: studentId ?? currentStudentId, // injects the host student ID if available
    worldId,
    characterId,
    difficulty,
    startedAt: Date.now(),
    events: [],
  };
  recordLearningEvent('game_started', { worldId, characterId, difficulty });
  return currentSession;
}

/**
 * Record a single learning/gameplay event. Consumed later by LexiGuide's
 * Reading Fingerprint / analytics backend.
 * @param {string} eventType
 * @param {object} payload
 */
export function recordLearningEvent(eventType, payload = {}) {
  if (!currentSession) return null;
  const event = {
    type: eventType,
    timestamp: Date.now(),
    sessionId: currentSession.sessionId,
    difficulty: currentSession.difficulty,
    ...payload,
  };
  currentSession.events.push(event);
  return event;
}

/**
 * Call once when a run ends (game over or manual exit).
 * @param {object} result - a gameSessionResult-shaped object (see below).
 * @returns {object} the finalized session result, persisted locally.
 */
export function completeGameSession(result) {
  if (!currentSession) return null;
  const duration = Math.round((Date.now() - currentSession.startedAt) / 1000);

  const finalResult = {
    studentId: currentSession.studentId,
    sessionId: currentSession.sessionId,
    worldId: currentSession.worldId,
    characterId: currentSession.characterId,
    distance: result.distance ?? 0,
    lettersCollected: result.lettersCollected ?? [],
    wordsCompleted: result.wordsCompleted ?? [],
    challengesCompleted: result.challengesCompleted ?? 0,
    challengesCorrect: result.challengesCorrect ?? 0,
    starsEarned: result.starsEarned ?? 0,
    difficultLetters: result.difficultLetters ?? [],
    observedPatterns: result.observedPatterns ?? {},
    duration,
    events: currentSession.events,
  };

  recordLearningEvent('game_completed', { distance: finalResult.distance, starsEarned: finalResult.starsEarned });

  // Standalone persistence: append to local run history (capped at 20 runs)
  // and roll the run into cumulative totals / learning progress / achievements.
  storageService.updateSave((save) => {
    const runHistory = [finalResult, ...(save.runHistory || [])].slice(0, 20);

    const lettersLearned = { ...save.learningProgress.lettersLearned };
    finalResult.lettersCollected.forEach((l) => {
      lettersLearned[l] = (lettersLearned[l] || 0) + 1;
    });

    const wordsCompleted = Array.from(new Set([...(save.learningProgress.wordsCompleted || []), ...finalResult.wordsCompleted]));

    const totals = {
      runsCompleted: (save.totals?.runsCompleted || 0) + 1,
      lettersCollected: (save.totals?.lettersCollected || 0) + finalResult.lettersCollected.length,
      wordsCompleted: wordsCompleted.length,
      bestCheckpointsInRun: Math.max(save.totals?.bestCheckpointsInRun || 0, result.checkpointsReached || 0),
    };

    const nextSave = {
      ...save,
      bestDistance: Math.max(save.bestDistance || 0, finalResult.distance),
      stars: (save.stars || 0) + finalResult.starsEarned,
      runHistory,
      totals,
      learningProgress: { ...save.learningProgress, lettersLearned, wordsCompleted },
    };

    const { unlockedIds } = mergeNewlyUnlocked(nextSave);
    nextSave.achievements = unlockedIds;
    return nextSave;
  });

  if (typeof hostSessionHandler === 'function') {
    try {
      hostSessionHandler(finalResult);
    } catch (err) {
      console.warn('LexiGuide hostSessionHandler error:', err);
    }
  }

  currentSession = null;
  return finalResult;
}

/** Returns current cumulative progress (standalone: from local save). */
export function getGameProgress() {
  const save = storageService.loadSave();
  return {
    stars: save.stars,
    bestDistance: save.bestDistance,
    achievements: save.achievements,
    unlockedWorlds: save.unlockedWorlds,
    learningProgress: save.learningProgress,
    runHistory: save.runHistory,
  };
}

export function getCurrentSession() {
  return currentSession;
}

export const gameBridge = {
  setHostStudentId,
  setHostSessionHandler,
  startGameSession,
  recordLearningEvent,
  completeGameSession,
  getGameProgress,
  getCurrentSession,
};

export default gameBridge;
