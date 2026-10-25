/**
 * cosmicSafariCheckpoint.js
 *
 * Child-specific progress persistence and checkpoint resume engine for
 * Cosmic Safari (Sound Safari / Match Sound).
 *
 * Follows the proven LexiGuide pattern (as used in Space Sound Mission, Word Train, and Voxel Crafter):
 * - Isolates saves strictly per childId (with safe guest fallback).
 * - Stores minimal essential resumable state (roundIndex, score, highestUnlockedLevel, isCompleted).
 * - Validates stored data defensively to prevent corruption or out-of-range state.
 * - Guarantees that completed runs cannot accidentally resume as unfinished.
 * - Resets cleanly on Play Again or explicit fresh start.
 */

import { TOTAL_COSMIC_SAFARI_LEVELS } from './cosmicSafariCurriculum';

export const COSMIC_SAFARI_STORAGE_PREFIX = 'lexiguide_cosmic_safari_checkpoint_';

/**
 * Generates an isolated storage key per child.
 */
export function getCosmicSafariCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? String(childId) : 'guest';
  return `${COSMIC_SAFARI_STORAGE_PREFIX}${safeId}`;
}

/**
 * Loads, validates, and sanitizes checkpoint data for a specific child.
 * Missing, malformed, out-of-range, or completed checkpoints return fresh run state.
 */
export function loadCosmicSafariCheckpointData(childId, maxRounds = TOTAL_COSMIC_SAFARI_LEVELS) {
  const defaultState = {
    roundIndex: 0,
    savedRoundIndex: 0,
    currentLevel: 1,
    highestUnlockedLevel: 1,
    highestUnlockedIndex: 0,
    score: 0,
    isCompleted: false,
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultState;
  }

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_COSMIC_SAFARI_LEVELS;

  try {
    const raw = window.localStorage.getItem(getCosmicSafariCheckpointKey(childId));
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
          roundIndex: num,
          savedRoundIndex: num,
          currentLevel: num + 1,
          highestUnlockedLevel: num + 1,
          highestUnlockedIndex: num,
          score: num,
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

    const rawRoundIndex = Number(
      parsed.roundIndex ??
      parsed.savedRoundIndex ??
      parsed.levelIndex ??
      parsed.savedLevelIndex ??
      parsed.index ??
      (parsed.currentLevel != null ? parsed.currentLevel - 1 : NaN)
    );

    // If out-of-range, start fresh
    if (!Number.isInteger(rawRoundIndex) || rawRoundIndex < 0 || rawRoundIndex >= limit) {
      return defaultState;
    }

    const rawScore = Number(parsed.score);
    const validScore = Number.isFinite(rawScore) && rawScore >= 0 ? Math.floor(rawScore) : 0;

    const rawHighest = Number(
      parsed.highestUnlockedLevel ??
      (parsed.highestUnlockedIndex != null ? parsed.highestUnlockedIndex + 1 : NaN)
    );
    const validHighestLevel = Number.isInteger(rawHighest) && rawHighest >= 1
      ? Math.min(Math.max(rawHighest, rawRoundIndex + 1), limit)
      : Math.min(rawRoundIndex + 1, limit);

    return {
      roundIndex: rawRoundIndex,
      savedRoundIndex: rawRoundIndex,
      currentLevel: rawRoundIndex + 1,
      highestUnlockedLevel: validHighestLevel,
      highestUnlockedIndex: validHighestLevel - 1,
      score: validScore,
      isCompleted: false,
    };
  } catch {
    return defaultState;
  }
}

/**
 * Returns the sanitized 0-based round index to resume, or 0 if none.
 */
export function loadCosmicSafariCheckpoint(childId, maxRounds = TOTAL_COSMIC_SAFARI_LEVELS) {
  return loadCosmicSafariCheckpointData(childId, maxRounds).roundIndex;
}

/**
 * Saves checkpoint progress safely for a specific child.
 */
export function saveCosmicSafariCheckpoint(childId, data, maxRounds = TOTAL_COSMIC_SAFARI_LEVELS) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_COSMIC_SAFARI_LEVELS;

  try {
    const existing = loadCosmicSafariCheckpointData(childId, limit);

    let roundIndex = existing.roundIndex;
    let score = existing.score;
    let isCompleted = false;

    if (typeof data === 'number') {
      roundIndex = data;
    } else if (data && typeof data === 'object') {
      if (data.roundIndex !== undefined) roundIndex = Number(data.roundIndex);
      else if (data.levelIndex !== undefined) roundIndex = Number(data.levelIndex);
      else if (data.currentLevel !== undefined) roundIndex = Number(data.currentLevel) - 1;

      if (data.score !== undefined) {
        const s = Number(data.score);
        if (Number.isFinite(s) && s >= 0) score = Math.floor(s);
      }

      if (data.isCompleted === true) {
        isCompleted = true;
      }
    }

    if (!Number.isInteger(roundIndex) || roundIndex < 0) {
      roundIndex = 0;
    }

    if (roundIndex >= limit) {
      roundIndex = limit - 1;
      isCompleted = true;
    }

    const currentLevel = Math.min(roundIndex + 1, limit);
    const highestUnlockedLevel = Math.max(
      existing.highestUnlockedLevel || 1,
      currentLevel
    );

    const payload = {
      roundIndex,
      savedRoundIndex: roundIndex,
      currentLevel,
      highestUnlockedLevel,
      highestUnlockedIndex: highestUnlockedLevel - 1,
      score,
      isCompleted,
      updatedAt: Date.now(),
    };

    window.localStorage.setItem(
      getCosmicSafariCheckpointKey(childId),
      JSON.stringify(payload)
    );

    return payload;
  } catch {
    return null;
  }
}

/**
 * Resets checkpoint data for a specific child to Level 1.
 */
export function resetCosmicSafariCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const payload = {
      roundIndex: 0,
      savedRoundIndex: 0,
      currentLevel: 1,
      highestUnlockedLevel: 1,
      highestUnlockedIndex: 0,
      score: 0,
      isCompleted: false,
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(
      getCosmicSafariCheckpointKey(childId),
      JSON.stringify(payload)
    );
  } catch {}
}

/**
 * Clears checkpoint completely from localStorage.
 */
export function clearCosmicSafariCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(getCosmicSafariCheckpointKey(childId));
  } catch {}
}
