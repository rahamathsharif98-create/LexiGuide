/**
 * soundHuntCheckpoint.js
 *
 * Child-specific progress persistence and checkpoint resume engine for
 * Space Sound Mission (Sound Hunt).
 *
 * Follows the proven LexiGuide pattern (as used in Word Train and Voxel Crafter):
 * - Isolates saves strictly per childId (with safe guest fallback).
 * - Stores minimal essential resumable state (roundIndex, score, stars, isCompleted).
 * - Validates stored data defensively to prevent corruption or out-of-range state.
 * - Guarantees that completed runs cannot accidentally resume as unfinished.
 * - Resets cleanly on Play Again or explicit fresh start.
 */

import { TOTAL_SOUND_HUNT_LEVELS } from './soundHuntCurriculum';

export const SOUND_HUNT_STORAGE_PREFIX = 'lexiguide_sound_hunt_checkpoint_';

/**
 * Generates an isolated storage key per child.
 */
export function getSoundHuntCheckpointKey(childId) {
  const safeId = childId !== undefined && childId !== null && childId !== '' ? String(childId) : 'guest';
  return `${SOUND_HUNT_STORAGE_PREFIX}${safeId}`;
}

/**
 * Loads, validates, and sanitizes checkpoint data for a specific child.
 * Missing, malformed, out-of-range, or completed checkpoints return fresh run state.
 */
export function loadSoundHuntCheckpointData(childId, maxRounds = TOTAL_SOUND_HUNT_LEVELS) {
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

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_SOUND_HUNT_LEVELS;

  try {
    const raw = window.localStorage.getItem(getSoundHuntCheckpointKey(childId));
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

    const rawHighestIdx = Number(
      parsed.highestUnlockedIndex ??
      (parsed.highestUnlockedLevel != null ? parsed.highestUnlockedLevel - 1 : rawRoundIndex)
    );
    const validHighestIdx = Number.isInteger(rawHighestIdx)
      ? Math.max(rawRoundIndex, Math.min(rawHighestIdx, limit - 1))
      : rawRoundIndex;

    const rawScore = Number(parsed.score ?? 0);
    const validScore = Number.isFinite(rawScore) ? Math.max(0, Math.floor(rawScore)) : 0;

    return {
      roundIndex: rawRoundIndex,
      savedRoundIndex: rawRoundIndex,
      currentLevel: rawRoundIndex + 1,
      highestUnlockedLevel: validHighestIdx + 1,
      highestUnlockedIndex: validHighestIdx,
      score: validScore,
      isCompleted: false,
    };
  } catch {
    return defaultState;
  }
}

/**
 * Loads the saved 0-based round index for the given child.
 * Returns 0 if missing, completed, or out of range.
 */
export function loadSoundHuntCheckpoint(childId, maxRounds = TOTAL_SOUND_HUNT_LEVELS) {
  return loadSoundHuntCheckpointData(childId, maxRounds).roundIndex;
}

/**
 * Persists child checkpoint progress to browser storage safely.
 */
export function saveSoundHuntCheckpoint(childId, data, maxRounds = TOTAL_SOUND_HUNT_LEVELS) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!data || typeof data !== 'object') return;

  const limit = typeof maxRounds === 'number' && maxRounds > 0 ? maxRounds : TOTAL_SOUND_HUNT_LEVELS;

  try {
    const isCompleted = Boolean(data.isCompleted);
    const prev = loadSoundHuntCheckpointData(childId, limit);

    if (isCompleted) {
      // Completed run payload: marked completed so next launch starts fresh
      window.localStorage.setItem(
        getSoundHuntCheckpointKey(childId),
        JSON.stringify({
          roundIndex: 0,
          savedRoundIndex: 0,
          currentLevel: 1,
          highestUnlockedLevel: limit,
          highestUnlockedIndex: limit - 1,
          score: Math.max(0, Math.floor(Number(data.score) || 0)),
          isCompleted: true,
          updatedAt: Date.now(),
        })
      );
      return;
    }

    const rawRound = Number(data.roundIndex ?? data.levelIndex ?? 0);
    const validRound = Number.isInteger(rawRound)
      ? Math.max(0, Math.min(rawRound, limit - 1))
      : 0;

    const highestIdx = Math.max(prev.highestUnlockedIndex, validRound);

    const rawScore = Number(data.score ?? 0);
    const validScore = Number.isFinite(rawScore) ? Math.max(0, Math.floor(rawScore)) : 0;

    window.localStorage.setItem(
      getSoundHuntCheckpointKey(childId),
      JSON.stringify({
        roundIndex: validRound,
        savedRoundIndex: validRound,
        currentLevel: validRound + 1,
        highestUnlockedLevel: highestIdx + 1,
        highestUnlockedIndex: highestIdx,
        score: validScore,
        isCompleted: false,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[SoundHunt] Failed to save checkpoint:', err);
  }
}

/**
 * Resets the checkpoint for a child back to round 0 (e.g. on Play Again or explicit restart).
 */
export function resetSoundHuntCheckpoint(childId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      getSoundHuntCheckpointKey(childId),
      JSON.stringify({
        roundIndex: 0,
        savedRoundIndex: 0,
        currentLevel: 1,
        highestUnlockedLevel: 1,
        highestUnlockedIndex: 0,
        score: 0,
        isCompleted: false,
        updatedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn('[SoundHunt] Failed to reset checkpoint:', err);
  }
}
