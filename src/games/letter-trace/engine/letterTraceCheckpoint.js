/**
 * letterTraceCheckpoint.js
 *
 * Child-specific progress persistence and checkpoint resume engine for
 * Letter Trace (Trace & Say).
 *
 * Follows the proven LexiGuide pattern (as used in Voxel Crafter, Sky Archer, and Space Sound Mission):
 * - Isolates saves strictly per childId (with safe guest fallback).
 * - Stores minimal essential resumable state (levelIndex, levelsCompleted, score, stars).
 * - Tracks highestUnlockedLevel across replayed stages.
 * - Validates stored data defensively to prevent corruption or out-of-range state.
 * - Guarantees that completed runs cannot accidentally resume as unfinished.
 * - Resets cleanly on restart or explicit fresh start.
 */

import { TOTAL_LETTER_TRACE_LEVELS } from './letterTraceCurriculum';

export const LETTER_TRACE_STORAGE_PREFIX = 'lexiguide_letter_trace_checkpoint_';

/**
 * Generates an isolated storage key per child.
 */
export function getLetterTraceCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? String(childId) : 'guest';
  return `${LETTER_TRACE_STORAGE_PREFIX}${safeId}`;
}

/**
 * Loads, validates, and sanitizes checkpoint data for a specific child.
 * Missing, malformed, out-of-range, or completed checkpoints return fresh run state.
 */
export function loadLetterTraceCheckpointData(childId, maxLevels = TOTAL_LETTER_TRACE_LEVELS) {
  const defaultState = {
    levelIndex: 0,
    savedLevelIndex: 0,
    currentLevel: 1,
    highestUnlockedLevel: 1,
    highestUnlockedIndex: 0,
    levelsCompleted: 0,
    score: 0,
    stars: 0,
    isCompleted: false,
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultState;
  }

  const limit = typeof maxLevels === 'number' && maxLevels > 0 ? maxLevels : TOTAL_LETTER_TRACE_LEVELS;

  try {
    const raw = window.localStorage.getItem(getLetterTraceCheckpointKey(childId));
    if (!raw) {
      return defaultState;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }

    // Legacy integer/string fallback (e.g. raw "2" or numeric payload)
    if (typeof parsed === 'number' || (typeof parsed === 'string' && /^\d+$/.test(parsed.trim()))) {
      const num = Number(parsed);
      if (Number.isInteger(num) && num >= 0 && num < limit) {
        return {
          levelIndex: num,
          savedLevelIndex: num,
          currentLevel: num + 1,
          highestUnlockedLevel: num + 1,
          highestUnlockedIndex: num,
          levelsCompleted: num,
          score: num * 100,
          stars: num,
          isCompleted: false,
        };
      }
      return defaultState;
    }

    if (!parsed || typeof parsed !== 'object') {
      return defaultState;
    }

    // A completed run must never resume as an unfinished run; start fresh
    if (parsed.isCompleted === true) {
      return defaultState;
    }

    const rawLevelIndex = Number(
      parsed.levelIndex ??
      parsed.savedLevelIndex ??
      parsed.letterIndex ??
      parsed.roundIndex ??
      (parsed.currentLevel != null ? parsed.currentLevel - 1 : NaN) ??
      parsed.index
    );

    // If negative or non-integer, return fresh default state
    if (!Number.isInteger(rawLevelIndex) || rawLevelIndex < 0) {
      return defaultState;
    }

    // Defensive progressive migration:
    // If rawLevelIndex exceeds current limit (e.g. curriculum length was reduced by excluding an inaccurate letter),
    // safely migrate by clamping to the new highest valid level without resetting the child's earned score or stars.
    const validLevelIndex = Math.min(rawLevelIndex, limit - 1);

    const rawHighestIdx = Number(
      parsed.highestUnlockedIndex ??
      (parsed.highestUnlockedLevel != null ? parsed.highestUnlockedLevel - 1 : rawLevelIndex)
    );
    const validHighestIdx = Number.isInteger(rawHighestIdx)
      ? Math.max(validLevelIndex, Math.min(rawHighestIdx, limit - 1))
      : validLevelIndex;

    const rawCompleted = Number(parsed.levelsCompleted ?? rawLevelIndex);
    const validCompleted = Number.isInteger(rawCompleted)
      ? Math.max(0, Math.min(rawCompleted, limit))
      : validLevelIndex;

    const rawScore = Number(parsed.score ?? 0);
    const validScore = Number.isFinite(rawScore) ? Math.max(0, Math.floor(rawScore)) : 0;

    const rawStars = Number(parsed.stars ?? validCompleted);
    const validStars = Number.isFinite(rawStars) ? Math.max(0, Math.floor(rawStars)) : validCompleted;

    return {
      levelIndex: validLevelIndex,
      savedLevelIndex: validLevelIndex,
      currentLevel: validLevelIndex + 1,
      highestUnlockedLevel: validHighestIdx + 1,
      highestUnlockedIndex: validHighestIdx,
      levelsCompleted: validCompleted,
      score: validScore,
      stars: validStars,
      isCompleted: false,
    };
  } catch {
    return defaultState;
  }
}

/**
 * Loads the saved 0-based level index for the given child.
 */
export function loadLetterTraceCheckpoint(childId, maxLevels = TOTAL_LETTER_TRACE_LEVELS) {
  return loadLetterTraceCheckpointData(childId, maxLevels).levelIndex;
}

/**
 * Persists child checkpoint progress to browser storage safely.
 */
export function saveLetterTraceCheckpoint(childId, data, maxLevels = TOTAL_LETTER_TRACE_LEVELS) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!data || typeof data !== 'object') return;

  const limit = typeof maxLevels === 'number' && maxLevels > 0 ? maxLevels : TOTAL_LETTER_TRACE_LEVELS;

  try {
    const isCompleted = Boolean(data.isCompleted);
    const prev = loadLetterTraceCheckpointData(childId, limit);

    if (isCompleted) {
      // Completed run payload: marked completed so next launch starts fresh
      window.localStorage.setItem(
        getLetterTraceCheckpointKey(childId),
        JSON.stringify({
          levelIndex: 0,
          savedLevelIndex: 0,
          currentLevel: 1,
          highestUnlockedLevel: limit,
          highestUnlockedIndex: limit - 1,
          levelsCompleted: limit,
          score: Math.max(0, Math.floor(Number(data.score) || 0)),
          stars: Math.max(0, Math.floor(Number(data.stars) || 0)),
          isCompleted: true,
          updatedAt: Date.now(),
        })
      );
      return;
    }

    const rawLevel = Number(data.levelIndex ?? data.letterIndex ?? 0);
    const validLevel = Number.isInteger(rawLevel)
      ? Math.max(0, Math.min(rawLevel, limit - 1))
      : 0;

    const highestIdx = Math.max(prev.highestUnlockedIndex, validLevel);

    const rawCompleted = Number(data.levelsCompleted ?? validLevel);
    const validCompleted = Number.isInteger(rawCompleted)
      ? Math.max(0, Math.min(rawCompleted, limit - 1))
      : validLevel;

    const rawScore = Number(data.score ?? 0);
    const validScore = Number.isFinite(rawScore) && rawScore >= 0 ? Math.floor(rawScore) : 0;

    const rawStars = Number(data.stars ?? validCompleted);
    const validStars = Number.isFinite(rawStars) && rawStars >= 0 ? Math.floor(rawStars) : validCompleted;

    window.localStorage.setItem(
      getLetterTraceCheckpointKey(childId),
      JSON.stringify({
        levelIndex: validLevel,
        savedLevelIndex: validLevel,
        currentLevel: validLevel + 1,
        highestUnlockedLevel: highestIdx + 1,
        highestUnlockedIndex: highestIdx,
        levelsCompleted: validCompleted,
        score: validScore,
        stars: validStars,
        isCompleted: false,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[LetterTraceCheckpoint] Failed to save checkpoint:', err);
  }
}

/**
 * Resets child checkpoint cleanly back to Level 1.
 */
export function resetLetterTraceCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      getLetterTraceCheckpointKey(childId),
      JSON.stringify({
        levelIndex: 0,
        savedLevelIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: 1,
        highestUnlockedIndex: 0,
        levelsCompleted: 0,
        score: 0,
        stars: 0,
        isCompleted: false,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[LetterTraceCheckpoint] Failed to reset checkpoint:', err);
  }
}

/**
 * Completely clears stored checkpoint from localStorage.
 */
export function clearLetterTraceCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(getLetterTraceCheckpointKey(childId));
  } catch (err) {
    console.warn('[LetterTraceCheckpoint] Failed to clear checkpoint:', err);
  }
}
